/**
 * Google Drive Authentication Service
 * Gestión centralizada de tokens OAuth con validación de expiración y refresh automático
 */

import logger from './logger.js'

class GoogleDriveAuthService {
  constructor() {
    this.accessToken = null
    this.refreshToken = null
    this.expiresAt = null
    this.initialized = false
    this.tokenRefreshTimeout = null
    this.authCallbacks = []
    this.supabase = null
    this.currentUserId = null
  }

  /**
   * Inicializa la conexión a Supabase
   */
  initializeSupabase(supabaseClient, userId) {
    this.supabase = supabaseClient
    this.currentUserId = userId
    logger.info('GoogleDriveAuthService', `🔗 Supabase inicializado para usuario ${userId}`)
  }

  /**
   * Inicializa el servicio restaurando tokens de localStorage
   */
  async initialize() {
    try {
      logger.info('GoogleDriveAuthService', '🔄 Inicializando servicio de autenticación...')
      
      const savedTokens = localStorage.getItem('google_drive_auth')
      if (savedTokens) {
        try {
          const tokens = JSON.parse(savedTokens)
          logger.info('GoogleDriveAuthService', '📦 Tokens encontrados en localStorage')
          
          // Validar si el token aún es válido
          if (this.isTokenValid(tokens)) {
            this.setTokens(tokens)
            logger.info('GoogleDriveAuthService', '✅ Token válido restaurado')
            this.initialized = true
            return true
          } else if (tokens.refresh_token) {
            // Intentar refresh automático
            logger.info('GoogleDriveAuthService', '🔄 Token expirado, intentando refresh...')
            const refreshed = await this.refreshAccessToken(tokens.refresh_token)
            if (refreshed) {
              logger.info('GoogleDriveAuthService', '✅ Token refrescado exitosamente')
              this.initialized = true
              return true
            }
          }
          
          // Si llegamos aquí, los tokens no son válidos
          logger.warn('GoogleDriveAuthService', '⚠️ Tokens inválidos o expirados')
          localStorage.removeItem('google_drive_auth')
        } catch (error) {
          logger.error('GoogleDriveAuthService', `❌ Error restaurando tokens: ${error.message}`)
          localStorage.removeItem('google_drive_auth')
        }
      }
      
      this.initialized = true
      logger.info('GoogleDriveAuthService', '✅ Servicio inicializado (sin tokens)')
      return false
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error inicializando: ${error.message}`)
      return false
    }
  }

  /**
   * Valida si un token aún es válido
   */
  isTokenValid(tokens) {
    if (!tokens || !tokens.access_token) {
      return false
    }
    
    if (!tokens.expires_at) {
      return false
    }
    
    // Considerar token válido si expira en más de 5 minutos
    const now = Date.now()
    const expiresAt = new Date(tokens.expires_at).getTime()
    const bufferMs = 5 * 60 * 1000 // 5 minutos
    
    return expiresAt > (now + bufferMs)
  }

  /**
   * Establece los tokens y configura refresh automático
   */
  setTokens(tokens) {
    try {
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
      
      // Calcular expiración si no viene en los tokens
      if (!tokens.expires_at && tokens.expires_in) {
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
        this.expiresAt = expiresAt
        tokens.expires_at = expiresAt.toISOString()
      } else if (tokens.expires_at) {
        this.expiresAt = new Date(tokens.expires_at)
      }
      
      // Guardar en localStorage
      localStorage.setItem('google_drive_auth', JSON.stringify({
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
        expires_at: this.expiresAt?.toISOString(),
        expires_in: tokens.expires_in
      }))
      
      logger.info('GoogleDriveAuthService', `✅ Tokens guardados (expira en ${this.getTimeUntilExpiry()}ms)`)
      
      // Configurar refresh automático
      this.scheduleTokenRefresh()
      
      // Notificar callbacks
      this.notifyAuthCallbacks('authenticated')
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error guardando tokens: ${error.message}`)
      throw error
    }
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      logger.info('GoogleDriveAuthService', '🔄 Refrescando access token...')
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveAuthService', `❌ Error refrescando token: ${response.status} - ${errorData}`)
        
        // Si el refresh token es inválido, limpiar
        if (response.status === 400 || response.status === 401) {
          this.clearTokens()
        }
        
