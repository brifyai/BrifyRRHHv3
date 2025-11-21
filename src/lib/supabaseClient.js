import { createClient } from '@supabase/supabase-js'
import { APP_CONFIG } from '../config/constants.js'
import networkResourceManager from './networkResourceManager.js'

// Usar variables de entorno con fallback para producción
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'

// Validar configuración de Supabase
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase configuration!')
  console.error('   - REACT_APP_SUPABASE_URL:', SUPABASE_URL ? 'Present' : 'Missing')
  console.error('   - REACT_APP_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing')
  throw new Error('Supabase configuration is required')
}

console.log('🔗 Supabase Client initialized with:', {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  environment: process.env.NODE_ENV || 'development'
})

// Create and export the Supabase client con opciones optimizadas y REALES
export const supabase = createClient(
  // Usar URL de variables de entorno
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      flow: 'pkce',
      debug: false, // Deshabilitar logs de debug para evitar spam
      storageKey: 'brifyrrhhv2-auth-token',
      storageGetItem: (key) => {
        try {
          return window.localStorage.getItem(key)
        } catch (e) {
          console.warn('Failed to get storage item:', key)
          return null
        }
      },
      storageSetItem: (key, value) => {
        try {
          window.localStorage.setItem(key, value)
        } catch (e) {
          console.warn('Failed to set storage item:', key, e)
        }
      }
    },
    global: {
      headers: {
        'X-Client-Info': `${APP_CONFIG.NAME}/${APP_CONFIG.VERSION}`
        // Eliminado X-Forced-Project para evitar conflictos de CORS
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      disabled: false,
      encodeChannels: (channel) => channel,
      decodeChannels: (channel) => channel
    },
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

// Export configuration for reference (usando variables reales)
export const config = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  environment: process.env.NODE_ENV || 'development'
}