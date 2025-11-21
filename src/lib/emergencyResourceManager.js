/**
 * 🔥 SISTEMA DE EMERGENCIA PARA RECURSOS INSUFICIENTES
 * 
 * Maneja de forma proactiva el ERR_INSUFFICIENT_RESOURCES
 * implementando un sistema de degradación gradual y recuperación automática
 */

class EmergencyResourceManager {
  constructor() {
    this.emergencyMode = false
    this.resourcePressure = 0
    this.maxResourcePressure = 100
    this.recoveryThreshold = 30
    this.activeRequests = 0
    this.maxConcurrentRequests = 2 // Reducido drásticamente
    this.requestQueue = []
    this.lastResourceCheck = Date.now()
    this.resourceCheckInterval = 5000 // 5 segundos
    this.fallbackMode = false
    
    // Configuración de degradación
    this.degradationLevels = {
      0: { maxRequests: 10, timeout: 15000, retryDelay: 1000 },
      25: { maxRequests: 5, timeout: 10000, retryDelay: 2000 },
      50: { maxRequests: 3, timeout: 8000, retryDelay: 3000 },
      75: { maxRequests: 2, timeout: 5000, retryDelay: 5000 },
      90: { maxRequests: 1, timeout: 3000, retryDelay: 10000 },
      100: { maxRequests: 0, timeout: 1000, retryDelay: 30000 }
    }
    
    this.initResourceMonitoring()
    console.log('🚨 EmergencyResourceManager inicializado')
  }

