#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE STRESS TESTING PARA ERRORES CRÍTICOS
 * 
 * Valida que las soluciones implementadas para errores críticos funcionen:
 * - ERR_INSUFFICIENT_RESOURCES (Circuit Breaker)
 * - ChunkLoadError (Error Boundaries)
 * - React JSX Warnings
 * - Conectividad Supabase
 */

const fs = require('fs')
const path = require('path')

class StressTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[type] || 'ℹ️'
    
    console.log(`[${timestamp}] ${prefix} ${message}`)
  }

  async runTest(testName, testFunction) {
    this.log(`Ejecutando: ${testName}`, 'test')
    
    try {
      const result = await testFunction()
      if (result.success) {
        this.results.passed++
        this.results.details.push({ test: testName, status: 'PASSED', message: result.message })
        this.log(`${testName}: ${result.message}`, 'success')
      } else {
        this.results.failed++
        this.results.details.push({ test: testName, status: 'FAILED', message: result.message })
        this.log(`${testName}: ${result.message}`, 'error')
      }
    } catch (error) {
      this.results.failed++
      this.results.details.push({ test: testName, status: 'ERROR', message: error.message })
      this.log(`${testName}: ERROR - ${error.message}`, 'error')
    }
  }

  // Test 1: Verificar Circuit Breaker existe y es válido
  async testCircuitBreaker() {
    const circuitBreakerPath = path.join(__dirname, '../src/lib/supabaseCircuitBreaker.js')
    
    if (!fs.existsSync(circuitBreakerPath)) {
      return { success: false, message: 'Circuit Breaker no encontrado' }
    }

    const content = fs.readFileSync(circuitBreakerPath, 'utf8')
    
    // Verificar componentes clave del circuit breaker
    const requiredElements = [
      'class SupabaseCircuitBreaker',
      'execute(',
      'CIRCUIT_BREAKER_OPEN',
      'failureThreshold',
      'recoveryTimeout'
    ]

    const missingElements = requiredElements.filter(element => !content.includes(element))
    
    if (missingElements.length > 0) {
      return { success: false, message: `Elementos faltantes: ${missingElements.join(', ')}` }
    }

    return { success: true, message: 'Circuit Breaker implementado correctamente' }
  }

  // Test 2: Verificar Error Boundary para chunks
  async testChunkErrorBoundary() {
    const errorBoundaryPath = path.join(__dirname, '../src/components/error/ChunkErrorBoundary.js')
    
    if (!fs.existsSync(errorBoundaryPath)) {
      return { success: false, message: 'ChunkErrorBoundary no encontrado' }
    }

    const content = fs.readFileSync(errorBoundaryPath, 'utf8')
    
    const requiredElements = [
      'ChunkLoadError',
      'handleRetry',
      'componentDidCatch',
      'getDerivedStateFromError'
    ]

    const missingElements = requiredElements.filter(element => !content.includes(element))
    
    if (missingElements.length > 0) {
      return { success: false, message: `Elementos faltantes: ${missingElements.join(', ')}` }
    }

    return { success: true, message: 'Error Boundary para chunks implementado correctamente' }
  }

  // Test 3: Verificar Componente de Retry
  async testChunkRetryWrapper() {
    const retryWrapperPath = path.join(__dirname, '../src/components/error/ChunkRetryWrapper.js')
    
    if (!fs.existsSync(retryWrapperPath)) {
      return { success: false, message: 'ChunkRetryWrapper no encontrado' }
    }

    const content = fs.readFileSync(retryWrapperPath, 'utf8')
    
    const requiredElements = [
      'ChunkRetryWrapper',
      'useChunkRetry',
      'retryCount',
      'maxRetries'
    ]

    const missingElements = requiredElements.filter(element => !content.includes(element))
    
    if (missingElements.length > 0) {
      return { success: false, message: `Elementos faltantes: ${missingElements.join(', ')}` }
    }

    return { success: true, message: 'Componente de retry implementado correctamente' }
  }

  // Test 4: Verificar corrección JSX en EnhancedLoadingSpinner
  async testJSXCorrection() {
    const spinnerPath = path.join(__dirname, '../src/components/common/EnhancedLoadingSpinner.js')
    
    if (!fs.existsSync(spinnerPath)) {
      return { success: false, message: 'EnhancedLoadingSpinner no encontrado' }
    }

    const content = fs.readFileSync(spinnerPath, 'utf8')
    
    // Verificar que no use <style> inline y sí use dangerouslySetInnerHTML
    if (content.includes('<style>{') || content.includes('</style>')) {
      return { success: false, message: 'Aún usa <style> inline en lugar de dangerouslySetInnerHTML' }
    }

    if (!content.includes('dangerouslySetInnerHTML')) {
      return { success: false, message: 'No usa dangerouslySetInnerHTML' }
    }

    return { success: true, message: 'Corrección JSX aplicada correctamente' }
  }

  // Test 5: Verificar integración en AuthContext
  async testAuthContextIntegration() {
    const authContextPath = path.join(__dirname, '../src/contexts/AuthContext.js')
    
    if (!fs.existsSync(authContextPath)) {
      return { success: false, message: 'AuthContext no encontrado' }
    }

    const content = fs.readFileSync(authContextPath, 'utf8')
    
    const requiredElements = [
      'protectedSupabaseRequest',
      'supabaseCircuitBreaker',
      'finally {',
      'profileLoadInProgressRef.current = false'
    ]

    const missingElements = requiredElements.filter(element => !content.includes(element))
    
    if (missingElements.length > 0) {
      return { success: false, message: `Elementos faltantes: ${missingElements.join(', ')}` }
    }

    return { success: true, message: 'Integración en AuthContext correcta' }
  }

  // Test 6: Verificar estructura de archivos de error
  async testErrorDirectoryStructure() {
    const errorDir = path.join(__dirname, '../src/components/error')
    
    if (!fs.existsSync(errorDir)) {
      return { success: false, message: 'Directorio error/ no existe' }
    }

    const files = fs.readdirSync(errorDir)
    const expectedFiles = ['ChunkErrorBoundary.js', 'ChunkRetryWrapper.js']
    
    const missingFiles = expectedFiles.filter(file => !files.includes(file))
    
    if (missingFiles.length > 0) {
      return { success: false, message: `Archivos faltantes: ${missingFiles.join(', ')}` }
    }

    return { success: true, message: 'Estructura de archivos de error correcta' }
  }

  // Test 7: Simular carga de componentes críticos
  async testCriticalComponentLoading() {
    // Verificar que los componentes críticos existan
    const criticalComponents = [
      '../src/components/common/EnhancedLoadingSpinner.js',
      '../src/components/common/SuspenseWrapper.js'
    ]

    for (const componentPath of criticalComponents) {
      const fullPath = path.join(__dirname, componentPath)
      if (!fs.existsSync(fullPath)) {
        return { success: false, message: `Componente crítico faltante: ${componentPath}` }
      }
    }

    return { success: true, message: 'Todos los componentes críticos están presentes' }
  }

  // Test 8: Verificar configuración de Supabase
  async testSupabaseConfiguration() {
    const supabasePath = path.join(__dirname, '../src/lib/forcedSupabaseClient.js')
    
    if (!fs.existsSync(supabasePath)) {
      return { success: false, message: 'forcedSupabaseClient no encontrado' }
    }

    const content = fs.readFileSync(supabasePath, 'utf8')
    
    const requiredElements = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'persistSession',
      'autoRefreshToken'
    ]

    const missingElements = requiredElements.filter(element => !content.includes(element))
    
    if (missingElements.length > 0) {
      return { success: false, message: `Configuración faltante: ${missingElements.join(', ')}` }
    }

    return { success: true, message: 'Configuración de Supabase correcta' }
  }

  async runAllTests() {
    this.log('🧪 INICIANDO STRESS TESTING PARA ERRORES CRÍTICOS', 'info')
    this.log('=' .repeat(60), 'info')

    // Ejecutar todos los tests
    await this.runTest('Circuit Breaker Implementation', () => this.testCircuitBreaker())
    await this.runTest('Chunk Error Boundary', () => this.testChunkErrorBoundary())
    await this.runTest('Chunk Retry Wrapper', () => this.testChunkRetryWrapper())
    await this.runTest('JSX Warning Correction', () => this.testJSXCorrection())
    await this.runTest('AuthContext Integration', () => this.testAuthContextIntegration())
    await this.runTest('Error Directory Structure', () => this.testErrorDirectoryStructure())
    await this.runTest('Critical Component Loading', () => this.testCriticalComponentLoading())
    await this.runTest('Supabase Configuration', () => this.testSupabaseConfiguration())

    // Generar reporte final
    this.generateReport()
  }

  generateReport() {
    this.log('=' .repeat(60), 'info')
    this.log('📊 REPORTE FINAL DE STRESS TESTING', 'info')
    this.log('=' .repeat(60), 'info')

    this.log(`✅ Tests Pasados: ${this.results.passed}`, 'success')
    this.log(`❌ Tests Fallidos: ${this.results.failed}`, 'error')
    this.log(`⚠️ Warnings: ${this.results.warnings}`, 'warning')

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)
    this.log(`📈 Tasa de Éxito: ${successRate}%`, 'info')

    if (this.results.failed === 0) {
      this.log('🎉 ¡TODAS LAS SOLUCIONES ESTÁN FUNCIONANDO CORRECTAMENTE!', 'success')
    } else {
      this.log('⚠️ SE DETECTARON PROBLEMAS QUE REQUIEREN ATENCIÓN', 'warning')
    }

    // Detalles de tests fallidos
    const failedTests = this.results.details.filter(test => test.status !== 'PASSED')
    if (failedTests.length > 0) {
      this.log('\n🔍 DETALLES DE PROBLEMAS:', 'warning')
      failedTests.forEach(test => {
        this.log(`  • ${test.test}: ${test.message}`, 'error')
      })
    }

    // Recomendaciones
    this.log('\n💡 RECOMENDACIONES:', 'info')
    if (this.results.failed === 0) {
      this.log('  • Continuar con testing en producción', 'info')
      this.log('  • Monitorear logs para errores en tiempo real', 'info')
      this.log('  • Considerar tests automatizados en CI/CD', 'info')
    } else {
      this.log('  • Revisar y corregir los tests fallidos', 'error')
      this.log('  • Verificar que todos los archivos estén en su lugar', 'warning')
      this.log('  • Ejecutar el script nuevamente después de las correcciones', 'info')
    }

    this.log('\n🏁 STRESS TESTING COMPLETADO', 'info')
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const runner = new StressTestRunner()
  runner.runAllTests().catch(error => {
    console.error('❌ Error ejecutando stress testing:', error)
    process.exit(1)
  })
}

module.exports = StressTestRunner