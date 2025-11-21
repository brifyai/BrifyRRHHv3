/**
 * Utilidades de monitoreo de rendimiento
 * 
 * Este archivo proporciona herramientas para medir y optimizar
 * el rendimiento de la aplicación.
 */

import { DEV_CONFIG, TIMEOUT_CONFIG } from '../config/constants.js';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isEnabled = DEV_CONFIG.ENABLE_LOGGING;
  }

  // Iniciar medición de rendimiento
  startTiming(label) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(label, { startTime, endTime: null, duration: null });
    
    if (DEV_CONFIG.DEBUG_MODE) {
      console.log(`⏱️ [Performance] Started timing: ${label}`);
    }
  }

  // Finalizar medición de rendimiento
  endTiming(label) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(label);
    if (!metric) {
      console.warn(`⚠️ [Performance] No start time found for: ${label}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(label, {
      ...metric,
      endTime,
      duration
    });

    // Logging con colores según rendimiento
    let emoji = '✅';
    let message = `${label}: ${duration.toFixed(2)}ms`;
    
    if (duration > TIMEOUT_CONFIG.DASHBOARD_LOAD) {
      emoji = '🐌';
      message += ' (SLOW)';
    } else if (duration > 1000) {
      emoji = '⚠️';
      message += ' (MODERATE)';
    } else {
      emoji = '⚡';
      message += ' (FAST)';
    }

    console.log(`${emoji} [Performance] ${message}`);
    
    return duration;
  }

  // Obtener métricas
  getMetrics() {
    const results = {};
    this.metrics.forEach((value, key) => {
      results[key] = {
        duration: value.duration,
        startTime: value.startTime,
        endTime: value.endTime
      };
    });
    return results;
  }

  // Limpiar métricas
  clearMetrics() {
    this.metrics.clear();
    if (this.isEnabled) {
      console.log('🧹 [Performance] Metrics cleared');
    }
  }

  // Monitorear uso de memoria
  checkMemoryUsage() {
    if (!this.isEnabled || !performance.memory) return null;

    const memory = performance.memory;
    const usage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)
    };

    let emoji = '✅';
    if (usage.percentage > 80) {
      emoji = '🔴';
    } else if (usage.percentage > 60) {
      emoji = '🟡';
    }

    console.log(`${emoji} [Memory] Usage: ${usage.percentage}% (${(usage.used / 1024 / 1024).toFixed(2)}MB / ${(usage.limit / 1024 / 1024).toFixed(2)}MB)`);
    
    return usage;
  }

  // Monitorear tiempo de carga de componentes
  measureComponentLoad(componentName, loadFunction) {
    this.startTiming(`component-${componentName}`);
    
    return loadFunction()
      .then(result => {
        this.endTiming(`component-${componentName}`);
        return result;
      })
      .catch(error => {
        this.endTiming(`component-${componentName}`);
        console.error(`❌ [Performance] Error loading component ${componentName}:`, error);
        throw error;
      });
  }

  // Monitorear rendimiento de red
  measureNetworkRequest(url, requestFunction) {
    const label = `network-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
    this.startTiming(label);
    
    return requestFunction()
      .then(result => {
        this.endTiming(label);
        return result;
      })
      .catch(error => {
        this.endTiming(label);
        console.error(`❌ [Performance] Network error for ${url}:`, error);
        throw error;
      });
  }

  // Iniciar observador de rendimiento
  startPerformanceObserver() {
    if (!this.isEnabled || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log(`📊 [Navigation] Page load: ${entry.loadEventEnd - entry.loadEventStart}ms`);
          } else if (entry.entryType === 'resource') {
            const duration = entry.duration;
            let emoji = '✅';
            if (duration > 1000) emoji = '⚠️';
            if (duration > 3000) emoji = '🐌';
            
            console.log(`${emoji} [Resource] ${entry.name}: ${duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'resource'] });
      this.observers.push(observer);
      
      console.log('🔍 [Performance] Performance observer started');
    } catch (error) {
      console.warn('⚠️ [Performance] Could not start performance observer:', error);
    }
  }

  // Detener observadores
  stopPerformanceObservers() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
    
    if (this.isEnabled) {
      console.log('🛑 [Performance] Performance observers stopped');
    }
  }

  // Generar reporte de rendimiento
  generateReport() {
    const metrics = this.getMetrics();
    const memory = this.checkMemoryUsage();
    
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      memory,
      summary: {
        totalMeasurements: Object.keys(metrics).length,
        slowOperations: Object.values(metrics).filter(m => m.duration > 1000).length,
        fastOperations: Object.values(metrics).filter(m => m.duration < 200).length
      }
    };

    if (this.isEnabled) {
      console.log('📋 [Performance Report]', report);
    }

    return report;
  }
}

// Instancia global del monitor de rendimiento
const performanceMonitor = new PerformanceMonitor();

// Iniciar monitoreo automáticamente en desarrollo
if (DEV_CONFIG.ENABLE_LOGGING && typeof window !== 'undefined') {
  // Iniciar observador cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.startPerformanceObserver();
    });
  } else {
    performanceMonitor.startPerformanceObserver();
  }

  // Generar reporte antes de cerrar la página
  window.addEventListener('beforeunload', () => {
    performanceMonitor.generateReport();
  });
}

// Hook personalizado para React
export const usePerformanceMonitor = (componentName) => {

  const startTiming = (operation) => {
    return performanceMonitor.startTiming(`${componentName}-${operation}`);
  };

  const endTiming = (operation) => {
    return performanceMonitor.endTiming(`${componentName}-${operation}`);
  };

  const measureAsync = async (operation, asyncFunction) => {
    startTiming(operation);
    try {
      const result = await asyncFunction();
      endTiming(operation);
      return result;
    } catch (error) {
      endTiming(operation);
      throw error;
    }
  };

  return {
    startTiming,
    endTiming,
    measureAsync,
    checkMemory: () => performanceMonitor.checkMemoryUsage(),
    getMetrics: () => performanceMonitor.getMetrics()
  };
};

// Funciones de utilidad exportadas
export const measurePerformance = (label, fn) => {
  performanceMonitor.startTiming(label);
  const result = fn();
  performanceMonitor.endTiming(label);
  return result;
};

export default performanceMonitor;