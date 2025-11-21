/**
 * SERVICIO UNIFICADO ANTI-DUPLICACIÓN
 * Reemplaza TODOS los servicios existentes y elimina duplicaciones
 */

import { supabase } from '../lib/supabaseClient.js'
import superLockService from '../lib/superLockService.js'
import organizedDatabaseService from './organizedDatabaseService.js'
import googleDriveConsolidatedService from '../lib/googleDriveConsolidated.js'

class UnifiedEmployeeFolderService {
  constructor() {
    this.initialized = false
    this.driveInitialized = false
    this.supabase = supabase
  }

  /**
   * INICIALIZAR SERVICIO
   */
  async initialize() {
    if (this.initialized) return true
    
    try {
      console.log('🚀 Inicializando Servicio Unificado Anti-Duplicación...')
      
      // Verificar conexión con Supabase
      const { error } = await supabase.from('employee_folders').select('count').limit(1)
      if (error) {
        console.warn('⚠️ Verificación de employee_folders falló:', error.message)
      }
      
      // Inicializar Hybrid Google Drive
      await this.initializeHybridDrive()
      
      this.initialized = true
      console.log('✅ Servicio Unificado inicializado')
      return true
    } catch (error) {
      console.error('❌ Error inicializando Servicio Unificado:', error)
      return false
    }
  }

