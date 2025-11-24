/**
 * Servicio Unificado de Sincronización Bidireccional
 * Orquesta todos los componentes de sincronización sin modificar el código existente
 */

import { supabase } from './supabaseClient.js';
import googleDriveConsolidatedService from './googleDriveConsolidated.js';
import driveWebhookService from './driveWebhookService.js';
import driveAuditService from './driveAuditService.js';
import driveSyncDeletionService from './driveSyncDeletionService.js';
import logger from './logger.js';

class DriveBidirectionalSyncService {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.services = {
      webhook: null,
      audit: null,
      deletion: null
    };
    this.config = {
      auditIntervalMinutes: 60,
      retryAttempts: 3,
      retryDelayMs: 1000,
      batchSize: 50,
      enableNotifications: true,
      notificationThrottleMs: 5000
    };
    this.lastNotificationTime = 0;
    this.notificationQueue = [];
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncTime: null,
      averageSyncTime: 0
    };
  }

  /**
   * Inicializa el servicio y todos sus componentes
   */
  async initialize(config = {}) {
    try {
      logger.info('DriveBidirectionalSyncService', '🔄 Inicializando servicio de sincronización bidireccional...');
      
      // Aplicar configuración personalizada
      this.config = { ...this.config, ...config };
      
      // Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        throw new Error('Google Drive no está autenticado');
      }
      
      // Inicializar servicios
      this.services.webhook = driveWebhookService;
      this.services.audit = driveAuditService;
      this.services.deletion = driveSyncDeletionService;
      
      // Inicializar cada servicio
      await this.services.webhook.initialize();
      await this.services.audit.initialize();
      await this.services.deletion.initialize();
      
      this.isInitialized = true;
      logger.info('DriveBidirectionalSyncService', '✅ Servicio de sincronización bidireccional inicializado');
      return true;
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error inicializando: ${error.message}`);
      return false;
    }
  }

  /**
   * Inicia el servicio completo de sincronización
   */
  async start() {
    try {
      if (!this.isInitialized) {
        throw new Error('El servicio no está inicializado. Llama a initialize() primero.');
      }
      
      if (this.isRunning) {
        logger.info('DriveBidirectionalSyncService', 'ℹ️ El servicio ya está en ejecución');
        return true;
      }
      
      logger.info('DriveBidirectionalSyncService', '🚀 Iniciando sincronización bidireccional...');
      
      // Iniciar webhooks
      await this.services.webhook.startWatching();
      
      // Iniciar auditoría periódica
      this.services.audit.startPeriodicAudit(this.config.auditIntervalMinutes);
      
      this.isRunning = true;
      logger.info('DriveBidirectionalSyncService', '✅ Sincronización bidireccional iniciada');
      return true;
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error iniciando: ${error.message}`);
      return false;
    }
  }

  /**
   * Detiene el servicio completo de sincronización
   */
  async stop() {
    try {
      if (!this.isRunning) {
        logger.info('DriveBidirectionalSyncService', 'ℹ️ El servicio no está en ejecución');
        return true;
      }
      
      logger.info('DriveBidirectionalSyncService', '⏹️ Deteniendo sincronización bidireccional...');
      
      // Detener webhooks
      await this.services.webhook.stopWatching();
      
      // Detener auditoría periódica
      this.services.audit.stopPeriodicAudit();
      
      this.isRunning = false;
      logger.info('DriveBidirectionalSyncService', '✅ Sincronización bidireccional detenida');
      return true;
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error deteniendo: ${error.message}`);
      return false;
    }
  }

  /**
   * Sincroniza una carpeta específica con reintentos y manejo de errores mejorado
   * @param {string} employeeEmail - Email del empleado
   * @param {object} options - Opciones de sincronización
   * @returns {Promise<object>} - Resultado de la sincronización
   */
  async syncEmployeeFolder(employeeEmail, options = {}) {
    const startTime = Date.now();
    this.stats.totalSyncs++;
    
    try {
      logger.info('DriveBidirectionalSyncService', `🔄 Sincronizando carpeta para ${employeeEmail}...`);
      
      // Opciones por defecto
      const syncOptions = {
        verifyPermissions: true,
        updateMetadata: true,
        ...options
      };
      
      // Implementar reintentos con backoff exponencial
      let lastError;
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          // Verificar si la carpeta existe en Supabase
          const { data: supabaseFolder } = await supabase
            .from('employee_folders')
            .select('*')
            .eq('employee_email', employeeEmail)
            .maybeSingle();
          
          // Verificar si la carpeta existe en Google Drive
          let driveFolder = null;
          if (supabaseFolder?.drive_folder_id) {
            try {
              driveFolder = await googleDriveConsolidatedService.getFileInfo(supabaseFolder.drive_folder_id);
            } catch (driveError) {
              logger.warn('DriveBidirectionalSyncService', `⚠️ Error verificando carpeta en Drive: ${driveError.message}`);
              // Continuar con la sincronización
            }
          }
          
          // Si no existe en Drive pero sí en Supabase, intentar recrearla
          if (supabaseFolder && !driveFolder) {
            logger.info('DriveBidirectionalSyncService', `🔄 Carpeta existe en Supabase pero no en Drive, recreando...`);
            
            // Obtener información del empleado
            const { data: employee } = await supabase
              .from('employees')
              .select('*')
              .eq('email', employeeEmail)
              .single();
            
            if (employee) {
              // Recrear carpeta en Drive
              const newFolder = await googleDriveConsolidatedService.createFolder(
                `${employee.name} (${employeeEmail})`,
                null // Carpeta raíz
              );
              
              // Actualizar Supabase con el nuevo ID
              await supabase
                .from('employee_folders')
                .update({
                  drive_folder_id: newFolder.id,
                  drive_folder_url: `https://drive.google.com/drive/folders/${newFolder.id}`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', supabaseFolder.id);
              
              driveFolder = newFolder;
            }
          }
          
          // Si existe en Drive pero no en Supabase, crear registro
          if (!supabaseFolder && driveFolder) {
            logger.info('DriveBidirectionalSyncService', `🔄 Carpeta existe en Drive pero no en Supabase, creando registro...`);
            
            // Extraer nombre del empleado del nombre de la carpeta
            const employeeName = driveFolder.name.replace(/\([^@]+@[^)]+\)/, '').trim();
            
            // Crear registro en Supabase
            const { data: newFolder } = await supabase
              .from('employee_folders')
              .insert({
                employee_email: employeeEmail,
                employee_name: employeeName,
                drive_folder_id: driveFolder.id,
                drive_folder_url: `https://drive.google.com/drive/folders/${driveFolder.id}`,
                folder_status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
          }
          
          // Verificar permisos si se solicita
          if (syncOptions.verifyPermissions && driveFolder) {
            await this.verifyAndFixPermissions(employeeEmail, driveFolder.id);
          }
          
          // Actualizar metadatos si se solicita
          if (syncOptions.updateMetadata && supabaseFolder && driveFolder) {
            await this.updateMetadata(supabaseFolder, driveFolder);
          }
          
          // Actualizar estadísticas
          const duration = Date.now() - startTime;
          this.stats.successfulSyncs++;
          this.stats.lastSyncTime = new Date().toISOString();
          this.stats.averageSyncTime = (this.stats.averageSyncTime * (this.stats.successfulSyncs - 1) + duration) / this.stats.successfulSyncs;
          
          logger.info('DriveBidirectionalSyncService', `✅ Sincronización completada para ${employeeEmail} en ${duration}ms`);
          
          return {
            success: true,
            employeeEmail,
            duration,
            message: 'Sincronización completada'
          };
        } catch (error) {
          lastError = error;
          logger.warn('DriveBidirectionalSyncService', `⚠️ Intento ${attempt} fallido: ${error.message}`);
          
          // Esperar antes del siguiente intento (backoff exponencial)
          if (attempt < this.config.retryAttempts) {
            const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
            await this.delay(delay);
          }
        }
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      throw lastError;
    } catch (error) {
      // Actualizar estadísticas de error
      this.stats.failedSyncs++;
      
      logger.error('DriveBidirectionalSyncService', `❌ Error sincronizando ${employeeEmail}: ${error.message}`);
      
      // Registrar error en la base de datos
      await this.logSyncError(employeeEmail, error);
      
      throw error;
    }
  }

  /**
   * Verifica y corrige permisos de una carpeta
   * @param {string} employeeEmail - Email del empleado
   * @param {string} folderId - ID de la carpeta en Google Drive
   */
  async verifyAndFixPermissions(employeeEmail, folderId) {
    try {
      // Obtener permisos actuales
      const permissions = await this.getFolderPermissions(folderId);
      const employeePermission = permissions.find(p => p.emailAddress === employeeEmail);
      
      if (!employeePermission) {
        logger.info('DriveBidirectionalSyncService', `🔗 Agregando permisos para ${employeeEmail}...`);
        await googleDriveConsolidatedService.shareFolder(folderId, employeeEmail, 'writer');
      } else if (employeePermission.role !== 'writer') {
        logger.info('DriveBidirectionalSyncService', `🔄 Actualizando permisos para ${employeeEmail}...`);
        await googleDriveConsolidatedService.shareFolder(folderId, employeeEmail, 'writer');
      }
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error verificando permisos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene los permisos de una carpeta con manejo de errores mejorado
   * @param {string} folderId - ID de la carpeta
   * @returns {Promise<Array>} - Lista de permisos
   */
  async getFolderPermissions(folderId) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`
        }
      });
      
      if (!response.ok) {
        // Intentar refresh de token si es error 401
        if (response.status === 401) {
          logger.info('DriveBidirectionalSyncService', '🔄 Token expirado, intentando refresh...');
          const refreshed = await googleDriveConsolidatedService.authService.refreshAccessToken(
            googleDriveConsolidatedService.authService.refreshToken
          );
          
          if (refreshed) {
            // Reintentar la solicitud
            return this.getFolderPermissions(folderId);
          }
        }
        
        throw new Error(`Error obteniendo permisos: ${response.status}`);
      }
      
      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error en getFolderPermissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza metadatos entre Supabase y Google Drive
   * @param {object} supabaseFolder - Registro de carpeta en Supabase
   * @param {object} driveFolder - Información de carpeta en Google Drive
   */
  async updateMetadata(supabaseFolder, driveFolder) {
    try {
      // Verificar si el nombre en Drive coincide con el esperado
      const expectedName = `${supabaseFolder.employee_name} (${supabaseFolder.employee_email})`;
      
      if (driveFolder.name !== expectedName) {
        logger.info('DriveBidirectionalSyncService', `🔄 Actualizando nombre de carpeta en Drive...`);
        
        // Actualizar nombre en Drive
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFolder.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: expectedName
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error actualizando nombre: ${response.status}`);
        }
      }
      
      // Verificar URL en Supabase
      const expectedUrl = `https://drive.google.com/drive/folders/${driveFolder.id}`;
      
      if (supabaseFolder.drive_folder_url !== expectedUrl) {
        logger.info('DriveBidirectionalSyncService', `🔄 Actualizando URL en Supabase...`);
        
        await supabase
          .from('employee_folders')
          .update({
            drive_folder_url: expectedUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabaseFolder.id);
      }
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error actualizando metadatos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sincroniza múltiples empleados en lotes para mejorar el rendimiento
   * @param {Array} employeeEmails - Lista de emails de empleados
   * @param {object} options - Opciones de sincronización
   * @returns {Promise<object>} - Resultados de la sincronización
   */
  async syncEmployeeFoldersBatch(employeeEmails, options = {}) {
    const startTime = Date.now();
    const batchSize = options.batchSize || this.config.batchSize;
    
    logger.info('DriveBidirectionalSyncService', `🔄 Iniciando sincronización en lotes de ${employeeEmails.length} empleados...`);
    
    const results = {
      total: employeeEmails.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Procesar en lotes
    for (let i = 0; i < employeeEmails.length; i += batchSize) {
      const batch = employeeEmails.slice(i, i + batchSize);
      logger.info('DriveBidirectionalSyncService', `📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(employeeEmails.length / batchSize)} (${batch.length} empleados)`);
      
      // Procesar lote en paralelo con límite de concurrencia
      const batchResults = await this.processBatchWithConcurrency(batch, options);
      
      // Agregar resultados
      results.successful += batchResults.successful;
      results.failed += batchResults.failed;
      results.errors.push(...batchResults.errors);
    }
    
    const duration = Date.now() - startTime;
    logger.info('DriveBidirectionalSyncService', `✅ Sincronización en lotes completada en ${duration}ms: ${results.successful} exitosas, ${results.failed} fallidas`);
    
    return results;
  }

  /**
   * Procesa un lote de empleados con control de concurrencia
   * @param {Array} batch - Lote de emails de empleados
   * @param {object} options - Opciones de sincronización
   * @returns {Promise<object>} - Resultados del lote
   */
  async processBatchWithConcurrency(batch, options) {
    const concurrencyLimit = 5; // Límite de operaciones concurrentes
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Procesar en grupos de tamaño concurrencyLimit
    for (let i = 0; i < batch.length; i += concurrencyLimit) {
      const group = batch.slice(i, i + concurrencyLimit);
      
      // Procesar grupo en paralelo
      const groupPromises = group.map(async (email) => {
        try {
          await this.syncEmployeeFolder(email, options);
          return { email, success: true };
        } catch (error) {
          return { 
            email, 
            success: false, 
            error: error.message 
          };
        }
      });
      
      // Esperar a que termine el grupo
      const groupResults = await Promise.all(groupPromises);
      
      // Procesar resultados
      groupResults.forEach(result => {
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            email: result.email,
            error: result.error
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Ejecuta una auditoría completa del sistema
   * @returns {Promise<object>} - Resultados de la auditoría
   */
  async runFullAudit() {
    try {
      logger.info('DriveBidirectionalSyncService', '🔍 Iniciando auditoría completa del sistema...');
      
      const auditResults = await this.services.audit.runAudit();
      
      // Intentar修复 problemas automáticamente si es posible
      const autoFixed = await this.autoFixIssues(auditResults);
      
      logger.info('DriveBidirectionalSyncService', `✅ Auditoría completada: ${auditResults.summary.totalIssues} problemas encontrados, ${autoFixed} solucionados automáticamente`);
      
      return {
        ...auditResults,
        autoFixed
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error en auditoría: ${error.message}`);
      throw error;
    }
  }

  /**
   * Intenta solucionar automáticamente problemas detectados en la auditoría
   * @param {object} auditResults - Resultados de la auditoría
   * @returns {Promise<number>} - Número de problemas solucionados
   */
  async autoFixIssues(auditResults) {
    let fixedCount = 0;
    
    try {
      // Solucionar carpetas faltantes en Drive
      for (const missing of auditResults.supabaseVsDrive.missingInDrive) {
        try {
          // Intentar recrear la carpeta
          const { data: employee } = await supabase
            .from('employees')
            .select('*')
            .eq('email', missing.employeeEmail)
            .single();
          
          if (employee) {
            const newFolder = await googleDriveConsolidatedService.createFolder(
              `${employee.name} (${missing.employeeEmail})`,
              null
            );
            
            await supabase
              .from('employee_folders')
              .update({
                drive_folder_id: newFolder.id,
                drive_folder_url: `https://drive.google.com/drive/folders/${newFolder.id}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', missing.supabaseId);
            
            fixedCount++;
            logger.info('DriveBidirectionalSyncService', `✅ Carpeta recreada para ${missing.employeeEmail}`);
          }
        } catch (error) {
          logger.warn('DriveBidirectionalSyncService', `⚠️ Error recreando carpeta para ${missing.employeeEmail}: ${error.message}`);
        }
      }
      
      // Solucionar carpetas faltantes en Supabase
      for (const missing of auditResults.driveVsSupabase.missingInSupabase) {
        try {
          // Extraer nombre del empleado
          const employeeName = missing.folderName.replace(/\([^@]+@[^)]+\)/, '').trim();
          
          // Crear registro en Supabase
          await supabase
            .from('employee_folders')
            .insert({
              employee_email: missing.employeeEmail,
              employee_name: employeeName,
              drive_folder_id: missing.driveFolderId,
              drive_folder_url: `https://drive.google.com/drive/folders/${missing.driveFolderId}`,
              folder_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          fixedCount++;
          logger.info('DriveBidirectionalSyncService', `✅ Registro creado para ${missing.employeeEmail}`);
        } catch (error) {
          logger.warn('DriveBidirectionalSyncService', `⚠️ Error creando registro para ${missing.employeeEmail}: ${error.message}`);
        }
      }
      
      // Solucionar permisos faltantes
      for (const missingPermission of auditResults.permissions.missingPermissions) {
        try {
          await googleDriveConsolidatedService.shareFolder(
            missingPermission.driveFolderId,
            missingPermission.employeeEmail,
            'writer'
          );
          
          fixedCount++;
          logger.info('DriveBidirectionalSyncService', `✅ Permisos agregados para ${missingPermission.employeeEmail}`);
        } catch (error) {
          logger.warn('DriveBidirectionalSyncService', `⚠️ Error agregando permisos para ${missingPermission.employeeEmail}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error solucionando problemas: ${error.message}`);
    }
    
    return fixedCount;
  }

  /**
   * Elimina una carpeta de forma sincronizada
   * @param {string} employeeEmail - Email del empleado
   * @param {boolean} deleteFromDrive - Si eliminar también de Google Drive
   * @returns {Promise<object>} - Resultado de la eliminación
   */
  async deleteEmployeeFolder(employeeEmail, deleteFromDrive = true) {
    try {
      logger.info('DriveBidirectionalSyncService', `🗑️ Eliminando carpeta para ${employeeEmail}...`);
      
      const result = await this.services.deletion.deleteEmployeeFolder(employeeEmail, deleteFromDrive);
      
      // Notificar si está habilitado
      if (this.config.enableNotifications) {
        await this.notifyAdmins('folder_deleted', {
          employeeEmail,
          deleteFromDrive,
          result
        });
      }
      
      return result;
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error eliminando carpeta para ${employeeEmail}: ${error.message}`);
      
      // Registrar error
      await this.logSyncError(employeeEmail, error, 'deletion');
      
      throw error;
    }
  }

  /**
   * Registra un error de sincronización en la base de datos
   * @param {string} employeeEmail - Email del empleado
   * @param {Error} error - Error ocurrido
   * @param {string} operation - Tipo de operación
   */
  async logSyncError(employeeEmail, error, operation = 'sync') {
    try {
      await supabase
        .from('drive_sync_errors')
        .insert({
          employee_email: employeeEmail,
          operation_type: operation,
          error_message: error.message,
          error_stack: error.stack,
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      logger.error('DriveBidirectionalSyncService', `❌ Error registrando en BD: ${dbError.message}`);
    }
  }

  /**
   * Notifica a los administradores sobre eventos importantes
   * @param {string} eventType - Tipo de evento
   * @param {object} data - Datos del evento
   */
  async notifyAdmins(eventType, data) {
    try {
      const now = Date.now();
      
      // Evitar notificaciones demasiado frecuentes
      if (now - this.lastNotificationTime < this.config.notificationThrottleMs) {
        return;
      }
      
      this.lastNotificationTime = now;
      
      // Aquí se podría implementar el envío real de notificaciones
      // Por ahora, solo registramos el evento
      logger.info('DriveBidirectionalSyncService', `📢 Notificación: ${eventType}`, data);
      
      // Registrar en la base de datos
      await supabase
        .from('drive_notifications')
        .insert({
          event_type: eventType,
          event_data: data,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('DriveBidirectionalSyncService', `❌ Error enviando notificación: ${error.message}`);
    }
  }

  /**
   * Utilidad para delays
   * @param {number} ms - Milisegundos a esperar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas del servicio
   * @param {string} companyId - ID de la empresa para estadísticas específicas
   */
  getStats(companyId = null) {
    const baseStats = {
      ...this.stats,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      config: this.config,
      services: {
        webhook: this.services.webhook?.getStatus(),
        audit: this.services.audit?.getStatus(),
        deletion: this.services.deletion?.getStatus()
      }
    };

    // Si se especifica una empresa, agregar estadísticas específicas
    if (companyId) {
      return {
        ...baseStats,
        companyId,
        companySpecific: true
      };
    }

    return baseStats;
  }
}

// Instancia singleton
const driveBidirectionalSyncService = new DriveBidirectionalSyncService();

export default driveBidirectionalSyncService;
export { DriveBidirectionalSyncService };