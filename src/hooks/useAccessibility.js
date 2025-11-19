import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado para manejar accesibilidad en la aplicación
 */
export const useAccessibility = () => {
  const skipLinkRef = useRef(null);
  const focusTrapRef = useRef(null);
  const previousFocusRef = useRef(null);

  /**
   * Configurar skip links para navegación por teclado
   */
  const setupSkipLinks = useCallback(() => {
    // Crear skip link si no existe
    if (!document.getElementById('skip-to-main')) {
      const skipLink = document.createElement('a');
      skipLink.id = 'skip-to-main';
      skipLink.href = '#main-content';
      skipLink.textContent = 'Saltar al contenido principal';
      skipLink.className = 'skip-link';
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #007bff;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
      `;
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Crear skip link para navegación si no existe
    if (!document.getElementById('skip-to-navigation')) {
      const navSkipLink = document.createElement('a');
      navSkipLink.id = 'skip-to-navigation';
      navSkipLink.href = '#main-navigation';
      navSkipLink.textContent = 'Saltar a navegación';
      navSkipLink.className = 'skip-link';
      navSkipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 200px;
        background: #28a745;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
      `;
      
      navSkipLink.addEventListener('focus', () => {
        navSkipLink.style.top = '6px';
      });
      
      navSkipLink.addEventListener('blur', () => {
        navSkipLink.style.top = '-40px';
      });
      
      document.body.insertBefore(navSkipLink, document.body.firstChild);
    }
  }, []);

  /**
   * Configurar focus trap para modales y diálogos
   */
  const setupFocusTrap = useCallback((element) => {
    if (!element) return;

    focusTrapRef.current = element;
    
    // Guardar el elemento enfocado actualmente
    previousFocusRef.current = document.activeElement;
    
    // Enfocar primer elemento enfocable dentro del trap
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Manejar tecla Tab para mantener focus dentro del elemento
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      if (event.key === 'Escape') {
        // Disparar evento personalizado para manejar Escape
        element.dispatchEvent(new CustomEvent('focusTrapEscape'));
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    // Retornar función de limpieza
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  /**
   * Liberar focus trap
   */
  const releaseFocusTrap = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
    focusTrapRef.current = null;
  }, []);

  /**
   * Anunciar cambios para lectores de pantalla
   */
  const announceToScreenReader = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remover después de un tiempo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  /**
   * Verificar contraste de colores
   */
  const checkContrast = useCallback((foreground, background) => {
    // Función para convertir hex a RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Función para calcular luminancia relativa
    const getLuminance = (rgb) => {
      const rsRGB = rgb.r / 255;
      const gsRGB = rgb.g / 255;
      const bsRGB = rgb.b / 255;

      const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
      const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
      const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    // Función para calcular ratio de contraste
    const getContrastRatio = (color1, color2) => {
      const lum1 = getLuminance(color1);
      const lum2 = getLuminance(color2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    };

    const rgb1 = hexToRgb(foreground);
    const rgb2 = hexToRgb(background);

    if (!rgb1 || !rgb2) return null;

    const ratio = getContrastRatio(rgb1, rgb2);
    
    return {
      ratio: ratio.toFixed(2),
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
      wcagAALarge: ratio >= 3,
      wcagAAALarge: ratio >= 4.5
    };
  }, []);

  /**
   * Mejorar contraste si es necesario
   */
  const ensureContrast = useCallback((textColor, backgroundColor) => {
    const contrast = checkContrast(textColor, backgroundColor);
    
    if (!contrast) return textColor;
    
    // Si no cumple WCAG AA, ajustar el color
    if (!contrast.wcagAA) {
      // Calcular si el texto es claro u oscuro
      const rgb = parseInt(textColor.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // Si es claro, hacerlo más oscuro; si es oscuro, hacerlo más claro
      if (brightness > 128) {
        return '#000000'; // Negro para máximo contraste
      } else {
        return '#ffffff'; // Blanco para máximo contraste
      }
    }
    
    return textColor;
  }, [checkContrast]);

  /**
   * Configurar navegación por teclado para tablas
   */
  const setupTableNavigation = useCallback((tableElement) => {
    if (!tableElement) return;

    const handleKeyDown = (event) => {
      const cell = event.target;
      const row = cell.closest('tr');
      
      if (!row || !cell) return;

      const cells = Array.from(row.querySelectorAll('td, th'));
      const cellIndex = cells.indexOf(cell);
      
      let targetCell = null;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          targetCell = cells[Math.max(0, cellIndex - 1)];
          break;
        case 'ArrowRight':
          event.preventDefault();
          targetCell = cells[Math.min(cells.length - 1, cellIndex + 1)];
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevRow = row.previousElementSibling;
          if (prevRow) {
            const prevCells = Array.from(prevRow.querySelectorAll('td, th'));
            targetCell = prevCells[Math.min(cellIndex, prevCells.length - 1)];
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          const nextRow = row.nextElementSibling;
          if (nextRow) {
            const nextCells = Array.from(nextRow.querySelectorAll('td, th'));
            targetCell = nextCells[Math.min(cellIndex, nextCells.length - 1)];
          }
          break;
        case 'Home':
          event.preventDefault();
          targetCell = cells[0];
          break;
        case 'End':
          event.preventDefault();
          targetCell = cells[cells.length - 1];
          break;
      }

      if (targetCell) {
        // Enfocar el contenido de la celda si es editable, sino la celda
        const focusableElement = targetCell.querySelector('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
        if (focusableElement) {
          focusableElement.focus();
        } else {
          targetCell.setAttribute('tabindex', '0');
          targetCell.focus();
        }
      }
    };

    tableElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      tableElement.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Detectar preferencias de accesibilidad del usuario
   */
  const getAccessibilityPreferences = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return {
      prefersReducedMotion,
      prefersHighContrast,
      prefersDarkMode,
      // Detectar si el usuario está usando lector de pantalla
      usesScreenReader: window.speechSynthesis !== undefined,
      // Detectar si el usuario está usando teclado
      usesKeyboard: !('ontouchstart' in window) || navigator.maxTouchPoints === 0
    };
  }, []);

  /**
   * Aplicar preferencias de accesibilidad
   */
  const applyAccessibilityPreferences = useCallback(() => {
    const preferences = getAccessibilityPreferences();
    
    // Aplicar reduced motion
    if (preferences.prefersReducedMotion) {
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      
      // Deshabilitar animaciones
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Aplicar high contrast
    if (preferences.prefersHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
    
    // Aplicar dark mode si es preferido
    if (preferences.prefersDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
    
    return preferences;
  }, [getAccessibilityPreferences]);

  /**
   * Configurar manejo de errores para accesibilidad
   */
  const setupErrorHandling = useCallback(() => {
    // Crear región live para errores globales
    if (!document.getElementById('global-error-region')) {
      const errorRegion = document.createElement('div');
      errorRegion.id = 'global-error-region';
      errorRegion.setAttribute('aria-live', 'assertive');
      errorRegion.setAttribute('aria-atomic', 'true');
      errorRegion.className = 'sr-only';
      document.body.appendChild(errorRegion);
    }

    // Crear región live para notificaciones
    if (!document.getElementById('global-notification-region')) {
      const notificationRegion = document.createElement('div');
      notificationRegion.id = 'global-notification-region';
      notificationRegion.setAttribute('aria-live', 'polite');
      notificationRegion.setAttribute('aria-atomic', 'true');
      notificationRegion.className = 'sr-only';
      document.body.appendChild(notificationRegion);
    }
  }, []);

  /**
   * Inicializar accesibilidad
   */
  const initializeAccessibility = useCallback(() => {
    setupSkipLinks();
    setupErrorHandling();
    const preferences = applyAccessibilityPreferences();
    
    // Anunciar que la accesibilidad está inicializada
    announceToScreenReader('Sistema de accesibilidad inicializado');
    
    return preferences;
  }, [setupSkipLinks, setupErrorHandling, applyAccessibilityPreferences, announceToScreenReader]);

  // Efecto para inicializar accesibilidad al montar
  useEffect(() => {
    const preferences = initializeAccessibility();
    
    // Escuchar cambios en preferencias del sistema
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ];

    const handleChange = () => {
      applyAccessibilityPreferences();
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, [initializeAccessibility, applyAccessibilityPreferences]);

  return {
    // Métodos principales
    setupFocusTrap,
    releaseFocusTrap,
    announceToScreenReader,
    
    // Utilidades
    checkContrast,
    ensureContrast,
    setupTableNavigation,
    getAccessibilityPreferences,
    applyAccessibilityPreferences,
    
    // Inicialización
    initializeAccessibility,
    
    // Referencias
    skipLinkRef,
    focusTrapRef,
    previousFocusRef
  };
};

/**
 * Hook para manejar focus trap en modales
 */
export  useEffect(() => {
    if (isOpen && elementRef.current) {
      const cleanup = setupFocusTrap(elementRef.current);
      return cleanup;
    }
  }, [isOpen, elementRef, setupFocusTrap]);
};

/**
 * Hook para anuncios a lectores de pantalla
 */
export  const announce = useCallback((message, priority = 'polite') => {
    announceToScreenReader(message, priority);
  }, [announceToScreenReader]);

  const announceError = useCallback((message) => {
    announceToScreenReader(`Error: ${message}`, 'assertive');
  }, [announceToScreenReader]);

  const announceSuccess = useCallback((message) => {
    announceToScreenReader(`Éxito: ${message}`, 'polite');
  }, [announceToScreenReader]);

  const announceNavigation = useCallback((message) => {
    announceToScreenReader(`Navegación: ${message}`, 'polite');
  }, [announceToScreenReader]);

  return {
    announce,
    announceError,
    announceSuccess,
    announceNavigation
  };
};

/**
 * Hook para manejar preferencias de accesibilidad
 */
export  const [preferences, setPreferences] = React.useState(null);

  useEffect(() => {
    const prefs = getAccessibilityPreferences();
    setPreferences(prefs);
  }, [getAccessibilityPreferences]);

  const updatePreferences = useCallback(() => {
    const updatedPrefs = applyAccessibilityPreferences();
    setPreferences(updatedPrefs);
    return updatedPrefs;
  }, [applyAccessibilityPreferences]);

  return {
    preferences,
    updatePreferences
  };
};

export default useAccessibility;