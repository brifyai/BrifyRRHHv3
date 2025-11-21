/**
 * Servicio de WhatsApp usando API oficial de Meta
 *
 * Este servicio proporciona una interfaz completa para:
 * - Configuración de API de Meta WhatsApp
 * - Envío de mensajes individuales y masivos
 * - Gestión de plantillas de mensaje
 * - Manejo de webhooks para estado de entrega
 * - Validación de números de teléfono
 * - Estadísticas de uso
 *
 * NOTA: Este servicio ahora usa configurationService para persistencia
 * en lugar de localStorage directamente.
 */

import configurationService from './configurationService.js'

class WhatsAppService {
  constructor() {
    this.accessToken = null
    this.phoneNumberId = null
    this.webhookVerifyToken = null
    this.baseUrl = 'https://graph.facebook.com/v18.0'
    this.isConfigured = false
    this.testMode = false
    this.templates = new Map()
  }

  /**
   * Configurar las credenciales de WhatsApp Business API
   * @param {Object} config - Configuración de WhatsApp
   * @param {string} config.accessToken - Token de acceso de Meta
   * @param {string} config.phoneNumberId - ID del número de teléfono Business
   * @param {string} config.webhookVerifyToken - Token de verificación de webhook
   * @param {boolean} config.testMode - Modo de prueba (opcional)
   */
  async configure(config) {
    this.accessToken = config.accessToken
    this.phoneNumberId = config.phoneNumberId
    this.webhookVerifyToken = config.webhookVerifyToken
    this.testMode = config.testMode || false
    this.isConfigured = !!(config.accessToken && config.phoneNumberId)

    // Guardar usando configurationService
    if (config.accessToken) {
      await configurationService.setConfig('integrations', 'whatsapp', {
        accessToken: config.accessToken,
        phoneNumberId: config.phoneNumberId,
        webhookVerifyToken: config.webhookVerifyToken || '',
        testMode: this.testMode
      }, 'global', null, 'Configuración de WhatsApp Business API')
    }
  }

  /**
   * Cargar configuración desde configurationService
   */
  async loadConfiguration() {
    try {
      const config = await configurationService.getConfig('integrations', 'whatsapp', 'global', null, {})

      if (config.accessToken && config.phoneNumberId) {
        this.accessToken = config.accessToken
        this.phoneNumberId = config.phoneNumberId
        this.webhookVerifyToken = config.webhookVerifyToken || ''
        this.testMode = config.testMode || false
        this.isConfigured = true
      }

      return {
        accessToken: this.accessToken,
        phoneNumberId: this.phoneNumberId,
        webhookVerifyToken: this.webhookVerifyToken,
        testMode: this.testMode
      }
    } catch (error) {
      console.error('Error loading WhatsApp configuration:', error)
      return {
        accessToken: null,
        phoneNumberId: null,
        webhookVerifyToken: null,
        testMode: false
      }
    }
  }

  /**
   * Limpiar configuración
   */
  async clearConfiguration() {
    this.accessToken = null
    this.phoneNumberId = null
    this.webhookVerifyToken = null
    this.testMode = false
    this.isConfigured = false

    try {
      await configurationService.setConfig('integrations', 'whatsapp', {}, 'global', null, 'Configuración de WhatsApp Business API - Limpiada')
    } catch (error) {
      console.error('Error clearing WhatsApp configuration:', error)
    }
  }

  /**
   * Obtener headers para peticiones a la API
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    }
  }

  /**
   * Probar conexión con la API de Meta WhatsApp
   * @returns {Promise<Object>} Resultado de la prueba
   */
  async testConnection() {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado. Por favor configura tu Access Token y Phone Number ID primero.')
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const phoneInfo = await response.json()
      
      return {
        success: true,
        message: 'Conexión exitosa con WhatsApp Business API',
        phoneInfo: {
          id: phoneInfo.id,
          name: phoneInfo.display_phone_number,
          verifiedName: phoneInfo.verified_name,
          qualityRating: phoneInfo.quality_rating
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
        error: error.message
      }
    }
  }

