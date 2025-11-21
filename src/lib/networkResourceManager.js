/**
 * 🔥 NETWORK RESOURCE MANAGER - SOLUCIÓN DEFINITIVA A ERR_INSUFFICIENT_RESOURCES
 * 
 * Problema: El navegador agota recursos de red por demasiadas solicitudes simultáneas
 * Solución: Pool de conexiones con throttling inteligente y circuit breaker
 */

class NetworkResourceManager {
  constructor() {
    this.activeConnections = new Map()
    this.connectionPool = new Map()
    this.requestQueue = []
    this.maxConcurrentConnections = 4 // Límite conservador para evitar saturación
    this.requestTimeout = 10000 // 10 segundos timeout
    this.circuitBreakerThreshold = 10 // Máximo de errores antes de activar circuit breaker
    this.circuitBreakerOpen = false
    this.circuitBreakerResetTime = 30000 // 30 segundos
    this.lastCircuitBreakerTrigger = 0
    
    // Estadísticas para debugging
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      queuedRequests: 0,
      activeConnections: 0,
      circuitBreakerTrips: 0
    }
    
    console.log('🔥 NetworkResourceManager: Inicializado con pool de', this.maxConcurrentConnections, 'conexiones')
  }

  /**
   * 🔥 SOLUCIÓN PRINCIPAL: Wrapper para fetch con gestión de recursos
   */
  async fetchWithResourceManagement(url, options = {}) {
    this.stats.totalRequests++
    
    // Circuit breaker check
    if (this.circuitBreakerOpen) {
      const timeSinceLastTrip = Date.now() - this.lastCircuitBreakerTrigger
      if (timeSinceLastTrip < this.circuitBreakerResetTime) {
        throw new Error('Circuit breaker abierto - demasiados errores de red')
      } else {
        // Reset circuit breaker
        this.circuitBreakerOpen = false
        this.lastCircuitBreakerTrigger = 0
        console.log('🔄 NetworkResourceManager: Circuit breaker reseteado')
      }
    }

    // Verificar límites de conexión
    if (this.activeConnections.size >= this.maxConcurrentConnections) {
      console.log('⚠️ NetworkResourceManager: Pool lleno, encolando solicitud:', url)
      this.stats.queuedRequests++
      return this.queueRequest(url, options)
    }

    return this.executeRequest(url, options)
  }

  /**
   * 🔥 EJECUTAR SOLICITUD CON GESTIÓN DE RECURSOS
   */
  async executeRequest(url, options = {}) {
    const requestId = this.generateRequestId()
    const startTime = Date.now()
    
    console.log(`🚀 NetworkResourceManager: Ejecutando solicitud ${requestId} - ${url}`)
    
    // Marcar conexión como activa
    this.activeConnections.set(requestId, {
      url,
      startTime,
      timeout: setTimeout(() => {
        console.error(`⏰ NetworkResourceManager: Timeout en solicitud ${requestId}`)
        this.handleRequestFailure(requestId, new Error('Request timeout'))
      }, this.requestTimeout)
    })
    
    this.stats.activeConnections = this.activeConnections.size

    try {
      // Crear AbortController para cancelación
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)
      
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        // Headers optimizados para reducir overhead
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers
        }
      }

      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      // Verificar respuesta
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      this.stats.successfulRequests++
      console.log(`✅ NetworkResourceManager: Solicitud ${requestId} exitosa en ${Date.now() - startTime}ms`)
      
      return response

    } catch (error) {
      this.handleRequestFailure(requestId, error)
      throw error
    } finally {
      // Limpiar recursos
      this.cleanupRequest(requestId)
    }
  }

  /**
   * 🔥 ENCOLAR SOLICITUD CUANDO POOL ESTÁ LLENO
   */
  async queueRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      })
      
      // Procesar cola cuando haya espacio disponible
      this.processQueue()
    })
  }

  /**
   * 🔥 PROCESAR COLA DE SOLICITUDES
   */
  async processQueue() {
    if (this.requestQueue.length === 0) return
    
    if (this.activeConnections.size < this.maxConcurrentConnections) {
      const request = this.requestQueue.shift()
      console.log(`📋 NetworkResourceManager: Procesando solicitud encolada - ${request.url}`)
      
      try {
        const response = await this.executeRequest(request.url, request.options)
        request.resolve(response)
      } catch (error) {
        request.reject(error)
      }
    }
  }

  /**
   * 🔥 MANEJAR FALLOS DE SOLICITUD
   */
  handleRequestFailure(requestId, error) {
    this.stats.failedRequests++
    
    // Activar circuit breaker si hay demasiados errores
    if (this.stats.failedRequests >= this.circuitBreakerThreshold) {
      this.circuitBreakerOpen = true
      this.lastCircuitBreakerTrigger = Date.now()
      this.stats.circuitBreakerTrips++
      console.error('🚨 NetworkResourceManager: Circuit breaker activado por demasiados errores')
    }
    
    console.error(`❌ NetworkResourceManager: Error en solicitud ${requestId}:`, error.message)
  }

  /**
   * 🔥 LIMPIAR RECURSOS DE SOLICITUD
   */
  cleanupRequest(requestId) {
    const connection = this.activeConnections.get(requestId)
    if (connection) {
      clearTimeout(connection.timeout)
      this.activeConnections.delete(requestId)
      this.stats.activeConnections = this.activeConnections.size
      
      // Procesar cola si hay espacio disponible
      this.processQueue()
    }
  }

  /**
   * 🔥 GENERAR ID ÚNICO PARA SOLICITUD
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 🔥 ESTADÍSTICAS PARA DEBUGGING
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.requestQueue.length,
      poolUtilization: `${this.activeConnections.size}/${this.maxConcurrentConnections}`,
      circuitBreakerOpen: this.circuitBreakerOpen
    }
  }

  /**
   * 🔥 LIMPIAR TODOS LOS RECURSOS
   */
  cleanup() {
    console.log('🧹 NetworkResourceManager: Limpiando recursos...')
    
    // Cancelar todas las solicitudes activas
    this.activeConnections.forEach((connection, requestId) => {
      clearTimeout(connection.timeout)
    })
    this.activeConnections.clear()
    
    // Rechazar solicitudes en cola
    this.requestQueue.forEach(request => {
      request.reject(new Error('NetworkResourceManager: Solicitud cancelada durante cleanup'))
    })
    this.requestQueue = []
    
    // Reset estadísticas
    this.stats.activeConnections = 0
    this.stats.queuedRequests = 0
  }
}

