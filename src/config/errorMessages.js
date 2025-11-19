/**
 * Mapeo de errores técnicos a mensajes amigables para usuarios finales
 * Organizado por categoría para fácil mantenimiento
 */

export const errorMessages = {
  // Auth errors
  'Invalid login credentials': 'Email o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.',
  'User already registered': 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'El formato del email no es válido.',
  'Token has expired or is invalid': 'El enlace de recuperación expiró o es inválido. Solicita uno nuevo.',
  
  // Supabase/Database errors
  'Failed to fetch': 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
  'relation "public.employees" does not exist': 'Error en la base de datos. Contacta al administrador.',
  'new row violates row-level security policy': 'No tienes permiso para realizar esta acción.',
  'duplicate key value violates unique constraint': 'Este registro ya existe en el sistema.',
  'Network error': 'Error de red. Verifica tu conexión a internet.',
  
  // Google Drive errors
  'No hay credenciales válidas': 'Conecta tu cuenta de Google Drive para usar esta función.',
  'Failed to fetch credentials': 'Error al conectar con Google Drive. Revisa la configuración en Integraciones.',
  'Invalid OAuth token': 'El token de acceso expiró. Reautentica tu cuenta de Google Drive.',
  'The user does not have sufficient permissions for this file': 'No tienes permisos suficientes en Google Drive.',
  'File not found': 'El archivo no existe en Google Drive o fue eliminado.',
  'User rate limit exceeded': 'Límite de uso excedido. Intenta nuevamente en unos minutos.',
  
  // Google OAuth errors
  'access_denied': 'Denegaste el acceso a Google Drive. Necesitas autorizar para usar esta función.',
  'invalid_grant': 'La autorización expiró o fue revocada. Conecta nuevamente tu cuenta.',
  'redirect_uri_mismatch': 'Error de configuración. El URI de redireccionamiento no coincide.',
  
  // WhatsApp errors
  'WhatsApp no está configurado': 'Configura WhatsApp en la sección de Integraciones antes de usar esta función.',
  'No hay instancias de WhatsApp activas': 'No hay conexiones de WhatsApp activas. Verifica la configuración.',
  'Failed to send message': 'No se pudo enviar el mensaje. Verifica la conexión de WhatsApp.',
  'QR Code not generated': 'No se generó el código QR. Intenta reconectar WhatsApp.',
  
  // Validation errors
  'Required field is missing': 'Completa todos los campos obligatorios.',
  'Invalid email format': 'El formato del email no es válido.',
  'Invalid phone number': 'El número de teléfono no es válido.',
  'Value too long': 'El texto ingresado es demasiado largo.',
  
  // Generic errors
  '401': 'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
  '403': 'No tienes permiso para acceder a esta función.',
  '404': 'Recurso no encontrado. Puede que fue eliminado.',
  '429': 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
  '500': 'Error interno del servidor. Intenta nuevamente o contacta soporte.',
  '503': 'Servicio no disponible. Intenta nuevamente en unos minutos.',
  
  // Network/Connection errors
  'ERR_NETWORK': 'Error de conexión. Verifica tu internet e intenta nuevamente.',
  'ERR_INTERNET_DISCONNECTED': 'No hay conexión a internet.',
  'TIMEOUT': 'La solicitud tardó demasiado. Intenta nuevamente.',
  
  // Unknown errors
  'UNKNOWN_ERROR': 'Ocurrió un error inesperado. Intenta nuevamente o contacta soporte.',
  'UNEXPECTED_ERROR': 'Error inesperado. Si persiste, contacta al administrador.'
};

/**
 * Función para obtener mensaje amigable basado en error
 * @param {Error|string} error - Error object o mensaje
 * @param {string} context - Contexto donde ocurrió el error (ej: 'auth', 'drive', 'whatsapp')
 * @returns {string} Mensaje amigable para el usuario
 */
export const getFriendlyErrorMessage = (error, context = '') => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'object' ? error.code : null;
  
  // Buscar coincidencia exacta primero
  if (errorMessages[errorMessage]) {
    return errorMessages[errorMessage];
  }
  
  // Buscar por código de error
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }
  
  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Mensaje genérico basado en contexto
  const contextMessages = {
    auth: 'Error de autenticación. Verifica tus credenciales.',
    drive: 'Error con Google Drive. Revisa la configuración.',
    whatsapp: 'Error con WhatsApp. Verifica la conexión.',
    database: 'Error en la base de datos. Intenta nuevamente.',
    network: 'Error de conexión. Verifica tu internet.'
  };
  
  return contextMessages[context] || errorMessages.UNKNOWN_ERROR;
};

/**
 * Categorías de errores para filtrado y logging
 */
export const ErrorCategory = {
  AUTH: 'auth',
  DATABASE: 'database',
  NETWORK: 'network',
  GOOGLE_DRIVE: 'drive',
  WHATSAPP: 'whatsapp',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

export default errorMessages;