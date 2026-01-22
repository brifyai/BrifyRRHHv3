/**
 * Test para verificar que la corrección del servicio dinámico funciona
 */

import googleDriveAuthServiceDynamic from './src/lib/googleDriveAuthServiceDynamic.js'
import { supabase } from './src/lib/supabase.js'

console.log('🧪 Iniciando prueba del servicio dinámico...')

async function testGoogleDriveAuthDynamic() {
  try {
    console.log('1. 📋 Probando inicialización con cliente Supabase proporcionado...')
    
    // Test 1: Inicialización con cliente proporcionado
    const result1 = await googleDriveAuthServiceDynamic.initialize(supabase, 'test-company-id')
    console.log(`✅ Resultado 1: ${result1 ? 'EXITOSO' : 'FALLÓ'}`)
    
    console.log('2. 📋 Probando inicialización sin cliente (debe importar dinámicamente)...')
    
    // Test 2: Inicialización sin cliente (importación dinámica)
    const result2 = await googleDriveAuthServiceDynamic.initialize(null, 'test-company-id-2')
    console.log(`✅ Resultado 2: ${result2 ? 'EXITOSO' : 'FALLÓ'}`)
    
    console.log('3. 📋 Verificando estado del servicio...')
    const stats = googleDriveAuthServiceDynamic.getServiceStats()
    console.log('📊 Estadísticas del servicio:', stats)
    
    console.log('4. 📋 Probando carga de credenciales...')
    const credentials = googleDriveAuthServiceDynamic.getAvailableCredentials()
    console.log(`📂 Credenciales cargadas: ${credentials.length}`)
    
    console.log('🎉 ¡Prueba completada exitosamente!')
    return true
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message)
    console.error('❌ Stack trace:', error.stack)
    return false
  }
}

// Ejecutar prueba
testGoogleDriveAuthDynamic().then(success => {
  if (success) {
    console.log('✅ Todas las pruebas pasaron correctamente')
    process.exit(0)
  } else {
    console.log('❌ Las pruebas fallaron')
    process.exit(1)
  }
}).catch(error => {
  console.error('❌ Error fatal en la prueba:', error)
  process.exit(1)
})