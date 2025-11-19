/**
 * Sistema Centralizado de Manejo de Errores
 * 
 * Proporciona una interfaz unificada para manejar errores,
 * logging y notificaciones en toda la aplicación.
 */

// Niveles de severidad
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Tipos de error
export const ErrorType = {
  NETWORK: 'network',
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  BUSINESS_LOGIC: 'business_logic',
  UI: 'ui',
  SYSTEM: 'system'
}

// Clase para representar un error estructurado
export class AppError extends Error {
  constructor(message, type = ErrorType.SYSTEM, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.stack = Error.captureStackTrace ? Error.captureStackTrace(this, AppError) : new Error().stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Clase principal del manejador de errores
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.subscribers = [];
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Método principal para manejar errores
  handleError(error, context = {}) {
    const structuredError = this.structureError(error, context);
    
    // Loggear el error
    this.logError(structuredError);
    
    // Notificar a suscriptores
    this.notifySubscribers(structuredError);
    
    // En desarrollo, mostrar en consola
    if (this.isDevelopment) {
      this.consoleError(structuredError);
    }
    
    // Enviar a servicio externo si es crítico
    if (structuredError.severity === ErrorSeverity.CRITICAL) {
      this.reportToExternalService(structuredError);
    }
    
    return structuredError;
  }

  // Estructurar el error
  structureError(error, context) {
    let structuredError;

    if (error instanceof AppError) {
      structuredError = error;
    } else if (error instanceof Error) {
      structuredError = new AppError(
        error.message,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        { ...context, originalError: error.name, stack: error.stack }
      );
    } else if (typeof error === 'string') {
      structuredError = new AppError(
        error,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        context
      );
    } else {
      structuredError = new AppError(
        'Error desconocido',
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        { ...context, originalError: error }
      );
    }

    return structuredError;
  }

  // Loggear error en memoria
  logError(error) {
    this.errorLog.push(error);
    
    // Mantener el tamaño del log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  // Mostrar error en consola (desarrollo)
  consoleError(error) {
    const logMethod = this.getConsoleMethod(error.severity);
    
    logMethod('🚨 Error Handler:', {
      message: error.message,
      type: error.type,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp
    });
    
    if (error.stack) {
      logMethod('Stack trace:', error.stack);
    }
  }

  // Obtener método de consola según severidad
  getConsoleMethod(severity) {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  // Suscribir a notificaciones de errores
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new AppError('Callback debe ser una función', ErrorType.VALIDATION);
    }
    
    this.subscribers.push(callback);
    
    // Retornar función para desuscribir
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notificar a suscriptores
  notifySubscribers(error) {
    this.subscribers.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error en callback de suscriptor:', callbackError);
      }
    });
  }

  // Reportar a servicio externo (placeholder)
  async reportToExternalService(error) {
    try {
      // Aquí se podría integrar con servicios como Sentry, LogRocket, etc.
      console.log('📡 Reportando error crítico a servicio externo:', error.message);
      
      // Ejemplo de cómo se podría implementar:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error.toJSON())
      // });
    } catch (reportError) {
      console.error('Error al reportar a servicio externo:', reportError);
    }
  }

  // Obtener errores por tipo
  getErrorsByType(type) {
    return this.errorLog.filter(error => error.type === type);
  }

  // Obtener errores por severidad
  getErrorsBySeverity(severity) {
    return this.errorLog.filter(error => error.severity === severity);
  }

  // Obtener errores recientes
  getRecentErrors(limit = 50) {
    return this.errorLog.slice(-limit);
  }

  // Limpiar log de errores
  clearErrorLog() {
    this.errorLog = [];
  }

  // Obtener estadísticas de errores
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.getRecentErrors(10)
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Crear instancia global del manejador de errores
const errorHandler = new ErrorHandler();

// Métodos de conveniencia para tipos comunes de errores
export const createNetworkError = (message, context = {}) =>
  new AppError(message, ErrorType.NETWORK, ErrorSeverity.HIGH, context);

export const createDatabaseError = (message, context = {}) =>
  new AppError(message, ErrorType.DATABASE, ErrorSeverity.CRITICAL, context);

export const createAuthError = (message, context = {}) =>
  new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, context);

export const createValidationError = (message, context = {}) =>
  new AppError(message, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, context);

export const createBusinessLogicError = (message, context = {}) =>
  new AppError(message, ErrorType.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, context);

export const createUIError = (message, context = {}) =>
  new AppError(message, ErrorType.UI, ErrorSeverity.LOW, context);

export const createCriticalError = (message, context = {}) =>
  new AppError(message, ErrorType.SYSTEM, ErrorSeverity.CRITICAL, context);

// Función helper para manejar errores en async/await
export const safeAsync = async (promise, context = {}) => {
  try {
    const result = await promise;
    return { success: true, data: result, error: null };
  } catch (error) {
    const structuredError = errorHandler.handleError(error, context);
    return { success: false, data: null, error: structuredError };
  }
};

// Función helper para manejar errores en funciones síncronas
export const safeSync = (fn, context = {}) => {
  try {
    const result = fn();
    return { success: true, data: result, error: null };
  } catch (error) {
    const structuredError = errorHandler.handleError(error, context);
    return { success: false, data: null, error: structuredError };
  }
};

// Higher-order function para componentes React
export const withErrorHandling = (WrappedComponent) => {
  const WithErrorHandlingComponent = (props) => {
    try {
      return <WrappedComponent {...props} />;
    } catch (error) {
      errorHandler.handleError(error, { component: WrappedComponent.name, props });
      return <div>Error en el componente</div>;
    }
  };

  WithErrorHandlingComponent.displayName = `withErrorHandling(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorHandlingComponent;
};

export default errorHandler;