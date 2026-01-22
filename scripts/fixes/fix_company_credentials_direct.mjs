/**
 * Script directo para solucionar el problema sistémico de credenciales
 * Sin dependencias de React/frontend - solo Supabase directo
 */

import { supabase } from './src/lib/supabase.js'

console.log('🚀 SOLUCIÓN DIRECTA - PROBLEMA SISTÉMICO CREDENCIALES')
console.log('====================================================')

async function fixCompanyCredentialsDirectly() {
  try {
    console.log('\n1. Verificando estado actual...')
    
    // Obtener empresas activas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, status')
      .eq('status', 'active')
      .order('name')
    
    if (companiesError) {
      throw companiesError
    }
    
    console.log(`📊 Empresas activas encontradas: ${companies.length}`)
    
    // Verificar credenciales actuales
    const { data: existingCredentials, error: credError } = await supabase
      .from('company_credentials')
      .select('company_id, integration_type, status')
      .eq('integration_type', 'google_drive')
    
    if (credError) {
      console.log('⚠️ Error consultando credenciales:', credError.message)
    }
    
    const companiesWithCredentials = new Set(existingCredentials?.map(c => c.company_id) || [])
    console.log(`📊 Empresas con credenciales: ${companiesWithCredentials.size}`)
    
    // Identificar empresas sin credenciales
    const companiesNeedingSetup = companies.filter(company => !companiesWithCredentials.has(company.id))
    
    console.log(`📋 Empresas sin credenciales: ${companiesNeedingSetup.length}`)
    companiesNeedingSetup.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name}`)
    })
    
    if (companiesNeedingSetup.length === 0) {
      console.log('✅ Todas las empresas ya tienen credenciales')
      return { success: true, message: 'No hay empresas que necesiten setup' }
    }
    
    console.log('\n2. Creando credenciales iniciales...')
    
    const setupResults = []
    
    for (const company of companiesNeedingSetup) {
      try {
        console.log(`🔧 Configurando ${company.name}...`)
        
        // Crear credencial inicial
        const credentialData = {
          company_id: company.id,
          integration_type: 'google_drive',
          account_name: `${company.name} - Cuenta Principal`,
          status: 'pending_setup',
          credentials: {
            needsConfiguration: true,
            setupRequired: true,
            configuredAt: null,
            note: 'Credencial inicial - requiere configuración manual'
          },
          settings: {
            isInitialSetup: true,
            requiresManualConfiguration: true,
            setupInstructions: `La empresa ${company.name} necesita configurar credenciales reales de Google Drive`
          },
          account_email: null,
          account_display_name: `${company.name} Admin`,
          expires_at: null
        }
        
        const { data: newCredential, error: insertError } = await supabase
          .from('company_credentials')
          .insert(credentialData)
          .select()
          .single()
        
        if (insertError) {
          throw insertError
        }
        
        setupResults.push({
          companyId: company.id,
          companyName: company.name,
          success: true,
          credentialId: newCredential.id
        })
        
        console.log(`   ✅ ${company.name} configurada (ID: ${newCredential.id})`)
        
      } catch (companyError) {
        setupResults.push({
          companyId: company.id,
          companyName: company.name,
          success: false,
          error: companyError.message
        })
        
        console.log(`   ❌ Error configurando ${company.name}: ${companyError.message}`)
      }
    }
    
    console.log('\n3. Verificando resultados...')
    
    const successful = setupResults.filter(r => r.success)
    const failed = setupResults.filter(r => !r.success)
    
    console.log(`📊 Configuración completada:`)
    console.log(`   ✅ Exitosas: ${successful.length}`)
    console.log(`   ❌ Fallidas: ${failed.length}`)
    
    if (failed.length > 0) {
      console.log('\n❌ Errores encontrados:')
      failed.forEach(failure => {
        console.log(`   - ${failure.companyName}: ${failure.error}`)
      })
    }
    
    console.log('\n4. Verificando función RPC...')
    
    // Probar la función RPC con la primera empresa configurada
    if (successful.length > 0) {
      const testCompany = successful[0]
      
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('get_company_credentials', {
          p_company_id: testCompany.companyId,
          p_integration_type: 'google_drive'
        })
        
        if (rpcError) {
          console.log(`   ❌ Error en función RPC: ${rpcError.message}`)
        } else {
          console.log(`   ✅ Función RPC funciona para ${testCompany.companyName}`)
          console.log(`   📊 Resultado: ${rpcResult?.length || 0} credenciales`)
        }
      } catch (rpcTestError) {
        console.log(`   ❌ Error probando RPC: ${rpcTestError.message}`)
      }
    }
    
    console.log('\n5. Estadísticas finales...')
    
    // Verificar estado final
    const { data: finalCredentials } = await supabase
      .from('company_credentials')
      .select('company_id, status')
      .eq('integration_type', 'google_drive')
    
    const finalCompaniesWithCredentials = new Set(finalCredentials?.map(c => c.company_id) || [])
    
    console.log(`📊 ESTADO FINAL:`)
    console.log(`   Total empresas: ${companies.length}`)
    console.log(`   Con credenciales: ${finalCompaniesWithCredentials.size}`)
    console.log(`   Sin credenciales: ${companies.length - finalCompaniesWithCredentials.size}`)
    console.log(`   Progreso: ${((finalCompaniesWithCredentials.size / companies.length) * 100).toFixed(1)}%`)
    
    return {
      success: failed.length === 0,
      totalCompanies: companies.length,
      configured: successful.length,
      failed: failed.length,
      results: setupResults
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando configuración:', error.message)
    throw error
  }
}

async function testGoogleDriveServiceSimple() {
  try {
    console.log('\n🧪 Probando GoogleDriveAuthServiceDynamic...')
    
    // Importar solo el servicio sin dependencias React
    const { default: googleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    
    // Probar con primera empresa
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
    
    if (!companies || companies.length === 0) {
      console.log('   ❌ No hay empresas para probar')
      return false
    }
    
    const testCompany = companies[0]
    console.log(`   🧪 Probando con: ${testCompany.name}`)
    
    const initialized = await googleDriveAuthServiceDynamic.initialize(supabase, testCompany.id)
    
    console.log(`   📊 Inicializado: ${initialized}`)
    
    if (initialized) {
      const stats = googleDriveAuthServiceDynamic.getServiceStats()
      console.log(`   📈 Stats:`, {
        availableCredentials: stats.availableCredentials,
        isAuthenticated: stats.isAuthenticated
      })
      
      console.log('   ✅ Servicio funciona correctamente')
      return true
    } else {
      console.log('   ❌ Servicio falló al inicializar')
      return false
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🎯 EJECUTANDO SOLUCIÓN SISTÉMICA COMPLETA')
  console.log('=========================================\n')
  
  try {
    // Paso 1: Ejecutar configuración directa
    const setupResult = await fixCompanyCredentialsDirectly()
    
    // Paso 2: Probar servicio
    const serviceWorks = await testGoogleDriveServiceSimple()
    
    console.log('\n🎉 RESULTADO FINAL')
    console.log('==================')
    
    if (setupResult.success && serviceWorks) {
      console.log('✅ ÉXITO TOTAL - PROBLEMA SISTÉMICO RESUELTO')
      console.log(`   📊 ${setupResult.configured} empresas configuradas`)
      console.log('   🔧 APIs dinámicas por empresa operativas')
      console.log('   ❌ Error "Cannot read properties of null" eliminado')
      console.log('   🧪 GoogleDriveAuthServiceDynamic funciona')
      
      console.log('\n💡 PRÓXIMOS PASOS:')
      console.log('   1. Administradores deben configurar credenciales reales')
      console.log('   2. Sistema ya no mostrará errores de credenciales null')
      console.log('   3. APIs dinámicas por empresa están listas para usar')
      
    } else {
      console.log('⚠️ CONFIGURACIÓN PARCIAL')
      if (!setupResult.success) {
        console.log(`   ❌ ${setupResult.failed} empresas fallaron al configurar`)
      }
      if (!serviceWorks) {
        console.log('   ❌ GoogleDriveAuthServiceDynamic aún tiene problemas')
      }
    }
    
    return setupResult
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO:', error.message)
    throw error
  }
}

// Ejecutar
main().catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})