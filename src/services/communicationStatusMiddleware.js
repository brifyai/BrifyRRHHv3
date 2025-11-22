/**
 * Middleware de Verificación de Estado para Comunicaciones
 * 
 * Este middleware envuelve todos los servicios de comunicación para verificar
 * el estado de la empresa antes de permitir el envío de mensajes.
 * 
 * Servicios soportados:
 * - WhatsApp (multiWhatsAppService)
 * - Email/SMS (brevoService)
 * - Telegram (futuro)
 * - Slack (futuro)
 * - Teams (futuro)
 */

import companyStatusVerificationService from './companyStatusVerificationService.js'
import multiWhatsAppService from './multiWhatsAppService.js'
import brevoService from './brevoService.js'
import logger from '../lib/logger.js'

class CommunicationStatusMiddleware {
  constructor() {
    this.services = {
      whatsapp: multiWhatsAppService,
      email: brevoService,
      sms: brevoService,
      telegram: null, // Se agregará cuando esté implementado
      slack: null,    // Se agregará cuando esté implementado
      teams: null     // Se agregará cuando esté implementado
    }
  }

  /**
   * Enviar mensaje de WhatsApp con verificación de estado
   * @param {number} companyId - ID de la empresa
   * @param {Object} params - Parámetros del mensaje
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendWhatsAppMessage(companyId, params) {
    try {
      // Verificar estado de la empresa
      const companyStatus = await companyStatusVerificationService.isCompanyActive(companyId)
      
      if (!companyStatus.isActive) {
        // Registrar intento bloqueado
        await companyStatusVerificationService.logBlockedCommunication(companyId, 'whatsapp', {
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
          messagePreview: params.message?.substring(0, 100)
        })

        logger.warn('CommunicationStatusMiddleware', `🚫 WhatsApp bloqueado para empresa inactiva: ${companyId} - ${companyStatus.reason}`)
        
        return {
          success: false,
          blocked: true,
          reason: companyStatus.reason,
          companyId,
          communicationType: 'whatsapp',
          timestamp: new Date().toISOString()
        }
      }

      // Empresa activa, proceder con el envío
      logger.info('CommunicationStatusMiddleware', `✅ WhatsApp permitido para empresa activa: ${companyId}`)
      
      const result = await this.services.whatsapp.sendMessageByCompany(companyId, params)
      
      return {
        ...result,
        verified: true,
        companyStatus: companyStatus.company.name
      }

    } catch (error) {
      logger.error('CommunicationStatusMiddleware', `Error en middleware WhatsApp para empresa ${companyId}:`, error)
      return {
        success: false,
        error: error.message,
        companyId,
        communicationType: 'whatsapp'
      }
    }
  }

  /**
   * Enviar email con verificación de estado
   * @param {number} companyId - ID de la empresa
   * @param {Object} params - Parámetros del email
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendEmailMessage(companyId, params) {
    try {
      // Verificar estado de la empresa
      const companyStatus = await companyStatusVerificationService.isCompanyActive(companyId)
      
      if (!companyStatus.isActive) {
        // Registrar intento bloqueado
        await companyStatusVerificationService.logBlockedCommunication(companyId, 'email', {
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
          subject: params.subject,
          recipientsCount: params.recipients?.length || 0
        })

        logger.warn('CommunicationStatusMiddleware', `🚫 Email bloqueado para empresa inactiva: ${companyId} - ${companyStatus.reason}`)
        
        return {
          success: false,
          blocked: true,
          reason: companyStatus.reason,
          companyId,
          communicationType: 'email',
          timestamp: new Date().toISOString()
        }
      }

      // Empresa activa, proceder con el envío
      logger.info('CommunicationStatusMiddleware', `✅ Email permitido para empresa activa: ${companyId}`)
      
      const result = await this.services.email.sendBulkEmail(params)
      
      return {
        ...result,
        verified: true,
        companyStatus: companyStatus.company.name
      }

    } catch (error) {
      logger.error('CommunicationStatusMiddleware', `Error en middleware Email para empresa ${companyId}:`, error)
      return {
        success: false,
        error: error.message,
        companyId,
        communicationType: 'email'
      }
    }
  }

  /**
   * Enviar SMS con verificación de estado
   * @param {number} companyId - ID de la empresa
   * @param {Object} params - Parámetros del SMS
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendSMSMessage(companyId, params) {
    try {
      // Verificar estado de la empresa
      const companyStatus = await companyStatusVerificationService.isCompanyActive(companyId)
      
      if (!companyStatus.isActive) {
        // Registrar intento bloqueado
        await companyStatusVerificationService.logBlockedCommunication(companyId, 'sms', {
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
          messagePreview: params.message?.substring(0, 100),
          recipientsCount: params.recipients?.length || 0
        })

        logger.warn('CommunicationStatusMiddleware', `🚫 SMS bloqueado para empresa inactiva: ${companyId} - ${companyStatus.reason}`)
        
        return {
          success: false,
          blocked: true,
          reason: companyStatus.reason,
          companyId,
          communicationType: 'sms',
          timestamp: new Date().toISOString()
        }
      }

      // Empresa activa, proceder con el envío
      logger.info('CommunicationStatusMiddleware', `✅ SMS permitido para empresa activa: ${companyId}`)
      
      const result = await this.services.sms.sendBulkSMS(params)
      
      return {
        ...result,
        verified: true,
        companyStatus: companyStatus.company.name
      }

    } catch (error) {
      logger.error('CommunicationStatusMiddleware', `Error en middleware SMS para empresa ${companyId}:`, error)
      return {
        success: false,
        error: error.message,
        companyId,
        communicationType: 'sms'
      }
    }
  }

  /**
   * Enviar mensaje masivo a múltiples empresas
   * @param {Array} companies - Array de empresas con sus mensajes
   * @returns {Promise<Object>} Resultados agregados
   */
  async sendBulkMessageToCompanies(companies) {
    const results = {
      totalCompanies: companies.length,
      successfulCompanies: 0,
      blockedCompanies: 0,
      failedCompanies: 0,
      totalMessages: 0,
      blockedMessages: 0,
      results: []
    }

    for (const companyData of companies) {
      try {
        const { companyId, communicationType, params } = companyData
        
        let result
        switch (communicationType) {
          case 'whatsapp':
            result = await this.sendWhatsAppMessage(companyId, params)
            break
          case 'email':
            result = await this.sendEmailMessage(companyId, params)
            break
          case 'sms':
            result = await this.sendSMSMessage(companyId, params)
            break
          default:
            throw new Error(`Tipo de comunicación no soportado: ${communicationType}`)
        }

        // Clasificar resultado
        if (result.blocked) {
          results.blockedCompanies++
          results.blockedMessages += params.recipients?.length || 1
        } else if (result.success) {
          results.successfulCompanies++
          results.totalMessages += params.recipients?.length || 1
        } else {
          results.failedCompanies++
        }

        results.results.push({
          companyId,
          communicationType,
          result
        })

      } catch (error) {
        results.failedCompanies++
        results.results.push({
          companyId: companyData.companyId,
          communicationType: companyData.communicationType,
          result: {
            success: false,
            error: error.message
          }
        })
      }
    }

    return {
      ...results,
      success: results.successfulCompanies > 0,
      message: `Procesadas ${results.totalCompanies} empresas: ${results.successfulCompanies} exitosas, ${results.blockedCompanies} bloqueadas, ${results.failedCompanies} con errores`
    }
  }

