/**
 * Servicio de Cumplimiento de Políticas de WhatsApp Business
 * 
 * Este servicio asegura que StaffHub cumpla con las políticas actualizadas
 * de WhatsApp Business API (2024-2025)
 */

import { supabase } from '../lib/supabase.js';

class WhatsAppComplianceService {
  constructor() {
    this.consentCache = new Map();
    this.windowCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ========================================
  // GESTIÓN DE CONSENTIMIENTO
  // ========================================

  /**
   * Verificar si hay consentimiento activo para un usuario
   * @param {string} companyId - ID de la empresa
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<boolean>} Tiene consentimiento activo
   */
  async hasActiveConsent(companyId, phoneNumber) {
    const cacheKey = `consent_${companyId}_${phoneNumber}`;
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const { data, error } = await supabase
        .from('user_consent')
        .select('*')
        .eq('company_id', companyId)
        .eq('phone_number', this.formatPhoneNumber(phoneNumber))
        .eq('status', 'active')
        .single();

      if (error || !data) {
        this.setCache(cacheKey, false);
        return false;
      }

      // Verificar que el consentimiento no haya expirado
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      const isActive = data.status === 'active' && expiresAt > now;
      this.setCache(cacheKey, isActive);
      
      return isActive;

    } catch (error) {
      console.error('Error verificando consentimiento:', error);
      this.setCache(cacheKey, false);
      return false;
    }
  }

  /**
   * Registrar consentimiento de usuario
   * @param {string} companyId - ID de la empresa
   * @param {string} phoneNumber - Número de teléfono
   * @param {string} consentType - Tipo de consentimiento (marketing, utility, authentication)
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} Resultado del registro
   */
  async recordConsent(companyId, phoneNumber, consentType, metadata = {}) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 año