  /**
   * INICIALIZAR GOOGLE DRIVE CONSOLIDADO
   */
  async initializeGoogleDrive(userId) {
    if (this.driveInitialized) return true
    
    try {
      const success = await googleDriveConsolidatedService.initialize(userId)
      if (success) {
        this.driveInitialized = true
        console.log(`✅ GoogleDriveConsolidated inicializado para servicio unificado`)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error inicializando Google Drive Consolidado:', error)
      return false
    }
  }

  /**
   * CREAR CARPETA CON SUPER LOCK OBLIGATORIO
   */
  async createEmployeeFolder(employeeEmail, employeeData, userId) {
    return await superLockService.withSuperLock(
      employeeEmail,
      async () => {
        await this.initialize()
        await this.initializeGoogleDrive(userId)
        
        // 1. VERIFICAR SI YA EXISTE EN SUPABASE
        const existingSupabase = await this.checkSupabaseExists(employeeEmail)
        if (existingSupabase) {
          console.log(`📂 Carpeta ya existe en Supabase para ${employeeEmail}`)
          return {
            folder: existingSupabase,
            created: false,
            updated: false,
            alreadyExists: true
          }
        }

        // 2. VERIFICAR SI YA EXISTE EN GOOGLE DRIVE
        const existingDrive = await this.checkDriveExists(employeeEmail, employeeData.name)
        if (existingDrive) {
          console.log(`📂 Carpeta ya existe en Drive para ${employeeEmail}`)
          
          // Crear registro en Supabase con datos de Drive existente
          const folderData = await this.createSupabaseRecord(employeeEmail, employeeData, existingDrive.id, existingDrive.webViewLink)
          return {
            folder: folderData,
            created: true,
            updated: false,
            alreadyExistedInDrive: true
          }
        }

        // 3. CREAR NUEVA CARPETA
        const newFolder = await this.createNewFolder(employeeEmail, employeeData, userId)
        return {
          folder: newFolder,
          created: true,
          updated: false,
          newlyCreated: true
        }
      },
      'create_folder_unified'
    )
  }

  /**
   * VERIFICAR EXISTENCIA EN SUPABASE
   */
  async checkSupabaseExists(employeeEmail) {
    try {
      const { data, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.warn(`⚠️ Error verificando Supabase para ${employeeEmail}:`, error.message)
        return null
      }

      return data
    } catch (error) {
      console.warn(`⚠️ Error verificando Supabase para ${employeeEmail}:`, error.message)
      return null
    }
  }

  /**
   * VERIFICAR EXISTENCIA EN GOOGLE DRIVE
   */
  async checkDriveExists(employeeEmail, employeeName) {
    try {
      if (!this.driveInitialized) {
        console.log(`⚠️ Drive no inicializado para ${employeeEmail}`)
        return null
      }

      const companyName = 'Empresa' // Se puede obtener de employeeData
      
      // Buscar carpeta principal de la empresa
      const parentFolderName = `${companyName}/Empleados`
      const folders = await googleDriveConsolidatedService.listFiles()
      const parentFolder = folders.find(folder =>
        folder.name === parentFolderName &&
        folder.mimeType === 'application/vnd.google-apps.folder'
      )

      if (!parentFolder) {
        console.log(`📁 No se encontró carpeta principal para ${employeeEmail}`)
        return null
      }

      // Buscar carpeta del empleado
      const folderName = `${employeeName} (${employeeEmail})`
      const employeeFiles = await googleDriveConsolidatedService.listFiles(parentFolder.id)
      const existingFolder = employeeFiles.find(file =>
        file.name === folderName &&
        file.mimeType === 'application/vnd.google-apps.folder'
      )

      return existingFolder || null
    } catch (error) {
      console.warn(`⚠️ Error verificando Drive para ${employeeEmail}:`, error.message)
      return null
    }
  }

  /**
   * CREAR NUEVA CARPETA
   */
  async createNewFolder(employeeEmail, employeeData, userId) {
    try {
      const companyName = await this.getCompanyName(employeeData.company_id)
      
      // 1. CREAR CARPETA EN GOOGLE DRIVE
      const driveFolder = await this.createDriveFolder(employeeEmail, employeeData.name, companyName, userId)
      
      // 2. CREAR REGISTRO EN SUPABASE
      const supabaseRecord = await this.createSupabaseRecord(
        employeeEmail,
        employeeData,
        driveFolder.id,
        driveFolder.webViewLink || `https://drive.google.com/drive/folders/${driveFolder.id}`
      )
      
      // 3. COMPARTIR CARPETA
      await this.shareDriveFolder(driveFolder.id, employeeEmail, userId)
      
      console.log(`✅ Carpeta creada exitosamente para ${employeeEmail}`)
      return supabaseRecord
    } catch (error) {
      console.error(`❌ Error creando carpeta para ${employeeEmail}:`, error)
      throw error
    }
  }

  /**
   * CREAR CARPETA EN GOOGLE DRIVE
   */
  async createDriveFolder(employeeEmail, employeeName, companyName, userId) {
    try {
      const parentFolderName = `${companyName}/Empleados`
      
      // Buscar o crear carpeta principal
      let parentFolder = await this.findOrCreateParentFolder(parentFolderName, userId)
      
      // Crear carpeta del empleado
      const folderName = `${employeeName} (${employeeEmail})`
      const employeeFolder = await googleDriveConsolidatedService.createFolder(folderName, parentFolder.id)
      
      return employeeFolder
    } catch (error) {
      console.error(`❌ Error creando carpeta en Drive para ${employeeEmail}:`, error)
      throw error
    }
  }

  /**
   * BUSCAR O CREAR CARPETA PRINCIPAL
   */
  async findOrCreateParentFolder(folderName, userId) {
    try {
      const folders = await googleDriveConsolidatedService.listFiles()
      const parentFolder = folders.find(folder =>
        folder.name === folderName &&
        folder.mimeType === 'application/vnd.google-apps.folder'
      )

      if (parentFolder) {
        return parentFolder
      } else {
        return await googleDriveConsolidatedService.createFolder(folderName)
      }
    } catch (error) {
      console.error(`❌ Error buscando/creando carpeta principal ${folderName}:`, error)
      throw error
    }
  }

  /**
   * CREAR REGISTRO EN SUPABASE
   */
  async createSupabaseRecord(employeeEmail, employeeData, driveFolderId, driveFolderUrl) {
    try {
      const companyName = await this.getCompanyName(employeeData.company_id)
      
      const folderData = {
        employee_email: employeeEmail,
        employee_id: employeeData.id,
        employee_name: employeeData.name,
        employee_position: employeeData.position,
        employee_department: employeeData.department,
        employee_phone: employeeData.phone,
        employee_region: employeeData.region,
        employee_level: employeeData.level,
        employee_work_mode: employeeData.work_mode,
        employee_contract_type: employeeData.contract_type,
        company_id: employeeData.company_id,
        company_name: companyName,
        drive_folder_id: driveFolderId,
        drive_folder_url: driveFolderUrl,
        settings: {
          notificationPreferences: {
            whatsapp: true,
            telegram: true,
            email: true
          },
          responseLanguage: 'es',
          timezone: 'America/Santiago'
        }
      }

      const { data, error } = await supabase
        .from('employee_folders')
        .insert(folderData)
        .select()
        .single()

      if (error) throw error

      // Crear configuración de notificaciones
      await this.createNotificationSettings(data.id)

      return data
    } catch (error) {
      console.error(`❌ Error creando registro en Supabase para ${employeeEmail}:`, error)
      throw error
    }
  }

  /**
   * COMPARTIR CARPETA
   */
  async shareDriveFolder(folderId, employeeEmail, userId) {
    try {
      await googleDriveConsolidatedService.shareFolder(folderId, employeeEmail, 'writer')
      console.log(`📤 Carpeta compartida con ${employeeEmail}`)
    } catch (error) {
      console.warn(`⚠️ No se pudo compartir carpeta con ${employeeEmail}:`, error.message)
    }
  }

  /**
   * CREAR CONFIGURACIÓN DE NOTIFICACIONES
   */
  async createNotificationSettings(folderId) {
    try {
      const { error } = await supabase
        .from('employee_notification_settings')
        .insert({
          folder_id: folderId,
          whatsapp_enabled: true,
          telegram_enabled: true,
          email_enabled: true,
          response_language: 'es',
          timezone: 'America/Santiago',
          notification_preferences: {
            whatsapp: true,
            telegram: true,
            email: true
          }
        })

      if (error) throw error
    } catch (error) {
      console.error(`❌ Error creando configuración de notificaciones:`, error)
      throw error
    }
  }

  /**
   * OBTENER NOMBRE DE EMPRESA
   */
  async getCompanyName(companyId) {
    try {
      if (!companyId) return 'Empresa no especificada'
      
      const companies = await organizedDatabaseService.getCompanies()
      const company = companies.find(comp => comp.id === companyId)
      return company ? company.name : 'Empresa no encontrada'
    } catch (error) {
      console.warn(`⚠️ Error obteniendo nombre de empresa para ${companyId}:`, error.message)
      return 'Empresa no especificada'
    }
  }

  /**
   * CREAR CARPETAS PARA TODOS LOS EMPLEADOS
   */
  async createFoldersForAllEmployees(userId) {
    try {
      console.log('🚀 Iniciando creación masiva con servicio unificado...')
      
      const employees = await organizedDatabaseService.getEmployees()
      let createdCount = 0
      let updatedCount = 0
      let alreadyExistsCount = 0
      let errorCount = 0
      const errors = []

      for (const employee of employees) {
        if (!employee.email) {
          console.warn(`⚠️ Empleado sin email: ${employee.name}`)
          continue
        }

        try {
          const result = await this.createEmployeeFolder(employee.email, employee, userId)
          
          if (result.created) {
            if (result.newlyCreated) {
              createdCount++
            } else if (result.alreadyExistedInDrive) {
              alreadyExistsCount++
            }
          } else if (result.updated) {
            updatedCount++
          } else if (result.alreadyExists) {
            alreadyExistsCount++
          }
          
          // Log de progreso cada 10 empleados
          if ((createdCount + updatedCount + alreadyExistsCount) % 10 === 0) {
            console.log(`📊 Progreso: ${createdCount + updatedCount + alreadyExistsCount} carpetas procesadas...`)
          }

        } catch (error) {
          errorCount++
          errors.push(`${employee.email}: ${error.message}`)
          console.error(`❌ Error procesando ${employee.email}:`, error)
        }
      }

      const summary = {
        created: createdCount,
        updated: updatedCount,
        alreadyExisted: alreadyExistsCount,
        errors: errorCount,
        sampleErrors: errors.slice(0, 10)
      }

      console.log('📊 Resumen final:', summary)
      return summary
    } catch (error) {
      console.error('❌ Error en creación masiva:', error)
      throw error
    }
  }

  /**
   * LIMPIAR DUPLICADOS EXISTENTES
   */
  async cleanupDuplicates() {
    try {
      console.log('🧹 Iniciando limpieza de duplicados...')
      
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const emailGroups = {}
      folders.forEach(folder => {
        const email = folder.employee_email
        if (!emailGroups[email]) {
          emailGroups[email] = []
        }
        emailGroups[email].push(folder)
      })

      let deletedCount = 0
      for (const [email, group] of Object.entries(emailGroups)) {
        if (group.length > 1) {
          // Mantener el más reciente, eliminar los demás
          const toDelete = group.slice(1)
          
          for (const folder of toDelete) {
            await supabase
              .from('employee_folders')
              .delete()
              .eq('id', folder.id)
            
            deletedCount++
            console.log(`🗑️ Eliminada carpeta duplicada para ${email} (ID: ${folder.id})`)
          }
        }
      }

      console.log(`✅ Limpieza completada: ${deletedCount} duplicados eliminados`)
      return { deletedCount }
    } catch (error) {
      console.error('❌ Error en limpieza de duplicados:', error)
      throw error
    }
  }

  /**
   * OBTENER ESTADÍSTICAS
   */
  async getStats() {
    try {
      const { data: folders } = await supabase
        .from('employee_folders')
        .select('*')

      const lockStats = await superLockService.getSuperLockStats()
      
      return {
        totalFolders: folders?.length || 0,
        lockStats,
        service: 'UnifiedEmployeeFolderService',
        initialized: this.initialized,
        driveInitialized: this.hybridDriveInitialized
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      return {
        totalFolders: 0,
        lockStats: { active: 0, localCache: 0, total: 0 },
        service: 'UnifiedEmployeeFolderService',
        initialized: false,
        driveInitialized: false
      }
    }
  }
}

// Instancia singleton
const unifiedEmployeeFolderService = new UnifiedEmployeeFolderService()

export default unifiedEmployeeFolderService
export { UnifiedEmployeeFolderService }