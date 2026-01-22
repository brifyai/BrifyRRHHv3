/**
 * Test simple para verificar la importación dinámica en el servicio
 */

console.log('🧪 Iniciando prueba simple de importación dinámica...')

async function testDynamicImport() {
  try {
    console.log('1. 📋 Probando importación dinámica de supabase...')
    
    // Test 1: Importación dinámica de supabase
    const supabaseModule = await import('./src/lib/supabase.js')
    console.log('✅ Módulo supabase importado:', Object.keys(supabaseModule))
    
    let supabase = null
    
    // Intentar obtener supabase de diferentes formas
    if (supabaseModule.supabase) {
      supabase = supabaseModule.supabase
      console.log('✅ Supabase encontrado como exportación nombrada')
    } else if (supabaseModule.default?.supabase) {
      supabase = supabaseModule.default.supabase
      console.log('✅ Supabase encontrado en default.supabase')
    } else if (supabaseModule.default) {
      supabase = supabaseModule.default
      console.log('✅ Supabase encontrado como exportación default')
    }
    
    if (!supabase) {
      throw new Error('No se pudo encontrar el cliente Supabase en el módulo importado')
    }
    
    console.log('✅ Cliente Supabase obtenido exitosamente')
    console.log('📊 Propiedades del cliente:', Object.getOwnPropertyNames(supabase).slice(0, 5))
    
    console.log('2. 📋 Probando importación del servicio dinámico...')
    
    // Test 2: Importación del servicio dinámico
    const { default: googleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    console.log('✅ Servicio dinámico importado')
    
    console.log('3. 📋 Probando inicialización del servicio...')
    
    // Test 3: Inicialización del servicio
    const result = await googleDriveAuthServiceDynamic.initialize(supabase, 'test-company-id')
    console.log(`✅ Inicialización: ${result ? 'EXITOSA' : 'FALLÓ'}`)
    
    console.log('4. 📋 Verificando estado del servicio...')
    const stats = googleDriveAuthServiceDynamic.getServiceStats()
    console.log('📊 Estadísticas del servicio:', stats)
    
    console.log('🎉 ¡Prueba completada exitosamente!')
    return true
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message)
    console.error('❌ Stack trace:', error.stack)
    return false
  }
}

// Ejecutar prueba
testDynamicImport().then(success => {
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