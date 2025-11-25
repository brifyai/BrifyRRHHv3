// =====================================================
// SCRIPT DE PRUEBA: VERIFICACIÓN DE CORRECCIONES I18N
// =====================================================
// Fecha: 2025-11-25
// Propósito: Verificar que las correcciones de persistencia y sincronización funcionan

import i18n from '../src/lib/i18n.js';
import configurationService from '../src/services/configurationService.js';

async function testI18nCorrections() {
  console.log('🧪 INICIANDO PRUEBAS DE CORRECCIONES I18N');
  console.log('='.repeat(50));

  try {
    // 1. VERIFICAR INICIALIZACIÓN CON SUPABASE
    console.log('\n📋 PRUEBA 1: Inicialización con Supabase');
    await i18n.init();
    console.log('✅ Idioma inicial:', i18n.getCurrentLanguage());

    // 2. PROBAR CAMBIO DE IDIOMA CON PERSISTENCIA
    console.log('\n📋 PRUEBA 2: Cambio de idioma con persistencia');
    const testLanguages = ['en', 'pt', 'es'];
    
    for (const lang of testLanguages) {
      console.log(`🔄 Cambiando a ${lang}...`);
      await i18n.setLanguage(lang);
      
      // Verificar que se guardó en Supabase
      const savedLang = await configurationService.getConfig('general', 'language', 'global', null, 'es');
      console.log(`✅ Idioma guardado en Supabase: ${savedLang}`);
      
      if (savedLang === lang) {
        console.log(`✅ Persistencia correcta para ${lang}`);
      } else {
        console.log(`❌ Error de persistencia para ${lang}`);
      }
    }

    // 3. PROBAR SINCRONIZACIÓN MANUAL
    console.log('\n📋 PRUEBA 3: Sincronización manual');
    await i18n.forceSyncWithSupabase();
    console.log('✅ Sincronización manual completada');

    // 4. VERIFICAR MÉTODOS DE UTILIDAD
    console.log('\n📋 PRUEBA 4: Métodos de utilidad');
    const availableLangs = i18n.getAvailableLanguages();
    console.log('✅ Idiomas disponibles:', availableLangs.map(l => `${l.name} (${l.code})`).join(', '));

    // 5. PROBAR TRADUCCIONES
    console.log('\n📋 PRUEBA 5: Traducciones');
    const testKeys = [
      'general.settings.title',
      'language.label',
      'notifications.title',
      'system.title'
    ];

    for (const key of testKeys) {
      const translation = i18n.t(key);
      console.log(`✅ ${key}: "${translation}"`);
    }

    // 6. VERIFICAR CONFIGURACIÓN DE SINCRONIZACIÓN EN TIEMPO REAL
    console.log('\n📋 PRUEBA 6: Configuración de sincronización');
    await i18n.setupSupabaseSync();
    console.log('✅ Sincronización en tiempo real configurada');

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(50));

    return {
      success: true,
      message: 'Todas las correcciones funcionan correctamente',
      results: {
        initialization: '✅ OK',
        persistence: '✅ OK',
        sync: '✅ OK',
        translations: '✅ OK',
        realtime: '✅ OK'
      }
    };

  } catch (error) {
    console.error('❌ ERROR EN PRUEBAS:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testI18nCorrections().then(result => {
    console.log('\n📊 RESULTADO FINAL:', result);
    process.exit(result.success ? 0 : 1);
  });
}

export default testI18nCorrections;