/**
 * Configuración centralizada de constantes y variables de entorno
 * 
 * Este archivo centraliza todas las configuraciones para evitar duplicaciones
 * y facilitar el mantenimiento de la aplicación.
 */

// Configuración de Supabase
export const SUPABASE_CONFIG = {
    URL: process.env.REACT_APP_SUPABASE_URL || 'https://supabase.staffhub.cl',
    ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo',
    SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

// Configuración de Google
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || ''
};

// Configuración de Groq AI
export const GROQ_CONFIG = {
  API_KEY: process.env.REACT_APP_GROQ_API_KEY || 'tu_groq_api_key_aqui'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'StaffHub',
  VERSION: '1.0.0',
  DESCRIPTION: 'Plataforma de gestión de recursos humanos',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Configuración de caché
export const CACHE_CONFIG = {
  DASHBOARD_STATS_DURATION: 5 * 60 * 1000, // 5 minutos
  COMPANIES_DURATION: 10 * 60 * 1000, // 10 minutos
  EMPLOYEES_DURATION: 5 * 60 * 1000, // 5 minutos
  USER_PROFILE_DURATION: 15 * 60 * 1000, // 15 minutos
};

// Configuración de timeouts
export const TIMEOUT_CONFIG = {
  DATABASE_QUERY: 5000, // 5 segundos
  DASHBOARD_LOAD: 8000, // 8 segundos
  AUTH_OPERATION: 10000, // 10 segundos
  FILE_UPLOAD: 30000, // 30 segundos
};

// Configuración de UI
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // 300ms para inputs
  TOAST_DURATION: 4000, // 4 segundos
  LOADING_TIMEOUT: 12000, // 12 segundos máximo de loading
  ANIMATION_DURATION: 300, // 300ms para animaciones
};

// Límites del sistema
export const LIMITS_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FOLDERS_PER_USER: 1000,
  MAX_FILES_PER_USER: 5000,
  MAX_COMPANIES_PER_USER: 50,
  MAX_EMPLOYEES_PER_COMPANY: 1000,
  DEFAULT_TOKEN_LIMIT: 1000,
};

// Configuración de colores (tema)
export const THEME_CONFIG = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#0693e3',
};

// Configuración de rutas
export const ROUTES_CONFIG = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/panel-principal',
  PROFILE: '/perfil',
  SETTINGS: '/configuracion',
  FOLDERS: '/folders',
  FILES: '/files',
  COMMUNICATION: '/communication',
};

// Configuración de validación
export const VALIDATION_CONFIG = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  COMPANY_NAME_MAX_LENGTH: 100,
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
};

// Configuración de desarrollo
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_MOCK_DATA: process.env.REACT_APP_ENABLE_MOCK_DATA === 'true',
  DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true',
};

// Exportar todo como objeto por defecto para facilitar importación
const CONFIG = {
  SUPABASE: SUPABASE_CONFIG,
  GOOGLE: GOOGLE_CONFIG,
  GROQ: GROQ_CONFIG,
  APP: APP_CONFIG,
  CACHE: CACHE_CONFIG,
  TIMEOUT: TIMEOUT_CONFIG,
  UI: UI_CONFIG,
  LIMITS: LIMITS_CONFIG,
  THEME: THEME_CONFIG,
  ROUTES: ROUTES_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  PAGINATION: PAGINATION_CONFIG,
  ANIMATION: ANIMATION_CONFIG,
  DEV: DEV_CONFIG,
};

export default CONFIG;