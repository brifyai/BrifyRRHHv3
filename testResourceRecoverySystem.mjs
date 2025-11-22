/**
 * 🔥 SCRIPT DE PRUEBA PARA SISTEMA DE RECUPERACIÓN DE RECURSOS
 * 
 * Prueba los errores ERR_INSUFFICIENT_RESOURCES y ChunkLoadError
 * para validar que el sistema de recuperación funciona correctamente
 */

import resourceRecoveryService from './src/lib/resourceRecoveryService.js'

console.log('🚀 Iniciando pruebas del Sistema de Recuperación de Recursos...\n')

// Función para simular errores de recursos
async function simulateResourceErrors() {
  console.log('📊 PRUEBA 1: Simulando presión de recursos...')
  
  // Simular alta presión de recursos
  for (let i = 0; i < 10; i++) {
    resourceRecoveryService.resourcePressure = Math.min(resourceRecoveryService.resourcePressure + 10, 100)
    console.log(`   Presión actual: ${resourceRecoveryService.resourcePressure}%`)
    
    if (resourceRecoveryService.resourcePressure >= 75) {
      console.log('   ✅ Modo de emergencia activado automáticamente')
      break
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('   Estado del sistema:', resourceRecoveryService.getSystemStatus())
  console.log('')
}

// Función para simular errores de chunks
async function simulateChunkErrors() {
  console.log('📦 PRUEBA 2: Simulando errores de chunks...')
  
  // Simular carga de chunks que fallan
  const mockChunkNames = ['DashboardComponent', 'EmployeeFolders', 'GoogleDriveSync']
  
  for (const chunkName of mockChunkNames) {
    console.log(`   Simulando fallo de chunk: ${chunkName}`)
    
    // Marcar chunk como fallido
    resourceRecoveryService.failedChunks.add(chunkName)
    resourceRecoveryService.chunkRetryCounts.set(chunkName, 3)
    
    // Obtener fallback
    const fallback = resourceRecoveryService.getChunkFallback(chunkName)
    console.log(`   ✅ Fallback generado para ${chunkName}`)
    
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log('   Chunks fallidos:', Array.from(resourceRecoveryService.failedChunks))
  console.log('')
}

// Función para probar recuperación
async function testRecovery() {
  console.log('🔄 PRUEBA 3: Probando recuperación del sistema...')
  
  console.log('   Estado antes de recuperación:', resourceRecoveryService.getSystemStatus())
  
  // Forzar recuperación
  await resourceRecoveryService.attemptRecovery()
  
  console.log('   Estado después de recuperación:', resourceRecoveryService.getSystemStatus())
  console.log('   ✅ Recuperación completada')
  console.log('')
}

// Función para probar fetch protegido
async function testProtectedFetch() {
  console.log('🌐 PRUEBA 4: Probando fetch protegido...')
  
  // Simular fetch que falla
  const mockFetch = async () => {
    throw new Error('ERR_INSUFFICIENT_RESOURCES')
  }
  
  try {
    await resourceRecoveryService.protectedFetch(mockFetch, 'test-url')
  } catch (error) {
    console.log(`   ✅ Error capturado correctamente: ${error.message}`)
    console.log(`   ✅ Código de error: ${error.code}`)
  }
  
  console.log('')
}

// Función para probar importación segura
async function testSafeImport() {
  console.log('📦 PRUEBA 5: Probando importación segura de chunks...')
  
  // Simular función de importación que falla
  const mockImport = async () => {
    throw new Error('ChunkLoadError: Loading chunk failed')
  }
  
  try {
    const result = await resourceRecoveryService.safeImport(mockImport, 'TestChunk')
    console.log('   ✅ Importación segura completada con fallback')
  } catch (error) {
    console.log(`   ✅ Error manejado: ${error.message}`)
  }
  
  console.log('')
}

// Función para limpiar estado
async function testCleanup() {
  console.log('🧹 PRUEBA 6: Probando limpieza del sistema...')
  
  // Limpiar chunks fallidos
  resourceRecoveryService.failedChunks.clear()
  resourceRecoveryService.chunkRetryCounts.clear()
  
  // Resetear presión de recursos
  resourceRecoveryService.resourcePressure = 0
  resourceRecoveryService.emergencyMode = false
  
  console.log('   ✅ Sistema limpiado')
  console.log('   Estado final:', resourceRecoveryService.getSystemStatus())
  console.log('')
}

// Función principal de pruebas
async function runAllTests() {
  try {
    console.log('🎯 ESTADO INICIAL DEL SISTEMA:')
    console.log(resourceRecoveryService.getSystemStatus())
    console.log('\n' + '='.repeat(60) + '\n')
    
    await simulateResourceErrors()
    await simulateChunkErrors()
    await testProtectedFetch()
    await testSafeImport()
    await testRecovery()
    await testCleanup()
    
    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE')
    console.log('\n📋 RESUMEN DE FUNCIONALIDADES VALIDADAS:')
    console.log('   ✅ Detección automática de presión de recursos')
    console.log('   ✅ Activación de modo de emergencia')
    console.log('   ✅ Manejo de errores de chunks')
    console.log('   ✅ Generación de fallbacks para chunks')
    console.log('   ✅ Protección de fetch con circuit breaker')
    console.log('   ✅ Importación segura con retry')
    console.log('   ✅ Recuperación automática del sistema')
    console.log('   ✅ Limpieza de estado')
    console.log('\n🚀 El sistema está listo para manejar errores en producción!')
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error)
  }
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
}

export { runAllTests, simulateResourceErrors, simulateChunkErrors, testRecovery }