/**
 * Script para verificar y diagnosticar el sistema de credenciales por empresa
 * Este es el problema sistémico que afecta a todas las empresas
 */

import { supabase } from './src/lib/supabase.js'

console.log('🔍 DIAGNÓSTICO SISTEMA DE CREDENCIALES POR EMPRESA')
console.log('==================================================')

async function testCompanyCredentialsSystem() {
  try {
    console.log('\n1. Verificando si existe la tabla company_credentials...')
    
    // Intentar consultar la tabla
    const { data, error } = await supabase
      .from('company_credentials')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('   ❌ ERROR: La tabla company_credentials NO EXISTE')
      console.log('   Error:', error.message)
      console.log('   Código:', error.code)
      
      if (error.code === 'PGRST116') {
        console.log('   📋 PROBLEMA: La tabla no existe en Supabase')
        console.log('   💡 SOLUCIÓN: Ejecutar database/company_credentials_table.sql')
      }
      
      return false
    } else {
      console.log('   ✅ La tabla company_credentials existe')
      console.log('   Datos encontrados:', data?.length || 0)
      return true
    }
  } catch (error) {
    console.log('   ❌ Error verificando tabla:', error.message)
    return false
  }
}

async function testGetCompanyCredentialsFunction() {
  try {
    console.log('\n2. Verificando función get_company_credentials...')
    
    // Intentar llamar la función RPC
    const { data, error } = await supabase.rpc('get_company_credentials', {
      p_company_id: '00000000-0000-0000-0000-000000000000',
      p_integration_type: 'google_drive'
    })
    
    if (error) {
      console.log('   ❌ ERROR: La función get_company_credentials NO EXISTE')
      console.log('   Error:', error.message)
      console.log('   Código:', error.code)
      
      if (error.code === '42883') {
        console.log('   📋 PROBLEMA: La función no existe en Supabase')
        console.log('   💡 SOLUCIÓN: Ejecutar database/company_credentials_table.sql')
      }
      
      return false
    } else {
      console.log('   ✅ La función get_company_credentials existe')
      console.log('   Resultado:', data)
      return true
    }
  } catch (error) {
    console.log('   ❌ Error verificando función:', error.message)
    return false
  }
}

async function testGoogleDriveAuthServiceDynamic() {
  try {
    console.log('\n3. Probando GoogleDriveAuthServiceDynamic...')
    
    const { default: googleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    
    const initialized = await googleDriveAuthServiceDynamic.initialize(supabase, 'test-company')
    
    console.log('   Servicio inicializado:', initialized)
    
    if (initialized) {
      const stats = googleDriveAuthServiceDynamic.getServiceStats()
      console.log('   Stats:', stats)
    }
    
    return initialized
  } catch (error) {
    console.log('   ❌ Error inicializando servicio:', error.message)
    return false
  }
}

async function checkCompaniesTable() {
  try {
    console.log('\n4. Verificando tabla companies...')
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5)
    
    if (error) {
      console.log('   ❌ ERROR: Problema con tabla companies')
      console.log('   Error:', error.message)
      return false
    } else {
      console.log('   ✅ Tabla companies funciona')
      console.log('   Empresas encontradas:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Primera empresa:', data[0])
      }
      return true
    }
  } catch (error) {
    console.log('   ❌ Error verificando companies:', error.message)
    return false
  }
}

async function runCompleteDiagnosis() {
  console.log('🚀 EJECUTANDO DIAGNÓSTICO COMPLETO')
  console.log('==================================\n')
  
  const tableExists = await testCompanyCredentialsSystem()
  const functionExists = await testGetCompanyCredentialsFunction()
  const serviceWorks = await testGoogleDriveAuthServiceDynamic()
  const companiesWorks = await checkCompaniesTable()
  
  console.log('\n📊 RESULTADOS DEL DIAGNÓSTICO')
  console.log('============================')
  console.log('✅ Tabla company_credentials:', tableExists ? 'EXISTE' : 'NO EXISTE')
  console.log('✅ Función get_company_credentials:', functionExists ? 'EXISTE' : 'NO EXISTE')
  console.log('✅ GoogleDriveAuthServiceDynamic:', serviceWorks ? 'FUNCIONA' : 'FALLA')
  console.log('✅ Tabla companies:', companiesWorks ? 'FUNCIONA' : 'FALLA')
  
  const systemHealthy = tableExists && functionExists && companiesWorks
  
  console.log('\n🎯 ESTADO DEL SISTEMA:')
  if (systemHealthy) {
    console.log('   ✅ SISTEMA SALUDABLE - APIs dinámicas por empresa funcionando')
  } else {
    console.log('   ❌ SISTEMA NO SALUDABLE - APIs dinámicas por empresa NO funcionan')
    console.log('   📋 PROBLEMA SISTÉMICO: Afecta a TODAS las empresas')
    console.log('   💡 SOLUCIÓN REQUERIDA: Ejecutar database/company_credentials_table.sql')
  }
  
  console.log('\n🔧 ACCIONES RECOMENDADAS:')
  if (!tableExists || !functionExists) {
    console.log('   1. Ejecutar el archivo SQL: database/company_credentials_table.sql')
    console.log('   2. Verificar que la tabla y función se crearon en Supabase')
    console.log('   3. Re-ejecutar este diagnóstico')
  }
  
  if (!serviceWorks) {
    console.log('   4. Verificar que GoogleDriveAuthServiceDynamic puede inicializar')
  }
  
  return systemHealthy
}

runCompleteDiagnosis().catch(error => {
  console.error('❌ Error ejecutando diagnóstico:', error)
})