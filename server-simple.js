// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');

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

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para verificar conexión con Supabase
app.get('/api/supabase-check', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Conexión con Supabase establecida correctamente',
      data: data
    });
  } catch (error) {
    console.error('Error verificando Supabase:', error);
    res.status(500).json({
      success: false,
      error: 'Error al conectar con Supabase',
      details: error.message
    });
  }
});

// Endpoint simple para webhook de Drive (temporal)
app.post('/api/webhook/drive-notifications', async (req, res) => {
  try {
    console.log('📨 Notificación recibida:', JSON.stringify(req.body, null, 2));
    
    // Respuesta exitosa simple
    res.json({
      success: true,
      message: 'Notificación recibida correctamente',
      timestamp: new Date().toISOString()
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

// Ruta raíz para mostrar información del servidor
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>StaffHub - Servidor</title>
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
            <h1>🚀 StaffHub - Servidor</h1>

            <div class="status">
                ✅ Servidor funcionando correctamente en puerto ${PORT}
            </div>

            <h2>📡 Endpoints Disponibles</h2>

            <div class="endpoints">
                <div class="endpoint">
                    <span class="method">GET</span>
                    <strong>/api/test</strong>
                    <br>Endpoint de prueba
                </div>

                <div class="endpoint">
                    <span class="method">GET</span>
                    <strong>/api/supabase-check</strong>
                    <br>Verificar conexión con Supabase
                </div>

                <div class="endpoint">
                    <span class="method">POST</span>
                    <strong>/api/webhook/drive-notifications</strong>
                    <br>Webhook de notificaciones de Drive
                </div>
            </div>

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
  console.log(`🌐 Interfaz web: http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Modo desarrollo: React debe ejecutarse por separado en puerto 3000');
  }
});