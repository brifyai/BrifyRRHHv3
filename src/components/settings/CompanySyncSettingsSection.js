import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext.js'
import googleDriveSyncService from '../../services/googleDriveSyncService.js'
import companySyncService from '../../services/companySyncService.js'
import configurationService from '../../services/configurationService.js'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

const CompanySyncSettingsSection = ({
  selectedCompanyId,
  companies,
  hierarchyMode,
  onHierarchyModeChange,
  onSave
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Encontrar la empresa seleccionada
  const company = companies.find(c => c.id === selectedCompanyId)
  const [syncSettings, setSyncSettings] = useState({
    // Configuración de Google Drive
    googleDrive: {
      enabled: true,
      autoCreateFolders: true,
      autoShareFolders: true,
      folderStructure: 'company_based', // 'company_based' | 'flat'
      syncInterval: 5, // minutos
      webhookEnabled: true,
      retryAttempts: 3,
      timeout: 30000, // ms
      // Configuración específica por empresa
      companyFolderName: '',
      gmailFolderName: 'Gmail',
      nonGmailFolderName: 'No Gmail',
      // Permisos por defecto
      defaultPermission: 'writer', // 'reader' | 'writer' | 'commenter'
      // Configuración de emails
      allowedGmailDomains: ['gmail.com', 'googlemail.com', 'gmail.cl', 'gmail.es', 'gmail.mx'],
      // Configuración de sincronización
      syncDirection: 'bidirectional', // 'drive_to_supabase' | 'supabase_to_drive' | 'bidirectional'
      // Configuración de auditoría
      auditEnabled: true,
      auditRetentionDays: 90,
      // Configuración de limpieza
      autoCleanup: true,
      cleanupIntervalDays: 30,
      softDeleteRetentionDays: 30
    },
    // Configuración de notificaciones por empresa
    notifications: {
      syncErrors: true,
      folderCreation: true,
      permissionChanges: true,
      webhookFailures: true,
      emailRecipients: []
    },
    // Configuración de empleados
    employees: {
      autoCreateOnImport: true,
      validateGmailEmails: true,
      defaultCompanyAssignment: true,
      // Configuración de datos de empleados
      requiredFields: ['email', 'name', 'position'],
      optionalFields: ['department', 'phone', 'region', 'level', 'work_mode', 'contract_type']
    },
    // Configuración avanzada
    advanced: {
      enableDistributedLocks: true,
      lockTimeout: 30000, // ms
      enableWebhookRenewal: true,
      webhookRenewalInterval: 24, // horas
      enableRateLimiting: true,
      maxRequestsPerMinute: 100,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000 // ms
    }
  })

  const [testResults, setTestResults] = useState(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // Cargar configuración existente de la empresa
  const loadCompanySyncSettings = useCallback(async () => {
    if (!company?.id) return

    try {
      setLoading(true)
      const savedSettings = await configurationService.getConfig(
        'sync', 
        'google_drive', 
        'company', 
        company.id, 
        {}
      )

      if (savedSettings && Object.keys(savedSettings).length > 0) {
        setSyncSettings(prev => ({
          ...prev,
          ...savedSettings,
          googleDrive: {
            ...prev.googleDrive,
            ...savedSettings.googleDrive
          },
          notifications: {
            ...prev.notifications,
            ...savedSettings.notifications
          },
          employees: {
            ...prev.employees,
            ...savedSettings.employees
          },
          advanced: {
            ...prev.advanced,
            ...savedSettings.advanced
          }
        }))
      }

      // Establecer nombre de carpeta por defecto basado en la empresa
      if (!syncSettings.googleDrive.companyFolderName && company.name) {
        setSyncSettings(prev => ({
          ...prev,
          googleDrive: {
            ...prev.googleDrive,
            companyFolderName: company.name
          }
        }))
      }
    } catch (error) {
      console.error('Error loading company sync settings:', error)
      toast.error('Error al cargar la configuración de sincronización')
    } finally {
      setLoading(false)
    }
  }, [company?.id, company?.name])

  useEffect(() => {
    loadCompanySyncSettings()
  }, [loadCompanySyncSettings])

  // Handlers para cambios en la configuración
  const handleGoogleDriveSettingChange = (key, value) => {
    setSyncSettings(prev => ({
      ...prev,
      googleDrive: {
        ...prev.googleDrive,
        [key]: value
      }
    }))
  }

  const handleNotificationSettingChange = (key, value) => {
    setSyncSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const handleEmployeeSettingChange = (key, value) => {
    setSyncSettings(prev => ({
      ...prev,
      employees: {
        ...prev.employees,
        [key]: value
      }
    }))
  }

  const handleAdvancedSettingChange = (key, value) => {
    setSyncSettings(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [key]: value
      }
    }))
  }

  // Agregar/remover dominios Gmail permitidos
  const addGmailDomain = () => {
    const domain = prompt('Ingresa el dominio Gmail a agregar (ej: gmail.com):')
    if (domain && !syncSettings.googleDrive.allowedGmailDomains.includes(domain)) {
      handleGoogleDriveSettingChange('allowedGmailDomains', [
        ...syncSettings.googleDrive.allowedGmailDomains,
        domain
      ])
      toast.success(`Dominio ${domain} agregado`)
    }
  }

  const removeGmailDomain = (domain) => {
    handleGoogleDriveSettingChange('allowedGmailDomains',
      syncSettings.googleDrive.allowedGmailDomains.filter(d => d !== domain)
    )
    toast.success(`Dominio ${domain} removido`)
  }

  // Agregar/remover emails de notificación
  const addNotificationEmail = () => {
    const email = prompt('Ingresa el email para notificaciones:')
    if (email && !syncSettings.notifications.emailRecipients.includes(email)) {
      handleNotificationSettingChange('emailRecipients', [
        ...syncSettings.notifications.emailRecipients,
        email
      ])
      toast.success(`Email ${email} agregado a notificaciones`)
    }
  }

  const removeNotificationEmail = (email) => {
    handleNotificationSettingChange('emailRecipients',
      syncSettings.notifications.emailRecipients.filter(e => e !== email)
    )
    toast.success(`Email ${email} removido de notificaciones`)
  }

  // Guardar configuración
  const handleSaveSettings = async () => {
    try {
      setLoading(true)

      // Validaciones
      if (!syncSettings.googleDrive.companyFolderName.trim()) {
        toast.error('El nombre de carpeta de la empresa es requerido')
        return
      }

      if (syncSettings.googleDrive.syncInterval < 1 || syncSettings.googleDrive.syncInterval > 60) {
        toast.error('El intervalo de sincronización debe estar entre 1 y 60 minutos')
        return
      }

      // Guardar configuración
      await configurationService.setConfig(
        'sync',
        'google_drive',
        syncSettings,
        'company',
        company.id,
        `Configuración de sincronización para ${company.name}`
      )

      toast.success('Configuración de sincronización guardada exitosamente')
      
      if (onSave) {
        onSave(syncSettings)
      }
    } catch (error) {
      console.error('Error saving sync settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  // Probar conexión de sincronización
  const testSyncConnection = async () => {
    try {
      setIsTestingConnection(true)
      
      // Inicializar servicio de sincronización
      const initResult = await googleDriveSyncService.initialize()
      if (!initResult) {
        throw new Error('No se pudo inicializar el servicio de sincronización')
      }

      // Probar autenticación
      const isAuth = googleDriveSyncService.isAuthenticated()
      if (!isAuth) {
        throw new Error('Google Drive no está autenticado')
      }

      // Probar creación de estructura de carpetas
      const folderStructure = await googleDriveSyncService.createCompanyFolderStructure(
        syncSettings.googleDrive.companyFolderName
      )

      setTestResults({
        success: true,
        message: 'Conexión exitosa',
        details: {
          authenticated: true,
          folderStructureCreated: !!folderStructure,
          companyFolder: folderStructure?.companyFolder?.name,
          gmailFolder: folderStructure?.gmailFolder?.name,
          nonGmailFolder: folderStructure?.nonGmailFolder?.name
        }
      })

      toast.success('Prueba de conexión exitosa')
    } catch (error) {
      console.error('Error testing sync connection:', error)
      setTestResults({
        success: false,
        message: error.message,
        details: {}
      })
      toast.error(`Error en prueba de conexión: ${error.message}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Inicializar webhooks para la empresa
  const initializeWebhooks = async () => {
    try {
      setLoading(true)
      
      const result = await googleDriveSyncService.initializeWebhooks()
      
      if (result.success) {
        toast.success(`Webhooks inicializados: ${result.configured} configurados, ${result.errors} errores`)
      } else {
        toast.error('Error al inicializar webhooks')
      }
    } catch (error) {
      console.error('Error initializing webhooks:', error)
      toast.error(`Error al inicializar webhooks: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Auditar consistencia de la empresa
  const auditCompanyConsistency = async () => {
    try {
      setLoading(true)
      
      const audit = await googleDriveSyncService.auditConsistency()
      
      const summary = audit.summary
      const message = `Auditoría completada: ${summary.totalInconsistencies} inconsistencias, ${summary.totalOrphanedInDrive} carpetas huérfanas`
      
      if (summary.needsAttention) {
        Swal.fire({
          title: '⚠️ Se encontraron problemas',
          text: message,
          icon: 'warning',
          confirmButtonText: 'Ver detalles'
        })
      } else {
        toast.success(message)
      }
      
      setTestResults({
        success: !summary.needsAttention,
        message,
        details: audit
      })
    } catch (error) {
      console.error('Error auditing consistency:', error)
      toast.error(`Error en auditoría: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!company) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Selecciona una empresa para configurar la sincronización</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Configuración de Sincronización
            </h2>
            <p className="text-gray-600 mt-1">
              Configuración específica para: <span className="font-semibold">{company.name}</span>
            </p>
          </div>
<div className="flex space-x-3">
            <button
              onClick={testSyncConnection}
              disabled={isTestingConnection || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isTestingConnection ? 'Probando...' : 'Probar Conexión'}
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>









      {/* Explicación clara de qué se está configurando */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📋 ¿Qué se está configurando en esta página?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-700 mb-2">✅ SÍ se configura aquí:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Sincronización específica de Google Drive para <strong>{company.name}</strong></li>
              <li>• Estructura de carpetas de empleados</li>
              <li>• Permisos y accesos por empleado</li>
              <li>• Intervalos de sincronización personalizados</li>
              <li>• Configuración de webhooks para esta empresa</li>
              <li>• Notificaciones específicas de sincronización</li>
              <li>• Pruebas de conexión y diagnóstico</li>
              <li>• Credenciales de Google Drive específicas de esta empresa</li>
              <li>• Configuración de WhatsApp, Brevo, etc. para esta empresa</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-700 mb-2">❌ NO se configura aquí:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Configuración global del sistema (estructura común)</li>
              <li>• Otras empresas (cada una tiene su propia página)</li>
              <li>• Usuarios y permisos del sistema (administración centralizada)</li>
              <li>• Configuración de base de datos (esquema común)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>💡 Tip:</strong> Esta configuración es específica únicamente para <strong>{company.name}</strong>. 
            Cada empresa tiene su propia configuración independiente.
          </p>
        </div>
      </div>

      {/* Resultados de pruebas */}
      {testResults && (
        <div className={`rounded-lg p-4 ${
          testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold ${
            testResults.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {testResults.success ? '✅' : '❌'} {testResults.message}
          </h3>
          {testResults.details && (
            <pre className="mt-2 text-sm text-gray-600 overflow-auto">
              {JSON.stringify(testResults.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Integraciones específicas por empresa */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Integraciones de {company.name}</h3>
        <p className="text-gray-600 mb-6">
          Configura las integraciones específicas para <strong>{company.name}</strong>. Cada empresa puede tener sus propias credenciales y configuraciones.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Google Drive */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Google Drive</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Almacenamiento en la nube específico para esta empresa</p>
            <button
              onClick={testSyncConnection}
              disabled={isTestingConnection || loading}
              className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isTestingConnection ? 'Conectando...' : 'Conectar Google Drive'}
            </button>
          </div>

          {/* Google Meet */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Google Meet</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Videoconferencias específicas para esta empresa</p>
            <button
              onClick={() => console.log('Configurar Google Meet para', company.name)}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Configurar Meet
            </button>
          </div>

          {/* Slack */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Slack</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Notificaciones colaborativas específicas</p>
            <button
              onClick={() => console.log('Configurar Slack para', company.name)}
              className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
            >
              Configurar Slack
            </button>
          </div>

          {/* Microsoft Teams */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Microsoft Teams</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Notificaciones empresariales específicas</p>
            <button
              onClick={() => console.log('Configurar Teams para', company.name)}
              className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              Configurar Teams
            </button>
          </div>

          {/* HubSpot */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">HubSpot</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">CRM y marketing específico para esta empresa</p>
            <button
              onClick={() => console.log('Configurar HubSpot para', company.name)}
              className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
            >
              Configurar HubSpot
            </button>
          </div>

          {/* Brevo */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Brevo</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">SMS y Email Masivo específico</p>
            <button
              onClick={() => console.log('Configurar Brevo para', company.name)}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Configurar Brevo
            </button>
          </div>

          {/* WhatsApp Business */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">WhatsApp Business</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Mensajería empresarial específica</p>
            <button
              onClick={() => console.log('Configurar WhatsApp Business para', company.name)}
              className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Configurar WhatsApp
            </button>
          </div>

          {/* WhatsApp Official API */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">WhatsApp Official API</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">API oficial de WhatsApp específica</p>
            <button
              onClick={() => console.log('Configurar WhatsApp Official para', company.name)}
              className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Configurar API Oficial
            </button>
          </div>

          {/* WhatsApp WAHA API */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">WhatsApp WAHA API</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">API alternativa de WhatsApp específica</p>
            <button
              onClick={() => console.log('Configurar WhatsApp WAHA para', company.name)}
              className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
            >
              Configurar WAHA API
            </button>
          </div>

          {/* Telegram Bot */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Telegram Bot</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Empresa</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Mensajería segura específica</p>
            <button
              onClick={() => console.log('Configurar Telegram para', company.name)}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Configurar Telegram
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Nota:</strong> Cada integración se configura específicamente para <strong>{company.name}</strong>.
            Las credenciales y configuraciones son independientes de otras empresas.
          </p>
        </div>
      </div>

      {/* Configuración de Google Drive */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Drive</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuración básica */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Configuración Básica</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Carpeta de Empresa
              </label>
              <input
                type="text"
                value={syncSettings.googleDrive.companyFolderName}
                onChange={(e) => handleGoogleDriveSettingChange('companyFolderName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre de la empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo de Sincronización (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={syncSettings.googleDrive.syncInterval}
                onChange={(e) => handleGoogleDriveSettingChange('syncInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección de Sincronización
              </label>
              <select
                value={syncSettings.googleDrive.syncDirection}
                onChange={(e) => handleGoogleDriveSettingChange('syncDirection', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bidirectional">Bidireccional</option>
                <option value="drive_to_supabase">Solo Drive → Supabase</option>
                <option value="supabase_to_drive">Solo Supabase → Drive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permiso por Defecto
              </label>
              <select
                value={syncSettings.googleDrive.defaultPermission}
                onChange={(e) => handleGoogleDriveSettingChange('defaultPermission', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="reader">Solo lectura</option>
                <option value="writer">Escritura</option>
                <option value="commenter">Comentarios</option>
              </select>
            </div>
          </div>

          {/* Configuración avanzada */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Configuración Avanzada</h4>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.googleDrive.enabled}
                  onChange={(e) => handleGoogleDriveSettingChange('enabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Habilitar sincronización</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.googleDrive.autoCreateFolders}
                  onChange={(e) => handleGoogleDriveSettingChange('autoCreateFolders', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Crear carpetas automáticamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.googleDrive.autoShareFolders}
                  onChange={(e) => handleGoogleDriveSettingChange('autoShareFolders', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Compartir carpetas automáticamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.googleDrive.webhookEnabled}
                  onChange={(e) => handleGoogleDriveSettingChange('webhookEnabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Habilitar webhooks</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.googleDrive.auditEnabled}
                  onChange={(e) => handleGoogleDriveSettingChange('auditEnabled', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Habilitar auditoría</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncSettings.googleDrive.autoCleanup}
                  onChange={(e) => handleGoogleDriveSettingChange('autoCleanup', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Limpieza automática</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intentos de Reintento
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={syncSettings.googleDrive.retryAttempts}
                onChange={(e) => handleGoogleDriveSettingChange('retryAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                min="5000"
                max="120000"
                step="5000"
                value={syncSettings.googleDrive.timeout}
                onChange={(e) => handleGoogleDriveSettingChange('timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Dominios Gmail permitidos */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Dominios Gmail Permitidos</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {syncSettings.googleDrive.allowedGmailDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {domain}
                <button
                  onClick={() => removeGmailDomain(domain)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={addGmailDomain}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            + Agregar Dominio
          </button>
        </div>
      </div>

      {/* Configuración de Notificaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Eventos a Notificar</h4>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.notifications.syncErrors}
                onChange={(e) => handleNotificationSettingChange('syncErrors', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Errores de sincronización</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.notifications.folderCreation}
                onChange={(e) => handleNotificationSettingChange('folderCreation', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Creación de carpetas</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.notifications.permissionChanges}
                onChange={(e) => handleNotificationSettingChange('permissionChanges', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Cambios de permisos</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.notifications.webhookFailures}
                onChange={(e) => handleNotificationSettingChange('webhookFailures', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Fallos de webhooks</span>
            </label>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Emails de Notificación</h4>
            <div className="space-y-2 mb-3">
              {syncSettings.notifications.emailRecipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg"
                >
                  <span className="text-sm">{email}</span>
                  <button
                    onClick={() => removeNotificationEmail(email)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addNotificationEmail}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Agregar Email
            </button>
          </div>
        </div>
      </div>

      {/* Configuración de Empleados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Empleados</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Configuración General</h4>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.employees.autoCreateOnImport}
                onChange={(e) => handleEmployeeSettingChange('autoCreateOnImport', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Crear carpetas automáticamente al importar</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.employees.validateGmailEmails}
                onChange={(e) => handleEmployeeSettingChange('validateGmailEmails', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Validar emails Gmail</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.employees.defaultCompanyAssignment}
                onChange={(e) => handleEmployeeSettingChange('defaultCompanyAssignment', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Asignación automática a empresa</span>
            </label>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Campos Requeridos</h4>
            <div className="space-y-2">
              {syncSettings.employees.requiredFields.map((field) => (
                <div key={field} className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg">
                  <span className="text-sm">{field}</span>
                  <button
                    onClick={() => {
                      const newFields = syncSettings.employees.requiredFields.filter(f => f !== field)
                      handleEmployeeSettingChange('requiredFields', newFields)
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuración Avanzada */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración Avanzada</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Sistema de Locks</h4>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.advanced.enableDistributedLocks}
                onChange={(e) => handleAdvancedSettingChange('enableDistributedLocks', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Habilitar locks distribuidos</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout de Lock (ms)
              </label>
              <input
                type="number"
                min="5000"
                max="300000"
                step="5000"
                value={syncSettings.advanced.lockTimeout}
                onChange={(e) => handleAdvancedSettingChange('lockTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Webhooks y Rate Limiting</h4>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.advanced.enableWebhookRenewal}
                onChange={(e) => handleAdvancedSettingChange('enableWebhookRenewal', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Renovación automática de webhooks</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo de Renovación (horas)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={syncSettings.advanced.webhookRenewalInterval}
                onChange={(e) => handleAdvancedSettingChange('webhookRenewalInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.advanced.enableRateLimiting}
                onChange={(e) => handleAdvancedSettingChange('enableRateLimiting', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Habilitar rate limiting</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo Requests/Minuto
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={syncSettings.advanced.maxRequestsPerMinute}
                onChange={(e) => handleAdvancedSettingChange('maxRequestsPerMinute', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}

export default CompanySyncSettingsSection