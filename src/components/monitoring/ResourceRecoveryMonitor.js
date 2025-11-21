/**
 * Componente de Monitoreo del Sistema de Recuperación de Recursos
 * Muestra estado en tiempo real y permite diagnóstico manual
 */

import React, { useState, useEffect } from 'react';
import resourceRecoveryService from '../../lib/resourceRecoveryService.js';

const ResourceRecoveryMonitor = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Actualizar estado cada 2 segundos
    const interval = setInterval(() => {
      const status = resourceRecoveryService.getSystemStatus();
      setSystemStatus(status);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRecovery = async () => {
    try {
      await resourceRecoveryService.initiateRecovery();
      alert('🔄 Recuperación manual iniciada. Revisa los logs para más detalles.');
    } catch (error) {
      alert(`❌ Error en recuperación manual: ${error.message}`);
    }
  };

  const handleClearCache = async () => {
    try {
      await resourceRecoveryService.clearBrowserCache();
      await resourceRecoveryService.cleanupLocalStorage();
      alert('✅ Caché y localStorage limpiados exitosamente');
    } catch (error) {
      alert(`❌ Error limpiando caché: ${error.message}`);
    }
  };

  const getStatusColor = () => {
    if (!systemStatus) return 'gray';
    if (systemStatus.isRecovering) return 'orange';
    if (systemStatus.recoveryAttempts > 0) return 'yellow';
    return 'green';
  };

  const getStatusText = () => {
    if (!systemStatus) return 'Cargando...';
    if (systemStatus.isRecovering) return '🔄 Recuperando...';
    if (systemStatus.recoveryAttempts > 0) return `⚠️ ${systemStatus.recoveryAttempts} intentos`;
    return '✅ Sistema estable';
  };

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: `linear-gradient(135deg, #${getStatusColor() === 'green' ? '10b981' : getStatusColor() === 'orange' ? 'f59e0b' : getStatusColor() === 'yellow' ? 'eab308' : '6b7280'}, #${getStatusColor() === 'green' ? '059669' : getStatusColor() === 'orange' ? 'd97706' : getStatusColor() === 'yellow' ? 'ca8a04' : '4b5563'})`,
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setIsVisible(true)}
        title="Sistema de Recuperación de Recursos - Click para detalles"
      >
        {getStatusText()}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        width: '350px',
        maxHeight: '400px',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        fontSize: '14px'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          🔧 Sistema de Recuperación
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getStatusColor() === 'green' ? '#10b981' : getStatusColor() === 'orange' ? '#f59e0b' : getStatusColor() === 'yellow' ? '#eab308' : '#6b7280',
              marginRight: '8px'
            }}
          />
          <span style={{ fontWeight: 'bold' }}>{getStatusText()}</span>
        </div>

        {systemStatus && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginLeft: '20px' }}>
            <div>Intentos: {systemStatus.recoveryAttempts}/{systemStatus.maxRecoveryAttempts}</div>
            {systemStatus.memoryUsage && (
              <div>
                Memoria: {systemStatus.memoryUsage.used}MB / {systemStatus.memoryUsage.limit}MB
              </div>
            )}
            <div>Conexión: {systemStatus.connection}</div>
          </div>
        )}
      </div>

      {/* Memory Usage Bar */}
      {systemStatus?.memoryUsage && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>Uso de Memoria</div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                width: `${(systemStatus.memoryUsage.used / systemStatus.memoryUsage.limit) * 100}%`,
                height: '100%',
                backgroundColor: systemStatus.memoryUsage.used / systemStatus.memoryUsage.limit > 0.8 ? '#ef4444' : 
                               systemStatus.memoryUsage.used / systemStatus.memoryUsage.limit > 0.6 ? '#f59e0b' : '#10b981',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={handleManualRecovery}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🔄 Recuperar
        </button>
        <button
          onClick={handleClearCache}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🧹 Limpiar
        </button>
      </div>

      {/* Info */}
      <div style={{
        fontSize: '11px',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        padding: '8px',
        borderRadius: '6px'
      }}>
        <strong>¿Qué hace este sistema?</strong><br />
        • Detecta errores de recursos insuficientes<br />
        • Limpia caché automáticamente<br />
        • Recarga chunks fallidos<br />
        • Optimiza para conexiones lentas
      </div>
    </div>
  );
};

export default ResourceRecoveryMonitor;