// 🔥 INSTANCIA GLOBAL
const networkResourceManager = new NetworkResourceManager()

// 🔥 FUNCIÓN WRAPPER PARA SUPABASE
export const createResourceManagedSupabaseClient = (originalClient) => {
  return {
    ...originalClient,
    // Wrapper para métodos de Supabase que hacen requests de red
    from: (table) => {
      const originalFrom = originalClient.from(table)
      
      return {
        ...originalFrom,
        select: (...args) => {
          // Aplicar gestión de recursos a queries de Supabase
          const query = originalFrom.select(...args)
          const originalThen = query.then.bind(query)
          
          query.then = async (resolve, reject) => {
            try {
              await networkResourceManager.fetchWithResourceManagement(
                'supabase_query',
                { method: 'SELECT', table, args }
              )
              return originalThen(resolve, reject)
            } catch (error) {
              reject(error)
            }
          }
          
          return query
        },
        insert: (data) => {
          const query = originalFrom.insert(data)
          const originalThen = query.then.bind(query)
          
          query.then = async (resolve, reject) => {
            try {
              await networkResourceManager.fetchWithResourceManagement(
                'supabase_query',
                { method: 'INSERT', table, data }
              )
              return originalThen(resolve, reject)
            } catch (error) {
              reject(error)
            }
          }
          
          return query
        }
      }
    }
  }
}

export default networkResourceManager