  /**
   * Inicia el monitoreo de recursos del sistema
   */
  initResourceMonitoring() {
    setInterval(() => {
      this.checkSystemResources()
    }, this.resourceCheckInterval)
    
    // Monitorear eventos de visibilidad para pausar/resumir
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.enterLowPowerMode()
      } else {
        this.exitLowPowerMode()
      }
    })
  }

  /**
   * Verifica los recursos del sistema
   */
  checkSystemResources() {
    const now = Date.now()
    
    // Verificar si han pasado suficientes tiempo desde la última verificación
    if (now - this.lastResourceCheck < this.resourceCheckInterval) {
      return
    }
    
    this.lastResourceCheck = now
    
    // Calcular presión de recursos basada en múltiples factores
    let pressure = 0
    
    // Factor 1: Requests activas
    pressure += Math.min(this.activeRequests * 20, 40)
    
    // Factor 2: Errores recientes
    const recentErrors = this.getRecentErrorCount()
    pressure += Math.min(recentErrors * 15, 30)
    
    // Factor 3: Memoria del navegador (estimada)
    if ('memory' in performance) {
      const memory = performance.memory
      const memoryPressure = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 50
      pressure += memoryPressure
    }
    
    // Factor 4: Tiempo de respuesta de red
    pressure += this.getNetworkLatencyPressure()
    
    // Factor 5: Errores de chunk loading
    pressure += this.getChunkErrorPressure()
    
    this.resourcePressure = Math.min(pressure, this.maxResourcePressure)
    
    // Ajustar configuración según la presión
    this.adjustConfiguration()
    
    // Verificar si necesitamos entrar en modo de emergencia
    if (this.resourcePressure >= 90 && !this.emergencyMode) {
      this.enterEmergencyMode()
    } else if (this.resourcePressure <= this.recoveryThreshold && this.emergencyMode) {
      this.exitEmergencyMode()
    }
  }

  /**
   * Ajusta la configuración según la presión de recursos
   */
  adjustConfiguration() {
    const level = this.getDegradationLevel()
    const config = this.degradationLevels[level]
    
    this.maxConcurrentRequests = config.maxRequests
    this.requestTimeout = config.timeout
    this.retryDelay = config.retryDelay
    
    console.log(`📊 Presión de recursos: ${this.resourcePressure.toFixed(1)}% (Nivel ${level})`)
  }

  /**
   * Obtiene el nivel de degradación actual
   */
  getDegradationLevel() {
    if (this.resourcePressure >= 100) return 100
    if (this.resourcePressure >= 90) return 90
    if (this.resourcePressure >= 75) return 75
    if (this.resourcePressure >= 50) return 50
    if (this.resourcePressure >= 25) return 25
    return 0
  }

  /**
   * Entra en modo de emergencia
   */
  enterEmergencyMode() {
    this.emergencyMode = true
    this.fallbackMode = true
    
    console.log('🚨 MODO DE EMERGENCIA ACTIVADO')
    console.log('⚠️ Reduciendo funcionalidad para preservar recursos')
    
    // Limpiar cache agresivo
    this.aggressiveCacheCleanup()
    
    // Pausar requests no críticas
    this.pauseNonCriticalRequests()
    
    // Notificar a la UI
    this.notifyEmergencyMode()
  }

  /**
   * Sale del modo de emergencia
   */
  exitEmergencyMode() {
    this.emergencyMode = false
    this.fallbackMode = false
    
    console.log('✅ Modo de emergencia desactivado - Recuperación exitosa')
    
    // Procesar cola de requests pendientes
    this.processPendingRequests()
    
    // Notificar recuperación
    this.notifyRecovery()
  }

  /**
   * Entra en modo de bajo consumo
   */
  enterLowPowerMode() {
    console.log('🔋 Modo de bajo consumo activado')
    this.maxConcurrentRequests = Math.max(1, this.maxConcurrentRequests - 1)
  }

  /**
   * Sale del modo de bajo consumo
   */
  exitLowPowerMode() {
    console.log('⚡ Modo de bajo consumo desactivado')
    this.adjustConfiguration()
  }

  /**
   * Ejecuta una request con protección de recursos
   */
  async executeWithResourceProtection(operation, operationName = 'unknown') {
    // Verificar si estamos en modo de emergencia total
    if (this.resourcePressure >= 100) {
      throw new Error('RECURSOS_INSUFICIENTES_EMERGENCIA')
    }
    
    // Verificar límite de requests concurrentes
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return this.queueRequest(operation, operationName)
    }
    
    this.activeRequests++
    
    try {
      // Ejecutar con timeout dinámico
      const timeout = this.requestTimeout || 10000
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RECURSOS_TIMEOUT')), timeout)
        )
      ])
      
      return result
      
    } catch (error) {
      // Incrementar presión de recursos en caso de error
      this.incrementResourcePressure(error)
      throw error
      
    } finally {
      this.activeRequests--
      this.processPendingRequests()
    }
  }

  /**
   * Encola una request cuando hay límite de concurrencia
   */
  queueRequest(operation, operationName) {
    return new Promise((resolve, reject) => {
      const queueItem = { operation, operationName, resolve, reject, timestamp: Date.now() }
      this.requestQueue.push(queueItem)
      
      console.log(`⏳ Request encolada: ${operationName} (Cola: ${this.requestQueue.length})`)
    })
  }

  /**
   * Procesa requests pendientes
   */
  processPendingRequests() {
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const queueItem = this.requestQueue.shift()
      
      // Verificar si la request no ha expirado
      if (Date.now() - queueItem.timestamp > 30000) { // 30 segundos timeout
        queueItem.reject(new Error('REQUEST_EXPIRED'))
        continue
      }
      
      this.executeWithResourceProtection(queueItem.operation, queueItem.operationName)
        .then(queueItem.resolve)
        .catch(queueItem.reject)
    }
  }

  /**
   * Limpieza agresiva de cache
   */
  aggressiveCacheCleanup() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }).then(() => {
        console.log('🧹 Cache limpiado agresivamente')
      })
    }
    
    // Limpiar localStorage no crítico
    const keysToKeep = ['supabase.auth.token', 'user-preferences']
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Pausa requests no críticas
   */
  pauseNonCriticalRequests() {
    // Marcar requests como no críticas para pausarlas
    this.nonCriticalPaused = true
  }

  /**
   * Notifica modo de emergencia a la UI
   */
  notifyEmergencyMode() {
    // Dispatch custom event para que los componentes puedan reaccionar
    window.dispatchEvent(new CustomEvent('emergencyMode', {
      detail: { 
        active: true, 
        resourcePressure: this.resourcePressure,
        message: 'Sistema en modo de emergencia - Funcionalidad reducida'
      }
    }))
  }

  /**
   * Notifica recuperación a la UI
   */
  notifyRecovery() {
    window.dispatchEvent(new CustomEvent('emergencyMode', {
      detail: { 
        active: false, 
        resourcePressure: this.resourcePressure,
        message: 'Sistema recuperado - Funcionalidad completa restaurada'
      }
    }))
  }

  /**
   * Incrementa la presión de recursos basada en errores
   */
  incrementResourcePressure(error) {
    let increment = 0
    
    if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
      increment = 20
    } else if (error.message?.includes('Failed to fetch')) {
      increment = 10
    } else if (error.message?.includes('ChunkLoadError')) {
      increment = 15
    } else {
      increment = 5
    }
    
    this.resourcePressure = Math.min(this.resourcePressure + increment, this.maxResourcePressure)
    console.log(`📈 Presión de recursos incrementada a ${this.resourcePressure.toFixed(1)}%`)
  }

  /**
   * Obtiene el conteo de errores recientes
   */
  getRecentErrorCount() {
    // Implementación simplificada - en producción usarías un sistema más robusto
    return window.recentErrorCount || 0
  }

  /**
   * Calcula la presión basada en latencia de red
   */
  getNetworkLatencyPressure() {
    // Estimación basada en tiempo de respuesta promedio
    const avgResponseTime = window.avgNetworkLatency || 1000
    return Math.min((avgResponseTime / 5000) * 20, 20)
  }

  /**
   * Calcula la presión basada en errores de chunk
   */
  getChunkErrorPressure() {
    const chunkErrors = window.chunkErrorCount || 0
    return Math.min(chunkErrors * 10, 30)
  }

  /**
   * Obtiene el estado actual del manager
   */
  getStatus() {
    return {
      emergencyMode: this.emergencyMode,
      resourcePressure: this.resourcePressure,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.maxConcurrentRequests,
      degradationLevel: this.getDegradationLevel(),
      fallbackMode: this.fallbackMode
    }
  }

  /**
   * Reset manual del sistema
   */
  reset() {
    this.emergencyMode = false
    this.resourcePressure = 0
    this.activeRequests = 0
    this.requestQueue = []
    this.fallbackMode = false
    
    console.log('🔄 EmergencyResourceManager reseteado')
  }
}

// Instancia global
export const emergencyResourceManager = new EmergencyResourceManager()

// Función helper para uso sencillo
export const executeWithEmergencyProtection = (operation, operationName = 'emergency_request') => {
  return emergencyResourceManager.executeWithResourceProtection(operation, operationName)
}

export default emergencyResourceManager