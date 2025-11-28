/**
 * Google Drive Persistence Service
 * Maneja la persistencia de credenciales de Google Drive en Supabase
 * Sincroniza tokens, maneja expiración y actualización automática
 */

import supabaseDatabase from '../lib/supabaseDatabase.js';

class GoogleDrivePersistenceService {
  constructor() {
    this.tokenRefreshBuffer = 5 * 60 * 1000; // 5 minutos antes de expiración
    this.refreshTimers = new Map();
  }

  /**
   * Guarda credenciales de Google Drive en Supabase
   * @param {string} userId - ID del usuario
   * @param {object} tokens - Tokens de OAuth (access_token, refresh_token, expires_in)
   * @param {object} userInfo - Información del usuario (email, name, picture)
   * @returns {Promise<{success: boolean, data: object, error: object}>}
   */
  async saveCredentials(userId, tokens, userInfo = {}) {
    try {
      if (!userId) {
        throw new Error('userId es requerido');
      }
      if (!tokens || !tokens.access_token) {
        throw new Error('tokens con access_token es requerido');
      }

      const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

      const credentialsData = {
        user_id: userId,
        google_user_id: userInfo.id || null,
        google_email: userInfo.email || null,
        google_name: userInfo.name || null,
        google_avatar_url: userInfo.picture || null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokenExpiresAt.toISOString(),
        scope: tokens.scope || 'https://www.googleapis.com/auth/drive',
        is_active: true,
        is_connected: true,
        last_sync_at: new Date().toISOString(),
        sync_status: 'success'
      };

      // Usar upsert para crear o actualizar
      const { data, error } = await supabaseDatabase.googleDriveCredentials.upsert(credentialsData);

      if (error) {
        console.error('Error guardando credenciales de Google Drive:', error);
        return { success: false, data: null, error };
      }

      console.log('Credenciales de Google Drive guardadas exitosamente');

      // Configurar refresh automático de tokens
      if (tokens.refresh_token) {
        this.scheduleTokenRefresh(userId, tokens.expires_in || 3600);
      }

      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error en saveCredentials:', error);
      return { success: false, data: null, error: { message: error.message } };
    }
  }

  /**
   * Obtiene credenciales de Google Drive del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<{success: boolean, data: object, error: object}>}
   */
  async getCredentials(userId) {
    try {
      if (!userId) {
        throw new Error('userId es requerido');
      }

      const { data, error } = await supabaseDatabase.googleDriveCredentials.getByUserId(userId);

      if (error) {
        console.error('Error obteniendo credenciales:', error);
        return { success: false, data: null, error };
      }

      if (!data) {
        return { success: true, data: null, error: null };
      }

      // Verificar expiración y reprogramar refresh si aplica
      const expiresField = data.token_expires_at || data.expires_at;
      let isExpired = false;
      if (expiresField) {
        const expiresAt = new Date(expiresField);
        const now = new Date();
        isExpired = expiresAt.getTime() <= now.getTime();

        // Si NO está expirado y hay refresh_token, asegurar timer de refresh
        if (!isExpired && data.refresh_token) {
          const msUntilExpiry = Math.max(expiresAt.getTime() - now.getTime(), 0);
          const secondsUntilExpiry = Math.floor(msUntilExpiry / 1000);
          if (!this.refreshTimers.has(userId)) {
            this.scheduleTokenRefresh(userId, secondsUntilExpiry);
          }
        }
      }

      return { success: true, data: { ...data, is_expired: isExpired }, error: null };
    } catch (error) {
      console.error('Error en getCredentials:', error);
      return { success: false, data: null, error: { message: error.message } };
    }
  }

