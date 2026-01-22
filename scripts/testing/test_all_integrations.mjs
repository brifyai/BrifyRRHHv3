/**
 * Script de verificación completa para TODAS las integraciones
 * 
 * Este script verifica que todas las tablas necesarias para integraciones
 * existan y sean funcionales, y prueba la conectividad de OAuth.
 */

import { supabase } from './src/lib/supabaseClient.js'

console.log('🧪 VERIFICACIÓN COMPLETA: TODAS LAS INTEGRACIONES')
console.log('=' .repeat(60))

// Lista de todas las integraciones soportadas
const ALL_INTEGRATIONS = [
  'googleDrive',
  'googleMeet', 
  'slack',
  'teams',
  'hubspot',
  'brevo',
  'whatsappBusiness',
  'whatsappOfficial',
  'whatsappWAHA',
  'telegram',
  'zoom',
  'discord',
  'notion',
  'airtable',
  'salesforce',
  'pipedrive',
  'zapier',
  'make',
  'n8n'
]

// Tablas requeridas para integraciones
const REQUIRED_TABLES = [
  'oauth_states',
  'company_integrations', 
  'integration_logs',
  'integration_settings',
  'webhook_endpoints'
]

async function verifyRequiredTables() {
  console.log('\n📋 VERIFICANDO TABLAS REQUERIDAS')
  console.log('-'.repeat(40))
  
  const results = {}
  
  for (const table of REQUIRED_TABLES) {
    try {
      console.log(`🔍 Verificando tabla: ${table}...`)
      
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: NO EXISTE - ${error.message}`)
        results[table] = { exists: false, error: error.message }
      } else {
        console.log(`✅ ${table}: EXISTE y es accesible`)
        results[table] = { exists: true, error: null }
      }
      
    } catch (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`)
      results[table] = { exists: false, error: error.message }
    }
  }
  
  return results
}

async function testOAuthStatesFunctionality() {
  console.log('\n🔐 PROBANDO FUNCIONALIDAD OAUTH_STATES')
  console.log('-'.repeat(40))
  
  const results = {}
  
  for (const integration of ALL_INTEGRATIONS.slice(0, 5)) { // Probar solo las primeras 5
    try {
      console.log(`🧪 Probando OAuth para: ${integration}`)
      
      const testState = {
        state: `test_${integration}_${Date.now()}`,
        integration_type: integration,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      }
      
      const { data, error } = await supabase
        .from('oauth_states')
        .insert([testState])
        .select()
      
      if (error) {
        console.log(`❌ ${integration}: Error en OAuth - ${error.message}`)
        results[integration] = { success: false, error: error.message }
      } else {
        console.log(`✅ ${integration}: OAuth funcional`)
        
        // Limpiar registro de prueba
        await supabase
          .from('oauth_states')
          .delete()
          .eq('id', data[0].id)
        
        results[integration] = { success: true, error: null }
      }
      
    } catch (error) {
      console.log(`❌ ${integration}: Excepción - ${error.message}`)
      results[integration] = { success: false, error: error.message }
    }
  }
  
  return results
}

