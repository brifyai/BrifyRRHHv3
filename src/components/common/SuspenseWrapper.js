import React, { Suspense } from 'react';
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner.js';

// ✅ CORREGIDO: Extraer el fallback a una función fuera del componente
const DefaultFallback = ({ message, fullScreen }) => (
  <EnhancedLoadingSpinner
    message={message}
    size="large"
    fullScreen={fullScreen}
    showProgress={true}
  />
);

const SuspenseWrapper = ({
  children,
  fallback = null,
  message = "Cargando componente...",
  fullScreen = false
}) => {
  // ✅ CORREGIDO: Usar el fallback directamente en Suspense
  return (
    <Suspense fallback={fallback || <DefaultFallback message={message} fullScreen={fullScreen} />}>
      {children}
    </Suspense>
  );
};

export default SuspenseWrapper;