/**
 * Google Drive Unified Service
 * SERVICIO NUEVO Y OFICIAL basado en documentación oficial de Google Drive API
 * 
 * Características:
 * - Implementación según documentación oficial de Google
 * - Sincronización automática con Supabase
 * - Manejo robusto de errores
 * - Compatible con código existente (no disruptivo)
 * - Logging detallado
 */

import { supabase } from './supabaseClient.js';
import logger from './logger.js';

class GoogleDriveUnifiedService {
  constructor() {
    this.config = {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      redirectUri: `${window.location.origin}/auth/google/callback`,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    };
    
    this.tokenManager = new GoogleDriveTokenManager();
    this.currentUserId = null;
    this.initialized = false;
  }

  /**
   * Inicializa el servicio para un usuario específico
   */
  async initialize(userId) {
    try {
      if (!userId) {
        throw new Error('userId es requerido para inicializar Google Drive');
      }

      this.currentUserId = userId;
      logger.info('GoogleDriveUnifiedService', `🔄 Inicializando para usuario ${userId}...`);

      // Intentar cargar credenciales existentes de Supabase
      await this.loadCredentialsFromSupabase();
      
      this.initialized = true;
      logger.info('GoogleDriveUnifiedService', '✅ Servicio inicializado correctamente');
      return true;
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error inicializando: ${error.message}`);
      return false;
    }
  }

  /**
   * Inicia el proceso de autenticación OAuth 2.0
   */
  async authenticate() {
    try {
      logger.info('GoogleDriveUnifiedService', '🔐 Iniciando autenticación OAuth...');
      
      const authUrl = this.buildAuthUrl();
      logger.info('GoogleDriveUnifiedService', `🔗 Redirigiendo a: ${authUrl}`);
      
      window.location.href = authUrl;
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error en autenticación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Maneja el callback de OAuth y intercambia código por tokens
   */
  async handleCallback(code) {
    try {
      logger.info('GoogleDriveUnifiedService', '🔄 Procesando callback OAuth...');
      
      if (!code) {
        throw new Error('No se recibió código de autorización');
      }

      // Intercambiar código por tokens según documentación oficial
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Guardar tokens en ambas ubicaciones (localStorage + Supabase)
      await this.saveTokens(tokens);
      
      logger.info('GoogleDriveUnifiedService', '✅ Autenticación completada');
      return tokens;
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error en callback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construye la URL de autorización OAuth 2.0
   */
  buildAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline', // CRÍTICO: Para obtener refresh token
      prompt: 'consent',      // CRÍTICO: Para forzar refresh token
      include_granted_scopes: 'true'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Intercambia código de autorización por tokens (según documentación oficial)
   */
  async exchangeCodeForTokens(code) {
    try {
      logger.info('GoogleDriveUnifiedService', '🔄 Intercambiando código por tokens...');
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error OAuth: ${errorData.error_description || errorData.error}`);
      }

      const tokens = await response.json();
      
