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
      {/* Spinner principal */}
      <div className="relative">
        <motion.div 
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Mensaje de carga */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg font-semibold text-gray-800 mb-2">{message}</p>
        {showProgress && (
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </motion.div>

      {/* Indicadores de estado */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex space-x-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );

  useEffect(() => {
    // Mostrar loader con un pequeño delay para evitar parpadeos
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      startTimeRef.current = Date.now();
    }, 100);

    // Configurar timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);
    }

    // Configurar progreso si está habilitado
    if (showProgress) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 100 ? 90 : newProgress; // Máximo 90% hasta completar
        });
      }, 200);
    }

    // Cleanup
    return () => {
      clearTimeout(showTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (minDisplayTimeoutRef.current) clearTimeout(minDisplayTimeoutRef.current);
    };
  }, [timeout, onTimeout, showProgress]);

  // No renderizar si no es visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
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
export const useOptimizedLoading = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
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