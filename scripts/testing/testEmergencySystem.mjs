/**
 * 🧪 SCRIPT DE PRUEBA PARA SISTEMA DE EMERGENCIA
 * 
 * Valida que el sistema de emergencia funciona correctamente
 * y maneja los errores ERR_INSUFFICIENT_RESOURCES
 */

import { emergencyResourceManager } from '../src/lib/emergencyResourceManager.js'
import { supabaseCircuitBreaker } from '../src/lib/supabaseCircuitBreaker.js'

class EmergencySystemTester {
  constructor() {
    this.testResults = []
    this.startTime = Date.now()
  }

  /**
   * Ejecuta todas las pruebas del sistema de emergencia
   */
  async runAllTests() {
    console.log('🧪 Iniciando pruebas del sistema de emergencia...\n')

    try {
      await this.testResourceManager()
      await this.testCircuitBreaker()
      await this.testEmergencyMode()
      await this.testErrorHandling()
      await this.testRecovery()

      this.printResults()
      
    } catch (error) {
      console.error('❌ Error durante las pruebas:', error)
    }
  }

  /**
   * Prueba el Resource Manager
   */
  async testResourceManager() {
    console.log('📊 Probando EmergencyResourceManager...')
    
    try {
      // Test 1: Estado inicial
      const initialStatus = emergencyResourceManager.getStatus()
      this.assert(initialStatus.emergencyMode === false, 'Estado inicial: no debe estar en modo emergencia')
      this.assert(initialStatus.resourcePressure >= 0, 'Presión de recursos debe ser >= 0')

      // Test 2: Simular presión de recursos
      emergencyResourceManager.resourcePressure = 85
      emergencyResourceManager.checkSystemResources()
      
      const afterPressureStatus = emergencyResourceManager.getStatus()
      this.assert(afterPressureStatus.resourcePressure <= 100, 'Presión no debe exceder 100%')

      // Test 3: Ejecutar operación protegida
      const result = await emergencyResourceManager.executeWithResourceProtection(
        () => Promise.resolve('test-success'),
        'test-operation'
      )
      this.assert(result === 'test-success', 'Operación protegida debe ejecutarse correctamente')

      this.logTest('EmergencyResourceManager', 'PASSED')
      
    } catch (error) {
      this.logTest('EmergencyResourceManager', 'FAILED', error.message)
    }
  }

  /**
   * Prueba el Circuit Breaker
   */
  async testCircuitBreaker() {
    console.log('🔧 Probando Circuit Breaker...')
    
    try {
      // Test 1: Estado inicial
      const initialStatus = supabaseCircuitBreaker.getStatus()
      this.assert(initialStatus.state === 'CLOSED', 'Estado inicial debe ser CLOSED')

      // Test 2: Simular fallos
      for (let i = 0; i < 3; i++) {
        try {
          await supabaseCircuitBreaker.execute(
            () => Promise.reject(new Error('test-error')),
            'test-failure'
          )
        } catch (error) {
          // Esperado
        }
      }

      const afterFailuresStatus = supabaseCircuitBreaker.getStatus()
      this.assert(afterFailuresStatus.failureCount >= 3, 'Debe registrar los fallos')

      this.logTest('CircuitBreaker', 'PASSED')
      
    } catch (error) {
      this.logTest('CircuitBreaker', 'FAILED', error.message)
    }
  }

  /**
   * Prueba el modo de emergencia
   */
  async testEmergencyMode() {
    console.log('🚨 Probando modo de emergencia...')
    
    try {
      // Test 1: Activar modo de emergencia manualmente
      emergencyResourceManager.enterEmergencyMode()
      
      const emergencyStatus = emergencyResourceManager.getStatus()
      this.assert(emergencyStatus.emergencyMode === true, 'Debe estar en modo emergencia')

      // Test 2: Verificar que las operaciones se manejan correctamente
      try {
        await emergencyResourceManager.executeWithResourceProtection(
          () => Promise.resolve('emergency-test'),
          'emergency-operation'
        )
      } catch (error) {
        // En modo de emergencia extremo, puede fallar
        this.assert(error.message === 'RECURSOS_INSUFICIENTES_EMERGENCIA', 'Debe lanzar error específico')
      }

      // Test 3: Salir del modo de emergencia
      emergencyResourceManager.exitEmergencyMode()
      
      const recoveryStatus = emergencyResourceManager.getStatus()
      this.assert(recoveryStatus.emergencyMode === false, 'Debe salir del modo emergencia')

      this.logTest('EmergencyMode', 'PASSED')
      
    } catch (error) {
      this.logTest('EmergencyMode', 'FAILED', error.message)
    }
  }

