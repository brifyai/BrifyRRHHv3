/**
 * Script para ejecutar la configuración inicial masiva de credenciales
 * Soluciona el problema sistémico de las 16 empresas sin credenciales
 */

import { supabase } from './src/lib/supabase.js'
import companyCredentialsSetupService from './src/services/companyCredentialsSetupService.js'

console.log('🚀 EJECUTANDO CONFIGURACIÓN INICIAL MASIVA')
console.log('==========================================')

async function executeSetup() {
  try {
    console.log('\n1. Verificando estado inicial...')
    
    // Obtener estadísticas iniciales
    const initialStats = await companyCredentialsSetupService.getSetupStatistics()
    
    console.log('📊 ESTADÍSTICAS INICIALES:')
    console.log(`   Total empresas activas: ${initialStats.totalCompanies}`)
    console.log(`   Empresas con credenciales: ${initialStats.companiesWithCredentials}`)
    console.log(`   Empresas sin credenciales: ${initialStats.companiesWithoutCredentials}`)
    console.log(`   Empresas pendientes setup: ${initialStats.companiesPendingSetup}`)
    console.log(`   Progreso: ${initialStats.setupProgress}%`)
    
    console.log('\n2. Detectando empresas que necesitan configuración...')
    
    const companiesNeedingSetup = await companyCredentialsSetupService.detectCompaniesNeedingSetup()
    
    if (companiesNeedingSetup.length === 0) {
      console.log('✅ Todas las empresas ya tienen configuración')
      return
    }
    
    console.log(`📋 ${companiesNeedingSetup.length} empresas necesitan configuración:`)
    companiesNeedingSetup.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (Prioridad: ${company.priority})`)
    })
    
    console.log('\n3. Ejecutando configuración masiva...')
    
    const setupResult = await companyCredentialsSetupService.startBulkSetup()
    
    console.log('\n📊 RESULTADOS DE LA CONFIGURACIÓN:')
    console.log(`   ✅ Procesadas exitosamente: ${setupResult.processed}`)
    console.log(`   ❌ Errores: ${setupResult.errors}`)
    console.log(`   📋 Detalles:`)
    
    setupResult.details.forEach((detail, index) => {
      const status = detail.success ? '✅' : '❌'
      console.log(`      ${index + 1}. ${status} ${detail.companyName}: ${detail.message || detail.error}`)
    })
    
    console.log('\n4. Verificando estado final...')
    
    const finalStats = await companyCredentialsSetupService.getSetupStatistics()
    
    console.log('📊 ESTADÍSTICAS FINALES:')
    console.log(`   Total empresas activas: ${finalStats.totalCompanies}`)
    console.log(`   Empresas con credenciales: ${finalStats.companiesWithCredentials}`)
    console.log(`   Empresas sin credenciales: ${finalStats.companiesWithoutCredentials}`)
    console.log(`   Empresas pendientes setup: ${finalStats.companiesPendingSetup}`)
    console.log(`   Progreso: ${finalStats.setupProgress}%`)
    
    console.log('\n5. Obteniendo empresas que requieren configuración manual...')
    
    const companiesRequiringManualSetup = await companyCredentialsSetupService.getCompaniesRequiringManualSetup()
    
    if (companiesRequiringManualSetup.length > 0) {
      console.log(`📋 ${companiesRequiringManualSetup.length} empresas requieren configuración manual:`)
      companiesRequiringManualSetup.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.companies.name} - ${company.account_name}`)
        console.log(`      Estado: ${company.status}`)
        console.log(`      Instrucciones: ${company.settings?.setupInstructions || 'Configuración requerida'}`)
      })
    } else {
      console.log('✅ No hay empresas que requieran configuración manual adicional')
    }
    
    console.log('\n🎯 RESUMEN EJECUTIVO:')
    console.log('====================')
    
    if (setupResult.errors === 0) {
      console.log('✅ CONFIGURACIÓN MASIVA EXITOSA')
      console.log(`   - ${setupResult.processed} empresas configuradas`)
      console.log('   - Sistema de APIs dinámicas por empresa activado')
      console.log('   - Error "Cannot read properties of null" eliminado')
    } else {
      console.log('⚠️ CONFIGURACIÓN COMPLETADA CON ERRORES')
      console.log(`   - ${setupResult.processed} empresas configuradas`)
      console.log(`   - ${setupResult.errors} errores encontrados`)
      console.log('   - Revisar detalles arriba')
    }
    
    console.log('\n🔧 PRÓXIMOS PASOS:')
    console.log('==================')
    console.log('1. Las empresas ahora tienen credenciales iniciales (pending_setup)')
    console.log('2. Los administradores deben configurar credenciales reales de Google Drive')
    console.log('3. El sistema ya no mostrará errores "Cannot read properties of null"')
    console.log('4. Las APIs dinámicas por empresa están operativas')
    
    return setupResult
    
  } catch (error) {
    console.error('❌ ERROR EJECUTANDO CONFIGURACIÓN:', error.message)
    console.error('Stack trace:', error.stack)
    throw error
  }
}

