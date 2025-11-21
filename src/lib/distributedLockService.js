/**
 * Sistema de Locks Distribuidos para Google Drive
 * Previene race conditions en la creación de carpetas
 */

import { supabase } from '../lib/supabaseClient.js'
import logger from './logger.js'

class DistributedLockService {
  constructor() {
    this.lockPrefix = 'folder_creation_lock_'
    this.lockTimeout = 5 * 60 * 1000 // 5 minutos timeout
    this.retryDelay = 100 // 100ms entre intentos
    this.maxRetries = 10
  }

  /**
   * Adquiere un lock para un empleado específico
   * @param {string} employeeEmail - Email del empleado
   * @param {string} operation - Tipo de operación
   * @returns {Promise<string>} - ID del lock adquirido
   */
  async acquireLock(employeeEmail, operation = 'create_folder') {
    const lockKey = `${this.lockPrefix}${employeeEmail}`
    const lockId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + this.lockTimeout).toISOString()

    logger.info('DistributedLockService', `🔒 Intentando adquirir lock para ${employeeEmail}: ${lockId}`)

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Verificar si existe un lock activo
        const { data: existingLock } = await supabase
          .from('operation_locks')
          .select('*')
          .eq('lock_key', lockKey)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()

        if (existingLock) {
          logger.warn('DistributedLockService', `⚠️ Lock activo encontrado para ${employeeEmail}: ${existingLock.lock_id}`)
          
          if (attempt === this.maxRetries) {
            throw new Error(`Lock activo no puede ser liberado después de ${this.maxRetries} intentos`)
          }
          
          // Esperar antes del siguiente intento
          await this.delay(this.retryDelay * attempt)
          continue
        }

        // Adquirir nuevo lock
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
          logger.error('DistributedLockService', `❌ Error adquiriendo lock: ${error.message}`)
          if (attempt === this.maxRetries) {
            throw error
          }
          await this.delay(this.retryDelay * attempt)
          continue
        }

        logger.info('DistributedLockService', `✅ Lock adquirido exitosamente: ${lockId}`)
        return lockId

      } catch (error) {
        logger.error('DistributedLockService', `❌ Error en intento ${attempt}: ${error.message}`)
        if (attempt === this.maxRetries) {
          throw error
        }
        await this.delay(this.retryDelay * attempt)
      }
    }
  }

  /**
   * Libera un lock adquirido
   * @param {string} lockId - ID del lock a liberar
   */
  async releaseLock(lockId) {
    try {
      logger.info('DistributedLockService', `🔓 Liberando lock: ${lockId}`)
      
      const { error } = await supabase
        .from('operation_locks')
        .update({
          is_active: false,
          released_at: new Date().toISOString()
        })
        .eq('lock_id', lockId)

      if (error) {
        logger.error('DistributedLockService', `❌ Error liberando lock: ${error.message}`)
        throw error
      }

      logger.info('DistributedLockService', `✅ Lock liberado: ${lockId}`)
    } catch (error) {
      logger.error('DistributedLockService', `❌ Error liberando lock ${lockId}: ${error.message}`)
      throw error
    }
  }

  /**
   * Limpia locks expirados
   */
  async cleanupExpiredLocks() {
    try {
      logger.info('DistributedLockService', '🧹 Limpiando locks expirados...')
      
      const { error } = await supabase
        .from('operation_locks')
        .update({
          is_active: false,
          released_at: new Date().toISOString()
        })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)

      if (error) {
        logger.error('DistributedLockService', `❌ Error limpiando locks: ${error.message}`)
        throw error
      }

      logger.info('DistributedLockService', '✅ Locks expirados limpiados')
    } catch (error) {
      logger.error('DistributedLockService', `❌ Error en cleanup: ${error.message}`)
      throw error
    }
  }

  /**
   * Verifica si un empleado tiene un lock activo
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<boolean>}
   */
  async hasActiveLock(employeeEmail) {
    try {
      const lockKey = `${this.lockPrefix}${employeeEmail}`
      
      const { data, error } = await supabase
        .from('operation_locks')
        .select('*')
        .eq('lock_key', lockKey)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (error) {
        logger.error('DistributedLockService', `❌ Error verificando lock: ${error.message}`)
        return false
      }

      return !!data
    } catch (error) {
      logger.error('DistributedLockService', `❌ Error verificando lock para ${employeeEmail}: ${error.message}`)
      return false
    }
  }

  /**
   * Ejecuta una función con lock automático
   * @param {string} employeeEmail - Email del empleado
   * @param {Function} fn - Función a ejecutar
   * @param {string} operation - Tipo de operación
   */
  async withLock(employeeEmail, fn, operation = 'create_folder') {
    let lockId = null
    try {
      lockId = await this.acquireLock(employeeEmail, operation)
      return await fn()
    } catch (error) {
      logger.error('DistributedLockService', `❌ Error en withLock para ${employeeEmail}: ${error.message}`)
      throw error
    } finally {
      if (lockId) {
        await this.releaseLock(lockId)
      }
    }
  }

  /**
   * Utilidad para delays
   * @param {number} ms - Milisegundos a esperar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtiene estadísticas de locks
   */
  async getLockStats() {
    try {
      const { data: activeLocks } = await supabase
        .from('operation_locks')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      const { data: expiredLocks } = await supabase
        .from('operation_locks')
        .select('*')
        .lt('expires_at', new Date().toISOString())

      return {
        active: activeLocks?.length || 0,
        expired: expiredLocks?.length || 0,
        total: (activeLocks?.length || 0) + (expiredLocks?.length || 0)
      }
    } catch (error) {
      logger.error('DistributedLockService', `❌ Error obteniendo estadísticas: ${error.message}`)
      return { active: 0, expired: 0, total: 0 }
    }
  }
}

// Instancia singleton
const distributedLockService = new DistributedLockService()

export default distributedLockService
export { DistributedLockService }