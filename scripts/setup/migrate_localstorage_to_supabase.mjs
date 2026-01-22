#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN: localStorage → Supabase
 *
 * Migra todas las configuraciones críticas de localStorage
 * a la nueva tabla system_configurations en Supabase.
 */

import configurationService from './src/services/configurationService.js';

async function migrateLocalStorageToSupabase() {
  console.log('🚀 Iniciando migración de localStorage a Supabase...\n');

  try {
    // Verificar que estamos en un entorno con localStorage
    if (typeof localStorage === 'undefined') {
      console.log('⚠️  localStorage no disponible. Ejecutando en modo simulado...');

      // Simular algunas configuraciones para testing
      const mockConfigs = {
        'brevo_api_key': 'mock_brevo_key',
        'brevo_sms_sender': 'StaffHub',
        'brevo_email_sender': 'noreply@staffhub.com',
        'brevo_email_name': 'StaffHub',
        'brevo_test_mode': 'true',
        'whatsapp_access_token': 'mock_whatsapp_token',
        'whatsapp_phone_number_id': 'mock_phone_id',
        'whatsapp_test_mode': 'true',
        'telegram_bot_token': 'mock_telegram_token',
        'notificationSettings': JSON.stringify({
          email: { messagesSent: true, systemErrors: true },
          push: { failedMessages: true }
        }),
        'securitySettings': JSON.stringify({
          twoFactorEnabled: false,
          sessionTimeout: 30
        })
      };

      // Simular localStorage
      global.localStorage = {
        getItem: (key) => mockConfigs[key] || null,
        setItem: () => {},
        removeItem: () => {}
      };
    }

    // Obtener todas las claves de localStorage
    const allKeys = Object.keys(localStorage).filter(key =>
      key.includes('brevo') ||
      key.includes('whatsapp') ||
      key.includes('telegram') ||
      key.includes('groq') ||
      key.includes('notification') ||
      key.includes('security') ||
      key.includes('dashboard') ||
      key.includes('backup') ||
      key.includes('hierarchy')
    );

    console.log(`📋 Encontradas ${allKeys.length} configuraciones para migrar:`);
    allKeys.forEach(key => console.log(`   • ${key}`));
    console.log('');

    // Migrar cada configuración
    let migratedCount = 0;
    let errorCount = 0;

    for (const key of allKeys) {
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Si no es JSON, guardarlo como string
          parsedValue = value;
        }

        // Determinar categoría y clave de configuración
        const { category, configKey } = mapLocalStorageKey(key);

        // Migrar usando el servicio de configuración
        const success = await configurationService.setConfig(
          category,
          configKey,
          parsedValue,
          'global',
          null,
          `Migrado desde localStorage: ${key}`
        );

        if (success) {
          console.log(`✅ Migrado: ${key} → ${category}.${configKey}`);
          migratedCount++;
        } else {
          console.log(`⚠️  Error migrando: ${key}`);
          errorCount++;
        }

      } catch (error) {
        console.error(`❌ Error procesando ${key}:`, error.message);
        errorCount++;
      }
    }

    // Verificar migración ejecutando el método del servicio
    console.log('\n🔄 Ejecutando migración automática del servicio...');
    const serviceMigration = await configurationService.migrateAllFromLocalStorage();

    console.log('\n📊 RESULTADOS DE MIGRACIÓN:');
    console.log(`   ✅ Configuraciones migradas: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   🔄 Migración del servicio: ${serviceMigration ? 'Exitosa' : 'Fallida'}`);

    if (migratedCount > 0) {
      console.log('\n🎯 RECOMENDACIONES:');
      console.log('   1. Verifica las configuraciones en Supabase Dashboard');
      console.log('   2. Prueba que las integraciones funcionan correctamente');
      console.log('   3. Actualiza los componentes para usar configurationService');
      console.log('   4. Considera limpiar localStorage después de verificar funcionamiento');
    }

    console.log('\n✨ Migración completada!');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

/**
 * Mapea claves de localStorage a categorías y claves de configuración
 */
function mapLocalStorageKey(localStorageKey) {
  const mappings = {
    // Brevo
    'brevo_api_key': { category: 'integrations', configKey: 'brevo_api_key' },
    'brevo_sms_sender': { category: 'integrations', configKey: 'brevo_sms_sender' },
    'brevo_email_sender': { category: 'integrations', configKey: 'brevo_email_sender' },
    'brevo_email_name': { category: 'integrations', configKey: 'brevo_email_name' },
    'brevo_test_mode': { category: 'integrations', configKey: 'brevo_test_mode' },

    // WhatsApp
    'whatsapp_access_token': { category: 'integrations', configKey: 'whatsapp_access_token' },
    'whatsapp_phone_number_id': { category: 'integrations', configKey: 'whatsapp_phone_number_id' },
    'whatsapp_webhook_verify_token': { category: 'integrations', configKey: 'whatsapp_webhook_verify_token' },
    'whatsapp_test_mode': { category: 'integrations', configKey: 'whatsapp_test_mode' },

    // Telegram
    'telegram_bot_token': { category: 'integrations', configKey: 'telegram_bot_token' },
    'telegram_bot_username': { category: 'integrations', configKey: 'telegram_bot_username' },

    // Groq
    'groq_model': { category: 'integrations', configKey: 'groq_model' },

    // Notificaciones
    'notificationSettings': { category: 'notifications', configKey: 'settings' },

    // Seguridad
    'securitySettings': { category: 'security', configKey: 'settings' },

    // Dashboard
    'dashboardSettings': { category: 'dashboard', configKey: 'settings' },

    // Backup
    'backupSettings': { category: 'backup', configKey: 'settings' },

    // Sistema
    'hierarchyMode': { category: 'system', configKey: 'hierarchy_mode' }
  };

  return mappings[localStorageKey] || {
    category: 'system',
    configKey: localStorageKey.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
  };
}

// Ejecutar migración
migrateLocalStorageToSupabase().catch(console.error);