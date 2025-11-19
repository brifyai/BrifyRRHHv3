import { useState, useEffect } from 'react';

/**
 * Componente SafeWindow - Wrapper seguro para acceso a window/document
 * 
 * Este componente asegura que el contenido solo se renderice en el cliente,
 * evitando problemas de hidratación durante el renderizado del servidor.
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido a renderizar
 * @param {React.ReactNode} props.fallback - Contenido a mostrar durante SSR (opcional)
 * @param {Function} props.onReady - Callback cuando se monta en el cliente (opcional)
 * 
 * @example
 * // Uso básico
 * <SafeWindow>
 *   <ComponenteQueUsaWindow />
 * </SafeWindow>
 * 
 * @example
 * // Con fallback y callback
 * <SafeWindow 
 *   fallback={<LoadingSpinner />}
 *   onReady={() => console.log('Componente montado en cliente')}
 * >
 *   <ComponenteQueUsaWindow />
 * </SafeWindow>
 */
const SafeWindow = ({ children, fallback = null, onReady }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (onReady) {
      onReady();
    }
  }, [onReady]);

  // Durante SSR o hidratación inicial, mostrar fallback o null
  if (!isClient) {
    return fallback || null;
  }

  // Una vez montado en el cliente, renderizar el contenido real
  return children;
};

export default SafeWindow;