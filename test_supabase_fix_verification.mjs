/**
 * Script de verificación de corrección del cliente Supabase
 * Verifica que el cliente Supabase se exporta correctamente y tiene el método rpc
 */

import { supabase } from './src/lib/supabase.js'

console.log('🔍 VERIFICACIÓN DE CORRECCIÓN SUPABASE')
console.log('=====================================')

// 1. Verificar que supabase existe
console.log('1. Cliente Supabase existe:', !!supabase)
console.log('   Tipo:', typeof supabase)

// 2. Verificar que tiene las propiedades necesarias
console.log('2. Tiene método rpc:', typeof supabase?.rpc === 'function')
console.log('   Tiene método from:', typeof supabase?.from === 'function')
console.log('   Tiene método auth:', typeof supabase?.auth === 'object')

// 3. Verificar estructura del cliente
console.log('3. Propiedades del cliente:', Object.keys(supabase || {}))

// 4. Probar llamada RPC simple
async function testRpcCall() {
  try {
    console.log('4. Probando llamada RPC...')
    
    // Intentar una llamada simple a get_company_credentials
    const result = await supabase.rpc('get_company_credentials', {
      p_company_id: 'test',
      p_integration_type: 'google_drive'
    })
    
    console.log('   ✅ Llamada RPC exitosa')
    console.log('   Tipo de resultado:', typeof result)
    console.log('   Tiene data:', 'data' in result)
    console.log('   Tiene error:', 'error' in result)
    
    if (result.error) {
      console.log('   Error RPC (esperado para test):', result.error.message)
    }
    
    return true
  } catch (error) {
    console.log('   ❌ Error en llamada RPC:', error.message)
    return false
  }
}

// 5. Probar inicialización del servicio Google Drive
async function testGoogleDriveService() {
  try {
    console.log('5. Probando inicialización de GoogleDriveAuthServiceDynamic...')
    
    const { default: googleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    
    const initialized = await googleDriveAuthServiceDynamic.initialize(supabase, 'test-company')
    
    console.log('   ✅ Servicio inicializado:', initialized)
    
    if (initialized) {
      const stats = googleDriveAuthServiceDynamic.getServiceStats()
      console.log('   Stats del servicio:', stats)
    }
    
    return initialized
  } catch (error) {
    console.log('   ❌ Error inicializando servicio:', error.message)
    return false
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('\n🚀 EJECUTANDO TODAS LAS PRUEBAS')
  console.log('================================\n')
  
  const rpcTest = await testRpcCall()
  const serviceTest = await testGoogleDriveService()
  
  console.log('\n📊 RESULTADOS FINALES')
  console.log('=====================')
  console.log('✅ Cliente Supabase válido:', !!supabase && typeof supabase?.rpc === 'function')
  console.log('✅ Llamada RPC funciona:', rpcTest)
  console.log('✅ Servicio Google Drive inicializa:', serviceTest)
  
  const allTestsPass = !!supabase && typeof supabase?.rpc === 'function' && rpcTest && serviceTest
  
  console.log('\n🎯 RESULTADO GENERAL:', allTestsPass ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON')
  
  if (allTestsPass) {
    console.log('\n🎉 CORRECCIÓN EXITOSA - El error "Cannot read properties of null (reading \'rpc\')" debería estar resuelto')
  } else {
    console.log('\n⚠️  CORRECCIÓN INCOMPLETA - Revisar problemas restantes')
  }
}

runAllTests().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error)
})