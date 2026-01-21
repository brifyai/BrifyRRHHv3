// Cargar variables de entorno GLOBALMENTE ANTES de cualquier import
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno manualmente y asignarlas globalmente
try {
  const envPath = join(__dirname, '.env');
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
  console.log('✅ Variables de entorno cargadas globalmente desde .env');
} catch (error) {
  console.error('❌ Error cargando .env:', error.message);
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// También intentar con dotenv como respaldo
dotenv.config({ path: join(__dirname, '.env') });

// Importar cliente de Supabase para servidor
import { supabaseServer } from './src/lib/supabaseServer.js';

// Importar supabaseDatabase dinámicamente para evitar problemas de módulos
let supabaseDatabase = null;
const loadSupabaseDatabase = async () => {
  if (!supabaseDatabase) {
    const module = await import('./src/lib/supabaseDatabase.js');
    supabaseDatabase = module.default;
  }
  return supabaseDatabase;
};

const app = express();
const PORT = process.env.PORT || 3004;

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
      'https://brifyrrhhv2.netlify.app',
      'https://staffhub.vercel.app',
      'https://supabase.imetricsstaffhub.cl',
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

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const buildPath = join(__dirname, 'build');
  app.use(express.static(buildPath));
  console.log('📦 Sirviendo archivos estáticos desde:', buildPath);
}

// Middleware de seguridad básico
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
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

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ✅ SOLUCIÓN: Endpoint de Google OAuth DESACTIVADO para permitir que React Router maneje la ruta
// El callback ahora es manejado completamente por el componente React GoogleAuthCallback
// app.get('/auth/google/callback', async (req, res) => { ... });

// Servir archivos estáticos del build de React (para desarrollo, servir desde src)
import path from 'path';

// Servir archivos estáticos del build de React
app.use(express.static(path.join(__dirname, 'build')));

// Ruta raíz - servir la aplicación React
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Funciones auxiliares para Google OAuth
async function exchangeCodeForTokens(code, codeVerifier) {
  try {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Construir parámetros del token exchange
    const params = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };

    // Incluir code_verifier si está disponible (PKCE)
    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokens = await response.json();

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope
    };
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    return null;
  }
}

async function getGoogleUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.warn('Could not fetch Google user info');
      return null;
    }

    const userInfo = await response.json();

    return {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      id: userInfo.id
    };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return null;
  }
}

async function saveGoogleCredentials(userId, tokens, userInfo = {}) {
  try {
    // Debug: Check environment variables at callback time
    console.log('🔍 Environment variables in callback:');
    console.log('- REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Present' : 'Missing');
    console.log('- REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Present' : 'Missing');

    const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    const credentialsData = {
      user_id: userId,
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token || null,
      google_token_expires_at: tokenExpiresAt.toISOString(),
      google_scope: tokens.scope || 'https://www.googleapis.com/auth/drive',
      last_used_at: new Date().toISOString(),
      metadata: {
        google_user_id: userInfo.id || null,
        google_email: userInfo.email || null,
        google_name: userInfo.name || null,
        google_avatar_url: userInfo.picture || null,
        is_connected: true,
        sync_status: 'success',
        last_sync_at: new Date().toISOString()
      }
    };

    const { data, error } = await supabaseServer
      .from('google_drive_credentials')
      .upsert(credentialsData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving Google Drive credentials:', error);
      return { success: false, error };
    }

    console.log('Google Drive credentials saved successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error in saveGoogleCredentials:', error);
    return { success: false, error: { message: error.message } };
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route para servir React app en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
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