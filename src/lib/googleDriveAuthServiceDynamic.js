/**
 * Google Drive Authentication Service - Dinámico por Empresa
 * Sistema profesional que soporta múltiples cuentas de Google Drive por empresa
 * Elimina configuraciones globales y usa Supabase como fuente principal
 *
 * VERSIÓN: 2.0.1 - Forzar recarga de cache
 * Última modificación: 2025-11-27 19:19:00
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
  async initialize(supabaseClient = null, companyId = null) {
    try {
      logger.info('GoogleDriveAuthServiceDynamic', '🔄 Inicializando servicio dinámico...')
      logger.info('GoogleDriveAuthServiceDynamic', `📥 Parámetros: supabaseClient=${!!supabaseClient}, companyId=${companyId}`)

      // ✅ SOLUCIÓN DEFINITIVA: Usar cliente proporcionado o recuperar automáticamente
      if (supabaseClient) {
        this.supabase = supabaseClient
        logger.info('GoogleDriveAuthServiceDynamic', '✅ Cliente Supabase proporcionado directamente')
      }

      // ✅ SOLUCIÓN DEFINITIVA: Asegurar que tenemos un cliente válido
      const clientReady = await this._ensureSupabaseClient()
      if (!clientReady) {
        logger.error('GoogleDriveAuthServiceDynamic', '❌ No se pudo obtener cliente Supabase válido')
        this.availableCredentials = []
        return false
      }

      logger.info('GoogleDriveAuthServiceDynamic', `✅ Cliente validado: tipo=${typeof this.supabase}, tiene_rpc=${typeof this.supabase.rpc}`)

      this.currentCompanyId = companyId

      // ✅ AHORA sí podemos cargar credenciales
      if (companyId) {
        logger.info('GoogleDriveAuthServiceDynamic', `📂 Cargando credenciales para companyId: ${companyId}`)
        await this.loadCompanyCredentials(companyId)
      }

      this.initialized = true
      logger.info('GoogleDriveAuthServiceDynamic', '✅ Servicio dinámico inicializado exitosamente')
      return true
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error inicializando: ${error.message}`)
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Stack trace: ${error.stack}`)
      this.supabase = null
      this.availableCredentials = []
      return false
    }
  }

  /**
   * Carga las credenciales de Google Drive para una empresa
   */
  // ✅ SOLUCIÓN DEFINITIVA: Método privado para asegurar cliente válido
  async _ensureSupabaseClient() {
    logger.info('GoogleDriveAuthServiceDynamic', `🔍 _ensureSupabaseClient() - Estado inicial: this.supabase=${!!this.supabase}`)
    
    if (this.supabase && typeof this.supabase.rpc === 'function') {
      logger.info('GoogleDriveAuthServiceDynamic', '✅ Cliente ya existe y es válido')
      return true
    }
    
    logger.warn('GoogleDriveAuthServiceDynamic', '⚠️ Cliente Supabase no disponible o inválido, intentando recuperar...')
    
    try {
      // ✅ SOLUCIÓN: Importar directamente desde supabaseClient.js (más confiable)
      logger.info('GoogleDriveAuthServiceDynamic', '📦 Intentando importar desde supabaseClient.js...')
      const supabaseModule = await import('./supabaseClient.js')
      
      logger.info('GoogleDriveAuthServiceDynamic', `📦 Módulo importado: ${Object.keys(supabaseModule)}`)
      logger.info('GoogleDriveAuthServiceDynamic', `📦 supabaseModule.supabase: ${!!supabaseModule.supabase}`)
      logger.info('GoogleDriveAuthServiceDynamic', `📦 Tiene rpc: ${typeof supabaseModule.supabase?.rpc}`)
      
      if (supabaseModule.supabase && typeof supabaseModule.supabase.rpc === 'function') {
        this.supabase = supabaseModule.supabase
        logger.info('GoogleDriveAuthServiceDynamic', '✅ Cliente Supabase recuperado desde supabaseClient.js')
        return true
      }
      
      logger.warn('GoogleDriveAuthServiceDynamic', '⚠️ supabaseClient.js no funcionó, intentando supabase.js...')
      
      // ✅ SOLUCIÓN: Fallback a supabase.js si el primero falla
      const supabaseModule2 = await import('./supabase.js')
      const importedSupabase = supabaseModule2.supabase || supabaseModule2.default?.supabase
      
      logger.info('GoogleDriveAuthServiceDynamic', `📦 supabaseModule2.supabase: ${!!supabaseModule2.supabase}`)
      logger.info('GoogleDriveAuthServiceDynamic', `📦 supabaseModule2.default?.supabase: ${!!supabaseModule2.default?.supabase}`)
      logger.info('GoogleDriveAuthServiceDynamic', `📦 importedSupabase: ${!!importedSupabase}`)
      logger.info('GoogleDriveAuthServiceDynamic', `📦 Tiene rpc: ${typeof importedSupabase?.rpc}`)
      
      if (importedSupabase && typeof importedSupabase.rpc === 'function') {
        this.supabase = importedSupabase
        logger.info('GoogleDriveAuthServiceDynamic', '✅ Cliente Supabase recuperado desde supabase.js')
        return true
      }
      
      logger.error('GoogleDriveAuthServiceDynamic', '❌ No se pudo recuperar cliente Supabase válido de ninguna fuente')
      return false
      
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error recuperando cliente: ${error.message}`)
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Stack: ${error.stack}`)
      return false
    }
  }

  async loadCompanyCredentials(companyId) {
    try {
      logger.info('GoogleDriveAuthServiceDynamic', `📂 Cargando credenciales para empresa ${companyId}...`)
      
      // ✅ SOLUCIÓN DEFINITIVA: Asegurar cliente antes de usarlo
      const clientReady = await this._ensureSupabaseClient()
      if (!clientReady) {
        logger.error('GoogleDriveAuthServiceDynamic', '❌ Cliente Supabase no disponible después de todos los intentos')
        this.availableCredentials = []
        return []
      }
      
      // ✅ VALIDACIÓN FINAL: Verificar que el cliente está listo
      logger.info('GoogleDriveAuthServiceDynamic', `✅ Cliente validado: tipo=${typeof this.supabase}, tiene_rpc=${typeof this.supabase.rpc}`)
      
      // ✅ AHORA sí podemos ejecutar la consulta con seguridad
      const result = await this.supabase
        .from('company_credentials')
        .select('*')
        .eq('company_id', companyId)
        .eq('integration_type', 'google_drive')
        .in('status', ['pending_verification', 'active'])
      
      if (result.error) {
        logger.error('GoogleDriveAuthServiceDynamic', `❌ Error en consulta: ${result.error.message}`)
        this.availableCredentials = []
        return []
      }
      
      this.availableCredentials = result.data || []
      logger.info('GoogleDriveAuthServiceDynamic', `✅ ${this.availableCredentials.length} credenciales cargadas`)
      return this.availableCredentials
      
    } catch (error) {
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Error fatal en loadCompanyCredentials: ${error.message}`)
      logger.error('GoogleDriveAuthServiceDynamic', `❌ Stack: ${error.stack}`)
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
      
      // ✅ SOLUCIÓN: Generar state si no se proporciona
      let finalState = state
      if (!finalState) {
        finalState = JSON.stringify({
          companyId: this.currentCompanyId,
          timestamp: Date.now(),
          nonce: Math.random().toString(36).substring(7)
        })
      }
      
      // ✅ SOLUCIÓN: Guardar state en sessionStorage para validación CSRF
      sessionStorage.setItem('google_oauth_state', finalState)
      logger.info('GoogleDriveAuthServiceDynamic', `🛡️ State CSRF guardado: ${finalState.substring(0, 50)}...`)
      
      const params = new URLSearchParams({
        client_id: clientConfig.clientId,
        redirect_uri: redirectUri,
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: finalState  // ✅ SOLUCIÓN: Siempre incluir state
      })
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      logger.info('GoogleDriveAuthServiceDynamic', `🔗 URL de autorización generada: ${authUrl.substring(0, 100)}...`)
      
      return authUrl
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