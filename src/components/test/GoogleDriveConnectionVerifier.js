import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext.js'
import userGoogleDriveService from '../../services/userGoogleDriveService.js'
import userSpecificGoogleDriveService from '../../services/userSpecificGoogleDriveService.js'
import './GoogleDriveConnectionVerifier.css'

const GoogleDriveConnectionVerifier = () => {
  const { user } = useAuth()
  const [verificationResults, setVerificationResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const verificationSteps = useMemo(() => [
    { id: 'env', name: 'Variables de Entorno', icon: '🔧' },
    { id: 'service', name: 'Servicio de Autenticación', icon: '🔐' },
    { id: 'connection', name: 'Conexión con Google Drive', icon: '🔗' },
    { id: 'operations', name: 'Operaciones de API', icon: '⚡' },
    { id: 'database', name: 'Base de Datos', icon: '💾' }
  ], [])

  const verifyEnvironment = useCallback(async () => {
    const envVars = {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
      environment: process.env.REACT_APP_ENVIRONMENT,
      netlifyUrl: process.env.REACT_APP_NETLIFY_URL
    }

    const checks = {
      clientId: !!envVars.clientId,
      clientSecret: !!envVars.clientSecret,
      apiKey: !!envVars.apiKey,
      environment: !!envVars.environment,
      netlifyUrl: !!envVars.netlifyUrl,
      correctRedirectUri: envVars.environment === 'production' 
        ? envVars.netlifyUrl === 'https://brifyrrhhv2.netlify.app'
        : true
    }

    const allPassed = Object.values(checks).every(Boolean)

    return {
      success: allPassed,
      details: {
        vars: {
          clientId: envVars.clientId ? `${envVars.clientId.substring(0, 20)}...` : '❌ No configurado',
          clientSecret: envVars.clientSecret ? '✅ Configurado' : '❌ No configurado',
          apiKey: envVars.apiKey ? '✅ Configurado' : '❌ No configurado',
          environment: envVars.environment || '❌ No configurado',
          netlifyUrl: envVars.netlifyUrl || '❌ No configurado'
        },
        checks,
        redirectUri: envVars.environment === 'production' 
          ? 'https://brifyrrhhv2.netlify.app/auth/google/callback'
          : 'http://localhost:3000/auth/google/callback'
      }
    }
  }, [])

  const verifyService = useCallback(async () => {
    try {
      // Verificar que el servicio esté inicializado correctamente
      const serviceInitialized = !!userGoogleDriveService.clientId
      
      // Verificar generación de URL de autenticación
      let authUrl = null
      if (serviceInitialized && user) {
        authUrl = userGoogleDriveService.generateAuthUrl(user.id, 'test_state')
      }

      return {
        success: serviceInitialized && !!authUrl,
        details: {
          serviceInitialized,
          authUrlGenerated: !!authUrl,
          authUrl: authUrl ? authUrl.substring(0, 100) + '...' : null,
          scopes: userGoogleDriveService.scopes,
          redirectUri: userGoogleDriveService.redirectUri
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: null
      }
    }
  }, [user])

  const verifyConnection = useCallback(async () => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Verificar estado de conexión
      const isConnected = await userGoogleDriveService.isUserConnected(user.id)
      const connectionInfo = await userGoogleDriveService.getConnectionInfo(user.id)

      return {
        success: true,
        details: {
          isConnected,
          connectionInfo,
          hasCredentials: !!connectionInfo.googleEmail,
          syncStatus: connectionInfo.syncStatus
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: null
      }
    }
  }, [user])

  const verifyOperations = useCallback(async () => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const operations = []

      // Solo probar operaciones si el usuario está conectado
      const isConnected = await userGoogleDriveService.isUserConnected(user.id)
      
      if (isConnected) {
        try {
          // Probar obtención de token válido
          const token = await userGoogleDriveService.getValidAccessToken(user.id)
          operations.push({
            name: 'Obtener Token Válido',
            success: !!token,
            details: token ? '✅ Token obtenido' : '❌ No se pudo obtener token'
          })

          // Probar servicio específico de Google Drive
          const driveService = await userSpecificGoogleDriveService.getUserDriveService(user.id)
          operations.push({
            name: 'Servicio Google Drive',
            success: !!driveService,
            details: driveService ? '✅ Servicio inicializado' : '❌ Error al inicializar'
          })

          // Probar listar archivos (operación segura)
          try {
            const filesResult = await userSpecificGoogleDriveService.listFiles(user.id, null, 5)
            operations.push({
              name: 'Listar Archivos',
              success: filesResult.success,
              details: filesResult.success 
                ? `✅ Se encontraron ${filesResult.files.length} archivos` 
                : `❌ Error: ${filesResult.error}`
            })
          } catch (fileError) {
            operations.push({
              name: 'Listar Archivos',
              success: false,
              details: `❌ Error: ${fileError.message}`
            })
          }

        } catch (opError) {
          operations.push({
            name: 'Operaciones API',
            success: false,
            details: `❌ Error general: ${opError.message}`
          })
        }
      } else {
        operations.push({
          name: 'Estado de Conexión',
          success: false,
          details: '⚠️ Usuario no conectado - Omitiendo pruebas de API'
        })
      }

      return {
        success: true,
        details: {
          operations,
          totalTests: operations.length,
          passedTests: operations.filter(op => op.success).length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: null
      }
    }
  }, [user])

  const verifyDatabase = useCallback(async () => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Verificar que podemos obtener información de la base de datos
      const connectionInfo = await userGoogleDriveService.getConnectionInfo(user.id)
      
      return {
        success: true,
        details: {
          canAccessDatabase: true,
          hasCredentials: !!connectionInfo.googleEmail,
          syncStatus: connectionInfo.syncStatus,
          lastSyncAt: connectionInfo.lastSyncAt,
          tableName: 'user_google_drive_credentials',
          recordExists: connectionInfo.isConnected
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: null
      }
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    
    const runCompleteVerification = async () => {
      setLoading(true)
      const results = {}

      for (let i = 0; i < verificationSteps.length; i++) {
        setCurrentStep(i)
        const step = verificationSteps[i]
        
        try {
          switch (step.id) {
            case 'env':
              results.env = await verifyEnvironment()
              break
            case 'service':
              results.service = await verifyService()
              break
            case 'connection':
              results.connection = await verifyConnection()
              break
            case 'operations':
              results.operations = await verifyOperations()
              break
            case 'database':
              results.database = await verifyDatabase()
              break
            default:
              results[step.id] = {
                success: false,
                error: `Paso desconocido: ${step.id}`,
                details: null
              }
          }
        } catch (error) {
          results[step.id] = {
            success: false,
            error: error.message,
            details: null
          }
        }

        // Pequeña pausa para mejor UX
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setVerificationResults(results)
      setLoading(false)
      setCurrentStep(verificationSteps.length)
    }
    
    runCompleteVerification()
  }, [user, verificationSteps, verifyEnvironment, verifyService, verifyConnection, verifyOperations, verifyDatabase])

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌'
  }

  const runTestConnection = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const token = await userGoogleDriveService.getValidAccessToken(user.id)
      if (token) {
        alert('✅ Conexión verificada exitosamente')
      }
    } catch (error) {
      alert(`❌ Error de conexión: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderStepResult = (step, result) => {
    if (!result) return null

    return (
      <div key={step.id} className={`p-4 rounded-lg border-2 ${
        result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">{step.icon}</span>
          <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {step.name}
          </h3>
          <span className="text-lg">{getStatusIcon(result.success)}</span>
        </div>
        
        {result.error && (
          <p className="text-red-600 text-sm mb-2">❌ {result.error}</p>
        )}
        
        {result.details && (
          <div className="text-sm text-gray-700">
            {step.id === 'env' && result.details.vars && (
              <div className="space-y-1">
                {Object.entries(result.details.vars).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className={value.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {step.id === 'service' && (
              <div className="space-y-1">
                <div>Servicio inicializado: {result.details.serviceInitialized ? '✅' : '❌'}</div>
                <div>URL de auth generada: {result.details.authUrlGenerated ? '✅' : '❌'}</div>
                <div>Scopes: {result.details.scopes?.length || 0}</div>
              </div>
            )}
            
            {step.id === 'connection' && (
              <div className="space-y-1">
                <div>Conectado: {result.details.isConnected ? '✅' : '❌'}</div>
                <div>Credenciales: {result.details.hasCredentials ? '✅' : '❌'}</div>
                <div>Estado de sync: {result.details.syncStatus || 'N/A'}</div>
              </div>
            )}
            
            {step.id === 'operations' && result.details.operations && (
              <div className="space-y-1">
                {result.details.operations.map((op, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{op.name}:</span>
                    <span className={op.success ? 'text-green-600' : 'text-red-600'}>
                      {op.details}
                    </span>
                  </div>
                ))}
                <div className="mt-2 font-semibold">
                  Total: {result.details.passedTests}/{result.details.totalTests} pruebas pasaron
                </div>
              </div>
            )}
            
            {step.id === 'database' && (
              <div className="space-y-1">
                <div>Acceso a BD: {result.details.canAccessDatabase ? '✅' : '❌'}</div>
                <div>Credenciales: {result.details.hasCredentials ? '✅' : '❌'}</div>
                <div>Registro existe: {result.details.recordExists ? '✅' : '❌'}</div>
                <div>Última sync: {result.details.lastSyncAt || 'N/A'}</div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🔍 Verificador de Conexión Google Drive
          </h2>
          <button
            onClick={runTestConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Probar Conexión'}
          </button>
        </div>

        {loading && (
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">
                Verificando paso {currentStep + 1} de {verificationSteps.length}: {verificationSteps[currentStep]?.name}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / verificationSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {verificationSteps.map((step, index) => {
            const result = verificationResults[step.id]
            return renderStepResult(step, result)
          })}
        </div>

        {Object.keys(verificationResults).length > 0 && !loading && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Resumen General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pasos completados:</span> {Object.keys(verificationResults).length}/{verificationSteps.length}
              </div>
              <div>
                <span className="font-medium">Exitosos:</span> {Object.values(verificationResults).filter(r => r.success).length}
              </div>
              <div>
                <span className="font-medium">Fallidos:</span> {Object.values(verificationResults).filter(r => !r.success).length}
              </div>
              <div>
                <span className="font-medium">Estado general:</span> 
                <span className={Object.values(verificationResults).every(r => r.success) ? 'text-green-600' : 'text-red-600'}>
                  {Object.values(verificationResults).every(r => r.success) ? '✅ Todo OK' : '⚠️ Hay problemas'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoogleDriveConnectionVerifier