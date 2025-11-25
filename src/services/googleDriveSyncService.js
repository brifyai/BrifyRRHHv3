/**
 * Google Drive Sync Service - Refactorizado
 * Sincronización bidireccional Drive ↔ Supabase con logging detallado
 * NUEVA FUNCIONALIDAD: Gestión de permisos y detección de emails no-Gmail + Webhooks automáticos
 */

import { supabase } from '../lib/supabaseClient.js'
import googleDriveConsolidatedService from '../lib/googleDriveConsolidated.js'
import googleDriveAuthService from '../lib/googleDriveAuthService.js'
import distributedLockService from '../lib/distributedLockService.js'
import DriveWatchService from '../lib/driveWatchService.js'
import logger from '../lib/logger.js'

class GoogleDriveSyncService {
  constructor() {
    this.syncIntervals = new Map()
    this.isInitialized = false
    this.syncErrors = []
    this.webhookInitialized = false
    this.companyConfigs = new Map() // Cache de configuraciones por empresa
    this.customGmailDomains = null // Dominios Gmail personalizados por empresa
  }

  /**
   * Inicializa el servicio
   */
  async initialize() {
    try {
      logger.info('GoogleDriveSyncService', '🔄 Inicializando servicio de sincronización...')
      
      // ✅ MEJORA: Inicializar servicio de Google Drive con manejo de errores
      try {
        await googleDriveConsolidatedService.initialize(this.currentUserId || 'system')
        logger.info('GoogleDriveSyncService', '✅ googleDriveConsolidatedService inicializado')
      } catch (initError) {
        logger.warn('GoogleDriveSyncService', `⚠️ Error inicializando googleDriveConsolidatedService: ${initError.message}`)
        // Continuar aunque falle la inicialización del servicio consolidado
      }
      
      // ✅ MEJORA: Verificar autenticación con múltiples métodos
      let isAuthenticated = false
      try {
        isAuthenticated = googleDriveAuthService.isAuthenticated()
        logger.info('GoogleDriveSyncService', `🔐 googleDriveAuthService.isAuthenticated(): ${isAuthenticated}`)
      } catch (authError) {
        logger.warn('GoogleDriveSyncService', `⚠️ Error verificando autenticación: ${authError.message}`)
      }
      
      // ✅ MEJORA: Intentar verificación alternativa si el método principal falla
      if (!isAuthenticated) {
        try {
          const hasToken = googleDriveAuthService.getAccessToken && googleDriveAuthService.getAccessToken()
          isAuthenticated = !!hasToken
          logger.info('GoogleDriveSyncService', `🔐 Verificación alternativa (token): ${isAuthenticated}`)
        } catch (tokenError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error en verificación alternativa: ${tokenError.message}`)
        }
      }
      
      // ✅ MEJORA: Si no está autenticado, intentar inicializar con credenciales dinámicas
      if (!isAuthenticated) {
        try {
          logger.info('GoogleDriveSyncService', '🔄 Intentando inicialización con credenciales dinámicas...')
          const googleDriveAuthServiceDynamic = await import('../lib/googleDriveAuthServiceDynamic.js')
          const dynamicService = googleDriveAuthServiceDynamic.default
          
          // Intentar inicializar el servicio dinámico
          const dynamicInitialized = await dynamicService.initialize()
          if (dynamicInitialized) {
            const dynamicAuth = dynamicService.isAuthenticated()
            logger.info('GoogleDriveSyncService', `🔐 Servicio dinámico autenticado: ${dynamicAuth}`)
            
            if (dynamicAuth) {
              isAuthenticated = true
              logger.info('GoogleDriveSyncService', '✅ Usando servicio dinámico como fallback')
            }
          }
        } catch (dynamicError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error con servicio dinámico: ${dynamicError.message}`)
        }
      }
      
      // ✅ MEJORA: Si aún no está autenticado, permitir inicialización parcial para pruebas
      if (!isAuthenticated) {
        logger.warn('GoogleDriveSyncService', '⚠️ Google Drive no está completamente autenticado, pero permitiendo inicialización limitada')
        logger.warn('GoogleDriveSyncService', 'ℹ️ Algunas funciones pueden no estar disponibles hasta la autenticación completa')
        
        // No lanzar error, solo advertir
        this.isInitialized = true
        logger.info('GoogleDriveSyncService', '✅ Servicio de sincronización inicializado (modo limitado)')
        return true
      }
      
      this.isInitialized = true
      logger.info('GoogleDriveSyncService', '✅ Servicio de sincronización completamente inicializado')
      return true
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error inicializando: ${error.message}`)
      this.recordError(error.message)
      
      // ✅ MEJORA: No retornar false inmediatamente, intentar inicialización parcial
      try {
        this.isInitialized = true
        logger.warn('GoogleDriveSyncService', '⚠️ Servicio inicializado con funcionalidad limitada debido a errores')
        return true
      } catch (fallbackError) {
        logger.error('GoogleDriveSyncService', `❌ Error incluso en inicialización de fallback: ${fallbackError.message}`)
        return false
      }
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Inicializa webhooks automáticamente para todas las carpetas
   */
  async initializeWebhooks() {
    try {
      logger.info('GoogleDriveSyncService', '🔗 Inicializando webhooks automáticamente...')
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = '❌ No se pueden inicializar webhooks: Google Drive no está autenticado'
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      if (this.webhookInitialized) {
        logger.info('GoogleDriveSyncService', 'ℹ️ Webhooks ya inicializados')
        return true
      }

      // Inicializar webhooks para todas las carpetas existentes
      const result = await this.initializeAllEmployeeWebhooks()
      
      this.webhookInitialized = true
      logger.info('GoogleDriveSyncService', '✅ Webhooks inicializados automáticamente')
      
      return result
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error inicializando webhooks: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Configura webhook para una carpeta específica
   */
  async setupWebhookForFolder(folderId, userId) {
    try {
      logger.info('GoogleDriveSyncService', `🔗 Configurando webhook para carpeta ${folderId}`)
      
      const accessToken = googleDriveAuthService.getAccessToken()
      if (!accessToken) {
        throw new Error('No se pudo obtener token de acceso')
      }

      const result = await DriveWatchService.createWatchChannel(userId, folderId, accessToken)
      
      if (result.success) {
        logger.info('GoogleDriveSyncService', `✅ Webhook configurado para carpeta ${folderId}`)
      } else {
        logger.warn('GoogleDriveSyncService', `⚠️ Error configurando webhook para ${folderId}: ${result.error}`)
      }
      
      return result
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error configurando webhook para ${folderId}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Inicializa webhooks para todas las carpetas de empleados existentes
   */
  async initializeAllEmployeeWebhooks() {
    try {
      logger.info('GoogleDriveSyncService', '🔗 Inicializando webhooks para todas las carpetas de empleados...')
      
      // Obtener todas las carpetas activas
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('folder_status', 'active')
        .not('drive_folder_id', 'is', null)

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo carpetas: ${error.message}`)
        throw error
      }

      if (!folders || folders.length === 0) {
        logger.info('GoogleDriveSyncService', 'ℹ️ No hay carpetas de empleados para configurar webhooks')
        return { success: true, configured: 0, errors: 0 }
      }

      logger.info('GoogleDriveSyncService', `📊 Encontradas ${folders.length} carpetas para configurar webhooks`)

      let configured = 0
      let errors = 0
      const results = []

      // Configurar webhook para cada carpeta
      for (const folder of folders) {
        try {
          const result = await this.setupWebhookForFolder(folder.drive_folder_id, folder.user_id || 'system')
          
          if (result.success) {
            configured++
            results.push({
              folderId: folder.drive_folder_id,
              employeeEmail: folder.employee_email,
              success: true
            })
          } else {
            errors++
            results.push({
              folderId: folder.drive_folder_id,
              employeeEmail: folder.employee_email,
              success: false,
              error: result.error
            })
          }
        } catch (folderError) {
          errors++
          results.push({
            folderId: folder.drive_folder_id,
            employeeEmail: folder.employee_email,
            success: false,
            error: folderError.message
          })
          logger.error('GoogleDriveSyncService', `❌ Error configurando webhook para ${folder.employee_email}: ${folderError.message}`)
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Webhooks configurados: ${configured} exitosos, ${errors} errores`)
      
      return {
        success: true,
        configured,
        errors,
        total: folders.length,
        results
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error inicializando webhooks de empleados: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Obtiene el estado de los webhooks
   */
  getWebhookStatus() {
    return {
      initialized: this.webhookInitialized,
      authenticated: googleDriveAuthService.isAuthenticated(),
      watchChannels: this.watchChannels || [],
      lastInitialization: this.lastWebhookInitialization || null
    }
  }

  /**
   * Verifica si Google Drive está autenticado
   * Basado en Google Drive API: https://developers.google.com/drive/api/guides/about-auth
   */
  isAuthenticated() {
    try {
      const isAuth = googleDriveAuthService.isAuthenticated()
      logger.info('GoogleDriveSyncService', `🔐 Estado de autenticación: ${isAuth ? '✅ Autenticado' : '❌ No autenticado'}`)
      return isAuth
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error verificando autenticación: ${error.message}`)
      return false
    }
  }

  /**
   * Registra un error de sincronización
   */
  recordError(error) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      error: error
    }
    this.syncErrors.push(errorRecord)
    
    // Mantener solo los últimos 100 errores
    if (this.syncErrors.length > 100) {
      this.syncErrors = this.syncErrors.slice(-100)
    }
    
    logger.error('GoogleDriveSyncService', `📊 Error registrado: ${error}`)
  }

  /**
   * Obtiene los errores de sincronización
   */
  getSyncErrors() {
    return this.syncErrors
  }

  /**
   * Limpia los errores de sincronización
   */
  clearSyncErrors() {
    this.syncErrors = []
    logger.info('GoogleDriveSyncService', '🧹 Errores limpiados')
  }

  /**
   * NUEVA FUNCIONALIDAD: Obtiene la configuración específica de una empresa
   */
  async getCompanyConfig(companyId) {
    try {
      // Verificar cache primero
      if (this.companyConfigs.has(companyId)) {
        return this.companyConfigs.get(companyId)
      }

      // Si no está en cache, cargar desde configurationService
      const configurationService = (await import('../services/configurationService.js')).default
      const config = await configurationService.getConfig(
        'sync',
        'google_drive',
        'company',
        companyId,
        null
      )

      // Guardar en cache
      this.companyConfigs.set(companyId, config)
      
      logger.info('GoogleDriveSyncService', `📋 Configuración cargada para empresa ${companyId}`)
      return config
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error obteniendo configuración de empresa ${companyId}: ${error.message}`)
      return null
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Guarda la configuración específica de una empresa
   */
  async setCompanyConfig(companyId, config) {
    try {
      const configurationService = (await import('../services/configurationService.js')).default
      
      await configurationService.setConfig(
        'sync',
        'google_drive',
        config,
        'company',
        companyId,
        `Configuración de sincronización para empresa ${companyId}`
      )

      // Actualizar cache
      this.companyConfigs.set(companyId, config)
      
      logger.info('GoogleDriveSyncService', `💾 Configuración guardada para empresa ${companyId}`)
      return true
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error guardando configuración de empresa ${companyId}: ${error.message}`)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Crea carpeta de empleado usando configuración específica de empresa
   */
  async createEmployeeFolderForCompany(employeeEmail, employeeName, companyName, employeeData = {}, companyId = null) {
    try {
      // Si se proporciona companyId, usar configuración específica
      let companyConfig = null
      if (companyId) {
        companyConfig = await this.getCompanyConfig(companyId)
        if (companyConfig && companyConfig.googleDrive) {
          logger.info('GoogleDriveSyncService', `📋 Usando configuración específica para empresa ${companyId}`)
          
          // Usar nombre de carpeta personalizado de la empresa
          if (companyConfig.googleDrive.companyFolderName) {
            companyName = companyConfig.googleDrive.companyFolderName
          }
          
          // Usar dominios Gmail específicos de la empresa
          if (companyConfig.googleDrive.allowedGmailDomains) {
            this.customGmailDomains = companyConfig.googleDrive.allowedGmailDomains
          }
        }
      }

      // Llamar al método original con la configuración actualizada
      return await this.createEmployeeFolderInDrive(employeeEmail, employeeName, companyName, employeeData)
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error creando carpeta para empresa ${companyId}: ${error.message}`)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Verifica si un email es Gmail usando dominios personalizados
   */
  isGmailEmail(email) {
    if (!email || typeof email !== 'string') {
      return false
    }
    
    // Verificar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return false
    }
    
    // Extraer el dominio
    const domain = email.split('@')[1]?.toLowerCase()
    
    // Usar dominios personalizados si están disponibles, sino usar los por defecto
    const gmailDomains = this.customGmailDomains || [
      'gmail.com',
      'googlemail.com', // Gmail para algunos países
      'gmail.cl', // Gmail Chile
      'gmail.es', // Gmail España
      'gmail.mx'  // Gmail México
    ]
    
    const isGmail = gmailDomains.includes(domain)
    
    logger.info('GoogleDriveSyncService', `📧 Email ${email}: ${isGmail ? '✅ Gmail' : '❌ No Gmail'} (dominio: ${domain})`)
    return isGmail
  }

  /**
   * NUEVA FUNCIONALIDAD: Inicializa webhooks para una empresa específica
   */
  async initializeCompanyWebhooks(companyId) {
    try {
      logger.info('GoogleDriveSyncService', `🔗 Inicializando webhooks para empresa ${companyId}...`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = '❌ No se pueden inicializar webhooks: Google Drive no está autenticado'
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Obtener carpetas de la empresa específica
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('company_id', companyId)
        .eq('folder_status', 'active')
        .not('drive_folder_id', 'is', null)

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo carpetas de empresa ${companyId}: ${error.message}`)
        throw error
      }

      if (!folders || folders.length === 0) {
        logger.info('GoogleDriveSyncService', `ℹ️ No hay carpetas de empleados para empresa ${companyId}`)
        return { success: true, configured: 0, errors: 0 }
      }

      logger.info('GoogleDriveSyncService', `📊 Encontradas ${folders.length} carpetas para empresa ${companyId}`)

      let configured = 0
      let errors = 0
      const results = []

      // Configurar webhook para cada carpeta
      for (const folder of folders) {
        try {
          const result = await this.setupWebhookForFolder(folder.drive_folder_id, folder.user_id || 'system')
          
          if (result.success) {
            configured++
            results.push({
              folderId: folder.drive_folder_id,
              employeeEmail: folder.employee_email,
              success: true
            })
          } else {
            errors++
            results.push({
              folderId: folder.drive_folder_id,
              employeeEmail: folder.employee_email,
              success: false,
              error: result.error
            })
          }
        } catch (folderError) {
          errors++
          results.push({
            folderId: folder.drive_folder_id,
            employeeEmail: folder.employee_email,
            success: false,
            error: folderError.message
          })
          logger.error('GoogleDriveSyncService', `❌ Error configurando webhook para ${folder.employee_email}: ${folderError.message}`)
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Webhooks para empresa ${companyId}: ${configured} exitosos, ${errors} errores`)
      
      return {
        success: true,
        configured,
        errors,
        total: folders.length,
        results
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error inicializando webhooks de empresa ${companyId}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Registra empleado con email no-Gmail en Supabase
   */
  async registerNonGmailEmployee(employeeEmail, employeeName, companyName, employeeData = {}) {
    try {
      logger.info('GoogleDriveSyncService', `📝 Registrando empleado no-Gmail: ${employeeEmail}`)
      
      const nonGmailData = {
        employee_email: employeeEmail,
        employee_name: employeeName,
        company_name: companyName,
        email_type: 'non_gmail',
        reason: 'Email no es de Gmail, no se puede compartir carpeta de Google Drive',
        employee_data: employeeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('non_gmail_employees')
        .insert(nonGmailData)
        .select()
        .single()

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error registrando empleado no-Gmail: ${error.message}`)
        throw error
      }

      logger.info('GoogleDriveSyncService', `✅ Empleado no-Gmail registrado: ${employeeEmail}`)
      return data
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en registerNonGmailEmployee: ${error.message}`)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Obtiene lista de empleados no-Gmail
   */
  async getNonGmailEmployees() {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Obteniendo lista de empleados no-Gmail`)
      
      const { data, error } = await supabase
        .from('non_gmail_employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo empleados no-Gmail: ${error.message}`)
        throw error
      }

      logger.info('GoogleDriveSyncService', `📊 ${data?.length || 0} empleados no-Gmail encontrados`)
      return data || []
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en getNonGmailEmployees: ${error.message}`)
      throw error
    }
  }

  /**
   * Crea una carpeta de empleado en Google Drive y Supabase
   * AHORA CON DETECCIÓN DE EMAILS NO-GMAIL Y SISTEMA DE LOCKS ANTI-DUPLICACIÓN
   */
  async createEmployeeFolderInDrive(employeeEmail, employeeName, companyName, employeeData = {}) {
    try {
      logger.info('GoogleDriveSyncService', `📁 Procesando carpeta para ${employeeEmail}...`)
      
      // NUEVA FUNCIONALIDAD: Verificar si es email Gmail
      const isGmail = this.isGmailEmail(employeeEmail)
      
      if (!isGmail) {
        logger.warn('GoogleDriveSyncService', `⚠️ Email ${employeeEmail} no es de Gmail, registrando en base de datos`)
        
        // Registrar empleado no-Gmail
        await this.registerNonGmailEmployee(employeeEmail, employeeName, companyName, employeeData)
        
        // Crear carpeta solo para organización interna (sin compartir)
        return await this.createNonGmailEmployeeFolder(employeeEmail, employeeName, companyName, employeeData)
      }

      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede crear carpeta para ${employeeEmail}: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // SISTEMA ANTI-DUPLICACIÓN: Usar distributed locks para prevenir race conditions
      logger.info('GoogleDriveSyncService', `🔒 Adquiriendo lock para ${employeeEmail}...`)
      
      const result = await distributedLockService.withLock(employeeEmail, async () => {
        logger.info('GoogleDriveSyncService', `🔓 Lock adquirido, procesando creación de carpeta para ${employeeEmail}`)
        
        // PRIMERO: Verificar si ya existe en Supabase
        logger.info('GoogleDriveSyncService', `🔍 Verificando si la carpeta ya existe en Supabase...`)
        const { data: existingFolder, error: supabaseCheckError } = await supabase
          .from('employee_folders')
          .select('*')
          .eq('employee_email', employeeEmail)
          .maybeSingle()

        if (supabaseCheckError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error verificando carpeta en Supabase: ${supabaseCheckError.message}`)
        }

        if (existingFolder) {
          logger.info('GoogleDriveSyncService', `✅ Carpeta ya existe en Supabase: ${existingFolder.id}`)
          
          // Verificar si la carpeta de Drive todavía existe
          if (existingFolder.drive_folder_id) {
            try {
              const driveFolder = await googleDriveConsolidatedService.getFileInfo(existingFolder.drive_folder_id)
              if (driveFolder) {
                logger.info('GoogleDriveSyncService', `✅ Carpeta ya existe en Google Drive: ${existingFolder.drive_folder_id}`)
                
                // NUEVA FUNCIONALIDAD: Verificar y compartir si es necesario
                await this.ensureEmployeeHasAccess(employeeEmail, existingFolder.drive_folder_id)
                
                return {
                  driveFolder: driveFolder,
                  supabaseFolder: existingFolder,
                  syncStatus: 'already_exists',
                  isGmail: true
                }
              } else {
                logger.warn('GoogleDriveSyncService', `⚠️ Carpeta existe en Supabase pero no en Drive, recreando...`)
              }
            } catch (driveError) {
              logger.warn('GoogleDriveSyncService', `⚠️ Error verificando carpeta en Drive: ${driveError.message}`)
            }
          }
        }

        // NUEVA ESTRUCTURA: Crear estructura de carpetas para la empresa
        logger.info('GoogleDriveSyncService', `🔍 Creando estructura de carpetas para ${companyName}`)
        const folderStructure = await this.createCompanyFolderStructure(companyName)
        
        // Seleccionar la carpeta padre según el tipo de email
        const parentFolder = isGmail ? folderStructure.gmailFolder : folderStructure.nonGmailFolder
        logger.info('GoogleDriveSyncService', `📁 Usando carpeta padre: ${parentFolder.name} (${parentFolder.id})`)

        // SEGUNDO: Verificar si la carpeta ya existe en Google Drive (antes de crear)
        const folderName = `${employeeName} (${employeeEmail})`
        logger.info('GoogleDriveSyncService', `🔍 Verificando si la carpeta ya existe en Google Drive...`)
        
        try {
          const existingFiles = await googleDriveConsolidatedService.listFiles(parentFolder.id)
          const existingDriveFolder = existingFiles.find(file =>
            file.name === folderName &&
            file.mimeType === 'application/vnd.google-apps.folder'
          )

          if (existingDriveFolder) {
            logger.info('GoogleDriveSyncService', `✅ Carpeta ya existe en Google Drive: ${existingDriveFolder.id}`)
            
            // Si existe en Drive pero no en Supabase, crear el registro
            if (!existingFolder) {
              logger.info('GoogleDriveSyncService', `📝 Creando registro en Supabase para carpeta existente en Drive...`)
              const newSupabaseFolder = await this.createSupabaseFolderRecord(
                employeeEmail, employeeName, companyName, employeeData, existingDriveFolder.id
              )
              
              // NUEVA FUNCIONALIDAD: Compartir automáticamente
              await this.shareEmployeeFolderWithUser(employeeEmail, existingDriveFolder.id, 'writer')
              
              return {
                driveFolder: existingDriveFolder,
                supabaseFolder: newSupabaseFolder,
                syncStatus: 'existed_in_drive_created_in_supabase',
                isGmail: true
              }
            } else {
              // Actualizar el registro de Supabase con el ID correcto de Drive si es diferente
              if (existingFolder.drive_folder_id !== existingDriveFolder.id) {
                logger.info('GoogleDriveSyncService', `🔄 Actualizando ID de Drive en Supabase...`)
                const { data: updatedFolder } = await supabase
                  .from('employee_folders')
                  .update({
                    drive_folder_id: existingDriveFolder.id,
                    drive_folder_url: `https://drive.google.com/drive/folders/${existingDriveFolder.id}`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingFolder.id)
                  .select()
                  .single()

                // NUEVA FUNCIONALIDAD: Compartir automáticamente
                await this.shareEmployeeFolderWithUser(employeeEmail, existingDriveFolder.id, 'writer')
                
                return {
                  driveFolder: existingDriveFolder,
                  supabaseFolder: updatedFolder,
                  syncStatus: 'updated_drive_id',
                  isGmail: true
                }
              }

              // NUEVA FUNCIONALIDAD: Verificar y compartir si es necesario
              await this.ensureEmployeeHasAccess(employeeEmail, existingDriveFolder.id)
              
              return {
                driveFolder: existingDriveFolder,
                supabaseFolder: existingFolder,
                syncStatus: 'already_exists',
                isGmail: true
              }
            }
          }
        } catch (driveCheckError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error verificando carpeta existente en Drive: ${driveCheckError.message}`)
        }

        // TERCERO: Si no existe en ningún lugar, crear nueva carpeta
        logger.info('GoogleDriveSyncService', `📁 Creando nueva carpeta del empleado: ${folderName}`)
        const employeeFolder = await googleDriveConsolidatedService.createFolder(folderName, parentFolder.id)

        if (!employeeFolder || !employeeFolder.id) {
          throw new Error('No se pudo crear carpeta en Google Drive')
        }

        logger.info('GoogleDriveSyncService', `✅ Nueva carpeta creada en Google Drive: ${employeeFolder.id}`)

        // NUEVA FUNCIONALIDAD: Compartir automáticamente con el empleado
        logger.info('GoogleDriveSyncService', `🔗 Compartiendo carpeta automáticamente con ${employeeEmail}`)
        await this.shareEmployeeFolderWithUser(employeeEmail, employeeFolder.id, 'writer')

        // Crear registro en Supabase
        const supabaseFolder = await this.createSupabaseFolderRecord(
          employeeEmail, employeeName, companyName, employeeData, employeeFolder.id
        )

        // NUEVA FUNCIONALIDAD: Configurar webhook automáticamente
        try {
          await this.setupWebhookForFolder(employeeFolder.id, employeeData.user_id || 'system')
        } catch (webhookError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error configurando webhook para ${employeeEmail}: ${webhookError.message}`)
          // No fallar la creación de carpeta por error de webhook
        }

        return {
          driveFolder: employeeFolder,
          supabaseFolder: supabaseFolder,
          syncStatus: 'created_in_both',
          isGmail: true
        }
      }, 'create_folder')

      logger.info('GoogleDriveSyncService', `🔓 Lock liberado para ${employeeEmail}`)
      return result
      
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error procesando carpeta para ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Crea carpeta para empleado no-Gmail (solo organización interna)
   */
  async createNonGmailEmployeeFolder(employeeEmail, employeeName, companyName, employeeData = {}) {
    try {
      logger.info('GoogleDriveSyncService', `📁 Creando carpeta para empleado no-Gmail: ${employeeEmail}`)
      
      // NUEVA ESTRUCTURA: Crear estructura de carpetas para la empresa
      logger.info('GoogleDriveSyncService', `🔍 Creando estructura de carpetas para ${companyName}`)
      const folderStructure = await this.createCompanyFolderStructure(companyName)
      
      // Usar la carpeta "No Gmail" como carpeta padre
      const parentFolder = folderStructure.nonGmailFolder
      logger.info('GoogleDriveSyncService', `📁 Usando carpeta padre: ${parentFolder.name} (${parentFolder.id})`)

      // Crear carpeta del empleado
      const folderName = `${employeeName} (${employeeEmail})`
      const employeeFolder = await googleDriveConsolidatedService.createFolder(folderName, parentFolder.id)

      if (!employeeFolder || !employeeFolder.id) {
        throw new Error('No se pudo crear carpeta en Google Drive')
      }

      logger.info('GoogleDriveSyncService', `✅ Carpeta creada para empleado no-Gmail: ${employeeFolder.id}`)
      logger.info('GoogleDriveSyncService', `ℹ️ Nota: Esta carpeta NO se comparte con el empleado (email no-Gmail)`)

      // Crear registro en Supabase
      const supabaseFolder = await this.createSupabaseFolderRecord(
        employeeEmail, employeeName, companyName, employeeData, employeeFolder.id
      )

      return {
        driveFolder: employeeFolder,
        supabaseFolder: supabaseFolder,
        syncStatus: 'created_non_gmail',
        isGmail: false,
        message: 'Carpeta creada para organización interna (empleado no tiene Gmail)'
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error creando carpeta para empleado no-Gmail: ${error.message}`)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Verifica que el empleado tenga acceso a su carpeta
   */
  async ensureEmployeeHasAccess(employeeEmail, folderId) {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Verificando acceso de ${employeeEmail} a carpeta ${folderId}`)
      
      const permissions = await this.getFolderPermissions(folderId)
      const employeePermission = permissions.find(p => p.emailAddress === employeeEmail)
      
      if (!employeePermission) {
        logger.info('GoogleDriveSyncService', `🔗 ${employeeEmail} no tiene acceso, compartiendo carpeta...`)
        await this.shareEmployeeFolderWithUser(employeeEmail, folderId, 'writer')
      } else {
        logger.info('GoogleDriveSyncService', `✅ ${employeeEmail} ya tiene acceso (${employeePermission.role})`)
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error verificando acceso de ${employeeEmail}: ${error.message}`)
      // No lanzar error, solo loggear
    }
  }

  /**
   * Crea un registro de carpeta en Supabase
   * Método auxiliar para evitar duplicación de código
   */
  async createSupabaseFolderRecord(employeeEmail, employeeName, companyName, employeeData, driveFolderId) {
    try {
      logger.info('GoogleDriveSyncService', `💾 Creando/actualizando registro en Supabase para ${employeeEmail}...`)
      
      // PRIMERO: Verificar si ya existe un registro
      const { data: existingRecord, error: fetchError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.warn('GoogleDriveSyncService', `⚠️ Error verificando registro existente: ${fetchError.message}`)
      }

      // Obtener información de la empresa
      let companyId = null
      if (employeeData.company_id) {
        companyId = employeeData.company_id
      }

      const folderData = {
        employee_email: employeeEmail,
        employee_id: employeeData.id,
        employee_name: employeeName,
        employee_position: employeeData.position,
        employee_department: employeeData.department,
        employee_phone: employeeData.phone,
        employee_region: employeeData.region,
        employee_level: employeeData.level,
        employee_work_mode: employeeData.work_mode,
        employee_contract_type: employeeData.contract_type,
        company_id: companyId,
        company_name: companyName,
        drive_folder_id: driveFolderId,
        drive_folder_url: `https://drive.google.com/drive/folders/${driveFolderId}`,
        folder_status: 'active',
        settings: {
          notificationPreferences: {
            whatsapp: true,
            telegram: true,
            email: true
          },
          responseLanguage: 'es',
          timezone: 'America/Santiago'
        },
        updated_at: new Date().toISOString()
      }

      let supabaseFolder
      let supabaseError

      if (existingRecord) {
        // ACTUALIZAR registro existente (no usar upsert para evitar duplicados)
        logger.info('GoogleDriveSyncService', `🔄 Actualizando registro existente: ${existingRecord.id}`)
        const { data, error } = await supabase
          .from('employee_folders')
          .update(folderData)
          .eq('id', existingRecord.id)
          .select()
          .single()

        supabaseFolder = data
        supabaseError = error
      } else {
        // CREAR nuevo registro
        logger.info('GoogleDriveSyncService', `🆕 Creando nuevo registro para ${employeeEmail}`)
        folderData.created_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('employee_folders')
          .insert(folderData)
          .select()
          .single()

        supabaseFolder = data
        supabaseError = error
      }

      if (supabaseError) {
        logger.warn('GoogleDriveSyncService', `⚠️ Error en operación de Supabase: ${supabaseError.message}`)
        throw supabaseError
      }

      logger.info('GoogleDriveSyncService', `✅ Registro ${existingRecord ? 'actualizado' : 'creado'} en Supabase: ${supabaseFolder.id}`)
      return supabaseFolder
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error creando/actualizando registro en Supabase: ${error.message}`)
      throw error
    }
  }

  /**
   * Busca o crea la carpeta principal de la empresa
   */
  async findOrCreateParentFolder(folderName) {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Buscando carpeta: ${folderName}`)
      
      const folders = await googleDriveConsolidatedService.listFiles()
      const parentFolder = folders.find(folder =>
        folder.name === folderName &&
        folder.mimeType === 'application/vnd.google-apps.folder'
      )

      if (parentFolder) {
        logger.info('GoogleDriveSyncService', `✅ Carpeta encontrada: ${parentFolder.id}`)
        return parentFolder
      }

      logger.info('GoogleDriveSyncService', `📁 Creando nueva carpeta: ${folderName}`)
      return await googleDriveConsolidatedService.createFolder(folderName)
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error buscando/creando carpeta ${folderName}: ${error.message}`)
      this.recordError(error.message)
      throw error;
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Crea la estructura de carpetas para una empresa
   * Estructura: [Empresa] > [Gmail] y [No Gmail]
   */
  async createCompanyFolderStructure(companyName) {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Creando estructura de carpetas para ${companyName}`)
      
      // 1. Crear o encontrar la carpeta principal de la empresa
      const companyFolderName = `${companyName}`
      const companyFolder = await this.findOrCreateParentFolder(companyFolderName)
      
      // 2. Crear o encontrar la subcarpeta de Gmail
      const gmailFolderName = 'Gmail'
      const gmailFolder = await this.findOrCreateSubFolder(companyFolder.id, gmailFolderName)
      
      // 3. Crear o encontrar la subcarpeta de No Gmail
      const nonGmailFolderName = 'No Gmail'
      const nonGmailFolder = await this.findOrCreateSubFolder(companyFolder.id, nonGmailFolderName)
      
      logger.info('GoogleDriveSyncService', `✅ Estructura de carpetas creada para ${companyName}`)
      
      return {
        companyFolder,
        gmailFolder,
        nonGmailFolder
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error creando estructura de carpetas para ${companyName}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * NUEVA FUNCIONALIDAD: Busca o crea una subcarpeta dentro de una carpeta padre
   */
  async findOrCreateSubFolder(parentFolderId, subFolderName) {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Buscando subcarpeta: ${subFolderName}`)
      
      const subFolders = await googleDriveConsolidatedService.listFiles(parentFolderId)
      const subFolder = subFolders.find(folder =>
        folder.name === subFolderName &&
        folder.mimeType === 'application/vnd.google-apps.folder'
      )

      if (subFolder) {
        logger.info('GoogleDriveSyncService', `✅ Subcarpeta encontrada: ${subFolder.id}`)
        return subFolder
      }

      logger.info('GoogleDriveSyncService', `📁 Creando nueva subcarpeta: ${subFolderName}`)
      return await googleDriveConsolidatedService.createFolder(subFolderName, parentFolderId)
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error buscando/creando subcarpeta ${subFolderName}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Sincroniza archivos de Google Drive a Supabase
   */
  async syncFilesFromDrive(folderId, employeeEmail) {
    try {
      logger.info('GoogleDriveSyncService', `🔄 Sincronizando archivos de Drive para ${employeeEmail}...`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede sincronizar archivos para ${employeeEmail}: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Obtener archivos de la carpeta en Google Drive
      logger.info('GoogleDriveSyncService', `📂 Listando archivos de ${folderId}...`)
      const files = await googleDriveConsolidatedService.listFiles(folderId)

      if (!files || files.length === 0) {
        logger.info('GoogleDriveSyncService', `ℹ️ No hay archivos para sincronizar en ${employeeEmail}`)
        return { synced: 0, errors: 0 }
      }

      logger.info('GoogleDriveSyncService', `📊 ${files.length} archivos encontrados`)

      let synced = 0
      let errors = 0

      // Sincronizar cada archivo
      for (const file of files) {
        try {
          logger.info('GoogleDriveSyncService', `📄 Procesando archivo: ${file.name}`)
          
          // Verificar si el archivo ya existe en Supabase
          const { data: existing } = await supabase
            .from('employee_documents')
            .select('id')
            .eq('google_file_id', file.id)
            .maybeSingle()

          if (!existing) {
            // Obtener carpeta del empleado
            const { data: folder } = await supabase
              .from('employee_folders')
              .select('id')
              .eq('employee_email', employeeEmail)
              .maybeSingle()

            if (folder) {
              // Insertar documento en Supabase
              const { error } = await supabase
                .from('employee_documents')
                .insert({
                  folder_id: folder.id,
                  document_name: file.name,
                  document_type: file.mimeType,
                  file_size: file.size || 0,
                  google_file_id: file.id,
                  file_url: `https://drive.google.com/file/d/${file.id}/view`,
                  status: 'active'
                })

              if (error) {
                logger.warn('GoogleDriveSyncService', `⚠️ Error sincronizando ${file.name}: ${error.message}`)
                errors++
              } else {
                synced++
                logger.info('GoogleDriveSyncService', `✅ Archivo sincronizado: ${file.name}`)
              }
            }
          } else {
            logger.info('GoogleDriveSyncService', `ℹ️ Archivo ya existe: ${file.name}`)
          }
        } catch (error) {
          logger.error('GoogleDriveSyncService', `❌ Error procesando archivo ${file.name}: ${error.message}`)
          this.recordError(error.message)
          errors++
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Sincronización completada: ${synced} sincronizados, ${errors} errores`)
      return { synced, errors }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error sincronizando archivos para ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Sincroniza archivos de Supabase a Google Drive
   */
  async syncFilesToDrive(employeeEmail, folderId) {
    try {
      logger.info('GoogleDriveSyncService', `🔄 Sincronizando archivos de Supabase a Drive para ${employeeEmail}...`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede sincronizar archivos para ${employeeEmail}: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Obtener documentos de Supabase que no están en Google Drive
      const { data: documents, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('folder_id', folderId)
        .is('google_file_id', null)

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo documentos de Supabase: ${error.message}`)
        this.recordError(error.message)
        throw error
      }

      if (!documents || documents.length === 0) {
        logger.info('GoogleDriveSyncService', `ℹ️ No hay documentos para sincronizar en Supabase para ${employeeEmail}`)
        return { synced: 0, errors: 0 }
      }

      logger.info('GoogleDriveSyncService', `📊 ${documents.length} documentos encontrados en Supabase`)

      let synced = 0
      let errors = 0

      // Sincronizar cada documento
      for (const document of documents) {
        try {
          logger.info('GoogleDriveSyncService', `📄 Procesando documento: ${document.document_name}`)
          
          // Crear archivo en Google Drive
          const driveFile = await googleDriveConsolidatedService.createFile(
            document.document_name,
            document.document_type,
            folderId,
            document.file_url
          )

          if (driveFile && driveFile.id) {
            // Actualizar documento en Supabase con el ID del archivo de Google Drive
            const { error: updateError } = await supabase
              .from('employee_documents')
              .update({ google_file_id: driveFile.id })
              .eq('id', document.id)

            if (updateError) {
              logger.warn('GoogleDriveSyncService', `⚠️ Error actualizando documento ${document.document_name}: ${updateError.message}`)
              errors++
            } else {
              synced++
              logger.info('GoogleDriveSyncService', `✅ Documento sincronizado: ${document.document_name}`)
            }
          } else {
            logger.warn('GoogleDriveSyncService', `⚠️ No se pudo crear archivo en Google Drive: ${document.document_name}`)
            errors++
          }
        } catch (error) {
          logger.error('GoogleDriveSyncService', `❌ Error procesando documento ${document.document_name}: ${error.message}`)
          this.recordError(error.message)
          errors++
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Sincronización completada: ${synced} sincronizados, ${errors} errores`)
      return { synced, errors }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error sincronizando documentos para ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Sincroniza carpetas primero con Supabase y luego desde Supabase a Google Drive
   */
  async syncDriveFromSupabase(employeeEmail, folderId) {
    try {
      logger.info('GoogleDriveSyncService', `🔄 Iniciando sincronización completa para ${employeeEmail}...`)
      
      // Paso 1: Sincronizar desde Google Drive a Supabase
      logger.info('GoogleDriveSyncService', `📥 Paso 1: Sincronizando desde Google Drive a Supabase...`)
      const driveToSupabaseResult = await this.syncFilesFromDrive(folderId, employeeEmail)
      
      // Paso 2: Sincronizar desde Supabase a Google Drive
      logger.info('GoogleDriveSyncService', `📤 Paso 2: Sincronizando desde Supabase a Google Drive...`)
      const supabaseToDriveResult = await this.syncFilesToDrive(employeeEmail, folderId)
      
      // Resultado combinado
      const totalSynced = driveToSupabaseResult.synced + supabaseToDriveResult.synced
      const totalErrors = driveToSupabaseResult.errors + supabaseToDriveResult.errors
      
      logger.info('GoogleDriveSyncService', `✅ Sincronización completa finalizada: ${totalSynced} sincronizados, ${totalErrors} errores`)
      
      return {
        driveToSupabase: driveToSupabaseResult,
        supabaseToDrive: supabaseToDriveResult,
        totalSynced,
        totalErrors
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en sincronización completa para ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Inicia sincronización periódica
   */
  startPeriodicSync(employeeEmail, folderId, intervalMinutes = 5) {
    try {
      logger.info('GoogleDriveSyncService', `⏰ Iniciando sincronización periódica para ${employeeEmail} (cada ${intervalMinutes} minutos)`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede iniciar sincronización periódica para ${employeeEmail}: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Evitar sincronizaciones duplicadas
      if (this.syncIntervals.has(employeeEmail)) {
        logger.info('GoogleDriveSyncService', `ℹ️ Sincronización ya activa para ${employeeEmail}`)
        return
      }

      const interval = setInterval(async () => {
        try {
          logger.info('GoogleDriveSyncService', `🔄 Ejecutando sincronización periódica para ${employeeEmail}`)
          await this.syncFilesFromDrive(folderId, employeeEmail)
        } catch (error) {
          logger.error('GoogleDriveSyncService', `❌ Error en sincronización periódica de ${employeeEmail}: ${error.message}`)
          this.recordError(error.message)
        }
      }, intervalMinutes * 60 * 1000)

      this.syncIntervals.set(employeeEmail, interval)
      logger.info('GoogleDriveSyncService', `✅ Sincronización periódica iniciada para ${employeeEmail}`)
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error iniciando sincronización periódica: ${error.message}`)
      this.recordError(error.message)
    }
  }

  /**
   * Detiene sincronización periódica
   */
  stopPeriodicSync(employeeEmail) {
    try {
      logger.info('GoogleDriveSyncService', `⏹️ Deteniendo sincronización periódica para ${employeeEmail}`)
      
      const interval = this.syncIntervals.get(employeeEmail)
      if (interval) {
        clearInterval(interval)
        this.syncIntervals.delete(employeeEmail)
        logger.info('GoogleDriveSyncService', `✅ Sincronización periódica detenida para ${employeeEmail}`)
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error deteniendo sincronización: ${error.message}`)
      this.recordError(error.message)
    }
  }

  /**
   * Sincroniza un archivo subido por el usuario
   */
  async syncUploadedFile(file, employeeEmail, folderId) {
    try {
      logger.info('GoogleDriveSyncService', `📤 Sincronizando archivo subido: ${file.name}`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede sincronizar archivo para ${employeeEmail}: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError.error(error)
        throw new Error(error)
      }

      // Subir archivo a Google Drive
      logger.info('GoogleDriveSyncService', `📤 Subiendo archivo a Google Drive...`)
      const uploadedFile = await googleDriveConsolidatedService.uploadFile(file, folderId)

      if (!uploadedFile || !uploadedFile.id) {
        throw new Error('No se pudo subir archivo a Google Drive')
      }

      logger.info('GoogleDriveSyncService', `✅ Archivo subido a Google Drive: ${uploadedFile.id}`)

      // Registrar en Supabase
      logger.info('GoogleDriveSyncService', `💾 Registrando archivo en Supabase...`)
      const { data: folder } = await supabase
        .from('employee_folders')
        .select('id')
        .eq('employee_email', employeeEmail)
        .maybeSingle()

      if (folder) {
        const { error } = await supabase
          .from('employee_documents')
          .insert({
            folder_id: folder.id,
            document_name: uploadedFile.name,
            document_type: uploadedFile.mimeType,
            file_size: uploadedFile.size || 0,
            google_file_id: uploadedFile.id,
            file_url: `https://drive.google.com/file/d/${uploadedFile.id}/view`,
            status: 'active'
          })

        if (error) {
          logger.error('GoogleDriveSyncService', `❌ Error registrando archivo en Supabase: ${error.message}`)
          this.recordError(error.message)
          throw error
        }

        logger.info('GoogleDriveSyncService', `✅ Archivo registrado en Supabase`)
      }

      return uploadedFile
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error sincronizando archivo subido: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Obtiene el estado de sincronización
   */
  getSyncStatus() {
    return {
      initialized: this.isInitialized,
      authenticated: googleDriveAuthService.isAuthenticated(),
      activeSyncs: this.syncIntervals.size,
      employees: Array.from(this.syncIntervals.keys()),
      recentErrors: this.syncErrors.slice(-10),
      authInfo: googleDriveAuthService.getConfigInfo()
    }
  }

  /**
   * Detiene todas las sincronizaciones
   */
  stopAllSync() {
    try {
      logger.info('GoogleDriveSyncService', '⏹️ Deteniendo todas las sincronizaciones...')
      
      for (const [employeeEmail, interval] of this.syncIntervals.entries()) {
        clearInterval(interval)
        logger.info('GoogleDriveSyncService', `⏹️ Sincronización detenida para ${employeeEmail}`)
      }
      this.syncIntervals.clear()
      logger.info('GoogleDriveSyncService', `✅ Todas las sincronizaciones detenidas`)
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error deteniendo sincronizaciones: ${error.message}`)
      this.recordError(error.message)
    }
  }

  /**
   * Elimina una carpeta de empleado de todas las plataformas
   * Implementa sincronización de eliminación
   */
  async deleteEmployeeFolder(employeeEmail, deleteFromDrive = true) {
    try {
      logger.info('GoogleDriveSyncService', `🗑️ Iniciando eliminación de carpeta para ${employeeEmail} (Drive: ${deleteFromDrive})`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede eliminar carpeta para ${employeeEmail}: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Obtener información de la carpeta
      const { data: folder, error: fetchError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .single()

      if (fetchError || !folder) {
        logger.warn('GoogleDriveSyncService', `⚠️ No se encontró carpeta para ${employeeEmail}`)
        return { success: true, message: 'Carpeta no encontrada, ya eliminada' }
      }

      // 1. Eliminar de Google Drive (si se solicita)
      if (deleteFromDrive && folder.drive_folder_id) {
        try {
          logger.info('GoogleDriveSyncService', `🗑️ Eliminando carpeta de Google Drive: ${folder.drive_folder_id}`)
          await googleDriveConsolidatedService.deleteFile(folder.drive_folder_id)
          logger.info('GoogleDriveSyncService', `✅ Carpeta eliminada de Google Drive`)
        } catch (driveError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error eliminando de Google Drive: ${driveError.message}`)
          // Continuar con eliminación de Supabase aunque falle en Drive
        }
      }

      // 2. Soft delete en Supabase (marcar como eliminada)
      logger.info('GoogleDriveSyncService', `🗑️ Marcando carpeta como eliminada en Supabase`)
      const { error: updateError } = await supabase
        .from('employee_folders')
        .update({
          folder_status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('employee_email', employeeEmail)

      if (updateError) {
        logger.error('GoogleDriveSyncService', `❌ Error actualizando estado en Supabase: ${updateError.message}`)
        throw updateError
      }

      // 3. Detener sincronización periódica si existe
      this.stopPeriodicSync(employeeEmail)

      logger.info('GoogleDriveSyncService', `✅ Carpeta eliminada exitosamente para ${employeeEmail}`)
      
      return {
        success: true,
        message: 'Carpeta eliminada correctamente',
        deletedFromDrive: deleteFromDrive && folder.drive_folder_id ? true : false
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error eliminando carpeta para ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Audita la consistencia entre Supabase y Google Drive
   * Detecta carpetas huérfanas e inconsistencias
   */
  async auditConsistency() {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Iniciando auditoría de consistencia...`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = '❌ No se puede auditar consistencia: Google Drive no está autenticado'
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      const auditResults = {
        totalSupabaseFolders: 0,
        totalDriveFolders: 0,
        inconsistencies: [],
        orphanedInDrive: [],
        orphanedInSupabase: [],
        timestamp: new Date().toISOString()
      }

      // 1. Obtener todas las carpetas de Supabase
      const { data: supabaseFolders, error: supabaseError } = await supabase
        .from('employee_folders')
        .select('*')
        .neq('folder_status', 'deleted')

      if (supabaseError) {
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo carpetas de Supabase: ${supabaseError.message}`)
        throw supabaseError
      }

      auditResults.totalSupabaseFolders = supabaseFolders.length
      logger.info('GoogleDriveSyncService', `📊 Encontradas ${supabaseFolders.length} carpetas en Supabase`)

      // 2. Verificar existencia en Google Drive
      for (const folder of supabaseFolders) {
        if (folder.drive_folder_id) {
          try {
            const driveFolder = await googleDriveConsolidatedService.getFileInfo(folder.drive_folder_id)
            if (!driveFolder) {
              auditResults.inconsistencies.push({
                type: 'missing_in_drive',
                employeeEmail: folder.employee_email,
                supabaseId: folder.id,
                driveFolderId: folder.drive_folder_id,
                message: 'Carpeta existe en Supabase pero no en Google Drive'
              })
            }
          } catch (error) {
            auditResults.inconsistencies.push({
              type: 'error_checking_drive',
              employeeEmail: folder.employee_email,
              supabaseId: folder.id,
              driveFolderId: folder.drive_folder_id,
              error: error.message,
              message: 'Error verificando carpeta en Google Drive'
            })
          }
        }
      }

      // 3. Buscar carpetas en Google Drive
      try {
        const driveFolders = await googleDriveConsolidatedService.listFiles()
        auditResults.totalDriveFolders = driveFolders.filter(f =>
          f.mimeType === 'application/vnd.google-apps.folder'
        ).length

        // Buscar carpetas de empleados (patrón: "Nombre (email@ejemplo.com)")
        const employeeDriveFolders = driveFolders.filter(folder =>
          folder.mimeType === 'application/vnd.google-apps.folder' &&
          folder.name.includes('(') && folder.name.includes(')')
        )

        logger.info('GoogleDriveSyncService', `📊 Encontradas ${employeeDriveFolders.length} carpetas de empleados en Drive`)

        // Encontrar carpetas huérfanas en Drive
        for (const driveFolder of employeeDriveFolders) {
          const existsInSupabase = supabaseFolders.some(sf =>
            sf.drive_folder_id === driveFolder.id
          )

          if (!existsInSupabase) {
            // Extraer email del nombre de la carpeta
            const emailMatch = driveFolder.name.match(/\(([^@]+@[^)]+)\)/)
            const email = emailMatch ? emailMatch[1] : null

            auditResults.orphanedInDrive.push({
              driveFolderId: driveFolder.id,
              driveFolderName: driveFolder.name,
              extractedEmail: email,
              message: email ? 'Carpeta huérfana en Drive (se puede recuperar)' : 'Carpeta huérfana sin email identificable'
            })
          }
        }
      } catch (driveError) {
        logger.error('GoogleDriveSyncService', `❌ Error listando carpetas de Drive: ${driveError.message}`)
      }

      // 4. Generar resumen
      const summary = {
        ...auditResults,
        summary: {
          totalInconsistencies: auditResults.inconsistencies.length,
          totalOrphanedInDrive: auditResults.orphanedInDrive.length,
          healthyFolders: auditResults.totalSupabaseFolders - auditResults.inconsistencies.length,
          needsAttention: auditResults.inconsistencies.length > 0 || auditResults.orphanedInDrive.length > 0
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Auditoría completada: ${summary.summary.totalInconsistencies} inconsistencias, ${summary.summary.totalOrphanedInDrive} carpetas huérfanas`)
      
      return summary
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en auditoría de consistencia: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Recupera carpetas huérfanas de Google Drive
   * Crea registros en Supabase para carpetas existentes en Drive
   */
  async recoverOrphanedFolders() {
    try {
      logger.info('GoogleDriveSyncService', `🔄 Iniciando recuperación de carpetas huérfanas...`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = '❌ No se puede recuperar carpetas: Google Drive no está autenticado'
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Realizar auditoría para encontrar carpetas huérfanas
      const audit = await this.auditConsistency()
      const orphaned = audit.orphanedInDrive.filter(folder => folder.extractedEmail)

      if (orphaned.length === 0) {
        logger.info('GoogleDriveSyncService', `ℹ️ No hay carpetas huérfanas para recuperar`)
        return { recovered: 0, message: 'No hay carpetas huérfanas para recuperar' }
      }

      let recovered = 0
      const errors = []

      // Recuperar cada carpeta huérfana
      for (const orphan of orphaned) {
        try {
          logger.info('GoogleDriveSyncService', `🔄 Recuperando carpeta: ${orphan.driveFolderName}`)
          
          // Extraer información del nombre
          const nameMatch = orphan.driveFolderName.match(/^([^(]+)\(([^@]+@[^)]+)\)/)
          const employeeName = nameMatch ? nameMatch[1].trim() : 'Sin nombre'
          const employeeEmail = orphan.extractedEmail

          // Buscar información del empleado
          const { data: employee } = await supabase
            .from('employees')
            .select('*')
            .eq('email', employeeEmail)
            .single()

          // Crear registro en Supabase
          await this.createSupabaseFolderRecord(
            employeeEmail,
            employeeName,
            employee?.companies?.name || 'Empresa desconocida',
            employee || {},
            orphan.driveFolderId
          )

          recovered++
          logger.info('GoogleDriveSyncService', `✅ Carpeta recuperada: ${employeeEmail}`)
        } catch (error) {
          errors.push({
            folder: orphan.driveFolderName,
            error: error.message
          })
          logger.error('GoogleDriveSyncService', `❌ Error recuperando ${orphan.driveFolderName}: ${error.message}`)
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Recuperación completada: ${recovered} recuperadas, ${errors.length} errores`)
      
      return {
        recovered,
        errors,
        totalOrphaned: orphaned.length,
        message: `Recuperadas ${recovered} de ${orphaned.length} carpetas huérfanas`
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en recuperación de carpetas: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Limpia carpetas marcadas como eliminadas (hard delete)
   * Use con precaución - esta acción es irreversible
   */
  async cleanupDeletedFolders(olderThanDays = 30) {
    try {
      logger.info('GoogleDriveSyncService', `🧹 Iniciando limpieza de carpetas eliminadas (más antiguas que ${olderThanDays} días)...`)
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      // Eliminar registros marcados como eliminados
      const { data: deletedFolders, error } = await supabase
        .from('employee_folders')
        .delete()
        .eq('folder_status', 'deleted')
        .lt('deleted_at', cutoffDate.toISOString())
        .select()

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error en limpieza: ${error.message}`)
        throw error
      }

      logger.info('GoogleDriveSyncService', `🧹 Limpieza completada: ${deletedFolders?.length || 0} registros eliminados permanentemente`)
      
      return {
        deleted: deletedFolders?.length || 0,
        cutoffDate: cutoffDate.toISOString(),
        message: `Eliminados ${deletedFolders?.length || 0} registros permanentemente`
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en limpieza de carpetas eliminadas: ${error.message}`)
      throw error
    }
  }

  /**
   * Comparte una carpeta con un empleado automáticamente
   * NUEVA FUNCIONALIDAD: Resuelve el problema de permisos
   */
  async shareEmployeeFolderWithUser(employeeEmail, folderId, role = 'writer') {
    try {
      logger.info('GoogleDriveSyncService', `🔗 Compartiendo carpeta ${folderId} con ${employeeEmail} (${role})`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede compartir carpeta: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Usar el método shareFolder existente en googleDriveConsolidatedService
      const shareResult = await googleDriveConsolidatedService.shareFolder(folderId, employeeEmail, role)
      
      logger.info('GoogleDriveSyncService', `✅ Carpeta compartida exitosamente con ${employeeEmail}`)
      
      // Registrar el cambio en Supabase
      await this.logPermissionChange(employeeEmail, folderId, 'shared', role)
      
      return {
        success: true,
        message: `Carpeta compartida con ${employeeEmail}`,
        shareResult: shareResult
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error compartiendo carpeta con ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Revoca el acceso de un empleado a su carpeta
   */
  async revokeEmployeeFolderAccess(employeeEmail, folderId) {
    try {
      logger.info('GoogleDriveSyncService', `🚫 Revocando acceso de ${employeeEmail} a carpeta ${folderId}`)
      
      // Verificar autenticación
      if (!googleDriveAuthService.isAuthenticated()) {
        const error = `❌ No se puede revocar acceso: Google Drive no está autenticado`
        logger.error('GoogleDriveSyncService', error)
        this.recordError(error)
        throw new Error(error)
      }

      // Obtener los permisos actuales de la carpeta
      const permissions = await this.getFolderPermissions(folderId)
      const employeePermission = permissions.find(p => p.emailAddress === employeeEmail)
      
      if (!employeePermission) {
        logger.warn('GoogleDriveSyncService', `⚠️ No se encontró permiso para ${employeeEmail} en carpeta ${folderId}`)
        return {
          success: false,
          message: `No se encontró acceso para revocar`
        }
      }

      // Eliminar el permiso
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions/${employeePermission.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${googleDriveAuthService.getAccessToken()}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveSyncService', `❌ Error revocando acceso: ${response.status} - ${errorData}`)
        throw new Error(`Error revocando acceso: ${response.status}`)
      }

      logger.info('GoogleDriveSyncService', `✅ Acceso revocado para ${employeeEmail}`)
      
      // Registrar el cambio en Supabase
      await this.logPermissionChange(employeeEmail, folderId, 'revoked', null)
      
      return {
        success: true,
        message: `Acceso revocado para ${employeeEmail}`
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error revocando acceso de ${employeeEmail}: ${error.message}`)
      this.recordError(error.message)
      throw error
    }
  }

  /**
   * Obtiene los permisos de una carpeta
   */
  async getFolderPermissions(folderId) {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Obteniendo permisos de carpeta ${folderId}`)
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${googleDriveAuthService.getAccessToken()}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo permisos: ${response.status} - ${errorData}`)
        throw new Error(`Error obteniendo permisos: ${response.status}`)
      }

      const data = await response.json()
      logger.info('GoogleDriveSyncService', `✅ ${data.permissions?.length || 0} permisos encontrados`)
      
      return data.permissions || []
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en getFolderPermissions: ${error.message}`)
      throw error
    }
  }

  /**
   * Actualiza el rol de un empleado en su carpeta
   */
  async updateEmployeeFolderRole(employeeEmail, folderId, newRole) {
    try {
      logger.info('GoogleDriveSyncService', `🔄 Actualizando rol de ${employeeEmail} a ${newRole} en carpeta ${folderId}`)
      
      // Primero revocar acceso actual
      await this.revokeEmployeeFolderAccess(employeeEmail, folderId)
      
      // Luego compartir con el nuevo rol
      const shareResult = await this.shareEmployeeFolderWithUser(employeeEmail, folderId, newRole)
      
      logger.info('GoogleDriveSyncService', `✅ Rol actualizado para ${employeeEmail}: ${newRole}`)
      
      return {
        success: true,
        message: `Rol actualizado a ${newRole} para ${employeeEmail}`,
        shareResult: shareResult
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error actualizando rol de ${employeeEmail}: ${error.message}`)
      throw error
    }
  }

  /**
   * Registra cambios de permisos en Supabase
   */
  async logPermissionChange(employeeEmail, folderId, action, role) {
    try {
      // Aquí se podría crear una tabla 'permission_logs' para auditoría
      logger.info('GoogleDriveSyncService', `📝 Log de permiso: ${action} - ${employeeEmail} - ${role}`)
      
      // Por ahora solo loggeamos, en el futuro se puede guardar en BD
      return true
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error registrando log de permiso: ${error.message}`)
      return false
    }
  }

  /**
   * Obtiene el estado de permisos de todos los empleados
   */
  async getAllEmployeePermissions() {
    try {
      logger.info('GoogleDriveSyncService', `🔍 Obteniendo estado de permisos de todos los empleados`)
      
      // Obtener todas las carpetas de empleados
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .neq('folder_status', 'deleted')

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error obteniendo carpetas: ${error.message}`)
        throw error
      }

      const permissionsStatus = []

      for (const folder of folders) {
        try {
          const permissions = await this.getFolderPermissions(folder.drive_folder_id)
          const employeePermission = permissions.find(p => p.emailAddress === folder.employee_email)
          
          permissionsStatus.push({
            employeeEmail: folder.employee_email,
            employeeName: folder.employee_name,
            folderId: folder.drive_folder_id,
            folderName: `${folder.employee_name} (${folder.employee_email})`,
            hasAccess: !!employeePermission,
            currentRole: employeePermission?.role || null,
            permissionId: employeePermission?.id || null,
            lastChecked: new Date().toISOString()
          })
        } catch (folderError) {
          logger.warn('GoogleDriveSyncService', `⚠️ Error verificando permisos de ${folder.employee_email}: ${folderError.message}`)
          permissionsStatus.push({
            employeeEmail: folder.employee_email,
            employeeName: folder.employee_name,
            folderId: folder.drive_folder_id,
            folderName: `${folder.employee_name} (${folder.employee_email})`,
            hasAccess: false,
            currentRole: null,
            permissionId: null,
            error: folderError.message,
            lastChecked: new Date().toISOString()
          })
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Estado de permisos obtenido para ${permissionsStatus.length} empleados`)
      
      return {
        totalEmployees: permissionsStatus.length,
        employeesWithAccess: permissionsStatus.filter(p => p.hasAccess).length,
        employeesWithoutAccess: permissionsStatus.filter(p => !p.hasAccess).length,
        permissions: permissionsStatus,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error obteniendo estado de permisos: ${error.message}`)
      throw error
    }
  }

  /**
   * Comparte automáticamente todas las carpetas con sus empleados
   * Útil para configuración masiva inicial
   */
  async shareAllEmployeeFolders(defaultRole = 'writer') {
    try {
      logger.info('GoogleDriveSyncService', `🔄 Iniciando compartir masivo de carpetas (rol: ${defaultRole})`)
      
      const status = await this.getAllEmployeePermissions()
      const employeesWithoutAccess = status.permissions.filter(p => !p.hasAccess)
      
      if (employeesWithoutAccess.length === 0) {
        logger.info('GoogleDriveSyncService', `ℹ️ Todos los empleados ya tienen acceso a sus carpetas`)
        return {
          success: true,
          message: 'Todos los empleados ya tienen acceso',
          shared: 0,
          errors: 0
        }
      }

      let shared = 0
      let errors = 0
      const results = []

      for (const employee of employeesWithoutAccess) {
        try {
          logger.info('GoogleDriveSyncService', `🔗 Compartiendo carpeta con ${employee.employeeEmail}`)
          
          const result = await this.shareEmployeeFolderWithUser(
            employee.employeeEmail,
            employee.folderId,
            defaultRole
          )
          
          shared++
          results.push({
            employeeEmail: employee.employeeEmail,
            success: true,
            result: result
          })
          
          logger.info('GoogleDriveSyncService', `✅ Carpeta compartida con ${employee.employeeEmail}`)
        } catch (error) {
          errors++
          results.push({
            employeeEmail: employee.employeeEmail,
            success: false,
            error: error.message
          })
          
          logger.error('GoogleDriveSyncService', `❌ Error compartiendo con ${employee.employeeEmail}: ${error.message}`)
        }
      }

      logger.info('GoogleDriveSyncService', `📊 Compartir masivo completado: ${shared} compartidas, ${errors} errores`)
      
      return {
        success: true,
        message: `Compartidas ${shared} carpetas, ${errors} errores`,
        shared: shared,
        errors: errors,
        results: results
      }
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en compartir masivo: ${error.message}`)
      throw error
    }
  }
}

const googleDriveSyncService = new GoogleDriveSyncService()
export default googleDriveSyncService
