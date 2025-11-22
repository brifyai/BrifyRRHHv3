/**
 * SERVICIO UNIFICADO ANTI-DUPLICACIÓN
 * Reemplaza TODOS los servicios existentes y elimina duplicaciones
 */

import { supabase } from '../lib/supabaseClient.js'
import superLockService from '../lib/superLockService.js'
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
   * NORMALIZAR EMAIL PARA MANEJAR CARACTERES ESPECIALES DEL ESPAÑOL
   */
  normalizeEmail(email) {
    if (!email) return ''
    
    return email
      .toLowerCase()
      .trim()
      .normalize('NFD') // Separar caracteres con diacríticos
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes, acentos)
      .replace(/ñ/g, 'n') // Convertir ñ a n
      .replace(/Ñ/g, 'N') // Convertir Ñ a N
  }

  /**
   * INICIALIZAR GOOGLE DRIVE CONSOLIDADO
   */
  async initializeGoogleDrive(userId) {
    if (this.driveInitialized) return true
    
    try {
      console.log('🚀 Inicializando Google Drive para usuario:', userId)
      
      await googleDriveConsolidatedService.initialize(userId)
      
      this.driveInitialized = true
      console.log('✅ Google Drive inicializado')
      return true
    } catch (error) {
      console.error('❌ Error inicializando Google Drive:', error)
      return false
    }
  }

  /**
   * INICIALIZAR HYBRID DRIVE
   */
  async initializeHybridDrive() {
    try {
      console.log('🚀 Inicializando Hybrid Drive...')
      await googleDriveConsolidatedService.initialize()
      this.hybridDriveInitialized = true
      console.log('✅ Hybrid Drive inicializado')
    } catch (error) {
      console.warn('⚠️ Hybrid Drive no disponible:', error.message)
      this.hybridDriveInitialized = false
    }
  }

  /**
   * OBTENER TODAS LAS CARPETAS
   */
  async getAllFolders() {
    try {
      console.log('📁 Obteniendo todas las carpetas de empleados...')
      
      // Primero obtener las carpetas
      const { data: folders, error: foldersError } = await supabase
        .from('employee_folders')
        .select('*')
        .order('created_at', { ascending: false })

      if (foldersError) {
        console.error('❌ Error obteniendo carpetas:', foldersError)
        throw foldersError
      }

      if (!folders || folders.length === 0) {
        console.log('⚠️ No se encontraron carpetas')
        return []
      }

      console.log(`📦 Obtenidas ${folders.length} carpetas, vinculando datos de empleados...`)

      // Obtener todos los empleados para vincular por email
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')

      if (employeesError) {
        console.warn('⚠️ Error obteniendo empleados:', employeesError)
        // Continuar sin datos de empleados
      }

      // Crear mapa de empleados por email para vinculación rápida
      const employeesMap = new Map()
      if (employees) {
        employees.forEach(emp => {
          if (emp.email) {
            employeesMap.set(this.normalizeEmail(emp.email), emp)
          }
        })
      }

      // Transformar los datos vinculando empleados por email
      const transformedFolders = folders.map(folder => {
        const employee = employeesMap.get(this.normalizeEmail(folder.employee_email))
        
        return {
          ...folder,
          employeeName: employee?.name || folder.employee_email || 'Empleado sin nombre',
          employeeEmail: folder.employee_email || '',
          department: employee?.department || 'Sin departamento',
          position: employee?.position || 'Sin posición',
          companyId: employee?.company_id || '',
          level: employee?.level || '',
          workMode: employee?.work_mode || '',
          contractType: employee?.contract_type || '',
          phone: employee?.phone || '',
          status: folder.status || 'active' // Asegurar que siempre haya un status
        }
      })

      console.log(`✅ Obtenidas ${transformedFolders.length} carpetas con datos vinculados`)
      return transformedFolders
    } catch (error) {
      console.error('❌ Error en getAllFolders:', error)
      throw error
    }
  }

  /**
   * OBTENER CARPETA POR ID
   */
  async getFolderById(id) {
    try {
      console.log('🔍 Obteniendo carpeta por ID:', id)
      
      const { data: folder, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Error obteniendo carpeta:', error)
        throw error
      }

      if (!folder) {
        throw new Error('Carpeta no encontrada')
      }

      // Obtener datos del empleado
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('email', folder.employee_email)
        .single()

      // Transformar datos
      const transformedFolder = {
        ...folder,
        employeeName: employee?.name || folder.employee_email || 'Empleado sin nombre',
        employeeEmail: folder.employee_email || '',
        department: employee?.department || 'Sin departamento',
        position: employee?.position || 'Sin posición',
        companyId: employee?.company_id || '',
        level: employee?.level || '',
        workMode: employee?.work_mode || '',
        contractType: employee?.contract_type || '',
        phone: employee?.phone || '',
        status: folder.status || 'active'
      }

      console.log('✅ Carpeta obtenida:', transformedFolder.id)
      return transformedFolder
    } catch (error) {
      console.error('❌ Error en getFolderById:', error)
      throw error
    }
  }

  /**
   * CREAR CARPETA PARA EMPLEADO
   */
  async createFolderForEmployee(employee) {
    const lockKey = `folder_${employee.email}`
    
    return await superLockService.withLock(lockKey, async () => {
      try {
        console.log('📁 Creando carpeta para:', employee.email)
        
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('employee_folders')
          .select('*')
          .eq('employee_email', employee.email)
          .single()

        if (existing) {
          console.log('⚠️ Carpeta ya existe para:', employee.email)
          return existing
        }

        // Crear carpeta en Google Drive si está disponible
        let driveFolderId = null
        if (this.hybridDriveInitialized) {
          try {
            const driveResult = await googleDriveConsolidatedService.createEmployeeFolder(employee)
            driveFolderId = driveResult?.id || null
            console.log('📁 Carpeta creada en Google Drive:', driveFolderId)
          } catch (driveError) {
            console.warn('⚠️ Error creando carpeta en Google Drive:', driveError.message)
          }
        }

        // Crear registro en base de datos
        const folderData = {
          employee_email: employee.email,
          employee_name: employee.name,
          drive_folder_id: driveFolderId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: newFolder, error } = await supabase
          .from('employee_folders')
          .insert([folderData])
          .select()
          .single()

        if (error) {
          console.error('❌ Error creando carpeta:', error)
          throw error
        }

        console.log('✅ Carpeta creada:', newFolder.id)
        return newFolder
      } catch (error) {
        console.error('❌ Error en createFolderForEmployee:', error)
        throw error
      }
    })
  }

  /**
   * CREAR CARPETAS PARA TODOS LOS EMPLEADOS
   */
  async createFoldersForAllEmployees() {
    const lockKey = 'bulk_create_folders'
    
    return await superLockService.withLock(lockKey, async () => {
      try {
        console.log('🚀 Iniciando creación masiva de carpetas...')
        
        // Obtener todos los empleados
        const { data: employees, error } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Error obteniendo empleados:', error)
          throw error
        }

        if (!employees || employees.length === 0) {
          console.log('⚠️ No se encontraron empleados')
          return { created: 0, updated: 0, errors: 0 }
        }

        console.log(`📊 Procesando ${employees.length} empleados...`)

        let createdCount = 0
        let updatedCount = 0
        let alreadyExistsCount = 0
        let errorCount = 0
        const errors = []

        for (const employee of employees) {
          try {
            // Verificar si ya existe
            const { data: existing } = await supabase
              .from('employee_folders')
              .select('*')
              .eq('employee_email', employee.email)
              .single()

            if (existing) {
              alreadyExistsCount++
              console.log(`⏭️ Ya existe carpeta para ${employee.email}`)
              continue
            }

            // Crear carpeta
            const result = await this.createFolderForEmployee(employee)
            if (result) {
              createdCount++
              console.log(`✅ Creada carpeta para ${employee.email}`)
            }
          } catch (error) {
            errorCount++
            errors.push({ email: employee.email, error: error.message })
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
    })
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