/**
 * 🛡️ COMPONENTE DE FALLBACK ROBUSTO PARA EMERGENCIAS
 * 
 * Proporciona una interfaz funcional cuando los componentes principales fallan
 * debido a errores de recursos o problemas de carga de chunks
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff, Database, Cpu } from 'lucide-react'

const EmergencyFallback = ({ 
  componentName = 'Componente',
  error = null,
  onRetry = null,
  onGoHome = null,
  showAdvanced = false 
}) => {
  const [resourceStatus, setResourceStatus] = useState('unknown')
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Verificar estado de recursos del sistema
  useEffect(() => {
    const checkResourceStatus = () => {
      try {
        // Verificar memoria del navegador
        let memoryStatus = 'unknown'
        if ('memory' in performance) {
          const memory = performance.memory
          const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          
          if (usagePercent > 90) {
            memoryStatus = 'critical'
          } else if (usagePercent > 70) {
            memoryStatus = 'warning'
          } else {
            memoryStatus = 'normal'
          }
        }

        // Verificar estado de conexión
        let connectionStatus = 'offline'
        if (navigator.onLine) {
          connectionStatus = 'online'
        }

        // Verificar errores recientes de red
        const recentErrors = window.recentErrorCount || 0
        let errorStatus = 'normal'
        if (recentErrors > 10) {
          errorStatus = 'critical'
        } else if (recentErrors > 5) {
          errorStatus = 'warning'
        }

        // Determinar estado general
        if (memoryStatus === 'critical' || errorStatus === 'critical') {
          setResourceStatus('critical')
        } else if (memoryStatus === 'warning' || errorStatus === 'warning') {
          setResourceStatus('warning')
        } else {
          setResourceStatus('normal')
        }

        setConnectionStatus(connectionStatus)

      } catch (error) {
        console.warn('Error checking resource status:', error)
        setResourceStatus('unknown')
        setConnectionStatus('unknown')
      }
    }

    checkResourceStatus()
    const interval = setInterval(checkResourceStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRetry = async () => {
    if (isRetrying) return

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      // Limpiar cache local
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }

      // Limpiar localStorage no crítico
      const keysToKeep = ['supabase.auth.token', 'user-preferences']
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key)
        }
      })

      // Esperar un momento antes del retry
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (onRetry) {
        await onRetry()
      } else {
        // Retry automático - recargar la página
        window.location.reload()
      }

    } catch (error) {
      console.error('Error during retry:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      window.location.href = '/'
    }
  }

  const getStatusIcon = () => {
    switch (resourceStatus) {
      case 'critical':
        return <Cpu className="w-8 h-8 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />
      default:
        return <Database className="w-8 h-8 text-blue-500" />
    }
  }

  const getConnectionIcon = () => {
    return connectionStatus === 'online' 
      ? <Wifi className="w-5 h-5 text-green-500" />
      : <WifiOff className="w-5 h-5 text-red-500" />
  }

  const getStatusMessage = () => {
    if (resourceStatus === 'critical') {
      return 'El sistema está experimentando alta presión de recursos'
    } else if (resourceStatus === 'warning') {
      return 'El sistema está operando con recursos limitados'
    } else {
      return 'El sistema está funcionando normalmente'
    }
  }

  const getErrorDetails = () => {
    if (!error) return null

    const errorMessages = []
    
    if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
      errorMessages.push('Recursos insuficientes del sistema')
    }
    
    if (error.message?.includes('ChunkLoadError')) {
      errorMessages.push('Error al cargar componente dinámico')
    }
    
    if (error.message?.includes('Failed to fetch')) {
      errorMessages.push('Error de conectividad de red')
    }

    if (error.message?.includes('timeout')) {
      errorMessages.push('Tiempo de espera agotado')
    }

    return errorMessages.length > 0 ? errorMessages : [error.message || 'Error desconocido']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header con estado del sistema */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon()}
              <div>
                <h2 className="text-xl font-bold">Sistema en Modo Seguro</h2>
                <p className="text-blue-100 text-sm">{getStatusMessage()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <span className="text-sm font-medium">
                {connectionStatus === 'online' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {componentName} No Disponible
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Este componente no se pudo cargar debido a limitaciones de recursos del sistema. 
              Hemos activado el modo seguro para preservar la funcionalidad principal.
            </p>
          </div>

          {/* Detalles del error */}
          {showAdvanced && getErrorDetails() && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Detalles Técnicos:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {getErrorDetails().map((detail, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estado de recursos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Database className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Memoria</p>
              <p className={`text-xs ${
                resourceStatus === 'critical' ? 'text-red-600' :
                resourceStatus === 'warning' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {resourceStatus === 'critical' ? 'Crítica' :
                 resourceStatus === 'warning' ? 'Limitada' : 'Normal'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Wifi className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Conexión</p>
              <p className={`text-xs ${
                connectionStatus === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'online' ? 'Estable' : 'Inestable'}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Reintentos</p>
              <p className="text-xs text-gray-600">{retryCount}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-4">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all ${
                isRetrying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reintentar Carga
                </>
              )}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar Página
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Consejos</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cierra otras pestañas para liberar memoria</li>
              <li>• Verifica tu conexión a internet</li>
              <li>• Intenta recargar la página en unos minutos</li>
              <li>• El sistema se recuperará automáticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmergencyFallback