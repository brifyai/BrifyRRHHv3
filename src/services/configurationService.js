import { supabase } from '../lib/supabaseClient.js';

/**
 * SERVICIO DE CONFIGURACIÓN CENTRALIZADO
 *
 * Este servicio reemplaza el uso excesivo de localStorage
 * migrando todas las configuraciones críticas a Supabase.
 *
 * Arquitectura:
 * - localStorage: Cache temporal y respaldo
 * - Supabase: Almacenamiento principal y persistente
 * - Sincronización automática entre ambas fuentes
 */

class ConfigurationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos de cache
    this.syncInProgress = false;
  }

  // ========================================
  // MÉTODOS PRINCIPALES DE CONFIGURACIÓN
  // ========================================

  /**
   * Obtiene una configuración con fallback a localStorage
   */
  async getConfig(category, key, scope = 'global', companyId = null, defaultValue = null) {
    try {
      // Intentar obtener de cache primero
      const cacheKey = this._getCacheKey(category, key, scope, companyId);
      const cached = this._getFromCache(cacheKey);
      if (cached !== null) return cached;

      // Intentar obtener de Supabase
      const dbConfig = await this._getFromDatabase(category, key, scope, companyId);
      if (dbConfig !== null) {
        this._setCache(cacheKey, dbConfig);
        return dbConfig;
      }

      // Fallback a localStorage
      const localConfig = this._getFromLocalStorage(category, key, scope, companyId);
      if (localConfig !== null) {
        // Migrar automáticamente a Supabase en background
        this._migrateToDatabase(category, key, scope, companyId, localConfig).catch(console.warn);
        this._setCache(cacheKey, localConfig);
        return localConfig;
      }

      // Retornar valor por defecto
      return defaultValue;
    } catch (error) {
      console.error(`Error obteniendo configuración ${category}.${key}:`, error);
      // Fallback final a localStorage
      return this._getFromLocalStorage(category, key, scope, companyId) || defaultValue;
    }
  }

  /**
   * Guarda una configuración
   */
  async setConfig(category, key, value, scope = 'global', companyId = null, description = null) {
    try {
      // Validar parámetros
      if (!this._isValidCategory(category)) {
        throw new Error(`Categoría inválida: ${category}`);
      }

      // Guardar en Supabase
      await this._saveToDatabase(category, key, value, scope, companyId, description);

      // Actualizar cache
      const cacheKey = this._getCacheKey(category, key, scope, companyId);
      this._setCache(cacheKey, value);

      // Sincronizar con localStorage como respaldo
      this._saveToLocalStorage(category, key, scope, companyId, value);

      return true;
    } catch (error) {
      console.error(`Error guardando configuración ${category}.${key}:`, error);
      // Fallback: guardar solo en localStorage
      this._saveToLocalStorage(category, key, scope, companyId, value);
      return false;
    }
  }

  /**
   * Elimina una configuración
   */
  async deleteConfig(category, key, scope = 'global', companyId = null) {
    try {
      // Eliminar de Supabase
      await this._deleteFromDatabase(category, key, scope, companyId);

      // Limpiar cache
      const cacheKey = this._getCacheKey(category, key, scope, companyId);
      this.cache.delete(cacheKey);

      // Eliminar de localStorage
      this._deleteFromLocalStorage(category, key, scope, companyId);

      return true;
    } catch (error) {
      console.error(`Error eliminando configuración ${category}.${key}:`, error);
      // Fallback: eliminar solo de localStorage
      this._deleteFromLocalStorage(category, key, scope, companyId);
      return false;
    }
  }

  // ========================================
  // MÉTODOS DE INTEGRACIONES ESPECÍFICAS
  // ========================================

  /**
   * Obtiene configuración de Brevo
   */
  async getBrevoConfig() {
    return await this.getConfig('integrations', 'brevo', 'global', null, {
      apiKey: '',
      smsSender: '',
      emailSender: '',
      emailName: '',
      testMode: true
    });
  }

  /**
   * Guarda configuración de Brevo
   */
  async setBrevoConfig(config) {
    return await this.setConfig('integrations', 'brevo', config, 'global', null,
      'Configuración del servicio de email y SMS Brevo');
  }

  /**
   * Obtiene configuración de WhatsApp
   */
  async getWhatsAppConfig() {
    return await this.getConfig('integrations', 'whatsapp', 'global', null, {
      accessToken: '',
      phoneNumberId: '',
      webhookVerifyToken: '',
      testMode: true
    });
  }

  /**
   * Guarda configuración de WhatsApp
   */
  async setWhatsAppConfig(config) {
    return await this.setConfig('integrations', 'whatsapp', config, 'global', null,
      'Configuración del servicio de WhatsApp Business API');
  }

  /**
   * Obtiene configuración de Groq AI
   */
  async getGroqConfig() {
    return await this.getConfig('integrations', 'groq', 'global', null, {
      apiKey: '',
      model: 'gemma2-9b-it',
      temperature: 0.7,
      maxTokens: 2000
    });
  }

  /**
   * Guarda configuración de Groq AI
   */
  async setGroqConfig(config) {
    return await this.setConfig('integrations', 'groq', config, 'global', null,
      'Configuración del servicio de IA Groq');
  }

  /**
   * Obtiene configuración de Telegram
   */
  async getTelegramConfig() {
    return await this.getConfig('integrations', 'telegram', 'global', null, {
      botToken: '',
      botUsername: '',
      testMode: true
    });
  }

  /**
   * Guarda configuración de Telegram
   */
  async setTelegramConfig(config) {
    return await this.setConfig('integrations', 'telegram', config, 'global', null,
      'Configuración del bot de Telegram');
  }

  // ========================================
  // MÉTODOS DE BACKUP
  // ========================================

  /**
   * Obtiene configuración de backup
   */
  async getBackupSettings() {
    return await this.getConfig('backup', 'settings', 'global', null, {
      autoBackup: true,
      backupFrequency: 'weekly',
      retentionDays: 30,
      lastBackup: null,
      backupSize: null
    });
  }

  /**
   * Guarda configuración de backup
   */
  async setBackupSettings(settings) {
    return await this.setConfig('backup', 'settings', settings, 'global', null,
      'Configuración de backup del sistema');
  }

  // ========================================
  // MÉTODOS DE NOTIFICACIONES
  // ========================================

  /**
   * Obtiene configuración de notificaciones
   */
  async getNotificationSettings() {
    return await this.getConfig('notifications', 'settings', 'global', null, {
      email: {
        messagesSent: true,
        systemErrors: true,
        weeklyReports: false,
        tokenLimits: true
      },
      push: {
        failedMessages: true,
        newContacts: false,
        integrations: true,
        maintenance: false
      },
      reports: {
        frequency: 'weekly',
        recipients: [],
        includeCharts: true
      },
      sound: {
        enabled: true,
        volume: 70,
        silent: false
      }
    });
  }

  /**
   * Guarda configuración de notificaciones
   */
  async setNotificationSettings(settings) {
    return await this.setConfig('notifications', 'settings', settings, 'global', null,
      'Configuración de notificaciones del sistema');
  }

  // ========================================
  // MÉTODOS DE SEGURIDAD
  // ========================================

  /**
   * Obtiene configuración de seguridad
   */
  async getSecuritySettings() {
    return await this.getConfig('security', 'settings', 'global', null, {
      twoFactorEnabled: false,
      twoFactorMethod: 'app',
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5,
      lockoutDuration: 15,
      ipWhitelist: [],
      requireStrongPassword: true,
      auditLogEnabled: true
    });
  }

  /**
   * Guarda configuración de seguridad
   */
  async setSecuritySettings(settings) {
    return await this.setConfig('security', 'settings', settings, 'global', null,
      'Configuración de seguridad del sistema');
  }

  // ========================================
  // MÉTODOS DE DASHBOARD
  // ========================================

  /**
   * Obtiene configuración del dashboard
   */
  async getDashboardSettings() {
    return await this.getConfig('dashboard', 'settings', 'global', null, {
      theme: 'light',
      compactMode: false,
      widgetsOrder: ['companies', 'employees', 'communications', 'storage'],
      refreshInterval: 30000
    });
  }

  /**
   * Guarda configuración del dashboard
   */
  async setDashboardSettings(settings) {
    return await this.setConfig('dashboard', 'settings', settings, 'global', null,
      'Configuración del dashboard');
  }

  // ========================================
  // MÉTODOS DE MIGRACIÓN
  // ========================================

  /**
   * Migra todas las configuraciones de localStorage a Supabase
   */
  async migrateAllFromLocalStorage() {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      console.log('🚀 Iniciando migración de localStorage a Supabase...');

      const migrations = [
        // Integraciones
        this._migrateLocalStorageItem('brevo_api_key', 'integrations', 'brevo_api_key'),
        this._migrateLocalStorageItem('brevo_sms_sender', 'integrations', 'brevo_sms_sender'),
        this._migrateLocalStorageItem('brevo_email_sender', 'integrations', 'brevo_email_sender'),
        this._migrateLocalStorageItem('brevo_email_name', 'integrations', 'brevo_email_name'),
        this._migrateLocalStorageItem('brevo_test_mode', 'integrations', 'brevo_test_mode'),

        this._migrateLocalStorageItem('whatsapp_access_token', 'integrations', 'whatsapp_access_token'),
        this._migrateLocalStorageItem('whatsapp_phone_number_id', 'integrations', 'whatsapp_phone_number_id'),
        this._migrateLocalStorageItem('whatsapp_webhook_verify_token', 'integrations', 'whatsapp_webhook_verify_token'),
        this._migrateLocalStorageItem('whatsapp_test_mode', 'integrations', 'whatsapp_test_mode'),

        this._migrateLocalStorageItem('telegram_bot_token', 'integrations', 'telegram_bot_token'),
        this._migrateLocalStorageItem('telegram_bot_username', 'integrations', 'telegram_bot_username'),

        // Notificaciones
        this._migrateLocalStorageItem('notificationSettings', 'notifications', 'settings'),

        // Seguridad
        this._migrateLocalStorageItem('securitySettings', 'security', 'settings'),

        // Dashboard
        this._migrateLocalStorageItem('dashboardSettings', 'dashboard', 'settings'),

        // Backup
        this._migrateLocalStorageItem('backupSettings', 'backup', 'settings'),

        // Jerarquía de configuración
// Jerarquía de configuración
        this._migrateLocalStorageItem('hierarchyMode', 'general', 'hierarchy_mode'),
        this._migrateLocalStorageItem('hierarchyMode', 'system', 'hierarchy_mode'),
      ];

      await Promise.all(migrations);

      console.log('✅ Migración completada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error en migración:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  _getCacheKey(category, key, scope, companyId) {
    return `${category}_${key}_${scope}_${companyId || 'global'}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }

  _setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  async _getFromDatabase(category, key, scope, companyId) {
    try {
      let query = supabase
        .from('system_configurations')
        .select('config_value')
        .eq('category', category)
        .eq('config_key', key)
        .eq('scope', scope)
        .eq('is_active', true);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data?.config_value || null;
    } catch (error) {
      console.warn(`Error obteniendo de BD ${category}.${key}:`, error.message);
      return null;
    }
  }

  async _saveToDatabase(category, key, value, scope, companyId, description) {
    try {
      // Obtener usuario actual usando la nueva API de Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('Error obteniendo usuario:', authError);
      }

      const { data, error } = await supabase
        .from('system_configurations')
        .upsert({
          user_id: user?.id || null,
          scope,
          company_id: companyId,
          category,
          config_key: key,
          config_value: value,
          description,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,scope,company_id,category,config_key'
        })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error guardando en BD ${category}.${key}:`, error);
      throw error;
    }
  }

  async _deleteFromDatabase(category, key, scope, companyId) {
    let query = supabase
      .from('system_configurations')
      .update({ is_active: false })
      .eq('category', category)
      .eq('config_key', key)
      .eq('scope', scope);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else {
      query = query.is('company_id', null);
    }

    const { error } = await query;
    if (error) throw error;
  }

  _getFromLocalStorage(category, key, scope, companyId) {
    try {
      const storageKey = this._getStorageKey(category, key, scope, companyId);
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Error leyendo localStorage ${category}.${key}:`, error);
      return null;
    }
  }

  _saveToLocalStorage(category, key, scope, companyId, value) {
    try {
      const storageKey = this._getStorageKey(category, key, scope, companyId);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error guardando en localStorage ${category}.${key}:`, error);
    }
  }

  _deleteFromLocalStorage(category, key, scope, companyId) {
    try {
      const storageKey = this._getStorageKey(category, key, scope, companyId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Error eliminando de localStorage ${category}.${key}:`, error);
    }
  }

  _getStorageKey(category, key, scope, companyId) {
    const prefix = companyId ? `company_${companyId}_` : '';
    return `${prefix}${category}_${key}`;
  }

  async _migrateToDatabase(category, key, scope, companyId, value) {
    try {
      await this._saveToDatabase(category, key, value, scope, companyId,
        `Migrado automáticamente desde localStorage`);
    } catch (error) {
      console.warn(`Error migrando ${category}.${key} a BD:`, error);
    }
  }

  async _migrateLocalStorageItem(storageKey, category, configKey) {
    try {
      const value = localStorage.getItem(storageKey);
      if (value) {
        const parsedValue = JSON.parse(value);
        await this.setConfig(category, configKey, parsedValue, 'global', null,
          `Migrado desde localStorage: ${storageKey}`);
        console.log(`✅ Migrado: ${storageKey} → ${category}.${configKey}`);
      }
    } catch (error) {
      console.warn(`Error migrando ${storageKey}:`, error);
    }
  }

  _isValidCategory(category) {
    const validCategories = [
      'integrations', 'notifications', 'security', 'dashboard',
      'communication', 'appearance', 'performance', 'backup', 'system'
    ];
    return validCategories.includes(category);
  }

  // ========================================
  // MÉTODOS DE LIMPIEZA
  // ========================================

  /**
   * Limpia la cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      syncInProgress: this.syncInProgress
    };
  }
}

// Exportar instancia única
const configurationService = new ConfigurationService();
export default configurationService;