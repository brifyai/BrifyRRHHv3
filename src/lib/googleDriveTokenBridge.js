/**
 * Google Drive Token Bridge
 * Sincroniza tokens entre userGoogleDriveService (Supabase) y googleDriveAuthService (localStorage)
 * Permite que googleDriveService use tokens del usuario conectado
 */

import { supabase } from '../lib/supabaseClient.js'
import googleDriveAuthService from './googleDriveAuthService.js'
import logger from './logger.js'

class GoogleDriveTokenBridge {
  constructor() {
    this.currentUserId = null
    this.syncInterval = null
  }

  /**
   * Inicializa el puente para una empresa específica
   */
  async initializeForCompany(companyId) {
    try {
      logger.info('GoogleDriveTokenBridge', `🔗 Inicializando puente para empresa: ${companyId}`)
      
      this.currentCompanyId = companyId
      
      // Sincronizar tokens inmediatamente
      await this.syncTokensFromSupabase(companyId)
      
      // Configurar sincronización periódica cada 5 minutos
      this.startPeriodicSync(companyId)
      
      logger.info('GoogleDriveTokenBridge', '✅ Puente inicializado')
      return true
    } catch (error) {
      logger.error('GoogleDriveTokenBridge', `❌ Error inicializando puente: ${error.message}`)
      return false
    }
  }

  /**
   * Sincroniza tokens de Supabase a localStorage
   */
  async syncTokensFromSupabase(companyId) {
    try {
      logger.info('GoogleDriveTokenBridge', `🔄 Sincronizando tokens de Supabase para company ${companyId}...`)
      
      // Obtener credenciales de Google Drive de la empresa desde Supabase
      // CORREGIDO: Usar company_credentials en lugar de user_google_drive_credentials
      const { data: credentials, error } = await supabase
        .from('company_credentials')
        .select('credentials, google_drive_connected, account_email, account_name, created_at')
        .eq('company_id', companyId)
        .eq('integration_type', 'google_drive')
        .eq('google_drive_connected', true)
        .maybeSingle()
      
      if (error) {
        logger.error('GoogleDriveTokenBridge', `❌ Error obteniendo credenciales: ${error.message}`)
        console.error('Supabase error details:', error)
        return false
      }
      
      if (!credentials) {
        logger.warn('GoogleDriveTokenBridge', `⚠️ No hay credenciales para company ${companyId}`)
        logger.info('GoogleDriveTokenBridge', `📊 Verificar que la tabla company_credentials tiene registros`)
        googleDriveAuthService.clearTokens()
        return false
      }
      
      // Extraer tokens del JSON credentials
      const creds = credentials.credentials || {}
      
      logger.info('GoogleDriveTokenBridge', `📋 Credenciales encontradas:`)
      logger.info('GoogleDriveTokenBridge', `  - google_drive_connected: ${credentials.google_drive_connected}`)
      logger.info('GoogleDriveTokenBridge', `  - email: ${credentials.account_email}`)
      logger.info('GoogleDriveTokenBridge', `  - has_access_token: ${!!creds.access_token}`)
      logger.info('GoogleDriveTokenBridge', `  - has_refresh_token: ${!!creds.refresh_token}`)
      logger.info('GoogleDriveTokenBridge', `  - user_id: ${creds.user_id}`)
      
      // Validar que los tokens existan
      if (!creds.access_token) {
        logger.error('GoogleDriveTokenBridge', '❌ No hay access token en Supabase')
        googleDriveAuthService.clearTokens()
        return false
      }
      
      // Sincronizar tokens a googleDriveAuthService
      const tokens = {
        access_token: creds.access_token,
        refresh_token: creds.refresh_token,
        expires_at: creds.expires_at || null
      }
      
      googleDriveAuthService.setTokens(tokens)
      logger.info('GoogleDriveTokenBridge', `✅ Tokens sincronizados para company ${companyId}`)
      logger.info('GoogleDriveTokenBridge', `✅ googleDriveAuthService.isAuthenticated() = ${googleDriveAuthService.isAuthenticated()}`)
      return true
    } catch (error) {
      logger.error('GoogleDriveTokenBridge', `❌ Error sincronizando tokens: ${error.message}`)
      console.error('Sync error details:', error)
      return false
    }
  }

  /**
   * Inicia sincronización periódica de tokens
   */
  startPeriodicSync(companyId) {
    try {
      // Limpiar intervalo anterior
      if (this.syncInterval) {
        clearInterval(this.syncInterval)
      }
      
      logger.info('GoogleDriveTokenBridge', `⏰ Iniciando sincronización periódica cada 5 minutos`)
      
      // Sincronizar cada 5 minutos
      this.syncInterval = setInterval(async () => {
        try {
          await this.syncTokensFromSupabase(companyId)
        } catch (error) {
          logger.error('GoogleDriveTokenBridge', `❌ Error en sincronización periódica: ${error.message}`)
        }
      }, 5 * 60 * 1000)
    } catch (error) {
      logger.error('GoogleDriveTokenBridge', `❌ Error iniciando sincronización periódica: ${error.message}`)
    }
  }

  /**
   * Detiene la sincronización periódica
   */
  stopPeriodicSync() {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval)
        this.syncInterval = null
        logger.info('GoogleDriveTokenBridge', '⏹️ Sincronización periódica detenida')
      }
    } catch (error) {
      logger.error('GoogleDriveTokenBridge', `❌ Error deteniendo sincronización: ${error.message}`)
    }
  }

  /**
   * Limpia el puente
   */
  cleanup() {
    try {
      logger.info('GoogleDriveTokenBridge', '🧹 Limpiando puente...')
      this.stopPeriodicSync()
      this.currentCompanyId = null
      googleDriveAuthService.clearTokens()
      logger.info('GoogleDriveTokenBridge', '✅ Puente limpiado')
    } catch (error) {
      logger.error('GoogleDriveTokenBridge', `❌ Error limpiando puente: ${error.message}`)
    }
  }

  /**
   * Obtiene la empresa actual
   */
  getCurrentCompanyId() {
    return this.currentCompanyId
  }

  /**
   * Verifica si hay tokens sincronizados
   */
  hasTokens() {
    return googleDriveAuthService.isAuthenticated()
  }
}

const googleDriveTokenBridge = new GoogleDriveTokenBridge()
export default googleDriveTokenBridge
