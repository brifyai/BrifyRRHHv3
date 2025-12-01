import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { auth, db } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import unifiedEmployeeFolderService from '../services/unifiedEmployeeFolderService.js'
import { showFriendlyError, showSimpleError, showAuthError } from '../utils/friendlyErrorHandler.js'
import { protectedSupabaseRequest } from '../lib/supabaseCircuitBreaker.js'
import { executeWithEmergencyProtection } from '../lib/emergencyResourceManager.js'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const registrationProcessed = useRef(new Set())
  const profileLoadProcessed = useRef(new Set())
  const currentUserIdRef = useRef(null) // 🔥 SOLUCIÓN: Ref para rastrear usuario actual sin causar re-renders
  const lastUserObjectRef = useRef(null) // 🔥 SOLUCIÓN: Guardar referencia al último objeto user para estabilidad
  const profileLoadInProgressRef = useRef(false) // 🔥 SOLUCIÓN DEFINITIVA: Prevenir llamadas simultáneas
  const profileLoadDebounceRef = useRef(null) // 🔥 NUEVO: Timer para debouncing

  // Función para extraer nombre del email si no hay nombre disponible
  const extractNameFromEmail = (email) => {
    if (!email) return 'Usuario'
    const parts = email.split('@')
    const namePart = parts[0]
    // Reemplazar puntos y guiones con espacios y capitalizar
    return namePart.replace(/[.-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Cargar perfil del usuario desde la base de datos
  const loadUserProfile = useCallback(async (userId, forceReload = false) => {
    try {
      // 🔥 DEBUGGING: Log cada llamada a loadUserProfile
      if (window.infiniteLoopDebugger) {
        window.infiniteLoopDebugger.logRender('ProfileLoad', { userId, forceReload })
      }
      
      // 🔥 NUEVO: Debouncing - Cancelar llamadas previas si es necesario
      if (profileLoadDebounceRef.current) {
        clearTimeout(profileLoadDebounceRef.current)
        profileLoadDebounceRef.current = null
      }
      
      // 🔥 SOLUCIÓN DEFINITIVA: Usar refs para evitar dependencias problemáticas
      const currentUserProfile = userProfile
      const currentUser = user
      
      // 🔥 SOLUCIÓN DEFINITIVA: Verificar si ya tenemos este perfil cargado
      if (!forceReload && currentUserProfile && currentUserProfile.id === userId && profileLoadProcessed.current.has(userId)) {
        console.log(`✅ Perfil ya cargado para usuario ${userId}, retornando caché`)
        return currentUserProfile
      }
      
      // 🔥 SOLUCIÓN DEFINITIVA: Prevenir llamadas simultáneas
      if (profileLoadInProgressRef.current && !forceReload) {
        console.log(`⏳ Carga de perfil ya en progreso para ${userId}, esperando...`)
        // Esperar hasta que la carga actual termine
        let attempts = 0
        while (profileLoadInProgressRef.current && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        if (currentUserProfile && currentUserProfile.id === userId) {
          return currentUserProfile
        }
      }
      
      // 🔥 SOLUCIÓN: Si es un usuario diferente, limpiar el registro
      if (currentUserProfile?.id !== userId) {
        profileLoadProcessed.current.clear()
      }
      
      // 🔥 SOLUCIÓN DEFINITIVA: Marcar que estamos cargando
      profileLoadInProgressRef.current = true
      
      profileLoadProcessed.current.add(userId)
      
      // 🔥 OPTIMIZACIÓN: Usar sistema de emergencia para evitar ERR_INSUFFICIENT_RESOURCES
      const { data, error } = await executeWithEmergencyProtection(
        () => db.users.getById(userId),
        'loadUserProfile.getById'
      )
      
      // Cargar también las credenciales de Google Drive (consultar AMBAS tablas)
      let googleCredentials = null
      try {
        // ✅ NUEVO: Consultar tanto user_credentials como company_credentials
        const { data: userCredData } = await protectedSupabaseRequest(
          () => db.userCredentials.getByUserId(userId),
          'loadUserProfile.getUserCredentials'
        )
        
        // También consultar company_credentials si el usuario tiene empresas asociadas
        let companyCredData = null
        if (data?.company_id) {
          const { data: companyCreds } = await protectedSupabaseRequest(
            () => db.companyCredentials.getByCompanyId(data.company_id, 'google_drive'),
            'loadUserProfile.getCompanyCredentials'
          )
          companyCredData = companyCreds?.[0] || null
        }
        
        // Combinar credenciales (priorizar company_credentials si existe)
        googleCredentials = companyCredData || userCredData
        
        if (!googleCredentials) {
          console.log('No Google credentials found for user:', userId)
        }
      } catch (credError) {
        console.log('Error loading Google credentials:', credError.message)
      }
      
      // Si el usuario no existe (data es null), crearlo
      if (!data && !error) {
        console.log('Usuario no encontrado en la tabla users, creando perfil...')
        
        const userProfileData = {
          id: userId,
          email: currentUser?.email || '',
          full_name: currentUser?.user_metadata?.name ||
                    currentUser?.user_metadata?.full_name ||
                    extractNameFromEmail(currentUser?.email),
          telegram_id: null,
          company_id: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          name: currentUser?.user_metadata?.name || extractNameFromEmail(currentUser?.email),
          current_plan_id: null,
          plan_expiration: null,
          used_storage_bytes: 0,
          registered_via: 'web',
          admin: false,
          onboarding_status: 'pending',
          registro_previo: true,
          // Campos específicos para empleados
          department: null,
          position: 'Empleado',
          phone: null,
          status: 'active',
          role: 'employee',
          employee_id: `EMP-${userId.substring(0, 8).toUpperCase()}`,
          hire_date: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
          salary: null,
          manager_id: null,
          location: 'Chile',
          bio: null,
          avatar_url: currentUser?.user_metadata?.avatar_url || null
        }
        
        // 🔥 OPTIMIZACIÓN: Usar circuit breaker para upsert
        const { data: newUserData, error: createError } = await protectedSupabaseRequest(
          () => db.users.upsert(userProfileData),
          'loadUserProfile.upsertUser'
        )
        
        if (createError) {
          console.error('Error creating user profile:', createError)
          // Establecer perfil básico si falla la creación
          const basicProfile = {
            id: userId,
            full_name: 'Usuario',
            email: currentUser?.email || '',
            current_plan_id: null,
            is_active: true,
            plan_expiration: null,
            tokens_used: 0
          }
          setUserProfile(basicProfile)
          return basicProfile
        }
        
        // 🔥 OPTIMIZACIÓN: Usar circuit breaker para upsert de tokens
        const { error: tokenError } = await protectedSupabaseRequest(
          () => db.userTokensUsage.upsert({
            user_id: userId,
            total_tokens: 0,
            last_updated_at: new Date().toISOString()
          }),
          'loadUserProfile.upsertTokens'
        )
        
        if (tokenError) {
          console.error('Error creating initial token usage record:', tokenError)
        }
        
        setUserProfile(newUserData[0])
        return newUserData[0]
      }
      
      if (error) {
        console.error('Error loading user profile:', error)
        
        // Si es un error de red, mostrar mensaje específico
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Failed to fetch')) {
          console.log('Error de conectividad detectado, usando perfil básico temporal')
          const basicProfile = {
            id: userId,
            full_name: 'Usuario (Sin conexión)',
            email: currentUser?.email || '',
            current_plan_id: null,
            is_active: false,
            plan_expiration: null,
            tokens_used: 0,
            offline: true
          }
          setUserProfile(basicProfile)
          return basicProfile
        }
        
        // Para otros errores, establecer perfil básico
        const basicProfile = {
          id: userId,
          full_name: 'Usuario',
          email: currentUser?.email || '',
          current_plan_id: null,
          is_active: false,
          plan_expiration: null,
          tokens_used: 0
        }
        setUserProfile(basicProfile)
        return basicProfile
      }
      
      // Combinar datos del usuario con credenciales de Google Drive
      const profileWithCredentials = {
        ...data,
        google_refresh_token: googleCredentials?.google_refresh_token || null,
        google_access_token: googleCredentials?.google_access_token || null
      }
      
      setUserProfile(profileWithCredentials)
      return profileWithCredentials
    } catch (error) {
      console.error('Error loading user profile:', error)
      // En caso de error de conectividad, establecer un perfil básico
      const basicProfile = {
        id: userId,
        full_name: 'Usuario',
        email: user?.email || '',
        current_plan_id: null,
        is_active: true,
        plan_expiration: null,
        tokens_used: 0
      }
      setUserProfile(basicProfile)
      return basicProfile
    } finally {
      // 🔥 SOLUCIÓN DEFINITIVA: Asegurar que siempre limpiemos el flag
      profileLoadInProgressRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // 🔥 SOLUCIÓN DEFINITIVA: Sin dependencias para evitar bucles infinitos
  // user y userProfile se acceden via variables locales para evitar re-creación

  // Registro de usuario
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await auth.signUp(email, password, userData)
      
      if (authError) {
        console.error('Error técnico en registro:', authError)
        showAuthError(authError, 'auth')
        return { error: authError }
      }

      // Crear perfil de usuario en la tabla users
      if (authData.user) {
        // Prevenir ejecuciones múltiples del proceso de registro
        const userId = authData.user.id
        if (registrationProcessed.current.has(userId)) {
          console.log('Registro ya procesado para este usuario, omitiendo...')
          return { data: authData }
        }
        registrationProcessed.current.add(userId)
        const userProfileData = {
          id: authData.user.id,
          email: email,
          full_name: userData.name || extractNameFromEmail(email),
          telegram_id: userData.telegram_id || null,
          company_id: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          name: userData.name || extractNameFromEmail(email),
          current_plan_id: null,
          plan_expiration: null,
          used_storage_bytes: 0,
          registered_via: 'web',
          admin: false,
          onboarding_status: 'pending',
          registro_previo: true,
          // Campos específicos para empleados
          department: userData.department || 'General',
          position: userData.position || 'Empleado',
          phone: userData.phone || null,
          status: 'active',
          role: userData.role || 'employee',
          employee_id: `EMP-${authData.user.id.substring(0, 8).toUpperCase()}`,
          hire_date: userData.hire_date || new Date().toISOString().split('T')[0],
          salary: userData.salary || null,
          manager_id: userData.manager_id || null,
          location: userData.location || 'Chile',
          bio: userData.bio || null,
          avatar_url: userData.avatar_url || null
        }

        // Usar upsert para evitar duplicados en caso de re-ejecución
        const { data: profileData, error: profileError } = await db.users.upsert(userProfileData)
        
        if (profileError) {
          console.error('Error técnico creando perfil:', profileError)
          // Solo mostrar error si es un error real, no si es por duplicado
          if (!profileError.message?.includes('duplicate') && !profileError.message?.includes('already exists')) {
            showSimpleError(profileError, 'database')
            return { error: profileError }
          }
          // Si es un error de duplicado, continuar normalmente
          console.log('Perfil de usuario ya existe, continuando...')
        } else {
          console.log('✅ Perfil de usuario creado exitosamente:', profileData)
        }

        // Crear registro inicial en user_tokens_usage usando upsert
        const { error: tokenError } = await db.userTokensUsage.upsert({
          user_id: authData.user.id,
          total_tokens: 0,
          last_updated_at: new Date().toISOString()
        })
        
        if (tokenError) {
          console.error('Error técnico creando registro de tokens:', tokenError)
          // No retornamos error aquí porque no es crítico para el registro
          // El usuario no necesita saber esto
        }

        // Crear carpeta de empleado automáticamente si el usuario tiene email
        if (email && profileData && profileData[0]) {
          try {
            console.log('🔄 Creando carpeta automática para nuevo empleado:', email)
            
            // Preparar datos del empleado para la carpeta
            const employeeData = {
              id: authData.user.id,
              email: email,
              name: userData.name || profileData[0]?.full_name || 'Usuario',
              position: 'Empleado',
              department: 'General',
              phone: '',
              region: 'Metropolitana',
              level: 'Junior',
              work_mode: 'Remoto',
              contract_type: 'Indefinido',
              company_id: null // Se asignará cuando se asocie a una empresa
            }

            const folderResult = await unifiedEmployeeFolderService.createEmployeeFolder(email, employeeData)
            
            if (folderResult.created) {
              console.log('✅ Carpeta de empleado creada automáticamente para:', email)
              toast.success('Carpeta personal creada exitosamente')
            } else if (folderResult.updated) {
              console.log('🔄 Carpeta de empleado actualizada para:', email)
            }
          } catch (folderError) {
            console.error('❌ Error técnico creando carpeta automática:', folderError)
            // No bloqueamos el registro si falla la creación de la carpeta
            showSimpleError('Usuario registrado, pero hubo un error al crear la carpeta personal. Puedes crearla manualmente más tarde.', 'drive')
          }
        }
      }

      toast.success('Registro exitoso. Revisa tu email para confirmar tu cuenta.')
      return { data: authData }
    } catch (error) {
      console.error('Error técnico en signUp:', error)
      showFriendlyError(error, 'auth', {
        title: 'Error durante el registro',
        confirmButtonText: 'Intentar nuevamente'
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Inicio de sesión
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        console.error('Error técnico en inicio de sesión:', error)
        showAuthError(error, 'auth')
        return { error }
      }

      if (data.user) {
        // No llamar loadUserProfile aquí, el useEffect de onAuthStateChange se encargará
        toast.success('Inicio de sesión exitoso')
      }

      return { data }
    } catch (error) {
      console.error('Error técnico en signIn:', error)
      showFriendlyError(error, 'auth', {
        title: 'Error durante el inicio de sesión',
        confirmButtonText: 'Intentar nuevamente'
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Cerrar sesión
  const signOut = async () => {
    try {
      setLoading(true)
      
      const { error } = await auth.signOut()
      
      if (error) {
        console.error('Error técnico en cierre de sesión:', error)
        showSimpleError(error, 'auth')
        return { error }
      }

      setUser(null)
      setUserProfile(null)
      setIsAuthenticated(false)
      // Limpiar registros de procesamiento
      registrationProcessed.current.clear()
      profileLoadProcessed.current.clear()
      toast.success('Sesión cerrada exitosamente')
      
      return { error: null }
    } catch (error) {
      console.error('Error técnico en signOut:', error)
      showFriendlyError(error, 'auth', {
        title: 'Error al cerrar sesión',
        confirmButtonText: 'Aceptar'
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Actualizar perfil de usuario
  const updateUserProfile = async (updates) => {
    try {
      if (!user) return { error: 'No hay usuario autenticado' }
      
      const { data, error } = await db.users.update(user.id, updates)
      
      if (error) {
        console.error('Error técnico actualizando perfil:', error)
        showSimpleError(error, 'database')
        return { error }
      }

      // Recargar el perfil completo para incluir credenciales de Google Drive
      await loadUserProfile(user.id, true)
      toast.success('Perfil actualizado exitosamente')
      return { data }
    } catch (error) {
      console.error('Error técnico en updateUserProfile:', error)
      showFriendlyError(error, 'database', {
        title: 'Error al actualizar el perfil',
        confirmButtonText: 'Intentar nuevamente'
      })
      return { error }
    }
  }

  // Actualizar credenciales de Google Drive
  const updateGoogleDriveCredentials = async (tokens, userInfo = {}) => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado')
      }

      // Importar el servicio de persistencia
      const googleDrivePersistenceService = (await import('../services/googleDrivePersistenceService.js')).default

      // Guardar credenciales en Supabase
      const { success, error } = await googleDrivePersistenceService.saveCredentials(
        user.id,
        tokens,
        userInfo
      )

      if (!success) {
        throw new Error(error?.message || 'Error guardando credenciales')
      }

      // Recargar perfil para actualizar estado de Google Drive
      await loadUserProfile(user.id, true)
      toast.success('Google Drive conectado exitosamente')

      return { success: true, error: null }
    } catch (error) {
      console.error('Error técnico en updateGoogleDriveCredentials:', error)
      showFriendlyError(error, 'drive', {
        title: 'Error conectando Google Drive',
        confirmButtonText: 'Revisar configuración'
      })
      return { success: false, error: { message: error.message } }
    }
  }

  // Obtener estado de conexión de Google Drive
  const getGoogleDriveStatus = async () => {
    try {
      if (!user) {
        return { connected: false, email: null }
      }

      const googleDrivePersistenceService = (await import('../services/googleDrivePersistenceService.js')).default
      return await googleDrivePersistenceService.getConnectionStatus(user.id)
    } catch (error) {
      console.error('Error técnico obteniendo estado de Google Drive:', error)
      // No mostramos error al usuario porque es una verificación en background
      return { connected: false, email: null }
    }
  }

  // Desconectar Google Drive
  const disconnectGoogleDrive = async () => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado')
      }

      const googleDrivePersistenceService = (await import('../services/googleDrivePersistenceService.js')).default
      const { success, error } = await googleDrivePersistenceService.disconnect(user.id)

      if (!success) {
        throw new Error(error?.message || 'Error desconectando Google Drive')
      }

      // Recargar perfil
      await loadUserProfile(user.id, true)
      toast.success('Google Drive desconectado exitosamente')

      return { success: true, error: null }
    } catch (error) {
      console.error('Error técnico en disconnectGoogleDrive:', error)
      showFriendlyError(error, 'drive', {
        title: 'Error desconectando Google Drive',
        confirmButtonText: 'Intentar nuevamente'
      })
      return { success: false, error: { message: error.message } }
    }
  }

  // Obtener token de acceso válido de Google Drive
  const getValidGoogleDriveToken = async () => {
    try {
      if (!user) {
        return { token: null, error: { message: 'No hay usuario autenticado' } }
      }

      const googleDrivePersistenceService = (await import('../services/googleDrivePersistenceService.js')).default
      return await googleDrivePersistenceService.getValidAccessToken(user.id)
    } catch (error) {
      console.error('Error técnico obteniendo token válido:', error)
      // No mostramos error al usuario porque es una operación en background
      return { token: null, error: { message: error.message } }
    }
  }

  // Verificar si el usuario tiene un plan activo
  // Siempre devuelve true para eliminar todas las restricciones de planes
  const hasActivePlan = () => {
    return true
  }

  // Obtener días restantes del plan
  const getDaysRemaining = () => {
    if (!userProfile || !userProfile.plan_expiration) return 0
    
    const expirationDate = new Date(userProfile.plan_expiration)
    const now = new Date()
    const diffTime = expirationDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  // Efecto para verificar sesión inicial
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          
          // Cargar perfil inmediatamente
          try {
            await loadUserProfile(session.user.id)
          } catch (error) {
            console.error('Error loading profile in initialization:', error)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initializeAuth()
  }, [loadUserProfile]) // ✅ FIX: Incluir loadUserProfile en dependencias

  // Efecto para manejar cambios de autenticación
  useEffect(() => {
    let profileLoadTimeout = null
    let visibilityTimeout = null
    let subscription = null
    
    // GUARDAR REF EN VARIABLE LOCAL PARA EVITAR MEMORY LEAK
    const profileLoadProcessedRef = profileLoadProcessed.current
    
    // 🔥 SOLUCIÓN DEFINITIVA: Usar ref para rastrear usuario actual sin causar re-renders
    currentUserIdRef.current = user?.id || null
    
    // Inicializar subscription con manejo de errores
    try {
      const { data: { subscription: sub } } = auth.onAuthStateChange(async (event, session) => {
        console.log('AuthContext: Auth state change event:', event, 'session exists:', !!session)
        
        // Validar estado antes de procesar
        if (!session && event !== 'SIGNED_OUT') {
          console.warn('AuthContext: Evento inesperado sin sesión:', event)
          return
        }
        
        // 🔥 SOLUCIÓN DEFINITIVA: Solo procesar si hay un usuario en la sesión
        if (!session?.user) {
          console.log('AuthContext: No hay usuario en la sesión, limpiando estado...')
          setUser(null)
          setUserProfile(null)
          setIsAuthenticated(false)
          profileLoadProcessedRef.clear()
          currentUserIdRef.current = null
          lastUserObjectRef.current = null // Limpiar referencia
          profileLoadInProgressRef.current = false // Resetear flag
          setLoading(false)
          return
        }
        
        const newUserId = session.user.id
        
        // 🔥 SOLUCIÓN DEFINITIVA: Verificar si el objeto user es realmente diferente
        // Comparar por ID y también verificar si es el mismo objeto
        const isSameUserObject = lastUserObjectRef.current &&
                                 lastUserObjectRef.current.id === newUserId
        
        // 🔥 SOLO actualizar si es un usuario completamente nuevo o diferente
        const shouldUpdateUser = !isSameUserObject || newUserId !== currentUserIdRef.current
        
        if (shouldUpdateUser) {
          console.log(`AuthContext: Usuario ${newUserId} detectado, actualizando estado...`)
          
          // 🔥 Guardar referencia al objeto user para futuras comparaciones
          lastUserObjectRef.current = session.user
          currentUserIdRef.current = newUserId
          
          setUser(session.user)
          setIsAuthenticated(true)
          
          // Limpiar registro si es un usuario diferente
          if (newUserId !== currentUserIdRef.current) {
            profileLoadProcessedRef.clear()
          }
          
          // Debounce para evitar llamadas excesivas
          if (profileLoadTimeout) {
            clearTimeout(profileLoadTimeout)
          }
          
          profileLoadTimeout = setTimeout(async () => {
            try {
              await loadUserProfile(newUserId)
            } catch (error) {
              console.error('Error loading profile in auth state change:', error)
            } finally {
              setLoading(false)
            }
          }, 300)
        } else {
          console.log(`AuthContext: Evento ${event} ignorado (mismo usuario objeto: ${newUserId})`)
          setLoading(false)
        }
      })
      subscription = sub
    } catch (error) {
      console.error('AuthContext: Error inicializando auth subscription:', error)
      setLoading(false)
    }

    // Manejar cambios de visibilidad de la página con throttling
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !loading && !userProfile?.offline && userProfile) {
        // Solo recargar si ya tenemos un perfil (no crear uno nuevo)
        // Throttle para evitar llamadas excesivas
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout)
        }
        
        visibilityTimeout = setTimeout(() => {
          // Recargar datos cuando la página vuelve a ser visible
          loadUserProfile(user.id, true).catch(error => {
            console.error('Error reloading profile on visibility change:', error)
          })
        }, 2000) // Esperar 2 segundos antes de recargar
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Cleanup seguro con validación
      try {
        if (subscription?.unsubscribe) {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.warn('AuthContext: Error en unsubscribe:', error)
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (profileLoadTimeout) clearTimeout(profileLoadTimeout)
      if (visibilityTimeout) clearTimeout(visibilityTimeout)
      
      // Limpiar refs usando la variable local (FIX MEMORY LEAK)
      profileLoadProcessedRef.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    loadUserProfile,
    hasActivePlan,
    getDaysRemaining,
    updateGoogleDriveCredentials,
    getGoogleDriveStatus,
    disconnectGoogleDrive,
    getValidGoogleDriveToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}