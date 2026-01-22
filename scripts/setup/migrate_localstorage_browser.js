/**
 * SCRIPT DE MIGRACIÓN PARA NAVEGADOR: localStorage → Supabase
 *
 * Este script se ejecuta en el navegador para migrar
 * configuraciones de localStorage a Supabase.
 *
 * Uso: Copia y pega este código en la consola del navegador
 * cuando estés logueado en la aplicación.
 */

(async function migrateLocalStorageToSupabase() {
  console.log('🚀 Iniciando migración de localStorage a Supabase...\n');

  try {
    // Verificar que estamos en un navegador con localStorage
    if (typeof localStorage === 'undefined') {
      console.error('❌ localStorage no disponible. Este script debe ejecutarse en un navegador.');
      return;
    }

    // Verificar que Supabase está disponible
    if (typeof window.supabase === 'undefined' && typeof window.supabaseClient === 'undefined') {
      console.error('❌ Supabase no disponible. Asegúrate de estar en la aplicación.');
      return;
    }

    const supabase = window.supabase || window.supabaseClient;

    // Obtener todas las claves relevantes de localStorage
    const relevantKeys = Object.keys(localStorage).filter(key =>
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

    console.log(`📋 Encontradas ${relevantKeys.length} configuraciones para migrar:`);
    relevantKeys.forEach(key => console.log(`   • ${key}`));
    console.log('');

    // Función para mapear claves
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

    // Migrar cada configuración
    let migratedCount = 0;
    let errorCount = 0;

    for (const key of relevantKeys) {
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

        // Guardar en Supabase
        const { data, error } = await supabase
          .from('system_configurations')
          .upsert({
            user_id: supabase.auth.user()?.id,
            scope: 'global',
            company_id: null,
            category,
            config_key: configKey,
            config_value: parsedValue,
            description: `Migrado desde localStorage: ${key}`,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,scope,company_id,category,config_key'
          })
          .select();

        if (error) throw error;

        console.log(`✅ Migrado: ${key} → ${category}.${configKey}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrando ${key}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 RESULTADOS DE MIGRACIÓN:');
    console.log(`   ✅ Configuraciones migradas: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (migratedCount > 0) {
      console.log('\n🎯 PRÓXIMOS PASOS:');
      console.log('   1. Verifica las configuraciones en Supabase Dashboard');
      console.log('   2. Prueba que las integraciones funcionan correctamente');
      console.log('   3. Actualiza los componentes para usar configurationService');
      console.log('   4. Considera limpiar localStorage después de verificar funcionamiento');
    }

    console.log('\n✨ Migración completada!');

    // Mostrar resumen detallado
    if (migratedCount > 0) {
      console.log('\n📋 CONFIGURACIONES MIGRADAS:');
      relevantKeys.forEach(key => {
        const { category, configKey } = mapLocalStorageKey(key);
        console.log(`   ${key} → system_configurations (${category}.${configKey})`);
      });
    }

  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
})();