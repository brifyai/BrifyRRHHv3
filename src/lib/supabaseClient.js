import { createClient } from '@supabase/supabase-js'
import networkResourceManager from './networkResourceManager.js'
import { getClientConfig, validateSupabaseConfig } from './supabaseConfig.js'

// Validar configuración al inicializar
try {
  validateSupabaseConfig()
} catch (error) {
  console.error('❌ CRITICAL: Supabase configuration validation failed:', error.message)
  throw error
}

// Obtener configuración de cliente
const clientConfig = getClientConfig()

console.log('🔗 Supabase Client initialized with unified configuration:', {
  url: clientConfig.url,
  hasAnonKey: !!clientConfig.key,
  environment: process.env.NODE_ENV || 'development'
})

// Create and export the Supabase client con configuración unificada
export const supabase = createClient(
  clientConfig.url,
  clientConfig.key,
  {
    ...clientConfig.options,
    // 🔥 INTEGRACIÓN NETWORK RESOURCE MANAGER
    // Interceptar fetch para aplicar gestión de recursos
    fetch: async (url, options = {}) => {
      // Solo aplicar gestión a requests de Supabase (evitar requests internos)
      if (url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
        console.log('🔄 NetworkResourceManager: Interceptando request Supabase:', url)
        return networkResourceManager.fetchWithResourceManagement(url, options)
      }
      
      // Para otros requests, usar fetch normal
      return fetch(url, options)
    }
  }
)

// Export configuration for reference
export const config = {
  url: clientConfig.url,
  anonKey: clientConfig.key,
  environment: process.env.NODE_ENV || 'development'
}

export default supabase