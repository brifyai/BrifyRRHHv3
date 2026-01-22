/**
 * Configuración Unificada de Supabase
 * 
 * Este archivo centraliza toda la configuración de Supabase para evitar
 * inconsistencias y problemas de conectividad.
 */

// Configuración principal de Supabase
export const SUPABASE_CONFIG = {
  // URL y claves principales
  url: process.env.REACT_APP_SUPABASE_URL || 'https://supabase.staffhub.cl',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo',
  
  // Variables de entorno del servidor
  serverUrl: process.env.SUPABASE_URL || 'https://supabase.staffhub.cl',
  serverKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTYzNTgsImV4cCI6MjA4NDQ3NjM1OH0.ck89urip20NQN4WgOLVCLTXc97JQYIX_-QqyJ4lDwco',
  
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