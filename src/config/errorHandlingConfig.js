import errorHandler from '../lib/errorHandler.js';
import logger from '../lib/logger.js';

/**
 * Configuración centralizada del sistema de manejo de errores
 */
export const errorHandlingConfig = {
  // Configuración del logger
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
    enableConsole: true,
    enableMemory: true,
    enableRemote: process.env.NODE_ENV === 'production',
    maxMemoryLogs: 1000,
    remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT || null,
    remoteApiKey: process.env.REACT_APP_LOG_API_KEY || null
  },

  // Configuración del manejador de errores
  errorHandler: {
    enableNotifications: true,
    enableLogging: true,
    maxErrors: 50,
    autoRetryAttempts: 3,
    autoRetryDelay: 1000,
    
    // Configuración por tipo de error
    typeConfig: {
      NETWORK: {
        severity: 'HIGH',
        autoRetry: true,
        notifyUser: true,
        logLevel: 'ERROR'
      },
      DATABASE: {
        severity: 'HIGH',
        autoRetry: true,
        notifyUser: true,
        logLevel: 'ERROR'
      },
      AUTHENTICATION: {
        severity: 'MEDIUM',
        autoRetry: false,
        notifyUser: true,
        logLevel: 'WARN'
      },
      VALIDATION: {
        severity: 'LOW',
        autoRetry: false,
        notifyUser: true,
        logLevel: 'INFO'
      },
      BUSINESS_LOGIC: {
        severity: 'MEDIUM',
        autoRetry: false,
        notifyUser: true,
        logLevel: 'WARN'
      },
      UI: {
        severity: 'LOW',
        autoRetry: false,
        notifyUser: false,
        logLevel: 'DEBUG'
      },
      SYSTEM: {
        severity: 'CRITICAL',
        autoRetry: false,
        notifyUser: true,
        logLevel: 'ERROR'
      }
    }
  },

  // Configuración de notificaciones
  notifications: {
    position: 'top-right',
    maxVisible: 5,
    autoHideDelay: 5000,
    enableSound: false,
    enableVibration: false,
    
    // Configuración por severidad
    severityConfig: {
      LOW: {
        autoHide: true,
        autoHideDelay: 3000,
        showIcon: true,
        showDetails: false
      },
      MEDIUM: {
        autoHide: true,
        autoHideDelay: 5000,
        showIcon: true,
        showDetails: true
      },
      HIGH: {
        autoHide: false,
        autoHideDelay: 0,
        showIcon: true,
        showDetails: true
      },
      CRITICAL: {
        autoHide: false,
        autoHideDelay: 0,
        showIcon: true,
        showDetails: true,
        requireAction: true
      }
    }
  },

  // Configuración de reportes
  reporting: {
    enableErrorReporting: process.env.NODE_ENV === 'production',
    reportingEndpoint: process.env.REACT_APP_ERROR_REPORTING_ENDPOINT || null,
    reportingApiKey: process.env.REACT_APP_ERROR_REPORTING_API_KEY || null,
    reportInterval: 60000, // 1 minuto
    batchSize: 10,
    includeUserAgent: true,
    includeUserInfo: true,
    includeSystemInfo: true
  }
};

/**
 * Inicializa el sistema de manejo de errores con la configuración
 */
export    // Configurar el manejador de errores
    errorHandler.configure(errorHandlingConfig.errorHandler);

    // Suscribirse a errores globales
    errorHandler.subscribe((error) => {
      // Loggear error
      logger.error('Error capturado por el sistema centralizado', {
        errorId: error.errorId,
        message: error.message,
        type: error.type,
        severity: error.severity,
        context: error.context
      });

      // Enviar a reporte si está habilitado
      if (errorHandlingConfig.reporting.enableErrorReporting) {
        scheduleErrorReport(error);
      }
    });

    // Configurar manejadores de errores globales del navegador
    setupGlobalErrorHandlers();

    // Configurar manejadores de errores no capturados de Promesas
    setupUnhandledRejectionHandlers();

    logger.info('Sistema de manejo de errores inicializado correctamente');
    
    return true;
  } catch (error) {
    console.error('Error al inicializar el sistema de manejo de errores:', error);
    return false;
  }
};

/**
 * Configura manejadores de errores globales del navegador
 */
const setupGlobalErrorHandlers = () => {
  // Manejar errores de JavaScript globales
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), {
      type: 'SYSTEM',
      severity: 'HIGH',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'global_error_handler'
      }
    });
  });

  // Manejar errores de carga de recursos
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      errorHandler.handleError(new Error(`Error cargando recurso: ${event.target.src || event.target.href}`), {
        type: 'NETWORK',
        severity: 'MEDIUM',
        context: {
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          sourceType: 'resource_load_error'
        }
      });
    }
  }, true);
};

/**
 * Configura manejadores de promesas rechazadas no capturadas
 */