  /**
   * Prueba el manejo de errores
   */
  async testErrorHandling() {
    console.log('❌ Probando manejo de errores...')
    
    try {
      // Test 1: Error ERR_INSUFFICIENT_RESOURCES
      const insufficientResourcesError = new Error('ERR_INSUFFICIENT_RESOURCES')
      emergencyResourceManager.incrementResourcePressure(insufficientResourcesError)
      
      const statusAfterError = emergencyResourceManager.getStatus()
      this.assert(statusAfterError.resourcePressure > 0, 'Debe incrementar presión con error de recursos')

      // Test 2: Error de chunk
      const chunkError = new Error('ChunkLoadError: Loading chunk failed')
      emergencyResourceManager.incrementResourcePressure(chunkError)
      
      const statusAfterChunkError = emergencyResourceManager.getStatus()
      this.assert(statusAfterChunkError.resourcePressure > statusAfterError.resourcePressure, 'Debe incrementar más con error de chunk')

      this.logTest('ErrorHandling', 'PASSED')
      
    } catch (error) {
      this.logTest('ErrorHandling', 'FAILED', error.message)
    }
  }

  /**
   * Prueba la recuperación del sistema
   */
  async testRecovery() {
    console.log('🔄 Probando recuperación del sistema...')
    
    try {
      // Test 1: Resetear sistema
      emergencyResourceManager.reset()
      
      const resetStatus = emergencyResourceManager.getStatus()
      this.assert(resetStatus.emergencyMode === false, 'No debe estar en modo emergencia después del reset')
      this.assert(resetStatus.resourcePressure === 0, 'Presión debe ser 0 después del reset')

      // Test 2: Verificar que las operaciones funcionan después del reset
      const result = await emergencyResourceManager.executeWithResourceProtection(
        () => Promise.resolve('recovery-test'),
        'recovery-operation'
      )
      this.assert(result === 'recovery-test', 'Las operaciones deben funcionar después del reset')

      this.logTest('Recovery', 'PASSED')
      
    } catch (error) {
      this.logTest('Recovery', 'FAILED', error.message)
    }
  }

  /**
   * Registra el resultado de una prueba
   */
  logTest(testName, status, error = null) {
    const result = {
      test: testName,
      status,
      error,
      timestamp: Date.now()
    }
    
    this.testResults.push(result)
    
    const icon = status === 'PASSED' ? '✅' : '❌'
    console.log(`${icon} ${testName}: ${status}`)
    
    if (error) {
      console.log(`   Error: ${error}`)
    }
  }

  /**
   * Afirma una condición
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  /**
   * Imprime los resultados finales
   */
  printResults() {
    const endTime = Date.now()
    const duration = endTime - this.startTime
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length
    const failed = this.testResults.filter(r => r.status === 'FAILED').length
    const total = this.testResults.length
    
    console.log('\n📊 RESULTADOS DE LAS PRUEBAS')
    console.log('='.repeat(50))
    console.log(`✅ Pasadas: ${passed}/${total}`)
    console.log(`❌ Fallidas: ${failed}/${total}`)
    console.log(`⏱️ Duración: ${duration}ms`)
    console.log(`🎯 Tasa de éxito: ${((passed/total) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      console.log('\n❌ PRUEBAS FALLIDAS:')
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => {
          console.log(`   • ${r.test}: ${r.error}`)
        })
    }
    
    console.log('\n' + '='.repeat(50))
    
    if (failed === 0) {
      console.log('🎉 ¡Todas las pruebas pasaron! El sistema de emergencia está funcionando correctamente.')
    } else {
      console.log('⚠️ Algunas pruebas fallaron. Revisar la implementación del sistema de emergencia.')
    }
  }
}

// Ejecutar las pruebas si se llama directamente
if (typeof window !== 'undefined') {
  // En el navegador
  window.EmergencySystemTester = EmergencySystemTester
  console.log('🧪 EmergencySystemTester disponible en window.EmergencySystemTester')
} else {
  // En Node.js
  const tester = new EmergencySystemTester()
  tester.runAllTests()
}

export default EmergencySystemTester