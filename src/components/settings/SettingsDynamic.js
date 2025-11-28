import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import googleDriveAuthServiceDynamic from '../../lib/googleDriveAuthServiceDynamic_v2.js'
import googleDrivePersistenceService from '../../services/googleDrivePersistenceService.js'
import brevoService from '../../services/brevoService.js'
import companySyncService from '../../services/companySyncService.js'
import organizedDatabaseService from '../../services/organizedDatabaseService.js'
import whatsappOfficialService from '../../services/whatsappOfficialService.js'
import whatsappWahaService from '../../services/whatsappWahaService.js'
import configurationService from '../../services/configurationService.js'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import CompanyForm from './CompanyForm.js'
import UserManagement from './UserManagement.js'
import GeneralSettings from './GeneralSettings.js'
import DatabaseSettings from './DatabaseSettings.js'
import SettingsHeader from './SettingsHeader.js'
import CompaniesSection from './CompaniesSection.js'
import IntegrationsSection from './IntegrationsSection.js'
import NotificationsSection from './NotificationsSection.js'
import SecuritySection from './SecuritySection.js'
import SyncSettingsSection from './SyncSettingsSection.js'
import CompanySyncSettingsSection from './CompanySyncSettingsSection.js'

const Settings = ({ activeTab: propActiveTab, companyId: propCompanyId }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  
  // Estado para controlar el sistema de configuración jerárquico
  const [hierarchyMode, setHierarchyMode] = useState('company_first')
  
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

  // Estados para configuraciones
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

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    twoFactorMethod: 'app',
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    lockoutDuration: 15,
    ipWhitelist: [],
    requireStrongPassword: true,
    auditLogEnabled: true
  })

  const [activeSessions, setActiveSessions] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'weekly',
    retentionDays: 30,
    lastBackup: null,
    backupSize: null
  })

  // Estados para Google Drive - NUEVO SISTEMA DINÁMICO
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false)
  const [connectingGoogleDrive, setConnectingGoogleDrive] = useState(false)
  const [availableGoogleDriveCredentials, setAvailableGoogleDriveCredentials] = useState([])
  const [selectedGoogleDriveCredential, setSelectedGoogleDriveCredential] = useState(null)

  // Funciones de carga - movidas antes del useEffect para evitar use-before-define
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const companiesData = await organizedDatabaseService.getCompanies()
      setCompanies(companiesData || [])
    } catch (error) {
      console.error('Error loading companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNotificationSettings = useCallback(async () => {
    try {
      const saved = await configurationService.getNotificationSettings()
      if (saved) {
        const settingsWithArrayRecipients = {
          ...saved,
          reports: {
            ...saved.reports,
            recipients: Array.isArray(saved.reports?.recipients)
              ? saved.reports.recipients
              : saved.reports?.recipients
                ? [saved.reports.recipients]
                : [user?.email || '']
          }
        }
        setNotificationSettings(prev => ({ ...prev, ...settingsWithArrayRecipients }))
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }, [user?.email])

  const loadSecuritySettings = useCallback(async () => {
    try {
      const saved = await configurationService.getSecuritySettings()
      if (saved) setSecuritySettings(prev => ({ ...prev, ...saved }))
    } catch (error) {
      console.error('Error loading security settings:', error)
    }
  }, [])

  const loadActiveSessions = useCallback(() => {
    try {
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
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          current: false
        }
      ]
      setActiveSessions(sessions)
    } catch (error) {
      console.error('Error loading active sessions:', error)
    }
  }, [])

  const loadSecurityLogs = useCallback(() => {
    try {
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
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: 3,
          action: 'Configuración de 2FA',
          details: 'Aplicación web',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ip: '192.168.1.100',
          status: 'success'
        },
        {
          id: 4,
          action: 'Intento de inicio de sesión fallido',
          details: 'IP sospechosa • Nueva York, USA',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          ip: '104.28.1.100',
          status: 'warning'
        }
      ]
      setSecurityLogs(logs)
    } catch (error) {
      console.error('Error loading security logs:', error)
    }
  }, [])

  const loadBackupSettings = useCallback(async () => {
    try {
      const saved = await configurationService.getConfig('system', 'backup_settings', 'global', null, {
        autoBackup: true,
        backupFrequency: 'weekly',
        retentionDays: 30,
        lastBackup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        backupSize: '2.3 GB'
      })
      setBackupSettings(prev => ({ ...prev, ...saved }))
    } catch (error) {
      console.error('Error loading backup settings:', error)
    }
  }, [])

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

  // NUEVA FUNCIÓN: Cargar credenciales de Google Drive por empresa
  const loadGoogleDriveCredentials = useCallback(async (companyId) => {
    try {
      if (!companyId) {
        setAvailableGoogleDriveCredentials([])
        setSelectedGoogleDriveCredential(null)
        setIsGoogleDriveConnected(false)
        return
      }

      console.log('🔍 Cargando credenciales de Google Drive para empresa:', companyId)
      
      // ✅ SOLUCIÓN CORREGIDA: Importar supabaseClient directamente desde supabaseClient.js
      let supabaseClient
      try {
        // Importar directamente el cliente de Supabase (no el módulo wrapper)
        const supabaseModule = await import('../../lib/supabaseClient.js')
        supabaseClient = supabaseModule.supabase
        console.log('✅ Supabase importado dinámicamente:', typeof supabaseClient)
        console.log('✅ Métodos disponibles:', Object.keys(supabaseClient).slice(0, 10))
      } catch (importError) {
        console.error('❌ Error importando supabase:', importError)
        toast.error('Error de conexión con la base de datos')
        setAvailableGoogleDriveCredentials([])
        setSelectedGoogleDriveCredential(null)
        setIsGoogleDriveConnected(false)
        return
      }
      
      if (!supabaseClient) {
        console.error('❌ Error crítico: supabase es null después de importar')
        toast.error('Error de conexión con la base de datos')
        setAvailableGoogleDriveCredentials([])
        setSelectedGoogleDriveCredential(null)
        setIsGoogleDriveConnected(false)
        return
      }
      
      // Verificar que tenga el método rpc
      if (typeof supabaseClient.rpc !== 'function') {
        console.error('❌ Error crítico: supabase no tiene método rpc')
        console.error('📊 Métodos disponibles:', Object.keys(supabaseClient))
        toast.error('Error de conexión con la base de datos: cliente incompleto')
        setAvailableGoogleDriveCredentials([])
        setSelectedGoogleDriveCredential(null)
        setIsGoogleDriveConnected(false)
        return
      }
      
      console.log('✅ Supabase cliente válido con método rpc')
      
      // Cargar credenciales usando el servicio dinámico
      const initialized = await googleDriveAuthServiceDynamic.initialize(supabaseClient, companyId)
      
      if (!initialized) {
        console.error('❌ Error inicializando servicio de Google Drive')
        toast.error('Error al inicializar el servicio de Google Drive')
        setAvailableGoogleDriveCredentials([])
        setSelectedGoogleDriveCredential(null)
        setIsGoogleDriveConnected(false)
        return
      }
      
      const credentials = googleDriveAuthServiceDynamic.getAvailableCredentials()
      
      setAvailableGoogleDriveCredentials(credentials)
      
      // Si hay credenciales disponibles, seleccionar la primera activa
      const activeCredential = credentials.find(cred => cred.status === 'active')
      if (activeCredential) {
        setSelectedGoogleDriveCredential(activeCredential.id)
        setIsGoogleDriveConnected(true)
        
        // Actualizar estado de integraciones
        setIntegrations(prev => ({
          ...prev,
          google: {
            connected: true,
            status: 'connected',
            lastSync: new Date().toISOString(),
            email: activeCredential.accountEmail,
            accountName: activeCredential.accountName
          }
        }))
      } else {
        setSelectedGoogleDriveCredential(null)
        setIsGoogleDriveConnected(false)
        setIntegrations(prev => ({
          ...prev,
          google: { connected: false, status: 'disconnected', lastSync: null }
        }))
      }
      
      console.log(`✅ ${credentials.length} credenciales de Google Drive cargadas`)
    } catch (error) {
      console.error('Error loading Google Drive credentials:', error)
      setAvailableGoogleDriveCredentials([])
      setSelectedGoogleDriveCredential(null)
      setIsGoogleDriveConnected(false)
    }
  }, [])  // ✅ CORREGIDO: Eliminar dependencia inválida

  const checkGoogleDriveConnection = useCallback(async () => {
    try {
      // Usar el nuevo sistema dinámico
      await loadGoogleDriveCredentials(selectedCompanyId)
    } catch (error) {
      console.error('Error verificando conexión de Google Drive:', error)
      setIsGoogleDriveConnected(false)
    }
  }, [selectedCompanyId, loadGoogleDriveCredentials])

  const checkBrevoConfiguration = useCallback(() => {
    const config = brevoService.loadConfiguration()
    setIntegrations(prev => ({
      ...prev,
      brevo: {
        connected: !!config.apiKey,
        status: config.apiKey ? 'connected' : 'disconnected',
        lastSync: config.apiKey ? new Date().toISOString() : null,
        testMode: config.testMode
      }
    }))
  }, [])

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
    }
  }, [])

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
    }
  }, [])

  const checkWhatsAppOfficialConfiguration = useCallback(() => {
    const config = whatsappOfficialService.loadConfiguration()
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

  const checkWhatsAppWahaConfiguration = useCallback(() => {
    const config = whatsappWahaService.loadConfiguration()
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
    }
  }, [])

  useEffect(() => {
    if (propActiveTab && propActiveTab !== activeTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab, activeTab])

  // Detectar companyId desde la URL y actualizar estado
  useEffect(() => {
    const pathParts = location.pathname.split('/')
    console.log('🔍 URL actual:', location.pathname)
    console.log('🔍 Partes de la URL:', pathParts)
    
    // Buscar companyId en la URL: /configuracion/empresas/[ID]/...
    const configuracionIndex = pathParts.indexOf('configuracion')
    const empresasIndex = pathParts.indexOf('empresas')
    
    let detectedCompanyId = null
// También verificar si viene como prop
    if (!detectedCompanyId && propCompanyId) {
      detectedCompanyId = propCompanyId
    }
    
    if (configuracionIndex !== -1 && empresasIndex !== -1 && empresasIndex < pathParts.length - 1) {
      // Verificar si hay un ID después de 'empresas'
      const potentialId = pathParts[empresasIndex + 1]
      if (potentialId && potentialId !== 'integraciones' && potentialId !== 'general' && potentialId !== 'usuarios') {
        detectedCompanyId = potentialId
      }
    }
    
    console.log('🔍 CompanyId detectado:', detectedCompanyId)
    console.log('🔍 selectedCompanyId actual:', selectedCompanyId)
    
    if (detectedCompanyId !== selectedCompanyId) {
      console.log('🔄 Actualizando selectedCompanyId de', selectedCompanyId, 'a', detectedCompanyId)
      setSelectedCompanyId(detectedCompanyId)
    }
  }, [location.pathname, selectedCompanyId])

  // Cargar datos iniciales
  useEffect(() => {
    if (!user?.id) return
    
    let isMounted = true
    
    const loadData = async () => {
      try {
        await loadCompanies()
        
        if (!isMounted) return
        
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
    }
    
    if (isMounted) {
      loadData()
    }
    
    return () => {
      isMounted = false
    }
  }, [user?.id, propCompanyId, location.pathname, companies.length, loadCompanies, loadNotificationSettings, loadSecuritySettings, loadActiveSessions, loadSecurityLogs, loadBackupSettings, loadHierarchyMode, checkGoogleDriveConnection, checkBrevoConfiguration, checkGroqConfiguration, checkWhatsAppConfiguration, checkWhatsAppOfficialConfiguration, checkWhatsAppWahaConfiguration, checkTelegramConfiguration])

  // Handlers para Companies
  const handleCreateCompany = () => {
    setEditingCompany(null)
    setShowCompanyForm(true)
  }

  const handleDeleteCompany = async (companyId) => {
    try {
      await companySyncService.deleteCompany(companyId)
      setCompanies(prev => prev.filter(c => c.id !== companyId))
      toast.success('Empresa eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('Error al eliminar la empresa')
    }
  }

  const handleToggleCompanyStatus = async (company) => {
    try {
      const newStatus = company.status === 'active' ? 'inactive' : 'active'
      
      // Actualizar en la base de datos
      await companySyncService.updateCompany(company.id, { status: newStatus })
      
      // Actualizar estado local inmediatamente para feedback visual
      setCompanies(prev => prev.map(c =>
        c.id === company.id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      ))
      
      // Refrescar datos desde la base de datos para asegurar sincronización
      await loadCompanies()
      
      toast.success(`Empresa ${newStatus === 'active' ? 'activada' : 'desactivada'}`)
    } catch (error) {
      console.error('Error toggling company status:', error)
      toast.error('Error al cambiar el estado de la empresa')
      
      // Revertir cambio local en caso de error
      setCompanies(prev => prev.map(c =>
        c.id === company.id ? { ...c, status: company.status, updated_at: new Date().toISOString() } : c
      ))
    }
  }

  const handleFormSuccess = () => {
    setShowCompanyForm(false)
    setEditingCompany(null)
    loadCompanies()
  }

  // Handlers para Notificaciones
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

  const saveEmailPreferences = async () => {
    try {
      await configurationService.setNotificationSettings(notificationSettings)
      toast.success('Configuración de notificaciones guardada')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Error al guardar la configuración')
    }
  }

  const addEmailRecipient = () => {
    const newEmail = prompt('Ingresa el email del destinatario:')
    if (newEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
    if (!notificationSettings.reports.recipients || notificationSettings.reports.recipients.length === 0) {
      toast.error('Por favor agrega al menos un destinatario')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = notificationSettings.reports.recipients.filter(email => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      toast.error(`Los siguientes emails no son válidos: ${invalidEmails.join(', ')}`)
      return
    }

    await saveEmailPreferences()
    toast.success(`Configuración guardada. Redirigiendo a reportes...`)
    setTimeout(() => navigate('/communication/reports'), 1500)
  }

  const testSounds = async () => {
    if (!notificationSettings.sound.enabled) {
      toast.info('Los sonidos están desactivados')
      return
    }

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

  const handleSecuritySettingsChange = (key, value) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }))
  }

  const handleToggle2FA = () => {
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
    toast.success(securitySettings.twoFactorEnabled ? '2FA desactivado' : '2FA activado')
  }

  const handleCloseSession = (sessionId) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success('Sesión cerrada exitosamente')
  }

  const handleCreateBackup = () => {
    setBackupSettings(prev => ({
      ...prev,
      lastBackup: new Date(),
      backupSize: '2.4 GB'
    }))
    toast.success('Backup creado exitosamente')
  }

  const handleDownloadBackup = () => {
    if (backupSettings.lastBackup) {
      toast.success('Descargando backup...')
      setTimeout(() => toast.success('Backup descargado exitosamente'), 2000)
    } else {
      toast.error('No hay backup disponible para descargar')
    }
  }

  const handleSaveBackupSettings = async () => {
    try {
      await configurationService.setConfig('system', 'backup_settings', backupSettings, 'global', null, 'Configuración de backup del sistema')
      toast.success('Configuración de backup guardada')
    } catch (error) {
      console.error('Error saving backup settings:', error)
      toast.error('Error al guardar la configuración de backup')
    }
  }

  // NUEVOS HANDLERS para Google Drive con APIs Dinámicas
  const handleConnectGoogleDrive = async () => {
    try {
      if (!selectedCompanyId) {
        toast.error('Selecciona una empresa primero')
        return
      }

      setConnectingGoogleDrive(true)
      
      // Solicitar credenciales de cliente al usuario
      const { value: clientConfig } = await Swal.fire({
        title: '🔧 Configurar Credenciales de Google Drive',
        html: `
          <div style="text-align: left; max-width: 500px;">
            <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #495057;">Configuración OAuth 2.0</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                Ingresa las credenciales de tu proyecto de Google Cloud Console para esta empresa.
              </p>
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client ID:</label>
              <input type="text" id="clientId" class="swal2-input" placeholder="tu_client_id.apps.googleusercontent.com" style="width: 100%;">
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Client Secret:</label>
              <input type="password" id="clientSecret" class="swal2-input" placeholder="tu_client_secret" style="width: 100%;">
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Nombre de la Cuenta:</label>
              <input type="text" id="accountName" class="swal2-input" placeholder="Cuenta Principal" style="width: 100%;">
            </div>
          </div>
        `,
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#3085d6',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#6c757d',
        showCancelButton: true,
        preConfirm: () => {
          const clientId = document.getElementById('clientId').value
          const clientSecret = document.getElementById('clientSecret').value
          const accountName = document.getElementById('accountName').value || 'Cuenta Principal'
          
          if (!clientId || !clientSecret) {
            Swal.showValidationMessage('Por favor completa todos los campos')
            return false
          }
          
          return { clientId, clientSecret, accountName }
        }
      })

      if (!clientConfig) {
        setConnectingGoogleDrive(false)
        return
      }

      // ✅ SOLUCIÓN: Generar URL de autorización con state correcto
      const redirectUri = window.location.origin + '/auth/google/callback'
      
      // Preparar datos del state
      const stateData = {
        companyId: selectedCompanyId,
        accountName: clientConfig.accountName,
        clientConfig: {
          clientId: clientConfig.clientId,
          clientSecret: clientConfig.clientSecret,
          redirectUri: redirectUri
        },
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
      }
      
      const authUrl = googleDriveAuthServiceDynamic.generateAuthUrl({
        clientId: clientConfig.clientId,
        clientSecret: clientConfig.clientSecret,
        redirectUri: redirectUri
      }, JSON.stringify(stateData))

      if (authUrl) {
        // Guardar configuración temporal para el callback
        sessionStorage.setItem('google_drive_temp_config', JSON.stringify({
          companyId: selectedCompanyId,
          accountName: clientConfig.accountName,
          clientConfig: {
            clientId: clientConfig.clientId,
            clientSecret: clientConfig.clientSecret,
            redirectUri: redirectUri
          }
        }))
        
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

  const handleDisconnectGoogleDrive = async () => {
    try {
      setConnectingGoogleDrive(true)
      
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
      
      if (selectedGoogleDriveCredential) {
        // Desactivar credencial en lugar de eliminar
        await googleDriveAuthServiceDynamic.deactivateCredential(selectedGoogleDriveCredential)
      }
      
      setIsGoogleDriveConnected(false)
      setSelectedGoogleDriveCredential(null)
      setAvailableGoogleDriveCredentials([])
      setIntegrations(prev => ({
        ...prev,
        google: { connected: false, status: 'disconnected', lastSync: null }
      }))
      
      toast.success('Google Drive desconectado exitosamente')
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error)
      toast.error('Error al desconectar Google Drive')
    } finally {
      setConnectingGoogleDrive(false)
    }
  }

  const handleSelectGoogleDriveCredential = async (credentialId) => {
    try {
      setSelectedGoogleDriveCredential(credentialId)
      
      if (credentialId) {
        const success = await googleDriveAuthServiceDynamic.selectCredential(credentialId)
        if (success) {
          setIsGoogleDriveConnected(true)
          toast.success('Credencial de Google Drive seleccionada')
        } else {
          toast.error('Error al seleccionar la credencial')
        }
      } else {
        setIsGoogleDriveConnected(false)
        googleDriveAuthServiceDynamic.clearCurrentSession()
      }
    } catch (error) {
      console.error('Error selecting Google Drive credential:', error)
      toast.error('Error al seleccionar la credencial')
    }
  }

  const handleConfigureIntegration = async (integration, mode) => {
    if (integration === 'hierarchy') {
      try {
        setHierarchyMode(mode)
        await configurationService.setConfig('system', 'hierarchy_mode', mode, 'global', null, 'Modo de jerarquía de configuración del sistema')
        toast.success(`Modo de configuración actualizado: ${mode.replace('_', ' ').toUpperCase()}`)
      } catch (error) {
        console.error('Error changing hierarchy mode:', error)
        toast.error('Error al cambiar el modo de configuración')
      }
      return
    }

    // Para otras integraciones, mostrar mensaje de próximamente
    toast.info(`Configuración de ${integration} próximamente`)
  }

  const handleDisconnectIntegration = async (integration) => {
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
    }

    const result = await Swal.fire({
      title: 'Desconectar Integración',
      text: `¿Estás seguro de desconectar ${integrationNames[integration]}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desconectar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        if (['groq', 'whatsapp', 'telegram'].includes(integration)) {
          await configurationService.setConfig('integrations', integration, {}, 'global', null, `Desconexión de ${integrationNames[integration]}`)
        }

        if (integration === 'brevo') brevoService.clearConfiguration()
        if (integration === 'whatsappOfficial') whatsappOfficialService.clearConfiguration()
        if (integration === 'whatsappWaha') whatsappWahaService.clearConfiguration()

        setIntegrations(prev => ({
          ...prev,
          [integration]: { connected: false, status: 'disconnected', lastSync: null, testMode: false }
        }))

        toast.success(`${integrationNames[integration]} desconectado`)
      } catch (error) {
        console.error('Error disconnecting integration:', error)
        toast.error(`Error al desconectar ${integrationNames[integration]}`)
      }
    }
  }

  const getStatusBadge = (integration) => {
    const status = integrations[integration].status
    const connected = integrations[integration].connected

    if (status === 'connecting') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Conectando...</span>
    }

    if (connected) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Conectado</span>
    }

    return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Desconectado</span>
  }


  if (showCompanyForm) {
    return (
      <CompanyForm
        company={editingCompany}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowCompanyForm(false)
          setEditingCompany(null)
          if (selectedCompanyId) navigate('/configuracion/empresas')
        }}
        companyId={selectedCompanyId}
        isCompanySpecificMode={!!selectedCompanyId}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SettingsHeader activeTab={activeTab} />

      {/* Content */}
      {activeTab === 'companies' && (
        <CompaniesSection
          companies={companies}
          loading={loading}
          onCreateCompany={handleCreateCompany}
          onDeleteCompany={handleDeleteCompany}
          onToggleCompanyStatus={handleToggleCompanyStatus}
        />
      )}

      {activeTab === 'users' && <UserManagement />}

      {activeTab === 'general' && <GeneralSettings />}

      {activeTab === 'notifications' && (
        <NotificationsSection
          notificationSettings={notificationSettings}
          onEmailNotificationChange={handleEmailNotificationChange}
          onReportsSettingsChange={handleReportsSettingsChange}
          onSoundSettingsChange={handleSoundSettingsChange}
          onSaveEmailPreferences={saveEmailPreferences}
          onAddEmailRecipient={addEmailRecipient}
          onRemoveEmailRecipient={removeEmailRecipient}
          onScheduleReports={scheduleReports}
          onTestSounds={testSounds}
        />
      )}

      {activeTab === 'security' && (
        <SecuritySection
          securitySettings={securitySettings}
          activeSessions={activeSessions}
          securityLogs={securityLogs}
          backupSettings={backupSettings}
          onSecuritySettingsChange={handleSecuritySettingsChange}
          onToggle2FA={handleToggle2FA}
          onCloseSession={handleCloseSession}
          onCreateBackup={handleCreateBackup}
          onDownloadBackup={handleDownloadBackup}
          onSaveBackupSettings={handleSaveBackupSettings}
        />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsSection
          integrations={integrations}
          hierarchyMode={hierarchyMode}
          isGoogleDriveConnected={isGoogleDriveConnected}
          connectingGoogleDrive={connectingGoogleDrive}
          onConnectGoogleDrive={handleConnectGoogleDrive}
          onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
          onConfigureIntegration={handleConfigureIntegration}
          onDisconnectIntegration={handleDisconnectIntegration}
          getStatusBadge={getStatusBadge}
          companyId={selectedCompanyId}
          companies={companies}
          availableGoogleDriveCredentials={availableGoogleDriveCredentials}
          selectedGoogleDriveCredential={selectedGoogleDriveCredential}
          onSelectGoogleDriveCredential={handleSelectGoogleDriveCredential}
        />
      )}

      {activeTab === 'sync' && (
        <SyncSettingsSection selectedCompanyId={selectedCompanyId} />
      )}

      {activeTab === 'company-sync' && (
        <CompanySyncSettingsSection
          selectedCompanyId={selectedCompanyId}
          companies={companies}
          hierarchyMode={hierarchyMode}
          onHierarchyModeChange={setHierarchyMode}
        />
      )}

      {activeTab === 'database' && <DatabaseSettings />}
    </div>
  )
}

export default Settings