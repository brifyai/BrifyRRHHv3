/**
 * Servicio de Verificación de Estado de Empresa
 * 
 * Este servicio verifica si una empresa está activa antes de permitir
 * operaciones de comunicación (WhatsApp, Email, SMS, Telegram, etc.)
 * 
 * Funcionalidades:
 * - Verificar estado de empresa antes de comunicaciones
 * - Bloquear automáticamente empresas inactivas
 * - Logging de intentos de comunicación bloqueados
 * - Cache de estados para mejor rendimiento
 */

import { supabase } from '../lib/supabase.js'
import logger from '../lib/logger.js'

class CompanyStatusVerificationService {
  constructor() {
    this.statusCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutos
  }

  /**
   * Verificar si una empresa está activa y puede recibir comunicaciones
   * @param {number} companyId - ID de la empresa
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async isCompanyActive(companyId) {
    const cacheKey = `company_status_${companyId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, status, created_at, updated_at')
        .eq('id', companyId)
        .single()

      if (error) {
        logger.error('CompanyStatusVerificationService', `Error verificando empresa ${companyId}: ${error.message}`)
        return {
          isActive: false,
          company: null,
          reason: 'Error verificando empresa',
          error: error.message
        }
      }

      if (!company) {
        logger.warn('CompanyStatusVerificationService', `Empresa ${companyId} no encontrada`)
        return {
          isActive: false,
          company: null,
          reason: 'Empresa no encontrada'
        }
      }

      const isActive = company.status === 'active'
      const result = {
        isActive,
        company,
        reason: isActive ? 'Empresa activa' : `Empresa inactiva (status: ${company.status})`,
        timestamp: new Date().toISOString()
      }

      // Log del resultado
      if (isActive) {
        logger.info('CompanyStatusVerificationService', `✅ Empresa activa: ${company.name} (${companyId})`)
      } else {
        logger.warn('CompanyStatusVerificationService', `🚫 Empresa inactiva bloqueada: ${company.name} (${companyId}) - Status: ${company.status}`)
      }

      // Cache del resultado
      this.setCache(cacheKey, result)
      return result

    } catch (error) {
      logger.error('CompanyStatusVerificationService', `Error inesperado verificando empresa ${companyId}:`, error)
      return {
        isActive: false,
        company: null,
        reason: 'Error interno del sistema',
        error: error.message
      }
    }
  }

  /**
   * Verificar múltiples empresas de forma eficiente
   * @param {Array<number>} companyIds - Array de IDs de empresas
   * @returns {Promise<Object>} Resultados de verificación por empresa
   */
  async areCompaniesActive(companyIds) {
    const results = {}
    
    try {
      // Consulta batch para mejor rendimiento
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .in('id', companyIds)

      if (error) {
        logger.error('CompanyStatusVerificationService', `Error en verificación batch: ${error.message}`)
        throw error
      }

      // Crear mapa de resultados
      const companyMap = new Map(companies?.map(c => [c.id, c]) || [])

      for (const companyId of companyIds) {
        const company = companyMap.get(companyId)
        if (company) {
          const isActive = company.status === 'active'
          results[companyId] = {
            isActive,
            company,
            reason: isActive ? 'Empresa activa' : `Empresa inactiva (status: ${company.status})`
          }
        } else {
          results[companyId] = {
            isActive: false,
            company: null,
            reason: 'Empresa no encontrada'
          }
        }
      }

      logger.info('CompanyStatusVerificationService', `Verificación batch completada: ${Object.values(results).filter(r => r.isActive).length}/${companyIds.length} empresas activas`)
      return results

    } catch (error) {
      logger.error('CompanyStatusVerificationService', `Error en verificación batch:`, error)
      
      // Retornar resultados de error para todas las empresas
      const errorResults = {}
      for (const companyId of companyIds) {
        errorResults[companyId] = {
          isActive: false,
          company: null,
          reason: 'Error en verificación batch',
          error: error.message
        }
      }
      return errorResults
    }
  }

  /**
   * Registrar intento de comunicación bloqueado
   * @param {number} companyId - ID de la empresa
   * @param {string} communicationType - Tipo de comunicación (whatsapp, email, sms, telegram)
   * @param {Object} additionalData - Datos adicionales del intento
   */
  async logBlockedCommunication(companyId, communicationType, additionalData = {}) {
    try {
      await supabase
        .from('communication_blocked_logs')
        .insert({
          company_id: companyId,
          communication_type: communicationType,
          blocked_at: new Date().toISOString(),
          user_agent: additionalData.userAgent || null,
          ip_address: additionalData.ipAddress || null,
          additional_data: additionalData
        })

      logger.warn('CompanyStatusVerificationService', `🚫 Comunicación bloqueada - Empresa: ${companyId}, Tipo: ${communicationType}`)
    } catch (error) {
      logger.error('CompanyStatusVerificationService', `Error registrando comunicación bloqueada:`, error)
    }
  }

  /**
   * Obtener estadísticas de empresas bloqueadas
   * @param {number} companyId - ID de la empresa (opcional)
   * @param {number} days - Días hacia atrás para las estadísticas
   * @returns {Promise<Object>} Estadísticas de bloqueos
   */
  async getBlockedCommunicationsStats(companyId = null, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('communication_blocked_logs')
        .select('*')
        .gte('blocked_at', startDate.toISOString())

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data: logs, error } = await query.order('blocked_at', { ascending: false })

      if (error) throw error

      // Procesar estadísticas
      const stats = {
        totalBlocked: logs?.length || 0,
        byType: {},
        byDay: {},
        recentBlocks: logs?.slice(0, 10) || []
      }

      logs?.forEach(log => {
        // Por tipo
        if (!stats.byType[log.communication_type]) {
          stats.byType[log.communication_type] = 0
        }
        stats.byType[log.communication_type]++

        // Por día
        const day = log.blocked_at.split('T')[0]
        if (!stats.byDay[day]) {
          stats.byDay[day] = 0
        }
        stats.byDay[day]++
      })

      return stats

    } catch (error) {
      logger.error('CompanyStatusVerificationService', `Error obteniendo estadísticas:`, error)
      return {
        totalBlocked: 0,
        byType: {},
        byDay: {},
        recentBlocks: []
      }
    }
  }

  /**
   * Limpiar cache de estado de empresas
   * @param {number} companyId - ID específico (opcional)
   */
  clearStatusCache(companyId = null) {
    if (companyId) {
      this.statusCache.delete(`company_status_${companyId}`)
    } else {
      this.statusCache.clear()
    }
    logger.info('CompanyStatusVerificationService', `Cache de estado limpiado${companyId ? ` para empresa ${companyId}` : ''}`)
  }

  /**
   * Obtener todas las empresas activas (para uso en dropdowns, etc.)
   * @returns {Promise<Array>} Lista de empresas activas
   */
  async getActiveCompanies() {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (error) throw error

      return companies || []

    } catch (error) {
      logger.error('CompanyStatusVerificationService', `Error obteniendo empresas activas:`, error)
      return []
    }
  }

  /**
   * Métodos de cache interno
   */
  getFromCache(key) {
    const cached = this.statusCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.statusCache.delete(key)
    return null
  }

  setCache(key, data) {
    this.statusCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}

// Crear instancia global del servicio
const companyStatusVerificationService = new CompanyStatusVerificationService()

export default companyStatusVerificationService