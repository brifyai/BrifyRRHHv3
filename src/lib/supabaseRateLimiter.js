/**
 * Supabase Rate Limiter
 * Protege contra sobrecarga de red y ERR_INSUFFICIENT_RESOURCES
 */
class SupabaseRateLimiter {
  constructor() {
    // Configuración de límites
    this.MAX_CONCURRENT_REQUESTS = 3; // Máximo 3 peticiones concurrentes
    this.MAX_REQUESTS_PER_SECOND = 5; // Máximo 5 peticiones por segundo
    this.RETRY_ATTEMPTS = 2; // Máximo 2 reintentos
    this.RETRY_DELAY = 1000; // 1 segundo entre reintentos
    
    // Estado actual
    this.activeRequests = 0;
    this.requestQueue = [];
    this.requestTimestamps = [];
    this.pendingRequests = new Map(); // Para deduplicación
    
    // Métricas
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedRequests: 0
    };
  }

  /**
   * Ejecuta una llamada a Supabase con limitación de tasa y reintentos
   * @param {string} key - Clave única para deduplicación
   * @param {Function} requestFn - Función que realiza la llamada
   * @returns {Promise} Resultado de la llamada
   */
  async execute(key, requestFn) {
    // Deduplicación: si ya hay una petición pendiente para esta clave, esperarla
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ RateLimiter: Petición duplicada detectada para ${key}, reutilizando promesa`);
      return this.pendingRequests.get(key);
    }

    // Crear promesa para la petición
    const promise = this._executeWithRateLimit(requestFn)
      .finally(() => {
        // Limpiar de la cache de pendientes al terminar
        this.pendingRequests.delete(key);
      });

    // Guardar en la cache de pendientes
    this.pendingRequests.set(key, promise);
    return promise;
  }

  async _executeWithRateLimit(requestFn) {
    // Esperar si hay demasiadas peticiones concurrentes
    while (this.activeRequests >= this.MAX_CONCURRENT_REQUESTS) {
      console.log(`⏳ RateLimiter: Esperando (máximo concurrentes alcanzado: ${this.activeRequests}/${this.MAX_CONCURRENT_REQUESTS})`);
      await this._sleep(100);
    }

    // Esperar si se excede el límite por segundo
    await this._waitForRateLimit();

    // Ejecutar la petición con reintentos
    return this._executeWithRetry(requestFn);
  }

  async _executeWithRetry(requestFn, attempt = 1) {
    this.activeRequests++;
    this.metrics.totalRequests++;

    try {
      const result = await requestFn();
      this.activeRequests--;
      return result;
    } catch (error) {
      this.activeRequests--;
      this.metrics.failedRequests++;

      // Verificar si es un error de recursos insuficientes o de red
      const isNetworkError = this._isNetworkError(error);
      const shouldRetry = isNetworkError && attempt <= this.RETRY_ATTEMPTS;

      if (shouldRetry) {
        this.metrics.retriedRequests++;
        const delay = this.RETRY_DELAY * attempt; // Backoff exponencial
        console.log(`🔄 RateLimiter: Reintento ${attempt}/${this.RETRY_ATTEMPTS} después de ${delay}ms. Error: ${error.message}`);
        
        await this._sleep(delay);
        return this._executeWithRetry(requestFn, attempt + 1);
      }

      // Si no se debe reintentar, lanzar el error
      console.error(`❌ RateLimiter: Petición fallida después de ${attempt} intentos:`, error.message);
      throw error;
    }
  }

  async _waitForRateLimit() {
    const now = Date.now();
    
    // Limpiar timestamps antiguos (más de 1 segundo)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 1000
    );

    // Si se excede el límite por segundo, esperar
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_SECOND) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 1000 - (now - oldestTimestamp);
      
      if (waitTime > 0) {
        console.log(`⏳ RateLimiter: Límite por segundo alcanzado, esperando ${waitTime}ms`);
        await this._sleep(waitTime);
      }
    }

    // Añadir el timestamp actual
    this.requestTimestamps.push(now);
  }

  _isNetworkError(error) {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';
    
    return (
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('insufficient resources') ||
      errorMessage.includes('timeout') ||
      errorCode === 'ERR_INSUFFICIENT_RESOURCES' ||
      errorCode === 'ECONNRESET' ||
      errorCode === 'ETIMEDOUT'
    );
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtener métricas actuales
  getMetrics() {
    return {
      ...this.metrics,
      activeRequests: this.activeRequests,
      pendingRequests: this.pendingRequests.size,
      queueLength: this.requestQueue.length
    };
  }

  // Limpiar cache de peticiones pendientes
  clearPendingCache() {
    this.pendingRequests.clear();
    console.log('🧹 RateLimiter: Cache de peticiones pendientes limpiada');
  }
}

// Exportar instancia única global
const supabaseRateLimiter = new SupabaseRateLimiter();

// Exportar también una función wrapper para uso sencillo
export const withRateLimit = (key, requestFn) => {
  return supabaseRateLimiter.execute(key, requestFn);
};

export default supabaseRateLimiter;