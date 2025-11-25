import { useState, useEffect, useCallback } from 'react'
import multiGoogleDriveManager from '../lib/multiGoogleDriveManager.js'
import { supabase } from '../lib/supabase.js'
import logger from '../lib/logger.js'

/**
 * HOOK: useMultiGoogleDrive
 * 
 * Proporciona funcionalidad multi-cuenta para Google Drive
 * en componentes de React
 */
export const useMultiGoogleDrive = (companyId) => {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connecting, setConnecting] = useState(false)

  // Cargar sesiones al montar
  useEffect(() => {
    loadSessions()
  }, [companyId])

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      await multiGoogleDriveManager.initialize()
      
      const allSessions = multiGoogleDriveManager.getAllCompanies()
      setSessions(allSessions)
      
      if (companyId) {
        const session = multiGoogleDriveManager.getSession(companyId)
        setCurrentSession(session)
      }
      
      logger.info('useMultiGoogleDrive', `✅ ${allSessions.length} sesiones cargadas`)
    } catch (err) {
      setError(err.message)
      logger.error('useMultiGoogleDrive', `❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const connect = useCallback(async (companyId, clientId, clientSecret) => {
    try {
      setConnecting(true)
      setError(null)
      
      logger.info('useMultiGoogleDrive', `🔗 Conectando empresa ${companyId}`)
      
      // 1. Guardar credenciales en Supabase
      const { error: saveError } = await supabase
        .from('company_credentials')
        .upsert({
          company_id: companyId,
          integration_type: 'google_drive',
          credentials: {
            clientId,
            clientSecret,
            redirectUri: window.location.origin + '/auth/google/callback'
          },
          status: 'pending_verification',
          account_name: `Cuenta ${companyId}`,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,integration_type'
        })
      
      if (saveError) throw saveError
      
      // 2. Iniciar flujo OAuth
      const authUrl = generateAuthUrl(companyId, clientId)
      window.location.href = authUrl
      
      return true
    } catch (err) {
      setError(err.message)
      logger.error('useMultiGoogleDrive', `❌ Error conectando: ${err.message}`)
      return false
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async (companyId) => {
    try {
      setError(null)
      
      // 1. Desconectar en el manager
      multiGoogleDriveManager.disconnect(companyId)
      
      // 2. Limpiar tokens en Supabase
      const { error } = await supabase
        .from('company_credentials')
        .update({
          credentials: supabase.raw('credentials - ??', ['access_token', 'refresh_token', 'expiry_date']),
          status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId)
        .eq('integration_type', 'google_drive')
      
      if (error) throw error
      
      // 3. Recargar sesiones
      await loadSessions()
      
      logger.info('useMultiGoogleDrive', `🔌 Desconectado empresa ${companyId}`)
      return true
    } catch (err) {
      setError(err.message)
      logger.error('useMultiGoogleDrive', `❌ Error desconectando: ${err.message}`)
      return false
    }
  }, [loadSessions])

  const selectAccount = useCallback((companyId) => {
    const session = multiGoogleDriveManager.getSession(companyId)
    setCurrentSession(session)
    logger.info('useMultiGoogleDrive', `📌 Cuenta seleccionada: ${companyId}`)
  }, [])

  const getConnectedAccounts = useCallback(() => {
    return multiGoogleDriveManager.getConnectedCompanies()
  }, [])

  const isConnected = useCallback((companyId) => {
    return multiGoogleDriveManager.hasSession(companyId)
  }, [])

  const createEmployeeFolder = useCallback(async (companyId, employeeName, employeeId) => {
    try {
      const result = await multiGoogleDriveManager.createFolder(
        companyId,
        `${employeeName} - ${employeeId}`,
        null
      )
      return result
    } catch (err) {
      setError(err.message)
      logger.error('useMultiGoogleDrive', `❌ Error creando carpeta: ${err.message}`)
      return { success: false, error: err.message }
    }
  }, [])

  return {
    sessions,
    currentSession,
    loading,
    error,
    connecting,
    connect,
    disconnect,
    selectAccount,
    getConnectedAccounts,
    isConnected,
    createEmployeeFolder,
    refreshSessions: loadSessions
  }
}

// Función auxiliar para generar URL de autorización
function generateAuthUrl(companyId, clientId) {
  const redirectUri = window.location.origin + '/auth/google/callback'
  const scope = 'https://www.googleapis.com/auth/drive.file'
  const state = encodeURIComponent(JSON.stringify({
    companyId,
    integrationType: 'google_drive',
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  }))
  
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`
}

export default useMultiGoogleDrive