  /**
   * Obtener estadísticas de comunicaciones por empresa
   * @param {number} companyId - ID de la empresa (opcional)
   * @returns {Promise<Object>} Estadísticas
   */
  async getCommunicationStats(companyId = null) {
    try {
      const blockedStats = await companyStatusVerificationService.getBlockedCommunicationsStats(companyId)
      
      return {
        blockedCommunications: blockedStats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('CommunicationStatusMiddleware', `Error obteniendo estadísticas:`, error)
      return {
        blockedCommunications: {
          totalBlocked: 0,
          byType: {},
          byDay: {},
          recentBlocks: []
        }
      }
    }
  }

  /**
   * Limpiar cache de verificación de estado
   * @param {number} companyId - ID específico (opcional)
   */
  clearStatusCache(companyId = null) {
    companyStatusVerificationService.clearStatusCache(companyId)
  }

  /**
   * Verificar estado de múltiples empresas de forma eficiente
   * @param {Array<number>} companyIds - Array de IDs de empresas
   * @returns {Promise<Object>} Resultados de verificación
   */
  async verifyMultipleCompanies(companyIds) {
    return await companyStatusVerificationService.areCompaniesActive(companyIds)
  }
}

// Crear instancia global del middleware
const communicationStatusMiddleware = new CommunicationStatusMiddleware()

export default communicationStatusMiddleware