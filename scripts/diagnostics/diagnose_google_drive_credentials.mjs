import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseGoogleDriveCredentials() {
  console.log('🔍 Diagnosticando credenciales de Google Drive en Supabase...\n');

  try {
    // 1. Verificar que la tabla existe
    console.log('1️⃣ Verificando tabla user_google_drive_credentials...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accediendo a la tabla:', tableError.message);
      console.log('\n📋 Posibles soluciones:');
      console.log('   - Ejecutar: database/employee_folders_setup.sql');
      console.log('   - Ejecutar: database/user_google_drive_credentials.sql');
      return;
    }

    console.log('✅ Tabla existe\n');

    // 2. Obtener todos los usuarios con credenciales
    console.log('2️⃣ Buscando credenciales de Google Drive...');
    const { data: credentials, error: credError } = await supabase
      .from('user_google_drive_credentials')
      .select('*');

    if (credError) {
      console.error('❌ Error obteniendo credenciales:', credError.message);
      return;
    }

    if (!credentials || credentials.length === 0) {
      console.log('⚠️ No hay credenciales de Google Drive guardadas en Supabase');
      console.log('\n📋 Próximos pasos:');
      console.log('   1. Ve a Integraciones');
      console.log('   2. Haz clic en "Conectar Google Drive"');
      console.log('   3. Autoriza el acceso a tu cuenta de Google');
      console.log('   4. Vuelve aquí y ejecuta este script nuevamente');
      return;
    }

    console.log(`✅ Encontradas ${credentials.length} credenciales\n`);

    // 3. Mostrar detalles de cada credencial
    credentials.forEach((cred, index) => {
      console.log(`📌 Credencial ${index + 1}:`);
      console.log(`   - user_id: ${cred.user_id}`);
      console.log(`   - is_active: ${cred.is_active}`);
      console.log(`   - is_connected: ${cred.is_connected}`);
      console.log(`   - has_access_token: ${!!cred.access_token}`);
      console.log(`   - has_refresh_token: ${!!cred.refresh_token}`);
      console.log(`   - token_expires_at: ${cred.token_expires_at}`);
      console.log(`   - created_at: ${cred.created_at}`);
      console.log(`   - updated_at: ${cred.updated_at}`);
      console.log('');
    });

    // 4. Verificar si hay credenciales activas y conectadas
    const activeConnected = credentials.filter(c => c.is_active && c.is_connected && c.access_token);
    
    if (activeConnected.length === 0) {
      console.log('⚠️ No hay credenciales activas y conectadas con access_token');
      console.log('\n📋 Problemas detectados:');
      credentials.forEach((cred, index) => {
        const issues = [];
        if (!cred.is_active) issues.push('no está activa');
        if (!cred.is_connected) issues.push('no está conectada');
        if (!cred.access_token) issues.push('no tiene access_token');
        if (issues.length > 0) {
          console.log(`   - Credencial ${index + 1}: ${issues.join(', ')}`);
        }
      });
      return;
    }

    console.log(`✅ Hay ${activeConnected.length} credencial(es) activa(s) y conectada(s)`);
    console.log('\n🎉 Las credenciales están correctamente guardadas en Supabase');
    console.log('   Si aún ves "Google Drive no autenticado", el problema está en:');
    console.log('   - googleDriveTokenBridge.js no está sincronizando correctamente');
    console.log('   - googleDriveAuthService.js no está validando los tokens');
    console.log('   - EmployeeFolders.js no está inicializando el bridge');

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message);
  }
}

diagnoseGoogleDriveCredentials();
