// Sistema de Internacionalización (i18n) para BrifyRRHH
// Soporte para múltiples idiomas con traducciones dinámicas

class I18nService {
  constructor() {
    this.currentLanguage = 'es';
    this.translations = {};
    this.listeners = [];
    this.initialized = false;
  }

  // Inicializar el servicio
  async init() {
    try {
      // Cargar idioma guardado desde localStorage o usar español por defecto
      const savedLanguage = localStorage.getItem('brify-language') || 'es';
      await this.setLanguage(savedLanguage);
      this.initialized = true;
      console.log('🌐 I18nService: Inicializado con idioma:', savedLanguage);
    } catch (error) {
      console.error('Error inicializando i18n:', error);
      // Fallback a español
      this.currentLanguage = 'es';
    }
  }

  // Traducciones por defecto
  getDefaultTranslations() {
    return {
      es: {
        // Configuración General
        'general.settings.title': 'Configuración General',
        'general.settings.subtitle': 'Personaliza la experiencia general de la aplicación',
        'general.settings.unsaved.changes': '⚠️ Tienes cambios sin guardar. Haz click en "Guardar Configuraciones" para persistir los cambios.',
        'general.settings.saving': 'Guardando...',
        'general.settings.resetting': 'Reseteando...',
        'general.settings.reset.button': 'Resetear Configuraciones',
        'general.settings.save.button': 'Guardar Configuraciones',
        'general.settings.no.changes': 'Sin Cambios',

        // Idioma y Región
        'language.region.title': 'Idioma y Región',
        'language.label': 'Idioma',
        'timezone.label': 'Zona Horaria',
        'date.format.label': 'Formato de Fecha',
        'theme.label': 'Tema',
        'language.spanish': 'Español',
        'language.english': 'English',
        'language.portuguese': 'Português',
        'timezone.santiago': 'Santiago (UTC-3)',
        'timezone.mexico': 'Ciudad de México (UTC-6)',
        'timezone.bogota': 'Bogotá (UTC-5)',
        'timezone.buenos.aires': 'Buenos Aires (UTC-3)',
        'timezone.utc': 'UTC (UTC+0)',
        'date.format.dd.mm.yyyy': 'DD/MM/YYYY',
        'date.format.mm.dd.yyyy': 'MM/DD/YYYY',
        'date.format.yyyy.mm.dd': 'YYYY-MM-DD',
        'theme.light': 'Claro',
        'theme.dark': 'Oscuro',
        'theme.auto': 'Automático',

        // Notificaciones
        'notifications.title': 'Notificaciones',
        'notifications.email': 'Notificaciones por Email',
        'notifications.push': 'Notificaciones Push',
        'notifications.desktop': 'Notificaciones de Escritorio',
        'notifications.sound': 'Sonidos de Notificación',

        // Sistema
        'system.title': 'Sistema',
        'system.auto.save': 'Guardado Automático',
        'system.auto.save.interval': 'Intervalo de Guardado (minutos)',
        'system.session.timeout': 'Timeout de Sesión (minutos)',
        'system.enable.analytics': 'Habilitar Analytics',
        'system.auto.save.1.minute': '1 minuto',
        'system.auto.save.5.minutes': '5 minutos',
        'system.auto.save.10.minutes': '10 minutos',
        'system.auto.save.15.minutes': '15 minutos',
        'system.session.15.minutes': '15 minutos',
        'system.session.30.minutes': '30 minutos',
        'system.session.1.hour': '1 hora',
        'system.session.2.hours': '2 horas',
        'system.session.never': 'Nunca',

        // Apariencia
        'appearance.title': 'Apariencia',
        'appearance.compact.mode': 'Modo Compacto',
        'appearance.welcome.message': 'Mostrar Mensaje de Bienvenida',
        'appearance.enable.animations': 'Habilitar Animaciones',

        // Mensajes de estado
        'status.loading.settings': 'Cargando configuraciones...',
        'status.settings.loaded': 'Configuraciones cargadas exitosamente',
        'status.settings.saved': 'Configuración guardada automáticamente',
        'status.settings.reset': 'Configuraciones reseteadas a valores por defecto',
        'status.all.saved': 'Todas las configuraciones guardadas exitosamente',
        'status.error.loading': 'Error al cargar las configuraciones',
        'status.error.saving': 'Error al guardar la configuración',
        'status.error.resetting': 'Error al resetear las configuraciones',

        // Confirmaciones
        'confirm.reset.settings': '¿Estás seguro de que quieres resetear todas las configuraciones a los valores por defecto?'
      },
      en: {
        // General Settings
        'general.settings.title': 'General Settings',
        'general.settings.subtitle': 'Customize the general application experience',
        'general.settings.unsaved.changes': '⚠️ You have unsaved changes. Click "Save Settings" to persist changes.',
        'general.settings.saving': 'Saving...',
        'general.settings.resetting': 'Resetting...',
        'general.settings.reset.button': 'Reset Settings',
        'general.settings.save.button': 'Save Settings',
        'general.settings.no.changes': 'No Changes',

        // Language and Region
        'language.region.title': 'Language and Region',
        'language.label': 'Language',
        'timezone.label': 'Time Zone',
        'date.format.label': 'Date Format',
        'theme.label': 'Theme',
        'language.spanish': 'Spanish',
        'language.english': 'English',
        'language.portuguese': 'Portuguese',
        'timezone.santiago': 'Santiago (UTC-3)',
        'timezone.mexico': 'Mexico City (UTC-6)',
        'timezone.bogota': 'Bogotá (UTC-5)',
        'timezone.buenos.aires': 'Buenos Aires (UTC-3)',
        'timezone.utc': 'UTC (UTC+0)',
        'date.format.dd.mm.yyyy': 'DD/MM/YYYY',
        'date.format.mm.dd.yyyy': 'MM/DD/YYYY',
        'date.format.yyyy.mm.dd': 'YYYY-MM-DD',
        'theme.light': 'Light',
        'theme.dark': 'Dark',
        'theme.auto': 'Auto',

        // Notifications
        'notifications.title': 'Notifications',
        'notifications.email': 'Email Notifications',
        'notifications.push': 'Push Notifications',
        'notifications.desktop': 'Desktop Notifications',
        'notifications.sound': 'Notification Sounds',

        // System
        'system.title': 'System',
        'system.auto.save': 'Auto Save',
        'system.auto.save.interval': 'Auto Save Interval (minutes)',
        'system.session.timeout': 'Session Timeout (minutes)',
        'system.enable.analytics': 'Enable Analytics',
        'system.auto.save.1.minute': '1 minute',
        'system.auto.save.5.minutes': '5 minutes',
        'system.auto.save.10.minutes': '10 minutes',
        'system.auto.save.15.minutes': '15 minutes',
        'system.session.15.minutes': '15 minutes',
        'system.session.30.minutes': '30 minutes',
        'system.session.1.hour': '1 hour',
        'system.session.2.hours': '2 hours',
        'system.session.never': 'Never',

        // Appearance
        'appearance.title': 'Appearance',
        'appearance.compact.mode': 'Compact Mode',
        'appearance.welcome.message': 'Show Welcome Message',
        'appearance.enable.animations': 'Enable Animations',

        // Status messages
        'status.loading.settings': 'Loading settings...',
        'status.settings.loaded': 'Settings loaded successfully',
        'status.settings.saved': 'Setting saved automatically',
        'status.settings.reset': 'Settings reset to default values',
        'status.all.saved': 'All settings saved successfully',
        'status.error.loading': 'Error loading settings',
        'status.error.saving': 'Error saving setting',
        'status.error.resetting': 'Error resetting settings',

        // Confirmations
        'confirm.reset.settings': 'Are you sure you want to reset all settings to default values?'
      },
      pt: {
        // Configurações Gerais
        'general.settings.title': 'Configurações Gerais',
        'general.settings.subtitle': 'Personalize a experiência geral da aplicação',
        'general.settings.unsaved.changes': '⚠️ Você tem alterações não salvas. Clique em "Salvar Configurações" para persistir as alterações.',
        'general.settings.saving': 'Salvando...',
        'general.settings.resetting': 'Redefinindo...',
        'general.settings.reset.button': 'Redefinir Configurações',
        'general.settings.save.button': 'Salvar Configurações',
        'general.settings.no.changes': 'Sem Alterações',

        // Idioma e Região
        'language.region.title': 'Idioma e Região',
        'language.label': 'Idioma',
        'timezone.label': 'Fuso Horário',
        'date.format.label': 'Formato de Data',
        'theme.label': 'Tema',
        'language.spanish': 'Espanhol',
        'language.english': 'Inglês',
        'language.portuguese': 'Português',
        'timezone.santiago': 'Santiago (UTC-3)',
        'timezone.mexico': 'Cidade do México (UTC-6)',
        'timezone.bogota': 'Bogotá (UTC-5)',
        'timezone.buenos.aires': 'Buenos Aires (UTC-3)',
        'timezone.utc': 'UTC (UTC+0)',
        'date.format.dd.mm.yyyy': 'DD/MM/YYYY',
        'date.format.mm.dd.yyyy': 'MM/DD/YYYY',
        'date.format.yyyy.mm.dd': 'YYYY-MM-DD',
        'theme.light': 'Claro',
        'theme.dark': 'Escuro',
        'theme.auto': 'Automático',

        // Notificações
        'notifications.title': 'Notificações',
        'notifications.email': 'Notificações por Email',
        'notifications.push': 'Notificações Push',
        'notifications.desktop': 'Notificações de Área de Trabalho',
        'notifications.sound': 'Sons de Notificação',

        // Sistema
        'system.title': 'Sistema',
        'system.auto.save': 'Salvamento Automático',
        'system.auto.save.interval': 'Intervalo de Salvamento (minutos)',
        'system.session.timeout': 'Timeout de Sessão (minutos)',
        'system.enable.analytics': 'Habilitar Analytics',
        'system.auto.save.1.minute': '1 minuto',
        'system.auto.save.5.minutes': '5 minutos',
        'system.auto.save.10.minutes': '10 minutos',
        'system.auto.save.15.minutes': '15 minutos',
        'system.session.15.minutes': '15 minutos',
        'system.session.30.minutes': '30 minutos',
        'system.session.1.hour': '1 hora',
        'system.session.2.hours': '2 horas',
        'system.session.never': 'Nunca',

        // Aparência
        'appearance.title': 'Aparência',
        'appearance.compact.mode': 'Modo Compacto',
        'appearance.welcome.message': 'Mostrar Mensagem de Boas-vindas',
        'appearance.enable.animations': 'Habilitar Animações',

        // Mensagens de status
        'status.loading.settings': 'Carregando configurações...',
        'status.settings.loaded': 'Configurações carregadas com sucesso',
        'status.settings.saved': 'Configuração salva automaticamente',
        'status.settings.reset': 'Configurações redefinidas para valores padrão',
        'status.all.saved': 'Todas as configurações salvas com sucesso',
        'status.error.loading': 'Erro ao carregar configurações',
        'status.error.saving': 'Erro ao salvar configuração',
        'status.error.resetting': 'Erro ao redefinir configurações',

        // Confirmações
        'confirm.reset.settings': 'Tem certeza de que deseja redefinir todas as configurações para os valores padrão?'
      }
    };
  }

