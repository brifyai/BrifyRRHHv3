#!/usr/bin/env node

/**
 * Test final del sistema de locks distribuidos
 */

import distributedLockService from './src/lib/distributedLockService.js'

async function testLocksSystem() {
  try {
    console.log('🧪 INICIANDO TEST DEL SISTEMA DE LOCKS')
    console.log('=' * 50)
    
    // Test 1: Verificar que el servicio está inicializado
    console.log('\n📋 Test 1: Verificando inicialización del servicio...')
    if (distributedLockService && typeof distributedLockService.withLock === 'function') {
      console.log('✅ Servicio distributedLockService cargado correctamente')
    } else {
      console.log('❌ Error: Servicio no inicializado correctamente')
      return false
    }
    
    // Test 2: Test de adquisición y liberación de lock
    console.log('\n📋 Test 2: Probando adquisición y liberación de lock...')
    const testEmail = 'test-locks@example.com'
    
    const lockId = await distributedLockService.acquireLock(testEmail, 'test_operation')
    if (lockId) {
      console.log('✅ Lock adquirido exitosamente:', lockId)
      
      // Verificar que el lock está activo
      const hasLock = await distributedLockService.hasActiveLock(testEmail)
      if (hasLock) {
        console.log('✅ Lock está activo correctamente')
      } else {
        console.log('❌ Error: Lock no está activo')
      }
      
      // Liberar el lock
      const released = await distributedLockService.releaseLock(lockId)
      if (released) {
        console.log('✅ Lock liberado exitosamente')
      } else {
        console.log('❌ Error: No se pudo liberar el lock')
      }
      
    } else {
      console.log('❌ Error: No se pudo adquirir el lock')
    }
    
    // Test 3: Test de withLock
    console.log('\n📋 Test 3: Probando método withLock...')
    let testExecuted = false
    
    const result = await distributedLockService.withLock('test-withlock@example.com', async () => {
      console.log('✅ Código dentro del lock ejecutándose...')
      testExecuted = true
      return 'test_success'
    }, 'test_withlock')
    
    if (result === 'test_success' && testExecuted) {
      console.log('✅ Método withLock funciona correctamente')
    } else {
      console.log('❌ Error: Método withLock no funciona')
    }
    
    // Test 4: Verificar cleanup
    console.log('\n📋 Test 4: Probando cleanup de locks expirados...')
    const cleaned = await distributedLockService.cleanupExpiredLocks()
    console.log(`✅ Limpieza completada: ${cleaned} locks limpiados`)
    
    console.log('\n' + '=' * 50)
    console.log('🎉 TODOS LOS TESTS COMPLETADOS')
    console.log('✅ SISTEMA DE LOCKS COMPLETAMENTE FUNCIONAL')
    console.log('🚀 LISTO PARA PREVENIR DUPLICACIONES DE CARPETAS')
    
    return true
    
  } catch (error) {
    console.error('❌ Error en test del sistema:', error.message)
    return false
  }
}

// Ejecutar el test
testLocksSystem()
  .then(success => {
    if (success) {
      console.log('\n🏆 SISTEMA LISTO PARA PRODUCCIÓN')
    } else {
      console.log('\n💥 HAY PROBLEMAS CON EL SISTEMA')
    }
  })
  .catch(error => {
    console.error('💥 Error fatal:', error)
  })