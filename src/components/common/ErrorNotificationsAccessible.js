import React, { useState, useEffect, useRef } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler.js';

/**
 * Componente para mostrar notificaciones de errores con accesibilidad completa
 */
const ErrorNotificationsAccessible = ({ position = 'top-right', maxVisible = 5 }) => {
  const { errors, removeError, clearErrors, errorCounts } = useErrorHandler({
    enableNotifications: true,
    maxErrors: maxVisible * 2
  });

  const [showDetails, setShowDetails] = useState(false);
  const [focusedErrorId, setFocusedErrorId] = useState(null);
  const notificationRef = useRef(null);
  const firstErrorRef = useRef(null);

  // Filtrar errores visibles
  const visibleErrors = errors.slice(-maxVisible);

  // Estilos según posición
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: '400px',
      width: '100%'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  // Obtener color con mejor contraste según severidad
  const getSeverityColors = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: '#dc3545',
          text: '#ffffff',
          border: '#a71d2a',
          focus: '#a71d2a'
        };
      case 'HIGH':
        return {
          bg: '#fd7e14',
          text: '#ffffff',
          border: '#c85a0b',
          focus: '#c85a0b'
        };
      case 'MEDIUM':
        return {
          bg: '#ffc107',
          text: '#212529',
          border: '#d39e00',
          focus: '#d39e00'
        };
      case 'LOW':
        return {
          bg: '#17a2b8',
          text: '#ffffff',
          border: '#117a8b',
          focus: '#117a8b'
        };
      default:
        return {
          bg: '#6c757d',
          text: '#ffffff',
          border: '#545b62',
          focus: '#545b62'
        };
    }
  };

  // Obtener ícono y descripción según tipo
  const getTypeInfo = (type) => {
    const typeMap = {
      'NETWORK': {
        icon: '🌐',
        description: 'Error de red',
        ariaLabel: 'Error de conexión o red'
      },
      'DATABASE': {
        icon: '🗄️',
        description: 'Error de base de datos',
        ariaLabel: 'Error en base de datos'
      },
      'AUTHENTICATION': {
        icon: '🔐',
        description: 'Error de autenticación',
        ariaLabel: 'Error de autenticación'
      },
      'VALIDATION': {
        icon: '⚠️',
        description: 'Error de validación',
        ariaLabel: 'Error de validación de datos'
      },
      'BUSINESS_LOGIC': {
        icon: '💼',
        description: 'Error de lógica',
        ariaLabel: 'Error de lógica de negocio'
      },
      'UI': {
        icon: '🖥️',
        description: 'Error de interfaz',
        ariaLabel: 'Error de interfaz de usuario'
      },
      'SYSTEM': {
        icon: '⚙️',
        description: 'Error del sistema',
        ariaLabel: 'Error del sistema'
      },
      default: {
        icon: '❌',
        description: 'Error desconocido',
        ariaLabel: 'Error no especificado'
      }
    };
    return typeMap[type] || typeMap.default;
  };

  // Manejar navegación por teclado
  const handleKeyDown = (event, errorId, action) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        action();
        break;
      case 'Escape':
        if (showDetails) {
          setShowDetails(false);
        } else {
          removeError(errorId);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusNextError(errorId);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPreviousError(errorId);
        break;
    }
  };

  // Enfocar siguiente error
  const focusNextError = (currentErrorId) => {
    const currentIndex = visibleErrors.findIndex(err => err.errorId === currentErrorId);
    if (currentIndex < visibleErrors.length - 1) {
      const nextErrorId = visibleErrors[currentIndex + 1].errorId;
      setFocusedErrorId(nextErrorId);
    }
  };

  // Enfocar error anterior
  const focusPreviousError = (currentErrorId) => {
    const currentIndex = visibleErrors.findIndex(err => err.errorId === currentErrorId);
    if (currentIndex > 0) {
      const prevErrorId = visibleErrors[currentIndex - 1].errorId;
      setFocusedErrorId(prevErrorId);
    }
  };

  // Anunciar errores para lectores de pantalla
  useEffect(() => {
    if (visibleErrors.length > 0) {
      const latestError = visibleErrors[visibleErrors.length - 1];
      const typeInfo = getTypeInfo(latestError.type);
      
      // Crear mensaje para lector de pantalla
      const announcement = `${typeInfo.ariaLabel}: ${latestError.message}. Severidad: ${latestError.severity}.`;
      
      // Usar aria-live region para anunciar
      const liveRegion = document.getElementById('error-announcements');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }
  }, [visibleErrors]);

  // Enfocar primer error cuando aparece
  useEffect(() => {
    if (visibleErrors.length > 0 && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [visibleErrors.length]);

  if (visibleErrors.length === 0 && errorCounts.total === 0) {
    return null;
  }

  return (
    <>
      {/* Región live para anuncios de accesibilidad */}
      <div
        id="error-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Contenedor principal */}
      <div 
        ref={notificationRef}
        style={getPositionStyles()}
        role="region"
        aria-label="Notificaciones de error"
        aria-live="polite"
      >
        {/* Indicador de errores en la esquina */}
        {visibleErrors.length === 0 && errorCounts.total > 0 && (
          <button
            onClick={() => setShowDetails(true)}
            onKeyDown={(e) => handleKeyDown(e, 'indicator', () => setShowDetails(true))}
            style={{
              backgroundColor: getSeverityColors(
                errorCounts.critical > 0 ? 'CRITICAL' :
                errorCounts.high > 0 ? 'HIGH' :
                errorCounts.medium > 0 ? 'MEDIUM' : 'LOW'
              ).bg,
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              border: '2px solid transparent'
            }}
            title={`Hay ${errorCounts.total} error(es) pendientes. Presiona Enter para ver detalles.`}
            aria-label={`${errorCounts.total} error(es) pendientes. Presiona Enter para ver detalles.`}
          >
            {errorCounts.total} error(es) ⚠️
          </button>
        )}

        {/* Notificaciones individuales */}
        {visibleErrors.map((error, index) => {
          const typeInfo = getTypeInfo(error.type);
          const colors = getSeverityColors(error.severity);
          const isFocused = focusedErrorId === error.errorId;
          const isFirst = index === 0;

          return (
            <div
              key={error.errorId}
              ref={isFirst ? firstErrorRef : null}
              style={{
                backgroundColor: '#ffffff',
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px',
                boxShadow: isFocused ? `0 0 0 3px ${colors.focus}` : '0 4px 12px rgba(0,0,0,0.15)',
                animation: `slideIn 0.3s ease-out`,
                opacity: visibleErrors.length - index === visibleErrors.length ? 1 : 0.9,
                transform: `translateY(${(visibleErrors.length - index - 1) * 10}px)`
              }}
              role="alert"
              aria-labelledby={`error-title-${error.errorId}`}
              aria-describedby={`error-message-${error.errorId} error-details-${error.errorId}`}
              tabIndex={isFirst ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, error.errorId, () => setFocusedErrorId(error.errorId))}
            >
              {/* Cabecera accesible */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span 
                    style={{ fontSize: '16px' }}
                    role="img"
                    aria-label={typeInfo.ariaLabel}
                    aria-hidden="false"
                  >
                    {typeInfo.icon}
                  </span>
                  <div>
                    <span 
                      id={`error-title-${error.errorId}`}
                      style={{
                        fontWeight: 'bold',
                        color: colors.bg,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        display: 'block'
                      }}
                      aria-label={`Severidad: ${error.severity}`}
                    >
                      {error.severity}
                    </span>
                    <span 
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        display: 'block'
                      }}
                      aria-label={`Tipo: ${typeInfo.description}`}
                    >
                      {typeInfo.description}
                    </span>
                  </div>
                </div>
                
                <button
                  ref={isFocused ? null : undefined}
                  onClick={() => removeError(error.errorId)}
                  onKeyDown={(e) => handleKeyDown(e, error.errorId, () => removeError(error.errorId))}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                  title={`Cerrar error ${error.errorId}. Presiona Enter o Escape para cerrar.`}
                  aria-label={`Cerrar error ${error.errorId}`}
                >
                  ×
                </button>
              </div>

              {/* Mensaje de error */}
              <div 
                id={`error-message-${error.errorId}`}
                style={{
                  color: '#333',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  marginBottom: '8px'
                }}
              >
                {error.message}
              </div>

              {/* Detalles adicionales */}
              {(error.context || error.component) && (
                <div 
                  id={`error-details-${error.errorId}`}
                  style={{
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '8px'
                  }}
                  aria-label="Información adicional del error"
                >
                  {error.component && (
                    <span>Componente: {error.component}</span>
                  )}
                  {error.context?.operation && (
                    <span> • Operación: {error.context.operation}</span>
                  )}
                </div>
              )}

              {/* Acciones accesibles */}
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  onKeyDown={(e) => handleKeyDown(e, error.errorId, () => setShowDetails(!showDetails))}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.bg}`,
                    color: colors.bg,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = colors.bg;
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = colors.bg;
                  }}
                  aria-label={`${showDetails ? 'Ocultar' : 'Mostrar'} detalles del error`}
                  aria-expanded={showDetails}
                >
                  Detalles
                </button>
                
                {error.severity === 'CRITICAL' && (
                  <button
                    onClick={() => window.location.reload()}
                    onKeyDown={(e) => handleKeyDown(e, error.errorId, () => window.location.reload())}
                    style={{
                      backgroundColor: colors.bg,
                      border: 'none',
                      color: colors.text,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                    aria-label="Recargar página para resolver error crítico"
                  >
                    Recargar
                  </button>
                )}
              </div>

              {/* Detalles expandidos accesibles */}
              {showDetails && (
                <div 
                  style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#666'
                  }}
                  role="region"
                  aria-label="Detalles extendidos del error"
                  aria-live="polite"
                >
                  <div><strong>ID:</strong> {error.errorId}</div>
                  <div><strong>Tipo:</strong> {error.type}</div>
                  <div><strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                  
                  {error.context && Object.keys(error.context).length > 0 && (
                    <div>
                      <strong>Contexto:</strong>
                      <pre 
                        style={{ 
                          margin: '4px 0', 
                          fontSize: '10px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                        aria-label="Contexto del error en formato JSON"
                      >
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {process.env.NODE_ENV === 'development' && error.stack && (
                    <details style={{ marginTop: '8px' }}>
                      <summary 
                        style={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          color: colors.bg
                        }}
                        aria-label="Stack trace del error (solo desarrollo)"
                      >
                        Stack Trace
                      </summary>
                      <pre style={{ 
                        fontSize: '9px', 
                        overflow: 'auto', 
                        maxHeight: '100px',
                        backgroundColor: '#fff',
                        padding: '4px',
                        borderRadius: '2px',
                        wordBreak: 'break-word'
                      }}
                      aria-label="Stack trace completo del error"
                      >
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Botón para limpiar todos los errores */}
        {errorCounts.total > 1 && (
          <button
            onClick={clearErrors}
            onKeyDown={(e) => handleKeyDown(e, 'clear-all', clearErrors)}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '5px'
            }}
            aria-label={`Limpiar todos los ${errorCounts.total} errores`}
          >
            Limpiar todos ({errorCounts.total})
          </button>
        )}

        {/* Estilos para animaciones */}
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
        `}</style>
      </div>
    </>
  );
};

export default ErrorNotificationsAccessible;