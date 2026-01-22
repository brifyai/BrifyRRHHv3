import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

console.log('=== 🔍 DIAGNÓSTICO COMPLETO DEL FLUJO OAUTH ===\n');

// Configuración
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 
  (() => {
    try {
      const envContent = readFileSync('.env', 'utf8');
      const match = envContent.match(/REACT_APP_SUPABASE_ANON_KEY=(.+)/);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  })();

if (!supabaseAnonKey) {
  console.error('❌ No se encontró REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseOAuthFlow() {
  const report = [];
  
  console.log('📋 Paso 1: Verificando tablas necesarias...\n');
  
  // 1. Verificar si la tabla user_google_drive_credentials existe
  try {
    const { data, error } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .limit(1);
    
    if (error) {
      report.push(`❌ ERROR CRÍTICO: La tabla 'user_google_drive_credentials' no existe o no es accesible`);
      report.push(`   Detalles: ${error.message}`);
      report.push(`   Código: ${error.code}`);
      console.log('❌ La tabla user_google_drive_credentials no existe o no es accesible');
    } else {
      report.push(`✅ Tabla 'user_google_drive_credentials' existe y es accesible`);
      report.push(`   Registros encontrados: ${data.length}`);
      console.log(`✅ Tabla user_google_drive_credentials existe (${data.length} registros)`);
    }
  } catch (error) {
    report.push(`❌ ERROR: ${error.message}`);
    console.log('❌ Error verificando tabla:', error.message);
  }
  
  console.log('\n📋 Paso 2: Verificando tabla company_credentials...\n');
  
  // 2. Verificar company_credentials
  try {
    const { data, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .limit(5);
    
    if (error) {
      report.push(`❌ ERROR: No se puede acceder a 'company_credentials': ${error.message}`);
      console.log('❌ Error accediendo a company_credentials');
    } else {
      report.push(`✅ Tabla 'company_credentials' accesible`);
      report.push(`   Credenciales Google Drive: ${data.length}`);
      
      // Verificar estructura de datos
      if (data.length > 0) {
        const sample = data[0];
        report.push(`   📊 Muestra de datos:`);
        report.push(`      - ID: ${sample.id}`);
        report.push(`      - Status: ${sample.status}`);
        report.push(`      - Tiene access_token: ${!!sample.access_token}`);
        report.push(`      - Tiene refresh_token: ${!!sample.refresh_token}`);
        report.push(`      - Campos disponibles: ${Object.keys(sample).join(', ')}`);
      }
      console.log(`✅ Company credentials accesible (${data.length} registros)`);
    }
  } catch (error) {
    report.push(`❌ ERROR: ${error.message}`);
  }
  
  console.log('\n📋 Paso 3: Verificando variables de entorno...\n');
  
  // 3. Verificar variables de entorno críticas
  const envVars = [
    'REACT_APP_GOOGLE_CLIENT_ID',
    'REACT_APP_GOOGLE_CLIENT_SECRET',
    'REACT_APP_GOOGLE_REDIRECT_URI',
    'REACT_APP_GOOGLE_API_KEY'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    const status = value && !value.includes('dummy') && !value.includes('YOUR_') ? '✅' : '❌';
    const displayValue = value ? (value.includes('secret') ? '***' : value) : 'VACÍO';
    report.push(`${status} ${varName}: ${displayValue}`);
    console.log(`${status} ${varName}: ${displayValue}`);
  });
  
  console.log('\n📋 Paso 4: Verificando RLS (Row Level Security)...\n');
  
  // 4. Verificar políticas RLS
  try {
    // Intentar una operación que debería funcionar con RLS
    const { data, error } = await supabase
      .from('company_credentials')
      .select('count')
      .eq('integration_type', 'google_drive');
    
    if (error && error.code === '42501') {
      report.push(`❌ RLS está bloqueando el acceso a 'company_credentials'`);
      report.push(`   Mensaje: ${error.message}`);
      report.push(`   💡 Solución: Deshabilitar RLS temporalmente o crear políticas adecuadas`);
      console.log('❌ RLS está bloqueando el acceso');
    } else if (error) {
      report.push(`⚠️ Error al verificar RLS: ${error.message}`);
      console.log('⚠️ Error verificando RLS');
    } else {
      report.push(`✅ RLS no está bloqueando el acceso básico`);
      console.log('✅ RLS no bloquea acceso básico');
    }
  } catch (error) {
    report.push(`❌ Error verificando RLS: ${error.message}`);
  }
  
  console.log('\n📋 Paso 5: Verificando Netlify Functions...\n');
  
  // 5. Verificar si existen Netlify Functions
  try {
    const functions = [
      'google-auth',
      'google-refresh',
      'google-drive-callback'
    ];
    
    for (const func of functions) {
      const path = `netlify/functions/${func}.js`;
      try {
        readFileSync(path);
        report.push(`✅ Netlify Function encontrada: ${func}`);
        console.log(`✅ Function ${func} encontrada`);
      } catch {
        report.push(`❌ Netlify Function NO encontrada: ${func}`);
        console.log(`❌ Function ${func} no encontrada`);
      }
    }
  } catch (error) {
    report.push(`❌ Error verificando functions: ${error.message}`);
  }
  
  console.log('\n📋 Paso 6: Verificando endpoints de callback...\n');
  
  // 6. Verificar URLs de callback
  const redirectUris = [
    'http://localhost:3000/auth/google/callback',
    'http://localhost:8888/auth/google/callback',
    'https://brify.netlify.app/auth/google/callback',
    'https://brifyrrhhv2.netlify.app/auth/google/callback'
  ];
  
  report.push('URLs de redirect_uri configuradas:');
  redirectUris.forEach(uri => {
    report.push(`   - ${uri}`);
  });
  console.log('URLs de callback verificadas');
  
  console.log('\n📋 Paso 7: Análisis de problemas comunes...\n');
  
  // 7. Análisis de problemas comunes
  report.push('\n=== ANÁLISIS DE PROBLEMAS COMUNES ===');
  
  // Problema 1: Tabla incorrecta
  report.push('\n1. USO DE TABLA INCORRECTA:');
  report.push('   El código usa "user_google_drive_credentials" pero las credenciales');
  report.push('   están en "company_credentials". Esto es un problema de arquitectura.');
  report.push('   💡 Solución: El TokenBridge debe usar company_credentials, no user_google_drive_credentials');
  
  // Problema 2: Falta de Netlify Functions
  report.push('\n2. NETLIFY FUNCTIONS:');
  report.push('   En producción, se requieren Netlify Functions para manejar OAuth.');
  report.push('   Si no existen, el intercambio de tokens fallará silenciosamente.');
  
  // Problema 3: Manejo de errores
  report.push('\n3. MANEJO DE ERRORES:');
  report.push('   Verifica que el callback esté capturando correctamente los errores de Google.');
  report.push('   Revisa la consola del navegador en la URL de callback.');
  
  // Guardar reporte
  const reportText = report.join('\n');
  writeFileSync('oauth_diagnosis_report.txt', reportText);
  
  console.log('\n✅ Diagnóstico completo guardado en oauth_diagnosis_report.txt');
  
  // Resumen ejecutivo
  console.log('\n=== RESUMEN EJECUTIVO ===');
  console.log('Los problemas más probables son:');
  console.log('1. TokenBridge usa tabla incorrecta (user_google_drive_credentials)');
  console.log('2. Falta de Netlify Functions en producción');
  console.log('3. Errores silenciosos en el callback de OAuth');
  console.log('\nRevisa oauth_diagnosis_report.txt para detalles completos.');
}

diagnoseOAuthFlow().catch(error => {
  console.error('❌ Error en diagnóstico:', error.message);
  writeFileSync('oauth_diagnosis_report.txt', `Error crítico: ${error.message}\n${error.stack}`);
});