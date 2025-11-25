/**
 * Google Drive Consolidated Service
 * SERVICIO ÚNICO Y OFICIAL para Google Drive Integration
 *
 * Características:
 * - Autenticación centralizada via multiGoogleDriveManager
 * - Soporte multi-cuenta por empresa
 * - Persistencia de tokens en Supabase via googleDrivePersistenceService
 * - Manejo automático de refresh tokens
 * - Compatible con entornos local y Netlify
 * - Logging completo de operaciones
 * - Manejo de errores robusto
 * - Retry automático en caso de token expirado
 */

import multiGoogleDriveManager from './multiGoogleDriveManager.js'
import googleDrivePersistenceService from '../services/googleDrivePersistenceService.js'
import logger from './logger.js'

class GoogleDriveConsolidatedService {
  constructor() {
    this.persistenceService = googleDrivePersistenceService
    this.initialized = false
    this.currentUserId = null
    this.currentCompanyId = null
  }

  /**
   * Inicializa el servicio para un usuario y empresa específicos
   * @param {string} userId - ID del usuario de Supabase
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<boolean>} - Éxito de la inicialización
   */
  async initialize(userId, companyId = null) {
    try {
      if (!userId) {
        throw new Error('userId es requerido para inicializar Google Drive')
      }

      this.currentUserId = userId
      this.currentCompanyId = companyId
      logger.info('GoogleDriveConsolidated', `🔄 Inicializando servicio para usuario ${userId}, empresa ${companyId}...`)

      // 1. Inicializar servicio de autenticación multi-cuenta
      if (companyId) {
        const initResult = await multiGoogleDriveManager.initialize(companyId)
        if (initResult) {
          logger.info('GoogleDriveConsolidated', `✅ MultiGoogleDriveManager inicializado para empresa ${companyId}`)
        } else {
          logger.warn('GoogleDriveConsolidated', '⚠️ No se pudo inicializar MultiGoogleDriveManager completamente')
        }
      } else {
        logger.warn('GoogleDriveConsolidated', '⚠️ No se proporcionó companyId, usando modo limitado')
      }

      // 2. Verificar autenticación
      if (companyId && multiGoogleDriveManager.isAuthenticated(companyId)) {
        logger.info('GoogleDriveConsolidated', '✅ Cuenta de Google Drive autenticada')
        this.initialized = true
        return true
      }

      logger.info('GoogleDriveConsolidated', 'ℹ️ No hay cuenta de Google Drive autenticada')
      this.initialized = true
      return false

    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error inicializando: ${error.message}`)
      this.initialized = false
      return false
    }
  }

  /**
   * Valida que el servicio esté inicializado y autenticado
   */
  validateService() {
    if (!this.initialized) {
      throw new Error('Servicio no inicializado. Llama initialize(userId, companyId) primero.')
    }
    
    if (!this.currentCompanyId || !multiGoogleDriveManager.isAuthenticated(this.currentCompanyId)) {
      throw new Error('Google Drive no está autenticado para esta empresa. Por favor, conecta tu cuenta de Google Drive.')
    }

    if (!this.currentUserId) {
      throw new Error('No hay usuario actual. Re-inicializa el servicio.')
    }
  }

  /**
   * Genera URL de autorización OAuth
   * @returns {string|null} - URL de autorización o null si no está configurado
   */
  generateAuthUrl() {
    try {
      const authUrl = this.authService.generateAuthUrl()
      if (!authUrl) {
        logger.warn('GoogleDriveConsolidated', '⚠️ No se pudo generar URL de autorización')
        return null
      }
      logger.info('GoogleDriveConsolidated', '✅ URL de autorización generada')
      return authUrl
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error generando URL: ${error.message}`)
      return null
    }
  }

  /**
   * Intercambia código OAuth por tokens y los guarda
   * @param {string} code - Código de autorización
   * @returns {Promise<object>} - Tokens obtenidos
   */
  async exchangeCodeForTokens(code) {
    try {
      logger.info('GoogleDriveConsolidated', '🔄 Intercambiando código por tokens...')
      
      const tokens = await this.authService.exchangeCodeForTokens(code)
      
      // Guardar en Supabase
      await this.persistenceService.saveCredentials(this.currentUserId, tokens, {
        email: tokens.email,
        name: tokens.name,
        picture: tokens.picture
      })
      
      logger.info('GoogleDriveConsolidated', '✅ Tokens intercambiados y guardados exitosamente')
      return tokens
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error intercambiando código: ${error.message}`)
      throw error
    }
  }

  /**
   * Crea una carpeta en Google Drive
   * @param {string} name - Nombre de la carpeta
   * @param {string|null} parentId - ID de la carpeta padre
   * @returns {Promise<object>} - Información de la carpeta creada
   */
  async createFolder(name, parentId = null) {
    try {
      logger.info('GoogleDriveConsolidated', `📁 Creando carpeta: "${name}"`)
      this.validateService()

      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder'
      }

      if (parentId) {
        fileMetadata.parents = [parentId]
        logger.info('GoogleDriveConsolidated', `📍 Carpeta padre: ${parentId}`)
      }

      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,parents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${multiGoogleDriveManager.getAccessToken(this.currentCompanyId)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileMetadata)
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveConsolidated', `❌ Error creando carpeta: ${response.status} - ${errorData}`)
        
        // Si es error de autorización, intentar refresh
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.createFolder(name, parentId) // Reintentar
          }
        }
        
        throw new Error(`Error creando carpeta: ${response.status}`)
      }

      const result = await response.json()
      logger.info('GoogleDriveConsolidated', `✅ Carpeta creada: ${result.id}`)
      return result
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en createFolder: ${error.message}`)
      throw error
    }
  }

  /**
   * Lista archivos y carpetas
   * @param {string|null} parentId - ID de la carpeta padre
   * @param {number} pageSize - Cantidad de resultados
   * @returns {Promise<Array>} - Lista de archivos
   */
  async listFiles(parentId = null, pageSize = 100) {
    try {
      logger.info('GoogleDriveConsolidated', `📂 Listando archivos${parentId ? ` en ${parentId}` : ''}`)
      this.validateService()

      let query = "trashed=false"
      if (parentId) {
        query += ` and '${parentId}' in parents`
      }

      const params = new URLSearchParams({
        q: query,
        pageSize: pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents)'
      })

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${multiGoogleDriveManager.getAccessToken(this.currentCompanyId)}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveConsolidated', `❌ Error listando archivos: ${response.status} - ${errorData}`)
        
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.listFiles(parentId, pageSize) // Reintentar
          }
        }
        
        throw new Error(`Error listando archivos: ${response.status}`)
      }

      const data = await response.json()
      logger.info('GoogleDriveConsolidated', `✅ ${data.files?.length || 0} archivos encontrados`)
      return data.files || []
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en listFiles: ${error.message}`)
      throw error
    }
  }

  /**
   * Sube un archivo a Google Drive
   * @param {File} file - Archivo a subir
   * @param {string|null} parentId - ID de la carpeta destino
   * @returns {Promise<object>} - Información del archivo subido
   */
  async uploadFile(file, parentId = null) {
    try {
      logger.info('GoogleDriveConsolidated', `📤 Subiendo archivo: "${file.name}"`)
      this.validateService()

      const fileMetadata = {
        name: file.name
      }

      if (parentId) {
        fileMetadata.parents = [parentId]
      }

      const formData = new FormData()
      formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }))
      formData.append('file', file)

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${multiGoogleDriveManager.getAccessToken(this.currentCompanyId)}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveConsolidated', `❌ Error subiendo archivo: ${response.status} - ${errorData}`)
        
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.uploadFile(file, parentId) // Reintentar
          }
        }
        
        throw new Error(`Error subiendo archivo: ${response.status}`)
      }

      const result = await response.json()
      logger.info('GoogleDriveConsolidated', `✅ Archivo subido: ${result.id}`)
      return result
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en uploadFile: ${error.message}`)
      throw error
    }
  }

  /**
   * Descarga un archivo de Google Drive
   * @param {string} fileId - ID del archivo
   * @returns {Promise<Blob>} - Contenido del archivo
   */
  async downloadFile(fileId) {
    try {
      logger.info('GoogleDriveConsolidated', `⬇️ Descargando archivo: ${fileId}`)
      this.validateService()

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${multiGoogleDriveManager.getAccessToken(this.currentCompanyId)}`
        }
      })

      if (!response.ok) {
        logger.error('GoogleDriveConsolidated', `❌ Error descargando archivo: ${response.status}`)
        
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.downloadFile(fileId) // Reintentar
          }
        }
        
        throw new Error(`Error descargando archivo: ${response.status}`)
      }

      logger.info('GoogleDriveConsolidated', `✅ Archivo descargado: ${fileId}`)
      return await response.blob()
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en downloadFile: ${error.message}`)
      throw error
    }
  }

  /**
   * Elimina un archivo o carpeta
   * @param {string} fileId - ID del archivo/carpeta
   * @returns {Promise<boolean>} - Éxito de la operación
   */
  async deleteFile(fileId) {
    try {
      logger.info('GoogleDriveConsolidated', `🗑️ Eliminando archivo: ${fileId}`)
      this.validateService()

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${multiGoogleDriveManager.getAccessToken(this.currentCompanyId)}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveConsolidated', `❌ Error eliminando archivo: ${response.status} - ${errorData}`)
        
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.deleteFile(fileId) // Reintentar
          }
        }
        
        throw new Error(`Error eliminando archivo: ${response.status}`)
      }

      logger.info('GoogleDriveConsolidated', `✅ Archivo eliminado: ${fileId}`)
      return true
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en deleteFile: ${error.message}`)
      throw error
    }
  }

  /**
   * Obtiene información de un archivo
   * @param {string} fileId - ID del archivo
   * @returns {Promise<object>} - Metadatos del archivo
   */
  async getFileInfo(fileId) {
    try {
      logger.info('GoogleDriveConsolidated', `ℹ️ Obteniendo información: ${fileId}`)
      this.validateService()

      const params = new URLSearchParams({
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents'
      })

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${multiGoogleDriveManager.getAccessToken(this.currentCompanyId)}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveConsolidated', `❌ Error obteniendo información: ${response.status} - ${errorData}`)
        
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.getFileInfo(fileId) // Reintentar
          }
        }
        
        throw new Error(`Error obteniendo información: ${response.status}`)
      }

      const result = await response.json()
      logger.info('GoogleDriveConsolidated', `✅ Información obtenida: ${result.name}`)
      return result
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en getFileInfo: ${error.message}`)
      throw error
    }
  }

  /**
   * Comparte una carpeta con un usuario
   * @param {string} folderId - ID de la carpeta
   * @param {string} email - Email del usuario a compartir
   * @param {string} role - Rol ('reader', 'writer', 'owner')
   * @returns {Promise<object>} - Información del permiso creado
   */
  async shareFolder(folderId, email, role = 'reader') {
    try {
      logger.info('GoogleDriveConsolidated', `🔗 Compartiendo carpeta ${folderId} con ${email} (${role})`)
      this.validateService()

      const permission = {
        type: 'user',
        role: role,
        emailAddress: email
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions?sendNotificationEmail=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authService.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permission)
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveConsolidated', `❌ Error compartiendo carpeta: ${response.status} - ${errorData}`)
        
        if (response.status === 401) {
          logger.info('GoogleDriveConsolidated', '🔄 Token expirado, intentando refresh...')
          const refreshed = await this.authService.refreshAccessToken(this.authService.refreshToken)
          if (refreshed) {
            return this.shareFolder(folderId, email, role) // Reintentar
          }
        }
        
        throw new Error(`Error compartiendo carpeta: ${response.status}`)
      }

      const result = await response.json()
      logger.info('GoogleDriveConsolidated', `✅ Carpeta compartida: ${result.id}`)
      return result
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en shareFolder: ${error.message}`)
      throw error
    }
  }

  /**
   * Obtiene el estado de conexión actual
   * @returns {Promise<object>} - Estado de conexión
   */
  async getConnectionStatus() {
    try {
      if (!this.currentUserId) {
        return { connected: false, email: null, lastSync: null }
      }

      return await this.persistenceService.getConnectionStatus(this.currentUserId)
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error obteniendo estado: ${error.message}`)
      return { connected: false, email: null, lastSync: null }
    }
  }

  /**
   * Desconecta Google Drive (revoca tokens y elimina credenciales)
   * @returns {Promise<object>} - Resultado de la desconexión
   */
  async disconnect() {
    try {
      if (!this.currentUserId) {
        throw new Error('No hay usuario autenticado')
      }

      logger.info('GoogleDriveConsolidated', '🔌 Desconectando Google Drive...')
      
      // Revocar tokens en Google
      await this.persistenceService.revokeTokens(this.currentUserId)
      
      // Limpiar credenciales en Supabase
      const result = await this.persistenceService.disconnect(this.currentUserId)
      
      // Limpiar tokens en auth service
      this.authService.clearTokens()
      
      logger.info('GoogleDriveConsolidated', '✅ Google Drive desconectado exitosamente')
      return result
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en disconnect: ${error.message}`)
      return { success: false, error: { message: error.message } }
    }
  }

  /**
   * Obtiene un token de acceso válido (refrescando si es necesario)
   * @returns {Promise<string|null>} - Token válido o null
   */
  async getValidAccessToken() {
    try {
      if (!this.currentUserId) {
        return null
      }

      const { token, error } = await this.persistenceService.getValidAccessToken(this.currentUserId)
      
      if (error) {
        logger.warn('GoogleDriveConsolidated', `⚠️ Error obteniendo token válido: ${error.message}`)
        return null
      }

      return token
    } catch (error) {
      logger.error('GoogleDriveConsolidated', `❌ Error en getValidAccessToken: ${error.message}`)
      return null
    }
  }

  /**
   * Verifica si hay credenciales válidas configuradas en variables de entorno
   * @returns {boolean} - true si las credenciales están configuradas
   */
  hasValidCredentials() {
    return this.authService.hasValidCredentials()
  }

  /**
   * Limpia el servicio (útil en logout)
   */
  cleanup() {
    logger.info('GoogleDriveConsolidated', '🧹 Limpiando servicio...')
    this.persistenceService.cleanup()
    this.authService.clearTokens()
    this.currentUserId = null
    this.initialized = false
    logger.info('GoogleDriveConsolidated', '✅ Servicio limpiado')
  }
}

// Instancia singleton
const googleDriveConsolidatedService = new GoogleDriveConsolidatedService()

export default googleDriveConsolidatedService
export { GoogleDriveConsolidatedService }