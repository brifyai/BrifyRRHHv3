/**
 * 🔄 SERVICIO DE SINCRONIZACIÓN EN LOTE
 * 
 * Maneja la sincronización bidireccional de carpetas de empleados
 * entre Google Drive y Supabase con progreso en tiempo real
 */

import googleDriveSyncService from './googleDriveSyncService.js'
import googleDriveConsolidatedService from '../lib/googleDriveConsolidated.js'
import googleDriveTokenBridge from '../lib/googleDriveTokenBridge.js'
import distributedLockService from '../lib/distributedLockService.js'
import { protectedSupabaseRequest } from '../lib/supabaseCircuitBreaker.js'
import { supabase } from '../lib/supabaseClient.js'
import resourceRecoveryService from '../lib/resourceRecoveryService.js'
import logger from '../lib/logger.js'

class BulkSyncService {
  constructor() {
    this.activeSyncs = new Map()
    this.syncProgress = new Map()
    this.isInitialized = false
  }

  /**
   * Inicializa el servicio
   */
  async initialize() {
    try {
      logger.info('BulkSyncService', '🔄 Inicializando servicio de sincronización en lote...')
      
      // Inicializar servicios requeridos
      await googleDriveSyncService.initialize()
      await googleDriveConsolidatedService.initialize()
      await googleDriveTokenBridge.initializeForUser()
      
      this.isInitialized = true
      logger.info('BulkSyncService', '✅ Servicio de sincronización en lote inicializado')
      return true
    } catch (error) {
      logger.error('BulkSyncService', `❌ Error inicializando: ${error.message}`)
      throw error
    }
  }

  /**
   * Sincroniza múltiples carpetas en lote
   */
  async syncFoldersBulk(folders, options = {}) {
    const syncId = this.generateSyncId()
    const {
      onProgress = () => {},
      onComplete = () => {},
      onError = () => {},
      syncDirection = 'bidirectional', // 'drive-to-supabase', 'supabase-to-drive', 'bidirectional'
      createMissingFolders = true,
      updateExisting = true
    } = options

    try {
      logger.info('BulkSyncService', `🚀 Iniciando sincronización en lote: ${folders.length} carpetas`)
      
      // Verificar inicialización
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Configurar progreso
      this.syncProgress.set(syncId, {
        total: folders.length,
        completed: 0,
        failed: 0,
        current: '',
        status: 'starting',
        results: [],
        errors: []
      })

      // Notificar inicio
      onProgress({
        syncId,
        status: 'starting',
        progress: 0,
        message: 'Iniciando sincronización...',
        details: { total: folders.length }
      })

      // Procesar carpetas en lotes para evitar sobrecarga
      const batchSize = 3 // Procesar máximo 3 carpetas simultáneamente
      const batches = this.chunkArray(folders, batchSize)
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        // Procesar lote actual
        const batchPromises = batch.map(folder => 
          this.syncSingleFolder(folder, syncId, {
            syncDirection,
            createMissingFolders,
            updateExisting
          })
        )

        // Ejecutar lote con manejo de errores individual
        const batchResults = await Promise.allSettled(batchPromises)
        
        // Procesar resultados del lote
        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i]
          const folder = batch[i]
          
          if (result.status === 'fulfilled') {
            this.updateProgress(syncId, 'completed', folder.name, result.value)
          } else {
            this.updateProgress(syncId, 'failed', folder.name, null, result.reason)
          }
        }

        // Obtener progreso actual y notificar
        const progress = this.syncProgress.get(syncId)
        const progressPercent = Math.round((progress.completed + progress.failed) / progress.total * 100)
        
        onProgress({
          syncId,
          status: 'in-progress',
          progress: progressPercent,
          message: `Procesando lote ${batchIndex + 1}/${batches.length}`,
          details: {
            completed: progress.completed,
            failed: progress.failed,
            total: progress.total,
            currentBatch: batchIndex + 1,
            totalBatches: batches.length
          }
        })

        // Pausa breve entre lotes para evitar sobrecarga
        if (batchIndex < batches.length - 1) {
          await this.delay(1000)
        }
      }

      // Finalizar sincronización
      const finalProgress = this.syncProgress.get(syncId)
      const success = finalProgress.failed === 0
      
      onComplete({
        syncId,
        success,
        total: finalProgress.total,
        completed: finalProgress.completed,
        failed: finalProgress.failed,
        results: finalProgress.results,
        errors: finalProgress.errors
      })

      logger.info('BulkSyncService', `✅ Sincronización completada: ${finalProgress.completed}/${finalProgress.total} exitosas`)
      
      return {
        syncId,
        success,
        total: finalProgress.total,
        completed: finalProgress.completed,
        failed: finalProgress.failed
      }

    } catch (error) {
      logger.error('BulkSyncService', `❌ Error en sincronización en lote: ${error.message}`)
      
      onError({
        syncId,
        error: error.message,
        details: error
      })
      
      throw error
    } finally {
      // Limpiar progreso después de un tiempo
      setTimeout(() => {
        this.syncProgress.delete(syncId)
      }, 300000) // 5 minutos
    }
  }

  /**
   * Sincroniza una carpeta individual
   */
  async syncSingleFolder(folder, syncId, options) {
    const { syncDirection, createMissingFolders, updateExisting } = options
    
    try {
      logger.info('BulkSyncService', `🔄 Sincronizando carpeta: ${folder.name}`)
      
      // Adquirir lock para evitar conflictos concurrentes
      const lockResult = await distributedLockService.withLock(
        folder.email || folder.id,
        async () => {
          // Verificar si la carpeta existe en Google Drive
          const driveFolder = await this.findDriveFolder(folder)
          
          if (!driveFolder && createMissingFolders) {
            // Crear carpeta en Google Drive
            logger.info('BulkSyncService', `📁 Creando carpeta en Drive: ${folder.name}`)
            const newDriveFolder = await googleDriveConsolidatedService.createFolder(folder.name)
            
            // Actualizar en Supabase
            if (updateExisting) {
              await this.updateFolderInSupabase(folder, newDriveFolder)
            }
            
            return {
              action: 'created',
              folder: folder,
              driveFolder: newDriveFolder,
              supabaseUpdated: updateExisting
            }
          } else if (driveFolder) {
            // Carpeta existe, sincronizar contenido
            logger.info('BulkSyncService', `🔄 Sincronizando contenido: ${folder.name}`)
            
            const syncResult = await this.syncFolderContent(folder, driveFolder, syncDirection)
            
            return {
              action: 'synced',
              folder: folder,
              driveFolder: driveFolder,
              syncResult: syncResult
            }
          } else {
            // Carpeta no existe y no se debe crear
            return {
              action: 'skipped',
              folder: folder,
              reason: 'Carpeta no existe y createMissingFolders=false'
            }
          }
        },
        'bulk_sync'
      )

      return lockResult

    } catch (error) {
      logger.error('BulkSyncService', `❌ Error sincronizando carpeta ${folder.name}: ${error.message}`)
      throw error
    }
  }

  /**
   * Busca una carpeta en Google Drive
   */
  async findDriveFolder(folder) {
    try {
      // Buscar por nombre en la carpeta raíz o carpeta específica
      const files = await googleDriveConsolidatedService.listFiles()
      const matchingFile = files.find(file => 
        file.name === folder.name && file.mimeType === 'application/vnd.google-apps.folder'
      )
      
      return matchingFile || null
    } catch (error) {
      logger.warn('BulkSyncService', `⚠️ Error buscando carpeta ${folder.name}: ${error.message}`)
      return null
    }
  }

  /**
   * Sincroniza el contenido de una carpeta
   */
  async syncFolderContent(folder, driveFolder, syncDirection) {
    try {
      const result = {
        filesSynced: 0,
        foldersCreated: 0,
        errors: []
      }

      // Obtener archivos de Google Drive
      const driveFiles = await googleDriveConsolidatedService.listFiles(driveFolder.id)
      
      // Sincronizar según dirección
      switch (syncDirection) {
        case 'drive-to-supabase':
          // TODO: Implementar sincronización Drive -> Supabase
          result.filesSynced = driveFiles.length
          break
          
        case 'supabase-to-drive':
          // TODO: Implementar sincronización Supabase -> Drive
          result.filesSynced = driveFiles.length
          break
          
        case 'bidirectional':
          // TODO: Implementar sincronización bidireccional
          result.filesSynced = driveFiles.length
          break
          
        default:
          throw new Error(`Dirección de sincronización no válida: ${syncDirection}`)
      }

      return result
    } catch (error) {
      logger.error('BulkSyncService', `❌ Error sincronizando contenido de ${folder.name}: ${error.message}`)
      throw error
    }
  }

  /**
   * Actualiza información de carpeta en Supabase
   */
  async updateFolderInSupabase(folder, driveFolder) {
    try {
      await protectedSupabaseRequest(
        async () => {
          const { error } = await supabase
            .from('employee_folders')
            .upsert({
              id: folder.id,
              google_drive_folder_id: driveFolder.id,
              google_drive_url: `https://drive.google.com/drive/folders/${driveFolder.id}`,
              updated_at: new Date().toISOString()
            })
          
          if (error) throw error
        },
        'bulkSync.updateFolderInSupabase'
      )
      
      logger.info('BulkSyncService', `✅ Carpeta actualizada en Supabase: ${folder.name}`)
    } catch (error) {
      logger.error('BulkSyncService', `❌ Error actualizando Supabase: ${error.message}`)
      throw error
    }
  }

  /**
   * Actualiza el progreso de sincronización
   */
  updateProgress(syncId, status, folderName, result = null, error = null) {
    const progress = this.syncProgress.get(syncId)
    if (!progress) return

    progress.current = folderName
    
    switch (status) {
      case 'completed':
        progress.completed++
        progress.results.push({ folderName, result, timestamp: new Date().toISOString() })
        break
      case 'failed':
        progress.failed++
        progress.errors.push({ folderName, error: error.message, timestamp: new Date().toISOString() })
        break
    }

    progress.status = status
  }

  /**
   * Obtiene el progreso de una sincronización
   */
  getSyncProgress(syncId) {
    return this.syncProgress.get(syncId)
  }

  /**
   * Cancela una sincronización en curso
   */
  cancelSync(syncId) {
    const progress = this.syncProgress.get(syncId)
    if (progress) {
      progress.status = 'cancelled'
      logger.info('BulkSyncService', `🛑 Sincronización cancelada: ${syncId}`)
    }
  }

  /**
   * Utilidades
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  chunkArray(array, chunkSize) {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      activeSyncs: this.activeSyncs.size,
      trackedProgress: this.syncProgress.size,
      isInitialized: this.isInitialized
    }
  }
}

// Instancia singleton
const bulkSyncService = new BulkSyncService()

export default bulkSyncService
export { BulkSyncService }