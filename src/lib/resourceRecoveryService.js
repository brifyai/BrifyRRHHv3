/**
 * 🔥 SERVICIO INTEGRAL DE RECUPERACIÓN DE RECURSOS
 * 
 * Soluciona ERR_INSUFFICIENT_RESOURCES y ChunkLoadError
 * mediante un sistema unificado de recuperación automática
 */

// Importar React solo si está disponible
let React = null
try {
  React = require('react')
} catch (e) {
  // React no está disponible en este contexto
}

// Importar Swal si está disponible
let Swal = null
try {
  Swal = require('sweetalert2')
} catch (e) {
  // Swal no está disponible
}

class ResourceRecoveryService {
  constructor() {
    this.emergencyMode = false
    this.resourcePressure = 0
    this.maxResourcePressure = 100
    this.recoveryThreshold = 70 // Más tolerante - solo activa emergencia en casos críticos
    this.activeRequests = 0
    this.maxConcurrentRequests = 5 // Menos conservador para permitir más requests
    this.requestQueue = []
    this.lastResourceCheck = Date.now()
    this.resourceCheckInterval = 5000 // 5 segundos - menos frecuente
    this.fallbackMode = false
    this.circuitBreakerStates = new Map()
    this.failedChunks = new Set()
    this.chunkRetryCounts = new Map()
    
    // Configuración de degradación más tolerante
    this.degradationLevels = {
      0: { maxRequests: 5, timeout: 10000, retryDelay: 1000, chunkRetries: 3 },
      25: { maxRequests: 4, timeout: 8000, retryDelay: 2000, chunkRetries: 2 },
      50: { maxRequests: 3, timeout: 6000, retryDelay: 3000, chunkRetries: 2 },
      75: { maxRequests: 2, timeout: 4000, retryDelay: 5000, chunkRetries: 1 },
      100: { maxRequests: 1, timeout: 2000, retryDelay: 10000, chunkRetries: 0 }
    }
    
    this.initEmergencyMode()
    this.setupGlobalErrorHandlers()
    this.startResourceMonitoring()
    
    console.log('🚨 ResourceRecoveryService inicializado - Modo ultra-conservador activado')
  }
/**
   * Método público de inicialización manual
   * Permite inicializar el servicio de forma explícita si es necesario
   */
  init() {
    console.log('🚀 ResourceRecoveryService: Inicialización manual iniciada')
    
    // Re-inicializar componentes críticos
    this.initEmergencyMode()
    this.setupGlobalErrorHandlers()
    this.startResourceMonitoring()
    
    console.log('✅ ResourceRecoveryService: Inicialización manual completada')
    return true
  }

