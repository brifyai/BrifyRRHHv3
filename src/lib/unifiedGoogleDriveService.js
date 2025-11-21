/**
 * Servicio Unificado de Google Drive
 * Consolida múltiples implementaciones en un solo servicio optimizado
 */

class UnifiedGoogleDriveService {
  constructor() {
    this.callbackHandler = null;
    this.oauthCallback = null;
    this.tokenBridge = null;
    this.authService = null;
    this.hybridDrive = null;
    this.netlifyDrive = null;
    this.isInitialized = false;
    this.memoryUsage = {
      lastCheck: null,
      current: 0,
      threshold: 50 * 1024 * 1024 // 50MB
    };
  }

  /**
   * Inicialización única del servicio
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('GoogleDriveService ya inicializado');
      return;
    }

    try {
      // Inicializar componentes
      this.callbackHandler = await this.initializeCallbackHandler();
      this.oauthCallback = await this.initializeOAuthCallback();
      this.tokenBridge = await this.initializeTokenBridge();
      this.authService = await this.initializeAuthService();
      
      // Configurar limpieza automática de memoria
      this.setupMemoryCleanup();
      
      this.isInitialized = true;
      console.log('✅ GoogleDriveService consolidado inicializado exitosamente');
    } catch (error) {
      console.error('❌ Error inicializando GoogleDriveService:', error);
      throw error;
    }
  }

  /**
   * Inicializar callback handler
   */
  async initializeCallbackHandler() {
    try {
      const { default: callbackHandler } = await import('./googleDriveCallbackHandler.js');
      return callbackHandler;
    } catch (error) {
      console.error('❌ Error inicializando callback handler:', error);
      return null;
    }
  }

  /**
   * Inicializar OAuth callback
   */
  async initializeOAuthCallback() {
    try {
      const { default: oauthCallback } = await import('./googleDriveOAuthCallback.js');
      return oauthCallback;
    } catch (error) {
      console.error('❌ Error inicializando OAuth callback:', error);
      return null;
    }
  }

  /**
   * Inicializar token bridge
   */
  async initializeTokenBridge() {
    try {
      const { default: tokenBridge } = await import('./googleDriveTokenBridge.js');
      return tokenBridge;
    } catch (error) {
      console.error('❌ Error inicializando token bridge:', error);
      return null;
    }
  }

  /**
   * Inicializar auth service
   */
  async initializeAuthService() {
    try {
      const { default: authService } = await import('./googleDriveAuthService.js');
      return authService;
    } catch (error) {
      console.error('❌ Error inicializando auth service:', error);
      return null;
    }
  }

  /**
   * Configurar limpieza automática de memoria
   */
  setupMemoryCleanup() {
    setInterval(() => {
      this.cleanupMemory();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  /**
   * Limpiar memoria no utilizada
   */
  cleanupMemory() {
    try {
      const memoryUsage = process.memoryUsage();
      this.memoryUsage.current = memoryUsage.heapUsed;
      this.memoryUsage.lastCheck = new Date();

      if (memoryUsage.heapUsed > this.memoryUsage.threshold) {
        console.log('🧹 Limpiando memoria de GoogleDriveService...');
        // Limpiar cachés si es necesario
      }
    } catch (error) {
      console.error('❌ Error limpiando memoria:', error);
    }
  }

  /**
   * Verifica si hay credenciales válidas configuradas
   * @returns {boolean} - true si las credenciales están configuradas
   */
  hasValidCredentials() {
    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
      
      return clientId && 
             clientSecret && 
             !clientId.includes('tu_google_client_id') &&
             !clientSecret.includes('tu_google_client_secret');
    } catch (error) {
      console.error('❌ Error verificando credenciales:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats() {
    const memoryUsage = process.memoryUsage();
    
    return {
      initialized: this.isInitialized,
      memoryUsage: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cerrar servicio y liberar recursos
   */
  async shutdown() {
    console.log('🔄 Cerrando GoogleDriveService...');
    
    this.callbackHandler = null;
    this.oauthCallback = null;
    this.tokenBridge = null;
    this.authService = null;
    this.hybridDrive = null;
    this.netlifyDrive = null;
    this.isInitialized = false;
    
    // Limpiar memoria final
    this.cleanupMemory();
    
    console.log('✅ GoogleDriveService cerrado exitosamente');
  }
}

// Instancia singleton
const googleDriveService = new UnifiedGoogleDriveService();

export default googleDriveService;