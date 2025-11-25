/**
 * Google Drive Authentication Service - Dinámico por Empresa
 * Sistema profesional que soporta múltiples cuentas de Google Drive por empresa
 * Elimina configuraciones globales y usa Supabase como fuente principal
 */

import logger from './logger.js'

class GoogleDriveAuthServiceDynamic {
  constructor() {
    this.supabase = null
    this.currentCompanyId = null
    this.currentCredentialId = null
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
    this.initialized = false
    this.tokenRefreshTimeout = null
    this.authCallbacks = []
    this.availableCredentials = []
  }

  /**
   * Inicializa el servicio con Supabase
   */
  async initialize(supabaseClient, companyId = null) {
    try {
      logger.info('GoogleDriveAuthServiceDynamic', '🔄 Inicializando servicio dinámico...')
      
      this.supabase = supabaseClient
      this.currentCompanyId = companyId
      
      if (companyId) {
        await this.loadCompanyCredentials(companyId)
      }
      
      this.initialized = true
      logger.info('GoogleDriveAuthServiceDynamic', '✅ Servicio dinámico inicializado')
      return true
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error inicializando: ${error.message}`)
      return false
    }
  }

  /**
   * Carga las credenciales de Google Drive para una empresa
   */
  async loadCompanyCredentials(companyId) {
    try {
      logger.info('GoogleDriveAuthServiceDynamic', `📂 Cargando credenciales para empresa ${companyId}...`)
      
      // ✅ SOLUCIÓN: Validación robusta del cliente de Supabase
      if (!this.supabase) {
        logger.warn('GoogleDriveAuthServiceDynamic', '⚠️ Cliente de Supabase es null, retornando array vacío')
        this.availableCredentials = []
        return []
      }
      
      // Verificar que el cliente tenga las propiedades necesarias
      if (typeof this.supabase !== 'object') {
        logger.warn('GoogleDriveAuthServiceDynamic', `⚠️ Cliente de Supabase no es un objeto válido: ${typeof this.supabase}`)
        this.availableCredentials = []
        return []
      }
      
      if (typeof this.supabase.rpc !== 'function') {
        logger.warn('GoogleDriveAuthServiceDynamic', '⚠️ Cliente de Supabase no tiene método rpc, intentando consulta directa...')
        // ✅ SOLUCIÓN: Usar consulta directa en lugar de función RPC
        try {
          const result = await this.supabase
            .from('company_credentials')
            .select('*')
            .eq('company_id', companyId)
            .eq('integration_type', 'google_drive')
            .eq('status', 'pending_verification')
          
          const data = result.data
          const error = result.error
          
          if (error) {
            logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en consulta directa: ${error.message}`)
            this.availableCredentials = []
            return []
          }
          