      const { data, error } = await supabase
        .from('user_consent')
        .upsert({
          company_id: companyId,
          phone_number: this.formatPhoneNumber(phoneNumber),
          consent_type: consentType,
          status: 'active',
          granted_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          metadata: {
            source: metadata.source || 'manual',
            ip_address: metadata.ipAddress,
            user_agent: metadata.userAgent,
            ...metadata
          },
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Limpiar cache
      this.clearCache(`consent_${companyId}_${phoneNumber}`);

      // Registrar evento de auditoría
      await this.logComplianceEvent({
        companyId,
        eventType: 'consent_granted',
        details: {
          phoneNumber,
          consentType,
          expiresAt: expiresAt.toISOString()
        }
      });

      return {
        success: true,
        consent: data,
        message: 'Consentimiento registrado exitosamente'
      };

    } catch (error) {
      console.error('Error registrando consentimiento:', error);
      return {
        success: false,
        message: `Error registrando consentimiento: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Revocar consentimiento de usuario (Opt-out)
   * @param {string} companyId - ID de la empresa
   * @param {string} phoneNumber - Número de teléfono
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} Resultado de la revocación
   */
  async revokeConsent(companyId, phoneNumber, metadata = {}) {
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from('user_consent')
        .update({
          status: 'revoked',
          revoked_at: now.toISOString(),
          metadata: {
            ...metadata,
            revoked_at: now.toISOString()
          }
        })
        .eq('company_id', companyId)
        .eq('phone_number', this.formatPhoneNumber(phoneNumber))
        .select()
        .single();

      if (error) throw error;

      // Limpiar cache
      this.clearCache(`consent_${companyId}_${phoneNumber}`);

      // Registrar evento de auditoría
      await this.logComplianceEvent({
        companyId,
        eventType: 'consent_revoked',
        details: {
          phoneNumber,
          revokedAt: now.toISOString()
        }
      });

      // Enviar confirmación de opt-out si está configurado
      await this.sendOptOutConfirmation(companyId, phoneNumber);

      return {
        success: true,
        consent: data,
        message: 'Consentimiento revocado exitosamente'
      };

    } catch (error) {
      console.error('Error revocando consentimiento:', error);
      return {
        success: false,
        message: `Error revocando consentimiento: ${error.message}`,
        error: error.message
      };
    }
  }

  // ========================================
  // VERIFICACIÓN DE VENTANA DE 24 HORAS
  // ========================================

  /**
   * Verificar si está dentro de la ventana de 24 horas
   * @param {string} companyId - ID de la empresa
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<Object>} Estado de la ventana
   */
  async check24HourWindow(companyId, phoneNumber) {
    const cacheKey = `window_${companyId}_${phoneNumber}`;
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const now = new Date();      // Buscar última interacción del usuario
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('created_at, direction, message_type')
        .eq('company_id', companyId)
        .eq('recipient_phone', this.formatPhoneNumber(phoneNumber))
        .in('direction', ['inbound', 'status_update'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        const result = {
          inWindow: false,
          lastInteraction: null,
          hoursSinceInteraction: null,
          requiresTemplate: true
        };
        this.setCache(cacheKey, result);
        return result;
      }

      const lastInteraction = new Date(data.created_at);
      const hoursSinceInteraction = (now - lastInteraction) / (1000 * 60 * 60);
      const inWindow = hoursSinceInteraction <= 24;

      const result = {
        inWindow,
        lastInteraction: data.created_at,
        hoursSinceInteraction: Math.round(hoursSinceInteraction * 100) / 100,
        requiresTemplate: !inWindow
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error verificando ventana de 24 horas:', error);
      const result = {
        inWindow: false,
        lastInteraction: null,
        hoursSinceInteraction: null,
        requiresTemplate: true,
        error: error.message
      };
      this.setCache(cacheKey, result);
      return result;
    }
  }

  /**
   * Registrar interacción del usuario (para mantener ventana activa)
   * @param {string} companyId - ID de la empresa
   * @param {string} phoneNumber - Número de teléfono
   * @param {string} interactionType - Tipo de interacción
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} Resultado del registro
   */
  async recordUserInteraction(companyId, phoneNumber, interactionType, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .insert({
          company_id: companyId,
          phone_number: this.formatPhoneNumber(phoneNumber),
          interaction_type: interactionType,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Limpiar cache de ventana
      this.clearCache(`window_${companyId}_${phoneNumber}`);

      return {
        success: true,
        interaction: data,
        message: 'Interacción registrada exitosamente'
      };

    } catch (error) {
      console.error('Error registrando interacción:', error);
      return {
        success: false,
        message: `Error registrando interacción: ${error.message}`,
        error: error.message
      };
    }
  }

  // ========================================
  // VALIDACIÓN DE CONTENIDO Y PLANTILLAS
  // ========================================

  /**
   * Validar contenido de mensaje según políticas de WhatsApp
   * @param {string} content - Contenido del mensaje
   * @param {string} messageType - Tipo de mensaje (text, template, media)
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateMessageContent(content, messageType = 'text') {
    try {
      // Lista de contenido prohibido
      const prohibitedContent = [
        'spam', 'scam', 'fraud', 'illegal', 'adult content',
        'gambling', 'alcohol', 'tobacco', 'weapons', 'drugs',
        'hate speech', 'violence', 'terrorism'
      ];

      const lowerContent = content.toLowerCase();

      // Verificar contenido prohibido
      for (const term of prohibitedContent) {
        if (lowerContent.includes(term)) {
          return {
            valid: false,
            reason: `Contenido prohibido detectado: ${term}`,
            severity: 'high',
            category: 'prohibited_content'
          };
        }
      }

      // Verificar características de spam
      const spamIndicators = [
        /\b(free|win|prize|lottery|congratulations|winner)\b/i,
        /\b(urgent|act now|limited time|offer expires)\b/i,
        /\b(click here|buy now|shop now)\b/i,
        /\+\d{1,3}.*\d{3,}.*\d{3,}.*\d{4}/, // Múltiples números de teléfono
        /([A-Z]{2,}){3,}/ // Exceso de mayúsculas
      ];

      let spamScore = 0;
      for (const indicator of spamIndicators) {
        if (indicator.test(content)) {
          spamScore++;
        }
      }

      if (spamScore >= 2) {
        return {
          valid: false,
          reason: 'Contenido detectado como posible spam',
          severity: 'medium',
          category: 'spam_indicators',
          spamScore
        };
      }

      // Validaciones específicas por tipo
      if (messageType === 'template') {
        return this.validateTemplateContent(content);
      }

      return {
        valid: true,
        message: 'Contenido validado exitosamente',
        spamScore: 0
      };

    } catch (error) {
      console.error('Error validando contenido:', error);
      return {
        valid: false,
        reason: `Error en validación: ${error.message}`,
        severity: 'low'
      };
    }
  }

  /**
   * Validar contenido de plantilla
   * @param {string} content - Contenido de la plantilla
   * @returns {Object} Resultado de la validación
   */
  validateTemplateContent(content) {
    // Validaciones específicas para plantillas
    const templateRules = {
      maxLength: 1024,
      requiredPlaceholders: ['{{1}}', '{{2}}'],
      prohibitedPhrases: ['unsubscribe', 'opt out', 'stop'],
      maxVariables: 10
    };

    if (content.length > templateRules.maxLength) {
      return {
        valid: false,
        reason: `Plantilla demasiado larga. Máximo ${templateRules.maxLength} caracteres`,
        severity: 'medium',
        category: 'template_length'
      };
    }

    // Verificar frases prohibidas en plantillas
    for (const phrase of templateRules.prohibitedPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        return {
          valid: false,
          reason: `Frase prohibida en plantilla: ${phrase}`,
          severity: 'high',
          category: 'template_content'
        };
      }
    }

    return {
      valid: true,
      message: 'Plantilla validada exitosamente'
    };
  }

  // ========================================
  // MONITOREO DE CALIDAD Y LÍMITES
  // ========================================

  /**
   * Verificar calidad del número y ajustar límites
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Estado de calidad y límites
   */
  async checkQualityAndLimits(companyId) {
    try {
      // Obtener configuración de WhatsApp
      const { data: config, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error || !config) {
        throw new Error('No hay configuración de WhatsApp activa');
      }

      // Calcular límites dinámicos basados en calidad
      let baseDailyLimit = 1000;
      let multiplier = 1;

      switch (config.quality_rating) {
        case 'GREEN':
          multiplier = 1.5;
          break;
        case 'YELLOW':
          multiplier = 0.7;
          break;
        case 'RED':
          multiplier = 0; // Bloquear envíos
          break;
        default:
          multiplier = 0.5;
      }

      // Ajustar por tasa de consentimiento
      const consentRate = await this.getConsentRate(companyId);
      multiplier *= consentRate;

      const dynamicLimits = {
        dailyLimit: Math.floor(baseDailyLimit * multiplier),
        monthlyLimit: Math.floor(baseDailyLimit * multiplier * 30),
        messagesPerSecond: config.quality_rating === 'GREEN' ? 10 : 5,
        canSend: config.quality_rating !== 'RED',
        qualityRating: config.quality_rating,
        consentRate
      };

      // Enviar alertas si es necesario
      if (config.quality_rating === 'RED') {
        await this.sendQualityAlert(companyId, 'CRITICAL', {
          message: 'Número en calificación ROJA. Todos los envíos suspendidos.',
          action: 'contact_support_immediately'
        });
      } else if (config.quality_rating === 'YELLOW') {
        await this.sendQualityAlert(companyId, 'WARNING', {
          message: 'Degradación de calidad detectada. Límites reducidos.',
          recommendations: [
            'Reducir mensajes de marketing',
            'Mejorar tiempo de respuesta',
            'Verificar contenido de mensajes'
          ]
        });
      }

      return {
        success: true,
        limits: dynamicLimits,
        config
      };

    } catch (error) {
      console.error('Error verificando calidad y límites:', error);
      return {
        success: false,
        message: `Error verificando calidad: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Obtener tasa de consentimiento de una empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<number>} Tasa de consentimiento (0-1)
   */
  async getConsentRate(companyId) {
    try {
      const { data: total, error: totalError } = await supabase
        .from('user_consent')
        .select('phone_number', { count: 'exact' })
        .eq('company_id', companyId);

      if (totalError) throw totalError;

      const { data: active, error: activeError } = await supabase
        .from('user_consent')
        .select('phone_number', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (activeError) throw activeError;

      const totalUsers = total || 0;
      const activeUsers = active || 0;

      return totalUsers > 0 ? activeUsers / totalUsers : 0;

    } catch (error) {
      console.error('Error calculando tasa de consentimiento:', error);
      return 0.5; // Valor por defecto conservador
    }
  }

  // ========================================
  // UTILIDADES Y AUDITORÍA
  // ========================================

  /**
   * Formatear número de teléfono
   * @param {string} phone - Número de teléfono
   * @returns {string} Número formateado
   */
  formatPhoneNumber(phone) {
    // Eliminar caracteres no numéricos excepto +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // Asegurar que comience con +
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('9') && formatted.length === 9) {
        formatted = '+56' + formatted; // Asumir Chile
      } else {
        formatted = '+' + formatted;
      }
    }
    
    return formatted;
  }

  /**
   * Registrar evento de auditoría de cumplimiento
   * @param {Object} event - Datos del evento
   * @returns {Promise<void>}
   */
  async logComplianceEvent(event) {
    try {
      await supabase
        .from('compliance_logs')
        .insert({
          company_id: event.companyId,
          event_type: event.eventType,
          details: event.details,
          user_id: event.userId || null,
          ip_address: event.ipAddress || null,
          user_agent: event.userAgent || null,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error registrando evento de auditoría:', error);
    }
  }

  /**
   * Enviar alerta de calidad
   * @param {string} companyId - ID de la empresa
   * @param {string} severity - Severidad (INFO, WARNING, CRITICAL)
   * @param {Object} alertData - Datos de la alerta
   * @returns {Promise<void>}
   */
  async sendQualityAlert(companyId, severity, alertData) {
    try {
      await supabase
        .from('company_notifications')
        .insert({
          company_id: companyId,
          type: 'quality_alert',
          title: `Alerta de Calidad - ${severity}`,
          message: alertData.message,
          priority: severity.toLowerCase(),
          metadata: alertData,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error enviando alerta de calidad:', error);
    }
  }

  /**
   * Enviar confirmación de opt-out
   * @param {string} companyId - ID de la empresa
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<void>}
   */
  async sendOptOutConfirmation(companyId, phoneNumber) {
    try {
      // Importar servicio de WhatsApp para enviar confirmación
      const { default: multiWhatsAppService } = await import('./multiWhatsAppService.js');
      
      const config = await multiWhatsAppService.getWhatsAppConfigByCompany(companyId);
      if (!config) return;

      await multiWhatsAppService.sendMessageByCompany(companyId, {
        recipients: [phoneNumber],
        messageType: 'template',
        templateName: 'opt_out_confirmation',
        templateLanguage: 'es',
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: 'Has sido eliminado de nuestra lista de comunicación. No recibirás más mensajes.'
              }
            ]
          }
        ]
      });

    } catch (error) {
      console.error('Error enviando confirmación de opt-out:', error);
    }
  }

  // ========================================
  // MÉTODOS DE CACHE
  // ========================================

  getFromCache(key) {
    const cached = this.consentCache.get(key) || this.windowCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    this.consentCache.delete(key);
    this.windowCache.delete(key);
    return null;
  }

  setCache(key, data) {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    if (key.startsWith('consent_')) {
      this.consentCache.set(key, cacheData);
    } else if (key.startsWith('window_')) {
      this.windowCache.set(key, cacheData);
    }
  }

  clearCache(key = null) {
    if (key) {
      this.consentCache.delete(key);
      this.windowCache.delete(key);
    } else {
      this.consentCache.clear();
      this.windowCache.clear();
    }
  }
}

// Crear instancia global del servicio
const whatsappComplianceService = new WhatsAppComplianceService();

export default whatsappComplianceService;