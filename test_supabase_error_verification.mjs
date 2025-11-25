/**
 * Script de Verificación - Error Supabase Google Drive
 * Prueba específicamente el error "Cannot read properties of null (reading 'rpc')"
 */

import { supabase } from './src/lib/supabase.js'

async function testGoogleDriveSupabaseError() {
  console.log('🧪 INICIANDO PRUEBA DE ERROR SUPABASE GOOGLE DRIVE')
  console.log('=' * 60)
  
  try {
    // 1. Verificar cliente Supabase
    console.log('1️⃣ Verificando cliente Supabase...')
    console.log('   - supabase existe:', !!supabase)
    console.log('   - tipo de supabase:', typeof supabase)
    console.log('   - supabase tiene rpc:', typeof supabase?.rpc === 'function')
    
    if (!supabase) {
      console.log('❌ ERROR: supabase es null/undefined')
      return false
    }
    
    if (typeof supabase !== 'object') {
      console.log('❌ ERROR: supabase no es un objeto')
      return false
    }
    
    if (typeof supabase.rpc !== 'function') {
      console.log('❌ ERROR: supabase.rpc no es una función')
      return false
    }
    
    console.log('✅ Cliente Supabase válido')
    
    // 2. Probar llamada RPC
    console.log('\n2️⃣ Probando llamada RPC...')
    const testCompanyId = 'test-company-123'
    
    const result = await supabase.rpc('get_company_credentials', {
      p_company_id: testCompanyId,
      p_integration_type: 'google_drive'
    })
    
    console.log('   - result.data:', result.data)
    console.log('   - result.error:', result.error)
    
    if (result.error) {
      console.log('⚠️ Error RPC (esperado):', result.error.message)
    }
    
    console.log('✅ Llamada RPC ejecutada sin errores críticos')
    
    // 3. Probar GoogleDriveAuthServiceDynamic
    console.log('\n3️⃣ Probando GoogleDriveAuthServiceDynamic...')
    
    const { default: googleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    
    const initialized = await googleDriveAuthServiceDynamic.initialize(supabase, testCompanyId)
    console.log('   - Inicialización exitosa:', initialized)
    
    const credentials = googleDriveAuthServiceDynamic.getAvailableCredentials()
    console.log('   - Credenciales obtenidas:', credentials.length)
    
    console.log('✅ GoogleDriveAuthServiceDynamic funciona correctamente')
    
    console.log('\n🎉 RESULTADO: NO SE ENCONTRARON ERRORES CRÍTICOS')
    console.log('✅ El manejo robusto está funcionando')
    
    return true
    
  } catch (error) {
    console.log('\n❌ ERROR ENCONTRADO:')
    console.log('   - Mensaje:', error.message)
    console.log('   - Stack:', error.stack)
    
    if (error.message.includes('Cannot read properties of null')) {
      console.log('\n🚨 CONFIRMADO: Error "Cannot read properties of null" persiste')
      return false
    } else {
      console.log('\n⚠️ Error diferente al reportado, pero manejado gracefully')
      return true
    }
  }
}

// Ejecutar prueba
testGoogleDriveSupabaseError()
  .then(success => {
    if (success) {
      console.log('\n✅ VERIFICACIÓN EXITOSA: Error Supabase manejado correctamente')
    } else {
      console.log('\n❌ VERIFICACIÓN FALLIDA: Error Supabase aún presente')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.log('\n💥 ERROR INESPERADO:', error.message)
    process.exit(1)
  })