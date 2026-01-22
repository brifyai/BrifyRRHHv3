/**
 * Script de verificación de la integración de Google Drive
 * Verifica que todos los componentes estén correctamente configurados
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando integración de Google Drive...\n');

const checks = [];

// 1. Verificar que existe googleDrivePersistenceService.js
const persistenceServicePath = path.join(__dirname, 'src/services/googleDrivePersistenceService.js');
checks.push({
  name: 'googleDrivePersistenceService.js existe',
  passed: fs.existsSync(persistenceServicePath),
  path: persistenceServicePath
});

// 2. Verificar que existe googleDriveCallbackHandler.js
const callbackHandlerPath = path.join(__dirname, 'src/lib/googleDriveCallbackHandler.js');
checks.push({
  name: 'googleDriveCallbackHandler.js existe',
  passed: fs.existsSync(callbackHandlerPath),
  path: callbackHandlerPath
});

// 3. Verificar que Settings.js importa los nuevos servicios
const settingsPath = path.join(__dirname, 'src/components/settings/Settings.js');
if (fs.existsSync(settingsPath)) {
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');
  checks.push({
    name: 'Settings.js importa googleDrivePersistenceService',
    passed: settingsContent.includes("import googleDrivePersistenceService from '../../services/googleDrivePersistenceService'")
  });
  checks.push({
    name: 'Settings.js importa googleDriveCallbackHandler',
    passed: settingsContent.includes("import googleDriveCallbackHandler from '../../lib/googleDriveCallbackHandler'")
  });
  checks.push({
    name: 'Settings.js usa googleDrivePersistenceService.isConnected',
    passed: settingsContent.includes('googleDrivePersistenceService.isConnected')
  });
  checks.push({
    name: 'Settings.js usa googleDriveCallbackHandler.generateAuthorizationUrl',
    passed: settingsContent.includes('googleDriveCallbackHandler.generateAuthorizationUrl')
  });
  checks.push({
    name: 'Settings.js usa googleDrivePersistenceService.disconnect',
    passed: settingsContent.includes('googleDrivePersistenceService.disconnect')
  });
}

// 4. Verificar que GoogleAuthCallback.js usa el nuevo handler
const callbackPath = path.join(__dirname, 'src/components/auth/GoogleAuthCallback.js');
if (fs.existsSync(callbackPath)) {
  const callbackContent = fs.readFileSync(callbackPath, 'utf8');
  checks.push({
    name: 'GoogleAuthCallback.js importa googleDriveCallbackHandler',
    passed: callbackContent.includes("import googleDriveCallbackHandler from '../../lib/googleDriveCallbackHandler'")
  });
  checks.push({
    name: 'GoogleAuthCallback.js usa handleAuthorizationCode',
    passed: callbackContent.includes('googleDriveCallbackHandler.handleAuthorizationCode')
  });
}

// 5. Verificar que AuthContext.js exporta los nuevos métodos
const authContextPath = path.join(__dirname, 'src/contexts/AuthContext.js');
if (fs.existsSync(authContextPath)) {
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  checks.push({
    name: 'AuthContext.js tiene updateGoogleDriveCredentials',
    passed: authContextContent.includes('const updateGoogleDriveCredentials')
  });
  checks.push({
    name: 'AuthContext.js tiene getGoogleDriveStatus',
    passed: authContextContent.includes('const getGoogleDriveStatus')
  });
  checks.push({
    name: 'AuthContext.js tiene disconnectGoogleDrive',
    passed: authContextContent.includes('const disconnectGoogleDrive')
  });
  checks.push({
    name: 'AuthContext.js exporta métodos de Google Drive',
    passed: authContextContent.includes('updateGoogleDriveCredentials,') &&
            authContextContent.includes('getGoogleDriveStatus,') &&
            authContextContent.includes('disconnectGoogleDrive,')
  });
}

// 6. Verificar que supabaseDatabase.js tiene métodos CRUD
const supabaseDatabasePath = path.join(__dirname, 'src/lib/supabaseDatabase.js');
if (fs.existsSync(supabaseDatabasePath)) {
  const dbContent = fs.readFileSync(supabaseDatabasePath, 'utf8');
  checks.push({
    name: 'supabaseDatabase.js tiene googleDriveCredentials.create',
    passed: dbContent.includes('googleDriveCredentials:') && dbContent.includes('create: async')
  });
  checks.push({
    name: 'supabaseDatabase.js tiene googleDriveCredentials.upsert',
    passed: dbContent.includes('upsert: async')
  });
  checks.push({
    name: 'supabaseDatabase.js tiene googleDriveCredentials.getByUserId',
    passed: dbContent.includes('getByUserId: async')
  });
}

// 7. Verificar que existe el archivo SQL de la tabla
const sqlPath = path.join(__dirname, 'database/user_google_drive_credentials.sql');
checks.push({
  name: 'Script SQL de la tabla existe',
  passed: fs.existsSync(sqlPath),
  path: sqlPath
});

// 8. Verificar documentación
const docsPath = path.join(__dirname, 'GOOGLE_DRIVE_PERSISTENCE_SOLUTION.md');
checks.push({
  name: 'Documentación existe',
  passed: fs.existsSync(docsPath),
  path: docsPath
});

// Mostrar resultados
console.log('📊 RESULTADOS DE LA VERIFICACIÓN:\n');

const passed = checks.filter(c => c.passed).length;
const total = checks.length;

checks.forEach((check, index) => {
  const icon = check.passed ? '✅' : '❌';
  console.log(`${icon} ${index + 1}. ${check.name}`);
  if (!check.passed && check.path) {
    console.log(`   Ruta: ${check.path}`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`📈 RESUMEN: ${passed}/${total} verificaciones pasadas (${Math.round(passed/total*100)}%)`);
console.log(`${'='.repeat(60)}\n`);

if (passed === total) {
  console.log('🎉 ¡TODOS LOS COMPONENTES ESTÁN CORRECTAMENTE CONFIGURADOS!');
  console.log('\n📋 PASOS SIGUIENTES:');
  console.log('   1. Asegúrate de que la tabla user_google_drive_credentials existe en Supabase');
  console.log('   2. Configura las credenciales de OAuth 2.0 en Google Cloud Console');
  console.log('   3. Actualiza las variables de entorno en .env');
  console.log('   4. Prueba el flujo completo de conexión en /configuracion/integraciones');
} else {
  console.log('⚠️  ALGUNOS COMPONENTES FALTAN O NO ESTÁN CONFIGURADOS CORRECTAMENTE');
  console.log('    Revisa los elementos marcados con ❌ y corrígelos antes de continuar.');
  process.exit(1);
}

process.exit(0);