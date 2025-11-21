/**
 * Servicio Multi-WhatsApp para Agencias
 *
 * Este servicio permite gestionar múltiples números de WhatsApp,
 * uno por cada empresa/cliente. Ideal para agencias de comunicación.
 *
 * Características principales:
 * - Múltiples números de WhatsApp por empresa
 * - Selección automática de número por empresa
 * - Rate limiting individual por número
 * - Estadísticas por empresa y por número
 * - Plantillas por empresa
 * - Logs detallados de uso
 * - Cumplimiento con políticas de WhatsApp Business 2024-2025
 */

import { supabase } from '../lib/supabase.js';

class MultiWhatsAppService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0'
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutos
  }

  // ========================================
  // MÉTODOS DE CONFIGURACIÓN
  // ========================================

  /**
   * Configurar WhatsApp para una empresa específica
   * @param {number} companyId - ID de la empresa
   * @param {Object} config - Configuración de WhatsApp
   * @returns {Promise<Object>} Resultado de la configuración
   */
  async configureWhatsAppForCompany(companyId, config) {
    try {
      console.log(`🔧 Configurando WhatsApp para empresa ${companyId}`);
      
      // Validar que la empresa existe
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        throw new Error(`Empresa ${companyId} no encontrada`);
      }

      // Probar conexión con la API de Meta
      const testResult = await this.testWhatsAppConnection(config);
      
      if (!testResult.success) {
        throw new Error(`Error de conexión: ${testResult.error}`);
      }

      // Guardar configuración en la base de datos
      const { data: whatsappConfig, error: configError } = await supabase
        .from('whatsapp_configs')
        .upsert({
          company_id: companyId,
          access_token: config.accessToken,
          phone_number_id: config.phoneNumberId,
          webhook_verify_token: config.webhookVerifyToken || null,
          display_phone_number: testResult.phoneInfo.display_phone_number,
          verified_name: testResult.phoneInfo.verified_name,
          quality_rating: testResult.phoneInfo.quality_rating,
          is_active: true,
          test_mode: config.testMode || false,
          is_default: config.isDefault || false,
          daily_limit: config.dailyLimit || 1000,
          monthly_limit: config.monthlyLimit || 30000,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (configError) {
        throw new Error(`Error guardando configuración: ${configError.message}`);
      }

      // Actualizar información en la tabla de empresas
      await supabase
        .from('companies')
        .update({
          whatsapp_phone_number: testResult.phoneInfo.display_phone_number,
          whatsapp_configured: true,
          whatsapp_business_name: testResult.phoneInfo.verified_name,
          whatsapp_status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      // Limpiar cache
      this.clearCache(`whatsapp_config_${companyId}`);
      this.clearCache('all_whatsapp_configs');

      console.log(`✅ WhatsApp configurado exitosamente para ${company.name}`);
      
      return {
        success: true,
        message: `WhatsApp configurado exitosamente para ${company.name}`,
        config: whatsappConfig,
        phoneInfo: testResult.phoneInfo
      };

    } catch (error) {
      console.error(`❌ Error configurando WhatsApp para empresa ${companyId}:`, error);
      return {
        success: false,
        message: `Error configurando WhatsApp: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Eliminar configuración de WhatsApp para una empresa
   * @param {number} companyId - ID de la empresa
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteWhatsAppConfiguration(companyId) {
    try {
      console.log(`🗑️ Eliminando configuración WhatsApp para empresa ${companyId}`);
      
      // Verificar que la empresa existe
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        throw new Error(`Empresa ${companyId} no encontrada`);
      }

      // Desactivar configuración en lugar de eliminar (para mantener historial)
      const { error: updateError } = await supabase
        .from('whatsapp_configs')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);

      if (updateError) {
        throw new Error(`Error desactivando configuración: ${updateError.message}`);
      }

      // Actualizar información en la tabla de empresas
      await supabase
        .from('companies')
        .update({
          whatsapp_phone_number: null,
          whatsapp_configured: false,
          whatsapp_business_name: null,
          whatsapp_status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      // Limpiar cache
      this.clearCache(`whatsapp_config_${companyId}`);
      this.clearCache('all_whatsapp_configs');

      console.log(`✅ Configuración WhatsApp eliminada para ${company.name}`);
      
      return {
        success: true,
        message: `Configuración WhatsApp eliminada exitosamente para ${company.name}`
      };

    } catch (error) {
      console.error(`❌ Error eliminando configuración WhatsApp para empresa ${companyId}:`, error);
      return {
        success: false,
        message: `Error eliminando configuración: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Obtener configuración de WhatsApp para una empresa
   * @param {number} companyId - ID de la empresa
   * @returns {Promise<Object>} Configuración de WhatsApp
   */
  async getWhatsAppConfigByCompany(companyId) {
    const cacheKey = `whatsapp_config_${companyId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn(`⚠️ No hay configuración de WhatsApp para empresa ${companyId}`);
        return null;
      }

      this.setCache(cacheKey, data);
      return data;

    } catch (error) {
      console.error(`Error obteniendo configuración WhatsApp para empresa ${companyId}:`, error);
      return null;
    }
  }

  /**
   * Obtener todas las configuraciones de WhatsApp activas
   * @returns {Promise<Array>} Lista de configuraciones activas
   */
  async getAllWhatsAppConfigs() {
    const cacheKey = 'all_whatsapp_configs';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('active_whatsapp_configs')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data || [];

    } catch (error) {
      console.error('Error obteniendo todas las configuraciones de WhatsApp:', error);
      return [];
    }
  }

  /**
   * Obtener configuración por defecto (para agencias)
   * @returns {Promise<Object>} Configuración por defecto
   */
  async getDefaultWhatsAppConfig() {
    try {
      const { data, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn('⚠️ No hay configuración de WhatsApp por defecto');
        return null;
      }

      return data;

    } catch (error) {
      console.error('Error obteniendo configuración por defecto:', error);
      return null;
    }
  }

  // ========================================
  // MÉTODOS DE ENVÍO DE MENSAJES
  // ========================================

  /**
   * Enviar mensaje usando el número de WhatsApp de una empresa específica
   * @param {number} companyId - ID de la empresa
   * @param {Object} params - Parámetros del mensaje
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessageByCompany(companyId, params) {
    try {
      console.log(`📤 Enviando mensaje WhatsApp para empresa ${companyId}`);
      
      // Obtener configuración de la empresa
      const config = await this.getWhatsAppConfigByCompany(companyId);
      
      if (!config) {
        throw new Error(`No hay configuración de WhatsApp para la empresa ${companyId}`);
      }

      // Verificar límites de uso
      const limitCheck = await this.checkUsageLimits(config);
      if (!limitCheck.canSend) {
        throw new Error(`Límite de uso excedido: ${limitCheck.reason}`);
      }

      // Enviar mensaje
      const result = await this.sendMessage(config, params);

      // Actualizar uso y registrar log
      if (result.success) {
        await this.updateUsage(config.id, 1);
        await this.logWhatsAppMessage(config.company_id, config.id, {
          ...result,
          recipient_phone: result.recipientPhone,
          message_content: params.message,
          message_type: params.messageType || 'text'
        });
      }

      return {
        ...result,
        companyId,
        companyName: config.company_name
      };

    } catch (error) {
      console.error(`❌ Error enviando mensaje para empresa ${companyId}:`, error);
      return {
        success: false,
        message: `Error enviando mensaje: ${error.message}`,
        error: error.message,
        companyId
      };
    }
  }

  /**
   * Enviar mensaje masivo a múltiples empresas
   * @param {Object} params - Parámetros del envío
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendBulkMessageByCompanies(params) {
    const {
      companies, // Array de {companyId, recipients}
      message,
      templateName = null,
      templateLanguage = 'es',
      components = [],
      messageType = 'text',
      delayBetweenMessages = 1000
    } = params;

    const totalResults = {
      totalCompanies: companies.length,
      successfulCompanies: 0,
      failedCompanies: 0,
      totalRecipients: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      results: []
    };

    for (const companyData of companies) {
      try {
        console.log(`📤 Procesando empresa ${companyData.companyId}...`);
        
        const result = await this.sendMessageByCompany(companyData.companyId, {
          recipients: companyData.recipients,
          message,
          templateName,
          templateLanguage,
          components,
          messageType
        });

        if (result.success) {
          totalResults.successfulCompanies++;
          totalResults.totalSuccessful += result.successfulDeliveries || 0;
        } else {
          totalResults.failedCompanies++;
        }

        totalResults.totalRecipients += result.recipientCount || 0;
        totalResults.totalFailed += result.failedDeliveries || 0;

        totalResults.results.push({
          companyId: companyData.companyId,
          result
        });

        // Delay entre empresas
        if (delayBetweenMessages > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
        }

      } catch (error) {
        console.error(`Error procesando empresa ${companyData.companyId}:`, error);
        totalResults.failedCompanies++;
        totalResults.results.push({
          companyId: companyData.companyId,
          error: error.message
        });
      }
    }

    return {
      success: totalResults.successfulCompanies > 0,
      message: `Envío completado: ${totalResults.successfulCompanies}/${totalResults.totalCompanies} empresas exitosas`,
      ...totalResults
    };
  }

  /**
   * Enviar mensaje usando configuración específica
   * @param {Object} config - Configuración de WhatsApp
   * @param {Object} params - Parámetros del mensaje
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessage(config, params) {
    const {
      recipients, // Array de números de teléfono
      message,
      templateName = null,
      templateLanguage = 'es',
      components = [],
      messageType = 'text'
    } = params;

    if (!recipients || recipients.length === 0) {
      throw new Error('No hay destinatarios especificados');
    }

    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendSingleMessage(config, {
          to: recipient,
          message,
          templateName,
          templateLanguage,
          components,
          messageType
        });

        results.push({
          recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        // Rate limiting entre mensajes
        if (config.message_cooldown_seconds > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, config.message_cooldown_seconds * 1000)
          );
        }

      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: successful > 0,
      totalRecipients: recipients.length,
      successful,
      failed,
      successRate: (successful / recipients.length) * 100,
      results
    };
  }

  /**
   * Enviar mensaje individual
   * @param {Object} config - Configuración de WhatsApp
   * @param {Object} params - Parámetros del mensaje
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendSingleMessage(config, params) {
    const {
      to,
      message,
      templateName = null,
      templateLanguage = 'es',
      components = [],
      messageType = 'text'
    } = params;

    // Formatear número de teléfono
    const formattedPhone = this.formatPhoneNumber(to);

    let payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone
    };

    // Construir payload según tipo de mensaje
    if (messageType === 'template' && templateName) {
      payload.type = 'template';
      payload.template = {
        name: templateName,
        language: { code: templateLanguage },
        components: components
      };
    } else {
      payload.type = 'text';
      payload.text = {
        body: message
      };
    }

    if (config.test_mode) {
      // Modo prueba
      return {
        success: true,
        messageId: `test_${Date.now()}`,
        recipientPhone: formattedPhone,
        testMode: true,
        message: 'Mensaje de WhatsApp enviado (modo prueba)'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${config.phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messages[0].id,
        recipientPhone: formattedPhone,
        status: result.messages[0].message_status,
        timestamp: new Date().toISOString(),
        result
      };

    } catch (error) {
      return {
        success: false,
        message: `Error al enviar mensaje: ${error.message}`,
        error: error.message,
        recipientPhone: formattedPhone
      };
    }
  }

  // ========================================
  // MÉTODOS DE UTILIDADES
  // ========================================

  /**
   * Probar conexión con WhatsApp
   * @param {Object} config - Configuración de WhatsApp
   * @returns {Promise<Object>} Resultado de la prueba
   */
  async testWhatsAppConnection(config) {
    try {
      const response = await fetch(`${this.baseUrl}/${config.phoneNumberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const phoneInfo = await response.json();

      return {
        success: true,
        message: 'Conexión exitosa con WhatsApp Business API',
        phoneInfo: {
          id: phoneInfo.id,
          name: phoneInfo.display_phone_number,
          verifiedName: phoneInfo.verified_name,
          qualityRating: phoneInfo.quality_rating
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Verificar límites de uso
   * @param {Object} config - Configuración de WhatsApp
   * @returns {Object} Resultado de la verificación
   */
  async checkUsageLimits(config) {
    try {
      // Verificar límite diario
      if (config.current_daily_usage >= config.daily_limit) {
        return {
          canSend: false,
          reason: `Límite diario alcanzado (${config.current_daily_usage}/${config.daily_limit})`
        };
      }

      // Verificar límite mensual
      if (config.current_monthly_usage >= config.monthly_limit) {
        return {
          canSend: false,
          reason: `Límite mensual alcanzado (${config.current_monthly_usage}/${config.monthly_limit})`
        };
      }

      return {
        canSend: true,
        dailyRemaining: config.daily_limit - config.current_daily_usage,
        monthlyRemaining: config.monthly_limit - config.current_monthly_usage
      };

    } catch (error) {
      console.error('Error verificando límites de uso:', error);
      return {
        canSend: false,
        reason: `Error verificando límites: ${error.message}`
      };
    }
  }

  /**
   * Actualizar uso de mensajes
   * @param {number} configId - ID de la configuración
   * @param {number} count - Cantidad de mensajes enviados
   * @returns {Promise<void>}
   */
  async updateUsage(configId, count) {
    try {
      await supabase
        .from('whatsapp_configs')
        .update({
          current_daily_usage: supabase.raw(`current_daily_usage + ${count}`),
          current_monthly_usage: supabase.raw(`current_monthly_usage + ${count}`),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', configId);

    } catch (error) {
      console.error('Error actualizando uso de WhatsApp:', error);
    }
  }

  /**
   * Registrar log de mensaje
   * @param {number} companyId - ID de la empresa
   * @param {number} configId - ID de la configuración
   * @param {Object} messageData - Datos del mensaje
   * @returns {Promise<void>}
   */
  async logWhatsAppMessage(companyId, configId, messageData) {
    try {
      await supabase
        .from('whatsapp_logs')
        .insert({
          company_id: companyId,
          whatsapp_config_id: configId,
          message_id: messageData.messageId,
          recipient_phone: messageData.recipientPhone,
          message_content: messageData.message_content,
          message_type: messageData.message_type,
          status: messageData.status || 'sent',
          cost: 0.0525, // Costo estándar por mensaje
          sent_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error registrando log de WhatsApp:', error);
    }
  }

  /**
   * Formatear número de teléfono para WhatsApp
   * @param {string} phone - Número de teléfono
   * @returns {string} Número formateado
   */
  formatPhoneNumber(phone) {
    // Eliminar caracteres no numéricos excepto +
    let formatted = phone.replace(/[^d+]/g, '');
    
    // Asegurar que comience con +
    if (!formatted.startsWith('+')) {
      // Si no tiene código de país, asumir Chile (+56)
      if (formatted.startsWith('9') && formatted.length === 9) {
        formatted = '+56' + formatted;
      } else {
        formatted = '+' + formatted;
      }
    }
    
    return formatted;
  }

  /**
   * Obtener estadísticas de uso por empresa
   * @param {number} companyId - ID de la empresa (opcional)
   * @returns {Promise<Object>} Estadísticas de uso
   */
  async getUsageStats(companyId = null) {
    try {
      let query = supabase
        .from('whatsapp_logs')
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query
        .order('sent_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Procesar estadísticas
      const stats = {
        totalMessages: data?.length || 0,
        sentMessages: data?.filter(log => log.status === 'sent').length || 0,
        deliveredMessages: data?.filter(log => log.status === 'delivered').length || 0,
        readMessages: data?.filter(log => log.status === 'read').length || 0,
        failedMessages: data?.filter(log => log.status === 'failed').length || 0,
        totalCost: data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0,
        byCompany: {},
        byStatus: {},
        recentMessages: data?.slice(0, 10) || []
      };

      // Agrupar por empresa
      data?.forEach(log => {
        const companyName = log.companies?.name || 'Desconocida';
        if (!stats.byCompany[companyName]) {
          stats.byCompany[companyName] = {
            total: 0,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            cost: 0
          };
        }
        
        stats.byCompany[companyName].total++;
        stats.byCompany[companyName][log.status]++;
        stats.byCompany[companyName].cost += log.cost || 0;
      });

      // Agrupar por estado
      data?.forEach(log => {
        if (!stats.byStatus[log.status]) {
          stats.byStatus[log.status] = 0;
        }
        stats.byStatus[log.status]++;
      });

      return stats;

    } catch (error) {
      console.error('Error obteniendo estadísticas de uso:', error);
      return {
        totalMessages: 0,
        sentMessages: 0,
        deliveredMessages: 0,
        readMessages: 0,
        failedMessages: 0,
        totalCost: 0,
        byCompany: {},
        byStatus: {},
        recentMessages: []
      };
    }
  }

  // ========================================
  // MÉTODOS DE CACHE
  // ========================================

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Crear instancia global del servicio
const multiWhatsAppService = new MultiWhatsAppService();

export default multiWhatsAppService;