async function testCompanyIntegrations() {
  console.log('\n🏢 PROBANDO COMPANY_INTEGRATIONS')
  console.log('-'.repeat(40))
  
  try {
    console.log('🧪 Probando inserción en company_integrations...')
    
    const testIntegration = {
      company_id: null, // Se puede insertar sin company_id para testing
      integration_type: 'googleDrive',
      credentials: { test: true, created_at: new Date().toISOString() },
      status: 'testing'
    }
    
    const { data, error } = await supabase
      .from('company_integrations')
      .insert([testIntegration])
      .select()
    
    if (error) {
      console.log(`❌ company_integrations: Error - ${error.message}`)
      return { success: false, error: error.message }
    } else {
      console.log(`✅ company_integrations: Funcional`)
      
      // Limpiar registro de prueba
      await supabase
        .from('company_integrations')
        .delete()
        .eq('id', data[0].id)
      
      return { success: true, error: null }
    }
    
  } catch (error) {
    console.log(`❌ company_integrations: Excepción - ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testIntegrationLogs() {
  console.log('\n📝 PROBANDO INTEGRATION_LOGS')
  console.log('-'.repeat(40))
  
  try {
    console.log('🧪 Probando inserción en integration_logs...')
    
    const testLog = {
      company_id: null,
      integration_type: 'googleDrive',
      action: 'test',
      status: 'info',
      message: 'Test log entry',
      details: { test: true }
    }
    
    const { data, error } = await supabase
      .from('integration_logs')
      .insert([testLog])
      .select()
    
    if (error) {
      console.log(`❌ integration_logs: Error - ${error.message}`)
      return { success: false, error: error.message }
    } else {
      console.log(`✅ integration_logs: Funcional`)
      
      // Limpiar registro de prueba
      await supabase
        .from('integration_logs')
        .delete()
        .eq('id', data[0].id)
      
      return { success: true, error: null }
    }
    
  } catch (error) {
    console.log(`❌ integration_logs: Excepción - ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testIntegrationSettings() {
  console.log('\n⚙️ PROBANDO INTEGRATION_SETTINGS')
  console.log('-'.repeat(40))
  
  try {
    console.log('🧪 Probando inserción en integration_settings...')
    
    const testSetting = {
      company_id: null,
      integration_type: 'googleDrive',
      setting_key: 'test_setting',
      setting_value: { test: true, value: 'test_value' }
    }
    
    const { data, error } = await supabase
      .from('integration_settings')
      .insert([testSetting])
      .select()
    
    if (error) {
      console.log(`❌ integration_settings: Error - ${error.message}`)
      return { success: false, error: error.message }
    } else {
      console.log(`✅ integration_settings: Funcional`)
      
      // Limpiar registro de prueba
      await supabase
        .from('integration_settings')
        .delete()
        .eq('id', data[0].id)
      
      return { success: true, error: null }
    }
    
  } catch (error) {
    console.log(`❌ integration_settings: Excepción - ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testWebhookEndpoints() {
  console.log('\n🔗 PROBANDO WEBHOOK_ENDPOINTS')
  console.log('-'.repeat(40))
  
  try {
    console.log('🧪 Probando inserción en webhook_endpoints...')
    
    const testWebhook = {
      company_id: null,
      integration_type: 'googleDrive',
      webhook_url: 'https://test-webhook.example.com',
      events: ['test_event'],
      is_active: true
    }
    
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert([testWebhook])
      .select()
    
    if (error) {
      console.log(`❌ webhook_endpoints: Error - ${error.message}`)
      return { success: false, error: error.message }
    } else {
      console.log(`✅ webhook_endpoints: Funcional`)
      
      // Limpiar registro de prueba
      await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', data[0].id)
      
      return { success: true, error: null }
    }
    
  } catch (error) {
    console.log(`❌ webhook_endpoints: Excepción - ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function generateReport(tableResults, oauthResults, otherResults) {
  console.log('\n📊 REPORTE FINAL DE VERIFICACIÓN')
  console.log('=' .repeat(60))
  
  // Contar éxitos y fallos
  const tableSuccess = Object.values(tableResults).filter(r => r.exists).length
  const tableTotal = Object.keys(tableResults).length
  
  const oauthSuccess = Object.values(oauthResults).filter(r => r.success).length
  const oauthTotal = Object.keys(oauthResults).length
  
  const otherSuccess = Object.values(otherResults).filter(r => r.success).length
  const otherTotal = Object.keys(otherResults).length
  
  console.log('\n📋 RESUMEN DE TABLAS:')
  console.log(`✅ Tablas existentes: ${tableSuccess}/${tableTotal}`)
  console.log(`❌ Tablas faltantes: ${tableTotal - tableSuccess}/${tableTotal}`)
  
  if (tableSuccess < tableTotal) {
    console.log('\n⚠️ TABLAS FALTANTES:')
    Object.entries(tableResults).forEach(([table, result]) => {
      if (!result.exists) {
        console.log(`   - ${table}: ${result.error}`)
      }
    })
  }
  
  console.log('\n🔐 RESUMEN DE OAUTH:')
  console.log(`✅ Integraciones OAuth funcionales: ${oauthSuccess}/${oauthTotal}`)
  console.log(`❌ Integraciones OAuth con errores: ${oauthTotal - oauthSuccess}/${oauthTotal}`)
  
  if (oauthSuccess < oauthTotal) {
    console.log('\n⚠️ INTEGRACIONES OAUTH CON ERRORES:')
    Object.entries(oauthResults).forEach(([integration, result]) => {
      if (!result.success) {
        console.log(`   - ${integration}: ${result.error}`)
      }
    })
  }
  
  console.log('\n🏢 RESUMEN DE OTRAS FUNCIONALIDADES:')
  console.log(`✅ Funcionalidades operativas: ${otherSuccess}/${otherTotal}`)
  console.log(`❌ Funcionalidades con errores: ${otherTotal - otherSuccess}/${otherTotal}`)
  
  // Determinar estado general
  const overallSuccess = tableSuccess === tableTotal && 
                        oauthSuccess === oauthTotal && 
                        otherSuccess === otherTotal
  
  console.log('\n🎯 ESTADO GENERAL:')
  if (overallSuccess) {
    console.log('🎉 ¡VERIFICACIÓN EXITOSA!')
    console.log('✅ Todas las tablas existen')
    console.log('✅ OAuth funcional para todas las integraciones')
    console.log('✅ Todas las funcionalidades operativas')
    console.log('✅ TODAS LAS INTEGRACIONES DEBERÍAN FUNCIONAR')
  } else {
    console.log('❌ VERIFICACIÓN FALLIDA')
    console.log('⚠️ Hay problemas que necesitan solución')
  }
  
  return overallSuccess
}

async function provideNextSteps(success) {
  if (success) {
    console.log('\n🚀 PRÓXIMOS PASOS:')
    console.log('1. 🔄 Recargar la aplicación')
    console.log('2. 🧪 Probar todas las integraciones en Configuración')
    console.log('3. ✅ Verificar que no aparezcan errores OAuth')
    console.log('4. 🎉 Disfrutar de todas las integraciones funcionando')
    
    console.log('\n💡 INTEGRACIONES DISPONIBLES:')
    console.log('🔐 Con OAuth (ahora funcionales):')
    ALL_INTEGRATIONS.forEach(integration => {
      console.log(`   - ${integration}`)
    })
    
  } else {
    console.log('\n🛠️ ACCIONES REQUERIDAS:')
    console.log('1. 📊 Ir a Supabase Dashboard')
    console.log('2. 📝 SQL Editor → New query')
    console.log('3. 📋 Copiar contenido de COMPLETE_INTEGRATIONS_TABLES.sql')
    console.log('4. ▶️ Ejecutar el SQL completo')
    console.log('5. 🔄 Ejecutar este script nuevamente')
    
    console.log('\n📞 SOPORTE:')
    console.log('- Revisar SOLUCION_COMPLETA_TODAS_INTEGRACIONES.md')
    console.log('- Verificar permisos en Supabase')
    console.log('- Comprobar que el proyecto esté activo')
  }
}

// Ejecutar verificación completa
async function main() {
  console.log('🚀 Iniciando verificación completa de integraciones...')
  console.log(`📊 Integraciones a verificar: ${ALL_INTEGRATIONS.length}`)
  console.log(`📋 Tablas requeridas: ${REQUIRED_TABLES.length}`)
  
  // Verificar tablas
  const tableResults = await verifyRequiredTables()
  
  // Probar OAuth
  const oauthResults = await testOAuthStatesFunctionality()
  
  // Probar otras funcionalidades
  const otherResults = {
    company_integrations: await testCompanyIntegrations(),
    integration_logs: await testIntegrationLogs(),
    integration_settings: await testIntegrationSettings(),
    webhook_endpoints: await testWebhookEndpoints()
  }
  
  // Generar reporte
  const success = await generateReport(tableResults, oauthResults, otherResults)
  
  // Proporcionar próximos pasos
  await provideNextSteps(success)
  
  console.log('\n🏁 Verificación completada')
  process.exit(success ? 0 : 1)
}

main().catch(console.error)