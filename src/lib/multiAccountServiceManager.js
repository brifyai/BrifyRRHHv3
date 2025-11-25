import { BaseMultiAccountManager } from './baseMultiAccountManager.js'
import logger from './logger.js'

/**
 * Multi-Account Service Manager
 * Maneja múltiples cuentas para cualquier servicio (Google Meet, Slack, Teams, HubSpot, Brevo, WhatsApp, Telegram)
 */
class MultiAccountServiceManager extends BaseMultiAccountManager {
  constructor(serviceName, config = {}) {
    super(serviceName)
    this.serviceConfig = config
    this.oauthConfig = config.oauth || {}
    logger.info(`MultiAccountServiceManager`, `✅ Inicializado para servicio: ${serviceName}`)
  }

  /**
   * Conectar una cuenta usando OAuth
   */
  async connect(companyId, credentials, accountName = 'Cuenta Principal') {
    try {
      logger.info(this.serviceName, `🔄 Conectando cuenta para empresa ${companyId}`)
      
      // Validar credenciales según el servicio
      const validation = this.validateCredentials(credentials)
      if (!validation.valid) {
        throw new Error(`Credenciales inválidas: ${validation.errors.join(', ')}`)
      }

      // Guardar credenciales usando el manager base
      const savedCredential = await this.saveCredentials(companyId, credentials, accountName)
      
      if (!savedCredential) {
        throw new Error('No se pudieron guardar las credenciales')
      }

      logger.info(this.serviceName, `✅ Cuenta conectada exitosamente: ${accountName}`)
      return {
        success: true,
        credential: savedCredential,
        message: 'Cuenta conectada exitosamente'
      }
    } catch (error) {
      logger.error(this.serviceName, `❌ Error conectando cuenta: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Desconectar una cuenta
   */
  async disconnect(companyId, credentialId = null) {
    try {
      logger.info(this.serviceName, `🔄 Desconectando cuenta para empresa ${companyId}`)
      
      // Si no se especifica credentialId, desconectar la cuenta actual
      if (!credentialId) {
        const currentCredential = this.getCurrentCredential(companyId)
        if (currentCredential) {
          credentialId = currentCredential.id
        }
      }

      if (!credentialId) {
        throw new Error('No hay cuenta activa para desconectar')
      }

      // Desactivar credenciales
      const success = await this.deactivateCredentials(credentialId)
      
      if (!success) {
        throw new Error('No se pudieron desactivar las credenciales')
      }

      logger.info(this.serviceName, `✅ Cuenta desconectada exitosamente`)
      return {
        success: true,
        message: 'Cuenta desconectada exitosamente'
      }
    } catch (error) {
      logger.error(this.serviceName, `❌ Error desconectando cuenta: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Validar credenciales según el tipo de servicio
   */
  validateCredentials(credentials) {
    const errors = []
    
    switch (this.serviceName) {
      case 'googlemeet':
        if (!credentials.accessToken) errors.push('accessToken requerido')
        break
        
      case 'slack':
        if (!credentials.botToken) errors.push('botToken requerido')
        if (!credentials.signingSecret) errors.push('signingSecret requerido')
        break
        
      case 'teams':
        if (!credentials.tenantId) errors.push('tenantId requerido')
        if (!credentials.clientId) errors.push('clientId requerido')
        if (!credentials.clientSecret) errors.push('clientSecret requerido')
        break
        
      case 'hubspot':
        if (!credentials.accessToken) errors.push('accessToken requerido')
        break
        
      case 'brevo':
        if (!credentials.apiKey) errors.push('apiKey requerido')
        break
        
      case 'whatsapp':
      case 'whatsappOfficial':
        if (!credentials.accessToken) errors.push('accessToken requerido')
        if (!credentials.phoneNumberId) errors.push('phoneNumberId requerido')
        break
        
      case 'whatsappWaha':
        if (!credentials.apiKey) errors.push('apiKey requerido')
        if (!credentials.sessionId) errors.push('sessionId requerido')
        break
        
      case 'telegram':
        if (!credentials.botToken) errors.push('botToken requerido')
        if (!credentials.botUsername) errors.push('botUsername requerido')
        break
        
      default:
        errors.push(`Servicio ${this.serviceName} no soportado`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Generar URL de autorización OAuth (si aplica)
   */
  generateAuthUrl(clientConfig, stateData) {
    try {
      switch (this.serviceName) {
        case 'googlemeet':
          // Usa la misma URL que Google Drive
          return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientConfig.clientId}&redirect_uri=${clientConfig.redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/calendar.events&state=${encodeURIComponent(JSON.stringify(stateData))}`
          
        case 'slack':
          return `https://slack.com/oauth/v2/authorize?client_id=${clientConfig.clientId}&redirect_uri=${clientConfig.redirectUri}&scope=chat:write,commands&state=${encodeURIComponent(JSON.stringify(stateData))}`
          
        case 'teams':
          return `https://login.microsoftonline.com/${clientConfig.tenantId}/oauth2/v2.0/authorize?client_id=${clientConfig.clientId}&redirect_uri=${clientConfig.redirectUri}&response_type=code&scope=https://graph.microsoft.com/.default&state=${encodeURIComponent(JSON.stringify(stateData))}`
          
        case 'hubspot':
          return `https://app.hubspot.com/oauth/authorize?client_id=${clientConfig.clientId}&redirect_uri=${clientConfig.redirectUri}&scope=contacts%20tickets&state=${encodeURIComponent(JSON.stringify(stateData))}`
          
        default:
          logger.warn(this.serviceName, `⚠️ No hay URL de autorización para este servicio`)
          return null
      }
    } catch (error) {
      logger.error(this.serviceName, `❌ Error generando URL de autorización: ${error.message}`)
      return null
    }
  }

  /**
   * Probar conexión con el servicio
   */
  async testConnection(companyId) {
    try {
      if (!this.isAuthenticated(companyId)) {
        throw new Error('No hay cuenta activa')
      }

      const credential = this.getCurrentCredential(companyId)
      if (!credential) {
        throw new Error('No se encontraron credenciales')
      }

      // Implementación específica por servicio
      switch (this.serviceName) {
        case 'slack':
          // Test: Obtener información del bot
          const slackResponse = await fetch('https://slack.com/api/auth.test', {
            headers: {
              'Authorization': `Bearer ${credential.credentials.botToken}`
            }
          })
          const slackData = await slackResponse.json()
          return slackData.ok
        
        case 'brevo':
          // Test: Obtener información de la cuenta
          const brevoResponse = await fetch('https://api.brevo.com/v3/account', {
            headers: {
              'api-key': credential.credentials.apiKey
            }
          })
          return brevoResponse.ok
        
        case 'whatsappOfficial':
          // Test: Obtener información del número de teléfono
          const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${credential.credentials.phoneNumberId}`, {
            headers: {
              'Authorization': `Bearer ${credential.credentials.accessToken}`
            }
          })
          return whatsappResponse.ok
        
        default:
          logger.info(this.serviceName, `✅ Conexión testeada (no hay endpoint específico)`)
          return true
      }
    } catch (error) {
      logger.error(this.serviceName, `❌ Error testeando conexión: ${error.message}`)
      return false
    }
  }

  /**
   * Obtener instancia específica del servicio
   */
  static getInstance(serviceName) {
    // Mapeo de nombres de servicio para la tabla company_credentials
    const serviceNameMap = {
      'googledrive': 'google_drive',
      'googlemeet': 'google_meet',
      'slack': 'slack',
      'teams': 'microsoft_teams',
      'hubspot': 'hubspot',
      'brevo': 'brevo',
      'whatsapp': 'whatsapp_business',
      'whatsappOfficial': 'whatsapp_official',
      'whatsappWaha': 'whatsapp_waha',
      'telegram': 'telegram'
    }

    const config = {
      googledrive: {
        name: 'Google Drive',
        oauth: {
          scope: 'https://www.googleapis.com/auth/drive'
        }
      },
      googlemeet: {
        name: 'Google Meet',
        oauth: {
          scope: 'https://www.googleapis.com/auth/calendar.events'
        }
      },
      slack: {
        name: 'Slack',
        oauth: {
          scope: 'chat:write,commands'
        }
      },
      teams: {
        name: 'Microsoft Teams',
        oauth: {
          scope: 'https://graph.microsoft.com/.default'
        }
      },
      hubspot: {
        name: 'HubSpot',
        oauth: {
          scope: 'contacts tickets'
        }
      },
      brevo: {
        name: 'Brevo',
        oauth: {}
      },
      whatsapp: {
        name: 'WhatsApp Business',
        oauth: {}
      },
      whatsappOfficial: {
        name: 'WhatsApp Official API',
        oauth: {}
      },
      whatsappWaha: {
        name: 'WhatsApp WAHA API',
        oauth: {}
      },
      telegram: {
        name: 'Telegram Bot',
        oauth: {}
      }
    }

    // Usar el nombre mapeado para la base de datos
    const dbServiceName = serviceNameMap[serviceName] || serviceName
    
    if (!config[serviceName]) {
      throw new Error(`Servicio ${serviceName} no soportado`)
    }

    const manager = new MultiAccountServiceManager(serviceName, config[serviceName])
    // Sobrescribir el serviceName con el nombre de la base de datos
    manager.serviceName = dbServiceName
    
    return manager
  }
}

export default MultiAccountServiceManager