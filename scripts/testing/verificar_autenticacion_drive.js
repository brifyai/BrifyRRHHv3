/**
 * Script para verificar el estado de autenticación de Google Drive
 * Ejecutar en la consola del navegador para diagnóstico rápido
 */

// Función principal de diagnóstico
function verificarAutenticacionDrive() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN GOOGLE DRIVE');
  console.log('=' .repeat(50));
  
  // 1. Verificar localStorage
  console.log('\n📦 1. ESTADO DE LOCALSTORAGE:');
  const googleDriveAuth = localStorage.getItem('google_drive_auth');
  
  if (googleDriveAuth) {
    try {
      const tokens = JSON.parse(googleDriveAuth);
      console.log('✅ Tokens encontrados en localStorage');
      console.log('   - Access Token:', tokens.access_token ? '✅ Presente' : '❌ Ausente');
      console.log('   - Refresh Token:', tokens.refresh_token ? '✅ Presente' : '❌ Ausente');
      console.log('   - Expires At:', tokens.expires_at || '❌ No definido');
      
      if (tokens.expires_at) {
        const now = new Date();
        const expiresAt = new Date(tokens.expires_at);
        const timeLeft = expiresAt - now;
        const minutesLeft = Math.floor(timeLeft / (1000 * 60));
        
        console.log('   - Tiempo restante:', minutesLeft > 0 ? `${minutesLeft} minutos` : '❌ Expirado');
        
        if (minutesLeft <= 5) {
          console.log('   ⚠️ ADVERTENCIA: Token expirará pronto o ya expiró');
        }
      }
    } catch (error) {
      console.log('❌ Error parseando tokens:', error.message);
    }
  } else {
    console.log('❌ No hay tokens en localStorage');
  }
  
  // 2. Verificar variables de entorno
  console.log('\n🌍 2. VARIABLES DE ENTORNO:');
  console.log('   - REACT_APP_GOOGLE_CLIENT_ID:', 
    process.env.REACT_APP_GOOGLE_CLIENT_ID ? 
    (process.env.REACT_APP_GOOGLE_CLIENT_ID.includes('YOUR_') ? '❌ No configurado' : '✅ Configurado') : 
    '❌ No definida'
  );
  console.log('   - REACT_APP_GOOGLE_CLIENT_SECRET:', 
    process.env.REACT_APP_GOOGLE_CLIENT_SECRET ? 
    (process.env.REACT_APP_GOOGLE_CLIENT_SECRET.includes('YOUR_') ? '❌ No configurado' : '✅ Configurado') : 
    '❌ No definida'
  );
  console.log('   - REACT_APP_GOOGLE_REDIRECT_URI:', 
    process.env.REACT_APP_GOOGLE_REDIRECT_URI || '❌ No definida'
  );
  
  // 3. Verificar servicios (si están disponibles)
  console.log('\n🛠️ 3. ESTADO DE SERVICIOS:');
  
  // Verificar googleDriveAuthService
  if (typeof window.googleDriveAuthService !== 'undefined') {
    const isAuth = window.googleDriveAuthService.isAuthenticated();
    console.log('   - googleDriveAuthService:', isAuth ? '✅ Autenticado' : '❌ No autenticado');
    
    const configInfo = window.googleDriveAuthService.getConfigInfo();
    console.log('   - Configuración:', configInfo);
  } else {
    console.log('   - googleDriveAuthService: ❌ No disponible');
  }
  
  // Verificar googleDriveSyncService
  if (typeof window.googleDriveSyncService !== 'undefined') {
    const isAuth = window.googleDriveSyncService.isAuthenticated();
    console.log('   - googleDriveSyncService:', isAuth ? '✅ Autenticado' : '❌ No autenticado');
    
    const syncStatus = window.googleDriveSyncService.getSyncStatus();
    console.log('   - Estado de sincronización:', syncStatus);
  } else {
    console.log('   - googleDriveSyncService: ❌ No disponible');
  }
  
  // 4. Verificar URL actual
  console.log('\n📍 4. INFORMACIÓN DE NAVEGACIÓN:');
  console.log('   - URL actual:', window.location.href);
  console.log('   - Hostname:', window.location.hostname);
  console.log('   - ¿Es localhost?', window.location.hostname === 'localhost' ? '✅ Sí' : '❌ No');
  
  // 5. Recomendaciones
  console.log('\n💡 5. RECOMENDACIONES:');
  
  if (!googleDriveAuth) {
    console.log('   🔹 Ve a "Integraciones" y haz clic en "Conectar Google Drive"');
  } else {
    try {
      const tokens = JSON.parse(googleDriveAuth);
      if (!tokens.expires_at || new Date(tokens.expires_at) <= new Date()) {
        console.log('   🔹 Los tokens han expirado. Reconecta Google Drive');
      } else {
        console.log('   🔹 Los tokens parecen válidos. Intenta recargar la página');
      }
    } catch (error) {
      console.log('   🔹 Hay un problema con los tokens. Limpia localStorage y reconecta');
    }
  }
  
  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID.includes('YOUR_')) {
    console.log('   🔹 Configura REACT_APP_GOOGLE_CLIENT_ID en el archivo .env');
  }
  
  console.log('\n🎯 ACCIONES INMEDIATAS:');
  console.log('   1. Ve a Integraciones → Google Drive');
  console.log('   2. Haz clic en "Conectar Google Drive"');
  console.log('   3. Autoriza los permisos solicitados');
  console.log('   4. Regresa a Carpetas de Empleados');
  console.log('   5. Intenta sincronizar nuevamente');
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 FIN DEL DIAGNÓSTICO');
}

// Función para limpiar autenticación (si es necesario)
function limpiarAutenticacionDrive() {
  console.log('🧹 Limpiando autenticación de Google Drive...');
  
  // Limpiar localStorage
  localStorage.removeItem('google_drive_auth');
  console.log('✅ localStorage limpiado');
  
  // Si los servicios están disponibles, limpiar también allí
  if (typeof window.googleDriveAuthService !== 'undefined') {
    window.googleDriveAuthService.clearTokens();
    console.log('✅ googleDriveAuthService limpiado');
  }
  
  console.log('🔄 Recarga la página y reconecta Google Drive');
}

// Hacer las funciones disponibles globalmente
window.verificarAutenticacionDrive = verificarAutenticacionDrive;
window.limpiarAutenticacionDrive = limpiarAutenticacionDrive;

// Ejecutar diagnóstico automáticamente
console.log('🔧 Script de diagnóstico cargado. Ejecuta verificarAutenticacionDrive() para iniciar');
verificarAutenticacionDrive();