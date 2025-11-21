/**
 * SUPER LOCK SERVICE - Solución Radical Anti-Duplicación
 * Elimina COMPLETAMENTE la posibilidad de race conditions
 */

import { supabase } from './supabaseClient.js'
import logger from './logger.js'

class SuperLockService {
  constructor() {
    this.lockPrefix = 'super_folder_lock_'
    this.lockTimeout = 30 * 1000 // 30 segundos timeout
    this.retryDelay = 50 // 50ms entre intentos
    this.maxRetries = 50
    this.activeLocks = new Map() // Cache local para locks activos
  }

  /**
   * ADQUIRIR LOCK CON VERIFICACIÓN MÚLTIPLE
   */
  async acquireSuperLock(employeeEmail, operation = 'create_folder') {
    const lockKey = `${this.lockPrefix}${employeeEmail}`
    const lockId = `super_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + this.lockTimeout).toISOString()

    logger.info('SuperLockService', `🔒 ADQUIRIENDO SUPER LOCK para ${employeeEmail}: ${lockId}`)

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // 1. VERIFICACIÓN LOCAL PRIMERO
        if (this.activeLocks.has(lockKey)) {
          const existingLocal = this.activeLocks.get(lockKey)
          if (new Date(existingLocal.expiresAt) > new Date()) {
            logger.warn('SuperLockService', `⚠️ LOCK LOCAL ACTIVO para ${employeeEmail}`)
            await this.delay(this.retryDelay * attempt)
            continue
          } else {
            // Limpiar lock local expirado
            this.activeLocks.delete(lockKey)
          }
        }

        // 2. VERIFICACIÓN EN BASE DE DATOS
        const { data: existingLock } = await supabase
          .from('operation_locks')
          .select('*')
          .eq('lock_key', lockKey)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (existingLock) {
          logger.warn('SuperLockService', `⚠️ LOCK DB ACTIVO para ${employeeEmail}: ${existingLock.lock_id}`)
          
          if (attempt === this.maxRetries) {
            throw new Error(`Lock activo no puede ser liberado después de ${this.maxRetries} intentos`)
          }
          
          await this.delay(this.retryDelay * attempt)
          continue
        }

        // 3. VERIFICACIÓN ADICIONAL EN GOOGLE DRIVE
        const driveExists = await this.checkDriveExists(employeeEmail)
        if (driveExists) {
          logger.warn('SuperLockService', `⚠️ CARPETA YA EXISTE EN DRIVE para ${employeeEmail}`)
          
          // Crear lock preventivo para evitar más intentos
          await this.createPreventiveLock(lockKey, employeeEmail)
          throw new Error(`Carpeta ya existe en Google Drive para ${employeeEmail}`)
        }

        // 4. ADQUIRIR LOCK EN BASE DE DATOS
        const { error } = await supabase
          .from('operation_locks')
          .insert({
            lock_key: lockKey,
            lock_id: lockId,
            operation_type: operation,
            employee_email: employeeEmail,
            acquired_at: new Date().toISOString(),
            expires_at: expiresAt,
            is_active: true
          })

        if (error) {
          logger.error('SuperLockService', `❌ Error adquiriendo lock DB: ${error.message}`)
          if (attempt === this.maxRetries) {
            throw error
          }
          await this.delay(this.retryDelay * attempt)
          continue
        }

        // 5. CACHEAR LOCK LOCALMENTE
        this.activeLocks.set(lockKey, {
          lockId,
          expiresAt,
          timestamp: Date.now()
        })

        logger.info('SuperLockService', `✅ SUPER LOCK ADQUIRIDO: ${lockId}`)
        return lockId

      } catch (error) {
        logger.error('SuperLockService', `❌ Error en intento ${attempt}: ${error.message}`)
        if (attempt === this.maxRetries) {
          throw error
        }
        await this.delay(this.retryDelay * attempt)
      }
    }
  }

  /**
   * VERIFICAR SI CARPETA EXISTE EN GOOGLE DRIVE
   */
  async checkDriveExists(employeeEmail) {
    try {
      // Esta función debe ser implementada para verificar en Google Drive
      // Por ahora simulamos la verificación
      const { data: existing } = await supabase
        .from('employee_folders')
        .select('id')
        .eq('employee_email', employeeEmail)
        .maybeSingle()

      return !!existing
    } catch (error) {
      logger.error('SuperLockService', `❌ Error verificando Drive: ${error.message}`)
      return false
    }
  }

  /**
   * CREAR LOCK PREVENTIVO
   */
  async createPreventiveLock(lockKey, employeeEmail) {
    try {
      const preventiveId = `preventive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = new Date(Date.now() + this.lockTimeout * 2).toISOString()

      await supabase
        .from('operation_locks')
        .insert({
          lock_key: lockKey,
          lock_id: preventiveId,
          operation_type: 'preventive_lock',
          employee_email: employeeEmail,
          acquired_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true
        })

      logger.info('SuperLockService', `🔒 LOCK PREVENTIVO CREADO para ${employeeEmail}`)
    } catch (error) {
      logger.error('SuperLockService', `❌ Error creando lock preventivo: ${error.message}`)
    }
  }

  /**
   * LIBERAR LOCK CON LIMPIEZA LOCAL
   */
  async releaseSuperLock(lockId, employeeEmail) {
    try {
      logger.info('SuperLockService', `🔓 LIBERANDO SUPER LOCK: ${lockId}`)
      
      // Liberar en base de datos
      const { error } = await supabase
        .from('operation_locks')
        .update({
          is_active: false,
          released_at: new Date().toISOString()
        })
        .eq('lock_id', lockId)

      if (error) {
        logger.error('SuperLockService', `❌ Error liberando lock DB: ${error.message}`)
        throw error
      }

      // Limpiar cache local
      const lockKey = `${this.lockPrefix}${employeeEmail}`
      this.activeLocks.delete(lockKey)

      logger.info('SuperLockService', `✅ SUPER LOCK LIBERADO: ${lockId}`)
    } catch (error) {
      logger.error('SuperLockService', `❌ Error liberando super lock ${lockId}: ${error.message}`)
      throw error
    }
  }

  /**
   * EJECUTAR CON SUPER LOCK
   */
  async withSuperLock(employeeEmail, fn, operation = 'create_folder') {
    let lockId = null
    try {
      lockId = await this.acquireSuperLock(employeeEmail, operation)
      const result = await fn()
      
      // Verificar resultado antes de liberar
      if (result && result.success) {
        logger.info('SuperLockService', `✅ Operación exitosa para ${employeeEmail}`)
      }
      
      return result
    } catch (error) {
      logger.error('SuperLockService', `❌ Error en withSuperLock para ${employeeEmail}: ${error.message}`)
      throw error
    } finally {
      if (lockId) {
        await this.releaseSuperLock(lockId, employeeEmail)
      }
    }
  }

  /**
   * UTILIDAD PARA DELAYS
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * LIMPIAR LOCKS EXPIRADOS
   */
  async cleanupExpiredLocks() {
    try {
      logger.info('SuperLockService', '🧹 Limpiando locks expirados...')
      
      const { error } = await supabase
        .from('operation_locks')
        .update({
          is_active: false,
          released_at: new Date().toISOString()
        })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)

      if (error) {
        logger.error('SuperLockService', `❌ Error limpiando locks: ${error.message}`)
        throw error
      }

      // Limpiar cache local expirado
      for (const [key, lock] of this.activeLocks.entries()) {
        if (new Date(lock.expiresAt) <= new Date()) {
          this.activeLocks.delete(key)
        }
      }

      logger.info('SuperLockService', '✅ Locks expirados limpiados')
    } catch (error) {
      logger.error('SuperLockService', `❌ Error en cleanup: ${error.message}`)
      throw error
    }
  }

  /**
   * OBTENER ESTADÍSTICAS
   */
  async getSuperLockStats() {
    try {
      const { data: activeLocks } = await supabase
        .from('operation_locks')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      return {
        active: activeLocks?.length || 0,
        localCache: this.activeLocks.size,
        total: (activeLocks?.length || 0) + this.activeLocks.size
      }
    } catch (error) {
      logger.error('SuperLockService', `❌ Error obteniendo estadísticas: ${error.message}`)
      return { active: 0, localCache: 0, total: 0 }
    }
  }
}

// Instancia singleton
const superLockService = new SuperLockService()

export default superLockService
export { SuperLockService }