import { useLayoutEffect, useEffect } from 'react';

/**
 * Hook seguro que usa useLayoutEffect en el navegador y useEffect en el servidor
 * Evita warnings de hidratación y problemas de renderizado
 * 
 * @example
 * import { useSafeLayoutEffect } from '../hooks/useSafeLayoutEffect';
 * 
 * useSafeLayoutEffect(() => {
 *   // Código que necesita acceso al DOM
 *   const element = document.getElementById('mi-elemento');
 *   if (element) {
 *     // Hacer algo con el elemento
 *   }
 * }, [dependencies]);
 */
export const useSafeLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useSafeLayoutEffect;