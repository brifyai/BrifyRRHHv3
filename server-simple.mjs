// Cargar variables de entorno GLOBALMENTE ANTES de cualquier import
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno manualmente solo si el archivo existe
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');

    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
    console.log('✅ Variables de entorno cargadas desde .env');
  } catch (error) {
    console.error('❌ Error leyendo .env:', error.message);
  }
} else {
  // En producción, las variables vienen del contenedor
  console.log('ℹ️  Usando variables de entorno del sistema (producción)');
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// También intentar con dotenv como respaldo
dotenv.config({ path: join(__dirname, '.env') });

// Importar cliente de Supabase para servidor con manejo de errores
let supabaseServer = null;
const loadSupabaseServer = async () => {
  if (!supabaseServer) {
    try {
      const module = await import('./src/lib/supabaseServer.js');
      supabaseServer = module.default || module.supabaseServer;
      console.log('✅ Supabase Server cargado correctamente');
    } catch (error) {
      console.error('⚠️  Error cargando Supabase Server:', error.message);
      console.log('ℹ️  El servidor continuará sin Supabase Server');
    }
  }
  return supabaseServer;
};

const app = express();
const PORT = process.env.PORT || 4004;

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Si CORS_ALLOW_ALL está habilitado, permitir todos los orígenes
    if (process.env.CORS_ALLOW_ALL === 'true') {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'https://www.staffhub.cl',
      'https://staffhub.cl',
      'https://supabase.staffhub.cl',
      'null' // Para archivos locales abiertos en navegador
    ];

    // Permitir archivos locales y orígenes permitidos
    if (allowedOrigins.indexOf(origin) !== -1 || !origin || origin === 'null') {
      callback(null, true);
    } else {
      console.log('CORS rechazado para origen:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de seguridad básico
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const buildPath = join(__dirname, 'build');
  app.use(express.static(buildPath));
  console.log('📦 Sirviendo archivos estáticos desde:', buildPath);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para verificar estado de credenciales de Google Drive
app.get('/api/google-drive/status', (req, res) => {
  try {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;

    console.log('🔍 Verificando credenciales de Google Drive:');
    console.log('- Client ID presente:', !!clientId);
    console.log('- Client Secret presente:', !!clientSecret);
    console.log('- Redirect URI presente:', !!redirectUri);

    // Verificar si las credenciales están configuradas y válidas
    const hasValidCredentials = !!(
      clientId &&
      clientSecret &&
      redirectUri &&
      !clientId.includes('tu_google_client_id') &&
      !clientId.includes('YOUR_GOOGLE_CLIENT_ID_HERE') &&
      !clientSecret.includes('tu_google_client_secret') &&
      !clientSecret.includes('YOUR_GOOGLE_CLIENT_SECRET_HERE')
    );

    res.json({
      success: true,
      hasValidCredentials: hasValidCredentials,
      clientIdPresent: !!clientId,
      clientSecretPresent: !!clientSecret,
      redirectUriPresent: !!redirectUri,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verificando credenciales de Google Drive:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      hasValidCredentials: false
    });
  }
});

// Catch-all route para servir React app (debe estar al final, SOLO para rutas que NO son /api/*)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // No capturar rutas de API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(join(__dirname, 'build', 'index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor simple ejecutándose en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔍 Endpoint de Google Drive: http://localhost:${PORT}/api/google-drive/status`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
