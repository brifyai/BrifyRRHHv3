/**
 * AuthContext con Autenticación Personalizada
 * Usa public.users en lugar de Supabase Auth
 * Version: 2.0 - Custom Auth Implementation
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { customAuth } from '../services/customAuthService.js';
import toast from 'react-hot-toast';
import { showFriendlyError, showAuthError } from '../utils/friendlyErrorHandler.js';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar perfil del usuario desde la base de datos
  const loadUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error cargando perfil:', error);
        return null;
      }

      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error en loadUserProfile:', error);
      return null;
    }
  }, []);

  // Inicializar autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Obtener sesión actual
        const { data } = customAuth.getSession();
        
        if (data.session) {
          setUser(data.session.user);
          setIsAuthenticated(true);
          await loadUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = customAuth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  // Registro de usuario
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      
      const { data, error } = await customAuth.signUp(email, password, fullName);
      
      if (error) {
        console.error('Error en registro:', error);
        showAuthError(error);
        return { error };
      }

      if (data.user) {
        toast.success('Registro exitoso');
      }

      return { data };
    } catch (error) {
      console.error('Error en signUp:', error);
      showFriendlyError(error, 'auth', {
        title: 'Error durante el registro',
        confirmButtonText: 'Intentar nuevamente'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Inicio de sesión
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await customAuth.signIn(email, password);
      
      if (error) {
        console.error('Error en inicio de sesión:', error);
        showAuthError(error);
        return { error };
      }

      if (data.user) {
        toast.success('Inicio de sesión exitoso');
      }

      return { data };
    } catch (error) {
      console.error('Error en signIn:', error);
      showFriendlyError(error, 'auth', {
        title: 'Error durante el inicio de sesión',
        confirmButtonText: 'Intentar nuevamente'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await customAuth.signOut();
      
      if (error) {
        console.error('Error cerrando sesión:', error);
        showFriendlyError(error, 'auth', {
          title: 'Error al cerrar sesión',
          confirmButtonText: 'Aceptar'
        });
        return { error };
      }

      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      toast.success('Sesión cerrada');
      
      return { error: null };
    } catch (error) {
      console.error('Error en signOut:', error);
      showFriendlyError(error, 'auth', {
        title: 'Error al cerrar sesión',
        confirmButtonText: 'Aceptar'
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil de usuario
  const updateUserProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando perfil:', error);
        showFriendlyError(error, 'database', {
          title: 'Error al actualizar el perfil',
          confirmButtonText: 'Intentar nuevamente'
        });
        return { error };
      }

      setUserProfile(data);
      toast.success('Perfil actualizado');
      
      return { data };
    } catch (error) {
      console.error('Error en updateUserProfile:', error);
      showFriendlyError(error, 'database', {
        title: 'Error al actualizar el perfil',
        confirmButtonText: 'Intentar nuevamente'
      });
      return { error };
    }
  };

  // Actualizar contraseña
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await customAuth.updatePassword(newPassword);
      
      if (error) {
        console.error('Error actualizando contraseña:', error);
        showFriendlyError(error, 'auth', {
          title: 'Error al actualizar contraseña',
          confirmButtonText: 'Intentar nuevamente'
        });
        return { error };
      }

      toast.success('Contraseña actualizada');
      return { error: null };
    } catch (error) {
      console.error('Error en updatePassword:', error);
      showFriendlyError(error, 'auth', {
        title: 'Error al actualizar contraseña',
        confirmButtonText: 'Intentar nuevamente'
      });
      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    updatePassword,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
