import { useState, useEffect } from 'react';

/**
 * Hook seguro para acceder a window.location
 * Evita problemas de hidratación durante el renderizado del servidor
 * 
 * @returns {Object} Objeto con propiedades de location seguras
 */
export const useSafeLocation = () => {
  const [location, setLocation] = useState({
    pathname: '',
    search: '',
    hash: '',
    origin: '',
    href: '',
    hostname: '',
    protocol: '',
    port: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        origin: window.location.origin,
        href: window.location.href,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port
      });
    }
  }, []);

  return location;
};

export default useSafeLocation;