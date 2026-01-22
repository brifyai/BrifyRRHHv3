/**
 * Servicio de Autenticación Personalizado
 * Usa public.users en lugar de Supabase Auth
 */

import { supabase } from '../lib/supabaseConfig.js';

class CustomAuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(email, password) {
    try {
      // Llamar a la función de verificación de contraseña
      const { data, error } = await supabase
        .rpc('verify_password', {
          user_email: email,
          password: password
        });

      if (error) {
        console.error('Error en signIn:', error);
        return { 
          data: null, 
          error: { message: 'Credenciales inválidas' } 
        };
      }

      if (!data || data.length === 0) {
        return { 
          data: null, 
          error: { message: 'Email o contraseña incorrectos' } 
        };
      }

      const user = data[0];

      // Crear sesión en localStorage
      const session = {
        user: {
          id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active
        },
        access_token: this.generateToken(user.user_id),
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };

      localStorage.setItem('custom_auth_session', JSON.stringify(session));

      return { 
        data: { user: session.user, session }, 
        error: null 
      };
    } catch (error) {
      console.error('Error en signIn:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Error al iniciar sesión' } 
      };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async signUp(email, password, fullName = null) {
    try {
      const { data, error } = await supabase
        .rpc('create_user_with_password', {
          user_email: email,
          password: password,
          user_full_name: fullName,
          user_role: 'user'
        });

      if (error) {
        console.error('Error en signUp:', error);
        return { 
          data: null, 
          error: { message: 'Error al crear usuario' } 
        };
      }

      // Iniciar sesión automáticamente después del registro
      return await this.signIn(email, password);
    } catch (error) {
      console.error('Error en signUp:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Error al registrar usuario' } 
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut() {
    try {
      localStorage.removeItem('custom_auth_session');
      return { error: null };
    } catch (error) {
      console.error('Error en signOut:', error);
      return { error: { message: error.message } };
    }
  }

  /**
   * Obtener sesión actual
   */
  getSession() {
    try {
      const sessionStr = localStorage.getItem('custom_auth_session');
      if (!sessionStr) {
        return { data: { session: null }, error: null };
      }

      const session = JSON.parse(sessionStr);

      // Verificar si la sesión expiró
      if (session.expires_at < Date.now()) {
        localStorage.removeItem('custom_auth_session');
        return { data: { session: null }, error: null };
      }

      return { data: { session }, error: null };
    } catch (error) {
      console.error('Error en getSession:', error);
      return { data: { session: null }, error: { message: error.message } };
    }
  }

  /**
   * Obtener usuario actual
   */
  async getUser() {
    const { data } = this.getSession();
    if (!data.session) {
      return { data: { user: null }, error: null };
    }

    // Obtener datos actualizados del usuario desde la BD
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_active, avatar_url, phone, department, position')
        .eq('id', data.session.user.id)
        .single();

      if (error) {
        console.error('Error obteniendo usuario:', error);
        return { data: { user: data.session.user }, error: null };
      }

      // Actualizar sesión con datos frescos
      const session = data.session;
      session.user = {
        ...session.user,
        ...userData
      };
      localStorage.setItem('custom_auth_session', JSON.stringify(session));

      return { data: { user: userData }, error: null };
    } catch (error) {
      console.error('Error en getUser:', error);
      return { data: { user: data.session.user }, error: null };
    }
  }

  /**
   * Actualizar contraseña
   */
  async updatePassword(newPassword) {
    const { data } = this.getSession();
    if (!data.session) {
      return { error: { message: 'No hay sesión activa' } };
    }

    try {
      const { data: result, error } = await supabase
        .rpc('update_user_password', {
          user_id: data.session.user.id,
          new_password: newPassword
        });

      if (error) {
        console.error('Error actualizando contraseña:', error);
        return { error: { message: 'Error al actualizar contraseña' } };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error en updatePassword:', error);
      return { error: { message: error.message } };
    }
  }

  /**
   * Generar token simple (en producción usar JWT real)
   */
  generateToken(userId) {
    return btoa(`${userId}:${Date.now()}:${Math.random()}`);
  }

  /**
   * Escuchar cambios de autenticación
   */
  onAuthStateChange(callback) {
    // Verificar sesión inicial
    const { data } = this.getSession();
    if (data.session) {
      callback('SIGNED_IN', data.session);
    } else {
      callback('SIGNED_OUT', null);
    }

    // Escuchar cambios en localStorage (para múltiples tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'custom_auth_session') {
        if (e.newValue) {
          const session = JSON.parse(e.newValue);
          callback('SIGNED_IN', session);
        } else {
          callback('SIGNED_OUT', null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Retornar función de cleanup
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          }
        }
      }
    };
  }
}

// Exportar instancia única
export const customAuth = new CustomAuthService();
export default customAuth;
