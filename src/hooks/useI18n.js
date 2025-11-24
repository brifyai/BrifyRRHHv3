// Hook personalizado para usar el servicio de internacionalización
import { useState, useEffect, useCallback } from 'react';
import i18n from '../lib/i18n.js';

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para obtener traducciones
  const t = useCallback((key, defaultValue = null) => {
    return i18n.t(key, defaultValue);
  }, []);

  // Función para cambiar idioma
  const changeLanguage = useCallback(async (language) => {
    try {
      await i18n.setLanguage(language);
      setCurrentLanguage(language);
      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  }, []);

  // Función para formatear fecha
  const formatDate = useCallback((date, dateFormat = null) => {
    return i18n.formatDate(date, dateFormat);
  }, []);

  // Función para formatear números
  const formatNumber = useCallback((number) => {
    return i18n.formatNumber(number);
  }, []);

  // Función para formatear moneda
  const formatCurrency = useCallback((amount, currency = 'CLP') => {
    return i18n.formatCurrency(amount, currency);
  }, []);

  // Obtener idiomas disponibles
  const getAvailableLanguages = useCallback(() => {
    return i18n.getAvailableLanguages();
  }, []);

  // Obtener zona horaria
  const getTimezone = useCallback(() => {
    return i18n.getTimezone();
  }, []);

  // Obtener formato de fecha
  const getDateFormat = useCallback(() => {
    return i18n.getDateFormat();
  }, []);

  // Inicializar el servicio
  useEffect(() => {
    const initializeI18n = async () => {
      if (!i18n.initialized) {
        await i18n.init();
      }
      setIsInitialized(true);
    };

    initializeI18n();
  }, []);

  // Escuchar cambios de idioma
  useEffect(() => {
    const handleLanguageChange = (newLanguage) => {
      setCurrentLanguage(newLanguage);
    };

    i18n.onLanguageChange(handleLanguageChange);

    return () => {
      i18n.removeListener(handleLanguageChange);
    };
  }, []);

  return {
    currentLanguage,
    isInitialized,
    t,
    changeLanguage,
    formatDate,
    formatNumber,
    formatCurrency,
    getAvailableLanguages,
    getTimezone,
    getDateFormat
  };
};

export default useI18n;