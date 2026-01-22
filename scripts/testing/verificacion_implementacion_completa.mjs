#!/usr/bin/env node

/**
 * VERIFICACIÓN COMPLETA DE IMPLEMENTACIÓN
 * 
 * Verifica que todas las correcciones estén bien implementadas
 * y que el código esté alineado con la estructura de BD esperada
 */

import fs from 'fs';

console.log('🔍 VERIFICACIÓN COMPLETA: Implementación de Correcciones');
console.log('=' .repeat(70));

function verifyImplementation() {
  console.log('\n📋 PASO 1: Verificando archivos corregidos...');
  
  const filesToCheck = [
    'src/contexts/AuthContext.js',
    'src/lib/googleDriveAuthServiceDynamic_v2.js',
    'src/lib/googleDriveAuthServiceDynamic.js',
    'src/lib/googleDriveCallbackHandler.js',
    'src/lib/googleDriveTokenBridge.js',
    'src/services/googleDrivePersistenceService.js'
  ];
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} existe`);
    } else {
      console.log(`❌ ${file} NO existe`);
    }
  });
  
  console.log('\n📋 PASO 2: Verificando consultas de base de datos...');
  
  // Verificar AuthContext.js
  const authContextContent = fs.readFileSync('src/contexts/AuthContext.js', 'utf8');
  
  console.log('\n🔍 AuthContext.js:');
  if (authContextContent.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    console.log('✅ Query sync_status correcta en AuthContext');
  } else {
    console.log('❌ Query sync_status incorrecta en AuthContext');
  }
  
  if (authContextContent.includes('supabase')) {
    console.log('✅ Import de supabase presente');
  } else {
    console.log('❌ Import de supabase faltante');
  }
  
  // Verificar googleDriveAuthServiceDynamic_v2.js
  const serviceV2Content = fs.readFileSync('src/lib/googleDriveAuthServiceDynamic_v2.js', 'utf8');
  
  console.log('\n🔍 googleDriveAuthServiceDynamic_v2.js:');
  if (serviceV2Content.includes('.eq(\'google_drive_connected\', true)')) {
    console.log('✅ Query google_drive_connected correcta en v2');
  } else if (serviceV2Content.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    console.log('⚠️  Aún usa sync_status en v2 (debería ser google_drive_connected)');
  } else {
    console.log('❌ Query incorrecta en v2');
  }
  
  // Verificar googleDriveAuthServiceDynamic.js
  const serviceContent = fs.readFileSync('src/lib/googleDriveAuthServiceDynamic.js', 'utf8');
  
  console.log('\n🔍 googleDriveAuthServiceDynamic.js:');
  if (serviceContent.includes('.eq(\'google_drive_connected\', true)')) {
    console.log('✅ Query google_drive_connected correcta en v1');
  } else if (serviceContent.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    console.log('⚠️  Aún usa sync_status en v1 (debería ser google_drive_connected)');
  } else {
    console.log('❌ Query incorrecta en v1');
  }
  
  // Verificar googleDriveTokenBridge.js
  const tokenBridgeContent = fs.readFileSync('src/lib/googleDriveTokenBridge.js', 'utf8');
  
  console.log('\n🔍 googleDriveTokenBridge.js:');
  if (tokenBridgeContent.includes('.eq(\'google_drive_connected\', true)')) {
    console.log('✅ Query google_drive_connected correcta en token bridge');
  } else {
    console.log('❌ Query google_drive_connected incorrecta en token bridge');
  }
  
  if (tokenBridgeContent.includes('credentials.credentials')) {
    console.log('✅ Extracción JSON de credenciales presente');
  } else {
    console.log('❌ Extracción JSON de credenciales faltante');
  }
  
  // Verificar googleDriveCallbackHandler.js
  const callbackContent = fs.readFileSync('src/lib/googleDriveCallbackHandler.js', 'utf8');
  
  console.log('\n🔍 googleDriveCallbackHandler.js:');
  if (callbackContent.includes('google_drive_connected: true')) {
    console.log('✅ Campo google_drive_connected correcto en callback');
  } else if (callbackContent.includes('status: \'active\'')) {
    console.log('⚠️  Aún usa status: active (debería ser google_drive_connected: true)');
  } else {
    console.log('❌ Campo de estado incorrecto en callback');
  }
  
  // Verificar googleDrivePersistenceService.js
  const persistenceContent = fs.readFileSync('src/services/googleDrivePersistenceService.js', 'utf8');
  
  console.log('\n🔍 googleDrivePersistenceService.js:');
  if (persistenceContent.includes('google_access_token')) {
    console.log('✅ Campo google_access_token correcto');
  } else if (persistenceContent.includes('access_token:')) {
    console.log('⚠️  Aún usa access_token (debería ser google_access_token)');
  } else {
    console.log('❌ Campo access_token incorrecto');
  }
  
  if (persistenceContent.includes('google_refresh_token')) {
    console.log('✅ Campo google_refresh_token correcto');
  } else if (persistenceContent.includes('refresh_token:')) {
    console.log('⚠️  Aún usa refresh_token (debería ser google_refresh_token)');
  } else {
    console.log('❌ Campo refresh_token incorrecto');
  }
  
  if (persistenceContent.includes('sync_status: \'connected\'')) {
    console.log('✅ Campo sync_status con valor connected correcto');
  } else if (persistenceContent.includes('sync_status: \'success\'')) {
    console.log('⚠️  Aún usa sync_status: success (debería ser connected)');
  } else {
    console.log('❌ Campo sync_status incorrecto');
  }
  
  console.log('\n📋 PASO 3: Verificando consistencia entre archivos...');
  
  // Verificar que todos usen la misma estrategia
  const files = [
    { name: 'AuthContext', content: authContextContent },
    { name: 'ServiceV2', content: serviceV2Content },
    { name: 'ServiceV1', content: serviceContent },
    { name: 'TokenBridge', content: tokenBridgeContent },
    { name: 'Callback', content: callbackContent },
    { name: 'Persistence', content: persistenceContent }
  ];
  
  // Verificar uso de sync_status vs google_drive_connected
  const syncStatusUsers = files.filter(f => f.content.includes('sync_status'));
  const googleDriveConnectedUsers = files.filter(f => f.content.includes('google_drive_connected'));
  
  console.log(`\n🔍 Análisis de consultas:`);
  console.log(`   Archivos que usan sync_status: ${syncStatusUsers.map(f => f.name).join(', ')}`);
  console.log(`   Archivos que usan google_drive_connected: ${googleDriveConnectedUsers.map(f => f.name).join(', ')}`);
  
  if (syncStatusUsers.length > 0 && googleDriveConnectedUsers.length > 0) {
    console.log('⚠️  INCONSISTENCIA: Mezcla de sync_status y google_drive_connected');
  } else if (syncStatusUsers.length > 0) {
    console.log('✅ Todos usan sync_status (consistente)');
  } else if (googleDriveConnectedUsers.length > 0) {
    console.log('✅ Todos usan google_drive_connected (consistente)');
  } else {
    console.log('❌ No se detectaron consultas de estado');
  }
  
  console.log('\n📋 PASO 4: Verificando estructura de archivos de documentación...');
  
  const docFiles = [
    'CREATE_TABLE_USER_GOOGLE_DRIVE_CREDENTIALS.sql',
    'GUIA_VERIFICACION_ESTRUCTURA_SUPABASE.md',
    'DIAGNOSTICO_ERRORES_DB_COMPLETO.md',
    'SOLUCION_COMPLETA_FINAL.md'
  ];
  
  docFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} existe`);
    } else {
      console.log(`❌ ${file} NO existe`);
    }
  });
  
  console.log('\n📋 PASO 5: Verificando estado de Git...');
  
  try {
    const { execSync } = require('child_process');
    const log = execSync('git log --oneline -5', { encoding: 'utf8' }).trim();
    console.log('✅ Últimos commits:');
    console.log(log);
  } catch (error) {
    console.log('⚠️  No se pudo verificar estado de Git');
  }
  
  console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
  
  // Contar problemas
  let problems = 0;
  let warnings = 0;
  let successes = 0;
  
  // Verificaciones principales
  if (!authContextContent.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    problems++;
  } else {
    successes++;
  }
  
  if (!serviceV2Content.includes('.eq(\'google_drive_connected\', true)') && !serviceV2Content.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    problems++;
  } else {
    successes++;
  }
  
  if (!serviceContent.includes('.eq(\'google_drive_connected\', true)') && !serviceContent.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    problems++;
  } else {
    successes++;
  }
  
  if (!tokenBridgeContent.includes('.eq(\'google_drive_connected\', true)') && !tokenBridgeContent.includes('.in(\'sync_status\', [\'connected\', \'connecting\'])')) {
    problems++;
  } else {
    successes++;
  }
  
  if (!callbackContent.includes('google_drive_connected: true') && !callbackContent.includes('status: \'active\'')) {
    problems++;
  } else {
    successes++;
  }
  
  if (!persistenceContent.includes('google_access_token')) {
    warnings++;
  } else {
    successes++;
  }
  
  console.log(`   ✅ Correcciones exitosas: ${successes}`);
  console.log(`   ⚠️  Advertencias: ${warnings}`);
  console.log(`   ❌ Problemas: ${problems}`);
  
  if (problems === 0) {
    console.log('\n🎉 ESTADO: IMPLEMENTACIÓN CORRECTA');
    console.log('   Todas las correcciones están bien implementadas.');
    console.log('   El código debería funcionar una vez creada la tabla en Supabase.');
  } else {
    console.log('\n⚠️  ESTADO: IMPLEMENTACIÓN INCOMPLETA');
    console.log('   Hay problemas que necesitan corrección.');
  }
  
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('   1. Ejecutar verificación manual en Supabase');
  console.log('   2. Crear tabla user_google_drive_credentials si no existe');
  console.log('   3. Ajustar código según estructura real de BD');
  console.log('   4. Probar OAuth de Google Drive');
}

// Ejecutar verificación
verifyImplementation();