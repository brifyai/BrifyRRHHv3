/**
 * Servicio de Webhooks para Google Drive
 * Permite recibir notificaciones de cambios en Google Drive
 */

import { supabase } from './supabaseClient.js';
import googleDriveConsolidatedService from './googleDriveConsolidated.js';
import logger from './logger.js';

class DriveWebhookService {
  constructor() {
    this.webhookUrl = null;
    this.channelId = null;
    this.resourceId = null;
    this.isWatching = false;
    this.watchInterval = null;
    this.watchIntervalMs = 24 * 60 * 60 * 1000; // 24 horas (máximo permitido por Google Drive)
    this.webhookExpiration = null;
  }

  /**
   * Inicializa el servicio de webhooks
   */
  async initialize() {
    try {
      logger.info('DriveWebhookService', '🔄 Inicializando servicio de webhooks...');
      
      // Obtener la URL del webhook desde las variables de entorno
      this.webhookUrl = process.env.REACT_APP_WEBHOOK_URL || 
                        (window.location.hostname === 'localhost' ?
                         'http://localhost:3000/api/webhooks/drive' :
                         `${window.location.origin}/api/webhooks/drive`);
      
      logger.info('DriveWebhookService', `📍 URL del webhook: ${this.webhookUrl}`);
      
      // Verificar si ya existe un canal activo
      await this.checkExistingChannel();
      
      logger.info('DriveWebhookService', '✅ Servicio de webhooks inicializado');
      return true;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error inicializando: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifica si ya existe un canal de notificación activo
   */
  async checkExistingChannel() {
    try {
      // Obtener el canal actual desde Supabase
      const { data, error } = await supabase
        .from('drive_webhook_channels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Verificar si el canal aún es válido
        const expirationDate = new Date(data.expiration);
        const now = new Date();
        
        if (expirationDate > now) {
          // El canal aún es válido
          this.channelId = data.channel_id;
          this.resourceId = data.resource_id;
          this.webhookExpiration = expirationDate;
          this.isWatching = true;
          
          logger.info('DriveWebhookService', `✅ Canal existente encontrado: ${this.channelId}`);
          logger.info('DriveWebhookService', `⏰ El canal expira el: ${expirationDate.toISOString()}`);
          
          // Programar renovación antes de que expire
          this.scheduleChannelRenewal();
        } else {
          // El canal ha expirado, eliminarlo
          await this.deleteChannel(data.id);
          logger.info('DriveWebhookService', '🗑️ Canal expirado eliminado');
        }
      }
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error verificando canal existente: ${error.message}`);
    }
  }

  /**
   * Inicia la observación de cambios en Google Drive
   */
  async startWatching() {
    try {
      if (this.isWatching) {
        logger.info('DriveWebhookService', 'ℹ️ Ya se está observando Google Drive');
        return true;
      }
      
      logger.info('DriveWebhookService', '🔍 Iniciando observación de Google Drive...');
      
      // Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        throw new Error('Google Drive no está autenticado');
      }
      
      // Crear un nuevo canal de notificación
      await this.createChannel();
      
      // Guardar el canal en Supabase
      await this.saveChannelToDatabase();
      
      this.isWatching = true;
      
      // Programar renovación antes de que expire
      this.scheduleChannelRenewal();
      
      logger.info('DriveWebhookService', '✅ Observación de Google Drive iniciada');
      return true;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error iniciando observación: ${error.message}`);
      return false;
    }
  }

  /**
   * Detiene la observación de cambios en Google Drive
   */
  async stopWatching() {
    try {
      if (!this.isWatching) {
        logger.info('DriveWebhookService', 'ℹ️ No se está observando Google Drive');
        return true;
      }
      
      logger.info('DriveWebhookService', '⏹️ Deteniendo observación de Google Drive...');
      
      // Detener el intervalo de renovación
      if (this.watchInterval) {
        clearInterval(this.watchInterval);
        this.watchInterval = null;
      }
      
      // Eliminar el canal si existe
      if (this.channelId) {
        await this.deleteChannel();
      }
      
      this.isWatching = false;
      this.channelId = null;
      this.resourceId = null;
      this.webhookExpiration = null;
      
      logger.info('DriveWebhookService', '✅ Observación de Google Drive detenida');
      return true;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error deteniendo observación: ${error.message}`);
      return false;
    }
  }

  /**
   * Crea un nuevo canal de notificación
   */
  async createChannel() {
    try {
      logger.info('DriveWebhookService', '📡 Creando nuevo canal de notificación...');
      
      // Generar un ID único para el canal
      this.channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calcular fecha de expiración (máximo 24 horas)
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);
      this.webhookExpiration = expirationDate;
      
      // Crear el canal en Google Drive
      const response = await fetch('https://www.googleapis.com/drive/v3/channels/watch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.channelId,
          type: 'web_hook',
          address: this.webhookUrl,
          expiration: expirationDate.getTime().toString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        logger.error('DriveWebhookService', `❌ Error creando canal: ${response.status} - ${errorData}`);
        throw new Error(`Error creando canal: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Guardar el resource ID para futuras referencias
      this.resourceId = data.resourceId;
      
      logger.info('DriveWebhookService', `✅ Canal creado: ${this.channelId}`);
      logger.info('DriveWebhookService', `🆔 Resource ID: ${this.resourceId}`);
      logger.info('DriveWebhookService', `⏰ Expira el: ${expirationDate.toISOString()}`);
      
      return true;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error creando canal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un canal de notificación
   */
  async deleteChannel(channelId = null) {
    try {
      const id = channelId || this.channelId;
      
      if (!id) {
        logger.warn('DriveWebhookService', '⚠️ No hay canal para eliminar');
        return false;
      }
      
      logger.info('DriveWebhookService', `🗑️ Eliminando canal: ${id}...`);
      
      // Eliminar el canal en Google Drive
      const response = await fetch(`https://www.googleapis.com/drive/v3/channels/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          resourceId: this.resourceId
        })
      });
      
      if (!response.ok && response.status !== 404) { // 404 es OK, el canal ya no existe
        const errorData = await response.text();
        logger.error('DriveWebhookService', `❌ Error eliminando canal: ${response.status} - ${errorData}`);
        throw new Error(`Error eliminando canal: ${response.status}`);
      }
      
      // Eliminar el canal de la base de datos
      await supabase
        .from('drive_webhook_channels')
        .delete()
        .eq('channel_id', id);
      
      logger.info('DriveWebhookService', `✅ Canal eliminado: ${id}`);
      return true;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error eliminando canal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Guarda el canal en la base de datos
   */
  async saveChannelToDatabase() {
    try {
      if (!this.channelId || !this.webhookExpiration) {
        throw new Error('No hay canal para guardar');
      }
      
      logger.info('DriveWebhookService', `💾 Guardando canal en la base de datos...`);
      
      // Eliminar canales anteriores
      await supabase
        .from('drive_webhook_channels')
        .delete()
        .neq('id', ''); // Eliminar todos
      
      // Insertar el nuevo canal
      const { data, error } = await supabase
        .from('drive_webhook_channels')
        .insert({
          channel_id: this.channelId,
          resource_id: this.resourceId,
          webhook_url: this.webhookUrl,
          expiration: this.webhookExpiration.toISOString(),
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      logger.info('DriveWebhookService', `✅ Canal guardado en la base de datos: ${data.id}`);
      return data;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error guardando canal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Programa la renovación del canal antes de que expire
   */
  scheduleChannelRenewal() {
    if (!this.isWatching || !this.webhookExpiration) {
      return;
    }
    
    // Limpiar intervalo anterior
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
    
    // Calcular tiempo hasta la renovación (1 hora antes de la expiración)
    const now = new Date();
    const expiration = new Date(this.webhookExpiration);
    const timeUntilRenewal = expiration.getTime() - now.getTime() - (60 * 60 * 1000); // 1 hora antes
    
    // Si el tiempo es negativo, renovar inmediatamente
    const intervalTime = timeUntilRenewal > 0 ? timeUntilRenewal : 1000; // 1 segundo
    
    logger.info('DriveWebhookService', `⏰ Renovación programada en ${intervalTime}ms`);
    
    this.watchInterval = setInterval(async () => {
      try {
        logger.info('DriveWebhookService', '🔄 Renovando canal de notificación...');
        
        // Detener la observación actual
        await this.stopWatching();
        
        // Iniciar una nueva observación
        await this.startWatching();
        
        logger.info('DriveWebhookService', '✅ Canal renovado exitosamente');
      } catch (error) {
        logger.error('DriveWebhookService', `❌ Error renovando canal: ${error.message}`);
      }
    }, intervalTime);
  }

  /**
   * Procesa una notificación de cambio
   */
  async processChangeNotification(notification) {
    try {
      logger.info('DriveWebhookService', `📨 Procesando notificación de cambio...`);
      
      // Verificar que la notificación es válida
      if (!this.validateNotification(notification)) {
        logger.warn('DriveWebhookService', '⚠️ Notificación inválida');
        return false;
      }
      
      // Obtener los cambios
      const changes = await this.getChanges(notification.resourceId);
      
      if (changes && changes.length > 0) {
        logger.info('DriveWebhookService', `📊 ${changes.length} cambios detectados`);
        
        // Procesar cada cambio
        for (const change of changes) {
          await this.processChange(change);
        }
        
        return true;
      } else {
        logger.info('DriveWebhookService', 'ℹ️ No hay cambios para procesar');
        return false;
      }
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error procesando notificación: ${error.message}`);
      return false;
    }
  }

  /**
   * Valida una notificación de cambio
   */
  validateNotification(notification) {
    try {
      // Verificar que tiene los campos necesarios
      if (!notification || !notification.headers) {
        return false;
      }
      
      // Verificar el ID del canal
      const channelId = notification.headers['x-goog-channel-id'];
      if (channelId !== this.channelId) {
        logger.warn('DriveWebhookService', `⚠️ ID de canal no coincide: ${channelId} != ${this.channelId}`);
        return false;
      }
      
      // Verificar el resource ID
      const resourceId = notification.headers['x-goog-resource-id'];
      if (resourceId !== this.resourceId) {
        logger.warn('DriveWebhookService', `⚠️ Resource ID no coincide: ${resourceId} != ${this.resourceId}`);
        return false;
      }
      
      // Verificar que no es una notificación de estado
      if (notification.headers['x-goog-resource-state'] === 'sync') {
        logger.info('DriveWebhookService', 'ℹ️ Notificación de sincronización ignorada');
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error validando notificación: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene los cambios desde la última sincronización
   */
  async getChanges(resourceId) {
    try {
      logger.info('DriveWebhookService', `🔍 Obteniendo cambios para resource ID: ${resourceId}`);
      
      // Obtener el startPageToken de la última sincronización
      const { data: lastSync } = await supabase
        .from('drive_sync_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let startPageToken = lastSync?.start_page_token;
      
      // Si no hay una sincronización previa, usar el token inicial
      if (!startPageToken) {
        const response = await fetch('https://www.googleapis.com/drive/v3/changes/startPageToken', {
          headers: {
            'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error obteniendo startPageToken: ${response.status}`);
        }
        
        const data = await response.json();
        startPageToken = data.startPageToken;
      }
      
      // Obtener los cambios
      const changes = [];
      let pageToken = startPageToken;
      
      while (pageToken) {
        const params = new URLSearchParams({
          pageToken: pageToken,
          fields: 'nextPageToken, changes(file(id, name, mimeType, parents), removed, time)'
        });
        
        const response = await fetch(`https://www.googleapis.com/drive/v3/changes?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${googleDriveConsolidatedService.authService.getAccessToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error obteniendo cambios: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.changes && data.changes.length > 0) {
          changes.push(...data.changes);
        }
        
        pageToken = data.nextPageToken;
      }
      
      // Guardar el nuevo startPageToken para la próxima sincronización
      await supabase
        .from('drive_sync_tokens')
        .insert({
          start_page_token: startPageToken,
          created_at: new Date().toISOString()
        });
      
      logger.info('DriveWebhookService', `✅ ${changes.length} cambios obtenidos`);
      return changes;
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error obteniendo cambios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa un cambio individual
   */
  async processChange(change) {
    try {
      logger.info('DriveWebhookService', `🔄 Procesando cambio: ${change.file?.name || 'archivo desconocido'}`);
      
      // Verificar si el cambio afecta a una carpeta de empleado
      if (!this.isEmployeeFolder(change.file)) {
        logger.info('DriveWebhookService', 'ℹ️ El cambio no afecta a una carpeta de empleado');
        return;
      }
      
      // Obtener el email del empleado desde el nombre de la carpeta
      const employeeEmail = this.extractEmailFromFolderName(change.file.name);
      
      if (!employeeEmail) {
        logger.warn('DriveWebhookService', `⚠️ No se pudo extraer el email del nombre de carpeta: ${change.file.name}`);
        return;
      }
      
      // Verificar si la carpeta fue eliminada
      if (change.removed) {
        logger.info('DriveWebhookService', `🗑️ Carpeta eliminada: ${change.file.name}`);
        await this.handleFolderDeletion(employeeEmail, change.file.id);
      } else {
        logger.info('DriveWebhookService', `📁 Carpeta modificada: ${change.file.name}`);
        await this.handleFolderModification(employeeEmail, change.file);
      }
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error procesando cambio: ${error.message}`);
    }
  }

  /**
   * Verifica si un archivo es una carpeta de empleado
   */
  isEmployeeFolder(file) {
    if (!file || file.mimeType !== 'application/vnd.google-apps.folder') {
      return false;
    }
    
    // Verificar si el nombre sigue el patrón de carpeta de empleado
    const pattern = /\(.+@.+\)/;
    return pattern.test(file.name);
  }

  /**
   * Extrae el email del nombre de la carpeta
   */
  extractEmailFromFolderName(folderName) {
    const match = folderName.match(/\(([^@]+@[^)]+)\)/);
    return match ? match[1] : null;
  }

  /**
   * Maneja la eliminación de una carpeta
   */
  async handleFolderDeletion(employeeEmail, driveFolderId) {
    try {
      logger.info('DriveWebhookService', `🗑️ Manejando eliminación de carpeta para ${employeeEmail}`);
      
      // Actualizar el estado en Supabase
      const { error } = await supabase
        .from('employee_folders')
        .update({
          folder_status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('employee_email', employeeEmail)
        .eq('drive_folder_id', driveFolderId);
      
      if (error) {
        throw error;
      }
      
      logger.info('DriveWebhookService', `✅ Estado actualizado para ${employeeEmail}`);
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error manejando eliminación: ${error.message}`);
    }
  }

  /**
   * Maneja la modificación de una carpeta
   */
  async handleFolderModification(employeeEmail, driveFile) {
    try {
      logger.info('DriveWebhookService', `📁 Manejando modificación de carpeta para ${employeeEmail}`);
      
      // Verificar si la carpeta existe en Supabase
      const { data: folder } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .eq('drive_folder_id', driveFile.id)
        .maybeSingle();
      
      if (!folder) {
        // La carpeta no existe en Supabase, crearla
        logger.info('DriveWebhookService', `🆕 Creando registro para carpeta existente en Drive: ${employeeEmail}`);
        
        // Extraer el nombre del empleado del nombre de la carpeta
        const employeeName = driveFile.name.replace(/\([^@]+@[^)]+\)/, '').trim();
        
        // Crear el registro en Supabase
        const { error } = await supabase
          .from('employee_folders')
          .insert({
            employee_email: employeeEmail,
            employee_name: employeeName,
            drive_folder_id: driveFile.id,
            drive_folder_url: `https://drive.google.com/drive/folders/${driveFile.id}`,
            folder_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          throw error;
        }
        
        logger.info('DriveWebhookService', `✅ Registro creado para ${employeeEmail}`);
      } else {
        // La carpeta existe en Supabase, verificar si necesita actualización
        const needsUpdate = 
          folder.drive_folder_url !== `https://drive.google.com/drive/folders/${driveFile.id}` ||
          folder.folder_status === 'deleted';
        
        if (needsUpdate) {
          // Actualizar el registro
          const { error } = await supabase
            .from('employee_folders')
            .update({
              drive_folder_url: `https://drive.google.com/drive/folders/${driveFile.id}`,
              folder_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', folder.id);
          
          if (error) {
            throw error;
          }
          
          logger.info('DriveWebhookService', `✅ Registro actualizado para ${employeeEmail}`);
        } else {
          logger.info('DriveWebhookService', `ℹ️ No se requieren cambios para ${employeeEmail}`);
        }
      }
    } catch (error) {
      logger.error('DriveWebhookService', `❌ Error manejando modificación: ${error.message}`);
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      channelId: this.channelId,
      resourceId: this.resourceId,
      webhookExpiration: this.webhookExpiration,
      webhookUrl: this.webhookUrl
    };
  }
}

// Instancia singleton
const driveWebhookService = new DriveWebhookService();

export default driveWebhookService;
export { DriveWebhookService };