  /**
   * Inicializa el modo de emergencia
   */
  initEmergencyMode() {
    // Detectar si ya estamos en modo de emergencia
    if (this.isSystemUnderStress()) {
      this.enterEmergencyMode('Sistema detectado bajo estrés al inicializar')
    }
    
    // Configurar listener para visibilidad de página
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.enterLowPowerMode()
        } else {
          this.exitLowPowerMode()
        }
      })
    }
  }

  /**
   * Configura manejadores globales de errores
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return
    
    // Manejar errores de red globales
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada - Iniciando recuperación')
      this.attemptRecovery()
    })
    
    window.addEventListener('offline', () => {
      console.log('📴 Conexión perdida - Activando modo offline')
      this.enterOfflineMode()
    })
    
    // ⚠️ DESACTIVADO TEMPORALMENTE - Interfería con funcionamiento normal
    // const originalFetch = window.fetch
    // if (originalFetch) {
    //   window.fetch = async (...args) => {
    //     try {
    //       return await this.protectedFetch(originalFetch, ...args)
    //     } catch (error) {
    //       if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    //         console.warn('🚨 Fetch protegido falló:', error.message)
    //         throw this.createFriendlyError('ERR_INSUFFICIENT_RESOURCES', 'Recursos insuficientes para completar la solicitud')
    //       }
    //       throw error
    //     }
    //   }
    // }
    
    // ✅ MODO PERMISIVO - Solo logging, sin interferencia
    const originalFetch = window.fetch
    if (originalFetch) {
      window.fetch = async (...args) => {
        console.log('📡 Fetch normal ejecutado:', args[0])
        return await originalFetch(...args)
      }
    }
  }

  /**
   * Fetch protegido con circuit breaker
   */
  async protectedFetch(originalFetch, ...args) {
    const url = args[0]
    const operationName = `fetch_${typeof url === 'string' ? url.substring(0, 50) : 'unknown'}`
    
    // Verificar si podemos ejecutar
    if (!this.canExecuteRequest()) {
      throw this.createFriendlyError('CIRCUIT_BREAKER_OPEN', 'Sistema sobrecargado, intentando recuperación...')
    }
    
    this.activeRequests++
    
    try {
      const result = await Promise.race([
        originalFetch(...args),
        this.createTimeoutPromise(this.getCurrentConfig().timeout)
      ])
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`)
      }
      
      this.onRequestSuccess()
      return result
    } catch (error) {
      this.onRequestFailure(error, operationName)
      throw error
    } finally {
      this.activeRequests--
      this.processQueue()
    }
  }

  /**
   * Importación segura de chunks con retry inteligente
   */
  async safeImport(importFunction, chunkName) {
    // Si el chunk ya falló permanentemente, usar fallback
    if (this.failedChunks.has(chunkName)) {
      console.warn(`🔄 Chunk ${chunkName} marcado como fallido, usando fallback`)
      return this.getChunkFallback(chunkName)
    }
    
    const retryCount = this.chunkRetryCounts.get(chunkName) || 0
    const maxRetries = this.getCurrentConfig().chunkRetries
    
    if (retryCount >= maxRetries) {
      console.error(`❌ Chunk ${chunkName} excedió reintentos máximos`)
      this.failedChunks.add(chunkName)
      return this.getChunkFallback(chunkName)
    }
    
    try {
      console.log(`📦 Cargando chunk ${chunkName} (intento ${retryCount + 1}/${maxRetries + 1})`)
      
      const result = await Promise.race([
        importFunction(),
        this.createTimeoutPromise(5000) // 5 segundos timeout para chunks
      ])
      
      console.log(`✅ Chunk ${chunkName} cargado exitosamente`)
      this.chunkRetryCounts.delete(chunkName)
      return result
      
    } catch (error) {
      console.error(`❌ Error cargando chunk ${chunkName}:`, error.message)
      
      this.chunkRetryCounts.set(chunkName, retryCount + 1)
      
      if (retryCount < maxRetries) {
        const delay = this.getCurrentConfig().retryDelay * (retryCount + 1)
        console.log(`⏳ Reintentando chunk ${chunkName} en ${delay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.safeImport(importFunction, chunkName)
      } else {
        this.failedChunks.add(chunkName)
        return this.getChunkFallback(chunkName)
      }
    }
  }

  /**
   * Fallback para chunks fallidos
   */
  getChunkFallback(chunkName) {
    console.warn(`🎭 Usando fallback para chunk: ${chunkName}`)
    
    // Si React está disponible, retornar componente React
    if (React) {
      return {
        default: () => React.createElement('div', {
          className: 'p-4 bg-gray-100 rounded-lg text-center',
          'data-fallback': chunkName
        }, [
          React.createElement('div', { key: 'icon', className: 'text-gray-400 mb-2' }, '⚠️'),
          React.createElement('div', { key: 'text', className: 'text-gray-600' }, 
            `Componente ${chunkName} temporalmente no disponible`
          ),
          React.createElement('button', {
            key: 'retry',
            className: 'mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm',
            onClick: () => {
              this.failedChunks.delete(chunkName)
              this.chunkRetryCounts.delete(chunkName)
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }
          }, 'Reintentar')
        ])
      }
    }
    
    // Fallback sin React
    return {
      default: () => ({
        type: 'div',
        props: {
          className: 'p-4 bg-gray-100 rounded-lg text-center',
          children: [
            { type: 'div', props: { className: 'text-gray-400 mb-2' }, children: ['⚠️'] },
            { type: 'div', props: { className: 'text-gray-600' }, children: [`Componente ${chunkName} temporalmente no disponible`] }
          ]
        }
      })
    }
  }

  /**
   * Verifica si el sistema está bajo estrés
   */
  isSystemUnderStress() {
    const memory = (typeof performance !== 'undefined' && performance.memory) ? performance.memory : null
    const now = Date.now()
    
    // Verificar memoria
    const memoryPressure = memory ? 
      (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0
    
    // Verificar tiempo de respuesta
    const responseTime = now - this.lastResourceCheck
    // Usar responseTime para evitar warning de ESLint
    const timePressure = responseTime > 10000 ? 20 : 0
    
    // Verificar requests activos
    const requestPressure = (this.activeRequests / this.maxConcurrentRequests) * 100
    
    const totalPressure = Math.max(memoryPressure, requestPressure, timePressure)
    
    if (totalPressure > 50) {
      console.warn(`🚨 Sistema bajo estrés: ${totalPressure.toFixed(1)}%`)
      return true
    }
    
    return false
  }

  /**
   * Entra en modo de emergencia
   */
  enterEmergencyMode(reason) {
    if (this.emergencyMode) return
    
    this.emergencyMode = true
    this.resourcePressure = Math.min(this.resourcePressure + 25, 100)
    
    console.error('🚨 MODO DE EMERGENCIA ACTIVADO:', reason)
    console.log('📊 Presión de recursos:', this.resourcePressure + '%')
    
    // Mostrar notificación al usuario
    this.showEmergencyNotification()
    
    // Aplicar degradación inmediata
    this.applyDegradation()
  }

  /**
   * Intenta recuperación del sistema
   */
  async attemptRecovery() {
    console.log('🔄 Iniciando proceso de recuperación...')
    
    // Reducir presión gradualmente
    this.resourcePressure = Math.max(this.resourcePressure - 20, 0)
    
    if (this.resourcePressure <= this.recoveryThreshold) {
      this.exitEmergencyMode()
    } else {
      // Programar siguiente intento
      setTimeout(() => this.attemptRecovery(), 10000)
    }
  }

  /**
   * Sale del modo de emergencia
   */
  exitEmergencyMode() {
    this.emergencyMode = false
    this.resourcePressure = 0
    this.fallbackMode = false
    
    console.log('✅ Modo de emergencia desactivado - Sistema recuperado')
    
    // Limpiar chunks fallidos después de un tiempo
    setTimeout(() => {
      this.failedChunks.clear()
      this.chunkRetryCounts.clear()
    }, 30000)
  }

  /**
   * Muestra notificación de emergencia
   */
  showEmergencyNotification() {
    if (Swal) {
      Swal.fire({
        title: '⚠️ Modo de Emergencia Activado',
        html: `
          <div class="text-left">
            <p><strong>Problema detectado:</strong> Recursos del sistema insuficientes</p>
            <p><strong>Acción:</strong> La aplicación funcionará en modo degradado</p>
            <p><strong>Estado:</strong> Intentando recuperación automática...</p>
            <div class="mt-3">
              <div class="bg-gray-200 rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full transition-all" style="width: ${this.resourcePressure}%"></div>
              </div>
            </div>
          </div>
        `,
        icon: 'warning',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true
      })
    } else {
      // Fallback sin Swal
      console.warn('⚠️ MODO DE EMERGENCIA - Recursos insuficientes')
    }
  }

  /**
   * Aplica degradación según el nivel actual
   */
  applyDegradation() {
    const config = this.getCurrentConfig()
    
    // Reducir requests concurrentes
    this.maxConcurrentRequests = config.maxRequests
    
    console.log(`📉 Degradación aplicada: maxRequests=${config.maxRequests}, timeout=${config.timeout}ms`)
  }

  /**
   * Obtiene configuración actual basada en presión de recursos
   */
  getCurrentConfig() {
    const levels = Object.keys(this.degradationLevels)
      .map(Number)
      .sort((a, b) => b - a)
    
    for (const level of levels) {
      if (this.resourcePressure >= level) {
        return this.degradationLevels[level]
      }
    }
    
    return this.degradationLevels[0]
  }

  /**
   * Verifica si puede ejecutar requests
   */
  canExecuteRequest() {
    return this.activeRequests < this.maxConcurrentRequests && !this.fallbackMode
  }

  /**
   * Maneja éxito de request
   */
  onRequestSuccess() {
    this.resourcePressure = Math.max(this.resourcePressure - 5, 0)
    
    if (this.resourcePressure <= this.recoveryThreshold && this.emergencyMode) {
      this.exitEmergencyMode()
    }
  }

  /**
   * Maneja fallo de request
   */
  onRequestFailure(error, operationName) {
    console.error(`❌ Request fallido [${operationName}]:`, error.message)
    
    // Incrementar presión por fallo
    this.resourcePressure = Math.min(this.resourcePressure + 15, 100)
    
    // Entrar en emergencia si es necesario
    if (this.resourcePressure >= 75) {
      this.enterEmergencyMode(`Fallo en ${operationName}`)
    }
  }

  /**
   * Crea promesa con timeout
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'))
      }, timeout)
    })
  }

  /**
   * Crea error amigable
   */
  createFriendlyError(code, message) {
    const error = new Error(message)
    error.code = code
    error.isFriendly = true
    return error
  }

  /**
   * Entra en modo de bajo consumo
   */
  enterLowPowerMode() {
    console.log('🔋 Modo bajo consumo activado')
    this.maxConcurrentRequests = 0
  }

  /**
   * Sale del modo de bajo consumo
   */
  exitLowPowerMode() {
    console.log('⚡ Modo bajo consumo desactivado')
    this.maxConcurrentRequests = this.getCurrentConfig().maxRequests
  }

  /**
   * Entra en modo offline
   */
  enterOfflineMode() {
    this.fallbackMode = true
    console.log('📴 Modo offline activado')
  }

  /**
   * Inicia monitoreo de recursos
   */
  startResourceMonitoring() {
    setInterval(() => {
      this.checkSystemResources()
    }, this.resourceCheckInterval)
  }

  /**
   * Verifica recursos del sistema
   */
  checkSystemResources() {
    this.lastResourceCheck = Date.now()
    
    // Verificar memoria
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      
      if (memoryUsage > 80) {
        this.resourcePressure = Math.min(this.resourcePressure + 10, 100)
        console.warn(`🧠 Alta memoria: ${memoryUsage.toFixed(1)}%`)
      }
    }
    
    // Verificar si necesitamos entrar en emergencia
    if (this.resourcePressure >= 75 && !this.emergencyMode) {
      this.enterEmergencyMode('Presión de recursos crítica detectada')
    }
  }

  /**
   * Procesa cola de requests
   */
  processQueue() {
    if (this.requestQueue.length > 0 && this.canExecuteRequest()) {
      const { operation, resolve, reject } = this.requestQueue.shift()
      
      operation()
        .then(resolve)
        .catch(reject)
    }
  }

  /**
   * Obtiene estado del sistema
   */
  getSystemStatus() {
    return {
      emergencyMode: this.emergencyMode,
      resourcePressure: this.resourcePressure,
      activeRequests: this.activeRequests,
      maxConcurrentRequests: this.maxConcurrentRequests,
      failedChunks: Array.from(this.failedChunks),
      chunkRetryCounts: Object.fromEntries(this.chunkRetryCounts),
      canExecute: this.canExecuteRequest()
    }
  }
}

// Instancia global
const resourceRecoveryService = new ResourceRecoveryService()

export default resourceRecoveryService
export { ResourceRecoveryService }