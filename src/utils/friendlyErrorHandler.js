/**
 * Utilidad para mostrar errores amigables a los usuarios
 * Mantiene logs técnicos en consola para desarrollo
 */

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { getFriendlyErrorMessage } from '../config/errorMessages.js';

const MySwal = withReactContent(Swal);

/**
 * Muestra un error amigable al usuario y loguea el error técnico en consola
 * @param {Error|string} error - Error object o mensaje de error
 * @param {string} context - Contexto donde ocurrió el error (ej: 'auth', 'drive', 'whatsapp')
 * @param {Object} options - Opciones adicionales
 */
export const showFriendlyError = (error, context = '', options = {}) => {
  const {
    title = 'Error',
    showConsole = true,
    showToast = false,
    toastTimer = 5000,
    confirmButtonText = 'Entendido',
    showConfirmButton = true
  } = options;

  // Obtener mensaje amigable
  const friendlyMessage = getFriendlyErrorMessage(error, context);
  const technicalMessage = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
  const errorStack = typeof error === 'object' && error?.stack ? error.stack : null;

  // Log técnico en consola para desarrollo
  if (showConsole) {
    console.error(`[${context || 'app'}] Error técnico:`, {
      technicalMessage,
      friendlyMessage,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Asegurar que siempre haya un mensaje amigable
  const displayMessage = friendlyMessage || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';

  // Mostrar al usuario el mensaje amigable
  if (showToast) {
    // Toast notification (menos intrusivo)
    MySwal.fire({
      title: title,
      text: displayMessage,
      icon: 'error',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: toastTimer,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl shadow-lg'
      }
    });
  } else {
    // Modal completo con diseño mejorado
    MySwal.fire({
      html: `
        <div class="text-center space-y-4 py-4">
          <!-- Icono de error -->
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          
          <!-- Título -->
          <h3 class="text-xl font-bold text-gray-900">
            ${title}
          </h3>
          
          <!-- Mensaje principal -->
          <div class="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 text-left">
            <p class="text-sm text-red-800 font-medium">
              ${displayMessage}
            </p>
          </div>
          
          ${showConsole && technicalMessage ? `
            <!-- Detalles técnicos colapsables -->
            <details class="text-left bg-gray-50 rounded-lg p-3 border border-gray-200">
              <summary class="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800 select-none">
                ▶ Detalles técnicos (para soporte)
              </summary>
              <div class="mt-3 space-y-2">
                <div class="bg-white rounded-lg p-3 border border-gray-200">
                  <p class="text-xs font-semibold text-gray-500 mb-1">Mensaje técnico:</p>
                  <pre class="text-xs text-gray-700 whitespace-pre-wrap break-words">${technicalMessage}</pre>
                </div>
                ${errorStack ? `
                  <div class="bg-white rounded-lg p-3 border border-gray-200">
                    <p class="text-xs font-semibold text-gray-500 mb-1">Stack trace:</p>
                    <pre class="text-xs text-gray-600 whitespace-pre-wrap break-words overflow-x-auto max-h-40">${errorStack}</pre>
                  </div>
                ` : ''}
              </div>
            </details>
          ` : ''}
        </div>
      `,
      showConfirmButton: showConfirmButton,
      confirmButtonText: confirmButtonText,
      confirmButtonColor: '#dc2626',
      showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
      },
      customClass: {
        popup: 'rounded-2xl shadow-2xl border-0',
        confirmButton: 'px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200'
      },
      width: '500px',
      padding: '2rem'
    });
  }
};

/**
 * Muestra un error amigable sin mostrar detalles técnicos
 * @param {Error|string} error - Error object o mensaje
 * @param {string} context - Contexto del error
 */
export const showSimpleError = (error, context = '') => {
  const friendlyMessage = getFriendlyErrorMessage(error, context);
  
  MySwal.fire({
    html: `
      <div class="text-center space-y-4 py-4">
        <!-- Icono de error -->
        <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100">
          <svg class="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        
        <!-- Título -->
        <h3 class="text-lg font-bold text-gray-900">Error</h3>
        
        <!-- Mensaje -->
        <p class="text-sm text-gray-700">${friendlyMessage}</p>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#dc2626',
    showClass: {
      popup: 'animate__animated animate__fadeInDown animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp animate__faster'
    },
    customClass: {
      popup: 'rounded-2xl shadow-2xl border-0',
      confirmButton: 'px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200'
    },
    width: '450px',
    padding: '2rem'
  });
};

/**
 * Muestra un error amigable como toast (desaparece automáticamente)
 * @param {Error|string} error - Error object o mensaje
 * @param {string} context - Contexto del error
 * @param {number} timer - Tiempo en ms antes de desaparecer
 */
export const showErrorToast = (error, context = '', timer = 5000) => {
  const friendlyMessage = getFriendlyErrorMessage(error, context);
  
  MySwal.fire({
    title: 'Error',
    text: friendlyMessage,
    icon: 'error',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-xl shadow-lg'
    }
  });
};

/**
 * Maneja errores de forma segura en try/catch blocks
 * @param {Function} fn - Función a ejecutar
 * @param {string} context - Contexto para mensajes de error
 * @returns {Promise<Object>} { success: boolean, data: any, error: any }
 */
export const safeExecute = async (fn, context = '') => {
  try {
    const data = await fn();
    return { success: true, data, error: null };
  } catch (error) {
    showFriendlyError(error, context);
    return { success: false, data: null, error };
  }
};

/**
 * Muestra error de validación específico
 * @param {string} message - Mensaje de validación
 * @param {string} field - Campo que falló la validación
 */
export const showValidationError = (message, field = '') => {
  showSimpleError(message, 'validation');
};

/**
 * Muestra error de red/conexión
 * @param {Error} error - Error de red
 */
export const showNetworkError = (error) => {
  showFriendlyError(error, 'network', {
    title: 'Error de Conexión',
    confirmButtonText: 'Reintentar'
  });
};

/**
 * Muestra error de autenticación con diseño mejorado
 * @param {Error} error - Error de auth
 */
export const showAuthError = (error) => {
  const friendlyMessage = getFriendlyErrorMessage(error, 'auth');
  const technicalMessage = typeof error === 'string' ? error : (error?.message || 'Error desconocido');
  
  console.log('🔴 showAuthError llamado:', { friendlyMessage, technicalMessage });
  
  // Cerrar cualquier modal abierto primero
  MySwal.close();
  
  // Esperar un momento antes de mostrar el nuevo modal
  setTimeout(() => {
    MySwal.fire({
      title: 'Error de Autenticación',
      text: friendlyMessage || 'Error de autenticación. Verifica tus credenciales.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc2626',
      footer: `<small style="color: #6b7280;">Detalles: ${technicalMessage}</small>`,
      allowOutsideClick: true,
      allowEscapeKey: true,
      allowEnterKey: true,
      buttonsStyling: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        confirmButton: 'px-6 py-2.5 rounded-lg font-semibold'
      }
    }).then((result) => {
      console.log('✅ Modal cerrado:', result);
    });
  }, 100);
};

const friendlyErrorHandler = {
  showFriendlyError,
  showSimpleError,
  showErrorToast,
  safeExecute,
  showValidationError,
  showNetworkError,
  showAuthError
};

export default friendlyErrorHandler;