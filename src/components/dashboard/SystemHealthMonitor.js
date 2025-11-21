/**
 * 📊 MONITOR DEL SISTEMA DE EMERGENCIA
 * 
 * Componente que muestra el estado del sistema de emergencia en tiempo real
 * integrado en el dashboard principal
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Cpu, Wifi, Database, RefreshCw } from 'lucide-react'
import { emergencyResourceManager } from '../../lib/emergencyResourceManager.js'
import { supabaseCircuitBreaker } from '../../lib/supabaseCircuitBreaker.js'

const SystemHealthMonitor = ({ compact = false }) => {
  const [systemStatus, setSystemStatus] = useState({
    emergencyMode: false,
    resourcePressure: 0,
    circuitBreakerState: 'CLOSED',
    activeRequests: 0,
    queuedRequests: 0,
    failureCount: 0,
    lastUpdate: Date.now()
  })

  const [isExpanded, setIsExpanded] = useState(false)

  // Actualizar estado cada 2 segundos
  useEffect(() => {
    const updateStatus = () => {
      try {
        const emergencyStatus = emergencyResourceManager.getStatus()
        const circuitBreakerStatus = supabaseCircuitBreaker.getStatus()

        setSystemStatus({
          emergencyMode: emergencyStatus.emergencyMode,
          resourcePressure: emergencyStatus.resourcePressure,
          circuitBreakerState: circuitBreakerStatus.state,
          activeRequests: emergencyStatus.activeRequests,
          queuedRequests: emergencyStatus.queuedRequests,
          failureCount: circuitBreakerStatus.failureCount,
          lastUpdate: Date.now()
        })
      } catch (error) {
        console.warn('Error updating system status:', error)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 2000)

    // Escuchar eventos de modo de emergencia
    const handleEmergencyMode = (event) => {
      console.log('🚨 Evento de modo de emergencia recibido:', event.detail)
      updateStatus()
    }

    window.addEventListener('emergencyMode', handleEmergencyMode)

    return () => {
      clearInterval(interval)
      window.removeEventListener('emergencyMode', handleEmergencyMode)
    }
  }, [])

  const getStatusColor = () => {
    if (systemStatus.emergencyMode) return 'red'
    if (systemStatus.resourcePressure > 75) return 'yellow'
    if (systemStatus.circuitBreakerState === 'OPEN') return 'orange'
    return 'green'
  }

  const getStatusIcon = () => {
    const color = getStatusColor()
    const iconProps = { className: `w-4 h-4 text-${color}-500` }

    switch (color) {
      case 'red':
        return <AlertTriangle {...iconProps} />
      case 'yellow':
        return <AlertTriangle {...iconProps} />
      case 'orange':
        return <XCircle {...iconProps} />
      default:
        return <CheckCircle {...iconProps} />
    }
  }

  const getStatusText = () => {
    if (systemStatus.emergencyMode) return 'Emergencia'
    if (systemStatus.resourcePressure > 75) return 'Advertencia'
    if (systemStatus.circuitBreakerState === 'OPEN') return 'Protegido'
    return 'Normal'
  }

  const getResourcePressureColor = () => {
    if (systemStatus.resourcePressure >= 90) return 'bg-red-500'
    if (systemStatus.resourcePressure >= 75) return 'bg-yellow-500'
    if (systemStatus.resourcePressure >= 50) return 'bg-orange-500'
    return 'bg-green-500'
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm">
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
        <div className="w-16 bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${getResourcePressureColor()}`}
            style={{ width: `${systemStatus.resourcePressure}%` }}
          ></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Estado del Sistema
              </h3>
              <p className="text-xs text-gray-600">
                {getStatusText()} • Presión: {systemStatus.resourcePressure.toFixed(1)}%
              </p>
            </div>
          </div>
          <RefreshCw className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Barra de presión de recursos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Presión de Recursos</span>
              <span className="text-sm text-gray-600">
                {systemStatus.resourcePressure.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getResourcePressureColor()}`}
                style={{ width: `${systemStatus.resourcePressure}%` }}
              ></div>
            </div>
          </div>

          {/* Métricas del sistema */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Cpu className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Circuit Breaker</span>
              </div>
              <span className={`text-sm font-semibold ${
                systemStatus.circuitBreakerState === 'CLOSED' ? 'text-green-600' :
                systemStatus.circuitBreakerState === 'OPEN' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {systemStatus.circuitBreakerState}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Requests Activas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {systemStatus.activeRequests}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Wifi className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">En Cola</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {systemStatus.queuedRequests}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <XCircle className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Fallos</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {systemStatus.failureCount}
              </span>
            </div>
          </div>

          {/* Estado de emergencia */}
          {systemStatus.emergencyMode && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">
                  Modo de Emergencia Activo
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                El sistema está operando con funcionalidad reducida para preservar recursos.
              </p>
            </div>
          )}

          {/* Última actualización */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            Última actualización: {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemHealthMonitor