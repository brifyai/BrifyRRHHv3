/**
 * Supabase-First Google Drive Service
 * Sistema profesional donde Supabase es la fuente principal y Drive es backup
 * Elimina la dependencia crítica de Google Drive para el funcionamiento
 */

import logger from './logger.js'

class SupabaseFirstDriveService {
  constructor() {
    this.supabase = null
    this.googleDriveAuthService = null
    this.currentCompanyId = null
    this.currentCredentialId = null
    this.syncEnabled = false
    this.backupMode = true // Siempre en modo backup por defecto
  }

  /**
   * Inicializa el servicio
   */
  async initialize(supabaseClient, googleDriveAuthService, companyId = null) {
    try {
      logger.info('SupabaseFirstDriveService', '🔄 Inicializando servicio Supabase-first...')
      
      this.supabase = supabaseClient
      this.googleDriveAuthService = googleDriveAuthService
      this.currentCompanyId = companyId
      
      if (companyId) {
        await this.loadCompanySettings(companyId)
      }
      
      logger.info('SupabaseFirstDriveService', '✅ Servicio Supabase-first inicializado')
      return true
    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error inicializando: ${error.message}`)
      return false
    }
  }

  /**
   * Carga configuraciones de la empresa
   */
  async loadCompanySettings(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('company_credentials')
        .select('settings')
        .eq('company_id', companyId)
        .eq('integration_type', 'google_drive')
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data?.settings) {
        this.syncEnabled = data.settings.syncEnabled || false
        this.backupMode = data.settings.backupMode !== false // true por defecto
      }

      logger.info('SupabaseFirstDriveService', `📊 Configuración cargada: sync=${this.syncEnabled}, backup=${this.backupMode}`)
    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error cargando configuración: ${error.message}`)
      // Usar valores por defecto
      this.syncEnabled = false
      this.backupMode = true
    }
  }

  /**
   * Crea carpeta de empleado - SUPABASE PRIMERO
   */
  async createEmployeeFolder(employeeData) {
    try {
      logger.info('SupabaseFirstDriveService', `📁 Creando carpeta para ${employeeData.email}...`)
      
      // 1. CREAR EN SUPABASE PRIMERO (fuente principal)
      const supabaseResult = await this.createEmployeeFolderInSupabase(employeeData)
      
      if (!supabaseResult.success) {
        throw new Error(supabaseResult.error)
      }

      const folderData = supabaseResult.data

      // 2. INTENTAR SINCRONIZAR CON GOOGLE DRIVE (backup opcional)
      let driveResult = { success: false, optional: true }
      
      if (this.syncEnabled && this.googleDriveAuthService?.isAuthenticated()) {
        try {
          driveResult = await this.syncToGoogleDrive(folderData, employeeData)
          logger.info('SupabaseFirstDriveService', `✅ Sincronizado con Google Drive: ${driveResult.status}`)
        } catch (driveError) {
          logger.warn('SupabaseFirstDriveService', `⚠️ Error sincronizando con Drive (no crítico): ${driveError.message}`)
          driveResult = { 
            success: false, 
            error: driveError.message, 
            optional: true,
            canContinue: true 
          }
        }
      } else {
        logger.info('SupabaseFirstDriveService', 'ℹ️ Sincronización con Drive deshabilitada o no autenticado')
      }

      // 3. RETORNAR RESULTADO (Supabase siempre exitoso)
      return {
        success: true,
        data: {
          ...folderData,
          driveSync: driveResult,
          primaryStorage: 'supabase',
          backupStorage: driveResult.success ? 'google_drive' : null
        },
        message: `Carpeta creada en Supabase${driveResult.success ? ' y sincronizada con Drive' : ''}`
      }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error creando carpeta: ${error.message}`)
      return {
        success: false,
        error: error.message,
        primaryStorage: 'supabase',
        canRetry: true
      }
    }
  }

  /**
   * Crear carpeta en Supabase (fuente principal)
   */
  async createEmployeeFolderInSupabase(employeeData) {
    try {
      const folderData = {
        employee_email: employeeData.email,
        employee_name: employeeData.name,
        employee_id: employeeData.id,
        employee_position: employeeData.position,
        employee_department: employeeData.department,
        employee_phone: employeeData.phone,
        employee_region: employeeData.region,
        employee_level: employeeData.level,
        employee_work_mode: employeeData.workMode,
        employee_contract_type: employeeData.contractType,
        company_id: this.currentCompanyId,
        company_name: employeeData.companyName,
        folder_status: 'active',
        settings: {
          syncEnabled: this.syncEnabled,
          backupMode: this.backupMode,
          createdBy: 'supabase_first_service',
          createdAt: new Date().toISOString()
        }
      }

      const { data, error } = await this.supabase
        .from('employee_folders')
        .insert(folderData)
        .select()
        .single()

      if (error) {
        throw error
      }

      logger.info('SupabaseFirstDriveService', `✅ Carpeta creada en Supabase: ${data.id}`)
      return { success: true, data }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error creando en Supabase: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sincronizar con Google Drive (backup opcional)
   */
  async syncToGoogleDrive(folderData, employeeData) {
    try {
      if (!this.googleDriveAuthService?.isAuthenticated()) {
        throw new Error('Google Drive no está autenticado')
      }

      // Crear carpeta en Google Drive
      const folderName = `${employeeData.name} (${employeeData.email})`
      const parentFolderName = `Empleados - ${employeeData.companyName}`
      
      // Buscar o crear carpeta padre
      const parentFolder = await this.findOrCreateParentFolder(parentFolderName)
      
      // Crear carpeta del empleado
      const driveFolder = await this.googleDriveAuthService.createFolder(folderName, parentFolder.id)
      
      // Actualizar registro en Supabase con info de Drive
      const { error } = await this.supabase
        .from('employee_folders')
        .update({
          drive_folder_id: driveFolder.id,
          drive_folder_url: driveFolder.webViewLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderData.id)

      if (error) {
        logger.warn('SupabaseFirstDriveService', `⚠️ Error actualizando Drive ID en Supabase: ${error.message}`)
      }

      return {
        success: true,
        status: 'synced',
        driveFolderId: driveFolder.id,
        driveFolderUrl: driveFolder.webViewLink
      }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error sincronizando con Drive: ${error.message}`)
      return {
        success: false,
        error: error.message,
        optional: true
      }
    }
  }

  /**
   * Buscar o crear carpeta padre en Google Drive
   */
  async findOrCreateParentFolder(parentFolderName) {
    try {
      // Buscar carpeta existente
      const existingFolders = await this.googleDriveAuthService.listFiles('root', {
        q: `name='${parentFolderName}' and mimeType='application/vnd.google-apps.folder'`
      })

      if (existingFolders.files && existingFolders.files.length > 0) {
        return existingFolders.files[0]
      }

      // Crear nueva carpeta padre
      return await this.googleDriveAuthService.createFolder(parentFolderName, 'root')
    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error con carpeta padre: ${error.message}`)
      throw error
    }
  }

  /**
   * Obtener carpetas de empleados desde Supabase (fuente principal)
   */
  async getEmployeeFolders(filters = {}) {
    try {
      logger.info('SupabaseFirstDriveService', '📊 Obteniendo carpetas desde Supabase...')
      
      let query = this.supabase
        .from('employee_folders')
        .select('*')
        .eq('folder_status', 'active')

      // Aplicar filtros
      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId)
      }
      
      if (filters.email) {
        query = query.eq('employee_email', filters.email)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      logger.info('SupabaseFirstDriveService', `✅ ${data.length} carpetas obtenidas desde Supabase`)
      
      return {
        success: true,
        data: data,
        source: 'supabase',
        total: data.length
      }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error obteniendo carpetas: ${error.message}`)
      return {
        success: false,
        error: error.message,
        source: 'supabase'
      }
    }
  }

  /**
   * Actualizar carpeta - SUPABASE PRIMERO
   */
  async updateEmployeeFolder(folderId, updates) {
    try {
      logger.info('SupabaseFirstDriveService', `🔄 Actualizando carpeta ${folderId}...`)
      
      // 1. ACTUALIZAR EN SUPABASE PRIMERO
      const { data, error } = await this.supabase
        .from('employee_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId)
        .select()
        .single()

      if (error) {
        throw error
      }

      // 2. INTENTAR SINCRONIZAR CON GOOGLE DRIVE (opcional)
      let driveResult = { success: false, optional: true }
      
      if (this.syncEnabled && this.googleDriveAuthService?.isAuthenticated() && data.drive_folder_id) {
        try {
          // La sincronización de Drive sería aquí
          logger.info('SupabaseFirstDriveService', 'ℹ️ Sincronización de Drive pendiente de implementación')
        } catch (driveError) {
          logger.warn('SupabaseFirstDriveService', `⚠️ Error sincronizando Drive: ${driveError.message}`)
        }
      }

      return {
        success: true,
        data: data,
        driveSync: driveResult,
        message: 'Carpeta actualizada en Supabase'
      }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error actualizando carpeta: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Eliminar carpeta - SUPABASE PRIMERO (soft delete)
   */
  async deleteEmployeeFolder(folderId, options = { softDelete: true }) {
    try {
      logger.info('SupabaseFirstDriveService', `🗑️ Eliminando carpeta ${folderId}...`)
      
      if (options.softDelete) {
        // Soft delete en Supabase
        const { data, error } = await this.supabase
          .from('employee_folders')
          .update({
            folder_status: 'deleted',
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', folderId)
          .select()
          .single()

        if (error) {
          throw error
        }

        // Intentar eliminar de Google Drive (opcional)
        let driveResult = { success: false, optional: true }
        
        if (this.syncEnabled && this.googleDriveAuthService?.isAuthenticated() && data.drive_folder_id) {
          try {
            await this.googleDriveAuthService.deleteFile(data.drive_folder_id)
            driveResult = { success: true, status: 'deleted_from_drive' }
          } catch (driveError) {
            logger.warn('SupabaseFirstDriveService', `⚠️ Error eliminando de Drive: ${driveError.message}`)
          }
        }

        return {
          success: true,
          data: data,
          driveSync: driveResult,
          message: 'Carpeta eliminada (soft delete) de Supabase'
        }
      } else {
        // Hard delete (solo para casos especiales)
        const { error } = await this.supabase
          .from('employee_folders')
          .delete()
          .eq('id', folderId)

        if (error) {
          throw error
        }

        return {
          success: true,
          message: 'Carpeta eliminada permanentemente de Supabase'
        }
      }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error eliminando carpeta: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Configurar sincronización
   */
  async configureSync(companyId, options) {
    try {
      const { syncEnabled, backupMode } = options
      
      // Actualizar configuración en company_credentials
      const { error } = await this.supabase
        .from('company_credentials')
        .update({
          settings: {
            syncEnabled,
            backupMode,
            updatedAt: new Date().toISOString()
          }
        })
        .eq('company_id', companyId)
        .eq('integration_type', 'google_drive')

      if (error) {
        throw error
      }

      // Actualizar estado local
      this.syncEnabled = syncEnabled
      this.backupMode = backupMode

      logger.info('SupabaseFirstDriveService', `✅ Sincronización configurada: sync=${syncEnabled}, backup=${backupMode}`)
      
      return {
        success: true,
        message: `Sincronización ${syncEnabled ? 'habilitada' : 'deshabilitada'}`
      }

    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error configurando sincronización: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Obtener estadísticas del servicio
   */
  getServiceStats() {
    return {
      initialized: !!this.supabase,
      currentCompanyId: this.currentCompanyId,
      syncEnabled: this.syncEnabled,
      backupMode: this.backupMode,
      googleDriveAuthenticated: this.googleDriveAuthService?.isAuthenticated() || false,
      primaryStorage: 'supabase',
      backupStorage: this.syncEnabled ? 'google_drive' : null,
      architecture: 'supabase_first_drive_backup'
    }
  }

  /**
   * Health check del servicio
   */
  async healthCheck() {
    try {
      const stats = this.getServiceStats()
      
      // Verificar Supabase
      const supabaseHealthy = !!this.supabase
      
      // Verificar Google Drive (opcional)
      const driveHealthy = this.googleDriveAuthService?.isAuthenticated() || !this.syncEnabled
      
      const overallHealth = supabaseHealthy && (driveHealthy || !this.syncEnabled)
      
      return {
        healthy: overallHealth,
        services: {
          supabase: {
            healthy: supabaseHealthy,
            status: supabaseHealthy ? 'operational' : 'unavailable'
          },
          googleDrive: {
            healthy: driveHealthy,
            status: this.syncEnabled ? (driveHealthy ? 'operational' : 'unavailable') : 'disabled',
            optional: !this.syncEnabled
          }
        },
        stats
      }
    } catch (error) {
      logger.error('SupabaseFirstDriveService', `❌ Error en health check: ${error.message}`)
      return {
        healthy: false,
        error: error.message
      }
    }
  }
}

// Instancia singleton
const supabaseFirstDriveService = new SupabaseFirstDriveService()

export default supabaseFirstDriveService
export { SupabaseFirstDriveService }