      // Agregar timestamp de expiración
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      
      logger.info('GoogleDriveUnifiedService', '✅ Tokens obtenidos correctamente');
      return tokens;
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error intercambiando tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Guarda tokens en localStorage Y Supabase (sincronización automática)
   */
  async saveTokens(tokens) {
    try {
      // 1. Guardar en localStorage
      localStorage.setItem('google_drive_auth', JSON.stringify(tokens));
      logger.info('GoogleDriveUnifiedService', '✅ Tokens guardados en localStorage');

      // 2. Guardar en Supabase (CRÍTICO para persistencia)
      if (this.currentUserId) {
        const { error } = await supabase
          .from('user_google_drive_credentials')
          .upsert({
            user_id: this.currentUserId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(tokens.expires_at).toISOString(),
            is_connected: true,
            is_active: true,
            updated_at: new Date().toISOString()
          });

        if (error) {
          logger.warn('GoogleDriveUnifiedService', `⚠️ Error guardando en Supabase: ${error.message}`);
        } else {
          logger.info('GoogleDriveUnifiedService', '✅ Tokens sincronizados con Supabase');
        }
      }
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error guardando tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Carga credenciales desde Supabase
   */
  async loadCredentialsFromSupabase() {
    try {
      if (!this.currentUserId) return false;

      const { data, error } = await supabase
        .from('user_google_drive_credentials')
        .select('*')
        .eq('user_id', this.currentUserId)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.info('GoogleDriveUnifiedService', 'ℹ️ No hay credenciales en Supabase');
        return false;
      }

      if (data) {
        // Restaurar tokens desde Supabase
        const tokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(data.token_expires_at).getTime()
        };

        // Verificar si el token aún es válido
        if (tokens.expires_at > Date.now()) {
          localStorage.setItem('google_drive_auth', JSON.stringify(tokens));
          logger.info('GoogleDriveUnifiedService', '✅ Credenciales restauradas desde Supabase');
          return true;
        } else {
          logger.info('GoogleDriveUnifiedService', '⚠️ Token expirado, requiere refresh');
          return false;
        }
      }

      return false;
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error cargando credenciales: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    try {
      const tokens = localStorage.getItem('google_drive_auth');
      if (!tokens) return false;

      const parsed = JSON.parse(tokens);
      return parsed.expires_at > Date.now();
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error verificando autenticación: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene access token válido (con refresh automático si es necesario)
   */
  async getValidAccessToken() {
    try {
      const tokens = localStorage.getItem('google_drive_auth');
      if (!tokens) {
        throw new Error('No hay tokens de autenticación');
      }

      const parsed = JSON.parse(tokens);
      
      // Si el token aún es válido, usarlo
      if (parsed.expires_at > Date.now()) {
        return parsed.access_token;
      }

      // Si hay refresh token, refrescar
      if (parsed.refresh_token) {
        logger.info('GoogleDriveUnifiedService', '🔄 Refrescando token expirado...');
        const newTokens = await this.tokenManager.refreshAccessToken(parsed.refresh_token);
        await this.saveTokens(newTokens);
        return newTokens.access_token;
      }

      throw new Error('Token expirado y no hay refresh token');
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error obteniendo access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una carpeta real en Google Drive (según documentación oficial)
   */
  async createEmployeeFolder(employeeEmail, employeeName) {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const folderMetadata = {
        name: `${employeeName} (${employeeEmail})`,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(folderMetadata)], 
        { type: 'application/json' }));

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: form
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error creando carpeta: ${errorData.error?.message || 'Error desconocido'}`);
      }

      const folder = await response.json();
      
      logger.info('GoogleDriveUnifiedService', `✅ Carpeta creada: ${folder.id}`);
      return {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink,
        webContentLink: folder.webContentLink
      };
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error creando carpeta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza una carpeta en la base de datos con datos reales de Google Drive
   */
  async updateFolderInDatabase(folderId, googleDriveFolder) {
    try {
      const { error } = await supabase
        .from('employee_folders')
        .update({
          drive_folder_id: googleDriveFolder.id,
          drive_folder_url: googleDriveFolder.webViewLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId);

      if (error) {
        throw error;
      }

      logger.info('GoogleDriveUnifiedService', `✅ Carpeta actualizada en BD: ${folderId}`);
    } catch (error) {
      logger.error('GoogleDriveUnifiedService', `❌ Error actualizando BD: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estado de conexión para UI
   */
  getConnectionStatus() {
    const isAuth = this.isAuthenticated();
    return {
      isConnected: isAuth,
      hasValidToken: isAuth,
      needsReauth: !isAuth,
      message: isAuth ? 'Conectado a Google Drive' : 'No conectado a Google Drive'
    };
  }
}

/**
 * Google Drive Token Manager
 * Manejo de tokens según documentación oficial
 */
class GoogleDriveTokenManager {
  async refreshAccessToken(refreshToken) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error refresh token: ${errorData.error_description || errorData.error}`);
      }

      const tokens = await response.json();
      
      // Mantener el refresh token original
      tokens.refresh_token = refreshToken;
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      
      logger.info('GoogleDriveTokenManager', '✅ Token refrescado correctamente');
      return tokens;
    } catch (error) {
      logger.error('GoogleDriveTokenManager', `❌ Error refrescando token: ${error.message}`);
      throw error;
    }
  }
}

// Exportar instancia singleton
const googleDriveUnifiedService = new GoogleDriveUnifiedService();
export default googleDriveUnifiedService;