  // Cambiar idioma
  async setLanguage(language) {
    try {
      console.log(`🌐 Cambiando idioma a: ${language}`);
      
      this.currentLanguage = language;
      
      // Cargar traducciones
      const defaultTranslations = this.getDefaultTranslations();
      this.translations = defaultTranslations[language] || defaultTranslations.es;
      
      // Guardar en localStorage
      localStorage.setItem('brify-language', language);
      
      // Actualizar atributo lang del documento
      document.documentElement.lang = language;
      
      // Notificar a los listeners
      this.notifyListeners();
      
      console.log(`✅ Idioma cambiado a: ${language}`);
    } catch (error) {
      console.error('Error cambiando idioma:', error);
      throw error;
    }
  }

  // Obtener traducción
  t(key, defaultValue = null) {
    const translation = this.translations[key];
    if (translation) {
      return translation;
    }
    
    // Si no se encuentra la traducción, devolver la clave o el valor por defecto
    return defaultValue || key;
  }

  // Obtener idioma actual
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Registrar listener para cambios de idioma
  onLanguageChange(callback) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar a todos los listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('Error en listener de cambio de idioma:', error);
      }
    });
  }

  // Obtener idiomas disponibles
  getAvailableLanguages() {
    return [
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' }
    ];
  }

  // Formatear fecha según configuración
  formatDate(date, dateFormat = null) {
    const format = dateFormat || this.getDateFormat();
    const d = new Date(date);
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  // Obtener formato de fecha desde configuración
  getDateFormat() {
    // Esta función debería obtener el formato desde la configuración
    // Por ahora retornamos el formato por defecto
    return 'DD/MM/YYYY';
  }

  // Obtener zona horaria
  getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Formatear número según locale
  formatNumber(number) {
    return new Intl.NumberFormat(this.currentLanguage).format(number);
  }

  // Formatear moneda según locale
  formatCurrency(amount, currency = 'CLP') {
    return new Intl.NumberFormat(this.currentLanguage, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

// Crear instancia singleton
const i18n = new I18nService();

export default i18n;