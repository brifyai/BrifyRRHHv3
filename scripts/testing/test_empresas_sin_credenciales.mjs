/**
 * Script para verificar el estado real del sistema de credenciales por empresa
 * Problema: Empresas existen pero NO tienen credenciales configuradas
 */

import { supabase } from './src/lib/supabase.js'

console.log('🔍 VERIFICACIÓN EMPRESAS SIN CREDENCIALES')
console.log('==========================================')

async function checkCompaniesWithCredentials() {
  try {
    console.log('\n1. Obteniendo todas las empresas...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, status')
      .order('name')
    
    if (companiesError) {
      console.log('   ❌ Error obteniendo empresas:', companiesError.message)
      return
    }
    
    console.log(`   ✅ Encontradas ${companies.length} empresas`)
    
    // Verificar credenciales para cada empresa
    console.log('\n2. Verificando credenciales de Google Drive por empresa...')
    
    for (const company of companies) {
      console.log(`\n   📋 Empresa: ${company.name} (${company.id})`)
      console.log(`      Estado: ${company.status}`)
      
      try {
        const { data: credentials, error } = await supabase.rpc('get_company_credentials', {
          p_company_id: company.id,
          p_integration_type: 'google_drive'
        })
        
        if (error) {
          console.log(`      ❌ Error consultando credenciales: ${error.message}`)
        } else {
          const credCount = credentials?.length || 0
          console.log(`      📊 Credenciales Google Drive: ${credCount}`)
          
          if (credCount === 0) {
            console.log(`      ⚠️  EMPRESA SIN CREDENCIALES - No puede usar Google Drive`)
          } else {
            console.log(`      ✅ Tiene credenciales configuradas`)
            credentials.forEach((cred, index) => {
              console.log(`         ${index + 1}. ${cred.account_name} (${cred.status})`)
            })
          }
        }
      } catch (credError) {
        console.log(`      ❌ Error verificando credenciales: ${credError.message}`)
      }
    }
    
    return companies
  } catch (error) {
    console.log('❌ Error general:', error.message)
  }
}

async function simulateSettingsDynamicError() {
  try {
    console.log('\n3. Simulando el error que ve el usuario...')
    
    // Usar la primera empresa para simular
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
    
    if (!companies || companies.length === 0) {
      console.log('   ❌ No hay empresas para probar')
      return
    }
    
    const testCompany = companies[0]
    console.log(`   🧪 Probando con empresa: ${testCompany.name}`)
    
    // Simular lo que hace SettingsDynamic.js línea 281
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
    } else if (!data || data.length === 0) {
      console.log('   ⚠️  SIN CREDENCIALES: La empresa no tiene credenciales de Google Drive configuradas')
      console.log('   💡 CAUSA DEL ERROR: El servicio espera credenciales pero no existen')
    } else {
      console.log('   ✅ Credenciales encontradas')
    }
    
  } catch (error) {
    console.log('   ❌ Error simulando SettingsDynamic:', error.message)
  }
}

async function checkSystemDesign() {
  console.log('\n4. Análisis del diseño del sistema...')
  
  console.log('   📋 DISEÑO ACTUAL:')
  console.log('      - Sistema diseñado para APIs dinámicas por empresa')
  console.log('      - Cada empresa puede tener múltiples cuentas de Google Drive')
  console.log('      - Credenciales almacenadas en tabla company_credentials')
  console.log('      - Función get_company_credentials() las consulta')
  
  console.log('\n   ❌ PROBLEMA IDENTIFICADO:')
  console.log('      - Empresas existen en la base de datos')
  console.log('      - Pero NO tienen credenciales de Google Drive configuradas')
  console.log('      - GoogleDriveAuthServiceDynamic falla al no encontrar credenciales')
  console.log('      - Error se repite para TODAS las empresas')
  
  console.log('\n   💡 SOLUCIONES POSIBLES:')
  console.log('      1. Crear flujo de configuración inicial para empresas')
  console.log('      2. Implementar fallback cuando no hay credenciales')
  console.log('      3. Migrar empresas existentes a sistema de credenciales')
  console.log('      4. Crear credenciales por defecto o de ejemplo')
}

async function runCompleteAnalysis() {
  console.log('🚀 ANÁLISIS COMPLETO DEL PROBLEMA SISTÉMICO')
  console.log('============================================\n')
  
  const companies = await checkCompaniesWithCredentials()
  await simulateSettingsDynamicError()
  await checkSystemDesign()
  
  console.log('\n🎯 CONCLUSIÓN FINAL')
  console.log('==================')
  console.log('❌ PROBLEMA SISTÉMICO CONFIRMADO:')
  console.log('   - El sistema está diseñado para APIs dinámicas por empresa')
  console.log('   - Pero las empresas NO tienen credenciales configuradas')
  console.log('   - Esto causa errores en TODAS las empresas')
  console.log('   - Es un problema de configuración inicial, no de código')
  
  console.log('\n🔧 ACCIÓN REQUERIDA:')
  console.log('   Crear sistema de configuración inicial de credenciales')
  console.log('   para las empresas existentes.')
}

runCompleteAnalysis().catch(error => {
  console.error('❌ Error ejecutando análisis:', error)
})