  /**
   * Enviar mensaje de WhatsApp
   * @param {Object} params - Parámetros del envío
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessage(params) {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    const {
      to, // Número de teléfono destinatario
      message, // Contenido del mensaje
      templateName = null, // Nombre de plantilla (opcional)
      templateLanguage = 'es', // Idioma de plantilla
      components = [], // Componentes de plantilla
      messageType = 'text' // 'text', 'template', 'media'
    } = params

    // Validar destinatario
    if (!to) {
      throw new Error('El número de teléfono del destinatario es obligatorio')
    }

    // Formatear número de teléfono
    const formattedPhone = this.formatPhoneNumber(to)

    let payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone
    }

    // Construir payload según tipo de mensaje
    if (messageType === 'template' && templateName) {
      payload.type = 'template'
      payload.template = {
        name: templateName,
        language: { code: templateLanguage },
        components: components
      }
    } else {
      payload.type = 'text'
      payload.text = {
        body: message
      }
    }

    if (this.testMode) {
      // En modo prueba, simular envío
      return {
        success: true,
        messageId: `test_${Date.now()}`,
        recipientPhone: formattedPhone,
        testMode: true,
        message: 'Mensaje de WhatsApp enviado (modo prueba)'
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error ${response.status}: ${errorData.error?.message || response.statusText}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        messageId: result.messages[0].id,
        recipientPhone: formattedPhone,
        status: result.messages[0].message_status,
        timestamp: new Date().toISOString(),
        result: result
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al enviar mensaje: ${error.message}`,
        error: error.message,
        recipientPhone: formattedPhone
      }
    }
  }

  /**
   * Enviar mensaje masivo
   * @param {Object} params - Parámetros del envío masivo
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendBulkMessage(params) {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    const {
      recipients, // Array de números de teléfono
      message,
      templateName = null,
      templateLanguage = 'es',
      components = [],
      messageType = 'text',
      delayBetweenMessages = 1000 // Delay en ms entre mensajes
    } = params

    // Validar destinatarios
    if (!recipients || recipients.length === 0) {
      throw new Error('No hay destinatarios especificados')
    }

    const results = []
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      
      try {
        const result = await this.sendMessage({
          to: recipient,
          message,
          templateName,
          templateLanguage,
          components,
          messageType
        })
        
        results.push({
          recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        })
        
        // Delay entre mensajes para evitar límites de rate limiting
        if (delayBetweenMessages > 0 && i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages))
        }
      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error.message
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return {
      success: successful > 0,
      totalRecipients: recipients.length,
      successful,
      failed,
      successRate: (successful / recipients.length) * 100,
      results: results
    }
  }

  /**
   * Crear plantilla de mensaje
   * @param {Object} template - Configuración de plantilla
   * @returns {Promise<Object>} Resultado de la creación
   */
  async createTemplate(template) {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    const {
      name,
      category,
      language = 'es',
      components
    } = template

    const payload = {
      name,
      category,
      language,
      components
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/message_templates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error ${response.status}: ${errorData.error?.message || response.statusText}`)
      }

      const result = await response.json()
      
      // Guardar plantilla en caché
      this.templates.set(name, result)
      
      return {
        success: true,
        template: result,
        message: 'Plantilla creada exitosamente'
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al crear plantilla: ${error.message}`,
        error: error.message
      }
    }
  }

  /**
   * Obtener plantillas de mensaje
   * @returns {Promise<Object>} Lista de plantillas
   */
  async getTemplates() {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/message_templates`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        templates: data.data || [],
        total: data.data?.length || 0
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener plantillas: ${error.message}`,
        error: error.message
      }
    }
  }

  /**
   * Verificar webhook de WhatsApp
   * @param {Object} params - Parámetros de verificación
   * @returns {string} Token de verificación
   */
  verifyWebhook(params) {
    const { mode, token, challenge } = params
    
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge
    }
    
    throw new Error('Verificación de webhook fallida')
  }

  /**
   * Procesar webhook entrante
   * @param {Object} payload - Datos del webhook
   * @returns {Object} Datos procesados
   */
  processWebhook(payload) {
    try {
      const messages = []
      
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value?.messages) {
                for (const message of change.value.messages) {
                  messages.push({
                    messageId: message.id,
                    from: message.from,
                    timestamp: message.timestamp,
                    type: message.type,
                    text: message.text?.body,
                    status: message.status,
                    direction: 'inbound'
                  })
                }
              }
              
              if (change.value?.statuses) {
                for (const status of change.value.statuses) {
                  messages.push({
                    messageId: status.id,
                    recipient: status.recipient_id,
                    timestamp: status.timestamp,
                    status: status.status,
                    errors: status.errors,
                    direction: 'status_update'
                  })
                }
              }
            }
          }
        }
      }
      
      return {
        success: true,
        messages: messages
      }
    } catch (error) {
      return {
        success: false,
        message: `Error procesando webhook: ${error.message}`,
        error: error.message
      }
    }
  }

  /**
   * Formatear número de teléfono para WhatsApp
   * @param {string} phone - Número de teléfono
   * @returns {string} Número formateado
   */
  formatPhoneNumber(phone) {
    // Eliminar caracteres no numéricos excepto +
    let formatted = phone.replace(/[^\d+]/g, '')
    
    // Asegurar que comience con +
    if (!formatted.startsWith('+')) {
      // Si no tiene código de país, asumir Chile (+56)
      if (formatted.startsWith('9') && formatted.length === 9) {
        formatted = '+56' + formatted
      } else {
        formatted = '+' + formatted
      }
    }
    
    return formatted
  }

  /**
   * Validar formato de número de teléfono
   * @param {string} phone - Número de teléfono
   * @returns {boolean} Válido o no
   */
  validatePhoneNumber(phone) {
    const formatted = this.formatPhoneNumber(phone)
    // Expresión regular para números internacionales
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(formatted)
  }

  /**
   * Obtener estadísticas de uso
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Object>} Estadísticas
   */
  async getStatistics(params = {}) {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
      endDate = new Date()
    } = params

    try {
      // En una implementación real, esto consultaría la base de datos
      // o usaría las analytics de Meta API
      
      return {
        success: true,
        statistics: {
          totalSent: 0,
          totalDelivered: 0,
          totalRead: 0,
          deliveryRate: 0,
          readRate: 0,
          cost: 0,
          period: { startDate, endDate }
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener estadísticas: ${error.message}`,
        error: error.message
      }
    }
  }

  /**
   * Obtener información de la cuenta de WhatsApp Business
   * @returns {Promise<Object>} Información de la cuenta
   */
  async getAccountInfo() {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const account = await response.json()
      
      return {
        success: true,
        account: {
          id: account.id,
          name: account.name,
          tasks: account.tasks
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener información de la cuenta: ${error.message}`,
        error: error.message
      }
    }
  }

  /**
   * Enviar mensaje de prueba
   * @param {string} phoneNumber - Número de teléfono
   * @param {string} message - Mensaje de prueba
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendTestMessage(phoneNumber, message = 'Este es un mensaje de prueba desde StaffHub') {
    if (!this.isConfigured) {
      throw new Error('WhatsApp no está configurado')
    }

    try {
      const result = await this.sendMessage({
        to: phoneNumber,
        message: message,
        messageType: 'text'
      })

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          testMode: result.testMode,
          message: 'Mensaje de prueba enviado exitosamente'
        }
      } else {
        throw new Error(result.error || 'Error al enviar mensaje de prueba')
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al enviar mensaje de prueba: ${error.message}`,
        error: error.message
      }
    }
  }
}

// Crear instancia global del servicio
const whatsappService = new WhatsAppService()

// Cargar configuración guardada al iniciar (asíncronamente)
whatsappService.loadConfiguration().catch(error => {
  console.error('Error loading WhatsApp configuration on startup:', error)
})

export default whatsappService