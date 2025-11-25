import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  GlobeAltIcon, 
  PaintBrushIcon, 
  BellIcon,
  ClockIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import configurationService from '../../services/configurationService.js';
import { useI18n } from '../../hooks/useI18n.js';
import toast from 'react-hot-toast';

const GeneralSettings = () => {
  const { t, currentLanguage, changeLanguage, isInitialized } = useI18n();
  
  const [settings, setSettings] = useState({
    language: 'es',
    timezone: 'America/Santiago',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      desktop: false,
      sound: true
    },
    system: {
      autoSave: true,
      autoSaveInterval: 5,
      sessionTimeout: 30,
      enableAnalytics: true
    },
    appearance: {
      compactMode: false,
      showWelcomeMessage: true,
      enableAnimations: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Configuraciones por defecto
  const defaultSettings = {
    language: 'es',
    timezone: 'America/Santiago',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      desktop: false,
      sound: true
    },
    system: {
      autoSave: true,
      autoSaveInterval: 5,
      sessionTimeout: 30,
      enableAnalytics: true
    },
    appearance: {
      compactMode: false,
      showWelcomeMessage: true,
      enableAnimations: true
    }
  };

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    if (isInitialized) {
      loadSettings();
    }
  }, [isInitialized]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Cargar configuraciones específicas usando configurationService
      const [
        language,
        timezone,
        dateFormat,
        theme,
        notificationSettings,
        systemSettings,
        appearanceSettings
      ] = await Promise.all([
        configurationService.getConfig('general', 'language', 'global', null, 'es'),
        configurationService.getConfig('general', 'timezone', 'global', null, 'America/Santiago'),
        configurationService.getConfig('general', 'dateFormat', 'global', null, 'DD/MM/YYYY'),
        configurationService.getConfig('general', 'theme', 'global', null, 'light'),
        configurationService.getNotificationSettings(),
        configurationService.getConfig('general', 'system', 'global', null, defaultSettings.system),
        configurationService.getConfig('general', 'appearance', 'global', null, defaultSettings.appearance)
      ]);

      const loadedSettings = {
        language,
        timezone,
        dateFormat,
        theme,
        notifications: notificationSettings,
        system: systemSettings,
        appearance: appearanceSettings
      };

      setSettings(loadedSettings);
      setHasChanges(false);
      toast.success(t('status.settings.loaded'));
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(t('status.error.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (category, key, value) => {
    try {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [key]: value
        }
      };

      setSettings(newSettings);
      setHasChanges(true);

      // Guardar automáticamente en la base de datos
      await saveSetting(category, key, value);
      
      toast.success(t('status.settings.saved'));
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error(t('status.error.saving'));
    }
  };

  const handleDirectSettingChange = async (key, value) => {
    try {
      const newSettings = {
        ...settings,
        [key]: value
      };

      setSettings(newSettings);
      setHasChanges(true);

      // Si es cambio de idioma, aplicar inmediatamente Y guardar en Supabase
      if (key === 'language') {
        // Cambiar idioma inmediatamente
        const success = await changeLanguage(value);
        if (success) {
          // Guardar en Supabase para sincronización multi-dispositivo
          await saveSetting('general', key, value);
          toast.success(t('status.settings.saved'));
        } else {
          throw new Error('Failed to change language');
        }
      } else {
        // Guardar automáticamente en la base de datos
        await saveSetting('general', key, value);
        toast.success(t('status.settings.saved'));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error(t('status.error.saving'));
    }
  };

  const saveSetting = async (category, key, value) => {
    try {
      await configurationService.setConfig(
        category === 'general' ? 'general' : 'general',
        key,
        value,
        'global',
        null,
        `Configuración de ${key} actualizada`
      );
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Guardar todas las configuraciones
      const savePromises = [
        configurationService.setConfig('general', 'language', settings.language, 'global', null, 'Idioma de la aplicación'),
        configurationService.setConfig('general', 'timezone', settings.timezone, 'global', null, 'Zona horaria'),
        configurationService.setConfig('general', 'dateFormat', settings.dateFormat, 'global', null, 'Formato de fecha'),
        configurationService.setConfig('general', 'theme', settings.theme, 'global', null, 'Tema de la aplicación'),
        configurationService.setNotificationSettings(settings.notifications),
        configurationService.setConfig('general', 'system', settings.system, 'global', null, 'Configuración del sistema'),
        configurationService.setConfig('general', 'appearance', settings.appearance, 'global', null, 'Configuración de apariencia')
      ];

      await Promise.all(savePromises);
      
      setHasChanges(false);
      toast.success(t('status.all.saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('status.error.saving'));
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm(t('confirm.reset.settings'))) {
      try {
        setSaving(true);
        
        // Resetear a valores por defecto
        setSettings(defaultSettings);
        setHasChanges(true);

        // Guardar todas las configuraciones por defecto
        const resetPromises = [
          configurationService.setConfig('general', 'language', defaultSettings.language, 'global', null, 'Idioma reseteado'),
          configurationService.setConfig('general', 'timezone', defaultSettings.timezone, 'global', null, 'Zona horaria reseteada'),
          configurationService.setConfig('general', 'dateFormat', defaultSettings.dateFormat, 'global', null, 'Formato de fecha reseteado'),
          configurationService.setConfig('general', 'theme', defaultSettings.theme, 'global', null, 'Tema reseteado'),
          configurationService.setNotificationSettings(defaultSettings.notifications),
          configurationService.setConfig('general', 'system', defaultSettings.system, 'global', null, 'Configuración del sistema reseteada'),
          configurationService.setConfig('general', 'appearance', defaultSettings.appearance, 'global', null, 'Configuración de apariencia reseteada')
        ];

        await Promise.all(resetPromises);
        
        setHasChanges(false);
        toast.success(t('status.settings.reset'));
      } catch (error) {
        console.error('Error resetting settings:', error);
        toast.error(t('status.error.resetting'));
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">{t('status.loading.settings')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('general.settings.title')}</h2>
        <p className="text-lg text-gray-600">
          {t('general.settings.subtitle')}
        </p>
        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {t('general.settings.unsaved.changes')}
            </p>
          </div>
        )}
      </div>

      {/* Configuración de Idioma y Región */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <GlobeAltIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">{t('language.region.title')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <LanguageIcon className="h-4 w-4 inline mr-1" />
              {t('language.label')}
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleDirectSettingChange('language', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="es">{t('language.spanish')}</option>
              <option value="en">{t('language.english')}</option>
              <option value="pt">{t('language.portuguese')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              {t('timezone.label')}
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleDirectSettingChange('timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="America/Santiago">{t('timezone.santiago')}</option>
              <option value="America/Mexico_City">{t('timezone.mexico')}</option>
              <option value="America/Bogota">{t('timezone.bogota')}</option>
              <option value="America/Argentina/Buenos_Aires">{t('timezone.buenos.aires')}</option>
              <option value="UTC">{t('timezone.utc')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('date.format.label')}
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleDirectSettingChange('dateFormat', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DD/MM/YYYY">{t('date.format.dd.mm.yyyy')}</option>
              <option value="MM/DD/YYYY">{t('date.format.mm.dd.yyyy')}</option>
              <option value="YYYY-MM-DD">{t('date.format.yyyy.mm.dd')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PaintBrushIcon className="h-4 w-4 inline mr-1" />
              {t('theme.label')}
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleDirectSettingChange('theme', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">{t('theme.light')}</option>
              <option value="dark">{t('theme.dark')}</option>
              <option value="auto">{t('theme.auto')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configuración de Notificaciones */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <BellIcon className="h-8 w-8 text-green-600 mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">{t('notifications.title')}</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('notifications.email')}</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.push}
              onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('notifications.push')}</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.desktop}
              onChange={(e) => handleSettingChange('notifications', 'desktop', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('notifications.desktop')}</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications.sound}
              onChange={(e) => handleSettingChange('notifications', 'sound', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('notifications.sound')}</span>
          </label>
        </div>
      </div>

      {/* Configuración del Sistema */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <Cog6ToothIcon className="h-8 w-8 text-purple-600 mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">{t('system.title')}</h3>
        </div>

        <div className="space-y-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.system.autoSave}
              onChange={(e) => handleSettingChange('system', 'autoSave', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('system.auto.save')}</span>
          </label>

          {settings.system.autoSave && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('system.auto.save.interval')}
              </label>
              <select
                value={settings.system.autoSaveInterval}
                onChange={(e) => handleSettingChange('system', 'autoSaveInterval', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>{t('system.auto.save.1.minute')}</option>
                <option value={5}>{t('system.auto.save.5.minutes')}</option>
                <option value={10}>{t('system.auto.save.10.minutes')}</option>
                <option value={15}>{t('system.auto.save.15.minutes')}</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('system.session.timeout')}
            </label>
            <select
              value={settings.system.sessionTimeout}
              onChange={(e) => handleSettingChange('system', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>{t('system.session.15.minutes')}</option>
              <option value={30}>{t('system.session.30.minutes')}</option>
              <option value={60}>{t('system.session.1.hour')}</option>
              <option value={120}>{t('system.session.2.hours')}</option>
              <option value={0}>{t('system.session.never')}</option>
            </select>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.system.enableAnalytics}
              onChange={(e) => handleSettingChange('system', 'enableAnalytics', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('system.enable.analytics')}</span>
          </label>
        </div>
      </div>

      {/* Configuración de Apariencia */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center mb-6">
          <PaintBrushIcon className="h-8 w-8 text-pink-600 mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">{t('appearance.title')}</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.appearance.compactMode}
              onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('appearance.compact.mode')}</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.appearance.showWelcomeMessage}
              onChange={(e) => handleSettingChange('appearance', 'showWelcomeMessage', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('appearance.welcome.message')}</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.appearance.enableAnimations}
              onChange={(e) => handleSettingChange('appearance', 'enableAnimations', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('appearance.enable.animations')}</span>
          </label>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-between space-x-4">
        <button
          onClick={resetSettings}
          disabled={saving}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {saving ? t('general.settings.resetting') : t('general.settings.reset.button')}
        </button>
        
        <button
          onClick={saveSettings}
          disabled={saving || !hasChanges}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t('general.settings.saving') : hasChanges ? t('general.settings.save.button') : t('general.settings.no.changes')}
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;