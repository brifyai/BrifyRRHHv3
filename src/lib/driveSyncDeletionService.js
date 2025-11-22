/**
 * Servicio de Eliminación Sincronizada para Google Drive
 * Asegura que las carpetas se eliminen correctamente en ambos sistemas
 */

import { supabase } from './supabaseClient.js';
import googleDriveConsolidatedService from './googleDriveConsolidated.js';
import driveWebhookService from './driveWebhookService.js';
import logger from './logger.js';

class DriveSyncDeletionService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Inicializa el servicio
   */
  async initialize() {
    try {
      logger.info('DriveSyncDeletionService', '🔄 Inicializando servicio de eliminación sincronizada...');
      
      // Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        logger.warn('DriveSyncDeletionService', '⚠️ Google Drive no está autenticado');
        return false;
      }
      
      this.isInitialized = true;
      logger.info('DriveSyncDeletionService', '✅ Servicio de eliminación sincronizada inicializado');
      return true;
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error inicializando: ${error.message}`);
      return false;
    }
  }

  /**
   * Elimina una carpeta de empleado de forma sincronizada
   * @param {string} employeeEmail - Email del empleado
   * @param {boolean} deleteFromDrive - Si eliminar también de Google Drive
   * @returns {Promise<object>} - Resultado de la operación
   */
  async deleteEmployeeFolder(employeeEmail, deleteFromDrive = true) {
    try {
      logger.info('DriveSyncDeletionService', `🗑️ Iniciando eliminación sincronizada para ${employeeEmail} (Drive: ${deleteFromDrive})`);
      
      // Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        throw new Error('Google Drive no está autenticado');
      }
      
      // Obtener información de la carpeta
      const { data: folder, error: fetchError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!folder) {
        logger.warn('DriveSyncDeletionService', `⚠️ No se encontró carpeta para ${employeeEmail}`);
        return { 
          success: true, 
          message: 'Carpeta no encontrada, ya eliminada',
          alreadyDeleted: true 
        };
      }
      
      // Registrar la acción en el log
      await this.logDeletionAction(employeeEmail, 'initiated', {
        folderId: folder.id,
        driveFolderId: folder.drive_folder_id,
        deleteFromDrive
      });
      
      // 1. Eliminar de Google Drive (si se solicita)
      let driveDeletionResult = { success: false, message: 'No se solicitó eliminación de Drive' };
      if (deleteFromDrive && folder.drive_folder_id) {
        driveDeletionResult = await this.deleteFromDrive(folder.drive_folder_id, employeeEmail);
      }
      
      // 2. Marcar como eliminada en Supabase (soft delete)
      const supabaseDeletionResult = await this.markAsDeletedInSupabase(employeeEmail, folder.id);
      
      // 3. Registrar el resultado final
      const finalResult = {
        success: supabaseDeletionResult.success,
        employeeEmail,
        driveDeletion: driveDeletionResult,
        supabaseDeletion: supabaseDeletionResult,
        timestamp: new Date().toISOString()
      };
      
      await this.logDeletionAction(employeeEmail, 'completed', finalResult);
      
      logger.info('DriveSyncDeletionService', `✅ Eliminación sincronizada completada para ${employeeEmail}`);
      
      return finalResult;
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error eliminando carpeta para ${employeeEmail}: ${error.message}`);
      
      // Registrar el error
      await this.logDeletionAction(employeeEmail, 'error', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Elimina una carpeta de Google Drive
   * @param {string} driveFolderId - ID de la carpeta en Google Drive
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<object>} - Resultado de la operación
   */
  async deleteFromDrive(driveFolderId, employeeEmail) {
    try {
      logger.info('DriveSyncDeletionService', `🗑️ Eliminando carpeta de Google Drive: ${driveFolderId}`);
      
      // Verificar que la carpeta existe antes de intentar eliminarla
      try {
        const folderInfo = await googleDriveConsolidatedService.getFileInfo(driveFolderId);
        if (!folderInfo) {
          logger.warn('DriveSyncDeletionService', `⚠️ La carpeta ${driveFolderId} ya no existe en Google Drive`);
          return {
            success: true,
            message: 'La carpeta ya no existe en Google Drive',
            alreadyDeleted: true
          };
        }
      } catch (infoError) {
        logger.warn('DriveSyncDeletionService', `⚠️ Error verificando carpeta ${driveFolderId}: ${infoError.message}`);
        // Continuar con la eliminación de todos modos
      }
      
      // Eliminar la carpeta
      await googleDriveConsolidatedService.deleteFile(driveFolderId);
      
      logger.info('DriveSyncDeletionService', `✅ Carpeta eliminada de Google Drive: ${driveFolderId}`);
      
      return {
        success: true,
        message: 'Carpeta eliminada de Google Drive',
        driveFolderId
      };
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error eliminando carpeta de Google Drive: ${error.message}`);
      
      return {
        success: false,
        message: `Error eliminando carpeta de Google Drive: ${error.message}`,
        driveFolderId,
        error: error.message
      };
    }
  }

  /**
   * Marca una carpeta como eliminada en Supabase (soft delete)
   * @param {string} employeeEmail - Email del empleado
   * @param {string} folderId - ID de la carpeta en Supabase
   * @returns {Promise<object>} - Resultado de la operación
   */
  async markAsDeletedInSupabase(employeeEmail, folderId) {
    try {
      logger.info('DriveSyncDeletionService', `🗑️ Marcando carpeta como eliminada en Supabase: ${folderId}`);
      
      const { error } = await supabase
        .from('employee_folders')
        .update({
          folder_status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId);
      
      if (error) {
        throw error;
      }
      
      logger.info('DriveSyncDeletionService', `✅ Carpeta marcada como eliminada en Supabase: ${folderId}`);
      
      return {
        success: true,
        message: 'Carpeta marcada como eliminada en Supabase',
        folderId
      };
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error marcando carpeta como eliminada en Supabase: ${error.message}`);
      
      return {
        success: false,
        message: `Error marcando carpeta como eliminada en Supabase: ${error.message}`,
        folderId,
        error: error.message
      };
    }
  }

  /**
   * Elimina permanentemente una carpeta de Supabase (hard delete)
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<object>} - Resultado de la operación
   */
  async hardDeleteEmployeeFolder(employeeEmail) {
    try {
      logger.info('DriveSyncDeletionService', `🗑️ Eliminación permanente para ${employeeEmail}`);
      
      // Verificar que la carpeta está marcada como eliminada
      const { data: folder, error: fetchError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .eq('folder_status', 'deleted')
        .maybeSingle();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!folder) {
        logger.warn('DriveSyncDeletionService', `⚠️ No se encontró carpeta eliminada para ${employeeEmail}`);
        return { 
          success: false, 
          message: 'No se encontró carpeta eliminada para este empleado' 
        };
      }
      
      // Verificar que ha pasado suficiente tiempo desde la eliminación (al menos 30 días)
      if (folder.deleted_at) {
        const deletedDate = new Date(folder.deleted_at);
        const now = new Date();
        const daysSinceDeletion = (now - deletedDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDeletion < 30) {
          logger.warn('DriveSyncDeletionService', `⚠️ No se puede eliminar permanentemente antes de 30 días`);
          return { 
            success: false, 
            message: `No se puede eliminar permanentemente antes de 30 días (han pasado ${Math.floor(daysSinceDeletion)} días)` 
          };
        }
      }
      
      // Eliminar permanentemente de Supabase
      const { error: deleteError } = await supabase
        .from('employee_folders')
        .delete()
        .eq('id', folder.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      logger.info('DriveSyncDeletionService', `✅ Carpeta eliminada permanentemente de Supabase: ${folder.id}`);
      
      // Registrar la acción
      await this.logDeletionAction(employeeEmail, 'hard_deleted', {
        folderId: folder.id,
        driveFolderId: folder.drive_folder_id,
        deletedAt: folder.deleted_at
      });
      
      return {
        success: true,
        message: 'Carpeta eliminada permanentemente',
        folderId: folder.id
      };
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error en eliminación permanente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recupera una carpeta eliminada
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<object>} - Resultado de la operación
   */
  async recoverEmployeeFolder(employeeEmail) {
    try {
      logger.info('DriveSyncDeletionService', `🔄 Recuperando carpeta para ${employeeEmail}`);
      
      // Verificar que la carpeta está marcada como eliminada
      const { data: folder, error: fetchError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .eq('folder_status', 'deleted')
        .maybeSingle();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!folder) {
        logger.warn('DriveSyncDeletionService', `⚠️ No se encontró carpeta eliminada para ${employeeEmail}`);
        return { 
          success: false, 
          message: 'No se encontró carpeta eliminada para este empleado' 
        };
      }
      
      // Verificar si la carpeta existe en Google Drive
      let driveExists = false;
      if (folder.drive_folder_id) {
        try {
          const driveFolder = await googleDriveConsolidatedService.getFileInfo(folder.drive_folder_id);
          driveExists = !!driveFolder;
        } catch (error) {
          logger.warn('DriveSyncDeletionService', `⚠️ Error verificando carpeta en Drive: ${error.message}`);
        }
      }
      
      // Si la carpeta no existe en Drive, intentar recuperarla
      if (!driveExists && folder.drive_folder_id) {
        logger.info('DriveSyncDeletionService', `🔄 Intentando recuperar carpeta de Google Drive: ${folder.drive_folder_id}`);
        
        // Aquí se podría implementar lógica para recuperar la carpeta de la papelera de Drive
        // Por ahora, solo registramos que no se pudo recuperar
        logger.warn('DriveSyncDeletionService', `⚠️ No se pudo recuperar la carpeta de Google Drive`);
      }
      
      // Marcar como activa en Supabase
      const { error: updateError } = await supabase
        .from('employee_folders')
        .update({
          folder_status: 'active',
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', folder.id);
      
      if (updateError) {
        throw updateError;
      }
      
      logger.info('DriveSyncDeletionService', `✅ Carpeta recuperada para ${employeeEmail}`);
      
      // Registrar la acción
      await this.logDeletionAction(employeeEmail, 'recovered', {
        folderId: folder.id,
        driveFolderId: folder.drive_folder_id,
        driveExists
      });
      
      return {
        success: true,
        message: 'Carpeta recuperada',
        folderId: folder.id,
        driveExists
      };
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error recuperando carpeta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpia las carpetas eliminadas permanentemente (más antiguas que X días)
   * @param {number} olderThanDays - Días (por defecto 30)
   * @returns {Promise<object>} - Resultado de la operación
   */
  async cleanupDeletedFolders(olderThanDays = 30) {
    try {
      logger.info('DriveSyncDeletionService', `🧹 Limpiando carpetas eliminadas (más antiguas que ${olderThanDays} días)...`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Obtener carpetas eliminadas antes de la fecha de corte
      const { data: deletedFolders, error: fetchError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('folder_status', 'deleted')
        .lt('deleted_at', cutoffDate.toISOString());
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!deletedFolders || deletedFolders.length === 0) {
        logger.info('DriveSyncDeletionService', 'ℹ️ No hay carpetas para limpiar');
        return {
          success: true,
          message: 'No hay carpetas para limpiar',
          deletedCount: 0
        };
      }
      
      logger.info('DriveSyncDeletionService', `📊 ${deletedFolders.length} carpetas encontradas para limpiar`);
      
      // Eliminar cada carpeta
      let deletedCount = 0;
      const errors = [];
      
      for (const folder of deletedFolders) {
        try {
          await this.hardDeleteEmployeeFolder(folder.employee_email);
          deletedCount++;
        } catch (error) {
          errors.push({
            employeeEmail: folder.employee_email,
            error: error.message
          });
        }
      }
      
      logger.info('DriveSyncDeletionService', `✅ Limpieza completada: ${deletedCount} eliminadas, ${errors.length} errores`);
      
      return {
        success: true,
        message: `Limpiadas ${deletedCount} carpetas`,
        deletedCount,
        errors,
        totalFound: deletedFolders.length
      };
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error en limpieza: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra una acción de eliminación en el log
   * @param {string} employeeEmail - Email del empleado
   * @param {string} action - Tipo de acción
   * @param {object} details - Detalles de la acción
   */
  async logDeletionAction(employeeEmail, action, details) {
    try {
      await supabase
        .from('drive_deletion_log')
        .insert({
          employee_email: employeeEmail,
          action_type: action,
          details: details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error registrando acción: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de eliminaciones
   * @param {number} limit - Límite de resultados (por defecto 50)
   * @returns {Promise<Array>} - Lista de acciones de eliminación
   */
  async getDeletionHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('drive_deletion_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error('DriveSyncDeletionService', `❌ Error obteniendo historial: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      authenticated: googleDriveConsolidatedService.authService.isAuthenticated()
    };
  }
}

// Instancia singleton
const driveSyncDeletionService = new DriveSyncDeletionService();

export default driveSyncDeletionService;
export { DriveSyncDeletionService };