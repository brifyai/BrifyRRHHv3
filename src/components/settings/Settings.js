import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import googleDriveService from '../../lib/unifiedGoogleDriveService.js'
import googleDrivePersistenceService from '../../services/googleDrivePersistenceService.js'
import googleDriveCallbackHandler from '../../lib/googleDriveCallbackHandler.js'
import brevoService from '../../services/brevoService.js'
import companySyncService from '../../services/companySyncService.js'
import organizedDatabaseService from '../../services/organizedDatabaseService.js'
import communicationService from '../../services/communicationService.js'
import whatsappOfficialService from '../../services/whatsappOfficialService.js'
import whatsappWahaService from '../../services/whatsappWahaService.js'
import configurationService from '../../services/configurationService.js'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  CloudIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  ServerIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import CompanyForm from './CompanyForm.js'
import UserManagement from './UserManagement.js'
import DatabaseSettings from './DatabaseSettings.js'

const Settings = ({ activeTab: propActiveTab, companyId: propCompanyId }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  
  // Estado para controlar el sistema de configuración jerárquico
  const [hierarchyMode, setHierarchyMode] = useState('company_first') // 'global_only', 'company_first', 'both'
  
  // Estados de integraciones
  const [integrations, setIntegrations] = useState({
    google: { connected: false, status: 'disconnected', lastSync: null },
    googlemeet: { connected: false, status: 'disconnected', lastSync: null },
    microsoft365: { connected: false, status: 'disconnected', lastSync: null },
    slack: { connected: false, status: 'disconnected', lastSync: null },
    teams: { connected: false, status: 'disconnected', lastSync: null },
    hubspot: { connected: false, status: 'disconnected', lastSync: null },
    salesforce: { connected: false, status: 'disconnected', lastSync: null },
    brevo: { connected: false, status: 'disconnected', lastSync: null },
    groq: { connected: false, status: 'disconnected', lastSync: null, model: 'gemma2-9b-it' },
    whatsapp: { connected: false, status: 'disconnected', lastSync: null },
    whatsappOfficial: { connected: false, status: 'disconnected', lastSync: null },
    whatsappWaha: { connected: false, status: 'disconnected', lastSync: null },
    telegram: { connected: false, status: 'disconnected', lastSync: null }
  })

  const [activeTab, setActiveTab] = useState(propActiveTab || 'companies')

  // Estados para configuraciones de notificaciones
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      messagesSent: true,
      systemErrors: true,
      weeklyReports: false,
      tokenLimits: true
    },
    push: {
      failedMessages: true,
      newContacts: false,
      integrations: true,
      maintenance: false
    },
    reports: {
      frequency: 'weekly',
      recipients: user?.email ? [user?.email] : [],
      includeCharts: true
    },
    sound: {
      enabled: true,
      volume: 70,
      silent: false
    }
  })

  // Estados para configuración de seguridad
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    twoFactorMethod: 'app', // 'app', 'sms', 'email'
    sessionTimeout: 30, // minutos
    passwordExpiry: 90, // días
    loginAttempts: 5,
    lockoutDuration: 15, // minutos
    ipWhitelist: [],
    requireStrongPassword: true,
    auditLogEnabled: true
  })

  // Estados para sesiones activas
  const [activeSessions, setActiveSessions] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'weekly', // 'daily', 'weekly', 'monthly'
    retentionDays: 30,
    lastBackup: null,
    backupSize: null
  })

  // Estados para el formulario de solicitud de integración
  const [showIntegrationForm, setShowIntegrationForm] = useState(false)
  const [integrationForm, setIntegrationForm] = useState({
    nombre: '',
    apellido: '',
    empresa: '',
    email: '',
    telefono: '',
    comentarios: ''
  })
  const [sendingIntegrationRequest, setSendingIntegrationRequest] = useState(false)

  // Estados para Google Drive
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false)
  const [connectingGoogleDrive, setConnectingGoogleDrive] = useState(false)

  useEffect(() => {
    // Sincronizar el tab activo con la prop del routing
    if (propActiveTab && propActiveTab !== activeTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab, activeTab])

  // Extraer companyId de la URL si estamos en modo empresa específica
  useEffect(() => {
    if (propCompanyId === true) {
      // Estamos en modo empresa específica, extraer el ID de la URL
      const pathParts = location.pathname.split('/')
      const companyIdFromUrl = pathParts[pathParts.length - 1]
      if (companyIdFromUrl && companyIdFromUrl !== 'empresas') {
        setCompanyId(companyIdFromUrl)
        
        // Cargar la empresa específica para editar
        const loadSpecificCompany = async () => {
          try {
            const companiesData = await companySyncService.getCompanies()
            const specificCompany = companiesData.find(c => c.id === companyIdFromUrl)
            if (specificCompany) {
              setEditingCompany(specificCompany)
              setShowCompanyForm(true)
            }
          } catch (error) {
            console.error('Error loading specific company:', error)
            toast.error('Error al cargar la empresa especificada')
          }
        }
        
        if (companies.length === 0) {
          loadCompanies().then(() => {
            loadSpecificCompany()
          })
        } else {
          loadSpecificCompany()
        }
      } else {
        // Resetear estados si no hay companyId válido
        setCompanyId(null)
        setEditingCompany(null)
        setShowCompanyForm(false)
      }
    }
  }, [propCompanyId, location.pathname, companies.length])

  // ✅ FIX MINIFICACIÓN: Mover loadData ANTES de useEffect con useCallback
  const loadData = useCallback(async () => {
    try {
      // Cargar datos de forma secuencial para evitar parpadeo
      await loadCompanies()
      
      // Cargar configuraciones locales en paralelo (no causan re-renders significativos)
      await Promise.all([
        loadNotificationSettings(),
        loadSecuritySettings(),
        loadActiveSessions(),
        loadSecurityLogs(),
        loadBackupSettings(),
        loadHierarchyMode(),
        checkGoogleDriveConnection(),
        checkBrevoConfiguration(),
        checkGroqConfiguration(),
        checkWhatsAppConfiguration(),
        checkWhatsAppOfficialConfiguration(),
        checkWhatsAppWahaConfiguration(),
        checkTelegramConfiguration()
      ])
    } catch (error) {
      console.error('Error loading settings data:', error)
    }
  }, [
    loadCompanies,
    loadNotificationSettings,
    loadSecuritySettings,
    loadActiveSessions,
    loadSecurityLogs,
    loadBackupSettings,
    loadHierarchyMode,
    checkGoogleDriveConnection,
    checkBrevoConfiguration,
    checkGroqConfiguration,
    checkWhatsAppConfiguration,
    checkWhatsAppOfficialConfiguration,
    checkWhatsAppWahaConfiguration,
    checkTelegramConfiguration
  ])

  useEffect(() => {
    // Evitar ejecución múltiple si no hay usuario
    if (!user?.id) return
    
    // Usar un flag para evitar ejecuciones duplicadas
    let isMounted = true
    
    if (isMounted) {
      loadData()
    }
    
    return () => {
      isMounted = false
    }
  }, [user?.id, loadData]) // Incluir loadData en dependencias

  // Eliminado el useEffect que causaba parpadeo - ahora el tab se maneja de forma estática

  // Cargar configuraciones de notificaciones desde el servicio centralizado
  const loadNotificationSettings = useCallback(async () => {
    try {
      const saved = await configurationService.getNotificationSettings()
      if (saved) {
        // Asegurar que recipients sea siempre un array
        const settingsWithArrayRecipients = {
          ...saved,
          reports: {
            ...saved.reports,
            recipients: Array.isArray(saved.reports?.recipients)
              ? saved.reports.recipients
              : saved.reports?.recipients
                ? [saved.reports.recipients] // Convertir string a array
                : [user?.email || ''] // Valor por defecto
          }
        }
        setNotificationSettings(prev => ({ ...prev, ...settingsWithArrayRecipients }))
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }, [user?.email])

  // Funciones para manejar el modo de jerarquía de configuración
  const handleHierarchyModeChange = async (newMode) => {
    try {
      setHierarchyMode(newMode)

      // Guardar en el servicio de configuración centralizado
      await configurationService.setConfig('system', 'hierarchy_mode', newMode, 'global', null,
        'Modo de jerarquía de configuración del sistema')

      // Mostrar mensaje informativo sobre el cambio
      const modeDescriptions = {
        global_only: 'Solo se usarán configuraciones globales. Las configuraciones por empresa serán ignoradas.',
        company_first: 'Se priorizarán configuraciones por empresa. Si no existen, se usarán las globales.',
        both: 'Se combinarán ambas configuraciones. Las específicas de empresa sobreescribirán las globales.'
      }

      toast.success(`Modo de configuración actualizado: ${newMode.replace('_', ' ').toUpperCase()}`)

      // Mostrar detalles del modo
      setTimeout(() => {
        Swal.fire({
          title: '🔧 Modo de Configuración Actualizado',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #0066ff;">Modo seleccionado:</h4>
                <p style="margin: 0; font-weight: bold; text-transform: uppercase;">
                  ${newMode.replace('_', ' ')}
                </p>
              </div>
              <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">Comportamiento:</h4>
                <p style="margin: 0; font-size: 14px;">
                  ${modeDescriptions[newMode]}
                </p>
              </div>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0066ff',
          width: '500px'
        });
      }, 500)

    } catch (error) {
      console.error('Error changing hierarchy mode:', error)
      toast.error('Error al cambiar el modo de configuración')
    }
  }

  // Cargar configuración de jerarquía desde el servicio centralizado
  const loadHierarchyMode = useCallback(async () => {
    try {
      const saved = await configurationService.getConfig('system', 'hierarchy_mode', 'global', null, 'company_first')
      if (saved && ['global_only', 'company_first', 'both'].includes(saved)) {
        setHierarchyMode(saved)
      }
    } catch (error) {
      console.error('Error loading hierarchy mode:', error)
    }
  }, [])

  // Guardar configuraciones de notificaciones
  const saveNotificationSettings = async (settings) => {
    try {
      await configurationService.setNotificationSettings(settings)
      toast.success('Configuración de notificaciones guardada')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Error al guardar la configuración')
    }
  }

  // Cargar configuraciones de seguridad
  const loadSecuritySettings = useCallback(async () => {
    try {
      const saved = await configurationService.getSecuritySettings()
      if (saved) {
        setSecuritySettings(prev => ({ ...prev, ...saved }))
      }
    } catch (error) {
      console.error('Error loading security settings:', error)
    }
  }, [])

  // Cargar sesiones activas
  const loadActiveSessions = useCallback(() => {
    try {
      // Simular sesiones activas (en producción vendría de una API)
      const sessions = [
        {
          id: 'current',
          device: 'Chrome en macOS',
          location: 'Santiago, Chile',
          ip: '192.168.1.100',
          lastActivity: new Date(),
          current: true
        },
        {
          id: 'session_2',
          device: 'Safari en iPhone',
          location: 'Santiago, Chile',
          ip: '192.168.1.101',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          current: false
        }
      ]
      setActiveSessions(sessions)
    } catch (error) {
      console.error('Error loading active sessions:', error)
    }
  }, [])

  // Cargar logs de seguridad
  const loadSecurityLogs = useCallback(() => {
    try {
      // Simular logs de seguridad (en producción vendría de una API)
      const logs = [
        {
          id: 1,
          action: 'Inicio de sesión exitoso',
          details: 'Chrome • Santiago, Chile',
          timestamp: new Date(),
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: 2,
          action: 'Cambio de contraseña',
          details: 'Aplicación web',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: 3,
          action: 'Configuración de 2FA',
          details: 'Aplicación web',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 semana atrás
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: 4,
          action: 'Intento de inicio de sesión fallido',
          details: 'IP sospechosa • Nueva York, USA',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 días atrás
          ip: '104.28.1.100',
          status: 'warning'
        }
      ]
      setSecurityLogs(logs)
    } catch (error) {
      console.error('Error loading security logs:', error)
    }
  }, [])

  // Cargar configuraciones de backup
  const loadBackupSettings = useCallback(async () => {
    try {
      const saved = await configurationService.getConfig('system', 'backup_settings', 'global', null, {
        autoBackup: true,
        backupFrequency: 'weekly',
        retentionDays: 30,
        lastBackup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
        backupSize: '2.3 GB'
      })
      setBackupSettings(prev => ({ ...prev, ...saved }))
    } catch (error) {
      console.error('Error loading backup settings:', error)
    }
  }, [])

  // Función para verificar conexión de Google Drive
  const checkGoogleDriveConnection = useCallback(async () => {
    try {
      // Verificar si el usuario está conectado a Google Drive usando el servicio de persistencia
      const isConnected = await googleDrivePersistenceService.isConnected(user?.id)
      setIsGoogleDriveConnected(isConnected)
      
      // Obtener estado detallado si está conectado
      if (isConnected) {
        const status = await googleDrivePersistenceService.getConnectionStatus(user?.id)
        setIntegrations(prev => ({
          ...prev,
          google: {
            connected: status.connected,
            status: status.connected ? 'connected' : 'disconnected',
            lastSync: status.lastSync || new Date().toISOString(),
            email: status.email
          }
        }))
      } else {
        setIntegrations(prev => ({
          ...prev,
          google: {
            connected: false,
            status: 'disconnected',
            lastSync: null
          }
        }))
      }
    } catch (error) {
      console.error('❌ [Settings] Error verificando conexión de Google Drive:', error)
      setIsGoogleDriveConnected(false)
      setIntegrations(prev => ({
        ...prev,
        google: {
          connected: false,
          status: 'disconnected',
          lastSync: null
        }
      }))
    }
  }, [user?.id])

  // Función para verificar configuración de Brevo
  const checkBrevoConfiguration = useCallback(() => {
    const config = brevoService.loadConfiguration()
    setIntegrations(prev => ({
      ...prev,
      brevo: {
        connected: config.apiKey ? true : false,
        status: config.apiKey ? 'connected' : 'disconnected',
        lastSync: config.apiKey ? new Date().toISOString() : null,
        testMode: config.testMode
      }
    }))
  }, [])

  // Función para verificar configuración de Groq
  const checkGroqConfiguration = useCallback(async () => {
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY
      const groqConfig = await configurationService.getConfig('integrations', 'groq', 'global', null, {})

      setIntegrations(prev => ({
        ...prev,
        groq: {
          connected: !!(apiKey && apiKey !== 'tu_groq_api_key_aqui'),
          status: !!(apiKey && apiKey !== 'tu_groq_api_key_aqui') ? 'connected' : 'disconnected',
          lastSync: !!(apiKey && apiKey !== 'tu_groq_api_key_aqui') ? new Date().toISOString() : null,
          model: groqConfig.model || 'gemma2-9b-it'
        }
      }))
    } catch (error) {
      console.error('Error checking Groq configuration:', error)
      setIntegrations(prev => ({
        ...prev,
        groq: {
          connected: false,
          status: 'disconnected',
          lastSync: null,
          model: 'gemma2-9b-it'
        }
      }))
    }
  }, [])

  // Función para verificar configuración de WhatsApp
  const checkWhatsAppConfiguration = useCallback(async () => {
    try {
      const whatsappConfig = await configurationService.getConfig('integrations', 'whatsapp', 'global', null, {})

      setIntegrations(prev => ({
        ...prev,
        whatsapp: {
          connected: !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId),
          status: !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId) ? 'connected' : 'disconnected',
          lastSync: !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId) ? new Date().toISOString() : null,
          testMode: whatsappConfig.testMode || false
        }
      }))
    } catch (error) {
      console.error('Error checking WhatsApp configuration:', error)
      setIntegrations(prev => ({
        ...prev,
        whatsapp: {
          connected: false,
          status: 'disconnected',
          lastSync: null,
          testMode: false
        }
      }))
    }
  }, [])

  // Función para verificar configuración de Telegram
  const checkTelegramConfiguration = useCallback(async () => {
    try {
      const telegramConfig = await configurationService.getConfig('integrations', 'telegram', 'global', null, {})

      setIntegrations(prev => ({
        ...prev,
        telegram: {
          connected: !!(telegramConfig.botToken && telegramConfig.botUsername),
          status: !!(telegramConfig.botToken && telegramConfig.botUsername) ? 'connected' : 'disconnected',
          lastSync: !!(telegramConfig.botToken && telegramConfig.botUsername) ? new Date().toISOString() : null,
          botToken: telegramConfig.botToken,
          botUsername: telegramConfig.botUsername
        }
      }))
    } catch (error) {
      console.error('Error checking Telegram configuration:', error)
      setIntegrations(prev => ({
        ...prev,
        telegram: {
          connected: false,
          status: 'disconnected',
          lastSync: null,
          botToken: null,
          botUsername: null
        }
      }))
    }
  }, [])

  // Función para verificar configuración de WhatsApp Official
  const checkWhatsAppOfficialConfiguration = useCallback(() => {
    const config = whatsappOfficialService.loadConfiguration();
    
    setIntegrations(prev => ({
      ...prev,
      whatsappOfficial: {
        connected: !!(config.accessToken && config.phoneNumberId),
        status: !!(config.accessToken && config.phoneNumberId) ? 'connected' : 'disconnected',
        lastSync: !!(config.accessToken && config.phoneNumberId) ? new Date().toISOString() : null,
        testMode: config.testMode
      }
    }))
  }, [])

  // Función para verificar configuración de WhatsApp WAHA
  const checkWhatsAppWahaConfiguration = useCallback(() => {
    const config = whatsappWahaService.loadConfiguration();
    
    setIntegrations(prev => ({
      ...prev,
      whatsappWaha: {
        connected: !!(config.apiKey && config.sessionId),
        status: !!(config.apiKey && config.sessionId) ? 'connected' : 'disconnected',
        lastSync: !!(config.apiKey && config.sessionId) ? new Date().toISOString() : null,
        testMode: config.testMode
      }
    }))
  }, [])

  // Función para conectar Google Drive
  const handleConnectGoogleDrive = async () => {
    try {
      setConnectingGoogleDrive(true)
      
      // Verificar si hay credenciales configuradas
      if (!googleDriveService.hasValidCredentials()) {
        setConnectingGoogleDrive(false)
        
        // Mostrar mensaje para configurar credenciales
        Swal.fire({
          title: '🔧 Configuración de Google OAuth Requerida',
          html: `
            <div style="text-align: left; max-width: 500px;">
              <div style="background-color: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #ffeaa7;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">⚠️ Credenciales Faltantes</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                  Para conectar con Google Drive, necesitas configurar las credenciales de OAuth 2.0 en Google Cloud Console.
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">📋 Pasos necesarios:</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                  <li>Ir a <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                  <li>Crear o seleccionar un proyecto</li>
                  <li>Habilitar Google Drive API</li>
                  <li>Crear credenciales OAuth 2.0</li>
                  <li>Configurar URI de redirección: <code>${window.location.origin}/auth/google/callback</code></li>
                  <li>Actualizar variables en <code>.env</code></li>
                </ol>
              </div>
              
              <div style="background-color: #d4edda; padding: 12px; border-radius: 8px;">
                <p style="margin: 0; font-size: 13px; color: #155724; text-align: center;">
                  <strong>📖 Ver guía completa:</strong><br>
                  <a href="/GOOGLE_OAUTH_SETUP_GUIDE.md" target="_blank" style="color: #155724; text-decoration: underline;">
                    GOOGLE_OAUTH_SETUP_GUIDE.md
                  </a>
                </p>
              </div>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#856404',
          width: '600px'
        })
        return
      }
      
      // Generar URL de autorización con el callback handler (incluye CSRF protection)
      const authUrl = googleDriveCallbackHandler.generateAuthorizationUrl()
      if (authUrl) {
        // El state ya fue guardado en sessionStorage por generateAuthorizationUrl()
        // Redirigir a Google OAuth
        window.location.href = authUrl
      } else {
        setConnectingGoogleDrive(false)
        toast.error('Error al generar URL de autenticación')
      }
    } catch (error) {
      console.error('Error en connect Google Drive:', error)
      setConnectingGoogleDrive(false)
      toast.error('Error al conectar con Google Drive')
    }
  }

  // Función para desconectar Google Drive
  const handleDisconnectGoogleDrive = async () => {
    try {
      setConnectingGoogleDrive(true)
      
      // Confirmar desconexión
      const result = await Swal.fire({
        title: '¿Desconectar Google Drive?',
        text: 'Se eliminarán las credenciales guardadas y perderás la sincronización.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Desconectar',
        cancelButtonText: 'Cancelar'
      })
      
      if (!result.isConfirmed) {
        setConnectingGoogleDrive(false)
        return
      }
      
      // Desconectar
      const disconnectResult = await googleDrivePersistenceService.disconnect(user?.id)
      
      if (disconnectResult.success) {
        // Actualizar estados locales
        setIsGoogleDriveConnected(false)
        setIntegrations(prev => ({
          ...prev,
          google: {
            connected: false,
            status: 'disconnected',
            lastSync: null
          }
        }))
        
        toast.success('Google Drive desconectado exitosamente')
      } else {
        throw new Error(disconnectResult.error?.message || 'Error al desconectar')
      }
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error)
      toast.error('Error al desconectar Google Drive')
    } finally {
      setConnectingGoogleDrive(false)
    }
  }

  // Funciones para manejar cambios en las configuraciones
  const handleEmailNotificationChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }))
  }


  const handleReportsSettingsChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      reports: { ...prev.reports, [key]: value }
    }))
  }

  const handleSoundSettingsChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      sound: { ...prev.sound, [key]: value }
    }))
  }

  // Funciones para guardar configuraciones específicas
  const saveEmailPreferences = async () => {
    await saveNotificationSettings(notificationSettings)
  }


  // Funciones para manejar múltiples emails
  const addEmailRecipient = () => {
    const newEmail = prompt('Ingresa el email del destinatario:')
    if (newEmail) {
      const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/
      if (!emailRegex.test(newEmail)) {
        toast.error('Por favor ingresa un email válido')
        return
      }

      if (notificationSettings.reports.recipients.includes(newEmail)) {
        toast.error('Este email ya está en la lista')
        return
      }

      handleReportsSettingsChange('recipients', [...notificationSettings.reports.recipients, newEmail])
      toast.success('Email agregado correctamente')
    }
  }

  const removeEmailRecipient = (emailToRemove) => {
    const updatedRecipients = notificationSettings.reports.recipients.filter(email => email !== emailToRemove)
    handleReportsSettingsChange('recipients', updatedRecipients)
    toast.success('Email removido correctamente')
  }

  const scheduleReports = async () => {
    // Validar que haya al menos un email
    if (!notificationSettings.reports.recipients || notificationSettings.reports.recipients.length === 0) {
      toast.error('Por favor agrega al menos un destinatario')
      return
    }

    // Validar que todos los emails sean válidos
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/
    const invalidEmails = notificationSettings.reports.recipients.filter(email => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      toast.error(`Los siguientes emails no son válidos: ${invalidEmails.join(', ')}`)
      return
    }

    // Guardar configuraciones
    await saveNotificationSettings(notificationSettings)
    toast.success(`Configuración guardada. Redirigiendo a reportes...`)

    // Redirigir a la página de reportes después de un breve delay
    setTimeout(() => {
      navigate('/communication/reports')
    }, 1500)
  }

  const testSounds = async () => {
    if (!notificationSettings.sound.enabled) {
      toast.info('Los sonidos están desactivados')
      return
    }

    // Crear un audio de prueba (beep simple)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(notificationSettings.sound.volume / 100, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      toast.success('Sonido de prueba reproducido')
    } catch (error) {
      console.error('Error testing sound:', error)
      toast.error('Error al reproducir sonido de prueba')
    }
  }

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)

      // Invalidar caché para forzar lectura fresca de Supabase
      companySyncService.invalidateCache('companies_all')
      
      // Usar el servicio de sincronización para cargar empresas (maneja caché e invalidación)
      const companiesData = await companySyncService.getCompanies()
      
      // 🐛 DEBUG: Verificar valores reales de status
      console.log('=== DEBUG: Empresas cargadas ===')
      companiesData?.forEach(company => {
        console.log(`Empresa: ${company.name}, Status: "${company.status}" (${typeof company.status})`)
      })
      
      setCompanies(companiesData || [])

    } catch (error) {
      console.error('Error loading companies:', error)
      // En caso de error, usar datos mínimos
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreateCompany = () => {
    setEditingCompany(null)
    setShowCompanyForm(true)
  }


  const handleDeleteCompany = async (companyId) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return

    // Usar toast para confirmar eliminación
    const confirmed = await new Promise((resolve) => {
      const confirmDelete = () => {
        resolve(true)
      }
      const cancelDelete = () => resolve(false)

      // Mostrar toast con botones personalizados
      toast((t) => (
        <div>
          <p className="font-medium">¿Eliminar empresa "{company.name}"?</p>
          <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                confirmDelete()
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Eliminar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                cancelDelete()
              }}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ), { duration: 10000 })
    })

    if (!confirmed) return

    try {
      // Usar el servicio de sincronización para eliminar la empresa
      await companySyncService.deleteCompany(companyId)
      
      // Actualizar estado local
      setCompanies(prev => prev.filter(c => c.id !== companyId))
      toast.success('Empresa eliminada exitosamente')

    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('Error al eliminar la empresa')
    }
  }

  const handleFormSuccess = () => {
    setShowCompanyForm(false)
    setEditingCompany(null)
    loadCompanies()
  }

  const toggleCompanyStatus = async (company) => {
    try {
      const newStatus = company.status === 'active' ? 'inactive' : 'active'
      
      // Usar el servicio de sincronización para actualizar el estado
      await companySyncService.updateCompany(company.id, {
        status: newStatus
      })
      
      // Invalidar caché para forcer lectura fresca de Supabase
      companySyncService.invalidateCache('companies_all')
      companySyncService.invalidateCache('company_' + company.id)
      
      // Actualizar estado local
      setCompanies(prev => prev.map(c =>
        c.id === company.id
          ? { ...c, status: newStatus, updated_at: new Date().toISOString() }
          : c
      ))
      toast.success(`Empresa ${newStatus === 'active' ? 'activada' : 'desactivada'}`)

    } catch (error) {
      console.error('Error toggling company status:', error)
      toast.error('Error al cambiar el estado de la empresa')
    }
  }

  // Funciones de integraciones
  const configureGoogleWorkspace = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Google Workspace',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">API Key:</label>
            <input type="password" id="google-api-key" class="swal2-input" placeholder="Ingresa tu API Key de Google">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client ID:</label>
            <input type="text" id="google-client-id" class="swal2-input" placeholder="Ingresa tu Client ID">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client Secret:</label>
            <input type="password" id="google-client-secret" class="swal2-input" placeholder="Ingresa tu Client Secret">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Permisos requeridos:</strong><br>
            • Calendar API<br>
            • Gmail API<br>
            • Google Drive API
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('google-api-key').value;
        const clientId = document.getElementById('google-client-id').value;
        const clientSecret = document.getElementById('google-client-secret').value;

        if (!apiKey || !clientId || !clientSecret) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        return { apiKey, clientId, clientSecret };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4285f4'
    });

    if (formValues) {
      // Simular conexión
      setIntegrations(prev => ({ ...prev, google: { ...prev.google, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular éxito de conexión
      setIntegrations(prev => ({
        ...prev,
        google: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString()
        }
      }));

      toast.success('Google Workspace conectado exitosamente');
    }
  };

  /*
  const configureMicrosoft365 = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Microsoft 365 / Google Calendar',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Plataforma:</label>
            <select id="platform-select" class="swal2-input">
              <option value="microsoft">Microsoft 365 (Outlook)</option>
              <option value="google-calendar">Google Calendar</option>
            </select>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client ID:</label>
            <input type="text" id="microsoft-client-id" class="swal2-input" placeholder="Ingresa tu Client ID">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Tenant ID (solo Microsoft):</label>
            <input type="text" id="microsoft-tenant-id" class="swal2-input" placeholder="Ingresa tu Tenant ID">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client Secret:</label>
            <input type="password" id="microsoft-client-secret" class="swal2-input" placeholder="Ingresa tu Client Secret">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">¿Enviar recordatorios por WhatsApp?</label>
            <input type="checkbox" id="whatsapp-reminders" checked style="margin-left: 8px;">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Funcionalidades activadas:</strong><br>
            • 📅 Recordatorios de reuniones por WhatsApp<br>
            • 🔄 Notificaciones de cambios en calendario<br>
            • 📎 Enlaces directos a archivos de OneDrive/SharePoint<br>
            • ⏰ Alertas 15 minutos antes de reuniones
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const platform = document.getElementById('platform-select').value;
        const clientId = document.getElementById('microsoft-client-id').value;
        const tenantId = document.getElementById('microsoft-tenant-id').value;
        const clientSecret = document.getElementById('microsoft-client-secret').value;
        const whatsappReminders = document.getElementById('whatsapp-reminders').checked;

        if (!clientId || !clientSecret) {
          Swal.showValidationMessage('Client ID y Client Secret son obligatorios');
          return false;
        }

        if (platform === 'microsoft' && !tenantId) {
          Swal.showValidationMessage('Tenant ID es obligatorio para Microsoft 365');
          return false;
        }

        return { platform, clientId, tenantId, clientSecret, whatsappReminders };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0078d4'
    });

    if (formValues) {
      // Simular conexión
      setIntegrations(prev => ({ ...prev, microsoft365: { ...prev.microsoft365, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2500));

      // Simular éxito de conexión
      setIntegrations(prev => ({
        ...prev,
        microsoft365: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString(),
          platform: formValues.platform,
          whatsappReminders: formValues.whatsappReminders
        }
      }));

      const platformName = formValues.platform === 'microsoft' ? 'Microsoft 365' : 'Google Calendar';
      toast.success(`${platformName} conectado exitosamente con WhatsApp`);

      // Mostrar mensaje informativo sobre las funcionalidades
      setTimeout(() => {
        Swal.fire({
          title: '🎉 Integración Activada',
          html: `
            <div style="text-align: left;">
              <p><strong>Funcionalidades activadas:</strong></p>
              <ul style="text-align: left; margin-top: 10px;">
                <li>📅 Recordatorios automáticos por WhatsApp</li>
                <li>🔄 Notificaciones de cambios en calendario</li>
                <li>📎 Enlaces directos a documentos compartidos</li>
                <li>⏰ Alertas 15 minutos antes de reuniones</li>
              </ul>
              <p style="margin-top: 15px; color: #666; font-size: 14px;">
                Los empleados recibirán notificaciones automáticas en WhatsApp para todas las reuniones y actualizaciones de calendario.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      }, 1000);
    }
  };

  const configureSlack = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Slack',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Bot Token:</label>
            <input type="password" id="slack-bot-token" class="swal2-input" placeholder="xoxb-...">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Signing Secret:</label>
            <input type="password" id="slack-signing-secret" class="swal2-input" placeholder="Ingresa tu Signing Secret">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Canal por defecto:</label>
            <input type="text" id="slack-default-channel" class="swal2-input" placeholder="#general" value="#general">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Permisos del Bot:</strong><br>
            • chat:write<br>
            • channels:read<br>
            • users:read
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const botToken = document.getElementById('slack-bot-token').value;
        const signingSecret = document.getElementById('slack-signing-secret').value;
        const defaultChannel = document.getElementById('slack-default-channel').value;

        if (!botToken || !signingSecret) {
          Swal.showValidationMessage('Bot Token y Signing Secret son obligatorios');
          return false;
        }

        return { botToken, signingSecret, defaultChannel };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a154b'
    });

    if (formValues) {
      setIntegrations(prev => ({ ...prev, slack: { ...prev.slack, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations(prev => ({
        ...prev,
        slack: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString()
        }
      }));

      toast.success('Slack conectado exitosamente');
    }
  };
  */

  const configureTeams = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Microsoft Teams',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Application ID:</label>
            <input type="text" id="teams-app-id" class="swal2-input" placeholder="Ingresa tu Application ID">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client Secret:</label>
            <input type="password" id="teams-client-secret" class="swal2-input" placeholder="Ingresa tu Client Secret">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Tenant ID:</label>
            <input type="text" id="teams-tenant-id" class="swal2-input" placeholder="Ingresa tu Tenant ID">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Permisos requeridos:</strong><br>
            • ChannelMessage.Send<br>
            • Chat.ReadWrite<br>
            • User.Read
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const appId = document.getElementById('teams-app-id').value;
        const clientSecret = document.getElementById('teams-client-secret').value;
        const tenantId = document.getElementById('teams-tenant-id').value;

        if (!appId || !clientSecret || !tenantId) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        return { appId, clientSecret, tenantId };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#464775'
    });

    if (formValues) {
      setIntegrations(prev => ({ ...prev, teams: { ...prev.teams, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations(prev => ({
        ...prev,
        teams: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString()
        }
      }));

      toast.success('Microsoft Teams conectado exitosamente');
    }
  };

  const configureHubSpot = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar HubSpot',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">API Key:</label>
            <input type="password" id="hubspot-api-key" class="swal2-input" placeholder="Ingresa tu API Key de HubSpot">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Portal ID (opcional):</label>
            <input type="text" id="hubspot-portal-id" class="swal2-input" placeholder="Ingresa tu Portal ID">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Scopes requeridos:</strong><br>
            • contacts<br>
            • companies<br>
            • deals
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('hubspot-api-key').value;
        const portalId = document.getElementById('hubspot-portal-id').value;

        if (!apiKey) {
          Swal.showValidationMessage('API Key es obligatoria');
          return false;
        }

        return { apiKey, portalId };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff7a59'
    });

    if (formValues) {
      setIntegrations(prev => ({ ...prev, hubspot: { ...prev.hubspot, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations(prev => ({
        ...prev,
        hubspot: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString()
        }
      }));

      toast.success('HubSpot conectado exitosamente');
    }
  };

  const configureGoogleMeet = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Google Meet',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">API Key:</label>
            <input type="password" id="googlemeet-api-key" class="swal2-input" placeholder="Ingresa tu API Key de Google">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client ID:</label>
            <input type="text" id="googlemeet-client-id" class="swal2-input" placeholder="Ingresa tu Client ID">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client Secret:</label>
            <input type="password" id="googlemeet-client-secret" class="swal2-input" placeholder="Ingresa tu Client Secret">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">¿Enviar recordatorios por WhatsApp?</label>
            <input type="checkbox" id="googlemeet-whatsapp-reminders" checked style="margin-left: 8px;">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Permisos requeridos:</strong><br>
            • Google Meet API<br>
            • Calendar API<br>
            • Gmail API
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('googlemeet-api-key').value;
        const clientId = document.getElementById('googlemeet-client-id').value;
        const clientSecret = document.getElementById('googlemeet-client-secret').value;
        const whatsappReminders = document.getElementById('googlemeet-whatsapp-reminders').checked;

        if (!apiKey || !clientId || !clientSecret) {
          Swal.showValidationMessage('API Key, Client ID y Client Secret son obligatorios');
          return false;
        }

        return { apiKey, clientId, clientSecret, whatsappReminders };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4285f4'
    });

    if (formValues) {
      setIntegrations(prev => ({ ...prev, googlemeet: { ...prev.googlemeet, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations(prev => ({
        ...prev,
        googlemeet: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString(),
          whatsappReminders: formValues.whatsappReminders
        }
      }));

      toast.success('Google Meet conectado exitosamente');

      // Mostrar mensaje informativo sobre las funcionalidades
      setTimeout(() => {
        Swal.fire({
          title: '🎥 Google Meet Activado',
          html: `
            <div style="text-align: left;">
              <p><strong>Funcionalidades activadas:</strong></p>
              <ul style="text-align: left; margin-top: 10px;">
                <li>📹 Recordatorios automáticos de reuniones por WhatsApp</li>
                <li>🔄 Notificaciones de cambios en reuniones</li>
                <li>📎 Enlaces directos a reuniones de Google Meet</li>
                <li>⏰ Alertas 15 minutos antes de reuniones</li>
                <li>📝 Integración con calendario de empleados</li>
              </ul>
              <p style="margin-top: 15px; color: #666; font-size: 14px;">
                Los empleados recibirán notificaciones automáticas en WhatsApp para todas las reuniones y actualizaciones de Google Meet.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      }, 1000);
    }
  };

  const configureSalesforce = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Salesforce',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Consumer Key:</label>
            <input type="text" id="salesforce-consumer-key" class="swal2-input" placeholder="Ingresa tu Consumer Key">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Consumer Secret:</label>
            <input type="password" id="salesforce-consumer-secret" class="swal2-input" placeholder="Ingresa tu Consumer Secret">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Username:</label>
            <input type="email" id="salesforce-username" class="swal2-input" placeholder="usuario@empresa.com">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Password + Security Token:</label>
            <input type="password" id="salesforce-password" class="swal2-input" placeholder="Contraseña + Token de seguridad">
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px;">
            <strong>Permisos requeridos:</strong><br>
            • API Enabled<br>
            • View All Data<br>
            • Modify All Data
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const consumerKey = document.getElementById('salesforce-consumer-key').value;
        const consumerSecret = document.getElementById('salesforce-consumer-secret').value;
        const username = document.getElementById('salesforce-username').value;
        const password = document.getElementById('salesforce-password').value;

        if (!consumerKey || !consumerSecret || !username || !password) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        return { consumerKey, consumerSecret, username, password };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00a1e0'
    });

    if (formValues) {
      setIntegrations(prev => ({ ...prev, salesforce: { ...prev.salesforce, status: 'connecting' } }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations(prev => ({
        ...prev,
        salesforce: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString()
        }
      }));

      toast.success('Salesforce conectado exitosamente');
    }
  };

  const configureBrevo = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Brevo - SMS y Email Masivo',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">API Key v3:</label>
            <input type="password" id="brevo-api-key" class="swal2-input" placeholder="Ingresa tu API Key v3 de Brevo">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Nombre del remitente SMS:</label>
            <input type="text" id="brevo-sms-sender" class="swal2-input" placeholder="Ej: StaffHub" maxlength="11">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Email del remitente:</label>
            <input type="email" id="brevo-email-sender" class="swal2-input" placeholder="noreply@tuempresa.com">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Nombre del remitente Email:</label>
            <input type="text" id="brevo-email-name" class="swal2-input" placeholder="Ej: StaffHub">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="brevo-test-mode" style="margin-right: 8px;" checked>
              <span style="font-weight: 600;">Modo de prueba</span>
            </label>
            <p style="font-size: 12px; color: #666; margin-top: 4px; margin-left: 20px;">
              En modo prueba, los mensajes se enviarán solo a números de prueba
            </p>
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 16px; background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
            <strong style="color: #0066ff;">📋 Instrucciones para obtener API Key:</strong><br>
            1. Ve a <a href="https://app.brevo.com" target="_blank" style="color: #0066ff;">app.brevo.com</a><br>
            2. Ve a Configuración → Claves API<br>
            3. Crea una nueva clave v3 con permisos de SMS y Email<br>
            4. Copia y pega la clave aquí
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 12px; background-color: #e8f4fd; padding: 12px; border-radius: 4px;">
            <strong style="color: #0066ff;">🚀 Funcionalidades incluidas:</strong><br>
            • SMS masivo (hasta 1000 por lote)<br>
            • Email masivo (hasta 2000 por lote)<br>
            • Estadísticas en tiempo real<br>
            • Plantillas personalizadas<br>
            • Programación de envíos<br>
            • Modo prueba para desarrollo
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('brevo-api-key').value;
        const smsSender = document.getElementById('brevo-sms-sender').value;
        const emailSender = document.getElementById('brevo-email-sender').value;
        const emailName = document.getElementById('brevo-email-name').value;
        const testMode = document.getElementById('brevo-test-mode').checked;

        if (!apiKey) {
          Swal.showValidationMessage('La API Key es obligatoria');
          return false;
        }

        if (!smsSender || smsSender.length < 3) {
          Swal.showValidationMessage('El nombre del remitente SMS debe tener al menos 3 caracteres');
          return false;
        }

        if (!emailSender || !emailSender.includes('@')) {
          Swal.showValidationMessage('El email del remitente es inválido');
          return false;
        }

        if (!emailName || emailName.length < 2) {
          Swal.showValidationMessage('El nombre del remitente email debe tener al menos 2 caracteres');
          return false;
        }

        return { apiKey, smsSender, emailSender, emailName, testMode };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar y Probar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066ff',
      width: '600px'
    });

    if (formValues) {
      // Mostrar estado de conexión
      setIntegrations(prev => ({ ...prev, brevo: { ...prev.brevo, status: 'connecting' } }));

      try {
        // Configurar el servicio de Brevo
        const config = {
          apiKey: formValues.apiKey,
          smsSender: formValues.smsSender,
          emailSender: formValues.emailSender,
          emailName: formValues.emailName,
          testMode: formValues.testMode
        };

        // Guardar configuración
        brevoService.saveConfiguration(config);

        // Probar conexión
        const testResult = await brevoService.testConnection();

        if (testResult.success) {
          // Actualizar estado
          setIntegrations(prev => ({
            ...prev,
            brevo: {
              connected: true,
              status: 'connected',
              lastSync: new Date().toISOString(),
              testMode: formValues.testMode
            }
          }));

          // Mostrar éxito
          await Swal.fire({
            title: '🎉 Brevo Configurado Exitosamente',
            html: `
              <div style="text-align: left;">
                <div style="background-color: #d4edda; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #155724;">✅ Conexión exitosa</h4>
                  <p style="margin: 0; font-size: 14px;">La API Key es válida y todas las funcionalidades están activas.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">Configuración guardada:</h4>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Remitente SMS:</strong> ${formValues.smsSender}<br>
                    <strong>Remitente Email:</strong> ${formValues.emailName} <${formValues.emailSender}><br>
                    <strong>Modo:</strong> ${formValues.testMode ? 'Prueba 🧪' : 'Producción 🚀'}
                  </p>
                </div>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; margin-top: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #0066ff;">📊 Estadísticas disponibles:</h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>• SMS enviados: ${testResult.data?.sms?.sent || 0}</li>
                    <li>• Emails enviados: ${testResult.data?.email?.sent || 0}</li>
                    <li>• Créditos SMS: ${testResult.data?.sms?.credits || 'N/A'}</li>
                    <li>• Créditos Email: ${testResult.data?.email?.credits || 'N/A'}</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: '¡Perfecto!',
            confirmButtonColor: '#0066ff',
            width: '500px'
          });

          toast.success('Brevo configurado exitosamente');
        } else {
          throw new Error(testResult.error || 'Error al conectar con Brevo');
        }
      } catch (error) {
        console.error('Error configuring Brevo:', error);
        
        // Restaurar estado
        setIntegrations(prev => ({
          ...prev,
          brevo: {
            connected: false,
            status: 'disconnected',
            lastSync: null,
            testMode: false
          }
        }));

        // Mostrar error
        await Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #721c24;">No se pudo conectar con Brevo</h4>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${error.message}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">🔍 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>• Verifica que la API Key sea correcta</li>
                  <li>• Asegúrate de que la API Key tenga permisos de SMS y Email</li>
                  <li>• Revisa que tu cuenta de Brevo esté activa</li>
                  <li>• Verifica tu conexión a internet</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });

        toast.error('Error al configurar Brevo');
      }
    }
  };

  const configureGroq = async () => {
    // Lista de modelos disponibles de Groq (actualizada con modelos reales)
    const availableModels = [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Modelo de Meta de 70B parámetros, versátil para múltiples tareas' },
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', description: 'Modelo de última generación de Meta, 17B parámetros' },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', description: 'Modelo optimizado de Meta, 17B parámetros' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Modelo rápido de Meta, 8B parámetros, respuestas instantáneas' },
      { id: 'allam-2-7b', name: 'Allam 2 7B', description: 'Modelo especializado en árabe, 7B parámetros' },
      { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B', description: 'Modelo de Alibaba Cloud, 32B parámetros' },
      { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2 Instruct', description: 'Modelo de Moonshot AI optimizado para instrucciones' },
      { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2 Instruct v0905', description: 'Versión mejorada de Kimi K2' },
      { id: 'groq/compound', name: 'Groq Compound', description: 'Modelo especializado de Groq' },
      { id: 'groq/compound-mini', name: 'Groq Compound Mini', description: 'Versión compacta del modelo Groq Compound' },
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', description: 'Modelo OpenAI de código abierto, 120B parámetros' },
      { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', description: 'Modelo OpenAI de código abierto, 20B parámetros' }
    ];

    const { value: formValues } = await Swal.fire({
      title: 'Configurar Groq AI',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">API Key de Groq:</label>
            <input type="password" id="groq-api-key" class="swal2-input" placeholder="gsk_...">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Obtén tu API Key en <a href="https://console.groq.com/keys" target="_blank" style="color: #0066ff;">console.groq.com</a>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Modelo seleccionado:</label>
            <select id="groq-model" class="swal2-input">
              ${availableModels.map(model =>
                `<option value="${model.id}">${model.name} - ${model.description}</option>`
              ).join('')}
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Temperatura (0-1):</label>
            <input type="range" id="groq-temperature" class="swal2-input" min="0" max="1" step="0.1" value="0.7">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
              <span>0 (Preciso)</span>
              <span id="temp-value">0.7</span>
              <span>1 (Creativo)</span>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Tokens máximos:</label>
            <input type="number" id="groq-max-tokens" class="swal2-input" value="800" min="100" max="4000">
          </div>

          <div style="font-size: 12px; color: #666; margin-top: 16px; background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
            <strong style="color: #0066ff;">📋 Instrucciones para obtener API Key:</strong><br>
            1. Ve a <a href="https://console.groq.com" target="_blank" style="color: #0066ff;">console.groq.com</a><br>
            2. Regístrate o inicia sesión<br>
            3. Ve a la sección "API Keys"<br>
            4. Crea una nueva API Key<br>
            5. Copia y pega la clave aquí
          </div>
          
          <div style="font-size: 12px; color: #666; margin-top: 12px; background-color: #e8f4fd; padding: 12px; border-radius: 4px;">
            <strong style="color: #0066ff;">🚀 Funcionalidades incluidas:</strong><br>
            • Chat inteligente con contexto<br>
            • Análisis de sentimientos<br>
            • Resumen de documentos<br>
            • Generación de contenido<br>
            • Soporte para español optimizado<br>
            • Tracking de uso de tokens
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('groq-api-key').value;
        const model = document.getElementById('groq-model').value;
        const temperature = parseFloat(document.getElementById('groq-temperature').value);
        const maxTokens = parseInt(document.getElementById('groq-max-tokens').value);

        if (!apiKey) {
          Swal.showValidationMessage('La API Key de Groq es obligatoria');
          return false;
        }

        if (!apiKey.startsWith('gsk_')) {
          Swal.showValidationMessage('La API Key de Groq debe comenzar con "gsk_"');
          return false;
        }

        return { apiKey, model, temperature, maxTokens };
      },
      didOpen: () => {
        // Actualizar el valor de temperatura cuando se mueve el slider
        const tempSlider = document.getElementById('groq-temperature');
        const tempValue = document.getElementById('temp-value');
        if (tempSlider && tempValue) {
          tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
          });
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar y Probar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00a67e',
      width: '600px'
    });

    if (formValues) {
      // Mostrar estado de conexión
      setIntegrations(prev => ({ ...prev, groq: { ...prev.groq, status: 'connecting' } }));

      try {
        // Guardar configuración usando el servicio centralizado
        await configurationService.setConfig('integrations', 'groq', {
          apiKey: formValues.apiKey,
          model: formValues.model,
          temperature: formValues.temperature,
          maxTokens: formValues.maxTokens
        }, 'global', null, 'Configuración de Groq AI')

        // Probar conexión con Groq
        const testResult = await testGroqConnection(formValues.apiKey, formValues.model);

        if (testResult.success) {
          // Actualizar estado
          setIntegrations(prev => ({
            ...prev,
            groq: {
              connected: true,
              status: 'connected',
              lastSync: new Date().toISOString(),
              model: formValues.model,
              temperature: formValues.temperature,
              maxTokens: formValues.maxTokens
            }
          }));

          // Mostrar éxito
          await Swal.fire({
            title: '🎉 Groq AI Configurado Exitosamente',
            html: `
              <div style="text-align: left;">
                <div style="background-color: #d4edda; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #155724;">✅ Conexión exitosa</h4>
                  <p style="margin: 0; font-size: 14px;">La API Key es válida y todas las funcionalidades están activas.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">Configuración guardada:</h4>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Modelo:</strong> ${availableModels.find(m => m.id === formValues.model)?.name}<br>
                    <strong>Temperatura:</strong> ${formValues.temperature}<br>
                    <strong>Tokens máximos:</strong> ${formValues.maxTokens}<br>
                    <strong>Respuesta de prueba:</strong> "${testResult.testResponse}"
                  </p>
                </div>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; margin-top: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #0066ff;">📊 Estadísticas de la prueba:</h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>• Tokens de entrada: ${testResult.inputTokens || 'N/A'}</li>
                    <li>• Tokens de salida: ${testResult.outputTokens || 'N/A'}</li>
                    <li>• Tiempo de respuesta: ${testResult.responseTime || 'N/A'}ms</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: '¡Perfecto!',
            confirmButtonColor: '#00a67e',
            width: '500px'
          });

          toast.success('Groq AI configurado exitosamente');
        } else {
          throw new Error(testResult.error || 'Error al conectar con Groq');
        }
      } catch (error) {
        console.error('Error configuring Groq:', error);
        
        // Restaurar estado
        setIntegrations(prev => ({
          ...prev,
          groq: {
            connected: false,
            status: 'disconnected',
            lastSync: null,
            model: 'gemma2-9b-it'
          }
        }));

        // Limpiar configuración guardada usando el servicio centralizado
        try {
          await configurationService.setConfig('integrations', 'groq', {}, 'global', null, 'Configuración de Groq AI - Error')
        } catch (cleanupError) {
          console.error('Error cleaning up Groq configuration:', cleanupError)
        }

        // Mostrar error
        await Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #721c24;">No se pudo conectar con Groq</h4>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${error.message}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">🔍 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>• Verifica que la API Key sea correcta</li>
                  <li>• Asegúrate de que la API Key comience con "gsk_"</li>
                  <li>• Revisa que tu cuenta de Groq esté activa</li>
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Confirma que tienes créditos disponibles</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });

        toast.error('Error al configurar Groq AI');
      }
    }
  };

  // Función para probar la conexión con Groq
  const testGroqConnection = async (apiKey, model) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Responde con "Conexión exitosa" si puedes leer este mensaje.'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const testResponse = data.choices?.[0]?.message?.content || 'No response';
      
      return {
        success: true,
        testResponse: testResponse,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        responseTime: data.response_time || 'N/A'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const showWhatsAppConfig = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar WhatsApp Business API',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Access Token de Meta:</label>
            <input type="password" id="whatsapp-access-token" class="swal2-input" placeholder="EA...">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Obtén tu token en{' '}
              <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" target="_blank" style="color: #25d366;">
                Meta for Developers
              </a>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Phone Number ID:</label>
            <input type="text" id="whatsapp-phone-number-id" class="swal2-input" placeholder="123456789...">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ID numérico de tu número de WhatsApp Business
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Webhook Verify Token:</label>
            <input type="text" id="whatsapp-webhook-token" class="swal2-input" placeholder="Token opcional">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Opcional: Token para verificar webhooks entrantes
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="whatsapp-test-mode" style="margin-right: 8px;" checked>
              <span style="font-weight: 600;">Modo de prueba</span>
            </label>
            <p style="font-size: 12px; color: #666; margin-top: 4px; margin-left: 20px;">
              En modo prueba, los mensajes se enviarán solo para testing
            </p>
          </div>

          <div style="font-size: 12px; color: #666; margin-top: 16px; background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
            <strong style="color: #25d366;">📋 Instrucciones para obtener credenciales:</strong><br>
            1. Ve a <a href="https://business.facebook.com/wa/manage" target="_blank" style="color: #25d366;">Meta Business Suite</a><br>
            2. Selecciona tu cuenta de WhatsApp Business<br>
            3. Ve a Configuración → API de WhatsApp<br>
            4. Genera un Access Token de sistema<br>
            5. Copia el Phone Number ID y el Access Token aquí
          </div>
          
          <div style="font-size: 12px; color: #666; margin-top: 12px; background-color: #e8f4fd; padding: 12px; border-radius: 4px;">
            <strong style="color: #25d366;">🚀 Funcionalidades incluidas:</strong><br>
            • Envío de mensajes individuales y masivos<br>
            • Plantillas de mensaje pre-aprobadas<br>
            • Webhooks para estado de entrega en tiempo real<br>
            • Estadísticas detalladas de uso<br>
            • Integración con sistema de comunicación existente<br>
            • Costo: ~$0.0525 USD por mensaje
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const accessToken = document.getElementById('whatsapp-access-token').value;
        const phoneNumberId = document.getElementById('whatsapp-phone-number-id').value;
        const webhookToken = document.getElementById('whatsapp-webhook-token').value;
        const testMode = document.getElementById('whatsapp-test-mode').checked;

        if (!accessToken) {
          Swal.showValidationMessage('El Access Token es obligatorio');
          return false;
        }

        if (!accessToken.startsWith('EA') && !accessToken.startsWith('EAA')) {
          Swal.showValidationMessage('El Access Token debe comenzar con EA o EAA');
          return false;
        }

        if (!phoneNumberId) {
          Swal.showValidationMessage('El Phone Number ID es obligatorio');
          return false;
        }

        if (!/^d+$/.test(phoneNumberId)) {
          Swal.showValidationMessage('El Phone Number ID debe contener solo números');
          return false;
        }

        return { accessToken, phoneNumberId, webhookToken, testMode };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar y Probar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#25d366',
      width: '600px'
    });

    if (formValues) {
      // Mostrar estado de conexión
      setIntegrations(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, status: 'connecting' } }));

      try {
        // Probar conexión usando communicationService
        const testResult = await communicationService.testWhatsAppConnection();

        if (testResult.success) {
          // Actualizar estado
          setIntegrations(prev => ({
            ...prev,
            whatsapp: {
              connected: true,
              status: 'connected',
              lastSync: new Date().toISOString(),
              testMode: formValues.testMode
            }
          }));

          // Mostrar éxito
          await Swal.fire({
            title: '🎉 WhatsApp Configurado Exitosamente',
            html: `
              <div style="text-align: left;">
                <div style="background-color: #d4edda; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #155724;">✅ Conexión exitosa</h4>
                  <p style="margin: 0; font-size: 14px;">La API de WhatsApp está funcionando correctamente.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">Información del número:</h4>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Número:</strong> ${testResult.phoneInfo?.name || 'Configurado'}<br>
                    <strong>Nombre verificado:</strong> ${testResult.phoneInfo?.verifiedName || 'Pendiente'}<br>
                    <strong>Modo:</strong> ${formValues.testMode ? 'Prueba 🧪' : 'Producción 🚀'}
                  </p>
                </div>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; margin-top: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #25d366;">📊 Funcionalidades activas:</h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>✅ Envío de mensajes individuales</li>
                    <li>✅ Envío masivo de mensajes</li>
                    <li>✅ Plantillas de mensaje pre-aprobadas</li>
                    <li>✅ Webhooks para estado de entrega</li>
                    <li>✅ Estadísticas en tiempo real</li>
                    <li>✅ Integración con sistema de comunicación</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: '¡Perfecto!',
            confirmButtonColor: '#25d366',
            width: '500px'
          });

          toast.success('WhatsApp configurado exitosamente');
        } else {
          throw new Error(testResult.error || 'Error al conectar con WhatsApp');
        }
      } catch (error) {
        console.error('Error configuring WhatsApp:', error);
        
        // Restaurar estado
        setIntegrations(prev => ({
          ...prev,
          whatsapp: {
            connected: false,
            status: 'disconnected',
            lastSync: null,
            testMode: false
          }
        }));

        // Mostrar error
        await Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #721c24;">No se pudo conectar con WhatsApp</h4>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${error.message}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">🔍 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>• Verifica que el Access Token sea correcto</li>
                  <li>• Asegúrate de que el Phone Number ID sea válido</li>
                  <li>• Revisa que tu número de WhatsApp esté verificado</li>
                  <li>• Verifica los permisos del token</li>
                  <li>• Revisa tu conexión a internet</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });

        toast.error('Error al configurar WhatsApp');
      }
    }
  };

  const configureTelegram = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar Telegram Bot',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Bot Token:</label>
            <input type="password" id="telegram-bot-token" class="swal2-input" placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Obtén tu token en <a href="https://t.me/BotFather" target="_blank" style="color: #0088cc;">@BotFather</a>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Bot Username:</label>
            <input type="text" id="telegram-bot-username" class="swal2-input" placeholder="@tu_bot">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              El nombre de usuario de tu bot (con @)
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Chat ID (opcional):</label>
            <input type="text" id="telegram-chat-id" class="swal2-input" placeholder="123456789">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ID del chat para enviar mensajes de prueba
            </div>
          </div>

          <div style="font-size: 12px; color: #666; margin-top: 16px; background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
            <strong style="color: #0088cc;">📋 Instrucciones para obtener Bot Token:</strong><br>
            1. Ve a <a href="https://t.me/BotFather" target="_blank" style="color: #0088cc;">@BotFather</a> en Telegram<br>
            2. Envía el comando /newbot<br>
            3. Sigue las instrucciones para crear tu bot<br>
            4. Copia el token que te proporciona BotFather
          </div>
          
          <div style="font-size: 12px; color: #666; margin-top: 12px; background-color: #e8f4fd; padding: 12px; border-radius: 4px;">
            <strong style="color: #0088cc;">🚀 Funcionalidades incluidas:</strong><br>
            • Envío de mensajes individuales y masivos<br>
            • Notificaciones automáticas<br>
            • Integración con sistema de comunicación<br>
            • Soporte para mensajes formateados<br>
            • Entrega de archivos y documentos
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const botToken = document.getElementById('telegram-bot-token').value;
        const botUsername = document.getElementById('telegram-bot-username').value;
        const chatId = document.getElementById('telegram-chat-id').value;

        if (!botToken) {
          Swal.showValidationMessage('El Bot Token es obligatorio');
          return false;
        }

        if (!botToken.match(/^d+:[A-Za-z0-9_-]+$/)) {
          Swal.showValidationMessage('El formato del Bot Token es inválido');
          return false;
        }

        if (!botUsername) {
          Swal.showValidationMessage('El Bot Username es obligatorio');
          return false;
        }

        if (!botUsername.startsWith('@')) {
          Swal.showValidationMessage('El Bot Username debe comenzar con @');
          return false;
        }

        return { botToken, botUsername, chatId };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar y Probar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0088cc',
      width: '600px'
    });

    if (formValues) {
      // Mostrar estado de conexión
      setIntegrations(prev => ({ ...prev, telegram: { ...prev.telegram, status: 'connecting' } }));

      try {
        // Guardar configuración usando configurationService
        await configurationService.setConfig('integrations', 'telegram', {
          botToken: formValues.botToken,
          botUsername: formValues.botUsername,
          chatId: formValues.chatId || null
        }, 'global', null, 'Configuración de Telegram Bot')

        // Probar conexión con Telegram
        const testResult = await testTelegramConnection(formValues.botToken, formValues.botUsername);

        if (testResult.success) {
          // Actualizar estado
          setIntegrations(prev => ({
            ...prev,
            telegram: {
              connected: true,
              status: 'connected',
              lastSync: new Date().toISOString(),
              botToken: formValues.botToken,
              botUsername: formValues.botUsername,
              chatId: formValues.chatId
            }
          }));

          // Mostrar éxito
          await Swal.fire({
            title: '🎉 Telegram Configurado Exitosamente',
            html: `
              <div style="text-align: left;">
                <div style="background-color: #d4edda; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #155724;">✅ Conexión exitosa</h4>
                  <p style="margin: 0; font-size: 14px;">El bot está funcionando correctamente.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">Información del bot:</h4>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Nombre:</strong> ${testResult.botInfo?.first_name || 'Configurado'}<br>
                    <strong>Username:</strong> ${testResult.botInfo?.username || formValues.botUsername}<br>
                    <strong>Chat ID:</strong> ${formValues.chatId || 'No configurado'}
                  </p>
                </div>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; margin-top: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #0088cc;">📊 Funcionalidades activas:</h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>✅ Envío de mensajes individuales</li>
                    <li>✅ Envío masivo de mensajes</li>
                    <li>✅ Notificaciones automáticas</li>
                    <li>✅ Integración con sistema de comunicación</li>
                    <li>✅ Soporte para mensajes formateados</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: '¡Perfecto!',
            confirmButtonColor: '#0088cc',
            width: '500px'
          });

          toast.success('Telegram configurado exitosamente');
        } else {
          throw new Error(testResult.error || 'Error al conectar con Telegram');
        }
      } catch (error) {
        console.error('Error configuring Telegram:', error);
        
        // Restaurar estado
        setIntegrations(prev => ({
          ...prev,
          telegram: {
            connected: false,
            status: 'disconnected',
            lastSync: null
          }
        }));

        // Limpiar configuración guardada usando configurationService
        try {
          await configurationService.setConfig('integrations', 'telegram', {}, 'global', null, 'Configuración de Telegram Bot - Error')
        } catch (cleanupError) {
          console.error('Error cleaning up Telegram configuration:', cleanupError)
        }

        // Mostrar error
        await Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #721c24;">No se pudo conectar con Telegram</h4>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${error.message}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">🔍 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>• Verifica que el Bot Token sea correcto</li>
                  <li>• Asegúrate de que el bot esté activo</li>
                  <li>• Revisa que el username sea correcto</li>
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Confirma que el token no haya expirado</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });

        toast.error('Error al configurar Telegram');
      }
    }
  };

  // Función para probar la conexión con Telegram
  const testTelegramConnection = async (botToken, botUsername) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.ok) {
        return {
          success: true,
          botInfo: data.result
        };
      } else {
        throw new Error(data.description || 'Error al conectar con el bot');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Función para configurar WhatsApp Official API
  const configureWhatsAppOfficial = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar WhatsApp Official API',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Access Token de Meta:</label>
            <input type="password" id="whatsapp-official-access-token" class="swal2-input" placeholder="EA...">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Obtén tu token en{' '}
              <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" target="_blank" style="color: #25d366;">
                Meta for Developers
              </a>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Phone Number ID:</label>
            <input type="text" id="whatsapp-official-phone-number-id" class="swal2-input" placeholder="123456789...">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              ID numérico de tu número de WhatsApp Business
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Webhook Verify Token:</label>
            <input type="text" id="whatsapp-official-webhook-token" class="swal2-input" placeholder="Token opcional">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Opcional: Token para verificar webhooks entrantes
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="whatsapp-official-test-mode" style="margin-right: 8px;" checked>
              <span style="font-weight: 600;">Modo de prueba</span>
            </label>
            <p style="font-size: 12px; color: #666; margin-top: 4px; margin-left: 20px;">
              En modo prueba, los mensajes se enviarán solo para testing
            </p>
          </div>

          <div style="font-size: 12px; color: #666; margin-top: 16px; background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
            <strong style="color: #25d366;">📋 Instrucciones para obtener credenciales:</strong><br>
            1. Ve a <a href="https://business.facebook.com/wa/manage" target="_blank" style="color: #25d366;">Meta Business Suite</a><br>
            2. Selecciona tu cuenta de WhatsApp Business<br>
            3. Ve a Configuración → API de WhatsApp<br>
            4. Genera un Access Token de sistema<br>
            5. Copia el Phone Number ID y el Access Token aquí
          </div>
          
          <div style="font-size: 12px; color: #666; margin-top: 12px; background-color: #e8f4fd; padding: 12px; border-radius: 4px;">
            <strong style="color: #25d366;">🚀 Funcionalidades incluidas:</strong><br>
            • Envío de mensajes individuales y masivos<br>
            • Plantillas de mensaje pre-aprobadas<br>
            • Webhooks para estado de entrega en tiempo real<br>
            • Estadísticas detalladas de uso<br>
            • Integración con sistema de comunicación existente<br>
            • Costo: ~$0.0525 USD por mensaje
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const accessToken = document.getElementById('whatsapp-official-access-token').value;
        const phoneNumberId = document.getElementById('whatsapp-official-phone-number-id').value;
        const webhookToken = document.getElementById('whatsapp-official-webhook-token').value;
        const testMode = document.getElementById('whatsapp-official-test-mode').checked;

        if (!accessToken) {
          Swal.showValidationMessage('El Access Token es obligatorio');
          return false;
        }

        if (!accessToken.startsWith('EA') && !accessToken.startsWith('EAA')) {
          Swal.showValidationMessage('El Access Token debe comenzar con EA o EAA');
          return false;
        }

        if (!phoneNumberId) {
          Swal.showValidationMessage('El Phone Number ID es obligatorio');
          return false;
        }

        if (!/^d+$/.test(phoneNumberId)) {
          Swal.showValidationMessage('El Phone Number ID debe contener solo números');
          return false;
        }

        return { accessToken, phoneNumberId, webhookToken, testMode };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar y Probar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#25d366',
      width: '600px'
    });

    if (formValues) {
      // Mostrar estado de conexión
      setIntegrations(prev => ({ ...prev, whatsappOfficial: { ...prev.whatsappOfficial, status: 'connecting' } }));

      try {
        // Configurar el servicio de WhatsApp Official
        const config = {
          accessToken: formValues.accessToken,
          phoneNumberId: formValues.phoneNumberId,
          webhookVerifyToken: formValues.webhookToken,
          testMode: formValues.testMode
        };

        // Guardar configuración
        whatsappOfficialService.saveConfiguration(config);

        // Probar conexión
        const testResult = await whatsappOfficialService.testConnection();

        if (testResult.success) {
          // Actualizar estado
          setIntegrations(prev => ({
            ...prev,
            whatsappOfficial: {
              connected: true,
              status: 'connected',
              lastSync: new Date().toISOString(),
              testMode: formValues.testMode
            }
          }));

          // Mostrar éxito
          await Swal.fire({
            title: '🎉 WhatsApp Official Configurado Exitosamente',
            html: `
              <div style="text-align: left;">
                <div style="background-color: #d4edda; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #155724;">✅ Conexión exitosa</h4>
                  <p style="margin: 0; font-size: 14px;">La API oficial de WhatsApp está funcionando correctamente.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">Información del número:</h4>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Número:</strong> ${testResult.phoneInfo?.name || 'Configurado'}<br>
                    <strong>Nombre verificado:</strong> ${testResult.phoneInfo?.verifiedName || 'Pendiente'}<br>
                    <strong>Modo:</strong> ${formValues.testMode ? 'Prueba 🧪' : 'Producción 🚀'}
                  </p>
                </div>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; margin-top: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #25d366;">📊 Funcionalidades activas:</h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>✅ Envío de mensajes individuales</li>
                    <li>✅ Envío masivo de mensajes</li>
                    <li>✅ Plantillas de mensaje pre-aprobadas</li>
                    <li>✅ Webhooks para estado de entrega</li>
                    <li>✅ Estadísticas en tiempo real</li>
                    <li>✅ Integración con sistema de comunicación</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: '¡Perfecto!',
            confirmButtonColor: '#25d366',
            width: '500px'
          });

          toast.success('WhatsApp Official configurado exitosamente');
        } else {
          throw new Error(testResult.error || 'Error al conectar con WhatsApp Official');
        }
      } catch (error) {
        console.error('Error configuring WhatsApp Official:', error);
        
        // Restaurar estado
        setIntegrations(prev => ({
          ...prev,
          whatsappOfficial: {
            connected: false,
            status: 'disconnected',
            lastSync: null,
            testMode: false
          }
        }));

        // Limpiar configuración guardada
        whatsappOfficialService.clearConfiguration();

        // Mostrar error
        await Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #721c24;">No se pudo conectar con WhatsApp Official</h4>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${error.message}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">🔍 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>• Verifica que el Access Token sea correcto</li>
                  <li>• Asegúrate de que el Phone Number ID sea válido</li>
                  <li>• Revisa que tu número de WhatsApp esté verificado</li>
                  <li>• Verifica los permisos del token</li>
                  <li>• Revisa tu conexión a internet</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });

        toast.error('Error al configurar WhatsApp Official');
      }
    }
  };

  // Función para configurar WhatsApp WAHA API
  const configureWhatsAppWaha = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Configurar WhatsApp WAHA API',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">API Key de WAHA:</label>
            <input type="password" id="whatsapp-waha-api-key" class="swal2-input" placeholder="waha_...">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Obtén tu API Key en <a href="https://waha.devike.pro" target="_blank" style="color: #9333ea;">waha.devike.pro</a>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Session ID:</label>
            <input type="text" id="whatsapp-waha-session-id" class="swal2-input" placeholder="session-default">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Identificador único para tu sesión de WhatsApp
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">URL del servidor WAHA:</label>
            <input type="text" id="whatsapp-waha-url" class="swal2-input" placeholder="https://waha.devike.pro" value="https://waha.devike.pro">
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              URL del servidor de WAHA API
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="whatsapp-waha-test-mode" style="margin-right: 8px;" checked>
              <span style="font-weight: 600;">Modo de prueba</span>
            </label>
            <p style="font-size: 12px; color: #666; margin-top: 4px; margin-left: 20px;">
              En modo prueba, los mensajes se enviarán solo para testing
            </p>
          </div>

          <div style="font-size: 12px; color: #666; margin-top: 16px; background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
            <strong style="color: #9333ea;">📋 Instrucciones para obtener credenciales:</strong><br>
            1. Ve a <a href="https://waha.devike.pro" target="_blank" style="color: #9333ea;">waha.devike.pro</a><br>
            2. Regístra tu cuenta y obtén tu API Key<br>
            3. Crea una nueva sesión de WhatsApp<br>
            4. Escanea el código QR con tu WhatsApp<br>
            5. Copia el Session ID y la API Key aquí
          </div>
          
          <div style="font-size: 12px; color: #666; margin-top: 12px; background-color: #e8f4fd; padding: 12px; border-radius: 4px;">
            <strong style="color: #9333ea;">🚀 Funcionalidades incluidas:</strong><br>
            • Envío de mensajes individuales y masivos<br>
            • Envío de archivos y documentos<br>
            • Envío de ubicaciones y contactos<br>
            • Gestión de sesiones múltiples<br>
            • Estadísticas de uso en tiempo real<br>
            • Integración con sistema de comunicación existente
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const apiKey = document.getElementById('whatsapp-waha-api-key').value;
        const sessionId = document.getElementById('whatsapp-waha-session-id').value;
        const serverUrl = document.getElementById('whatsapp-waha-url').value;
        const testMode = document.getElementById('whatsapp-waha-test-mode').checked;

        if (!apiKey) {
          Swal.showValidationMessage('La API Key es obligatoria');
          return false;
        }

        if (!sessionId) {
          Swal.showValidationMessage('El Session ID es obligatorio');
          return false;
        }

        if (!serverUrl) {
          Swal.showValidationMessage('La URL del servidor es obligatoria');
          return false;
        }

        return { apiKey, sessionId, serverUrl, testMode };
      },
      showCancelButton: true,
      confirmButtonText: 'Conectar y Probar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9333ea',
      width: '600px'
    });

    if (formValues) {
      // Mostrar estado de conexión
      setIntegrations(prev => ({ ...prev, whatsappWaha: { ...prev.whatsappWaha, status: 'connecting' } }));

      try {
        // Configurar el servicio de WhatsApp WAHA
        const config = {
          apiKey: formValues.apiKey,
          sessionId: formValues.sessionId,
          serverUrl: formValues.serverUrl,
          testMode: formValues.testMode
        };

        // Guardar configuración
        whatsappWahaService.saveConfiguration(config);

        // Probar conexión
        const testResult = await whatsappWahaService.testConnection();

        if (testResult.success) {
          // Actualizar estado
          setIntegrations(prev => ({
            ...prev,
            whatsappWaha: {
              connected: true,
              status: 'connected',
              lastSync: new Date().toISOString(),
              testMode: formValues.testMode
            }
          }));

          // Mostrar éxito
          await Swal.fire({
            title: '🎉 WhatsApp WAHA Configurado Exitosamente',
            html: `
              <div style="text-align: left;">
                <div style="background-color: #d4edda; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #155724;">✅ Conexión exitosa</h4>
                  <p style="margin: 0; font-size: 14px;">La API de WAHA está funcionando correctamente.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #333;">Información de la sesión:</h4>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Sesión:</strong> ${formValues.sessionId}<br>
                    <strong>Servidor:</strong> ${formValues.serverUrl}<br>
                    <strong>Estado:</strong> ${testResult.sessionInfo?.status || 'Activa'}<br>
                    <strong>Modo:</strong> ${formValues.testMode ? 'Prueba 🧪' : 'Producción 🚀'}
                  </p>
                </div>
                <div style="background-color: #e8f4fd; padding: 12px; border-radius: 4px; margin-top: 12px;">
                  <h4 style="margin: 0 0 8px 0; color: #9333ea;">📊 Funcionalidades activas:</h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>✅ Envío de mensajes individuales</li>
                    <li>✅ Envío masivo de mensajes</li>
                    <li>✅ Envío de archivos y documentos</li>
                    <li>✅ Envío de ubicaciones</li>
                    <li>✅ Gestión de sesiones</li>
                    <li>✅ Integración con sistema de comunicación</li>
                  </ul>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: '¡Perfecto!',
            confirmButtonColor: '#9333ea',
            width: '500px'
          });

          toast.success('WhatsApp WAHA configurado exitosamente');
        } else {
          throw new Error(testResult.error || 'Error al conectar con WhatsApp WAHA');
        }
      } catch (error) {
        console.error('Error configuring WhatsApp WAHA:', error);
        
        // Restaurar estado
        setIntegrations(prev => ({
          ...prev,
          whatsappWaha: {
            connected: false,
            status: 'disconnected',
            lastSync: null,
            testMode: false
          }
        }));

        // Limpiar configuración guardada
        whatsappWahaService.clearConfiguration();

        // Mostrar error
        await Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div style="text-align: left;">
              <div style="background-color: #f8d7da; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #721c24;">No se pudo conectar con WhatsApp WAHA</h4>
                <p style="margin: 0; font-size: 14px;"><strong>Error:</strong> ${error.message}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #856404;">🔍 Posibles soluciones:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>• Verifica que la API Key sea correcta</li>
                  <li>• Asegúrate de que el Session ID sea válido</li>
                  <li>• Revisa que la URL del servidor sea correcta</li>
                  <li>• Verifica que tu sesión esté activa en WAHA</li>
                  <li>• Revisa tu conexión a internet</li>
                </ul>
              </div>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });

        toast.error('Error al configurar WhatsApp WAHA');
      }
    }
  };

  const disconnectIntegration = async (integration) => {
    const integrationNames = {
      google: 'Google Workspace',
      slack: 'Slack',
      teams: 'Microsoft Teams',
      hubspot: 'HubSpot',
      salesforce: 'Salesforce',
      brevo: 'Brevo',
      groq: 'Groq AI',
      whatsapp: 'WhatsApp',
      whatsappOfficial: 'WhatsApp Official API',
      whatsappWaha: 'WhatsApp WAHA API',
      telegram: 'Telegram'
    };

    const result = await Swal.fire({
      title: 'Desconectar Integración',
      text: `¿Estás seguro de desconectar ${integrationNames[integration]}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desconectar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Limpiar configuración usando configurationService para servicios migrados
        if (['groq', 'whatsapp', 'telegram'].includes(integration)) {
          await configurationService.setConfig('integrations', integration, {}, 'global', null, `Desconexión de ${integrationNames[integration]}`)
        }

        // Mantener limpieza específica para servicios que aún usan sus propios métodos
        if (integration === 'brevo') {
          brevoService.clearConfiguration();
        }

        if (integration === 'whatsappOfficial') {
          whatsappOfficialService.clearConfiguration();
        }

        if (integration === 'whatsappWaha') {
          whatsappWahaService.clearConfiguration();
        }

        setIntegrations(prev => ({
          ...prev,
          [integration]: {
            connected: false,
            status: 'disconnected',
            lastSync: null,
            testMode: false
          }
        }));

        toast.success(`${integrationNames[integration]} desconectado`);
      } catch (error) {
        console.error('Error disconnecting integration:', error);
        toast.error(`Error al desconectar ${integrationNames[integration]}`);
      }
    }
  };

  // Función para manejar el envío del formulario de integración
  const handleIntegrationRequest = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!integrationForm.nombre || !integrationForm.apellido || !integrationForm.empresa || !integrationForm.email || !integrationForm.telefono) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Validar email
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(integrationForm.email)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    // Validar teléfono (solo números y algunos caracteres especiales)
    const phoneRegex = /^[+]?[0-9\s-()]+$/;
    if (!phoneRegex.test(integrationForm.telefono)) {
      toast.error('Por favor ingresa un teléfono válido');
      return;
    }

    setSendingIntegrationRequest(true);

    try {
      // Simular envío de email (en producción usarías EmailJS, API backend, etc.)
      const emailData = {
        to: 'hola@aintelligence.cl',
        subject: 'Nueva Solicitud de Integración',
        body: `
          Nueva solicitud de integración recibida:

          Nombre: ${integrationForm.nombre}
          Apellido: ${integrationForm.apellido}
          Empresa: ${integrationForm.empresa}
          Email: ${integrationForm.email}
          Teléfono: ${integrationForm.telefono}
          Comentarios: ${integrationForm.comentarios || 'Sin comentarios'}

          Fecha de solicitud: ${new Date().toLocaleString('es-ES')}
        `
      };

      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Email enviado a hola@aintelligence.cl:', emailData);

      // Limpiar formulario y cerrar modal
      setIntegrationForm({
        nombre: '',
        apellido: '',
        empresa: '',
        email: '',
        telefono: '',
        comentarios: ''
      });
      setShowIntegrationForm(false);

      toast.success('¡Solicitud enviada exitosamente! Te contactaremos pronto.');

    } catch (error) {
      console.error('Error enviando solicitud:', error);
      toast.error('Error al enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      setSendingIntegrationRequest(false);
    }
  };

  const getStatusBadge = (integration) => {
    const status = integrations[integration].status;
    const connected = integrations[integration].connected;

    if (status === 'connecting') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Conectando...</span>;
    }

    if (connected) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Conectado</span>;
    }

    return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Desconectado</span>;
  };

  if (showCompanyForm) {
    return (
      <CompanyForm
        company={editingCompany}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowCompanyForm(false)
          setEditingCompany(null)
          if (companyId) {
            // Si estamos en modo empresa específica, redirigir a la lista de empresas
            navigate('/configuracion/empresas')
          }
        }}
        companyId={companyId}
        isCompanySpecificMode={!!companyId}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
            <Cog6ToothIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">Gestiona tus empresas y configuraciones del sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              to="/configuracion/empresas"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
              Empresas
            </Link>
            <Link
              to="/configuracion/usuarios"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Usuarios
            </Link>
            <Link
              to="/configuracion/general"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
              General
            </Link>
            <Link
              to="/configuracion/notificaciones"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
              Notificaciones
            </Link>
            <Link
              to="/configuracion/seguridad"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BuildingStorefrontIcon className="h-5 w-5 inline mr-2" />
              Seguridad
            </Link>
            <Link
              to="/configuracion/integraciones"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PuzzlePieceIcon className="h-5 w-5 inline mr-2" />
              Integraciones
            </Link>
            <Link
              to="/configuracion/base-de-datos"
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ServerIcon className="h-5 w-5 inline mr-2" />
              Base de Datos
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Empresas Configuradas</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                {companies.length} empresas
              </span>
            </div>
            <button
              onClick={handleCreateCompany}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Empresa
            </button>
          </div>

          {/* Companies List */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera empresa.</p>
              <div className="mt-6">
                <button
                  onClick={handleCreateCompany}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Crear Primera Empresa
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="relative bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                        <div className="flex items-center mt-1">
                          {company.status === 'active' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${company.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                            {company.status === 'active' ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCompanyStatus(company)}
                      className={`p-1 rounded-full ${
                        company.status === 'active'
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={company.status === 'active' ? 'Desactivar empresa' : 'Activar empresa'}
                    >
                      {company.status === 'active' ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {company.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{company.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {company.telegram_bot && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Telegram:</span>
                        <span className="truncate">{company.telegram_bot}</span>
                      </div>
                    )}
                    {company.whatsapp_number && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">WhatsApp:</span>
                        <span>{company.whatsapp_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => navigate(`/configuracion/empresas/${company.id}`)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Configurar canales de comunicación"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar empresa"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <UserManagement />
      )}

      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configuración General</h2>
              <p className="text-gray-600 mt-1">Configuraciones básicas del sistema</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Sistema
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración de Idioma */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Idioma y Región</h3>
                  <p className="text-sm text-gray-600">Configura el idioma y zona horaria</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="America/Santiago">Chile (Santiago)</option>
                    <option value="America/Buenos_Aires">Argentina (Buenos Aires)</option>
                    <option value="America/Lima">Perú (Lima)</option>
                    <option value="America/Bogota">Colombia (Bogotá)</option>
                  </select>
                </div>

                <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  Guardar Cambios
                </button>
              </div>
            </div>

            {/* Configuración de Apariencia */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mr-4">
                  <Cog6ToothIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Apariencia</h3>
                  <p className="text-sm text-gray-600">Personaliza la interfaz del sistema</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Densidad de Contenido</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="compact">Compacto</option>
                    <option value="comfortable">Cómodo</option>
                    <option value="spacious">Espacioso</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="animations" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" defaultChecked />
                  <label htmlFor="animations" className="ml-2 block text-sm text-gray-900">
                    Habilitar animaciones
                  </label>
                </div>

                <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  Aplicar Tema
                </button>
              </div>
            </div>

            {/* Configuración de Rendimiento */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mr-4">
                  <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Rendimiento</h3>
                  <p className="text-sm text-gray-600">Optimiza el rendimiento del sistema</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Límite de Registros por Página</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="10">10 registros</option>
                    <option value="25">25 registros</option>
                    <option value="50">50 registros</option>
                    <option value="100">100 registros</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="auto-refresh" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" defaultChecked />
                  <label htmlFor="auto-refresh" className="ml-2 block text-sm text-gray-900">
                    Actualización automática de datos
                  </label>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="cache-enabled" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" defaultChecked />
                  <label htmlFor="cache-enabled" className="ml-2 block text-sm text-gray-900">
                    Habilitar caché de datos
                  </label>
                </div>

                <button className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  Optimizar Rendimiento
                </button>
              </div>
            </div>

            {/* Configuración de API */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
                  <PuzzlePieceIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">API y Conectividad</h3>
                  <p className="text-sm text-gray-600">Configura timeouts y límites de API</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeout de Conexión (segundos)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue="30"
                    min="5"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reintentos Automáticos</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="0">Sin reintentos</option>
                    <option value="1">1 reintento</option>
                    <option value="3">3 reintentos</option>
                    <option value="5">5 reintentos</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="api-compression" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" defaultChecked />
                  <label htmlFor="api-compression" className="ml-2 block text-sm text-gray-900">
                    Habilitar compresión de respuestas
                  </label>
                </div>

                <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  Guardar Configuración API
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configuración de Notificaciones</h2>
              <p className="text-gray-600 mt-1">Gestiona cómo y cuándo recibir notificaciones</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Notificaciones
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notificaciones por Email */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Notificaciones por Email</h3>
                  <p className="text-sm text-gray-600">Configura alertas por correo electrónico</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Mensajes enviados</h4>
                    <p className="text-xs text-gray-600">Notificaciones cuando se envían mensajes</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.email.messagesSent}
                    onChange={(e) => handleEmailNotificationChange('messagesSent', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Errores del sistema</h4>
                    <p className="text-xs text-gray-600">Alertas de errores críticos</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.email.systemErrors}
                    onChange={(e) => handleEmailNotificationChange('systemErrors', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Reportes semanales</h4>
                    <p className="text-xs text-gray-600">Resúmenes de actividad semanal</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.email.weeklyReports}
                    onChange={(e) => handleEmailNotificationChange('weeklyReports', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Límites de uso</h4>
                    <p className="text-xs text-gray-600">Cuando se acerca al límite de tokens</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.email.tokenLimits}
                    onChange={(e) => handleEmailNotificationChange('tokenLimits', e.target.checked)}
                  />
                </div>

                <button
                  onClick={saveEmailPreferences}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Guardar Preferencias de Email
                </button>
              </div>
            </div>


            {/* Programación de Reportes */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mr-4">
                  <Cog6ToothIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reportes Automáticos</h3>
                  <p className="text-sm text-gray-600">Programación de reportes periódicos</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Reportes</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={notificationSettings.reports.frequency}
                    onChange={(e) => handleReportsSettingsChange('frequency', e.target.value)}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="never">Nunca</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destinatarios</label>
                  <div className="space-y-2">
                    {notificationSettings.reports.recipients.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="email"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={email}
                          onChange={(e) => {
                            const updatedRecipients = [...notificationSettings.reports.recipients];
                            updatedRecipients[index] = e.target.value;
                            handleReportsSettingsChange('recipients', updatedRecipients);
                          }}
                          placeholder="email@empresa.com"
                        />
                        <button
                          onClick={() => removeEmailRecipient(email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover email"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addEmailRecipient}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Agregar Destinatario
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {notificationSettings.reports.recipients.length} destinatario{notificationSettings.reports.recipients.length !== 1 ? 's' : ''} configurado{notificationSettings.reports.recipients.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="include-charts"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.reports.includeCharts}
                    onChange={(e) => handleReportsSettingsChange('includeCharts', e.target.checked)}
                  />
                  <label htmlFor="include-charts" className="ml-2 block text-sm text-gray-900">
                    Incluir gráficos en reportes
                  </label>
                </div>

                <button
                  onClick={scheduleReports}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  💾 Guardar y Ir a Reportes
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Las configuraciones se aplicarán en la página de informes
                </p>
              </div>
            </div>

            {/* Configuración de Sonido */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
                  <PuzzlePieceIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sonidos y Alertas</h3>
                  <p className="text-sm text-gray-600">Configura sonidos de notificación</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Sonidos activados</h4>
                    <p className="text-xs text-gray-600">Reproducir sonidos en notificaciones</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.sound.enabled}
                    onChange={(e) => handleSoundSettingsChange('enabled', e.target.checked)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volumen de Notificaciones: {notificationSettings.sound.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={notificationSettings.sound.volume}
                    onChange={(e) => handleSoundSettingsChange('volume', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Notificaciones silenciosas</h4>
                    <p className="text-xs text-gray-600">Solo vibración sin sonido</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={notificationSettings.sound.silent}
                    onChange={(e) => handleSoundSettingsChange('silent', e.target.checked)}
                  />
                </div>

                <button
                  onClick={testSounds}
                  disabled={!notificationSettings.sound.enabled}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Probar Sonidos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configuración de Seguridad</h2>
              <p className="text-gray-600 mt-1">Gestiona la seguridad y permisos del sistema</p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              Seguridad
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Autenticación de Dos Factores */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mr-4">
                  <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Autenticación de Dos Factores</h3>
                  <p className="text-sm text-gray-600">Aumenta la seguridad de tu cuenta</p>
                </div>
              </div>

              <div className="space-y-4">
                {securitySettings.twoFactorEnabled ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">2FA Activado</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Método: {securitySettings.twoFactorMethod === 'app' ? 'Aplicación' :
                               securitySettings.twoFactorMethod === 'sms' ? 'SMS' : 'Email'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">2FA Desactivado</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">Activa 2FA para mayor seguridad</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de 2FA</label>
                    <select
                      value={securitySettings.twoFactorMethod}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="app">Aplicación (Google Authenticator)</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
                      toast.success(securitySettings.twoFactorEnabled ? '2FA desactivado' : '2FA activado')
                    }}
                    className={`w-full px-4 py-2 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                      securitySettings.twoFactorEnabled
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                    }`}
                  >
                    {securitySettings.twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sesiones Activas */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sesiones Activas</h3>
                  <p className="text-sm text-gray-600">Gestiona tus sesiones activas</p>
                </div>
              </div>

              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className={`rounded-lg p-4 ${session.current ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.current ? 'Sesión Actual' : 'Otra Sesión'}
                        </p>
                        <p className="text-xs text-gray-600">{session.device} • {session.location}</p>
                        <p className="text-xs text-gray-500">
                          Última actividad: {session.current ? 'hace 2 minutos' : `${Math.floor((Date.now() - session.lastActivity) / (1000 * 60))} minutos atrás`}
                        </p>
                        <p className="text-xs text-gray-400">IP: {session.ip}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.current
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.current ? 'Activa' : 'Inactiva'}
                        </span>
                        {!session.current && (
                          <button
                            onClick={() => {
                              setActiveSessions(prev => prev.filter(s => s.id !== session.id))
                              toast.success('Sesión cerrada exitosamente')
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Cerrar sesión"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Simular refresh de sesiones
                      loadActiveSessions()
                      toast.success('Sesiones actualizadas')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300"
                  >
                    Actualizar
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                    Ver Todas las Sesiones
                  </button>
                </div>
              </div>
            </div>

            {/* Logs de Seguridad */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mr-4">
                  <Cog6ToothIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Logs de Seguridad</h3>
                  <p className="text-sm text-gray-600">Historial de actividades de seguridad</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {securityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'success' ? 'bg-green-500' :
                          log.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-600">{log.details}</p>
                          <p className="text-xs text-gray-400">IP: {log.ip}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      loadSecurityLogs()
                      toast.success('Logs actualizados')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300"
                  >
                    Actualizar
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                    Ver Todos los Logs
                  </button>
                </div>
              </div>
            </div>

            {/* Backup y Recuperación */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
                  <PuzzlePieceIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Backup y Recuperación</h3>
                  <p className="text-sm text-gray-600">Gestiona copias de seguridad</p>
                </div>
              </div>

              <div className="space-y-4">
                {backupSettings.lastBackup ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Último backup</p>
                        <p className="text-xs text-blue-600">
                          {new Date(backupSettings.lastBackup).toLocaleDateString('es-ES')} • {backupSettings.backupSize || '2.3 GB'}
                        </p>
                      </div>
                      <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Sin backups recientes</p>
                        <p className="text-xs text-yellow-600">Crea tu primer backup para proteger tus datos</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      // Simular creación de backup
                      setBackupSettings(prev => ({
                        ...prev,
                        lastBackup: new Date(),
                        backupSize: '2.4 GB'
                      }))
                      toast.success('Backup creado exitosamente')
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
                  >
                    Crear Backup
                  </button>
                  <button
                    onClick={() => {
                      if (backupSettings.lastBackup) {
                        toast.success('Descargando backup...')
                        // Simular descarga
                        setTimeout(() => {
                          toast.success('Backup descargado exitosamente')
                        }, 2000)
                      } else {
                        toast.error('No hay backup disponible para descargar')
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300 text-sm"
                  >
                    Descargar
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-backup"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={backupSettings.autoBackup}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                    />
                    <label htmlFor="auto-backup" className="ml-2 block text-sm text-gray-900">
                      Backup automático semanal
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Backup</label>
                    <select
                      value={backupSettings.backupFrequency}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retención (días)</label>
                    <input
                      type="number"
                      value={backupSettings.retentionDays}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await configurationService.setConfig('system', 'backup_settings', backupSettings, 'global', null, 'Configuración de backup del sistema')
                      toast.success('Configuración de backup guardada')
                    } catch (error) {
                      console.error('Error saving backup settings:', error)
                      toast.error('Error al guardar la configuración de backup')
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Integraciones Globales</h2>
              <p className="text-gray-600 mt-1">Configuraciones por defecto para todas las empresas</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Configuración global
            </span>
          </div>

          {/* Información sobre el sistema jerárquico */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-blue-100 mr-4">
                <PuzzlePieceIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Configuración Jerárquico</h3>
                <p className="text-gray-600 mb-4">
                  Las configuraciones aquí establecidas sirven como valores por defecto para todas las empresas.
                  Cada empresa puede tener sus propias credenciales específicas que sobreescriben estas configuraciones globales.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">🌐 Configuración Global</h4>
                    <p className="text-sm text-gray-600">
                      Se usa cuando una empresa no tiene configuración específica. Ideal para startups y empresas pequeñas.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">🏢 Configuración por Empresa</h4>
                    <p className="text-sm text-gray-600">
                      Sobreescribe la configuración global. Perfecta para empresas con múltiples marcas o requisitos específicos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control de Modo de Jerarquía */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100">
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-purple-100 mr-4">
                <Cog6ToothIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Control de Configuración Jerárquico</h3>
                <p className="text-gray-600 mb-4">
                  Selecciona cómo el sistema debe priorizar las configuraciones globales vs. las específicas de cada empresa.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <button
                    onClick={() => handleHierarchyModeChange('global_only')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      hierarchyMode === 'global_only'
                        ? 'border-purple-500 bg-purple-100 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-2xl mb-2 ${hierarchyMode === 'global_only' ? 'text-purple-600' : 'text-gray-400'}`}>
                        🌐
                      </div>
                      <h4 className={`font-semibold mb-1 ${hierarchyMode === 'global_only' ? 'text-purple-900' : 'text-gray-700'}`}>
                        Solo Global
                      </h4>
                      <p className={`text-xs ${hierarchyMode === 'global_only' ? 'text-purple-700' : 'text-gray-500'}`}>
                        Usa solo configuraciones globales
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleHierarchyModeChange('company_first')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      hierarchyMode === 'company_first'
                        ? 'border-purple-500 bg-purple-100 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-2xl mb-2 ${hierarchyMode === 'company_first' ? 'text-purple-600' : 'text-gray-400'}`}>
                        🏢➡️🌐
                      </div>
                      <h4 className={`font-semibold mb-1 ${hierarchyMode === 'company_first' ? 'text-purple-900' : 'text-gray-700'}`}>
                        Empresa Primero
                      </h4>
                      <p className={`text-xs ${hierarchyMode === 'company_first' ? 'text-purple-700' : 'text-gray-500'}`}>
                        Prioriza config. por empresa
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleHierarchyModeChange('both')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      hierarchyMode === 'both'
                        ? 'border-purple-500 bg-purple-100 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-2xl mb-2 ${hierarchyMode === 'both' ? 'text-purple-600' : 'text-gray-400'}`}>
                        🔄
                      </div>
                      <h4 className={`font-semibold mb-1 ${hierarchyMode === 'both' ? 'text-purple-900' : 'text-gray-700'}`}>
                        Ambas
                      </h4>
                      <p className={`text-xs ${hierarchyMode === 'both' ? 'text-purple-700' : 'text-gray-500'}`}>
                        Combina ambas configuraciones
                      </p>
                    </div>
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Modo Actual:</h4>
                      <p className="text-sm text-gray-600">
                        {hierarchyMode === 'global_only' && 'Solo se usarán configuraciones globales. Las configuraciones por empresa serán ignoradas.'}
                        {hierarchyMode === 'company_first' && 'Se priorizarán configuraciones por empresa. Si no existen, se usarán las globales.'}
                        {hierarchyMode === 'both' && 'Se combinarán ambas configuraciones. Las específicas de empresa sobreescribirán las globales.'}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                      {hierarchyMode.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Google Drive */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg mr-4">
                    <CloudIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Google Drive</h3>
                    <p className="text-sm text-gray-600">Almacenamiento en la nube</p>
                  </div>
                </div>
                {isGoogleDriveConnected ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Conectado</span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Desconectado</span>
                )}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Sincroniza tus archivos y carpetas con Google Drive para acceso universal.
                </p>

                {isGoogleDriveConnected ? (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-sm text-green-700">
                        <p className="font-medium">Google Drive está conectado</p>
                        <p className="mt-1">
                          Tus archivos se sincronizarán automáticamente con tu cuenta de Google Drive.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium">Google Drive necesita configuración</p>
                        <p className="mt-1">
                          Al hacer clic en "Configurar Google Drive" serás redirigido a una herramienta de diagnóstico que te guiará paso a paso.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isGoogleDriveConnected ? (
                <button
                  onClick={handleDisconnectGoogleDrive}
                  disabled={connectingGoogleDrive}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingGoogleDrive ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Desconectar Google Drive
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogleDrive}
                  disabled={connectingGoogleDrive}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingGoogleDrive ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Configurar Google Drive
                    </>
                  )}
                </button>
              )}
            </div>
            {/* Google Workspace */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mr-4">
                    <CloudIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Google Workspace</h3>
                    <p className="text-sm text-gray-600">Calendario y eventos</p>
                  </div>
                </div>
                {getStatusBadge('google')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Sincroniza eventos del calendario y automatiza recordatorios de reuniones.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.google.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.google.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {integrations.google.connected ? (
                <button
                  onClick={() => disconnectIntegration('google')}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={configureGoogleWorkspace}
                  disabled={integrations.google.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.google.status === 'connecting' ? 'Conectando...' : 'Configurar Google'}
                </button>
              )}
            </div>

            {/* Google Meet */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Google Meet</h3>
                    <p className="text-sm text-gray-600">Videoconferencias</p>
                  </div>
                </div>
                {getStatusBadge('googlemeet')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Sincroniza reuniones de Google Meet y envía recordatorios automáticos por WhatsApp.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.googlemeet.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.googlemeet.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {integrations.googlemeet.connected ? (
                <button
                  onClick={() => disconnectIntegration('googlemeet')}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={configureGoogleMeet}
                  disabled={integrations.googlemeet.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.googlemeet.status === 'connecting' ? 'Conectando...' : 'Configurar Google Meet'}
                </button>
              )}
            </div>

            {/* Slack */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Slack</h3>
                    <p className="text-sm text-gray-600">Notificaciones colaborativas</p>
                  </div>
                </div>
                {getStatusBadge('slack')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Envía notificaciones automáticas a canales de Slack.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.slack.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.slack.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {integrations.slack.connected ? (
                <button
                  onClick={() => disconnectIntegration('slack')}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Placeholder para configuración de Slack
                    toast.info('Configuración de Slack próximamente')
                  }}
                  disabled={integrations.slack.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.slack.status === 'connecting' ? 'Conectando...' : 'Configurar Slack'}
                </button>
              )}
            </div>

            {/* Microsoft Teams */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Microsoft Teams</h3>
                    <p className="text-sm text-gray-600">Notificaciones empresariales</p>
                  </div>
                </div>
                {getStatusBadge('teams')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Envía notificaciones automáticas a equipos de Microsoft Teams.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.teams.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.teams.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {integrations.teams.connected ? (
                <button
                  onClick={() => disconnectIntegration('teams')}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={configureTeams}
                  disabled={integrations.teams.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.teams.status === 'connecting' ? 'Conectando...' : 'Configurar Teams'}
                </button>
              )}
            </div>

            {/* HubSpot */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg mr-4">
                    <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">HubSpot</h3>
                    <p className="text-sm text-gray-600">CRM y marketing</p>
                  </div>
                </div>
                {getStatusBadge('hubspot')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Sincroniza datos de contactos y automatiza comunicaciones basadas en CRM.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.hubspot.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.hubspot.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {integrations.hubspot.connected ? (
                <button
                  onClick={() => disconnectIntegration('hubspot')}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={configureHubSpot}
                  disabled={integrations.hubspot.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.hubspot.status === 'connecting' ? 'Conectando...' : 'Configurar HubSpot'}
                </button>
              )}
            </div>

            {/* Salesforce */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg mr-4">
                    <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Salesforce</h3>
                    <p className="text-sm text-gray-600">CRM empresarial</p>
                  </div>
                </div>
                {getStatusBadge('salesforce')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Sincroniza datos de leads y oportunidades con Salesforce.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.salesforce.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.salesforce.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {integrations.salesforce.connected ? (
                <button
                  onClick={() => disconnectIntegration('salesforce')}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={configureSalesforce}
                  disabled={integrations.salesforce.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.salesforce.status === 'connecting' ? 'Conectando...' : 'Configurar Salesforce'}
                </button>
              )}
            </div>

            {/* Brevo - SMS y Email Masivo */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Brevo</h3>
                    <p className="text-sm text-gray-600">SMS y Email Masivo</p>
                  </div>
                </div>
                {getStatusBadge('brevo')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Envío masivo de SMS y emails con estadísticas en tiempo real, plantillas personalizadas y programación de envíos.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.brevo.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.brevo.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                  {integrations.brevo.testMode && (
                    <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full inline-block">
                      🧪 Modo prueba activo
                    </div>
                  )}
                </div>

                {integrations.brevo.connected && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">Brevo configurado</span>
                    </div>
                    <div className="text-xs text-green-600">
                      <p>• SMS masivo activado (hasta 1000 por lote)</p>
                      <p>• Email masivo activado (hasta 2000 por lote)</p>
                      <p>• Estadísticas en tiempo real</p>
                      <p>• Plantillas personalizadas</p>
                    </div>
                  </div>
                )}
              </div>

              {integrations.brevo.connected ? (
                <div className="space-y-2">
                  <Link
                    to="/estadisticas-brevo"
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    📊 Ver Estadísticas
                  </Link>
                  <Link
                    to="/plantillas-brevo"
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    📝 Gestionar Plantillas
                  </Link>
                  <button
                    onClick={() => disconnectIntegration('brevo')}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Desconectar Brevo
                  </button>
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '📊 Información de Brevo',
                        html: `
                          <div style="text-align: left;">
                            <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                              <h4 style="margin: 0 0 8px 0; color: #0066ff;">Funcionalidades Activas</h4>
                              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                                <li>✅ Envío masivo de SMS</li>
                                <li>✅ Envío masivo de Email</li>
                                <li>✅ Estadísticas en tiempo real</li>
                                <li>✅ Plantillas personalizadas</li>
                                <li>✅ Programación de envíos</li>
                                <li>✅ Modo prueba ${integrations.brevo.testMode ? 'activado' : 'desactivado'}</li>
                              </ul>
                            </div>
                            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                              <h4 style="margin: 0 0 8px 0; color: #333;">Configuración</h4>
                              <p style="margin: 4px 0; font-size: 14px;">
                                <strong>Estado:</strong> <span style="color: #28a745;">Conectado</span><br>
                                <strong>Modo:</strong> ${integrations.brevo.testMode ? 'Prueba 🧪' : 'Producción 🚀'}<br>
                                <strong>Última sincronización:</strong> ${new Date(integrations.brevo.lastSync).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#0066ff',
                        width: '500px'
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300"
                  >
                    ℹ️ Ver Información
                  </button>
                </div>
              ) : (
                <button
                  onClick={configureBrevo}
                  disabled={integrations.brevo.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.brevo.status === 'connecting' ? 'Conectando...' : 'Configurar Brevo'}
                </button>
              )}
            </div>

            {/* Groq AI */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Groq AI</h3>
                    <p className="text-sm text-gray-600">Inteligencia Artificial</p>
                  </div>
                </div>
                {getStatusBadge('groq')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Motor de IA con modelos avanzados para chat, análisis de sentimientos, resumen de documentos y más.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.groq.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.groq.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                  {integrations.groq.model && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                      Modelo: {integrations.groq.model}
                    </div>
                  )}
                </div>

                {integrations.groq.connected && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">Groq AI configurado</span>
                    </div>
                    <div className="text-xs text-green-600">
                      <p>• Chat inteligente activo</p>
                      <p>• Análisis de sentimientos disponible</p>
                      <p>• Resumen de documentos activo</p>
                      <p>• Modelo: {integrations.groq.model}</p>
                    </div>
                  </div>
                )}
              </div>

              {integrations.groq.connected ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '🤖 Información de Groq AI',
                        html: `
                          <div style="text-align: left;">
                            <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                              <h4 style="margin: 0 0 8px 0; color: #00a67e;">Funcionalidades Activas</h4>
                              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                                <li>✅ Chat inteligente con contexto</li>
                                <li>✅ Análisis de sentimientos</li>
                                <li>✅ Resumen de documentos</li>
                                <li>✅ Generación de contenido</li>
                                <li>✅ Soporte para español optimizado</li>
                                <li>✅ Tracking de uso de tokens</li>
                              </ul>
                            </div>
                            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                              <h4 style="margin: 0 0 8px 0; color: #333;">Configuración</h4>
                              <p style="margin: 4px 0; font-size: 14px;">
                                <strong>Estado:</strong> <span style="color: #28a745;">Conectado</span><br>
                                <strong>Modelo:</strong> ${integrations.groq.model}<br>
                                <strong>Última sincronización:</strong> ${new Date(integrations.groq.lastSync).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#00a67e',
                        width: '500px'
                      });
                    }}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ℹ️ Ver Información
                  </button>
                  <button
                    onClick={() => disconnectIntegration('groq')}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Desconectar Groq
                  </button>
                </div>
              ) : (
                <button
                  onClick={configureGroq}
                  disabled={integrations.groq.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.groq.status === 'connecting' ? 'Conectando...' : 'Configurar Groq AI'}
                </button>
              )}
            </div>


            {/* WhatsApp Official API */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">WhatsApp Business API</h3>
                    <p className="text-sm text-gray-600">API oficial de Meta</p>
                  </div>
                </div>
                {getStatusBadge('whatsappOfficial')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Configura la API oficial de WhatsApp Business para enviar mensajes automáticos y notificaciones con la plataforma de Meta.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.whatsappOfficial.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.whatsappOfficial.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                  {integrations.whatsappOfficial.testMode && (
                    <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full inline-block">
                      🧪 Modo prueba activo
                    </div>
                  )}
                </div>

                {integrations.whatsappOfficial.connected && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">WhatsApp Official configurado</span>
                    </div>
                    <div className="text-xs text-green-600">
                      <p>• API oficial de Meta conectada</p>
                      <p>• Envío de mensajes activo</p>
                      <p>• Webhooks configurados</p>
                    </div>
                  </div>
                )}
              </div>

              {integrations.whatsappOfficial.connected ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '📱 Información de WhatsApp Official',
                        html: `
                          <div style="text-align: left;">
                            <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                              <h4 style="margin: 0 0 8px 0; color: #25d366;">Funcionalidades Activas</h4>
                              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                                <li>✅ Envío de mensajes individuales</li>
                                <li>✅ Envío masivo de mensajes</li>
                                <li>✅ Plantillas pre-aprobadas</li>
                                <li>✅ Webhooks en tiempo real</li>
                                <li>✅ Estadísticas de uso</li>
                                <li>✅ Modo prueba ${integrations.whatsappOfficial.testMode ? 'activado' : 'desactivado'}</li>
                              </ul>
                            </div>
                            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                              <h4 style="margin: 0 0 8px 0; color: #333;">Configuración</h4>
                              <p style="margin: 4px 0; font-size: 14px;">
                                <strong>Estado:</strong> <span style="color: #28a745;">Conectado</span><br>
                                <strong>Modo:</strong> ${integrations.whatsappOfficial.testMode ? 'Prueba 🧪' : 'Producción 🚀'}<br>
                                <strong>Última sincronización:</strong> ${new Date(integrations.whatsappOfficial.lastSync).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#25d366',
                        width: '500px'
                      });
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ℹ️ Ver Información
                  </button>
                  <button
                    onClick={() => disconnectIntegration('whatsappOfficial')}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Desconectar WhatsApp Official
                  </button>
                </div>
              ) : (
                <button
                  onClick={configureWhatsAppOfficial}
                  disabled={integrations.whatsappOfficial.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.whatsappOfficial.status === 'connecting' ? 'Conectando...' : 'Configurar WhatsApp Official'}
                </button>
              )}
            </div>

            {/* WhatsApp WAHA API */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">WhatsApp WAHA API</h3>
                    <p className="text-sm text-gray-600">API waha.devike.pro</p>
                  </div>
                </div>
                {getStatusBadge('whatsappWaha')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Configura la API de WAHA (waha.devike.pro) para enviar mensajes a través de su plataforma.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.whatsappWaha.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.whatsappWaha.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                  {integrations.whatsappWaha.testMode && (
                    <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full inline-block">
                      🧪 Modo prueba activo
                    </div>
                  )}
                </div>

                {integrations.whatsappWaha.connected && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">WhatsApp WAHA configurado</span>
                    </div>
                    <div className="text-xs text-green-600">
                      <p>• API WAHA conectada</p>
                      <p>• Envío de mensajes activo</p>
                      <p>• Sesión establecida</p>
                    </div>
                  </div>
                )}
              </div>

              {integrations.whatsappWaha.connected ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '📱 Información de WhatsApp WAHA',
                        html: `
                          <div style="text-align: left;">
                            <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                              <h4 style="margin: 0 0 8px 0; color: #9333ea;">Funcionalidades Activas</h4>
                              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                                <li>✅ Envío de mensajes individuales</li>
                                <li>✅ Envío masivo de mensajes</li>
                                <li>✅ Envío de archivos</li>
                                <li>✅ Envío de ubicaciones</li>
                                <li>✅ Gestión de sesiones</li>
                                <li>✅ Modo prueba ${integrations.whatsappWaha.testMode ? 'activado' : 'desactivado'}</li>
                              </ul>
                            </div>
                            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                              <h4 style="margin: 0 0 8px 0; color: #333;">Configuración</h4>
                              <p style="margin: 4px 0; font-size: 14px;">
                                <strong>Estado:</strong> <span style="color: #28a745;">Conectado</span><br>
                                <strong>Modo:</strong> ${integrations.whatsappWaha.testMode ? 'Prueba 🧪' : 'Producción 🚀'}<br>
                                <strong>Última sincronización:</strong> ${new Date(integrations.whatsappWaha.lastSync).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#9333ea',
                        width: '500px'
                      });
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ℹ️ Ver Información
                  </button>
                  <button
                    onClick={() => disconnectIntegration('whatsappWaha')}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Desconectar WhatsApp WAHA
                  </button>
                </div>
              ) : (
                <button
                  onClick={configureWhatsAppWaha}
                  disabled={integrations.whatsappWaha.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.whatsappWaha.status === 'connecting' ? 'Conectando...' : 'Configurar WhatsApp WAHA'}
                </button>
              )}
            </div>

            {/* Asistente de Configuración Inicial de WhatsApp */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Asistente de Configuración Inicial</h3>
                    <p className="text-sm text-gray-600">Configuración guiada</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Guía paso a paso</span>
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Asistente interactivo que te guía paso a paso en la configuración inicial de WhatsApp Business API.
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 font-semibold">1</div>
                    <span>Obtén tus credenciales de Meta</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 font-semibold">2</div>
                    <span>Configura tu número de teléfono</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 font-semibold">3</div>
                    <span>Personaliza plantillas de mensaje</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 font-semibold">4</div>
                    <span>Prueba el funcionamiento</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="p-1 rounded bg-blue-100 mr-2">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Ideal para:</h4>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• Primeros usuarios de WhatsApp API</li>
                        <li>• Configuración sin experiencia técnica</li>
                        <li>• Empresas que recién inician con WhatsApp</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to="/whatsapp/setup"
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              >
                🚀 Iniciar Configuración Guiada
              </Link>
            </div>

            {/* Panel de Gestión Avanzada de WhatsApp */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Panel de Gestión Avanzada</h3>
                    <p className="text-sm text-gray-600">Multi-agencia</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Avanzado</span>
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Gestiona múltiples cuentas de WhatsApp, agencias y configuraciones avanzadas desde un panel centralizado.
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 font-semibold">✓</div>
                    <span>Gestión multi-agencia</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 font-semibold">✓</div>
                    <span>Configuraciones avanzadas</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 font-semibold">✓</div>
                    <span>Estadísticas detalladas</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 font-semibold">✓</div>
                    <span>Control de acceso por roles</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="p-1 rounded bg-purple-100 mr-2">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-purple-800 mb-1">Ideal para:</h4>
                      <ul className="text-xs text-purple-600 space-y-1">
                        <li>• Agencias de marketing digital</li>
                        <li>• Empresas con múltiples marcas</li>
                        <li>• Usuarios con experiencia técnica</li>
                        <li>• Gestión de clientes a gran escala</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to="/whatsapp/multi-manager"
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              >
                ⚙️ Acceder Panel Avanzado
              </Link>
            </div>

            {/* Telegram Bot */}
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Telegram Bot</h3>
                    <p className="text-sm text-gray-600">Mensajería instantánea</p>
                  </div>
                </div>
                {getStatusBadge('telegram')}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  Configura un bot de Telegram para enviar mensajes automáticos y notificaciones a tus usuarios.
                </p>

                <div className="space-y-2 mb-4">
                  {integrations.telegram.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations.telegram.lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                  {integrations.telegram.botUsername && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                      Bot: {integrations.telegram.botUsername}
                    </div>
                  )}
                </div>

                {integrations.telegram.connected && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-800">Telegram configurado</span>
                    </div>
                    <div className="text-xs text-green-600">
                      <p>• Bot de Telegram conectado</p>
                      <p>• Envío de mensajes activo</p>
                      <p>• Notificaciones automáticas listas</p>
                    </div>
                  </div>
                )}
              </div>

              {integrations.telegram.connected ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '📱 Información de Telegram',
                        html: `
                          <div style="text-align: left;">
                            <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
                              <h4 style="margin: 0 0 8px 0; color: #0088cc;">Funcionalidades Activas</h4>
                              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                                <li>✅ Envío de mensajes individuales</li>
                                <li>✅ Envío masivo de mensajes</li>
                                <li>✅ Notificaciones automáticas</li>
                                <li>✅ Integración con sistema de comunicación</li>
                                <li>✅ Soporte para mensajes formateados</li>
                              </ul>
                            </div>
                            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px;">
                              <h4 style="margin: 0 0 8px 0; color: #333;">Configuración</h4>
                              <p style="margin: 4px 0; font-size: 14px;">
                                <strong>Estado:</strong> <span style="color: #28a745;">Conectado</span><br>
                                <strong>Bot Username:</strong> ${integrations.telegram.botUsername}<br>
                                <strong>Última sincronización:</strong> ${new Date(integrations.telegram.lastSync).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#0088cc',
                        width: '500px'
                      });
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ℹ️ Ver Información
                  </button>
                  <button
                    onClick={() => disconnectIntegration('telegram')}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Desconectar Telegram
                  </button>
                </div>
              ) : (
                <button
                  onClick={configureTelegram}
                  disabled={integrations.telegram.status === 'connecting'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations.telegram.status === 'connecting' ? 'Conectando...' : 'Configurar Telegram'}
                </button>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-100">
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-blue-100 mr-4">
                <PuzzlePieceIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Necesitas otra integración?</h3>
                <p className="text-gray-600 mb-4">
                  Podemos integrar tu sistema con otras plataformas como Zapier, Make (Integromat),
                  API personalizadas, o cualquier otro servicio que utilices.
                </p>
                <button
                  onClick={() => setShowIntegrationForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Solicitar Integración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <DatabaseSettings />
      )}

      {/* Modal del formulario de solicitud de integración */}
      {showIntegrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Solicitar Integración</h3>
                <button
                  onClick={() => setShowIntegrationForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleIntegrationRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={integrationForm.nombre}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa tu nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={integrationForm.apellido}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, apellido: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa tu apellido"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={integrationForm.empresa}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, empresa: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={integrationForm.email}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={integrationForm.telefono}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios
                  </label>
                  <textarea
                    value={integrationForm.comentarios}
                    onChange={(e) => setIntegrationForm(prev => ({ ...prev, comentarios: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    placeholder="Describe brevemente qué integración necesitas y cómo la utilizarías..."
                    rows="3"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowIntegrationForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sendingIntegrationRequest}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingIntegrationRequest ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </form>

              <p className="text-xs text-gray-500 mt-4 text-center">
                * Campos obligatorios. Te contactaremos pronto a tu email.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings