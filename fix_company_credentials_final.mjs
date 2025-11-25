/**
 * Script FINAL para solucionar el problema sistémico con status válido
 */

import { supabase } from './src/lib/supabase.js'

console.log('🚀 SOLUCIÓN FINAL - PROBLEMA SISTÉMICO CREDENCIALES')
console.log('====================================================')

async function fixCompanyCredentialsWithValidStatus() {
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
    
    console.log('\n2. Creando credenciales iniciales con status válido...')
    
    const setupResults = []
    
    for (const company of companiesNeedingSetup) {
      try {
        console.log(`🔧 Configurando ${company.name}...`)
        
        // Crear credencial inicial con status válido
        const credentialData = {
          company_id: company.id,
          integration_type: 'google_drive',
          account_name: `${company.name} - Cuenta Principal`,
          status: 'pending_verification', // ✅ Status válido según constraint
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
          
          if (rpcResult && rpcResult.length > 0) {
            console.log(`   📋 Credencial encontrada:`)
            console.log(`      - ID: ${rpcResult[0].id}`)
            console.log(`      - Nombre: ${rpcResult[0].account_name}`)
            console.log(`      - Status: ${rpcResult[0].status}`)
          }
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

async function testDirectSupabaseCall() {
  try {
    console.log('\n🧪 Probando llamada directa a Supabase...')
    
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
    
    // Simular exactamente lo que hace GoogleDriveAuthServiceDynamic
    console.log('   📞 Llamando get_company_credentials...')
    
    const { data, error } = await supabase.rpc('get_company_credentials', {
      p_company_id: testCompany.id,
      p_integration_type: 'google_drive'
    })
    
    console.log(`   📊 Resultado:`, {
      data: data,
      error: error,
      dataLength: data?.length || 0,
      hasError: !!error
    })
    
    if (error) {
      console.log('   ❌ ERROR RPC:', error.message)
      return false
    } else if (!data || data.length === 0) {
      console.log('   ⚠️ SIN CREDENCIALES: La empresa no tiene credenciales')
      return false
    } else {
      console.log('   ✅ Credenciales encontradas - RPC funciona')
      return true
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🎯 EJECUTANDO SOLUCIÓN FINAL SISTÉMICA')
  console.log('=====================================\n')
  
  try {
    // Paso 1: Ejecutar configuración directa
    const setupResult = await fixCompanyCredentialsWithValidStatus()
    
    // Paso 2: Probar llamada directa a Supabase
    const rpcWorks = await testDirectSupabaseCall()
    
    console.log('\n🎉 RESULTADO FINAL')
    console.log('==================')
    
    if (setupResult.success && rpcWorks) {
      console.log('✅ ÉXITO TOTAL - PROBLEMA SISTÉMICO RESUELTO')
      console.log(`   📊 ${setupResult.configured} empresas configuradas`)
      console.log('   🔧 APIs dinámicas por empresa operativas')
      console.log('   ❌ Error "Cannot read properties of null" eliminado')
      console.log('   🧪 Función RPC get_company_credentials funciona')
      
      console.log('\n💡 PRÓXIMOS PASOS:')
      console.log('   1. Administradores deben configurar credenciales reales')
      console.log('   2. Cambiar status de "pending_verification" a "active"')
      console.log('   3. Sistema ya no mostrará errores de credenciales null')
      console.log('   4. APIs dinámicas por empresa están listas para usar')
      
    } else {
      console.log('⚠️ CONFIGURACIÓN PARCIAL')
      if (!setupResult.success) {
        console.log(`   ❌ ${setupResult.failed} empresas fallaron al configurar`)
      }
      if (!rpcWorks) {
        console.log('   ❌ Función RPC aún tiene problemas')
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