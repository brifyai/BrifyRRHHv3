/**
 * 🔥 CIRCUIT BREAKER PARA SUPABASE - SOLUCIÓN DEFINITIVA
 * 
 * Previene ERR_INSUFFICIENT_RESOURCES implementando un circuit breaker
 * que protege contra sobrecarga de red y fallos de conectividad
 */

class SupabaseCircuitBreaker {
  constructor() {
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.nextAttempt = null
    
    // Configuración del circuit breaker
    this.config = {
      failureThreshold: 5,        // Número de fallos antes de abrir
      recoveryTimeout: 30000,     // 30 segundos antes de intentar recuperación
      successThreshold: 3,        // Éxitos necesarios para cerrar desde HALF_OPEN
      timeout: 10000,             // 10 segundos timeout por request
      maxRetries: 3,              // Máximo reintentos
      retryDelay: 1000            // Delay inicial entre reintentos
    }
    
    this.requestQueue = new Map()
    this.activeRequests = 0
    this.maxConcurrentRequests = 3
    
    console.log('🔧 Circuit Breaker inicializado con configuración:', this.config)
  }

  /**
   * Ejecuta una función protegida por el circuit breaker
   */
  async execute(operation, operationName = 'unknown') {
    // Verificar si podemos hacer la request
    if (!this.canExecute()) {
      const error = new Error(`Circuit Breaker OPEN - Demasiados fallos recientes`)
      error.code = 'CIRCUIT_BREAKER_OPEN'
      throw error
    }

    // Verificar límite de requests concurrentes
    if (this.activeRequests >= this.maxConcurrentRequests) {
      console.log(`⏳ Request ${operationName} en cola por límite de concurrencia`)
      return this.queueRequest(operation, operationName)
    }

    this.activeRequests++
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Ejecutando ${operationName} (Estado: ${this.state})`)
      
      const result = await this.executeWithTimeout(operation, this.config.timeout)
      
      // Éxito - actualizar métricas
      this.onSuccess()
      this.logPerformance(operationName, startTime)
      
      return result
      
    } catch (error) {
      // Fallo - actualizar métricas
      this.onFailure()
      this.logError(operationName, error)
      
      throw error
      
    } finally {
      this.activeRequests--
      this.processQueue()
    }
  }

  /**
   * Ejecuta con timeout
   */
  async executeWithTimeout(operation, timeout) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ])
  }

  /**
   * Verifica si podemos ejecutar una request
   */
  canExecute() {
    if (this.state === 'CLOSED') return true
    if (this.state === 'HALF_OPEN') return true
    
    // Estado OPEN - verificar si es tiempo de intentar recuperación
    if (this.state === 'OPEN' && this.nextAttempt && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN'
      this.successCount = 0
      console.log('🔄 Circuit Breaker transitando a HALF_OPEN')
      return true
    }
    
    return false
  }

  /**
   * Maneja un éxito
   */
  onSuccess() {
    this.failureCount = 0
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED'
        console.log('✅ Circuit Breaker cerrado - recuperación exitosa')
      }
    }
  }

  /**
   * Maneja un fallo
   */
  onFailure() {
    this.failureCount++
    
    if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.config.recoveryTimeout
      console.log('🚨 Circuit Breaker ABIERTO - demasiados fallos')
    } else if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.config.recoveryTimeout
      console.log('🚨 Circuit Breaker reabierto durante HALF_OPEN')
    }
  }

  /**
   * Encola una request cuando hay límite de concurrencia
   */
  queueRequest(operation, operationName) {
    return new Promise((resolve, reject) => {
      const queueItem = { operation, operationName, resolve, reject }
      this.requestQueue.set(operationName, queueItem)
    })
  }

  /**
   * Procesa la cola de requests
   */
  processQueue() {
    if (this.activeRequests >= this.maxConcurrentRequests) return
    
    const [operationName, queueItem] = this.requestQueue.entries().next()
    if (queueItem.done) return
    
    this.requestQueue.delete(operationName)
    
    // Ejecutar request encolada
    this.execute(queueItem.operation, queueItem.operationName)
      .then(queueItem.resolve)
      .catch(queueItem.reject)
  }

  /**
   * Log de performance
   */
  logPerformance(operationName, startTime) {
    const duration = Date.now() - startTime
    console.log(`⚡ ${operationName} completado en ${duration}ms`)
  }

  /**
   * Log de errores
   */
  logError(operationName, error) {
    console.error(`❌ Error en ${operationName}:`, error.message)
  }

  /**
   * Obtiene el estado actual
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.size,
      nextAttempt: this.nextAttempt
    }
  }

  /**
   * Reset manual del circuit breaker
   */
  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.nextAttempt = null
    this.requestQueue.clear()
    this.activeRequests = 0
    
    console.log('🔄 Circuit Breaker reseteado manualmente')
  }
}

// Instancia global del circuit breaker
export const supabaseCircuitBreaker = new SupabaseCircuitBreaker()

// Función helper para requests protegidas
export const protectedSupabaseRequest = async (operation, operationName = 'supabase_request') => {
  return supabaseCircuitBreaker.execute(operation, operationName)
}

export default supabaseCircuitBreaker