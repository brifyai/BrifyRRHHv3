/**
 * 🔧 ERROR BOUNDARY ESPECÍFICO PARA CHUNKS
 * 
 * Maneja errores de lazy loading y ChunkLoadError
 * con retry automático y fallbacks robustos
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    }
    
    this.maxRetries = 3
    this.retryDelay = 1000
  }

  static getDerivedStateFromError(error) {
    // Actualizar state para mostrar el error boundary
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log del error específico para chunks
    console.error('🚨 ChunkErrorBoundary capturó un error:', error)
    console.error('📋 Error Info:', errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Identificar si es un ChunkLoadError
    if (error.name === 'ChunkLoadError' || 
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
      
      console.log('🔄 Detectado ChunkLoadError, iniciando retry...')
      this.handleRetry()
    }
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.log('❌ Máximo número de reintentos alcanzado')
      return
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    })

    console.log(`🔄 Reintentando carga de chunk... (${this.state.retryCount + 1}/${this.maxRetries})`)

    // Esperar antes del retry
    await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.state.retryCount))

    // Limpiar cache del navegador para el chunk específico
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('🧹 Cache del navegador limpiado')
      } catch (cacheError) {
        console.warn('⚠️ Error limpiando cache:', cacheError)
      }
    }

    // Forzar reload de la página como último recurso
    if (this.state.retryCount >= 2) {
      console.log('🔄 Forzando reload de página...')
      window.location.reload()
      return
    }

    // Resetear estado para intentar de nuevo
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { error, retryCount, isRetrying } = this.state
      
      // Determinar el tipo de error y mensaje apropiado
      let errorTitle = 'Error de Carga'
      let errorMessage = 'Ocurrió un error al cargar el componente'
      let errorIcon = <AlertTriangle className="w-12 h-12 text-red-500" />
      
      if (error?.name === 'ChunkLoadError') {
        errorTitle = 'Error de Código Dinámico'
        errorMessage = 'El código dinámico no se pudo cargar. Esto puede deberse a problemas de red o caché.'
      } else if (error?.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        errorTitle = 'Recursos Insuficientes'
        errorMessage = 'No hay suficientes recursos para cargar el componente. Intenta recargar la página.'
      } else if (error?.message?.includes('Failed to fetch')) {
        errorTitle = 'Error de Conectividad'
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.'
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              {errorIcon}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {errorTitle}
            </h2>
            
            <p className="text-gray-600 mb-4">
              {errorMessage}
            </p>
            
            {error?.message && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Ver detalles técnicos
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32">
                  {error.message}
                </pre>
              </details>
            )}
            
            <div className="space-y-3">
              {/* Botón de Retry */}
              <button
                onClick={this.handleRetry}
                disabled={isRetrying || retryCount >= this.maxRetries}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  isRetrying || retryCount >= this.maxRetries
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reintentando...
                  </>
                ) : retryCount >= this.maxRetries ? (
                  'Máximo de reintentos alcanzado'
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar ({retryCount}/{this.maxRetries})
                  </>
                )}
              </button>
              
              {/* Botón de Ir al Inicio */}
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </button>
              
              {/* Botón de Recargar Página */}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Recargar Página Completa
              </button>
            </div>
            
            {/* Información de Debug (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                  Debug Info (Desarrollo)
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChunkErrorBoundary