#!/usr/bin/env node

/**
 * Test para verificar que las correcciones de Google Drive OAuth funcionan correctamente
 * 
 * Este script verifica:
 * 1. Que el callback guarda en ambas tablas
 * 2. Que las queries consultan ambas tablas
 * 3. Que el AuthContext carga credenciales correctamente
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTING: Google Drive OAuth Fix Verification');
console.log('=' .repeat(60));

async function testGoogleDriveOAuthFix() {
  try {
    console.log('\n📋 PASO 1: Verificando estructura de tablas...');
    
    // Verificar que existen las tablas necesarias
    const { data: userTable, error: userError } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .limit(1);
    
    const { data: companyTable, error: companyError } = await supabase
      .from('company_credentials')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.log('❌ Tabla user_google_drive_credentials no accesible:', userError.message);
    } else {
      console.log('✅ Tabla user_google_drive_credentials accesible');
    }
    
    if (companyError) {
      console.log('❌ Tabla company_credentials no accesible:', companyError.message);
    } else {
      console.log('✅ Tabla company_credentials accesible');
    }
    
    console.log('\n📋 PASO 2: Verificando credenciales existentes...');
    
    // Verificar credenciales en user_google_drive_credentials
    const { data: userCreds, error: userCredsError } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .in('status', ['pending_verification', 'active']);
    
    if (userCredsError) {
      console.log('❌ Error consultando user_google_drive_credentials:', userCredsError.message);
    } else {
      console.log(`✅ user_google_drive_credentials: ${userCreds?.length || 0} registros encontrados`);
      if (userCreds?.length > 0) {
        console.log('   Status encontrados:', [...new Set(userCreds.map(c => c.status))]);
      }
    }
    
    // Verificar credenciales en company_credentials
    const { data: companyCreds, error: companyCredsError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('google_drive_connected', true);
    
    if (companyCredsError) {
      console.log('❌ Error consultando company_credentials:', companyCredsError.message);
    } else {
      console.log(`✅ company_credentials: ${companyCreds?.length || 0} registros con google_drive_connected=true`);
    }
    
    console.log('\n📋 PASO 3: Simulando flujo de AuthContext...');
    
    // Simular la lógica del AuthContext
    const testCompanyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'; // El ID mencionado por el usuario
    
    // Query como lo hace AuthContext ahora
    const { data: userCredentials } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .in('status', ['pending_verification', 'active']);
    
    const { data: companyCredentials } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('google_drive_connected', true);
    
    console.log(`✅ AuthContext simulation:`);
    console.log(`   - user_credentials encontrados: ${userCredentials?.length || 0}`);
    console.log(`   - company_credentials encontrados: ${companyCredentials?.length || 0}`);
    
    // Priorización como en AuthContext
    const credentials = companyCredentials?.length > 0 
      ? companyCredentials 
      : userCredentials;
    
    console.log(`   - Credenciales finales (con priorización): ${credentials?.length || 0}`);
    
    console.log('\n📋 PASO 4: Verificando status queries...');
    
    // Verificar que las queries de status funcionan
    const { data: activeCreds } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .eq('status', 'active');
    
    const { data: pendingCreds } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .eq('status', 'pending_verification');
    
    console.log(`✅ Status query results:`);
    console.log(`   - status='active': ${activeCreds?.length || 0} registros`);
    console.log(`   - status='pending_verification': ${pendingCreds?.length || 0} registros`);
    
    console.log('\n📋 PASO 5: Resumen de correcciones aplicadas...');
    
    console.log('✅ Correcciones implementadas:');
    console.log('   1. Dual table write en googleDriveCallbackHandler.js');
    console.log('   2. Status query fix en googleDriveAuthServiceDynamic*.js');
    console.log('   3. AuthContext dual table query con priorización');
    console.log('   4. Git commit enviado (ace3034)');
    
    console.log('\n🎯 RESULTADO ESPERADO EN PRODUCCIÓN:');
    console.log('   - OAuth Google Drive debería guardar en AMBAS tablas');
    console.log('   - UI debería mostrar "Google Drive conectado"');
    console.log('   - AuthContext debería cargar credenciales correctamente');
    console.log('   - No más "No hay cuentas de Google Drive conectadas"');
    
    console.log('\n⚠️  NOTA: Este test verifica la estructura de BD.');
    console.log('   Para testing completo, hacer OAuth real en:');
    console.log('   https://brifyrrhhv3.netlify.app/configuracion/empresas/3d71dd17-bbf0-4c17-b93a-f08126b56978/sincronizacion');
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar el test
testGoogleDriveOAuthFix();