/**
 * Intelligent Hybrid Google Drive Service
 * Sistema híbrido que detecta automáticamente si Google Drive está disponible
 * y usa el sistema local como fallback cuando no está configurado.
 */

import googleDriveService from './googleDrive.js';
import localGoogleDriveService from './localGoogleDrive.js';
import logger from './logger.js';

class IntelligentHybridDrive {
  constructor() {
    this.currentService = null;
    this.serviceType = null; // 'real' | 'local'
    this.isInitialized = false;
    this.localDriveInitialized = false;
    this.realDriveInitialized = false;
    this.syncErrors = [];
    this.lastSyncStatus = null;
  }

  /**
   * Inicializa el servicio híbrido
   * Detecta automáticamente qué servicio usar
   */
  async initialize() {
    try {
      logger.info('IntelligentHybridDrive', '🔄 Inicializando servicio híbrido inteligente...');

      // 1. Intentar inicializar Google Drive real
      const realDriveSuccess = await this.initializeRealDrive();
      
      // 2. Inicializar sistema local (siempre disponible)
      const localDriveSuccess = await this.initializeLocalDrive();

      // 3. Decidir qué servicio usar
      if (realDriveSuccess && this.hasValidGoogleCredentials()) {
        this.currentService = googleDriveService;
        this.serviceType = 'real';
        this.isInitialized = true;
        logger.info('IntelligentHybridDrive', '✅ Usando Google Drive real');
      } else if (localDriveSuccess) {
        this.currentService = localGoogleDriveService;
        this.serviceType = 'local';
        this.isInitialized = true;
        logger.info('IntelligentHybridDrive', '✅ Usando sistema local (Google Drive no configurado)');
      } else {
        throw new Error('No se pudo inicializar ningún servicio de almacenamiento');
      }

      return true;
    } catch (error) {
      logger.error('IntelligentHybridDrive', `❌ Error inicializando: ${error.message}`);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Inicializa Google Drive real
   */
  async initializeRealDrive() {
    try {
      // Verificar si hay credenciales de Google configuradas
      if (!this.hasValidGoogleCredentials()) {
        logger.warn('IntelligentHybridDrive', '⚠️ Credenciales de Google Drive no configuradas');
        return false;
      }

      // Intentar inicializar el servicio real
      if (googleDriveService.initialize) {
        const success = await googleDriveService.initialize();
        this.realDriveInitialized = success;
        return success;
      }

      // Si no tiene método initialize, asumir que está listo
      this.realDriveInitialized = true;
      return true;
    } catch (error) {
      logger.warn('IntelligentHybridDrive', `⚠️ Error inicializando Google Drive real: ${error.message}`);
      this.realDriveInitialized = false;
      return false;
    }
  }

  /**
   * Inicializa el sistema local
   */
  async initializeLocalDrive() {
    try {
      if (localGoogleDriveService.initialize) {
        const success = await localGoogleDriveService.initialize();
        this.localDriveInitialized = success;
        return success;
      }

      // Si no tiene método initialize, asumir que está listo
      this.localDriveInitialized = true;
      return true;
    } catch (error) {
      logger.error('IntelligentHybridDrive', `❌ Error inicializando sistema local: ${error.message}`);
      this.localDriveInitialized = false;
      return false;
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
                           clientId.length > 10;
    
    const hasValidClientSecret = clientSecret && 
                               !clientSecret.includes('YOUR_GOOGLE_CLIENT_SECRET') && 
                               clientSecret.length > 10;

    return hasValidClientId && hasValidClientSecret;
  }

  /**
   * Obtiene el servicio actual
   */
  getService() {
    if (!this.isInitialized) {
      throw new Error('Servicio no inicializado. Llama initialize() primero.');
    }
    return this.currentService;
  }

  /**
   * Crea una carpeta
   */
  async createFolder(folderName, parentId = null) {
    try {
      const service = this.getService();
      const result = await service.createFolder(folderName, parentId);
      this.lastSyncStatus = 'success';
      return result;
    } catch (error) {
      const errorMsg = `Error creando carpeta: ${error.message}`;
      logger.error('IntelligentHybridDrive.createFolder', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Lista archivos
   */
  async listFiles(folderId = null) {
    try {
      const service = this.getService();
      const result = await service.listFiles(folderId);
      this.lastSyncStatus = 'success';
      return result;
    } catch (error) {
      const errorMsg = `Error listando archivos: ${error.message}`;
      logger.error('IntelligentHybridDrive.listFiles', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Sube un archivo
   */
  async uploadFile(file, folderId = null) {
    try {
      const service = this.getService();
      const result = await service.uploadFile(file, folderId);
      this.lastSyncStatus = 'success';
      return result;
    } catch (error) {
      const errorMsg = `Error subiendo archivo: ${error.message}`;
      logger.error('IntelligentHybridDrive.uploadFile', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Descarga un archivo
   */
  async downloadFile(fileId) {
    try {
      const service = this.getService();
      const result = await service.downloadFile(fileId);
      this.lastSyncStatus = 'success';
      return result;
    } catch (error) {
      const errorMsg = `Error descargando archivo: ${error.message}`;
      logger.error('IntelligentHybridDrive.downloadFile', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(fileId) {
    try {
      const service = this.getService();
      const result = await service.deleteFile(fileId);
      this.lastSyncStatus = 'success';
      return result;
    } catch (error) {
      const errorMsg = `Error eliminando archivo: ${error.message}`;
      logger.error('IntelligentHybridDrive.deleteFile', errorMsg);
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
      return result;
    } catch (error) {
      const errorMsg = `Error obteniendo información del archivo: ${error.message}`;
      logger.error('IntelligentHybridDrive.getFileInfo', errorMsg);
      this.recordSyncError(errorMsg);
      throw error;
    }
  }

  /**
   * Comparte una carpeta
   */
  async shareFolder(folderId, email, role = 'writer') {
    try {
      const service = this.getService();
      
      // Solo Google Drive real puede compartir
      if (this.serviceType === 'local') {
        logger.warn('IntelligentHybridDrive', '⚠️ El sistema local no soporta compartir carpetas');
        return { id: folderId, shared: false, message: 'Sistema local - compartir no disponible' };
      }
      
      const result = await service.shareFolder(folderId, email, role);
      this.lastSyncStatus = 'success';
      return result;
    } catch (error) {
      const errorMsg = `Error compartiendo carpeta: ${error.message}`;
      logger.error('IntelligentHybridDrive.shareFolder', errorMsg);
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
      status: 'failed',
      serviceType: this.serviceType
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
   * Verifica si está autenticado (solo para Google Drive real)
   */
  isAuthenticated() {
    if (this.serviceType === 'real') {
      return googleDriveService.isAuthenticated ? googleDriveService.isAuthenticated() : true;
    }
    return true; // El sistema local siempre está "autenticado"
  }

  /**
   * Obtiene información del servicio actual
   */
  getServiceInfo() {
    return {
      service: this.serviceType === 'real' ? 'Google Drive Real' : 'Sistema Local',
      isReal: this.serviceType === 'real',
      initialized: this.isInitialized,
      hasValidCredentials: this.hasValidGoogleCredentials(),
      features: {
        createFolders: true,
        uploadFiles: true,
        shareFolders: this.serviceType === 'real',
        deleteFiles: true,
        downloadFiles: true
      }
    };
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    const serviceStats = this.currentService?.getStats ? this.currentService.getStats() : null;
    
    return {
      serviceType: this.serviceType,
      initialized: this.isInitialized,
      lastSyncStatus: this.lastSyncStatus,
      errorCount: this.syncErrors.length,
      serviceStats: serviceStats
    };
  }

  /**
   * Fuerza el uso de un servicio específico (para testing)
   */
  async forceService(serviceType) {
    if (serviceType === 'local') {
      this.currentService = localGoogleDriveService;
      this.serviceType = 'local';
      this.isInitialized = true;
      logger.info('IntelligentHybridDrive', '✅ Forzado a usar sistema local');
    } else if (serviceType === 'real') {
      if (this.hasValidGoogleCredentials()) {
        this.currentService = googleDriveService;
        this.serviceType = 'real';
        this.isInitialized = true;
        logger.info('IntelligentHybridDrive', '✅ Forzado a usar Google Drive real');
      } else {
        throw new Error('No se puede forzar Google Drive real: credenciales no configuradas');
      }
    }
  }

  /**
   * Limpia el servicio
   */
  cleanup() {
    if (this.currentService?.cleanup) {
      this.currentService.cleanup();
    }
    this.currentService = null;
    this.serviceType = null;
    this.isInitialized = false;
    this.localDriveInitialized = false;
    this.realDriveInitialized = false;
    this.syncErrors = [];
    this.lastSyncStatus = null;
  }
}

// Crear instancia singleton
const intelligentHybridDrive = new IntelligentHybridDrive();

// Exportar como hybridGoogleDrive para compatibilidad
export { intelligentHybridDrive as hybridGoogleDrive };
export default intelligentHybridDrive;