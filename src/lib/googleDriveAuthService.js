/**
 * GoogleDriveAuthService - Servicio Unificado de Autenticación Google Drive
 * 
 * Corrige los problemas de gestión inconsistente de tokens:
 * - Unifica manejo de tokens en una sola clave
 * - Implementa refresh automático
 * - Validación centralizada
 * - Logging detallado
 */

import { supabase } from './supabase.js';

class GoogleDriveAuthService {
  constructor() {
    this.tokenKey = 'google_drive_tokens_unified';
    this.refreshThreshold = 5 * 60 * 1000; // 5 minutos antes de expirar
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 segundo
  }

  /**
   * Obtener token válido (con refresh automático si es necesario)
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} Access token válido
   */
  async getValidToken(userId) {
    try {
      console.log('🔑 GoogleDriveAuthService: Obteniendo token válido para usuario:', userId);
      
      // 1. Obtener tokens desde Supabase (fuente de verdad)
      const tokens = await this.getTokensFromSupabase(userId);
      
      if (!tokens || !tokens.refresh_token) {
        throw new Error('No hay tokens de Google Drive configurados para este usuario');
      }

      // 2. Verificar si necesita refresh
      if (this.needsRefresh(tokens)) {
        console.log('🔄 GoogleDriveAuthService: Token próximo a expirar, refrescando...');
        const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);
        
        // 3. Guardar tokens actualizados en Supabase
        await this.saveTokensToSupabase(userId, {
          ...refreshedTokens,
          refresh_token: tokens.refresh_token // Mantener el refresh token original
        });
        
        console.log('✅ GoogleDriveAuthService: Token refrescado exitosamente');
        return refreshedTokens.access_token;
      }

      console.log('✅ GoogleDriveAuthService: Token válido, no necesita refresh');
      return tokens.access_token;

    } catch (error) {
      console.error('❌ GoogleDriveAuthService: Error obteniendo token válido:', error);
      throw new Error(`Error de autenticación Google Drive: ${error.message}`);
    }
  }

  /**
   * Obtener tokens desde Supabase
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Tokens almacenados
   */
  async getTokensFromSupabase(userId) {
    try {
      const { data, error } = await supabase
        .from('user_google_drive_credentials')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        token_type: data.token_type || 'Bearer'
      } : null;

    } catch (error) {
      console.error('Error obteniendo tokens desde Supabase:', error);
      return null;
    }
  }

  /**
   * Guardar tokens en Supabase
   * @param {string} userId - ID del usuario
   * @param {Object} tokens - Tokens a guardar
   */
  async saveTokensToSupabase(userId, tokens) {
    try {
      const { error } = await supabase
        .from('user_google_drive_credentials')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          token_type: tokens.token_type || 'Bearer',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('💾 GoogleDriveAuthService: Tokens guardados en Supabase');

    } catch (error) {
      console.error('Error guardando tokens en Supabase:', error);
      throw error;
    }
  }

  /**
   * Verificar si el token necesita refresh
   * @param {Object} tokens - Tokens a verificar
   * @returns {boolean} True si necesita refresh
   */
  needsRefresh(tokens) {
    if (!tokens.expires_at) return true;
    
    const now = Date.now();
    const expiryTime = new Date(tokens.expires_at).getTime();
    
    return (expiryTime - now) < this.refreshThreshold;
  }

  /**
   * Refrescar access token usando refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Nuevos tokens
   */
  async refreshAccessToken(refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google Client ID y Secret no están configurados');
    }

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const requestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 GoogleDriveAuthService: Intento ${attempt}/${this.maxRetries} de refresh token`);
        
        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: requestBody
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${data.error_description || data.error}`);
        }

        console.log('✅ GoogleDriveAuthService: Token refrescado exitosamente');
        
        return {
          access_token: data.access_token,
          expires_at: Date.now() + (data.expires_in * 1000),
          token_type: data.token_type || 'Bearer'
        };

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ GoogleDriveAuthService: Intento ${attempt} falló:`, error.message);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Error refrescando token después de ${this.maxRetries} intentos: ${lastError.message}`);
  }

  /**
   * Validar token haciendo una llamada de prueba a Google Drive
   * @param {string} accessToken - Access token a validar
   * @returns {Promise<boolean>} True si el token es válido
   */
  async validateToken(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.ok;

    } catch (error) {
      console.error('Error validando token:', error);
      return false;
    }
  }

  /**
   * Obtener información del usuario de Google Drive
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información del usuario
   */
  async getUserInfo(userId) {
    try {
      const accessToken = await this.getValidToken(userId);
      
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status} obteniendo info del usuario`);
      }

      const data = await response.json();
      return data.user;

    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      throw error;
    }
  }

  /**
   * Revocar tokens (logout)
   * @param {string} userId - ID del usuario
   */
  async revokeTokens(userId) {
    try {
      const tokens = await this.getTokensFromSupabase(userId);
      
      if (tokens && tokens.access_token) {
        // Revocar en Google
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
          method: 'POST',
          headers: { 'Content-type': 'application/x-www-form-urlencoded' }
        });
      }

      // Eliminar de Supabase
      await supabase
        .from('user_google_drive_credentials')
        .delete()
        .eq('user_id', userId);

      console.log('🔓 GoogleDriveAuthService: Tokens revocados exitosamente');

    } catch (error) {
      console.error('Error revocando tokens:', error);
    }
  }

  /**
   * Verificar estado de autenticación
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estado de autenticación
   */
  async getAuthStatus(userId) {
    try {
      const tokens = await this.getTokensFromSupabase(userId);
      
      if (!tokens) {
        return {
          isAuthenticated: false,
          hasValidToken: false,
          needsRefresh: false,
          expiresAt: null
        };
      }

      const isValid = await this.validateToken(tokens.access_token);
      const needsRefresh = this.needsRefresh(tokens);

      return {
        isAuthenticated: true,
        hasValidToken: isValid,
        needsRefresh: needsRefresh,
        expiresAt: tokens.expires_at,
        tokenType: tokens.token_type
      };

    } catch (error) {
      console.error('Error verificando estado de autenticación:', error);
      return {
        isAuthenticated: false,
        hasValidToken: false,
        needsRefresh: false,
        expiresAt: null,
        error: error.message
      };
    }
  }

  /**
   * Delay helper para reintentos
   * @param {number} ms - Milisegundos a esperar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener estadísticas de uso de tokens
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas
   */
  async getTokenUsageStats(userId) {
    try {
      const authStatus = await this.getAuthStatus(userId);
      
      // Aquí se podrían agregar más estadísticas como:
      // - Número de refreshes realizados
      // - Última vez que se usó el token
      // - Errores de autenticación
      
      return {
        ...authStatus,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas de tokens:', error);
      return {
        isAuthenticated: false,
        hasValidToken: false,
        needsRefresh: false,
        expiresAt: null,
        error: error.message
      };
    }
  }
}

// Crear y exportar instancia única
const googleDriveAuthService = new GoogleDriveAuthService();
export default googleDriveAuthService;
