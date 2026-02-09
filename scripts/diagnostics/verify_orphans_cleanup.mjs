#!/usr/bin/env node

/**
 * Script para verificar que los contenedores huérfanos fueron eliminados
 * y que Supabase está funcionando correctamente
 */

console.log('🔍 VERIFICANDO LIMPIEZA DE CONTENEDORES HUÉRFANOS\n');

const SUPABASE_URL = 'https://supabase.staffhub.cl';
const MAIN_APP_URL = 'https://www.staffhub.cl';

// Test 1: Verificar que Supabase REST API responde
async function testSupabaseRest() {
  console.log('📡 Test 1: Verificando Supabase REST API...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const text = await response.text();
    
    if (response.status === 200 || response.status === 401 || response.status === 403) {
      console.log('✅ Supabase REST API está respondiendo');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text.substring(0, 100)}...`);
      return true;
    } else if (response.status === 502) {
      console.log('❌ Error 502 - Contenedores huérfanos aún presentes o Kong no configurado');
      console.log('   Necesitas aplicar la solución de orphans');
      return false;
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
      console.log(`   Response: ${text}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error al conectar con Supabase REST API');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Verificar que la app principal está funcionando
async function testMainApp() {
  console.log('\n📱 Test 2: Verificando aplicación principal...');
  try {
    const response = await fetch(MAIN_APP_URL, {
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('✅ Aplicación principal está funcionando');
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log(`⚠️  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error al conectar con la aplicación principal');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Verificar Supabase Studio
async function testSupabaseStudio() {
  console.log('\n🎨 Test 3: Verificando Supabase Studio...');
  try {
    const response = await fetch(SUPABASE_URL, {
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('✅ Supabase Studio está accesible');
      console.log(`   Status: ${response.status}`);
      return true;
    } else if (response.status === 502) {
      console.log('❌ Error 502 en Studio - Problema con Kong o contenedores huérfanos');
      return false;
    } else {
      console.log(`⚠️  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error al conectar con Supabase Studio');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Verificar Auth endpoint
async function testSupabaseAuth() {
  console.log('\n🔐 Test 4: Verificando Supabase Auth...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET'
    });
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Supabase Auth está funcionando');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return true;
    } else if (response.status === 502) {
      console.log('❌ Error 502 en Auth - Problema con Kong o contenedores huérfanos');
      return false;
    } else {
      console.log(`⚠️  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error al conectar con Supabase Auth');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  
  const results = {
    rest: await testSupabaseRest(),
    mainApp: await testMainApp(),
    studio: await testSupabaseStudio(),
    auth: await testSupabaseAuth()
  };
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE RESULTADOS\n');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Tests pasados: ${passed}/${total}`);
  console.log(`❌ Tests fallidos: ${total - passed}/${total}\n`);
  
  if (results.rest && results.mainApp) {
    console.log('🎉 ¡ÉXITO! Los contenedores huérfanos fueron eliminados correctamente');
    console.log('   Supabase está funcionando y la app principal también\n');
    console.log('📝 PRÓXIMOS PASOS:');
    console.log('   1. Prueba el login en https://www.staffhub.cl');
    console.log('   2. Verifica que Google OAuth funciona');
    console.log('   3. Confirma que puedes acceder al dashboard\n');
  } else if (!results.rest) {
    console.log('⚠️  PROBLEMA DETECTADO: Supabase REST API no responde');
    console.log('   Esto indica que los contenedores huérfanos aún están presentes\n');
    console.log('📝 SOLUCIÓN:');
    console.log('   1. Ve a EasyPanel');
    console.log('   2. DETÉN el servicio Supabase completamente');
    console.log('   3. Espera 30 segundos');
    console.log('   4. INICIA el servicio nuevamente');
    console.log('   5. Ejecuta este script otra vez\n');
    console.log('   O lee: PASOS_EXACTOS_EASYPANEL_ORPHANS.md\n');
  } else if (!results.mainApp) {
    console.log('⚠️  PROBLEMA: La aplicación principal no responde');
    console.log('   Pero Supabase está funcionando correctamente\n');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Ejecutar
runAllTests().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
