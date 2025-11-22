/**
 * Servicio de Auditoría Periódica para Google Drive
 * Detecta inconsistencias entre Supabase y Google Drive
 */

import { supabase } from './supabaseClient.js';
import googleDriveConsolidatedService from './googleDriveConsolidated.js';
import logger from './logger.js';

class DriveAuditService {
  constructor() {
    this.isRunning = false;
    this.auditInterval = null;
    this.auditIntervalMs = 60 * 60 * 1000; // 1 hora por defecto
    this.lastAuditTime = null;
    this.auditResults = [];
  }

  /**
   * Inicializa el servicio de auditoría
   */
  async initialize() {
    try {
      logger.info('DriveAuditService', '🔄 Inicializando servicio de auditoría...');
      
      // Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        logger.warn('DriveAuditService', '⚠️ Google Drive no está autenticado');
        return false;
      }
      
      // Obtener la última hora de auditoría
      await this.loadLastAuditTime();
      
      logger.info('DriveAuditService', '✅ Servicio de auditoría inicializado');
      return true;
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error inicializando: ${error.message}`);
      return false;
    }
  }

  /**
   * Inicia la auditoría periódica
   * @param {number} intervalMinutes - Intervalo en minutos (por defecto 60)
   */
  startPeriodicAudit(intervalMinutes = 60) {
    if (this.isRunning) {
      logger.info('DriveAuditService', 'ℹ️ Auditoría periódica ya está en ejecución');
      return;
    }
    
    this.auditIntervalMs = intervalMinutes * 60 * 1000;
    this.isRunning = true;
    
    logger.info('DriveAuditService', `⏰ Iniciando auditoría periódica (cada ${intervalMinutes} minutos)`);
    
    // Ejecutar auditoría inmediatamente
    this.runAudit();
    
    // Programar auditorías periódicas
    this.auditInterval = setInterval(() => {
      this.runAudit();
    }, this.auditIntervalMs);
  }

  /**
   * Detiene la auditoría periódica
   */
  stopPeriodicAudit() {
    if (!this.isRunning) {
      logger.info('DriveAuditService', 'ℹ️ Auditoría periódica no está en ejecución');
      return;
    }
    
    this.isRunning = false;
    
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
      this.auditInterval = null;
    }
    
    logger.info('DriveAuditService', '⏹️ Auditoría periódica detenida');
  }

  /**
   * Ejecuta una auditoría completa
   */
  async runAudit() {
    try {
      logger.info('DriveAuditService', '🔍 Iniciando auditoría completa...');
      
      // Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        throw new Error('Google Drive no está autenticado');
      }
      
      const auditStartTime = new Date();
      
      // 1. Auditoría de carpetas en Supabase vs Google Drive
      const supabaseVsDriveResults = await this.auditSupabaseVsDrive();
      
      // 2. Auditoría de carpetas en Google Drive vs Supabase
      const driveVsSupabaseResults = await this.auditDriveVsSupabase();
      
      // 3. Auditoría de permisos
      const permissionsResults = await this.auditPermissions();
      
      // 4. Compilar resultados
      const auditResults = {
        timestamp: auditStartTime.toISOString(),
        duration: new Date() - auditStartTime,
        supabaseVsDrive: supabaseVsDriveResults,
        driveVsSupabase: driveVsSupabaseResults,
        permissions: permissionsResults,
        summary: this.generateAuditSummary(supabaseVsDriveResults, driveVsSupabaseResults, permissionsResults)
      };
      
      // Guardar resultados
      this.auditResults.push(auditResults);
      
      // Mantener solo los últimos 10 resultados
      if (this.auditResults.length > 10) {
        this.auditResults = this.auditResults.slice(-10);
      }
      
      // Guardar en la base de datos
      await this.saveAuditResults(auditResults);
      
      // Actualizar última hora de auditoría
      this.lastAuditTime = auditStartTime;
      await this.saveLastAuditTime();
      
      // Log de resumen
      logger.info('DriveAuditService', `✅ Auditoría completada en ${auditResults.duration}ms`);
      logger.info('DriveAuditService', `📊 Resumen: ${auditResults.summary.totalIssues} problemas encontrados`);
      
      return auditResults;
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error en auditoría: ${error.message}`);
      throw error;
    }
  }

  /**
   * Audita carpetas en Supabase vs Google Drive
   */
  async auditSupabaseVsDrive() {
    try {
      logger.info('DriveAuditService', '🔍 Auditando carpetas en Supabase vs Google Drive...');
      
      // Obtener todas las carpetas de Supabase
      const { data: supabaseFolders, error: supabaseError } = await supabase
        .from('employee_folders')
        .select('*')
        .neq('folder_status', 'deleted');
      
      if (supabaseError) {
        throw new Error(`Error obteniendo carpetas de Supabase: ${supabaseError.message}`);
      }
      
      logger.info('DriveAuditService', `📊 ${supabaseFolders.length} carpetas encontradas en Supabase`);
      
      const results = {
        total: supabaseFolders.length,
        missingInDrive: [],
        inconsistencies: [],
        errors: []
      };
      
      // Verificar cada carpeta en Google Drive
      for (const folder of supabaseFolders) {
        try {
          if (!folder.drive_folder_id) {
            results.missingInDrive.push({
              supabaseId: folder.id,
              employeeEmail: folder.employee_email,
              employeeName: folder.employee_name,
              reason: 'No tiene drive_folder_id'
            });
            continue;
          }
          
          // Verificar si la carpeta existe en Google Drive
          const driveFolder = await googleDriveConsolidatedService.getFileInfo(folder.drive_folder_id);
          
          if (!driveFolder) {
            results.missingInDrive.push({
              supabaseId: folder.id,
              employeeEmail: folder.employee_email,
              employeeName: folder.employee_name,
              driveFolderId: folder.drive_folder_id,
              reason: 'Carpeta no existe en Google Drive'
            });
            continue;
          }
          
          // Verificar inconsistencias
          const inconsistencies = this.detectFolderInconsistencies(folder, driveFolder);
          if (inconsistencies.length > 0) {
            results.inconsistencies.push({
              supabaseId: folder.id,
              employeeEmail: folder.employee_email,
              employeeName: folder.employee_name,
              driveFolderId: folder.drive_folder_id,
              inconsistencies
            });
          }
        } catch (error) {
          results.errors.push({
            supabaseId: folder.id,
            employeeEmail: folder.employee_email,
            error: error.message
          });
        }
      }
      
      logger.info('DriveAuditService', `✅ Auditoría Supabase vs Drive completada: ${results.missingInDrive.length} faltantes, ${results.inconsistencies.length} inconsistencias, ${results.errors.length} errores`);
      
      return results;
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error en auditoría Supabase vs Drive: ${error.message}`);
      throw error;
    }
  }

  /**
   * Audita carpetas en Google Drive vs Supabase
   */
  async auditDriveVsSupabase() {
    try {
      logger.info('DriveAuditService', '🔍 Auditando carpetas en Google Drive vs Supabase...');
      
      // Obtener todas las carpetas de empleados en Google Drive
      const driveFolders = await this.getEmployeeFoldersFromDrive();
      
      logger.info('DriveAuditService', `📊 ${driveFolders.length} carpetas de empleados encontradas en Google Drive`);
      
      const results = {
        total: driveFolders.length,
        missingInSupabase: [],
        errors: []
      };
      
      // Verificar cada carpeta en Supabase
      for (const driveFolder of driveFolders) {
        try {
          // Extraer email del nombre de la carpeta
          const employeeEmail = this.extractEmailFromFolderName(driveFolder.name);
          
          if (!employeeEmail) {
            results.errors.push({
              driveFolderId: driveFolder.id,
              folderName: driveFolder.name,
              reason: 'No se pudo extraer email del nombre'
            });
            continue;
          }
          
          // Verificar si existe en Supabase
          const { data: supabaseFolder } = await supabase
            .from('employee_folders')
            .select('*')
            .eq('employee_email', employeeEmail)
            .maybeSingle();
          
          if (!supabaseFolder) {
            results.missingInSupabase.push({
              driveFolderId: driveFolder.id,
              folderName: driveFolder.name,
              employeeEmail,
              reason: 'No existe en Supabase'
            });
          } else if (supabaseFolder.drive_folder_id !== driveFolder.id) {
            results.missingInSupabase.push({
              driveFolderId: driveFolder.id,
              folderName: driveFolder.name,
              employeeEmail,
              supabaseId: supabaseFolder.id,
              reason: 'ID de carpeta diferente en Supabase'
            });
          }
        } catch (error) {
          results.errors.push({
            driveFolderId: driveFolder.id,
            folderName: driveFolder.name,
            error: error.message
          });
        }
      }
      
      logger.info('DriveAuditService', `✅ Auditoría Drive vs Supabase completada: ${results.missingInSupabase.length} faltantes, ${results.errors.length} errores`);
      
      return results;
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error en auditoría Drive vs Supabase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Audita permisos de carpetas
   */
  async auditPermissions() {
    try {
      logger.info('DriveAuditService', '🔍 Auditando permisos de carpetas...');
      
      // Obtener todas las carpetas de empleados
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .neq('folder_status', 'deleted');
      
      if (error) {
        throw new Error(`Error obteniendo carpetas: ${error.message}`);
      }
      
      const results = {
        total: folders.length,
        missingPermissions: [],
        errors: []
      };
      
      // Verificar permisos para cada carpeta
      for (const folder of folders) {
        try {
          if (!folder.drive_folder_id) {
            continue;
          }
          
          // Obtener permisos de la carpeta
          const permissions = await this.getFolderPermissions(folder.drive_folder_id);
          
          // Verificar si el empleado tiene permisos
          const employeePermission = permissions.find(p => p.emailAddress === folder.employee_email);
          
          if (!employeePermission) {
            results.missingPermissions.push({
              supabaseId: folder.id,
              employeeEmail: folder.employee_email,
              employeeName: folder.employee_name,
              driveFolderId: folder.drive_folder_id,
              reason: 'Empleado no tiene permisos en la carpeta'
            });
          }
        } catch (error) {
          results.errors.push({
            supabaseId: folder.id,
            employeeEmail: folder.employee_email,
            error: error.message
          });
        }
      }
      
      logger.info('DriveAuditService', `✅ Auditoría de permisos completada: ${results.missingPermissions.length} permisos faltantes, ${results.errors.length} errores`);
      
      return results;
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error en auditoría de permisos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detecta inconsistencias entre una carpeta en Supabase y Google Drive
   */
  detectFolderInconsistencies(supabaseFolder, driveFolder) {
    const inconsistencies = [];
    
    // Verificar nombre
    const expectedName = `${supabaseFolder.employee_name} (${supabaseFolder.employee_email})`;
    if (driveFolder.name !== expectedName) {
      inconsistencies.push({
        field: 'name',
        expected: expectedName,
        actual: driveFolder.name
      });
    }
    
    // Verificar URL
    const expectedUrl = `https://drive.google.com/drive/folders/${driveFolder.id}`;
    if (supabaseFolder.drive_folder_url !== expectedUrl) {
      inconsistencies.push({
        field: 'drive_folder_url',
        expected: expectedUrl,
        actual: supabaseFolder.drive_folder_url
      });
    }
    
    return inconsistencies;
  }

  /**
   * Obtiene todas las carpetas de empleados de Google Drive
   */
  async getEmployeeFoldersFromDrive() {
    try {
      // Obtener todas las carpetas
      const allFolders = await googleDriveConsolidatedService.listFiles();
      
      // Filtrar solo las carpetas de empleados (que siguen el patrón de nombre)
      return allFolders.filter(folder => 
        folder.mimeType === 'application/vnd.google-apps.folder' &&
        this.isEmployeeFolder(folder.name)
      );
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error obteniendo carpetas de Drive: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica si un nombre de carpeta sigue el patrón de carpeta de empleado
   */
  isEmployeeFolder(folderName) {
    const pattern = /\(.+@.+\)/;
    return pattern.test(folderName);
  }

  /**
   * Extrae el email del nombre de la carpeta
   */
  extractEmailFromFolderName(folderName) {
    const match = folderName.match(/\(([^@]+@[^)]+)\)/);
    return match ? match[1] : null;
  }

  /**
   * Obtiene los permisos de una carpeta
   */
  async getFolderPermissions(folderId) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error obteniendo permisos: ${response.status}`);
      }
      
      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error obteniendo permisos de ${folderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un resumen de la auditoría
   */
  generateAuditSummary(supabaseVsDrive, driveVsSupabase, permissions) {
    const totalIssues = 
      supabaseVsDrive.missingInDrive.length +
      supabaseVsDrive.inconsistencies.length +
      supabaseVsDrive.errors.length +
      driveVsSupabase.missingInSupabase.length +
      driveVsSupabase.errors.length +
      permissions.missingPermissions.length +
      permissions.errors.length;
    
    return {
      totalIssues,
      supabaseTotal: supabaseVsDrive.total,
      driveTotal: driveVsSupabase.total,
      permissionsTotal: permissions.total,
      issuesByType: {
        missingInDrive: supabaseVsDrive.missingInDrive.length,
        missingInSupabase: driveVsSupabase.missingInSupabase.length,
        missingPermissions: permissions.missingPermissions.length,
        inconsistencies: supabaseVsDrive.inconsistencies.length,
        errors: supabaseVsDrive.errors.length + driveVsSupabase.errors.length + permissions.errors.length
      },
      healthScore: this.calculateHealthScore(totalIssues, supabaseVsDrive.total + driveVsSupabase.total)
    };
  }

  /**
   * Calcula un puntaje de salud basado en el número de problemas
   */
  calculateHealthScore(totalIssues, totalFolders) {
    if (totalFolders === 0) return 100;
    
    const issueRatio = totalIssues / totalFolders;
    return Math.max(0, Math.min(100, Math.round(100 - (issueRatio * 100))));
  }

  /**
   * Guarda los resultados de la auditoría en la base de datos
   */
  async saveAuditResults(results) {
    try {
      // Guardar en la tabla de logs de auditoría
      const { error } = await supabase
        .from('drive_audit_logs')
        .insert({
          audit_timestamp: results.timestamp,
          audit_duration: results.duration,
          total_issues: results.summary.totalIssues,
          health_score: results.summary.healthScore,
          audit_results: results,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      logger.info('DriveAuditService', '✅ Resultados de auditoría guardados en la base de datos');
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error guardando resultados de auditoría: ${error.message}`);
    }
  }

  /**
   * Guarda la última hora de auditoría
   */
  async saveLastAuditTime() {
    try {
      if (!this.lastAuditTime) return;
      
      // Guardar en la tabla de configuración
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'last_drive_audit_time',
          value: this.lastAuditTime.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error guardando última hora de auditoría: ${error.message}`);
    }
  }

  /**
   * Carga la última hora de auditoría
   */
  async loadLastAuditTime() {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'last_drive_audit_time')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.value) {
        this.lastAuditTime = new Date(data.value);
        logger.info('DriveAuditService', `📅 Última auditoría: ${this.lastAuditTime.toISOString()}`);
      } else {
        logger.info('DriveAuditService', 'ℹ️ No hay registro de auditorías anteriores');
      }
    } catch (error) {
      logger.error('DriveAuditService', `❌ Error cargando última hora de auditoría: ${error.message}`);
    }
  }

  /**
   * Obtiene los resultados de la última auditoría
   */
  getLastAuditResults() {
    if (this.auditResults.length === 0) {
      return null;
    }
    
    return this.auditResults[this.auditResults.length - 1];
  }

  /**
   * Obtiene el historial de auditorías
   */
  getAuditHistory() {
    return this.auditResults;
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastAuditTime: this.lastAuditTime,
      auditIntervalMs: this.auditIntervalMs,
      totalAudits: this.auditResults.length
    };
  }
}

// Instancia singleton
const driveAuditService = new DriveAuditService();

export default driveAuditService;
export { DriveAuditService };