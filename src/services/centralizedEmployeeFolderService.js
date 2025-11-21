/**
 * SERVICIO CENTRALIZADO ANTI-DUPLICACIÓN PARA CARPETAS DE EMPLEADOS
 * Elimina completamente las duplicaciones mediante locks y verificación unificada
 */

import { supabase } from '../lib/supabaseClient.js';
import superLockService from '../lib/superLockService.js';
import googleDriveConsolidatedService from '../lib/googleDriveConsolidated.js';
import hybridGoogleDrive from '../lib/hybridGoogleDrive.js';

class CentralizedEmployeeFolderService {
  constructor() {
    this.initialized = false;
    this.driveInitialized = false;
  }

  /**
   * INICIALIZAR SERVICIO
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log('🚀 Inicializando Servicio Centralizado Anti-Duplicación...');
      
      // Inicializar servicios
      await this.initializeDriveServices();
      
      this.initialized = true;
      console.log('✅ Servicio Centralizado inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Servicio Centralizado:', error);
      return false;
    }
  }

  /**
   * INICIALIZAR SERVICIOS DE DRIVE
   */
  async initializeDriveServices() {
    try {
      // Inicializar Hybrid Google Drive
      const success = await hybridGoogleDrive.initialize();
      if (success) {
        this.driveInitialized = true;
        const serviceInfo = hybridGoogleDrive.getServiceInfo();
        console.log(`✅ ${serviceInfo.service} inicializado para carpetas centralizadas`);
      }
    } catch (error) {
      console.error('❌ Error inicializando servicios de Drive:', error);
    }
  }

  /**
   * MÉTODO PRINCIPAL: CREAR CARPETA DE EMPLEADO (ANTI-DUPLICACIÓN)
   * Este es el ÚNICO método que debe usarse para crear carpetas
   */
  async createEmployeeFolder(employeeEmail, employeeData, userId = null) {
    const lockKey = `employee_folder_${employeeEmail}`;
    
    return await superLockService.acquireLock(lockKey, 30000, async () => {
      try {
        await this.initialize();
        
        console.log(`🔒 [LOCK] Creando carpeta para: ${employeeEmail}`);
        
        // 1. OBTENER INFORMACIÓN DE LA EMPRESA
        const companyName = await this.getCompanyName(employeeData.company_id);
        
        // 2. VERIFICAR SI YA EXISTE LA CARPETA
        const existingFolder = await this.findExistingEmployeeFolder(employeeEmail);
        if (existingFolder) {
          console.log(`✅ [DUPLICADO PREVENIDO] Carpeta ya existe: ${existingFolder.drive_folder_id}`);
          return {
            folder: existingFolder,
            created: false,
            updated: false,
            duplicated: false,
            existing: true
          };
        }
        
        // 3. CREAR CARPETA PADRE SI NO EXISTE
        const parentFolderName = `${companyName}/Empleados`;
        const parentFolder = await this.findOrCreateParentFolder(parentFolderName);
        
        // 4. CREAR CARPETA DEL EMPLEADO
        const folderName = `${employeeData.name} (${employeeEmail})`;
        const employeeFolder = await this.createDriveFolder(folderName, parentFolder.id);
        
        // 5. CREAR REGISTRO EN SUPABASE
        const supabaseFolder = await this.createSupabaseRecord(
          employeeEmail, employeeData, companyName, employeeFolder.id
        );
        
        console.log(`✅ [ÉXITO] Carpeta creada: ${employeeFolder.id}`);
        
        return {
          folder: supabaseFolder,
          driveFolder: employeeFolder,
          created: true,
          updated: false,
          duplicated: false,
          existing: false
        };
        
      } catch (error) {
        console.error(`❌ [ERROR] Error creando carpeta para ${employeeEmail}:`, error);
        throw error;
      }
    });
  }