const setupUnhandledRejectionHandlers = () => {
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason || new Error('Promise rechazada sin motivo'), {
      type: 'SYSTEM',
      severity: 'HIGH',
      context: {
        promise: event.promise,
        source: 'unhandled_promise_rejection'
      }
    });

    // Prevenir el log por defecto del navegador
    event.preventDefault();
  });
};

/**
 * Agenda el envío de reportes de errores
 */
let errorReportQueue = [];
let reportTimer = null;

const scheduleErrorReport = (error) => {
  errorReportQueue.push(error);

  // Enviar inmediatamente si es crítico
  if (error.severity === 'CRITICAL') {
    sendErrorReport();
    return;
  }

  // Agrupar y enviar según configuración
  if (!reportTimer) {
    reportTimer = setTimeout(() => {
      sendErrorReport();
    }, errorHandlingConfig.reporting.reportInterval);
  }
};

/**
 * Envía reporte de errores al endpoint configurado
 */
const sendErrorReport = async () => {
  if (!errorHandlingConfig.reporting.enableErrorReporting || 
      !errorHandlingConfig.reporting.reportingEndpoint ||
      errorReportQueue.length === 0) {
    return;
  }

  const errorsToSend = errorReportQueue.slice(0, errorHandlingConfig.reporting.batchSize);
  errorReportQueue = errorReportQueue.slice(errorHandlingConfig.reporting.batchSize);

  try {
    const reportData = {
      timestamp: new Date().toISOString(),
      userAgent: errorHandlingConfig.reporting.includeUserAgent ? navigator.userAgent : undefined,
      url: window.location.href,
      errors: errorsToSend.map(error => ({
        errorId: error.errorId,
        message: error.message,
        type: error.type,
        severity: error.severity,
        timestamp: error.timestamp,
        context: errorHandlingConfig.reporting.includeSystemInfo ? error.context : undefined,
        stack: error.stack
      }))
    };

    const response = await fetch(errorHandlingConfig.reporting.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': errorHandlingConfig.reporting.reportingApiKey
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      throw new Error(`Error en reporte: ${response.status}`);
    }

    logger.info(`Reporte de errores enviado correctamente (${errorsToSend.length} errores)`);
  } catch (error) {
    logger.error('Error al enviar reporte de errores', {
      error: error.message,
      errorsCount: errorsToSend.length
    });
    
    // Re-agregar errores a la cola para reintento
    errorReportQueue.unshift(...errorsToSend);
  } finally {
    // Limpiar timer
    if (reportTimer) {
      clearTimeout(reportTimer);
      reportTimer = null;
    }

    // Programar siguiente envío si hay más errores
    if (errorReportQueue.length > 0) {
      reportTimer = setTimeout(() => {
        sendErrorReport();
      }, errorHandlingConfig.reporting.reportInterval);
    }
  }
};

/**
 * Utilidades para manejo de errores específicos de la aplicación
 */
export  },

  // Crear error de base de datos
  createDatabaseError: (message, context = {}) => {
    return errorHandler.createError(message, 'DATABASE', 'HIGH', context);
  },

  // Crear error de autenticación
  createAuthError: (message, context = {}) => {
    return errorHandler.createError(message, 'AUTHENTICATION', 'MEDIUM', context);
  },

  // Crear error de validación
  createValidationError: (message, context = {}) => {
    return errorHandler.createError(message, 'VALIDATION', 'LOW', context);
  },

  // Crear error de lógica de negocio
  createBusinessError: (message, context = {}) => {
    return errorHandler.createError(message, 'BUSINESS_LOGIC', 'MEDIUM', context);
  },

  // Manejar error de API
  handleApiError: (error, context = {}) => {
    if (error.response) {
      // Error de respuesta HTTP
      const status = error.response.status;
      let type = 'NETWORK';
      let severity = 'HIGH';

      if (status === 401 || status === 403) {
        type = 'AUTHENTICATION';
        severity = 'MEDIUM';
      } else if (status >= 400 && status < 500) {
        type = 'VALIDATION';
        severity = 'LOW';
      } else if (status >= 500) {
        type = 'SYSTEM';
        severity = 'CRITICAL';
      }

      return errorHandler.handleError(error, {
        type,
        severity,
        context: {
          ...context,
          status,
          statusText: error.response.statusText,
          data: error.response.data,
          source: 'api_response_error'
        }
      });
    } else if (error.request) {
      // Error de red (sin respuesta)
      return errorHandler.handleError(error, {
        type: 'NETWORK',
        severity: 'HIGH',
        context: {
          ...context,
          source: 'api_network_error'
        }
      });
    } else {
      // Error de configuración o de código
      return errorHandler.handleError(error, {
        type: 'SYSTEM',
        severity: 'MEDIUM',
        context: {
          ...context,
          source: 'api_config_error'
        }
      });
    }
  }
};

export default errorHandlingConfig;