  /**
   * Actualiza tokens de Google Drive
   * @param {string} userId - ID del usuario
   * @param {object} tokens - Nuevos tokens
   * @returns {Promise<{success: boolean, data: object, error: object}>}
   */
  async updateTokens(userId, tokens) {
    try {
      if (!userId) {
        throw new Error('userId es requerido');
      }
      if (!tokens || !tokens.access_token) {
        throw new Error('tokens con access_token es requerido');
      }

      const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

      const updates = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        token_expires_at: tokenExpiresAt.toISOString(),
        last_sync_at: new Date().toISOString(),
        is_active: true,
        is_connected: true,
        sync_status: 'success'
      };

      // Remover undefined
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      const { data, error } = await supabaseDatabase.googleDriveCredentials.update(userId, updates);

      if (error) {
        console.error('Error actualizando tokens:', error);
        return { success: false, data: null, error };
      }

      console.log('Tokens actualizados exitosamente');

      // Reprogramar refresh
      if (tokens.expires_in) {
        this.scheduleTokenRefresh(userId, tokens.expires_in);
      }

      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error en updateTokens:', error);
      return { success: false, data: null, error: { message: error.message } };
    }
  }

  /**
   * Verifica si las credenciales son válidas
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>}
   */
  async isConnected(userId) {
    try {
      const { data, error } = await this.getCredentials(userId);

      if (error || !data) {
        return false;
      }

      // Si está expirado pero hay refresh_token, intentar refrescar antes de declarar desconexión
      if (data.is_expired && data.refresh_token) {
        console.log('🔄 [GoogleDrive] Token expirado, intentando refresh automático...');
        const refreshResult = await this.attemptTokenRefresh(userId);
        
        if (!refreshResult.success) {
          return false;
        }
        
        // Reconsultar credenciales ya refrescadas
        const { data: refreshed } = await this.getCredentials(userId);
        if (!refreshed) return false;
        return refreshed.is_connected === true && refreshed.is_expired !== true;
      }

      return data.is_connected === true && data.is_expired !== true;
    } catch (error) {
      console.error('❌ [GoogleDrive] Error en isConnected:', error);
      return false;
    }
  }

  /**
   * Desconecta Google Drive eliminando credenciales
   * @param {string} userId - ID del usuario
   * @returns {Promise<{success: boolean, error: object}>}
   */
  async disconnect(userId) {
    try {
      if (!userId) {
        throw new Error('userId es requerido');
      }

      // Cancelar refresh timer si existe
      if (this.refreshTimers.has(userId)) {
        clearTimeout(this.refreshTimers.get(userId));
        this.refreshTimers.delete(userId);
      }

      const { error } = await supabaseDatabase.googleDriveCredentials.delete(userId);

      if (error) {
        console.error('Error desconectando Google Drive:', error);
        return { success: false, error };
      }

      console.log('Google Drive desconectado exitosamente');
      return { success: true, error: null };
    } catch (error) {
      console.error('Error en disconnect:', error);
      return { success: false, error: { message: error.message } };
    }
  }

  /**
   * Programa el refresh automático de tokens
   * @param {string} userId - ID del usuario
   * @param {number} expiresIn - Segundos hasta expiración
   */
  scheduleTokenRefresh(userId, expiresIn) {
    try {
      // Cancelar timer anterior si existe
      if (this.refreshTimers.has(userId)) {
        clearTimeout(this.refreshTimers.get(userId));
      }

      // Calcular tiempo de refresh (5 minutos antes de expiración)
      const refreshTime = Math.max((expiresIn * 1000) - this.tokenRefreshBuffer, 60000);

      const timer = setTimeout(async () => {
        console.log(`Intentando refresh automático de tokens para usuario ${userId}`);
        await this.attemptTokenRefresh(userId);
      }, refreshTime);

      this.refreshTimers.set(userId, timer);
      console.log(`Token refresh programado para ${userId} en ${refreshTime}ms`);
    } catch (error) {
      console.error('Error programando token refresh:', error);
    }
  }

  /**
   * Intenta refrescar tokens usando refresh_token
   * @param {string} userId - ID del usuario
   * @returns {Promise<{success: boolean, error: object}>}
   */
  async attemptTokenRefresh(userId) {
    try {
      const { data: credentials, error: getError } = await this.getCredentials(userId);

      // ✅ VALIDACIÓN MEJORADA: Verificar que existan credenciales y refresh token
      if (getError) {
        console.warn('❌ Error obteniendo credenciales:', getError.message);
        return { success: false, error: { message: `Error getting credentials: ${getError.message}` } };
      }

      if (!credentials) {
        console.warn('⚠️ No hay credenciales guardadas para este usuario');
        return { success: false, error: { message: 'No credentials found' } };
      }

      if (!credentials.refresh_token) {
        console.warn('⚠️ No hay refresh token disponible:', {
          userId,
          hasAccessToken: !!credentials.access_token,
          status: credentials.status
        });
        return { success: false, error: { message: 'No refresh token available' } };
      }

      // ✅ VALIDAR VARIABLES DE ENTORNO
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;

      if (!clientId || clientId === 'undefined') {
        console.error('❌ REACT_APP_GOOGLE_CLIENT_ID no está configurado');
        return { success: false, error: { message: 'Google Client ID not configured' } };
      }

      if (!clientSecret || clientSecret === 'undefined') {
        console.error('❌ REACT_APP_GOOGLE_CLIENT_SECRET no está configurado');
        return { success: false, error: { message: 'Google Client Secret not configured' } };
      }

      console.log('🔄 Intentando refrescar token para usuario:', userId);

      // Llamar a endpoint de refresh de Google
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: credentials.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          userId
        });
        throw new Error(`Google token refresh failed: ${response.status} - ${errorText}`);
      }

      const newTokens = await response.json();

      // Actualizar tokens en Supabase
      const { success, error } = await this.updateTokens(userId, newTokens);

      if (!success) {
        console.error('❌ Error actualizando tokens refrescados:', error);
        return { success: false, error };
      }

      console.log('✅ Tokens refrescados exitosamente para usuario:', userId);
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Error en attemptTokenRefresh:', error);
      return { success: false, error: { message: error.message } };
    }
  }

  /**
   * Obtiene el access token válido (refrescando si es necesario)
   * @param {string} userId - ID del usuario
   * @returns {Promise<{token: string, error: object}>}
   */
  async getValidAccessToken(userId) {
    try {
      const { data: credentials, error } = await this.getCredentials(userId);

      if (error || !credentials) {
        return { token: null, error: { message: 'Credenciales no encontradas' } };
      }

      // Si está expirado, intentar refresh
      if (credentials.is_expired && credentials.refresh_token) {
        const { success, error: refreshError } = await this.attemptTokenRefresh(userId);
        if (!success) {
          return { token: null, error: refreshError };
        }

        // Obtener credenciales actualizadas
        const { data: updatedCredentials } = await this.getCredentials(userId);
        return { token: updatedCredentials.access_token, error: null };
      }

      return { token: credentials.access_token, error: null };
    } catch (error) {
      console.error('Error en getValidAccessToken:', error);
      return { token: null, error: { message: error.message } };
    }
  }

  /**
   * Obtiene un estado amigable de conexión para UI
   * @param {string} userId
   * @returns {Promise<{connected: boolean, email: string|null, lastSync: string|null}>}
   */
  async getConnectionStatus(userId) {
    try {
      // Intentar obtener credenciales actuales
      let { data } = await this.getCredentials(userId);
      if (!data) {
        return { connected: false, email: null, lastSync: null };
      }

      // Si están expiradas y hay refresh_token, refrescar en el acto para no "desconectar" visualmente
      const expiresField = data.token_expires_at || data.expires_at;
      const isExpired = expiresField ? new Date(expiresField) <= new Date() : false;

      if (isExpired && data.refresh_token) {
        console.log('🔄 [GoogleDrive] Refrescando token para mantener conexión activa...');
        const refreshed = await this.attemptTokenRefresh(userId);
        
        if (refreshed.success) {
          const res = await this.getCredentials(userId);
          data = res.data || data;
        }
      }

      // Recalcular expiración tras potencial refresh
      const expiresFieldAfter = data.token_expires_at || data.expires_at;
      const isExpiredAfter = expiresFieldAfter ? new Date(expiresFieldAfter) <= new Date() : false;

      return {
        connected: data.is_connected === true && !isExpiredAfter,
        email: data.google_email || data.user_email || null,
        lastSync: data.last_sync_at || data.last_synced_at || null
      };
    } catch (e) {
      console.error('❌ [GoogleDrive] Error en getConnectionStatus:', e);
      return { connected: false, email: null, lastSync: null };
    }
  }

  /**
   * Revoca los tokens de Google del usuario en Google OAuth
   * @param {string} userId
   * @returns {Promise<{success: boolean, error?: object}>}
   */
  async revokeTokens(userId) {
    try {
      const { data: credentials } = await this.getCredentials(userId);
      if (!credentials) return { success: true };

      const tokenToRevoke = credentials.refresh_token || credentials.access_token;
      if (!tokenToRevoke) return { success: true };

      const resp = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: tokenToRevoke })
      });

      if (!resp.ok) {
        console.warn('No se pudo revocar token en Google:', resp.statusText);
        return { success: false, error: { message: resp.statusText } };
      }

      console.log('Tokens de Google revocados correctamente');
      return { success: true };
    } catch (e) {
      console.error('Error revocando tokens de Google:', e);
      return { success: false, error: { message: e.message } };
    }
  }

  /**
   * Restablece completamente la integración: revocar tokens y eliminar credenciales
   * @param {string} userId
   * @returns {Promise<{success: boolean, error?: object}>}
   */
  async hardReset(userId) {
    try {
      // Revocar en Google (si hay tokens)
      await this.revokeTokens(userId);

      // Eliminar registro en Supabase
      const { error } = await supabaseDatabase.googleDriveCredentials.delete(userId);
      if (error) {
        console.error('Error eliminando credenciales en reset:', error);
        return { success: false, error };
      }

      // Limpiar timers locales
      if (this.refreshTimers.has(userId)) {
        clearTimeout(this.refreshTimers.get(userId));
        this.refreshTimers.delete(userId);
      }

      console.log('Hard reset de Google Drive completado para usuario', userId);
      return { success: true };
    } catch (e) {
      console.error('Error en hardReset:', e);
      return { success: false, error: { message: e.message } };
    }
  }

  /**
   * Limpia todos los timers de refresh
   */
  cleanup() {
    this.refreshTimers.forEach(timer => clearTimeout(timer));
    this.refreshTimers.clear();
    console.log('Google Drive Persistence Service limpiado');
  }
}

const googleDrivePersistenceService = new GoogleDrivePersistenceService();
export default googleDrivePersistenceService;