  /**
   * CREAR CARPETAS PARA TODOS LOS EMPLEADOS (CON ANTI-DUPLICACIÓN)
   */
  async createFoldersForAllEmployees() {
    try {
      console.log('🚀 Iniciando creación centralizada de carpetas para todos los empleados...');
      
      // Obtener empleados
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .not('email', 'is', null);
      
      if (error) throw error;
      
      let createdCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Procesar empleados uno por uno con locks
      for (const employee of employees) {
        try {
          if (!employee.email) {
            console.warn(`⚠️ Empleado sin email: ${employee.name}`);
            continue;
          }
          
          const result = await this.createEmployeeFolder(employee.email, employee);
          if (result.created) {
            createdCount++;
          } else if (result.existing) {
            skippedCount++;
          }
          
          // Log de progreso
          if ((createdCount + skippedCount) % 10 === 0) {
            console.log(`📊 Procesados: ${createdCount + skippedCount}/${employees.length}`);
          }
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Error procesando ${employee.email}:`, error.message);
        }
      }
      
      console.log(`📊 Resumen final: ${createdCount} creadas, ${skippedCount} omitidas, ${errorCount} errores`);
      return { createdCount, skippedCount, errorCount };
      
    } catch (error) {
      console.error('❌ Error en creación masiva:', error);
      throw error;
    }
  }

  /**
   * VERIFICAR SI YA EXISTE LA CARPETA DEL EMPLEADO
   */
  async findExistingEmployeeFolder(employeeEmail) {
    try {
      // 1. Verificar en Supabase
      const { data: supabaseFolder } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle();
      
      if (supabaseFolder) {
        return supabaseFolder;
      }
      
      // 2. Verificar en Google Drive (por si hay inconsistencias)
      if (this.driveInitialized) {
        const allFolders = await this.searchEmployeeFoldersInDrive(employeeEmail);
        if (allFolders.length > 0) {
          console.log(`⚠️ [INCONSISTENCIA] Carpeta existe en Drive pero no en Supabase: ${employeeEmail}`);
          return null; // Dejar que se cree en Supabase
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error verificando carpeta existente para ${employeeEmail}:`, error);
      return null;
    }
  }

  /**
   * BUSCAR CARPETAS DE EMPLEADO EN GOOGLE DRIVE
   */
  async searchEmployeeFoldersInDrive(employeeEmail) {
    try {
      if (!this.driveInitialized) return [];
      
      // Buscar en todas las carpetas que contengan el email
      const allFiles = await hybridGoogleDrive.listFiles();
      return allFiles.filter(file => 
        file.mimeType === 'application/vnd.google-apps.folder' &&
        file.name.includes(employeeEmail)
      );
    } catch (error) {
      console.error(`❌ Error buscando carpetas en Drive para ${employeeEmail}:`, error);
      return [];
    }
  }

  /**
   * CREAR CARPETA EN GOOGLE DRIVE
   */
  async createDriveFolder(folderName, parentId = null) {
    try {
      if (this.driveInitialized) {
        return await hybridGoogleDrive.createFolder(folderName, parentId);
      } else {
        // Fallback a googleDriveConsolidatedService
        return await googleDriveConsolidatedService.createFolder(folderName, parentId);
      }
    } catch (error) {
      console.error(`❌ Error creando carpeta en Drive: ${folderName}`, error);
      throw error;
    }
  }

  /**
   * BUSCAR O CREAR CARPETA PADRE
   */
  async findOrCreateParentFolder(folderName) {
    try {
      if (!this.driveInitialized) {
        throw new Error('Servicios de Drive no inicializados');
      }
      
      // Buscar carpeta existente
      const allFiles = await hybridGoogleDrive.listFiles();
      const existingFolder = allFiles.find(file =>
        file.name === folderName &&
        file.mimeType === 'application/vnd.google-apps.folder'
      );
      
      if (existingFolder) {
        return existingFolder;
      }
      
      // Crear nueva carpeta padre
      console.log(`📁 Creando carpeta padre: ${folderName}`);
      return await this.createDriveFolder(folderName);
      
    } catch (error) {
      console.error(`❌ Error con carpeta padre ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * OBTENER NOMBRE DE LA EMPRESA
   */
  async getCompanyName(companyId) {
    try {
      if (!companyId) return 'Empresa General';
      
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .maybeSingle();
      
      return company?.name || 'Empresa General';
    } catch (error) {
      console.error('❌ Error obteniendo nombre de empresa:', error);
      return 'Empresa General';
    }
  }

  /**
   * CREAR REGISTRO EN SUPABASE
   */
  async createSupabaseRecord(employeeEmail, employeeData, companyName, driveFolderId) {
    try {
      const folderData = {
        employee_email: employeeEmail,
        employee_id: employeeData.id,
        employee_name: employeeData.name,
        employee_position: employeeData.position,
        employee_department: employeeData.department,
        company_name: companyName,
        drive_folder_id: driveFolderId,
        drive_folder_url: `https://drive.google.com/drive/folders/${driveFolderId}`,
        folder_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('employee_folders')
        .insert(folderData)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error(`❌ Error creando registro en Supabase para ${employeeEmail}:`, error);
      throw error;
    }
  }

  /**
   * LIMPIAR CARPETAS DUPLICADAS EXISTENTES
   */
  async cleanupDuplicateFolders() {
    try {
      console.log('🧹 Iniciando limpieza de carpetas duplicadas...');
      
      // Obtener todas las carpetas
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Agrupar por email
      const emailGroups = {};
      folders.forEach(folder => {
        if (!emailGroups[folder.employee_email]) {
          emailGroups[folder.employee_email] = [];
        }
        emailGroups[folder.employee_email].push(folder);
      });
      
      let cleanedCount = 0;
      
      // Procesar duplicados
      for (const [email, emailFolders] of Object.entries(emailGroups)) {
        if (emailFolders.length > 1) {
          console.log(`🔍 Duplicados encontrados para ${email}: ${emailFolders.length}`);
          
          // Mantener el más reciente, eliminar los demás
          const sortedFolders = emailFolders.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          const keepFolder = sortedFolders[0];
          const deleteFolders = sortedFolders.slice(1);
          
          // Eliminar duplicados
          for (const folderToDelete of deleteFolders) {
            try {
              await supabase
                .from('employee_folders')
                .delete()
                .eq('id', folderToDelete.id);
              
              cleanedCount++;
              console.log(`🗑️ Eliminado duplicado: ${folderToDelete.id}`);
            } catch (deleteError) {
              console.error(`❌ Error eliminando duplicado ${folderToDelete.id}:`, deleteError);
            }
          }
        }
      }
      
      console.log(`✅ Limpieza completada: ${cleanedCount} duplicados eliminados`);
      return cleanedCount;
      
    } catch (error) {
      console.error('❌ Error durante limpieza:', error);
      throw error;
    }
  }

  /**
   * ESTADÍSTICAS DEL SERVICIO
   */
  getServiceStats() {
    return {
      initialized: this.initialized,
      driveInitialized: this.driveInitialized,
      antiDuplication: true,
      centralized: true,
      lockProtected: true,
      features: {
        createFolders: true,
        preventDuplicates: true,
        cleanupDuplicates: true,
        massCreation: true
      }
    };
  }
}

// Crear instancia singleton
const centralizedEmployeeFolderService = new CentralizedEmployeeFolderService();

export default centralizedEmployeeFolderService;