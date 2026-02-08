#!/usr/bin/env node

/**
 * Script para diagnosticar la conectividad con Supabase
 * Verifica que todos los endpoints estén respondiendo correctamente
 */

import https from 'https';
import http from 'http';

const SUPABASE_URL = 'https://supabase.staffhub.cl';
const APP_URL = 'https://www.staffhub.cl';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'StaffHub-Diagnostic/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        url: url
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        url: url
      });
    });
  });
}

async function testEndpoint(name, url, expectedStatuses = [200, 401]) {
  log(`\n🔍 Probando: ${name}`, 'cyan');
  log(`   URL: ${url}`, 'blue');
  
  const result = await makeRequest(url);
  
  if (!result.success) {
    log(`   ❌ Error: ${result.error}`, 'red');
    return false;
  }
  
  const isExpected = expectedStatuses.includes(result.statusCode);
  const statusColor = isExpected ? 'green' : 'yellow';
  
  log(`   📊 Status: ${result.statusCode}`, statusColor);
  
  if (result.statusCode === 502) {
    log(`   ❌ BAD GATEWAY - Supabase no está accesible`, 'red');
    log(`   💡 Solución: Revisa la configuración de Docker Compose en EasyPanel`, 'yellow');
    return false;
  }
  
  if (result.statusCode === 404) {
    log(`   ⚠️  NOT FOUND - El endpoint no existe`, 'yellow');
    return false;
  }
  
  if (result.statusCode === 401) {
    log(`   ✅ Unauthorized (esperado) - El servicio está funcionando`, 'green');
    return true;
  }
  
  if (result.statusCode === 200) {
    log(`   ✅ OK - El servicio está funcionando`, 'green');
    
    // Intentar parsear JSON
    try {
      const json = JSON.parse(result.body);
      log(`   📄 Respuesta: ${JSON.stringify(json).substring(0, 100)}...`, 'blue');
    } catch (e) {
      log(`   📄 Respuesta: ${result.body.substring(0, 100)}...`, 'blue');
    }
    
    return true;
  }
  
  log(`   ⚠️  Status inesperado: ${result.statusCode}`, 'yellow');
  return false;
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     DIAGNÓSTICO DE CONECTIVIDAD - STAFFHUB + SUPABASE     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    app: false,
    supabaseRest: false,
    supabaseAuth: false,
    supabaseHealth: false
  };
  
  // Test 1: Aplicación principal
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 1: APLICACIÓN PRINCIPAL', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  results.app = await testEndpoint('Aplicación StaffHub', APP_URL, [200, 301, 302]);
  
  // Test 2: Supabase REST API
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 2: SUPABASE REST API', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  results.supabaseRest = await testEndpoint('Supabase REST API', `${SUPABASE_URL}/rest/v1/`, [200, 401]);
  
  // Test 3: Supabase Auth
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 3: SUPABASE AUTH', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  results.supabaseAuth = await testEndpoint('Supabase Auth', `${SUPABASE_URL}/auth/v1/health`, [200]);
  
  // Test 4: Supabase Health
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 4: SUPABASE HEALTH', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  results.supabaseHealth = await testEndpoint('Supabase Health', `${SUPABASE_URL}/`, [200, 301, 302]);
  
  // Resumen
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      RESUMEN DE RESULTADOS                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const appStatus = results.app ? '✅ OK' : '❌ FALLO';
  const restStatus = results.supabaseRest ? '✅ OK' : '❌ FALLO';
  const authStatus = results.supabaseAuth ? '✅ OK' : '❌ FALLO';
  const healthStatus = results.supabaseHealth ? '✅ OK' : '❌ FALLO';
  
  log(`\n📱 Aplicación StaffHub:     ${appStatus}`, results.app ? 'green' : 'red');
  log(`🔌 Supabase REST API:      ${restStatus}`, results.supabaseRest ? 'green' : 'red');
  log(`🔐 Supabase Auth:          ${authStatus}`, results.supabaseAuth ? 'green' : 'red');
  log(`💚 Supabase Health:        ${healthStatus}`, results.supabaseHealth ? 'green' : 'red');
  
  // Diagnóstico
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                         DIAGNÓSTICO                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  if (results.app && results.supabaseRest && results.supabaseAuth) {
    log('\n✅ TODO FUNCIONA CORRECTAMENTE', 'green');
    log('   Puedes proceder a probar el login en la aplicación', 'green');
  } else if (!results.app) {
    log('\n❌ PROBLEMA: La aplicación no está accesible', 'red');
    log('   Solución:', 'yellow');
    log('   1. Verifica que el servicio esté corriendo en EasyPanel', 'yellow');
    log('   2. Verifica que el dominio apunte al puerto 4004', 'yellow');
    log('   3. Revisa los logs del servicio en EasyPanel', 'yellow');
  } else if (!results.supabaseRest || !results.supabaseAuth) {
    log('\n❌ PROBLEMA: Supabase no está accesible', 'red');
    log('   Solución:', 'yellow');
    log('   1. Revisa el archivo docker-compose.yml en EasyPanel', 'yellow');
    log('   2. Verifica que Kong esté corriendo en el puerto 8000', 'yellow');
    log('   3. Verifica que el dominio apunte al puerto 8000', 'yellow');
    log('   4. Lee el archivo FIX_SUPABASE_502_ERROR.md para más detalles', 'yellow');
    log('   5. Espera 5-10 minutos después de hacer cambios', 'yellow');
  }
  
  // Siguiente paso
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                       SIGUIENTE PASO                       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  if (results.supabaseRest && results.supabaseAuth) {
    log('\n✅ Supabase está funcionando', 'green');
    log('   Siguiente paso: Verificar que las claves JWT coincidan', 'cyan');
    log('   Lee: APLICAR_CLAVES_SEGURAS.md', 'cyan');
  } else {
    log('\n⚠️  Primero debes arreglar Supabase', 'yellow');
    log('   Lee: FIX_SUPABASE_502_ERROR.md', 'cyan');
    log('   Ejecuta este script nuevamente después de hacer cambios', 'cyan');
  }
  
  log('\n');
}

main().catch(console.error);
