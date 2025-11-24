import { createClient } from '@supabase/supabase-js'
import { getServerConfig, validateSupabaseConfig } from './supabaseConfig.js'

// Server-side Supabase client (no browser dependencies)
// Environment variables will be read lazily when the client is used

// Create server-side Supabase client with lazy validation
let _supabaseServer = null;

export const getSupabaseServer = () => {
  if (!_supabaseServer) {
    try {
      // Validar configuración al inicializar
      validateSupabaseConfig()
      
      // Obtener configuración de servidor
      const serverConfig = getServerConfig()
      
      console.log('🔗 Server Supabase Client initialized with unified configuration:', {
        url: serverConfig.url,
        hasServerKey: !!serverConfig.key,
        environment: process.env.NODE_ENV || 'development'
      })

      _supabaseServer = createClient(
        serverConfig.url,
        serverConfig.key,
        serverConfig.options
      )
    } catch (error) {
      console.error('❌ CRITICAL: Server Supabase configuration failed:', error.message)
      throw error
    }
  }

  return _supabaseServer;
};

// Export a default instance for convenience
export const supabaseServer = getSupabaseServer()

export default supabaseServer