        return false
      }
      
      const tokens = await response.json()
      
      if (tokens.error) {
        logger.error('GoogleDriveAuthService', `❌ Error en respuesta: ${tokens.error}`)
        this.clearTokens()
        return false
      }
      
      // Mantener el refresh token original si no viene uno nuevo
      if (!tokens.refresh_token) {
        tokens.refresh_token = refreshToken
      }
      
      this.setTokens(tokens)
      logger.info('GoogleDriveAuthService', '✅ Token refrescado exitosamente')
      return true
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error en refresh: ${error.message}`)
      return false
    }
  }

  /**
   * Programa el refresh automático del token
   */
  scheduleTokenRefresh() {
    // Limpiar timeout anterior
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout)
    }
    
    if (!this.expiresAt || !this.refreshToken) {
      return
    }
    
    // Refrescar 5 minutos antes de que expire
    const now = Date.now()
    const expiresAt = this.expiresAt.getTime()
    const bufferMs = 5 * 60 * 1000 // 5 minutos
    const refreshAt = expiresAt - bufferMs - now
    
    if (refreshAt > 0) {
      logger.info('GoogleDriveAuthService', `⏰ Refresh programado en ${refreshAt}ms`)
      
      this.tokenRefreshTimeout = setTimeout(async () => {
        logger.info('GoogleDriveAuthService', '⏰ Ejecutando refresh automático...')
        await this.refreshAccessToken(this.refreshToken)
      }, refreshAt)
    }
  }

  /**
   * Obtiene el tiempo hasta que expire el token (en ms)
   */
  getTimeUntilExpiry() {
    if (!this.expiresAt) {
      return null
    }
    
    const now = Date.now()
    const expiresAt = this.expiresAt.getTime()
    return Math.max(0, expiresAt - now)
  }

  /**
   * Intercambia un código de autorización por tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      logger.info('GoogleDriveAuthService', `🔄 Intercambiando código por tokens...`)
      
      const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI ||
                         (window.location.hostname === 'localhost' ?
                          'http://localhost:3000/auth/google/callback' :
                          `${window.location.origin}/auth/google/callback`)
      
      logger.info('GoogleDriveAuthService', `📍 Redirect URI: ${redirectUri}`)
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveAuthService', `❌ Error intercambiando código: ${response.status} - ${errorData}`)
        
        if (response.status === 400) {
          throw new Error('Código de autorización inválido o expirado. Por favor, intenta conectar Google Drive nuevamente.')
        } else if (response.status === 401) {
          throw new Error('Credenciales de Google inválidas. Verifica la configuración del proyecto.')
        } else {
          throw new Error(`Error de conexión con Google (${response.status}). Intenta nuevamente.`)
        }
      }
      
      const tokens = await response.json()
      
      if (tokens.error) {
        logger.error('GoogleDriveAuthService', `❌ Error en respuesta: ${tokens.error}`)
        throw new Error(`Google API error: ${tokens.error}`)
      }
      
      this.setTokens(tokens)
      logger.info('GoogleDriveAuthService', '✅ Tokens obtenidos exitosamente')
      
      // Guardar en Supabase
      await this.saveCredentialsToSupabase(tokens)
      
      return tokens
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error intercambiando código: ${error.message}`)
      throw error
    }
  }

  /**
   * Guarda las credenciales de Google Drive en Supabase
   */
  async saveCredentialsToSupabase(tokens) {
    try {
      if (!this.supabase || !this.currentUserId) {
        logger.warn('GoogleDriveAuthService', '⚠️ Supabase no inicializado, saltando guardado en BD')
        return false
      }

      logger.info('GoogleDriveAuthService', `💾 Guardando credenciales en Supabase para ${this.currentUserId}...`)

      const credentialsData = {
        user_id: this.currentUserId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_at || new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        is_connected: true,
        is_active: true
      }

      const { error } = await this.supabase
        .from('user_google_drive_credentials')
        .upsert(credentialsData, {
          onConflict: 'user_id'
        })

      if (error) {
        logger.error('GoogleDriveAuthService', `❌ Error guardando en Supabase: ${error.message}`)
        return false
      }

      logger.info('GoogleDriveAuthService', `✅ Credenciales guardadas en Supabase`)
      return true
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error en saveCredentialsToSupabase: ${error.message}`)
      return false
    }
  }

  /**
   * Genera la URL de autorización OAuth
   */
  generateAuthUrl() {
    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
      
      if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        logger.warn('GoogleDriveAuthService', '⚠️ Google Client ID no configurado')
        return null
      }
      
      const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI ||
                         (window.location.hostname === 'localhost' ?
                          'http://localhost:3000/auth/google/callback' :
                          `${window.location.origin}/auth/google/callback`)
      
      logger.info('GoogleDriveAuthService', `🔐 Generando URL de autorización`)
      logger.info('GoogleDriveAuthService', `📍 Redirect URI: ${redirectUri}`)
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent'
      })
      
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error generando URL: ${error.message}`)
      return null
    }
  }

  /**
   * Obtiene el access token actual
   */
  getAccessToken() {
    if (!this.isAuthenticated()) {
      throw new Error('Google Drive no está autenticado')
    }
    return this.accessToken
  }

  /**
   * Verifica si está autenticado
   */
  isAuthenticated() {
    return !!this.accessToken && this.isTokenValid({
      access_token: this.accessToken,
      expires_at: this.expiresAt?.toISOString()
    })
  }

  /**
   * Limpia los tokens
   */
  clearTokens() {
    try {
      logger.info('GoogleDriveAuthService', '🧹 Limpiando tokens...')
      
      this.accessToken = null
      this.refreshToken = null
      this.expiresAt = null
      
      localStorage.removeItem('google_drive_auth')
      
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout)
        this.tokenRefreshTimeout = null
      }
      
      this.notifyAuthCallbacks('unauthenticated')
      logger.info('GoogleDriveAuthService', '✅ Tokens limpiados')
    } catch (error) {
      logger.error('GoogleDriveAuthService', `❌ Error limpiando tokens: ${error.message}`)
    }
  }

  /**
   * Registra un callback para cambios de autenticación
   */
  onAuthChange(callback) {
    this.authCallbacks.push(callback)
  }

  /**
   * Notifica a los callbacks de cambios de autenticación
   */
  notifyAuthCallbacks(status) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        logger.error('GoogleDriveAuthService', `❌ Error en callback: ${error.message}`)
      }
    })
  }

  /**
   * Obtiene información de configuración
   */
  getConfigInfo() {
    return {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Configurado' : 'No configurado',
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET ? 'Configurado' : 'No configurado',
      redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'Auto-detectado',
      isAuthenticated: this.isAuthenticated(),
      tokenExpiresIn: this.getTimeUntilExpiry(),
      hasRefreshToken: !!this.refreshToken
    }
  }
}

// Instancia singleton
const googleDriveAuthService = new GoogleDriveAuthService()

export default googleDriveAuthService
export { GoogleDriveAuthService }
