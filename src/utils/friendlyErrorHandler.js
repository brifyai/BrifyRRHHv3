/**
 * Utilidad para mostrar errores amigables a los usuarios
 * Mantiene logs técnicos en consola para desarrollo
 */

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { getFriendlyErrorMessage, ErrorCategory } from '../config/errorMessages.js';

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
  const technicalMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : null;

  // Log técnico en consola para desarrollo
  if (showConsole) {
    console.error(`[${context || 'app'}] Error técnico:`, {
      technicalMessage,
      friendlyMessage,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Mostrar al usuario el mensaje amigable
  if (showToast) {
    // Toast notification (menos intrusivo)
    MySwal.fire({
      title: title,
      text: friendlyMessage,
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
    // Modal completo
    MySwal.fire({
      title: `<div class="flex items-center">
        <div class="bg-red-100 p-3 rounded-full mr-3">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <span class="text-xl font-bold text-gray-900">${title}</span>
      </div>`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-800 font-medium"></p>
          </div>
          ${showConsole && errorStack ? `
            <details class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <summary class="text-sm font-medium text-gray-700 cursor-pointer">
                Detalles técnicos (para soporte)
              </summary>
              <pre class="mt-2 text-xs text-gray-600 overflow-x-auto"></pre>
            </details>
          ` : ''}
        </div>
      `,
      showConfirmButton: showConfirmButton,
      confirmButtonText: confirmButtonText,
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-gray-100',
        confirmButton: 'px-6 py-3 rounded-xl font-semibold'
      },
      width: '600px'
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
    title: 'Error',
    text: friendlyMessage,
    icon: 'error',
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#ef4444',
    customClass: {
      popup: 'rounded-xl shadow-lg'
    }
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
  const fieldText = field ? ` (${field})` : '';
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
 * Muestra error de autenticación
 * @param {Error} error - Error de auth
 */
export const showAuthError = (error) => {
  showFriendlyError(error, 'auth', {
    title: 'Error de Autenticación',
    confirmButtonText: 'Iniciar Sesión'
  });
};

export default {
  showFriendlyError,
  showSimpleError,
  showErrorToast,
  safeExecute,
  showValidationError,
  showNetworkError,
  showAuthError
};