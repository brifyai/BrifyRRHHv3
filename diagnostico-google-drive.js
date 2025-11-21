/**
 * Script de Diagnóstico Google Drive
 * Ejecutar en la consola del navegador (F12) para verificar la configuración
 */

console.log('🔍 === DIAGNÓSTICO GOOGLE DRIVE ===');

// 1. Verificar variables de entorno
console.log('\n📋 Variables de Entorno:');
console.log('REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID || '❌ NO CONFIGURADO');
console.log('REACT_APP_GOOGLE_CLIENT_SECRET:', process.env.REACT_APP_GOOGLE_CLIENT_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
console.log('REACT_APP_GOOGLE_REDIRECT_URI:', process.env.REACT_APP_GOOGLE_REDIRECT_URI || '❌ NO CONFIGURADO');
console.log('REACT_APP_DRIVE_MODE:', process.env.REACT_APP_DRIVE_MODE || '❌ NO CONFIGURADO');

// 2. Verificar servicio híbrido
console.log('\n🔧 Estado del Servicio:');
try {
  import('./src/lib/googleDriveRealOnly.js').then(async ({ default: hybridGoogleDrive }) => {
    try {
      await hybridGoogleDrive.initialize();
      console.log('✅ Servicio inicializado:', hybridGoogleDrive.isInitialized);
      console.log('✅ Credenciales válidas:', hybridGoogleDrive.hasValidGoogleCredentials());
      console.log('✅ Autenticado:', hybridGoogleDrive.isAuthenticated());
      
      // Información detallada del servicio
      const serviceInfo = hybridGoogleDrive.getServiceInfo();
      console.log('\n📊 Información del Servicio:');
      console.log('Servicio:', serviceInfo.service);
      console.log('Es Real:', serviceInfo.isReal);
      console.log('Inicializado:', serviceInfo.initialized);
      console.log('Tiene Credenciales:', serviceInfo.hasValidCredentials);
      console.log('Autenticado:', serviceInfo.isAuthenticated);
      
      // Características disponibles
      console.log('\n🛠️ Características Disponibles:');
      Object.entries(serviceInfo.features).forEach(([feature, available]) => {
        console.log(`${available ? '✅' : '❌'} ${feature}: ${available ? 'Disponible' : 'No disponible'}`);
      });
      
      // Estadísticas
      const stats = hybridGoogleDrive.getStats();
      console.log('\n📈 Estadísticas:');
      console.log('Tipo de Servicio:', stats.serviceType);
      console.log('Último Estado:', stats.lastSyncStatus || 'Ninguno');
      console.log('Errores:', stats.errorCount);
      
      // Verificar autenticación
      if (!serviceInfo.isAuthenticated) {
        console.log('\n🚨 ACCIÓN REQUERIDA:');
        console.log('1. Configurar variables de entorno de Google Drive');
        console.log('2. Reiniciar la aplicación');
        console.log('3. Conectar Google Drive desde la aplicación');
      } else {
        console.log('\n✅ Google Drive está configurado y autenticado');
        console.log('Las carpetas deberían aparecer en Google Drive al sincronizar.');
      }
      
    } catch (error) {
      console.error('❌ Error inicializando servicio:', error.message);
      console.log('\n🚨 ACCIÓN REQUERIDA:');
      console.log('1. Verificar variables de entorno');
      console.log('2. Consultar GUIA_CONFIGURACION_GOOGLE_DRIVE.md');
    }
  });
} catch (error) {
  console.error('❌ Error importando servicio:', error.message);
}

// 3. Verificar localStorage
console.log('\n💾 Tokens en localStorage:');
const tokenData = localStorage.getItem('google_drive_auth');
if (tokenData) {
  try {
    const tokens = JSON.parse(tokenData);
    console.log('✅ Tokens encontrados:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: tokens.expires_at || 'No especificado'
    });
  } catch (error) {
    console.log('❌ Tokens corruptos en localStorage');
  }
} else {
  console.log('❌ No hay tokens en localStorage');
}

// 4. Verificar estructura de carpetas en Supabase
console.log('\n🗂️ Verificando carpetas en Supabase:');
try {
  import('./src/lib/supabaseClient.js').then(async ({ supabase }) => {
    try {
      const { data, error } = await supabase
        .from('employee_folders')
        .select('employee_email, employee_name, drive_folder_id, drive_folder_url')
        .limit(5);
      
      if (error) {
        console.log('❌ Error consultando carpetas:', error.message);
      } else if (data && data.length > 0) {
        console.log('✅ Carpetas encontradas:', data.length);
        data.forEach(folder => {
          console.log(`  📁 ${folder.employee_name} (${folder.employee_email}):`, {
            driveFolderId: folder.drive_folder_id || 'No creado',
            driveUrl: folder.drive_folder_url || 'No creado'
          });
        });
      } else {
        console.log('⚠️ No hay carpetas de empleados en la base de datos');
      }
    } catch (error) {
      console.log('❌ Error consultando Supabase:', error.message);
    }
  });
} catch (error) {
  console.log('❌ Error importando Supabase:', error.message);
}

console.log('\n📋 === FIN DEL DIAGNÓSTICO ===');
console.log('💡 Si ves errores, consulta GUIA_CONFIGURACION_GOOGLE_DRIVE.md');