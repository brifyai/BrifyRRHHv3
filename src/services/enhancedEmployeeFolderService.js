import { supabase } from '../lib/supabaseClient.js';
import organizedDatabaseService from './organizedDatabaseService.js';
import { hybridGoogleDrive } from '../lib/hybridGoogleDrive.js';
 
 // Helper para validar UUID y evitar errores "invalid input syntax for type uuid"
 const isValidUUID = (value) => {
   if (typeof value !== 'string') value = String(value || '');
   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
   return uuidRegex.test(value);
 };
 
 // Normalización de errores de Supabase/PostgREST para diagnóstico
 const normalizeSupabaseError = (err) => {
   try {
     if (!err) return 'Error desconocido';
     if (typeof err === 'string') return err;
     if (err.message) return err.message;
     if (err.error_description) return err.error_description;
     if (err.statusText) return `${err.status} ${err.statusText}`;
     return JSON.stringify(err);
   } catch {
     return 'Error desconocido';
   }
 };
 
 // Detectar error típico de esquema faltante (relación no existe)
 const isRelationMissingError = (err) => {
   try {
     const msg = (err?.message || err?.hint || '').toLowerCase();
     return err?.code === '42P01' || (msg.includes('relation') && msg.includes('does not exist'));
   } catch {
     return false;
   }
 };
 
 // Detectar error de RLS (row-level security)
 const isRlsDeniedError = (err) => {
   try {
     const msg = (err?.message || '').toLowerCase();
     return msg.includes('row-level security') || msg.includes('violates row-level security policy');
   } catch {
     return false;
   }
 };
 
 class EnhancedEmployeeFolderService {
   constructor() {
     this.initialized = false;
     this.hybridDriveInitialized = false;
     // Exponer el cliente para componentes que lo usan directamente (p.ej. EmployeeFolderManager)
     this.supabase = supabase;
   }

  // Inicializar el servicio
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Verificar conexión con Supabase (no bloquear si falla por RLS/Accept)
      const { error } = await supabase.from('employee_folders').select('count').limit(1);
      if (error) {
        console.warn('⚠️ Verificación rápida de employee_folders falló (continuamos):', error.message || error);
      }
      
      // Inicializar Hybrid Google Drive
      await this.initializeHybridDrive();
      
      this.initialized = true;
      console.log('✅ EnhancedEmployeeFolderService inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando EnhancedEmployeeFolderService:', error);
      return false;
    }
  }

  // Inicializar Hybrid Google Drive
  async initializeHybridDrive() {
    if (this.hybridDriveInitialized) return true;
    
    try {
      const success = await hybridGoogleDrive.initialize();
      if (success) {
        this.hybridDriveInitialized = true;
        const serviceInfo = hybridGoogleDrive.getServiceInfo();
        console.log(`✅ ${serviceInfo.service} inicializado para carpetas de empleados`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error inicializando Hybrid Drive:', error);
      return false;
    }
  }

  // Crear carpetas para todos los empleados existentes
  async createFoldersForAllEmployees() {
    try {
      console.log('🚀 Iniciando creación de carpetas para todos los empleados...');
      
      // Obtener todos los empleados
      const employees = await organizedDatabaseService.getEmployees();
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const errors = [];
      let schemaSuspect = false;
      let rlsDenied = false;
      let usingLocalStorage = false;
 
      for (const employee of employees) {
        if (!employee.email) {
          console.warn(`⚠️ Empleado sin email: ${employee.name}`);
          continue;
        }
 
        try {
          const result = await this.createEmployeeFolder(employee.email, employee);
          if (result.created) {
            createdCount++;
          } else if (result.updated) {
            updatedCount++;
          }
          if (result.usingLocalStorage) {
            usingLocalStorage = true;
          }
          // Log abreviado para alto volumen
          if ((createdCount + updatedCount) % 50 === 0) {
            console.log(`✅ Procesadas ${createdCount + updatedCount} carpetas...`);
          }
        } catch (error) {
          errorCount++;
          const msg = normalizeSupabaseError(error);
          if (isRelationMissingError(error)) schemaSuspect = true;
          if (isRlsDeniedError(error)) rlsDenied = true;
          errors.push(`${employee.email}: ${msg}`);
          // Registrar cada 25 errores para no saturar
          if (errorCount <= 10 || errorCount % 25 === 0) {
            console.error(`❌ Error procesando carpeta para ${employee.email}:`, error);
          }
        }
      }
 
      console.log(`📊 Resumen: ${createdCount} creadas, ${updatedCount} actualizadas, ${errorCount} errores`);
      if (usingLocalStorage) {
        console.log('💾 Usando almacenamiento local como fallback');
      }
      return { createdCount, updatedCount, errorCount, sampleErrors: errors.slice(0, 10), schemaSuspect, rlsDenied, usingLocalStorage };
    } catch (error) {
      console.error('❌ Error creando carpetas para todos los empleados:', error);
      throw error;
    }
  }

  // Crear o actualizar carpeta de empleado
  async createEmployeeFolder(employeeEmail, employeeData) {
    try {
      await this.initialize();

      // Obtener información de la empresa
      let companyName = 'Empresa no especificada';
      let companyId = null;
      
      if (employeeData.company_id) {
        const companies = await organizedDatabaseService.getCompanies();
        const company = companies.find(comp => comp.id === employeeData.company_id);
        if (company) {
          companyName = company.name;
        }
        // Guardar company_id solo si es un UUID válido (evita errores 400/invalid input syntax)
        companyId = isValidUUID(employeeData.company_id) ? String(employeeData.company_id) : null;
      }

      const folderData = {
        employee_email: employeeEmail,
        employee_id: employeeData.id,
        employee_name: employeeData.name,
        employee_position: employeeData.position,
        employee_department: employeeData.department,
        employee_phone: employeeData.phone,
        employee_region: employeeData.region,
        employee_level: employeeData.level,
        employee_work_mode: employeeData.work_mode,
        employee_contract_type: employeeData.contract_type,
        company_id: companyId,
        company_name: companyName,
        settings: {
          notificationPreferences: {
            whatsapp: true,
            telegram: true,
            email: true
          },
          responseLanguage: 'es',
          timezone: 'America/Santiago'
        }
      };

      let driveFolderId = null;
      let driveFolderUrl = null;

      // Crear carpeta en Hybrid Drive si está inicializado y autenticado (en caso de Drive real)
      const serviceInfo = this.hybridDriveInitialized ? hybridGoogleDrive.getServiceInfo() : null;
      const isAuth = serviceInfo?.isReal
        ? (hybridGoogleDrive.isAuthenticated ? hybridGoogleDrive.isAuthenticated() : false)
        : this.hybridDriveInitialized;
      const canUseDrive = this.hybridDriveInitialized && isAuth;

      if (canUseDrive) {
        try {
          const driveFolder = await this.createDriveFolder(employeeEmail, employeeData.name, companyName);
          if (driveFolder && driveFolder.id) {
            driveFolderId = driveFolder.id;
            
            // Crear URL según el servicio
            if (serviceInfo.isReal) {
              driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolder.id}`;
            } else {
              driveFolderUrl = `#local-folder-${driveFolder.id}`;
            }
           
            // Compartir carpeta con el empleado
            await this.shareDriveFolder(driveFolder.id, employeeEmail);
          }
        } catch (driveError) {
          console.warn(`⚠️ No se pudo crear carpeta en Drive para ${employeeEmail}:`, driveError.message || driveError);
        }
      } else {
        console.warn(`⚠️ Omitiendo interacción con Drive para ${employeeEmail}: servicio no autenticado o no inicializado`);
      }

      folderData.drive_folder_id = driveFolderId;
      folderData.drive_folder_url = driveFolderUrl;

      // Intentar usar Supabase, con fallback a localStorage
      let usingLocalStorage = false;
      let existingFolder = null;

      try {
        // Verificar si ya existe la carpeta en Supabase
        const { data: existing, error: fetchError } = await supabase
          .from('employee_folders')
          .select('*')
          .eq('employee_email', employeeEmail)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // Si es error de RLS o tabla no encontrada, usar localStorage
          if (isRlsDeniedError(fetchError) || isRelationMissingError(fetchError)) {
            console.warn(`⚠️ Usando localStorage para ${employeeEmail} (Supabase no disponible)`);
            usingLocalStorage = true;
          } else {
            throw fetchError;
          }
        } else {
          existingFolder = existing;
        }
      } catch (error) {
        // Si falla completamente, usar localStorage
        console.warn(`⚠️ Fallback a localStorage para ${employeeEmail}:`, error.message);
        usingLocalStorage = true;
      }

      if (usingLocalStorage) {
        // Guardar en localStorage
        const storageKey = `employee_folder_${employeeEmail}`;
        const folderWithId = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...folderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(folderWithId));
        return { folder: folderWithId, created: true, updated: false, usingLocalStorage: true };
      }

      if (existingFolder) {
        // Actualizar carpeta existente
        const { data, error } = await supabase
          .from('employee_folders')
          .update({
            ...folderData,
            updated_at: new Date().toISOString()
          })
          .eq('employee_email', employeeEmail)
          .select()
          .maybeSingle();

        if (error) throw error;

        // Crear configuración de notificaciones si no existe
        await this.createNotificationSettingsIfNotExists(data.id);

        return { folder: data, updated: true, created: false, usingLocalStorage: false };
      } else {
        // Crear nueva carpeta
        const { data, error } = await supabase
          .from('employee_folders')
          .insert(folderData)
          .select()
          .maybeSingle();

        if (error) throw error;

        // Crear configuración de notificaciones
        await this.createNotificationSettings(data.id);

        return { folder: data, created: true, updated: false, usingLocalStorage: false };
      }
    } catch (error) {
      console.error(`❌ Error creando carpeta para empleado ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Crear carpeta en Hybrid Drive
  async createDriveFolder(employeeEmail, employeeName, companyName) {
    try {
      // Crear estructura de carpetas
      const parentFolderName = `${companyName}/Empleados`;
      
      // Buscar o crear carpeta principal de la empresa
      let parentFolder = await this.findOrCreateParentFolder(parentFolderName);
      
      // PRIMERO: Verificar si ya existe la carpeta en Drive
      const folderName = `${employeeName} (${employeeEmail})`;
      console.log(`🔍 Verificando si la carpeta ya existe en Drive: ${folderName}`);
      
      try {
        const existingFiles = await hybridGoogleDrive.listFiles(parentFolder.id);
        const existingDriveFolder = existingFiles.find(file =>
          file.name === folderName &&
          file.mimeType === 'application/vnd.google-apps.folder'
        );

        if (existingDriveFolder) {
          console.log(`✅ Carpeta ya existe en Drive: ${existingDriveFolder.id}`);
          return existingDriveFolder;
        }
      } catch (checkError) {
        console.warn(`⚠️ Error verificando carpeta existente en Drive: ${checkError.message}`);
      }
      
      // SEGUNDO: Si no existe, crear nueva carpeta
      console.log(`📁 Creando nueva carpeta en Drive: ${folderName}`);
      const employeeFolder = await hybridGoogleDrive.createFolder(folderName, parentFolder.id);
      
      return employeeFolder;
    } catch (error) {
      console.error(`❌ Error creando carpeta en Drive para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Buscar o crear carpeta principal de la empresa
  async findOrCreateParentFolder(folderName) {
    try {
      // Listar carpetas para buscar la carpeta principal
      const folders = await hybridGoogleDrive.listFiles();
      const parentFolder = folders.find(folder =>
        folder.name === folderName &&
        folder.mimeType === 'application/vnd.google-apps.folder'
      );

      if (parentFolder) {
        return parentFolder;
      } else {
        // Crear nueva carpeta principal
        return await hybridGoogleDrive.createFolder(folderName);
      }
    } catch (error) {
      console.error(`❌ Error buscando/creando carpeta principal ${folderName}:`, error);
      throw error;
    }
  }

  // Compartir carpeta de Drive con el empleado
  async shareDriveFolder(folderId, employeeEmail) {
    try {
      await hybridGoogleDrive.shareFolder(folderId, employeeEmail, 'writer');
      const serviceInfo = hybridGoogleDrive.getServiceInfo();
      console.log(`📤 Carpeta compartida con ${employeeEmail} en ${serviceInfo.service}`);
    } catch (error) {
      console.warn(`⚠️ No se pudo compartir carpeta con ${employeeEmail}:`, error.message);
    }
  }

  // Crear configuración de notificaciones
  async createNotificationSettings(folderId) {
    try {
      const { error } = await supabase
        .from('employee_notification_settings')
        .insert({
          folder_id: folderId,
          whatsapp_enabled: true,
          telegram_enabled: true,
          email_enabled: true,
          response_language: 'es',
          timezone: 'America/Santiago',
          notification_preferences: {
            whatsapp: true,
            telegram: true,
            email: true
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error(`❌ Error creando configuración de notificaciones:`, error);
      throw error;
    }
  }

  // Crear configuración de notificaciones si no existe
  async createNotificationSettingsIfNotExists(folderId) {
    try {
      const { data: existing } = await supabase
        .from('employee_notification_settings')
        .select('id')
        .eq('folder_id', folderId)
        .maybeSingle();

      if (!existing) {
        await this.createNotificationSettings(folderId);
      }
    } catch (error) {
      console.error(`❌ Error verificando configuración de notificaciones:`, error);
    }
  }

  // Obtener carpeta de empleado
  async getEmployeeFolder(employeeEmail) {
    try {
      await this.initialize();

      const { data, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe la carpeta, intentar crearla
          const employees = await organizedDatabaseService.getEmployees();
          const employee = employees.find(emp => emp.email === employeeEmail);
          
          if (employee) {
            const result = await this.createEmployeeFolder(employeeEmail, employee);
            return result.folder;
          }
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo carpeta para empleado ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Agregar documento a la carpeta del empleado
  async addEmployeeDocument(employeeEmail, document) {
    try {
      const folder = await this.getEmployeeFolder(employeeEmail);
      
      const documentData = {
        folder_id: folder.id,
        document_name: document.name || document.document_name,
        document_type: document.type || document.document_type,
        file_size: document.size || 0,
        google_file_id: document.google_file_id,
        local_file_path: document.local_file_path,
        file_url: document.file_url,
        description: document.description,
        tags: document.tags || [],
        metadata: document.metadata || {}
      };

      const { data, error } = await supabase
        .from('employee_documents')
        .insert(documentData)
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log(`📄 Documento agregado para ${employeeEmail}: ${documentData.document_name}`);
      return data;
    } catch (error) {
      console.error(`❌ Error agregando documento para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Agregar FAQ a la carpeta del empleado
  async addEmployeeFAQ(employeeEmail, question, answer, metadata = {}) {
    try {
      const folder = await this.getEmployeeFolder(employeeEmail);
      
      const faqData = {
        folder_id: folder.id,
        question,
        answer,
        keywords: metadata.keywords,
        category: metadata.category,
        priority: metadata.priority || 2,
        metadata: metadata.metadata || {}
      };

      const { data, error } = await supabase
        .from('employee_faqs')
        .insert(faqData)
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log(`❓ FAQ agregada para ${employeeEmail}: ${question}`);
      return data;
    } catch (error) {
      console.error(`❌ Error agregando FAQ para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Agregar mensaje al historial de conversación
  async addConversationMessage(employeeEmail, messageType, messageContent, channel = 'chat', metadata = {}) {
    try {
      const folder = await this.getEmployeeFolder(employeeEmail);
      
      const messageData = {
        folder_id: folder.id,
        message_type: messageType,
        message_content: messageContent,
        channel,
        metadata
      };

      const { data, error } = await supabase
        .from('employee_conversations')
        .insert(messageData)
        .select()
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`❌ Error agregando mensaje de conversación para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Obtener estadísticas de la carpeta del empleado
  async getEmployeeFolderStats(employeeEmail) {
    try {
      const folder = await this.getEmployeeFolder(employeeEmail);
      
      // Obtener conteos de cada tabla
      const [{ count: documentCount }, { count: faqCount }, { count: conversationCount }] = await Promise.all([
        supabase.from('employee_documents').select('*', { count: 'exact', head: true }).eq('folder_id', folder.id),
        supabase.from('employee_faqs').select('*', { count: 'exact', head: true }).eq('folder_id', folder.id),
        supabase.from('employee_conversations').select('*', { count: 'exact', head: true }).eq('folder_id', folder.id)
      ]);

      return {
        folder: folder,
        stats: {
          documents: documentCount || 0,
          faqs: faqCount || 0,
          conversations: conversationCount || 0,
          lastUpdated: folder.updated_at
        }
      };
    } catch (error) {
      console.error(`❌ Error obteniendo estadísticas para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Buscar en documentos del empleado
  async searchEmployeeDocuments(employeeEmail, query) {
    try {
      const folder = await this.getEmployeeFolder(employeeEmail);
      
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('folder_id', folder.id)
        .eq('status', 'active')
        .or(`document_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`❌ Error buscando documentos para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Obtener carpetas por empresa
  async getEmployeeFoldersByCompany(companyId) {
    try {
      const { data, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('company_id', companyId)
        .order('employee_name', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo carpetas para empresa ${companyId}:`, error);
      throw error;
    }
  }

  // Sincronizar carpeta con Hybrid Drive
  async syncFolderWithDrive(employeeEmail) {
    try {
      if (!this.hybridDriveInitialized) {
        throw new Error('Hybrid Drive no está inicializado');
      }

      const folder = await this.getEmployeeFolder(employeeEmail);
      const serviceInfo = hybridGoogleDrive.getServiceInfo();
      
      // Actualizar estado de sincronización
      await supabase
        .from('employee_folders')
        .update({
          folder_status: 'syncing',
          last_sync_at: new Date().toISOString(),
          sync_service: serviceInfo.service
        })
        .eq('id', folder.id);

      // Si es servicio local, no hay sincronización real necesaria
      if (!serviceInfo.isReal) {
        await supabase
          .from('employee_folders')
          .update({
            folder_status: 'active',
            sync_error: null,
            sync_service: serviceInfo.service
          })
          .eq('id', folder.id);

        console.log(`🔄 Carpeta sincronizada para ${employeeEmail} (${serviceInfo.service})`);
        return true;
      }
      
      // Aquí iría la lógica de sincronización real para Google Drive
      // Por ahora, solo actualizamos el estado
      
      await supabase
        .from('employee_folders')
        .update({
          folder_status: 'active',
          sync_error: null,
          sync_service: serviceInfo.service
        })
        .eq('id', folder.id);

      console.log(`🔄 Carpeta sincronizada para ${employeeEmail} (${serviceInfo.service})`);
      return true;
    } catch (error) {
      // Actualizar estado de error
      try {
        const folder = await this.getEmployeeFolder(employeeEmail);
        await supabase
          .from('employee_folders')
          .update({
            folder_status: 'error',
            sync_error: error.message
          })
          .eq('id', folder.id);
      } catch (updateError) {
        console.error('❌ Error actualizando estado de error:', updateError);
      }

      console.error(`❌ Error sincronizando carpeta para ${employeeEmail}:`, error);
      throw error;
    }
  }

  // Obtener estadísticas del servicio
  getServiceStats() {
    const serviceInfo = this.hybridDriveInitialized ? hybridGoogleDrive.getServiceInfo() : null;
    const driveStats = this.hybridDriveInitialized ? hybridGoogleDrive.getStats() : null;
    
    return {
      hybridDriveInitialized: this.hybridDriveInitialized,
      service: serviceInfo ? serviceInfo.service : 'No Inicializado',
      isReal: serviceInfo ? serviceInfo.isReal : false,
      driveStats: driveStats || null,
      features: {
        createFolders: true,
        uploadFiles: this.hybridDriveInitialized,
        shareFolders: this.hybridDriveInitialized,
        deleteFiles: this.hybridDriveInitialized,
        downloadFiles: this.hybridDriveInitialized,
        localStorage: !serviceInfo?.isReal
      }
    }
  }

  // Método para cambiar entre servicios (testing)
  async switchDriveService(useRealGoogleDrive) {
    if (this.hybridDriveInitialized) {
      const success = await hybridGoogleDrive.switchService(useRealGoogleDrive);
      if (success) {
        const serviceInfo = hybridGoogleDrive.getServiceInfo();
        console.log(`✅ Cambiado a ${serviceInfo.service}`);
      }
      return success;
    }
    return false;
  }

  // Limpiar almacenamiento local (solo para servicio local)
  clearLocalStorage() {
    if (this.hybridDriveInitialized) {
      hybridGoogleDrive.clearLocalStorage();
    }
  }
}

// Crear instancia singleton
const enhancedEmployeeFolderService = new EnhancedEmployeeFolderService();

export default enhancedEmployeeFolderService;