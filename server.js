import express from 'express';
import path from 'path';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Importar handlers de webhooks
import microsoft365Handler from './src/api/webhook/microsoft365-notifications.js';
import zoomHandler from './src/api/webhook/zoom-notifications.js';
import googleCalendarHandler from './src/api/webhook/google-calendar-notifications.js';
import googleMeetExtensionsHandler from './src/api/webhook/google-meet-extensions.js';
import googleMeetRealtimeHandler from './src/api/webhook/google-meet-realtime.js';
import driveNotificationsHandler from './src/api/webhook/drive-notifications.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Configuración segura de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir orígenes específicos en desarrollo y producción
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:3004',
      'https://www.staffhub.cl',
      'https://staffhub.cl',
      'https://supabase.staffhub.cl',
      'https://brifyrrhhv2.netlify.app',
      'https://staffhub.vercel.app'
    ];
    
    // Permitir solicitudes sin origen (como apps móviles) solo en desarrollo
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware adicional de seguridad
app.use((req, res, next) => {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Configuración de Supabase - StaffHub
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validar que las variables de entorno existan
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.error('Por favor, configura REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para extraer el ID del archivo de la URI de Google Drive
function extractFileIdFromUri(resourceUri) {
  if (!resourceUri) return null;
  
  // Buscar patrones comunes en las URIs de Google Drive
  const patterns = [
    /\/files\/([a-zA-Z0-9_-]+)/,
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/([a-zA-Z0-9_-]{25,})/
  ];
  
  for (const pattern of patterns) {
    const match = resourceUri.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Función para obtener detalles del archivo desde Google Drive API
async function getFileDetails(fileId, accessToken) {
  try {
    const drive = google.drive({ version: 'v3' });
    
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,size,createdTime,modifiedTime,parents,owners,webViewLink',
      auth: new google.auth.OAuth2(),
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalles del archivo:', error);
    return null;
  }
}

// Middleware de manejo de errores para CORS
app.use((err, req, res, next) => {
  if (err.message === 'No permitido por CORS') {
    console.error('❌ Error CORS:', req.origin);
    return res.status(403).json({
      success: false,
      error: 'Origen no permitido',
      message: 'Esta solicitud no está permitida desde tu dominio'
    });
  }
  
  console.error('❌ Error del servidor:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Endpoint para recibir notificaciones de Microsoft 365
app.post('/api/webhook/microsoft365-notifications', async (req, res) => {
  try {
    await microsoft365Handler(req, res);
  } catch (error) {
    console.error('Error en webhook Microsoft 365:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint para recibir notificaciones de Zoom
app.post('/api/webhook/zoom-notifications', async (req, res) => {
  try {
    await zoomHandler(req, res);
  } catch (error) {
    console.error('Error en webhook Zoom:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint para recibir notificaciones de Google Calendar (Google Meet)
app.post('/api/webhook/google-calendar-notifications', async (req, res) => {
  try {
    await googleCalendarHandler(req, res);
  } catch (error) {
    console.error('Error en webhook Google Calendar:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint para extensiones avanzadas de Google Meet
app.post('/api/webhook/google-meet-extensions', async (req, res) => {
  try {
    await googleMeetExtensionsHandler(req, res);
  } catch (error) {
    console.error('Error en extensiones de Google Meet:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint para eventos en tiempo real de Google Meet
app.post('/api/webhook/google-meet-realtime', async (req, res) => {
  try {
    await googleMeetRealtimeHandler(req, res);
  } catch (error) {
    console.error('Error en tiempo real de Google Meet:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint para recibir notificaciones de Google Drive desde n8n
app.post('/api/webhook/drive-notifications', async (req, res) => {
  try {
    console.log('📨 Notificación recibida desde n8n:', JSON.stringify(req.body, null, 2));
    
    const { headers, body, processedData } = req.body;
    
    if (!headers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Headers requeridos no encontrados' 
      });
    }
    
    // Extraer información de los headers
    const channelId = headers['x-goog-channel-id'];
    const resourceState = headers['x-goog-resource-state'];
    const resourceUri = headers['x-goog-resource-uri'];
    const changed = headers['x-goog-changed'];
    const messageNumber = headers['x-goog-message-number'];
    
    console.log('🔍 Datos extraídos:', {
      channelId,
      resourceState,
      resourceUri,
      changed,
      messageNumber
    });
    
    if (!channelId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Channel ID no encontrado en headers' 
      });
    }
    
    // Buscar el watch channel en la base de datos
    // Buscar por 'channel_id' que es el campo que contiene el ID del canal de Google Drive
    const { data: watchChannel, error: watchError } = await supabase
      .from('drive_watch_channels')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .single();
    
    if (watchError || !watchChannel) {
      console.error('❌ Watch channel no encontrado:', watchError);
      console.error('❌ Detalles del error:', JSON.stringify(watchError, null, 2));
      return res.status(404).json({ 
        success: false, 
        error: 'Watch channel no encontrado o inactivo',
        details: watchError?.message 
      });
    }
    
    console.log('✅ Watch channel encontrado:', watchChannel);
    
    // Obtener credenciales de Google del usuario (opcional para esta prueba)
    let userCredentials = null;
    try {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('google_access_token')
        .eq('user_id', watchChannel.user_id)
        .single();
      
      if (!error) {
        userCredentials = data;
        console.log('🔑 Credenciales obtenidas correctamente');
      } else {
        console.log('⚠️ No se pudieron obtener credenciales:', error.message);
      }
    } catch (err) {
      console.log('⚠️ Error al obtener credenciales:', err.message);
    }
    
    console.log('✅ Watch channel encontrado:', watchChannel.id);
    
    // Extraer ID del archivo de la URI
    const fileId = extractFileIdFromUri(resourceUri);
    console.log('📁 ID del archivo extraído:', fileId);
    
    // Obtener detalles del archivo si tenemos el ID
    let fileDetails = null;
    if (fileId && userCredentials?.google_access_token) {
      fileDetails = await getFileDetails(fileId, userCredentials.google_access_token);
      console.log('📋 Detalles del archivo:', fileDetails);
    }
    
    // Determinar el tipo de cambio
    let changeType = 'unknown';
    if (resourceState === 'update') {
      if (changed === 'children') {
        changeType = 'file_added_or_removed';
      } else if (changed === 'content') {
        changeType = 'file_modified';
      } else if (changed === 'permissions') {
        changeType = 'permissions_changed';
      }
    } else if (resourceState === 'trash') {
      changeType = 'file_trashed';
    } else if (resourceState === 'sync') {
      changeType = 'sync_event';
    }
    
    console.log('🔄 Tipo de cambio determinado:', changeType);
    
    // Guardar la notificación en la base de datos
    const notificationData = {
      channel_id: channelId,
      resource_state: resourceState,
      resource_uri: resourceUri,
      changed_files: changed,
      notification_data: {
        headers: headers,
        body: body,
        processedData: processedData,
        fileDetails: fileDetails,
        changeType: changeType,
        fileId: fileId
      },
      processed_at: new Date().toISOString()
    };
    
    const { data: savedNotification, error: saveError } = await supabase
      .from('drive_notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (saveError) {
      console.error('❌ Error guardando notificación:', saveError);
      return res.status(500).json({ 
        success: false, 
        error: 'Error guardando notificación en la base de datos' 
      });
    }
    
    console.log('✅ Notificación guardada exitosamente:', savedNotification.id);
    
    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Notificación procesada exitosamente',
      data: {
        notificationId: savedNotification.id,
        changeType: changeType,
        fileId: fileId,
        fileName: fileDetails?.name || 'Desconocido',
        resourceState: resourceState,
        changed: changed
      }
    });
    
  } catch (error) {
    console.error('💥 Error procesando notificación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz para mostrar información del servidor
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>StaffHub - Servidor de Integraciones</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 30px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            .status {
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid rgba(0, 255, 0, 0.3);
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
                font-weight: bold;
            }
            .endpoints {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                padding: 20px;
                margin: 20px 0;
            }
            .endpoint {
                background: rgba(255, 255, 255, 0.1);
                margin: 10px 0;
                padding: 10px;
                border-radius: 3px;
                font-family: monospace;
            }
            .method {
                display: inline-block;
                background: #4CAF50;
                color: white;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 0.8em;
                margin-right: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 StaffHub - Servidor de Integraciones</h1>

            <div class="status">
                ✅ Servidor funcionando correctamente en puerto ${PORT}
            </div>

            <h2>📡 Endpoints de Webhook Disponibles</h2>

            <div class="endpoints">
                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/microsoft365-notifications</strong>
                    <br>Notificaciones de Microsoft 365 (calendario/reuniones)
                </div>

                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/zoom-notifications</strong>
                    <br>Notificaciones de Zoom (reuniones/participantes)
                </div>

                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/google-calendar-notifications</strong>
                    <br>Notificaciones de Google Calendar (Google Meet)
                </div>

                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/google-meet-extensions</strong>
                    <br>Extensiones avanzadas de Google Meet
                </div>

                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/google-meet-realtime</strong>
                    <br>Eventos en tiempo real de Google Meet
                </div>

                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/drive-notifications</strong>
                    <br>Notificaciones de Google Drive
                </div>

                <div class="endpoint">
                    <span class="method">GET</span>
                    <strong>/api/test</strong>
                    <br>Endpoint de prueba
                </div>
            </div>

            <h2>🎯 Funcionalidades</h2>
            <ul>
                <li>📅 Notificaciones automáticas de reuniones de Microsoft 365</li>
                <li>🎥 Eventos de Zoom con participantes y grabaciones</li>
                <li>📹 Google Meet con extensiones avanzadas en tiempo real</li>
                <li>💬 Envío automático de mensajes WhatsApp</li>
                <li>🔄 Procesamiento inteligente de webhooks</li>
                <li>📊 Logging completo de todas las operaciones</li>
            </ul>

            <p style="text-align: center; margin-top: 30px; opacity: 0.8;">
                Servidor iniciado: ${new Date().toLocaleString('es-ES')}
            </p>
        </div>
    </body>
    </html>
  `);
});

// Servir archivos estáticos de React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Modo desarrollo: React debe ejecutarse por separado en puerto 3000');
  }
});