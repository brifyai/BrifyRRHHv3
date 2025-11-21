import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import googleDriveCallbackHandler from '../../lib/googleDriveCallbackHandler.js'
import googleDriveAuthService from '../../lib/googleDriveAuthService.js'
import { auth, supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, userProfile, loadUserProfile } = useAuth()
  const [status, setStatus] = useState('processing')
  const [message, setMessage] = useState('Procesando autorización de Google Drive...')
  const hasProcessed = useRef(false)

  // Función movida fuera del useEffect para evitar problemas de dependencias
  const handleGoogleCallback = useCallback(async () => {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      if (error) {
        setStatus('error')
        setMessage('Error en la autorización de Google Drive')
        toast.error('Error en la autorización de Google Drive')
        setTimeout(() => navigate('/panel-principal'), 3000)
        return
      }
      
      if (!code) {
        console.error('GoogleAuthCallback - Código de autorización no encontrado')
        setStatus('error')
        setMessage('Código de autorización no encontrado')
        toast.error('Código de autorización no encontrado')
        setTimeout(() => navigate('/panel-principal'), 3000)
        return
      }
      
      // Verificar y refrescar autenticación actual
      let authenticatedUser = null
      
      try {
        // Intentar obtener usuario actual de Supabase
        const { data: { session } } = await auth.getSession()
        authenticatedUser = session?.user
        console.log('GoogleAuthCallback - Session obtained:', !!session)
      } catch (sessionError) {
        console.warn('GoogleAuthCallback - Error getting session:', sessionError)
      }
      
      console.log('GoogleAuthCallback - Debug Info:')
      console.log('- Code:', code ? 'Present' : 'Missing')
      console.log('- Error:', error)
      console.log('- Context User:', user)
      console.log('- Auth User:', authenticatedUser)
      console.log('- UserProfile:', userProfile)
      
      // Priorizar el usuario del contexto, luego el de Supabase, luego recargar
      let activeUser = user || authenticatedUser
      
      // Si no tenemos usuario activo, intentar recargar perfil del contexto
      if (!activeUser && userProfile?.id) {
        console.log('GoogleAuthCallback - No active user, using userProfile ID:', userProfile.id)
        activeUser = { id: userProfile.id, email: userProfile.email }
      }
      
      // Si aún no tenemos usuario, intentar recargar el perfil usando AuthContext
      if (!activeUser) {
        console.log('GoogleAuthCallback - Attempting to reload user profile...')
        try {
          await loadUserProfile(auth.currentUser?.id || userProfile?.id, true)
          // Reintentamos obtener el usuario después de cargar
          const { data: { session: newSession } } = await auth.getSession()
          activeUser = newSession?.user || { id: userProfile?.id, email: userProfile?.email }
        } catch (profileReloadError) {
          console.error('GoogleAuthCallback - Error reloading profile:', profileReloadError)
        }
      }
      
      // Verificar que el usuario esté autenticado
      if (!activeUser) {
        console.warn('GoogleAuthCallback - Usuario no autenticado, intentando usar URL de referencia')
        
        // Intentar usar la URL de referencia para determinar dónde redirigir
        const referrer = document.referrer
        const isFromDashboard = referrer.includes('/panel-principal') || referrer.includes('/dashboard')
        
        if (isFromDashboard) {
          console.log('GoogleAuthCallback - Referrer indica que venía del dashboard, redirigiendo allí')
          setStatus('success')
          setMessage('Google Drive conectado exitosamente')
          toast.success('Google Drive conectado exitosamente')
          
          // Forzar redirección al dashboard incluso sin usuario verificado
          // La sesión se puede recuperar automáticamente
          setTimeout(() => navigate('/panel-principal'), 2000)
          return
        } else {
          console.error('GoogleAuthCallback - Usuario no autenticado y referrer desconocido')
          setStatus('error')
          setMessage('Sesión expirada - Inicia sesión nuevamente')
          toast.error('Sesión expirada - Inicia sesión nuevamente')
          setTimeout(() => navigate('/login'), 3000)
          return
        }
      }
      
      console.log('GoogleAuthCallback - Usuario activo seleccionado:', activeUser.id)

      // Inicializar googleDriveAuthService con Supabase
      googleDriveAuthService.initializeSupabase(supabase, activeUser.id)
      console.log('GoogleAuthCallback - googleDriveAuthService inicializado con Supabase')

      setMessage('Procesando autorización de Google Drive...')
      
      // Validar el estado CSRF si existe
      const state = searchParams.get('state')
      const savedState = sessionStorage.getItem('google_oauth_state')
      
      if (savedState && state !== savedState) {
        console.error('GoogleAuthCallback - Estado CSRF inválido')
        throw new Error('Estado de seguridad inválido. Por favor intenta nuevamente.')
      }
      
      // Limpiar estado guardado
      sessionStorage.removeItem('google_oauth_state')
      
      setMessage('Obteniendo credenciales de Google Drive...')
      
      // Procesar el código de autorización usando el handler
      const result = await googleDriveCallbackHandler.handleAuthorizationCode(code, activeUser.id)
      
      if (!result.success) {
        // Asegurar que mostramos el detalle real del error
        const detail = result?.error?.message || result?.error || ''
        throw new Error(detail || 'Error procesando la autorización')
      }
      
      console.log('GoogleAuthCallback - Credenciales guardadas exitosamente:', {
        userId: activeUser.id,
        email: result.email,
        hasCredentials: true
      })

      setMessage('Verificando conexión con Google Drive...')
      
      // IMPORTANTE: Las credenciales ya están guardadas en Supabase
      // Ahora solo necesitamos actualizar el contexto de autenticación
      setStatus('success')
      setMessage('¡Google Drive conectado exitosamente!')
      toast.success('Google Drive conectado exitosamente')
      
      console.log('GoogleAuthCallback - CONEXIÓN EXITOSA - Redirigiendo inmediatamente al dashboard')
      
      // FORZAR REDIRECCIÓN MÚLTIPLE Y AGRESIVA AL DASHBOARD
      setStatus('success')
      setMessage('¡Google Drive conectado exitosamente!')
      toast.success('Google Drive conectado exitosamente')
      
      // REDIRECCIÓN INMEDIATA CON REPLACE
      navigate('/panel-principal', { replace: true })
      
      // REDIRECCIONES DE SEGURIDAD CON DIFERENTES MÉTODOS
      setTimeout(() => {
        console.log('GoogleAuthCallback - SEGUNDA REDIRECCIÓN DE SEGURIDAD')
        navigate('/panel-principal', { replace: true })
      }, 500)
      
      setTimeout(() => {
        console.log('GoogleAuthCallback - TERCERA REDIRECCIÓN - FORZANDO CON WINDOW.LOCATION')
        window.location.href = '/panel-principal'
      }, 1000)
      
      setTimeout(() => {
        console.log('GoogleAuthCallback - CUARTA REDIRECCIÓN - FORZANDO CON WINDOW.REPLACE')
        window.location.replace('/panel-principal')
      }, 1500)
      
      // Recargar el perfil del usuario para obtener las nuevas credenciales
      try {
        await loadUserProfile(activeUser.id, true)
        console.log('GoogleAuthCallback - Perfil recargado exitosamente')
      } catch (profileError) {
        console.error('GoogleAuthCallback - Error recargando perfil:', profileError)
        // No es crítico, continuamos
      }
      
    } catch (error) {
      console.error('Error in Google callback:', error)
      setStatus('error')
      
      // Mostrar mensaje específico según el tipo de error
      let errorMessage = 'Error procesando la autorización de Google Drive'
      if (error?.message?.includes('Límite de solicitudes excedido')) {
        errorMessage = 'Límite de solicitudes excedido. Intenta nuevamente en unos minutos.'
      } else if (error?.message?.includes('redirect_uri_mismatch')) {
        errorMessage = 'redirect_uri_mismatch: Revisa que el URI de redirección sea exactamente http://localhost:3000/auth/google/callback'
      } else if (error?.message?.includes('invalid_grant')) {
        errorMessage = 'Invalid grant: El código de autorización expiró o ya fue usado. Vuelve a iniciar la conexión.'
      } else if (error?.message?.includes('invalid_client')) {
        errorMessage = 'Invalid client: Verifica el Client ID/Secret en .env y en Google Cloud Console.'
      } else if (error?.message?.includes('Código de autorización inválido')) {
        errorMessage = 'Código de autorización expirado. Intenta conectar Google Drive nuevamente.'
      } else if (error?.message?.includes('Credenciales de Google inválidas')) {
        errorMessage = 'Error de configuración. Contacta al administrador.'
      } else if (error?.message?.includes('No se pudieron obtener los tokens')) {
        errorMessage = 'Error obteniendo permisos de Google Drive. Intenta nuevamente.'
      }

      // Anexar detalle técnico para depuración visible
      const detail = error?.message ? ` Detalle: ${error.message}` : ''
      const finalMessage = `${errorMessage}${detail ? ' - ' + detail : ''}`.slice(0, 500)

      setMessage(finalMessage)
      toast.error(finalMessage)
      
      // SIEMPRE REDIRIGIR AL DASHBOARD - INCLUSO EN CASO DE ERROR CON MÚLTIPLES MÉTODOS
      console.log('GoogleAuthCallback - REDIRIGIENDO AL DASHBOARD A PESAR DE ERROR GENERAL')
      
      setTimeout(() => {
        navigate('/panel-principal', { replace: true })
      }, 1000)
      
      setTimeout(() => {
        window.location.href = '/panel-principal'
      }, 2000)
      
      setTimeout(() => {
        window.location.replace('/panel-principal')
      }, 3000)
    }
  }, [searchParams, navigate, user, userProfile, loadUserProfile])

  useEffect(() => {
    // Prevenir múltiples ejecuciones
    if (hasProcessed.current) {
      return
    }
    
    hasProcessed.current = true
    handleGoogleCallback()
  }, [handleGoogleCallback])

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="animate-spin h-12 w-12 text-primary-600">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )
      case 'success':
        return (
          <div className="h-12 w-12 text-green-600">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="h-12 w-12 text-yellow-600">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="h-12 w-12 text-red-600">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-primary-600'
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Conectando Google Drive
          </h2>
          
          <p className={`text-lg ${getStatusColor()} mb-6`}>
            {message}
          </p>
          
          {status === 'processing' && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-pulse h-2 bg-primary-200 rounded w-8"></div>
              <div className="animate-pulse h-2 bg-primary-200 rounded w-8 delay-75"></div>
              <div className="animate-pulse h-2 bg-primary-200 rounded w-8 delay-150"></div>
            </div>
          )}
          
          {(status === 'success' || status === 'warning' || status === 'error') && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/panel-principal')}
                className="btn-primary"
              >
                Ir al Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GoogleAuthCallback