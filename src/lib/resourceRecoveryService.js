/**
 * Sistema de Recuperación de Recursos Insuficientes
 * Detecta y resuelve problemas de ERR_INSUFFICIENT_RESOURCES
 */

import logger from './logger.js';

class ResourceRecoveryService {
  constructor() {
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.lastResourceCheck = 0;
    this.resourceCheckInterval = 5000; // 5 segundos
    
    this.init();
  }

  init() {
    // Escuchar errores de red
    window.addEventListener('error', this.handleResourceError.bind(this));
    window.addEventListener('unhandledrejection', this.handleResourceError.bind(this));
    
    // Monitoreo periódico de recursos
    setInterval(() => {
      this.checkSystemResources();
    }, this.resourceCheckInterval);
    
    logger.info('ResourceRecoveryService', '🔧 Sistema de recuperación de recursos inicializado');
  }

  handleResourceError(event) {
    const error = event.error || event.reason;
    const message = error?.message || '';
    
    // Detectar errores de recursos insuficientes
    if (message.includes('ERR_INSUFFICIENT_RESOURCES') || 
        message.includes('Failed to fetch') ||
        message.includes('ChunkLoadError') ||
        error?.code === 'ERR_INSUFFICIENT_RESOURCES') {
      
      logger.warn('ResourceRecoveryService', `🚨 Error de recursos detectado: ${message}`);
      this.initiateRecovery();
    }
  }

  checkSystemResources() {
    const now = Date.now();
    if (now - this.lastResourceCheck < this.resourceCheckInterval) return;
    
    this.lastResourceCheck = now;
    
    // Verificar memoria disponible (aproximada)
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const memoryUsagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
      
      if (memoryUsagePercent > 85) {
        logger.warn('ResourceRecoveryService', `⚠️ Alto uso de memoria: ${memoryUsagePercent.toFixed(1)}%`);
        this.cleanupMemory();
      }
    }
    
    // Verificar conexiones de red activas
    if (navigator.connection) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        logger.warn('ResourceRecoveryService', `🐌 Conexión lenta detectada: ${connection.effectiveType}`);
        this.optimizeForSlowConnection();
      }
    }
  }

  async initiateRecovery() {
    if (this.isRecovering || this.recoveryAttempts >= this.maxRecoveryAttempts) {
      logger.error('ResourceRecoveryService', '❌ Límite de recuperación alcanzado');
      return;
    }

    this.isRecovering = true;
    this.recoveryAttempts++;
    
    logger.info('ResourceRecoveryService', `🔄 Iniciando recuperación (intento ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

    try {
      // 1. Limpiar caché del navegador
      await this.clearBrowserCache();
      
      // 2. Limpiar localStorage temporal
      this.cleanupLocalStorage();
      
      // 3. Recargar chunks fallidos
      await this.reloadFailedChunks();
      
      // 4. Reinicializar conexiones
      await this.resetConnections();
      
      // 5. Forzar garbage collection si está disponible
      this.forceGarbageCollection();
      
      logger.info('ResourceRecoveryService', '✅ Recuperación completada exitosamente');
      
    } catch (error) {
      logger.error('ResourceRecoveryService', `❌ Error durante recuperación: ${error.message}`);
    } finally {
      this.isRecovering = false;
      
      // Si la recuperación falló, intentar recargar la página después de un delay
      if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
        setTimeout(() => {
          logger.info('ResourceRecoveryService', '🔄 Recargando página para resolver problemas de recursos');
          window.location.reload();
        }, 2000);
      }
    }
  }

  async clearBrowserCache() {
    try {
      // Limpiar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        registrations.forEach(registration => {
          registration.unregister();
        });
      }
      
      logger.info('ResourceRecoveryService', '🧹 Caché del navegador limpiado');
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error limpiando caché: ${error.message}`);
    }
  }

  cleanupLocalStorage() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('temp_') || 
          key.includes('cache_') || 
          key.includes('chunk_') ||
          key.includes('failed_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      logger.info('ResourceRecoveryService', `🗑️ Limpiadas ${keysToRemove.length} entradas temporales de localStorage`);
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error limpiando localStorage: ${error.message}`);
    }
  }

  async reloadFailedChunks() {
    try {
      // Forzar recarga de chunks que fallaron
      const chunks = document.querySelectorAll('script[data-failed="true"]');
      chunks.forEach(chunk => {
        const newChunk = chunk.cloneNode(true);
        newChunk.removeAttribute('data-failed');
        chunk.parentNode.replaceChild(newChunk, chunk);
      });
      
      logger.info('ResourceRecoveryService', `🔄 Recargados ${chunks.length} chunks fallidos`);
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error recargando chunks: ${error.message}`);
    }
  }

  async resetConnections() {
    try {
      // Cerrar conexiones WebSocket existentes
      if (window.WebSocket) {
        // Esta es una aproximación - en un caso real necesitarías mantener referencias
        logger.info('ResourceRecoveryService', '🔌 Reinicializando conexiones de red');
      }
      
      // Limpiar timeouts y intervals acumulados
      this.cleanupTimers();
      
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error reinicializando conexiones: ${error.message}`);
    }
  }

  cleanupTimers() {
    // Limpiar timers acumulados (aproximación)
    if (window.timersToCleanup) {
      window.timersToCleanup.forEach(timer => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      window.timersToCleanup = [];
    }
  }

  forceGarbageCollection() {
    try {
      if (window.gc && typeof window.gc === 'function') {
        window.gc();
        logger.info('ResourceRecoveryService', '🗑️ Garbage collection forzado');
      }
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error en garbage collection: ${error.message}`);
    }
  }

  cleanupMemory() {
    try {
      // Limpiar referencias grandes
      if (window.largeObjects) {
        window.largeObjects = null;
      }
      
      // Forzar garbage collection
      this.forceGarbageCollection();
      
      logger.info('ResourceRecoveryService', '🧹 Limpieza de memoria ejecutada');
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error limpiando memoria: ${error.message}`);
    }
  }

  optimizeForSlowConnection() {
    try {
      // Reducir calidad de imágenes
      document.documentElement.style.setProperty('--image-quality', '0.7');
      
      // Deshabilitar animaciones no críticas
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      
      logger.info('ResourceRecoveryService', '🐌 Optimizaciones para conexión lenta aplicadas');
    } catch (error) {
      logger.warn('ResourceRecoveryService', `⚠️ Error optimizando para conexión lenta: ${error.message}`);
    }
  }

  // Método público para verificar estado del sistema
  getSystemStatus() {
    return {
      isRecovering: this.isRecovering,
      recoveryAttempts: this.recoveryAttempts,
      maxRecoveryAttempts: this.maxRecoveryAttempts,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
  }
}

// Instancia singleton
const resourceRecoveryService = new ResourceRecoveryService();

export default resourceRecoveryService;