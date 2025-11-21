import React, { useState } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler.js';

/**
 * Componente para mostrar notificaciones de errores
 */
const ErrorNotifications = ({ position = 'top-right', maxVisible = 5 }) => {
  const { errors, removeError, clearErrors, errorCounts } = useErrorHandler({
    enableNotifications: true,
    maxErrors: maxVisible * 2 // Mantener el doble en memoria para el historial
  });

  const [showDetails, setShowDetails] = useState(false);

  // Filtrar errores visibles (no auto-ocultos)
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

  // Obtener color según severidad
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#dc3545'; // Rojo
      case 'HIGH':
        return '#fd7e14'; // Naranja
      case 'MEDIUM':
        return '#ffc107'; // Amarillo
      case 'LOW':
        return '#17a2b8'; // Azul claro
      default:
        return '#6c757d'; // Gris
    }
  };

  // Obtener ícono según tipo
  const getTypeIcon = (type) => {
    switch (type) {
      case 'NETWORK':
        return '🌐';
      case 'DATABASE':
        return '🗄️';
      case 'AUTHENTICATION':
        return '🔐';
      case 'VALIDATION':
        return '⚠️';
      case 'BUSINESS_LOGIC':
        return '💼';
      case 'UI':
        return '🖥️';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '❌';
    }
  };

  if (visibleErrors.length === 0 && errorCounts.total === 0) {
    return null;
  }

  return (
    <div style={getPositionStyles()}>
      {/* Indicador de errores en la esquina */}
      {visibleErrors.length === 0 && errorCounts.total > 0 && (
        <div
          onClick={() => setShowDetails(true)}
          style={{
            backgroundColor: getSeverityColor(
              errorCounts.critical > 0 ? 'CRITICAL' :
              errorCounts.high > 0 ? 'HIGH' :
              errorCounts.medium > 0 ? 'MEDIUM' : 'LOW'
            ),
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          title={`Hay ${errorCounts.total} error(es) pendientes`}
        >
          {errorCounts.total} error(es) ⚠️
        </div>
      )}

      {/* Notificaciones individuales */}
      {visibleErrors.map((error, index) => (
        <div
          key={error.errorId}
          style={{
            backgroundColor: 'white',
            border: `2px solid ${getSeverityColor(error.severity)}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: `slideIn 0.3s ease-out`,
            opacity: visibleErrors.length - index === visibleErrors.length ? 1 : 0.9,
            transform: `translateY(${(visibleErrors.length - index - 1) * 10}px)`
          }}
        >
          {/* Cabecera */}
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
              <span style={{ fontSize: '16px' }}>
                {getTypeIcon(error.type)}
              </span>
              <span style={{
                fontWeight: 'bold',
                color: getSeverityColor(error.severity),
                fontSize: '12px',
                textTransform: 'uppercase'
              }}>
                {error.severity}
              </span>
            </div>
            <button
              onClick={() => removeError(error.errorId)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#999',
                padding: '0',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Mensaje de error */}
          <div style={{
            color: '#333',
            fontSize: '14px',
            lineHeight: '1.4',
            marginBottom: '8px'
          }}>
            {error.message}
          </div>

          {/* Detalles adicionales */}
          {(error.context || error.component) && (
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginBottom: '8px'
            }}>
              {error.component && <span>Componente: {error.component}</span>}
              {error.context?.operation && <span> • Operación: {error.context.operation}</span>}
            </div>
          )}

          {/* Acciones */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${getSeverityColor(error.severity)}`,
                color: getSeverityColor(error.severity),
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = getSeverityColor(error.severity);
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = getSeverityColor(error.severity);
              }}
            >
              Detalles
            </button>
            {error.severity === 'CRITICAL' && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: getSeverityColor(error.severity),
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Recargar
              </button>
            )}
          </div>

          {/* Detalles expandidos */}
          {showDetails && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#666'
            }}>
              <div><strong>ID:</strong> {error.errorId}</div>
              <div><strong>Tipo:</strong> {error.type}</div>
              <div><strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}</div>
              {error.context && Object.keys(error.context).length > 0 && (
                <div>
                  <strong>Contexto:</strong>
                  <pre style={{ margin: '4px 0', fontSize: '10px' }}>
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </div>
              )}
              {process.env.NODE_ENV === 'development' && error.stack && (
                <details style={{ marginTop: '8px' }}>
                  <summary>Stack Trace</summary>
                  <pre style={{ 
                    fontSize: '9px', 
                    overflow: 'auto', 
                    maxHeight: '100px',
                    backgroundColor: '#fff',
                    padding: '4px',
                    borderRadius: '2px'
                  }}>
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Botón para limpiar todos los errores */}
      {errorCounts.total > 1 && (
        <button
          onClick={clearErrors}
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
      `}</style>
    </div>
  );
};

export default ErrorNotifications;