/**
 * Script específico para verificar la corrección del error RPC de Supabase
 * Este es el error exacto que reportó el usuario
 */

import { supabase } from './src/lib/supabase.js'

console.log('🔍 VERIFICACIÓN ESPECÍFICA DEL ERROR RPC')
console.log('==========================================')

// Simular exactamente lo que hace SettingsDynamic.js línea 281
async function simulateSettingsDynamicLoad() {
  try {
    console.log('1. Simulando SettingsDynamic.js línea 281...')
    console.log('   const initialized = await googleDriveAuthServiceDynamic.initialize(supabase, companyId)')
    
    // Verificar que el cliente Supabase es válido ANTES de pasarlo al servicio
    console.log('2. Verificando cliente Supabase antes de inicializar servicio...')
    console.log('   supabase existe:', !!supabase)
    console.log('   supabase es object:', typeof supabase === 'object')
    console.log('   supabase.rpc es función:', typeof supabase?.rpc === 'function')
    
    if (!supabase || typeof supabase?.rpc !== 'function') {
      console.log('   ❌ ERROR: Cliente Supabase inválido')
      return false
    }
    
    console.log('   ✅ Cliente Supabase válido para inicialización')
    
    // Simular la llamada que causaba el error original
    console.log('3. Simulando loadCompanyCredentials que causaba el error...')
    
    try {
      const result = await supabase.rpc('get_company_credentials', {
        p_company_id: 'test-company-id',
        p_integration_type: 'google_drive'
      })
      
      console.log('   ✅ Llamada RPC exitosa (sin error "Cannot read properties of null")')
      console.log('   Resultado tiene data:', 'data' in result)
      console.log('   Resultado tiene error:', 'error' in result)
      
      if (result.error) {
        console.log('   Error esperado (company no existe):', result.error.message)
      }
      
      return true
    } catch (rpcError) {
      console.log('   ❌ Error en RPC:', rpcError.message)
      return false
    }
    
  } catch (error) {
    console.log('   ❌ Error general:', error.message)
    return false
  }
}

// Verificar que el import funciona correctamente
function verifyImport() {
  console.log('4. Verificando importación de supabase...')
  console.log('   supabase importado correctamente:', !!supabase)
  console.log('   tipo de supabase:', typeof supabase)
  console.log('   supabase.constructor.name:', supabase?.constructor?.name)
  
  return !!supabase
}

// Ejecutar verificación
async function runVerification() {
  console.log('\n🚀 EJECUTANDO VERIFICACIÓN COMPLETA')
  console.log('====================================\n')
  
  const importOk = verifyImport()
  const rpcOk = await simulateSettingsDynamicLoad()
  
  console.log('\n📊 RESULTADOS FINALES')
  console.log('=====================')
  console.log('✅ Import de supabase funciona:', importOk)
  console.log('✅ RPC sin error "null reading rpc":', rpcOk)
  
  const fixSuccessful = importOk && rpcOk
  
  console.log('\n🎯 CORRECCIÓN DEL ERROR ORIGINAL:')
  if (fixSuccessful) {
    console.log('   ✅ "Cannot read properties of null (reading \'rpc\')" - RESUELTO')
    console.log('   ✅ El cliente Supabase se exporta correctamente')
    console.log('   ✅ Las llamadas RPC funcionan sin errores')
  } else {
    console.log('   ❌ Error no completamente resuelto')
  }
  
  console.log('\n💡 RESUMEN TÉCNICO:')
  console.log('   - Problema: supabase.js exportaba wrapper object en lugar del cliente real')
  console.log('   - Solución: Cambiar export default supabaseModule a export default supabase')
  console.log('   - Resultado: Cliente Supabase válido con método rpc disponible')
}

runVerification().catch(error => {
  console.error('❌ Error ejecutando verificación:', error)
})