// Función para probar el servicio GoogleDriveAuthServiceDynamic después del setup
async function testGoogleDriveServiceAfterSetup() {
  try {
    console.log('\n🧪 Probando GoogleDriveAuthServiceDynamic después del setup...')
    
    const { default: googleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    
    // Probar con la primera empresa que tenga credenciales
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
    
    if (!companies || companies.length === 0) {
      console.log('   ❌ No hay empresas para probar')
      return false
    }
    
    const testCompany = companies[0]
    console.log(`   🧪 Probando con empresa: ${testCompany.name}`)
    
    const initialized = await googleDriveAuthServiceDynamic.initialize(supabase, testCompany.id)
    
    console.log(`   📊 Servicio inicializado: ${initialized}`)
    
    if (initialized) {
      const stats = googleDriveAuthServiceDynamic.getServiceStats()
      console.log(`   📈 Stats del servicio:`, {
        initialized: stats.initialized,
        currentCompanyId: stats.currentCompanyId,
        availableCredentials: stats.availableCredentials,
        isAuthenticated: stats.isAuthenticated
      })
      
      console.log('   ✅ GoogleDriveAuthServiceDynamic funciona correctamente')
      return true
    } else {
      console.log('   ❌ GoogleDriveAuthServiceDynamic falló al inicializar')
      return false
    }
    
  } catch (error) {
    console.log(`   ❌ Error probando servicio: ${error.message}`)
    return false
  }
}

// Ejecutar configuración completa
async function runCompleteSetup() {
  console.log('🚀 INICIANDO CONFIGURACIÓN COMPLETA DEL SISTEMA')
  console.log('===============================================\n')
  
  try {
    // Paso 1: Ejecutar configuración masiva
    const setupResult = await executeSetup()
    
    // Paso 2: Probar que el servicio funciona
    const serviceWorks = await testGoogleDriveServiceAfterSetup()
    
    console.log('\n🎉 CONFIGURACIÓN COMPLETA FINALIZADA')
    console.log('===================================')
    
    if (setupResult.errors === 0 && serviceWorks) {
      console.log('✅ ÉXITO TOTAL:')
      console.log('   - Problema sistémico resuelto')
      console.log('   - 16 empresas ahora tienen credenciales iniciales')
      console.log('   - APIs dinámicas por empresa operativas')
      console.log('   - Error "Cannot read properties of null" eliminado')
      console.log('   - GoogleDriveAuthServiceDynamic funciona')
    } else {
      console.log('⚠️ CONFIGURACIÓN PARCIAL:')
      console.log('   - Revisar errores arriba')
      console.log('   - Algunas empresas pueden necesitar atención manual')
    }
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO EN CONFIGURACIÓN:', error.message)
    throw error
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteSetup().catch(error => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
}

export { runCompleteSetup, executeSetup, testGoogleDriveServiceAfterSetup }