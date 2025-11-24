/**
 * Configuración Unificada de Supabase
 * 
 * Este archivo centraliza toda la configuración de Supabase para evitar
 * inconsistencias y problemas de conectividad.
 */

// Configuración principal de Supabase
export const SUPABASE_CONFIG = {
  // URL y claves principales
  url: process.env.REACT_APP_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE',
  
  // Variables de entorno del servidor
  serverUrl: process.env.SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co',
  serverKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE',
  
  // Configuración de cliente
  clientOptions: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : null,
      flow: 'pkce',
      debug: false,
      storageKey: 'brifyrrhhv2-auth-token',
      storageGetItem: (key) => {
        try {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
          }
          return null;
        } catch (e) {
          console.warn('Failed to get storage item:', key);
          return null;
        }
      },
      storageSetItem: (key, value) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        } catch (e) {
          console.warn('Failed to set storage item:', key, e);
        }
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'StaffHub/1.0.0 (browser)',
        'X-Forced-Project': 'tmqglnycivlcjijoymwe'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      disabled: false
    }
  },
  
  // Configuración de servidor
  serverOptions: {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flow: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'StaffHub/1.0.0 (server)',
        'X-Forced-Project': 'tmqglnycivlcjijoymwe'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      disabled: true
    }
  }
};

// Función para validar configuración
export const validateSupabaseConfig = () => {
  const config = SUPABASE_CONFIG;
  const errors = [];
  
  if (!config.url) {
    errors.push('SUPABASE_URL is missing');
  }
  
  if (!config.anonKey) {
    errors.push('SUPABASE_ANON_KEY is missing');
  }
  
  if (!config.serverUrl) {
    errors.push('Server SUPABASE_URL is missing');
  }
  
  if (!config.serverKey) {
    errors.push('Server SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  
  if (errors.length > 0) {
    console.error('❌ Supabase Configuration Errors:', errors);
    throw new Error(`Supabase configuration incomplete: ${errors.join(', ')}`);
  }
  
  console.log('✅ Supabase Configuration Valid:', {
    url: config.url,
    hasAnonKey: !!config.anonKey,
    hasServerKey: !!config.serverKey,
    environment: process.env.NODE_ENV || 'development'
  });
  
  return true;
};

// Función para obtener configuración de cliente
export const getClientConfig = () => {
  validateSupabaseConfig();
  return {
    url: SUPABASE_CONFIG.url,
    key: SUPABASE_CONFIG.anonKey,
    options: SUPABASE_CONFIG.clientOptions
  };
};

// Función para obtener configuración de servidor
export const getServerConfig = () => {
  validateSupabaseConfig();
  return {
    url: SUPABASE_CONFIG.serverUrl,
    key: SUPABASE_CONFIG.serverKey,
    options: SUPABASE_CONFIG.serverOptions
  };
};

export default SUPABASE_CONFIG;