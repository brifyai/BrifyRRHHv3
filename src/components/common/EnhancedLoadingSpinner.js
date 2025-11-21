import React from 'react';

const EnhancedLoadingSpinner = ({ 
  message = "Cargando...", 
  size = "medium", 
  fullScreen = false,
  showProgress = false 
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16"
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="text-center space-y-6 max-w-md w-full">
        {/* Spinner principal */}
        <div className="relative inline-flex">
          <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
          <div className={`${sizeClasses[size]} border-4 border-transparent border-r-purple-600 rounded-full animate-spin absolute top-0 left-0 animation-delay-150`}></div>
        </div>

        {/* Mensaje principal */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {message}
          </h3>
          <p className="text-sm text-gray-600">
            Por favor, espera un momento...
          </p>
        </div>

        {/* Barra de progreso animada */}
        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" 
                 style={{ width: '60%' }}></div>
          </div>
        )}

        {/* Indicadores de estado */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-0"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce animation-delay-150"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-300"></div>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p>🚀 Optimizando tu experiencia</p>
          <p>⚡ Cargando componentes rápidamente</p>
        </div>
      </div>

      {/* Estilos para animaciones personalizadas */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .animation-delay-0 {
            animation-delay: 0ms;
          }
          .animation-delay-150 {
            animation-delay: 150ms;
          }
          .animation-delay-300 {
            animation-delay: 300ms;
          }
        `
      }} />
    </div>
  );
};

export default EnhancedLoadingSpinner;