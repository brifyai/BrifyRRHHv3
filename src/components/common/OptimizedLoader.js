import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UI_CONFIG, TIMEOUT_CONFIG } from '../../config/constants.js';

/**
 * Componente de carga optimizado con manejo inteligente de timeouts
 * y detección de dispositivos de bajos recursos
 */
const OptimizedLoader = ({ 
  message = 'Cargando...', 
  timeout = TIMEOUT_CONFIG.LOADING_TIMEOUT,
  showProgress = false,
  minDisplayTime = 1000,
  onTimeout,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const startTimeRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const minDisplayTimeoutRef = useRef(null);

  // Detectar dispositivo de bajos recursos
  const isLowEndDevice = () => {
    return (
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      window.devicePixelRatio > 2
    );
  };

  // Versión simplificada para dispositivos de bajos recursos
  const renderSimpleLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );

  // Versión completa para dispositivos con buen rendimiento
  const renderFullLoader = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: UI_CONFIG.ANIMATION_DURATION.FAST / 1000 }}
      className="flex flex-col items-center justify-center space-y-6"
    >
      <div className="relative">
        <motion.div
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Punto central animado */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 0.8, 1] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            times: [0, 0.2, 0.8, 1]
          }}
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        </motion.div>
      </div>

      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-gray-600 font-medium">{message}</p>
        
        {showProgress && (
          <motion.div 
            className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </motion.div>

      {hasTimedOut && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className="text-yellow-600 text-sm">Esto está tardando más de lo normal...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Recargar página
          </button>
        </motion.div>
      )}
    </motion.div>
  );

  useEffect(() => {
    startTimeRef.current = Date.now();
    setIsVisible(true);

    // Simular progreso si está habilitado
    if (showProgress) {
      let currentProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 15, 90);
        setProgress(currentProgress);
      }, 300);
    }

    // Configurar timeout principal
    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
      setProgress(100);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    // Asegurar tiempo mínimo de visualización
    minDisplayTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, minDisplayTime);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minDisplayTimeoutRef.current) {
        clearTimeout(minDisplayTimeoutRef.current);
      }
    };
  }, [message, timeout, showProgress, minDisplayTime, onTimeout]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        {isLowEndDevice() ? renderSimpleLoader() : renderFullLoader()}
        
        {/* Información de depuración en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-xs text-gray-500 text-center space-y-1">
            <p>Tiempo transcurrido: {Math.floor((Date.now() - startTimeRef.current) / 1000)}s</p>
            <p>Dispositivo: {isLowEndDevice() ? 'Bajos recursos' : 'Buen rendimiento'}</p>
            <p>Timeout: {timeout}ms</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook personalizado para manejar estados de carga optimizados
 */
export  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [startTime, setStartTime] = useState(null);
  const timeoutRef = useRef(null);

  const startLoading = (message = 'Cargando...') => {
    setLoading(true);
    setLoadingMessage(message);
    setStartTime(Date.now());
  };

  const stopLoading = () => {
    setLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const setLoadingWithTimeout = (message, timeoutMs = TIMEOUT_CONFIG.LOADING_TIMEOUT) => {
    startLoading(message);
    
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      console.warn(`Loading timeout after ${timeoutMs}ms: ${message}`);
    }, timeoutMs);
  };

  const getLoadingDuration = () => {
    return startTime ? Date.now() - startTime : 0;
  };

  return {
    loading,
    loadingMessage,
    startLoading,
    stopLoading,
    setLoadingWithTimeout,
    getLoadingDuration
  };
};

export default OptimizedLoader;