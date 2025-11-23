/**
 * Endpoint API directo para webhooks de Google Drive
 * Elimina la dependencia de n8n y procesa notificaciones directamente
 */

import { supabase } from '../../lib/supabase.js';
import driveWebhookService from '../../lib/driveWebhookService.js';
import driveNotificationHandler from '../../lib/driveNotificationHandler.js';
import logger from '../../lib/logger.js';

/**
 * Procesa notificaciones directas de Google Drive
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 */
export default async function handler(req, res) {
  // Solo aceptar métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido. Solo se acepta POST.' 
    });
  }

  try {
    logger.info('GoogleDriveDirectWebhook', '🎯 Webhook directo recibido:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Extraer datos del webhook
    const webhookData = req.body;
    
    // Validar que tenemos los datos necesarios
    if (!webhookData || !webhookData.headers) {
      logger.error('GoogleDriveDirectWebhook', '❌ Datos de webhook inválidos: faltan headers');
      return res.status(400).json({
        success: false,
        error: 'Datos de webhook inválidos: faltan headers'
      });
    }

    // Extraer información de los headers de Google Drive
    const headers = webhookData.headers;
    const channelId = headers['x-goog-channel-id'];
    
    if (!channelId) {
      logger.error('GoogleDriveDirectWebhook', '❌ No es una notificación válida de Google Drive: falta x-goog-channel-id');
      return res.status(400).json({
        success: false,
        error: 'No es una notificación válida de Google Drive: falta x-goog-channel-id'
      });
    }

    logger.info('GoogleDriveDirectWebhook', `📡 Procesando notificación directa del canal: ${channelId}`);

    // Extraer información de la notificación
    const notificationInfo = {
      channelId: headers['x-goog-channel-id'],
      channelExpiration: headers['x-goog-channel-expiration'],
      resourceState: headers['x-goog-resource-state'], // 'update', 'exists', 'not_exists', 'trash', 'sync'
      changedType: headers['x-goog-changed'], // 'children', 'parents', 'properties', 'permissions'
      messageNumber: headers['x-goog-message-number'],
      resourceId: headers['x-goog-resource-id'],
      resourceUri: headers['x-goog-resource-uri'],
      channelToken: headers['x-goog-channel-token'],
      timestamp: new Date().toISOString()
    };

    logger.info('GoogleDriveDirectWebhook', '📊 Información extraída:', notificationInfo);

    // Verificar que el canal existe y está activo
    const { data: watchChannel, error: channelError } = await supabase
      .from('drive_webhook_channels')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .single();

    if (channelError || !watchChannel) {
      logger.error('GoogleDriveDirectWebhook', '❌ Canal no encontrado o inactivo:', channelError);
      return res.status(404).json({
        success: false,
        error: `Canal no encontrado o inactivo para channel_id: ${channelId}`,
        channelId
      });
    }

    logger.info('GoogleDriveDirectWebhook', '✅ Canal encontrado:', watchChannel);

    // Procesar la notificación usando el handler existente
    const processingResult = await driveNotificationHandler.processNotification({
      channel_id: channelId,
      resource_id: notificationInfo.resourceId,
      resource_state: notificationInfo.resourceState,
      resource_uri: notificationInfo.resourceUri,
      changed_files: notificationInfo.changedType,
      event_type: 'change',
      folder_id: watchChannel.folder_id,
      timestamp: notificationInfo.timestamp
    });

    // Guardar la notificación en la base de datos para auditoría
    const { data: notification, error: saveError } = await supabase
      .from('drive_notifications')
      .insert({
        channel_id: channelId,
        resource_id: notificationInfo.resourceId,
        resource_state: notificationInfo.resourceState,
        resource_uri: notificationInfo.resourceUri,
        changed_files: notificationInfo.changedType,
        notification_data: {
          ...notificationInfo,
          processingResult,
          webhookSource: 'direct',
          timestamp: notificationInfo.timestamp
        },
        processed: processingResult.success,
        processed_at: processingResult.success ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (saveError) {
      logger.error('GoogleDriveDirectWebhook', '❌ Error guardando notificación:', saveError);
    } else {
      logger.info('GoogleDriveDirectWebhook', '✅ Notificación guardada:', notification.id);
    }

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Notificación procesada correctamente',
      data: {
        notificationId: notification?.id,
        channelId,
        resourceState: notificationInfo.resourceState,
        changedType: notificationInfo.changedType,
        processingResult,
        timestamp: notificationInfo.timestamp
      }
    });

  } catch (error) {
    logger.error('GoogleDriveDirectWebhook', '💥 Error procesando webhook directo:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

/**
 * Endpoint para verificar el estado del webhook directo
 */
export async function getWebhookStatus(req, res) {
  try {
    const status = driveWebhookService.getStatus();
    
    return res.status(200).json({
      success: true,
      data: {
        ...status,
        webhookType: 'direct',
        endpoint: '/api/webhook/google-drive-direct',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('GoogleDriveDirectWebhook', '❌ Error obteniendo estado:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo estado del webhook'
    });
  }
}

/**
 * Endpoint para reiniciar el webhook directo
 */
export async function restartWebhook(req, res) {
  try {
    logger.info('GoogleDriveDirectWebhook', '🔄 Reiniciando webhook directo...');
    
    // Detener el webhook actual
    await driveWebhookService.stopWatching();
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Iniciar el webhook nuevamente
    const success = await driveWebhookService.startWatching();
    
    if (success) {
      logger.info('GoogleDriveDirectWebhook', '✅ Webhook directo reiniciado exitosamente');
      return res.status(200).json({
        success: true,
        message: 'Webhook directo reiniciado exitosamente',
        status: driveWebhookService.getStatus()
      });
    } else {
      throw new Error('No se pudo reiniciar el webhook');
    }
  } catch (error) {
    logger.error('GoogleDriveDirectWebhook', '❌ Error reiniciando webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Error reiniciando webhook',
      details: error.message
    });
  }
}