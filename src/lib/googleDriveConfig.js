/**
 * CONFIGURACIÓN CENTRALIZADA DE GOOGLE DRIVE
 * 
 * Este archivo centraliza toda la configuración de Google Drive
 * para evitar conflictos y duplicaciones.
 */

// Detectar ambiente
const isProduction = process.env.NODE_ENV === 'production';
const isNetlify = !!process.env.NETLIFY;

// URLs base según ambiente
const getBaseUrl = () => {
  if (isNetlify) {
    return process.env.REACT_APP_NETLIFY_URL || 'https://brifyai.netlify.app';
  }
  if (isProduction) {
    return process.env.REACT_APP_PRODUCTION_URL || 'https://staffhub.app';
  }
  return 'http://localhost:3000';
};

// Configuración de Google OAuth
export const GOOGLE_DRIVE_CONFIG = {
  // Credenciales
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  
  // URLs
  baseUrl: getBaseUrl(),
  redirectUri: `${getBaseUrl()}/auth/google/callback`,
  
  // Scopes
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  
  // Configuración de OAuth
  oauth: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke'
  },
  
  // Timeouts
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  
  // Logging
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Valida que la configuración esté completa
 */
export const validateGoogleDriveConfig = () => {
  const errors = [];
  
  if (!GOOGLE_DRIVE_CONFIG.clientId) {
    errors.push('REACT_APP_GOOGLE_CLIENT_ID no está configurado');
  }
  
  if (!GOOGLE_DRIVE_CONFIG.redirectUri) {
    errors.push('REACT_APP_NETLIFY_URL o REACT_APP_PRODUCTION_URL no está configurado');
  }
  
  if (errors.length > 0) {
    console.error('❌ Errores en configuración de Google Drive:');
    errors.forEach(err => console.error(`  - ${err}`));
    return false;
  }
  
  console.log('✅ Configuración de Google Drive validada correctamente');
  console.log(`   Base URL: ${GOOGLE_DRIVE_CONFIG.baseUrl}`);
  console.log(`   Redirect URI: ${GOOGLE_DRIVE_CONFIG.redirectUri}`);
  
  return true;
};

/**
 * Obtiene la URL de autorización de Google
 */
export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_DRIVE_CONFIG.clientId,
    redirect_uri: GOOGLE_DRIVE_CONFIG.redirectUri,
    scope: GOOGLE_DRIVE_CONFIG.scopes.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `${GOOGLE_DRIVE_CONFIG.oauth.authorizationUrl}?${params.toString()}`;
};

/**
 * Obtiene información del ambiente
 */
export const getEnvironmentInfo = () => ({
  isProduction,
  isNetlify,
  baseUrl: GOOGLE_DRIVE_CONFIG.baseUrl,
  redirectUri: GOOGLE_DRIVE_CONFIG.redirectUri,
  debug: GOOGLE_DRIVE_CONFIG.debug
});

export default GOOGLE_DRIVE_CONFIG;
