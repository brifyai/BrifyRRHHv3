import React from 'react';

/**
 * Chunk Loading Error Handler
 * Provides graceful fallback for failed webpack chunks due to network issues
 */

// Cache for failed chunks to prevent infinite retry loops
const failedChunks = new Set();

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2
};

/**
 * Wraps a dynamic import with error handling and retry logic
 * @param {Function} importFunction - The dynamic import() function
 * @param {String} chunkName - Name of the chunk for tracking
 * @returns {Promise} - Resolves with the imported module or fallback
 */
export const safeImport = (importFunction, chunkName) => {
  // If this chunk has already failed permanently, return fallback immediately
  if (failedChunks.has(chunkName)) {
    console.warn(`Chunk ${chunkName} previously failed, using fallback`);
    return Promise.resolve({ default: () => null });
  }

  let retryCount = 0;

  const attemptImport = async () => {
    try {
      const result = await importFunction();
      console.log(`✅ Chunk ${chunkName} loaded successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Chunk ${chunkName} failed to load:`, error.message);
      
      // Check if it's a chunk loading error
      if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
        retryCount++;
        
        if (retryCount <= RETRY_CONFIG.maxRetries) {
          const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount - 1);
          console.log(`🔄 Retrying chunk ${chunkName} in ${delay}ms (attempt ${retryCount}/${RETRY_CONFIG.maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptImport();
        } else {
          console.error(`❌ Chunk ${chunkName} failed after ${RETRY_CONFIG.maxRetries} retries`);
          failedChunks.add(chunkName);
          
          // Return a fallback component
          return {
            default: () => {
              console.warn(`Rendering fallback for failed chunk: ${chunkName}`);
              return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                  <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Componente no disponible</h2>
                    <p className="text-gray-600 mb-4">El módulo {chunkName} no pudo cargarse debido a problemas de red.</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Recargar página
                    </button>
                  </div>
                </div>
              );
            }
          };
        }
      }
      
      // If it's not a chunk error, re-throw
      throw error;
    }
  };

  return attemptImport();
};

/**
 * Creates a safe lazy component with error handling
 * @param {Function} importFunction - The dynamic import() function
 * @param {String} chunkName - Name of the chunk for tracking
 * @returns {React.Component} - Lazy component with error boundary
 */
export const safeLazy = (importFunction, chunkName) => {
  return React.lazy(() => safeImport(importFunction, chunkName));
};

/**
 * Clears the failed chunks cache (useful for testing)
 */
export const clearFailedChunks = () => {
  failedChunks.clear();
  console.log('🗑️ Failed chunks cache cleared');
};

// Global error handler for uncaught chunk errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error?.name === 'ChunkLoadError') {
      console.error('Global chunk load error caught:', event.error);
      
      // Try to extract chunk name from error
      const chunkMatch = event.error.message?.match(/Loading chunk (\S+)/);
      if (chunkMatch) {
        const chunkName = chunkMatch[1];
        console.warn(`Marking chunk as failed: ${chunkName}`);
        failedChunks.add(chunkName);
      }
    }
  });
}

export default safeLazy;