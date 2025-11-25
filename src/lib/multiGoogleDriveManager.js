import { supabase } from './supabase.js'
import logger from './logger.js'

/**
 * MULTI GOOGLE DRIVE MANAGER
 * 
 * Gestiona múltiples cuentas de Google Drive simultáneamente,
 * una por empresa, con aislamiento completo de tokens y sesiones.
 */
class MultiGoogleDriveManager {
  constructor() {
    this.sessions = new Map() // Map<companyId, sessionData>
    this.initialized = false
  }

  // ========================================================
  // INICIALIZACIÓN
  // ========================================================

  async initialize() {
    try {
      logger.info('MultiGoogleDriveManager', '🔄 Inicializando gestor multi-cuenta...')
      
      // Cargar todas las credenciales activas
      await this.loadAllSessions()
      
      this.initialized = true
      logger.info('MultiGoogleDriveManager', '✅ Gestor multi-cuenta inicializado')
      return true
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error inicializando: ${error.message}`)
      return false
    }
  }

  async loadAllSessions() {
    try {
      logger.info('MultiGoogleDriveManager', '📂 Cargando todas las sesiones activas...')
      
      const { data: credentials, error } = await supabase
        .from('company_credentials')
        .select('*')
        .eq('integration_type', 'google_drive')
        .eq('status', 'active')
      
      if (error) throw error
      
      for (const cred of credentials) {
        await this.loadSession(cred.company_id, cred)
      }
      
      logger.info('MultiGoogleDriveManager', `✅ ${credentials.length} sesiones cargadas`)
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error cargando sesiones: ${error.message}`)
    }
  }

  async loadSession(companyId, credential = null) {
    try {
      if (!credential) {
        const { data, error } = await supabase
          .from('company_credentials')
          .select('*')
          .eq('company_id', companyId)
          .eq('integration_type', 'google_drive')
          .eq('status', 'active')
          .single()
        
        if (error) throw error
        credential = data
      }
      
      const parsedCreds = typeof credential.credentials === 'string'
        ? JSON.parse(credential.credentials)
        : credential.credentials
      
      this.sessions.set(companyId, {
        credentialId: credential.id,
        clientId: parsedCreds.clientId,
        clientSecret: parsedCreds.clientSecret,
        accessToken: parsedCreds.access_token || null,
        refreshToken: parsedCreds.refresh_token || null,
        tokenExpiry: parsedCreds.expiry_date || null,
        accountEmail: credential.account_email,
        accountName: credential.account_name,
        lastSync: credential.last_sync,
        isConnected: !!parsedCreds.access_token
      })
      
      logger.info('MultiGoogleDriveManager', `✅ Sesión cargada para empresa ${companyId}`)
      return true
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error cargando sesión ${companyId}: ${error.message}`)
      return false
    }
  }

  // ========================================================
  // GESTIÓN DE TOKENS
  // ========================================================

  getSession(companyId) {
    return this.sessions.get(companyId) || null
  }

  hasSession(companyId) {
    return this.sessions.has(companyId) && this.sessions.get(companyId).isConnected
  }

  async saveTokens(companyId, tokens) {
    try {
      logger.info('MultiGoogleDriveManager', `💾 Guardando tokens para empresa ${companyId}`)
      
      const session = this.sessions.get(companyId)
      if (!session) {
        throw new Error(`No hay sesión para empresa ${companyId}`)
      }
      
      // Actualizar sesión en memoria
      session.accessToken = tokens.access_token
      session.refreshToken = tokens.refresh_token
      session.tokenExpiry = tokens.expiry_date
      session.isConnected = true
      
      // Actualizar en Supabase
      const { error } = await supabase
        .from('company_credentials')
        .update({
          credentials: {
            clientId: session.clientId,
            clientSecret: session.clientSecret,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            scope: tokens.scope || 'https://www.googleapis.com/auth/drive.file'
          },
          status: 'active',
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', session.credentialId)
      
      if (error) throw error
      
      logger.info('MultiGoogleDriveManager', `✅ Tokens guardados para empresa ${companyId}`)
      return true
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error guardando tokens: ${error.message}`)
      return false
    }
  }

  async refreshToken(companyId) {
    try {
      const session = this.sessions.get(companyId)
      if (!session || !session.refreshToken) {
        throw new Error(`No hay refresh token para empresa ${companyId}`)
      }
      
      logger.info('MultiGoogleDriveManager', `🔄 Refrescando token para empresa ${companyId}`)
      
      // Implementar lógica de refresh usando el refresh token
      // Esto requiere llamar a https://oauth2.googleapis.com/token
      
      return true
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error refrescando token: ${error.message}`)
      return false
    }
  }

  // ========================================================
  // OPERACIONES POR EMPRESA
  // ========================================================

  async listFiles(companyId, query = '') {
    try {
      const session = this.sessions.get(companyId)
      if (!session || !session.isConnected) {
        throw new Error(`No hay conexión activa para empresa ${companyId}`)
      }
      
      logger.info('MultiGoogleDriveManager', `📁 Listando archivos para empresa ${companyId}`)
      
      // Implementar llamada a Google Drive API usando session.accessToken
      
      return []
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error listando archivos: ${error.message}`)
      return null
    }
  }

  async createFolder(companyId, folderName, parentId = null) {
    try {
      const session = this.sessions.get(companyId)
      if (!session || !session.isConnected) {
        throw new Error(`No hay conexión activa para empresa ${companyId}`)
      }
      
      logger.info('MultiGoogleDriveManager', `📁 Creando carpeta "${folderName}" para empresa ${companyId}`)
      
      // Implementar creación de carpeta usando Google Drive API
      
      return { success: true, folderId: 'mock-id' }
    } catch (error) {
      logger.error('MultiGoogleDriveManager', `❌ Error creando carpeta: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  // ========================================================
  // UTILIDADES
  // ========================================================

  getConnectedCompanies() {
    const connected = []
    for (const [companyId, session] of this.sessions) {
      if (session.isConnected) {
        connected.push({
          companyId,
          accountEmail: session.accountEmail,
          accountName: session.accountName,
          lastSync: session.lastSync
        })
      }
    }
    return connected
  }

  getAllCompanies() {
    const all = []
    for (const [companyId, session] of this.sessions) {
      all.push({
        companyId,
        accountEmail: session.accountEmail,
        accountName: session.accountName,
        isConnected: session.isConnected,
        lastSync: session.lastSync
      })
    }
    return all
  }

  disconnect(companyId) {
    const session = this.sessions.get(companyId)
    if (session) {
      session.accessToken = null
      session.refreshToken = null
      session.isConnected = false
      logger.info('MultiGoogleDriveManager', `🔌 Desconectando empresa ${companyId}`)
    }
  }

  disconnectAll() {
    for (const companyId of this.sessions.keys()) {
      this.disconnect(companyId)
    }
  }
}

// Exportar instancia única
const multiGoogleDriveManager = new MultiGoogleDriveManager()
export default multiGoogleDriveManager