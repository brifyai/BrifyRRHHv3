/**
 * Google Drive Real Only Service
 * Fuerza el uso de Google Drive real. Si no está configurado, muestra error claro.
 * NO hay fallback a sistema local.
 */

import googleDriveService from './googleDrive.js';
import logger from './logger.js';

class GoogleDriveRealOnly {
  constructor() {
    this.service = googleDriveService;
    this.syncErrors = [];
    this.lastSyncStatus = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa el servicio de Google Drive
   * Verifica que las credenciales estén configuradas
   */
  async initialize() {
    try {
      logger.info('GoogleDriveRealOnly', '🔄 Inicializando Google Drive real...');

      // Verificar credenciales de Google
      if (!this.hasValidGoogleCredentials()) {
        const error = 'Google Drive no está configurado. Se requieren credenciales de Google para usar el sistema de carpetas.';
        logger.error('GoogleDriveRealOnly', `❌ ${error}`);
        throw new Error(error);
      }

      // Intentar inicializar el servicio
      if (this.service.initialize) {
        const success = await this.service.initialize();
        if (!success) {
          throw new Error('No se pudo inicializar el servicio de Google Drive');
        }
      }

      this.isInitialized = true;
      logger.info('GoogleDriveRealOnly', '✅ Google Drive inicializado correctamente');
      return true;
    } catch (error) {
      logger.error('GoogleDriveRealOnly', `❌ Error inicializando: ${error.message}`);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Verifica si las credenciales de Google están configuradas
   */
  hasValidGoogleCredentials() {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
    
    // Verificar que no sean valores por defecto o vacíos
    const hasValidClientId = clientId && 
                           !clientId.includes('YOUR_GOOGLE_CLIENT_ID') && 
                           !clientId.includes('tu_google_client_id') &&
                           clientId.length > 10;
    
    const hasValidClientSecret = clientSecret && 
                               !clientSecret.includes('YOUR_GOOGLE_CLIENT_SECRET') && 
                               !clientSecret.includes('tu_google_client_secret') &&
                               clientSecret.length > 10;

    return hasValidClientId && hasValidClientSecret;
  }

  /**
   * Obtiene el servicio de Google Drive
   */
  getService() {
    if (!this.isInitialized) {
      throw new Error('Google Drive no está inicializado. Verifica la configuración.');
    }

    // Verificar autenticación
    if (!this.isAuthenticated()) {
      throw new Error('Google Drive no está autenticado. Por favor, conecta tu cuenta de Google Drive.');
    }

    return this.service;
  }

  /**
   * Verifica si está autenticado
   */
  isAuthenticated() {
    if (this.service.isAuthenticated) {
      return this.service.isAuthenticated();
    }
    
    // Verificar tokens en localStorage
    const tokenData = localStorage.getItem('google_drive_auth');
    if (!tokenData) {
      return false;
    }

    try {
      const tokens = JSON.parse(tokenData);
      return !!tokens.access_token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Crea una carpeta en Google Drive
   */
  async createFolder(folderName, parentId = null) {
    try {
      const service = this.getService();
      const result = await service.createFolder(folderName, parentId);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ Carpeta creada: ${folderName}`);
      return result;
    } catch (error) {
      const errorMsg = `Error creando carpeta en Google Drive: ${error.message}`;
      logger.error('GoogleDriveRealOnly.createFolder', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Lista archivos en Google Drive
   */
  async listFiles(folderId = null) {
    try {
      const service = this.getService();
      const result = await service.listFiles(folderId);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ ${result.length} archivos listados`);
      return result;
    } catch (error) {
      const errorMsg = `Error listando archivos en Google Drive: ${error.message}`;
      logger.error('GoogleDriveRealOnly.listFiles', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Sube un archivo a Google Drive
   */
  async uploadFile(file, folderId = null) {
    try {
      const service = this.getService();
      const result = await service.uploadFile(file, folderId);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ Archivo subido: ${file.name}`);
      return result;
    } catch (error) {
      const errorMsg = `Error subiendo archivo a Google Drive: ${error.message}`;
      logger.error('GoogleDriveRealOnly.uploadFile', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Descarga un archivo de Google Drive
   */
  async downloadFile(fileId) {
    try {
      const service = this.getService();
      const result = await service.downloadFile(fileId);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ Archivo descargado: ${fileId}`);
      return result;
    } catch (error) {
      const errorMsg = `Error descargando archivo de Google Drive: ${error.message}`;
      logger.error('GoogleDriveRealOnly.downloadFile', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Elimina un archivo de Google Drive
   */
  async deleteFile(fileId) {
    try {
      const service = this.getService();
      const result = await service.deleteFile(fileId);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ Archivo eliminado: ${fileId}`);
      return result;
    } catch (error) {
      const errorMsg = `Error eliminando archivo de Google Drive: ${error.message}`;
      logger.error('GoogleDriveRealOnly.deleteFile', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Obtiene información de un archivo
   */
  async getFileInfo(fileId) {
    try {
      const service = this.getService();
      const result = await service.getFileInfo(fileId);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ Información obtenida: ${fileId}`);
      return result;
    } catch (error) {
      const errorMsg = `Error obteniendo información del archivo: ${error.message}`;
      logger.error('GoogleDriveRealOnly.getFileInfo', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Comparte una carpeta con un usuario
   */
  async shareFolder(folderId, email, role = 'writer') {
    try {
      const service = this.getService();
      const result = await service.shareFolder(folderId, email, role);
      this.lastSyncStatus = 'success';
      logger.info('GoogleDriveRealOnly', `✅ Carpeta compartida con ${email}`);
      return result;
    } catch (error) {
      const errorMsg = `Error compartiendo carpeta en Google Drive: ${error.message}`;
      logger.error('GoogleDriveRealOnly.shareFolder', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Registra errores de sincronización
   */
  recordSyncError(error) {
    this.syncErrors.push({
      timestamp: new Date().toISOString(),
      error: error,
      status: 'failed'
    });
    this.lastSyncStatus = 'error';
    
    // Mantener solo los últimos 50 errores
    if (this.syncErrors.length > 50) {
      this.syncErrors = this.syncErrors.slice(-50);
    }
  }

  /**
   * Obtiene el estado del último sincronización
   */
  getLastSyncStatus() {
    return this.lastSyncStatus;
  }

  /**
   * Obtiene los errores de sincronización
   */
  getSyncErrors() {
    return this.syncErrors;
  }

  /**
   * Limpia los errores de sincronización
   */
  clearSyncErrors() {
    this.syncErrors = [];
  }

  /**
   * Obtiene información del servicio
   */
  getServiceInfo() {
    return {
      service: 'Google Drive Real',
      isReal: true,
      initialized: this.isInitialized,
      hasValidCredentials: this.hasValidGoogleCredentials(),
      isAuthenticated: this.isAuthenticated(),
      features: {
        createFolders: true,
        uploadFiles: true,
        shareFolders: true,
        deleteFiles: true,
        downloadFiles: true
      }
    };
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      serviceType: 'Google Drive Real',
      initialized: this.isInitialized,
      hasValidCredentials: this.hasValidGoogleCredentials(),
      isAuthenticated: this.isAuthenticated(),
      lastSyncStatus: this.lastSyncStatus,
      errorCount: this.syncErrors.length
    };
  }

  /**
   * Genera URL de autenticación
   */
  generateAuthUrl() {
    if (this.service.generateAuthUrl) {
      return this.service.generateAuthUrl();
    }
    return null;
  }

  /**
   * Intercambia código por tokens
   */
  async exchangeCodeForTokens(code) {
    if (this.service.exchangeCodeForTokens) {
      return await this.service.exchangeCodeForTokens(code);
    }
    throw new Error('Método de intercambio de código no disponible');
  }

  /**
   * Limpia el servicio
   */
  cleanup() {
    if (this.service.cleanup) {
      this.service.cleanup();
    }
    this.syncErrors = [];
    this.lastSyncStatus = null;
    this.isInitialized = false;
  }
}

// Crear instancia singleton
const googleDriveRealOnly = new GoogleDriveRealOnly();

// Exportar como hybridGoogleDrive para compatibilidad
export { googleDriveRealOnly as hybridGoogleDrive };
export default googleDriveRealOnly;