          this.availableCredentials = data || []
          logger.info('GoogleDriveAuthServiceDynamic', `✅ ${this.availableCredentials.length} credenciales cargadas con consulta directa`)
          return this.availableCredentials
          
        } catch (directError) {
          logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en consulta directa: ${directError.message}`)
          this.availableCredentials = []
          return []
        }
      }
      
      // ✅ SOLUCIÓN: Usar consulta directa en lugar de función RPC
      // La función RPC get_company_credentials no funciona, pero la consulta directa sí
      let data, error
      try {
        logger.info('GoogleDriveAuthServiceDynamic', '🔍 Usando consulta directa a company_credentials...')
        
        const result = await this.supabase
          .from('company_credentials')
          .select('*')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_drive')
          .eq('status', 'pending_verification')
        
        data = result.data
        error = result.error
        
        logger.info('GoogleDriveAuthServiceDynamic', `📊 Consulta directa: ${data?.length || 0} registros encontrados`)
      } catch (queryError) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en consulta directa: ${queryError.message}`)
        this.availableCredentials = []
        return []
      }

      if (error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error cargando credenciales: ${error.message}`)
        this.availableCredentials = []
        return []
      }

      this.availableCredentials = data || []
      logger.info('GoogleDriveAuthServiceDynamic', `✅ ${this.availableCredentials.length} credenciales cargadas con consulta directa`)
      
      return this.availableCredentials
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en loadCompanyCredentials: ${error.message}`)
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Stack trace: ${error.stack}`)
      this.availableCredentials = []
      return []
    }
  }

  /**
   * Obtiene las credenciales disponibles para la empresa actual
   */
  getAvailableCredentials() {
    return this.availableCredentials.map(cred => ({
      id: cred.id,
      accountName: cred.account_name,
      accountEmail: cred.account_email,
      displayName: cred.account_display_name,
      status: cred.status,
      lastUsed: cred.last_used_at,
      expiresAt: cred.expires_at
    }))
  }

  /**
   * Selecciona una credencial específica para usar
   */
  async selectCredential(credentialId) {
    try {
      const credential = this.availableCredentials.find(c => c.id === credentialId)
      if (!credential) {
        throw new Error('Credencial no encontrada')
      }

      if (credential.status !== 'active') {
        throw new Error('La credencial no está activa')
      }

      this.currentCredentialId = credentialId
      const credentials = credential.credentials
      
      // Validar y cargar tokens
      if (credentials.access_token && credentials.refresh_token) {
        this.accessToken = credentials.access_token
        this.refreshToken = credentials.refresh_token
        
        if (credentials.expires_at) {
          this.expiresAt = new Date(credentials.expires_at)
        }

        // Verificar si el token es válido
        if (this.isTokenValid()) {
          logger.info('GoogleDriveAuthServiceDynamic', `✅ Credencial ${credential.account_name} seleccionada y válida`)
          this.scheduleTokenRefresh()
          this.notifyAuthCallbacks('authenticated')
          return true
        } else if (this.refreshToken) {
          // Intentar refresh automático
          logger.info('GoogleDriveAuthServiceDynamic', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            logger.info('GoogleDriveAuthServiceDynamic', '✅ Token refrescado exitosamente')
            this.notifyAuthCallbacks('authenticated')
            return true
          }
        }
      }

      logger.warn('GoogleDriveAuthServiceDynamic', `⚠️ Credencial ${credential.account_name} no tiene tokens válidos`)
      return false
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error seleccionando credencial: ${error.message}`)
      return false
    }
  }

  /**
   * Crea una nueva credencial de Google Drive para la empresa
   */
  async createCredential(companyId, accountName, tokens, settings = {}) {
    try {
      logger.info('GoogleDriveAuthServiceDynamic', `🆕 Creando nueva credencial para empresa ${companyId}...`)
      
      const credentialData = {
        company_id: companyId,
        integration_type: 'google_drive',
        account_name: accountName,
        status: 'active',
        credentials: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at || new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          expires_in: tokens.expires_in
        },
        settings: settings,
        account_email: settings.accountEmail || null,
        account_display_name: settings.displayName || accountName,
        expires_at: tokens.expires_at || new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
      }

      const { data, error } = await this.supabase
        .from('company_credentials')
        .insert(credentialData)
        .select()
        .single()

      if (error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error creando credencial: ${error.message}`)
        throw error
      }

      logger.info('GoogleDriveAuthServiceDynamic', `✅ Credencial creada: ${data.account_name}`)
      
      // Recargar credenciales de la empresa
      await this.loadCompanyCredentials(companyId)
      
      return data
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en createCredential: ${error.message}`)
      throw error
    }
  }

  /**
   * Actualiza una credencial existente
   */
  async updateCredential(credentialId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('company_credentials')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentialId)
        .select()
        .single()

      if (error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error actualizando credencial: ${error.message}`)
        throw error
      }

      logger.info('GoogleDriveAuthServiceDynamic', `✅ Credencial actualizada: ${data.account_name}`)
      
      // Si es la credencial actual, recargar tokens
      if (credentialId === this.currentCredentialId) {
        await this.selectCredential(credentialId)
      }
      
      return data
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en updateCredential: ${error.message}`)
      throw error
    }
  }

  /**
   * Desactiva una credencial
   */
  async deactivateCredential(credentialId) {
    try {
      return await this.updateCredential(credentialId, { status: 'inactive' })
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error desactivando credencial: ${error.message}`)
      throw error
    }
  }

  /**
   * Intercambia código OAuth por tokens y crea credencial
   */
  async exchangeCodeForTokens(companyId, code, accountName, clientConfig) {
    try {
      logger.info('GoogleDriveAuthServiceDynamic', `🔄 Intercambiando código por tokens para empresa ${companyId}...`)
      
      const redirectUri = clientConfig.redirectUri || 
                         (window.location.hostname === 'localhost' ?
                          'http://localhost:3000/auth/google/callback' :
                          `${window.location.origin}/auth/google/callback`)
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientConfig.clientId,
          client_secret: clientConfig.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error intercambiando código: ${response.status} - ${errorData}`)
        throw new Error(`Error de autenticación: ${response.status}`)
      }
      
      const tokens = await response.json()
      
      if (tokens.error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en respuesta: ${tokens.error}`)
        throw new Error(`Google API error: ${tokens.error}`)
      }
      
      // Obtener información del usuario de Google
      const userInfo = await this.getGoogleUserInfo(tokens.access_token)
      
      // Crear credencial en Supabase
      const credential = await this.createCredential(companyId, accountName, tokens, {
        accountEmail: userInfo.email,
        displayName: userInfo.name
      })
      
      logger.info('GoogleDriveAuthServiceDynamic', '✅ Credencial creada exitosamente')
      return credential
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en exchangeCodeForTokens: ${error.message}`)
      throw error
    }
  }

  /**
   * Obtiene información del usuario de Google
   */
  async getGoogleUserInfo(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Error obteniendo información del usuario')
      }
      
      return await response.json()
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error obteniendo userInfo: ${error.message}`)
      return { email: 'unknown', name: 'Unknown User' }
    }
  }

  /**
   * Refresca el access token de la credencial actual
   */
  async refreshAccessToken() {
    try {
      if (!this.currentCredentialId || !this.refreshToken) {
        return false
      }

      const credential = this.availableCredentials.find(c => c.id === this.currentCredentialId)
      if (!credential) {
        return false
      }

      const clientConfig = credential.settings.clientConfig || {}
      
      logger.info('GoogleDriveAuthServiceDynamic', '🔄 Refrescando access token...')
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientConfig.clientId,
          client_secret: clientConfig.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      })
      
      if (!response.ok) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error refrescando token: ${response.status}`)
        
        // Si el refresh falla, marcar credencial como expirada
        await this.updateCredential(this.currentCredentialId, { status: 'expired' })
        return false
      }
      
      const tokens = await response.json()
      
      if (tokens.error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en respuesta: ${tokens.error}`)
        return false
      }
      
      // Mantener el refresh token original
      if (!tokens.refresh_token) {
        tokens.refresh_token = this.refreshToken
      }
      
      // Actualizar credencial con nuevos tokens
      await this.updateCredential(this.currentCredentialId, {
        credentials: {
          ...credential.credentials,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at || new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          expires_in: tokens.expires_in
        }
      })
      
      // Actualizar tokens en memoria
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
      this.expiresAt = new Date(tokens.expires_at || Date.now() + (tokens.expires_in || 3600) * 1000)
      
      logger.info('GoogleDriveAuthServiceDynamic', '✅ Token refrescado exitosamente')
      return true
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en refreshAccessToken: ${error.message}`)
      return false
    }
  }

  /**
   * Valida si el token actual es válido
   */
  isTokenValid() {
    if (!this.accessToken || !this.expiresAt) {
      return false
    }
    
    const now = Date.now()
    const expiresAt = this.expiresAt.getTime()
    const bufferMs = 5 * 60 * 1000 // 5 minutos
    
    return expiresAt > (now + bufferMs)
  }

  /**
   * Programa el refresh automático del token
   */
  scheduleTokenRefresh() {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout)
    }
    
    if (!this.expiresAt || !this.refreshToken) {
      return
    }
    
    const now = Date.now()
    const expiresAt = this.expiresAt.getTime()
    const bufferMs = 5 * 60 * 1000
    const refreshAt = expiresAt - bufferMs - now
    
    if (refreshAt > 0) {
      logger.info('GoogleDriveAuthServiceDynamic', `⏰ Refresh programado en ${refreshAt}ms`)
      
      this.tokenRefreshTimeout = setTimeout(async () => {
        logger.info('GoogleDriveAuthServiceDynamic', '⏰ Ejecutando refresh automático...')
        await this.refreshAccessToken()
      }, refreshAt)
    }
  }

  /**
   * Genera URL de autorización OAuth
   */
  generateAuthUrl(clientConfig, state = null) {
    try {
      const redirectUri = clientConfig.redirectUri || 
                         (window.location.hostname === 'localhost' ?
                          'http://localhost:3000/auth/google/callback' :
                          `${window.location.origin}/auth/google/callback`)
      
      const params = new URLSearchParams({
        client_id: clientConfig.clientId,
        redirect_uri: redirectUri,
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent'
      })
      
      if (state) {
        params.append('state', state)
      }
      
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error generando URL: ${error.message}`)
      return null
    }
  }

  /**
   * Obtiene el access token actual
   */
  getAccessToken() {
    if (!this.isAuthenticated()) {
      throw new Error('Google Drive no está autenticado o token expirado')
    }
    return this.accessToken
  }

  /**
   * Verifica si está autenticado
   */
  isAuthenticated() {
    return !!this.accessToken && this.isTokenValid()
  }

  /**
   * Obtiene información de la credencial actual
   */
  getCurrentCredential() {
    if (!this.currentCredentialId) {
      return null
    }
    
    return this.availableCredentials.find(c => c.id === this.currentCredentialId)
  }

  /**
   * Limpia la sesión actual
   */
  clearCurrentSession() {
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
    this.currentCredentialId = null
    
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout)
      this.tokenRefreshTimeout = null
    }
    
    this.notifyAuthCallbacks('unauthenticated')
    logger.info('GoogleDriveAuthServiceDynamic', '✅ Sesión actual limpiada')
  }

  /**
   * Registra callback para cambios de autenticación
   */
  onAuthChange(callback) {
    this.authCallbacks.push(callback)
  }

  /**
   * Notifica a los callbacks de cambios
   */
  notifyAuthCallbacks(status) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(status, this.getCurrentCredential())
      } catch (error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en callback: ${error.message}`)
      }
    })
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getServiceStats() {
    return {
      initialized: this.initialized,
      currentCompanyId: this.currentCompanyId,
      currentCredentialId: this.currentCredentialId,
      availableCredentials: this.availableCredentials.length,
      isAuthenticated: this.isAuthenticated(),
      hasValidToken: this.isTokenValid(),
      timeUntilExpiry: this.expiresAt ? this.expiresAt.getTime() - Date.now() : null
    }
  }
}

// Instancia singleton
const googleDriveAuthServiceDynamic = new GoogleDriveAuthServiceDynamic()

export default googleDriveAuthServiceDynamic
export { GoogleDriveAuthServiceDynamic }