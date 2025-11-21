/**
 * 🔄 WRAPPER DE RETRY PARA CHUNKS
 * 
 * Componente que envuelve lazy components para manejar
 * automáticamente errores de carga de chunks
 */

import React, { Suspense } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import ChunkErrorBoundary from './ChunkErrorBoundary.js'

// Componente de loading mejorado
const ChunkLoadingSpinner = ({ message = "Cargando componente..." }) => (
  <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
    <p className="text-gray-600 text-sm">{message}</p>
    <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
    </div>
  </div>
)

// Componente de fallback para errores de chunks
const ChunkFallback = ({ error, retry, componentName = "componente" }) => (
  <div className="flex flex-col items-center justify-center p-8 min-h-[200px] bg-red-50 rounded-lg border border-red-200">
    <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
    <h3 className="text-lg font-medium text-red-900 mb-2">
      Error cargando {componentName}
    </h3>
    <p className="text-red-700 text-sm text-center mb-4 max-w-sm">
      No se pudo cargar el código dinámico. Esto puede deberse a problemas de red o caché.
    </p>
    <button
      onClick={retry}
      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      <RefreshCw className="w-4 h-4 mr-2" />
      Reintentar
    </button>
  </div>
)

/**
 * Wrapper que maneja automáticamente el retry de chunks
 */
const ChunkRetryWrapper = ({ 
  children, 
  componentName = "componente",
  fallbackMessage = "Cargando...",
  enableRetry = true,
  maxRetries = 3,
  retryDelay = 1000
}) => {
  const [retryKey, setRetryKey] = React.useState(0)
  const [retryCount, setRetryCount] = React.useState(0)

  const handleRetry = React.useCallback(() => {
    if (retryCount >= maxRetries) {
      console.log(`❌ Máximo número de reintentos alcanzado para ${componentName}`)
      return
    }

    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    setRetryKey(prev => prev + 1)
    
    console.log(`🔄 Reintentando carga de ${componentName}... (${newRetryCount}/${maxRetries})`)
    
    // Limpiar cache del navegador
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName)
        })
      })
    }
  }, [retryCount, maxRetries, componentName])

  // Resetear contador cuando el componente se monta exitosamente
  React.useEffect(() => {
    setRetryCount(0)
  }, [retryKey])

  return (
    <ChunkErrorBoundary>
      <Suspense 
        key={retryKey}
        fallback={
          enableRetry && retryCount > 0 ? (
            <ChunkFallback 
              error={null} 
              retry={handleRetry} 
              componentName={componentName}
            />
          ) : (
            <ChunkLoadingSpinner message={fallbackMessage} />
          )
        }
      >
        {children}
      </Suspense>
    </ChunkErrorBoundary>
  )
}

/**
 * Hook para retry manual de chunks
 */
export const useChunkRetry = (componentName = "componente", maxRetries = 3) => {
  const [retryKey, setRetryKey] = React.useState(0)
  const [retryCount, setRetryCount] = React.useState(0)

  const retry = React.useCallback(() => {
    if (retryCount >= maxRetries) {
      console.log(`❌ Máximo número de reintentos alcanzado para ${componentName}`)
      return false
    }

    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    setRetryKey(prev => prev + 1)
    
    console.log(`🔄 Reintentando carga de ${componentName}... (${newRetryCount}/${maxRetries})`)
    
    // Limpiar cache del navegador
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName)
        })
      })
    }
    
    return true
  }, [retryCount, maxRetries, componentName])

  const reset = React.useCallback(() => {
    setRetryCount(0)
    setRetryKey(prev => prev + 1)
  }, [])

  return { retry, reset, retryCount, retryKey }
}

export default ChunkRetryWrapper