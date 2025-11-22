import React, { useState, useEffect } from 'react'
import resourceRecoveryService from '../../lib/resourceRecoveryService.js'

/**
 * 🔥 MONITOR DE RECUPERACIÓN DE RECURSOS EN TIEMPO REAL
 * 
 * Componente que muestra el estado del sistema y permite monitoreo
 * de los errores ERR_INSUFFICIENT_RESOURCES y ChunkLoadError
 */

const ResourceRecoveryMonitor = () => {
  const [systemStatus, setSystemStatus] = useState(resourceRecoveryService.getSystemStatus())
  const [logs, setLogs] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Actualizar estado cada 2 segundos
    const interval = setInterval(() => {
      const status = resourceRecoveryService.getSystemStatus()
      setSystemStatus(status)
      
      // Agregar log si hay cambios importantes
      if (status.emergencyMode || status.resourcePressure > 75) {
        setLogs(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          level: status.emergencyMode ? 'ERROR' : 'WARNING',
          message: `Presión de recursos: ${status.resourcePressure}%`,
          details: status
        }, ...prev.slice(0, 9)]) // Mantener solo los últimos 10 logs
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (systemStatus.emergencyMode) return 'text-red-600'
    if (systemStatus.resourcePressure > 75) return 'text-orange-600'
    if (systemStatus.resourcePressure > 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusIcon = () => {
    if (systemStatus.emergencyMode) return '🚨'
    if (systemStatus.resourcePressure > 75) return '⚠️'
    if (systemStatus.resourcePressure > 50) return '🟡'
    return '✅'
  }

  const getPressureBarColor = () => {
    if (systemStatus.emergencyMode) return 'bg-red-500'
    if (systemStatus.resourcePressure > 75) return 'bg-orange-500'
    if (systemStatus.resourcePressure > 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleDebug = () => {
    console.log('Estado actual:', resourceRecoveryService.getSystemStatus())
    alert('Estado del sistema logged en consola')
  }

  const handleRecovery = () => {
    if (window.confirm && window.confirm('¿Forzar recuperación del sistema?')) {
      resourceRecoveryService.attemptRecovery()
    } else {
      // Fallback para entornos sin confirm
      resourceRecoveryService.attemptRecovery()
    }
  }

  const handleClear = () => {
    if (window.confirm && window.confirm('¿Limpiar chunks fallidos?')) {
      resourceRecoveryService.failedChunks.clear()
      resourceRecoveryService.chunkRetryCounts.clear()
      setLogs([])
    } else {
      // Fallback para entornos sin confirm
      resourceRecoveryService.failedChunks.clear()
      resourceRecoveryService.chunkRetryCounts.clear()
      setLogs([])
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Abrir Monitor de Recursos"
      >
        {getStatusIcon()}
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          {getStatusIcon()}
          <span className="ml-2">Monitor de Recursos</span>
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Estado del Sistema */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span>Modo Emergencia:</span>
          <span className={getStatusColor()}>
            {systemStatus.emergencyMode ? 'ACTIVO' : 'Inactivo'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Requests Activos:</span>
          <span className="text-blue-600">
            {systemStatus.activeRequests}/{systemStatus.maxConcurrentRequests}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Chunks Fallidos:</span>
          <span className="text-orange-600">
            {systemStatus.failedChunks.length}
          </span>
        </div>
      </div>

      {/* Barra de Presión de Recursos */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Presión de Recursos</span>
          <span>{systemStatus.resourcePressure}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getPressureBarColor()}`}
            style={{ width: `${systemStatus.resourcePressure}%` }}
          ></div>
        </div>
      </div>

      {/* Logs Recientes */}
      {logs.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Logs Recientes</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    log.level === 'ERROR' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-gray-400">{log.timestamp}</span>
                </div>
                <div className="text-gray-600 truncate">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="border-t pt-3 mt-3 flex space-x-2">
        <button
          onClick={handleDebug}
          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs py-1 px-2 rounded"
        >
          Debug
        </button>
        
        <button
          onClick={handleRecovery}
          className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs py-1 px-2 rounded"
        >
          Recuperar
        </button>
        
        <button
          onClick={handleClear}
          className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs py-1 px-2 rounded"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}

export default ResourceRecoveryMonitor