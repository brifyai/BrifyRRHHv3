/**
 * Company Credentials Setup Service
 * Sistema para configurar credenciales iniciales de empresas existentes
 * Soluciona el problema sistémico de empresas sin credenciales
 */

import { supabase } from '../lib/supabase.js'
import googleDriveAuthServiceDynamic from '../lib/googleDriveAuthServiceDynamic.js'
import logger from '../lib/logger.js'

class CompanyCredentialsSetupService {
  constructor() {
    this.setupQueue = new Map()
    this.isProcessing = false
  }

  /**
   * Detecta empresas que necesitan configuración inicial
   */
  async detectCompaniesNeedingSetup() {
    try {
      logger.info('CompanyCredentialsSetupService', '🔍 Detectando empresas que necesitan configuración...')

      // Obtener todas las empresas activas
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name')

      if (companiesError) {
        throw companiesError
      }

      if (!companies || companies.length === 0) {
        logger.info('CompanyCredentialsSetupService', 'ℹ️ No hay empresas activas')
        return []
      }

      logger.info('CompanyCredentialsSetupService', `📊 Analizando ${companies.length} empresas...`)

      const companiesNeedingSetup = []

      // Verificar cada empresa
      for (const company of companies) {
        try {
          // Verificar si tiene credenciales de Google Drive
          const { data: credentials, error } = await supabase.rpc('get_company_credentials', {
            p_company_id: company.id,
            p_integration_type: 'google_drive'
          })

          if (error) {
            logger.warn('CompanyCredentialsSetupService', `⚠️ Error verificando credenciales para ${company.name}: ${error.message}`)
            continue
          }

          const hasCredentials = credentials && credentials.length > 0

          if (!hasCredentials) {
            companiesNeedingSetup.push({
              ...company,
              needsSetup: true,
              reason: 'No tiene credenciales de Google Drive configuradas',
              priority: this.calculateSetupPriority(company)
            })
            logger.info('CompanyCredentialsSetupService', `⚠️ ${company.name} necesita configuración`)
          } else {
            logger.info('CompanyCredentialsSetupService', `✅ ${company.name} ya tiene credenciales`)
          }
        } catch (companyError) {
          logger.error('CompanyCredentialsSetupService', `❌ Error procesando empresa ${company.name}: ${companyError.message}`)
        }
      }

      // Ordenar por prioridad
      companiesNeedingSetup.sort((a, b) => b.priority - a.priority)

      logger.info('CompanyCredentialsSetupService', `📋 ${companiesNeedingSetup.length} empresas necesitan configuración inicial`)
      
      return companiesNeedingSetup
    } catch (error) {
      logger.error('CompanyCredentialsSetupService', `❌ Error detectando empresas: ${error.message}`)
      throw error
    }
  }

  /**
   * Calcula prioridad de configuración (empresas más grandes primero)
   */
  calculateSetupPriority(company) {
    // Prioridad basada en nombre (empresas conocidas primero)
    const highPriorityNames = ['Falabella', 'Banco de Chile', 'Banco Santander', 'Cencosud', 'Codelco']
    const mediumPriorityNames = ['BHP', 'Entel', 'Movistar', 'Enel', 'Latam Airlines']
    
    if (highPriorityNames.includes(company.name)) return 100
    if (mediumPriorityNames.includes(company.name)) return 75
    
    return 50
  }

  /**
   * Inicia configuración masiva para todas las empresas que lo necesiten
   */
  async startBulkSetup() {
    try {
      if (this.isProcessing) {
        throw new Error('Ya hay un proceso de configuración en curso')
      }

      this.isProcessing = true
      logger.info('CompanyCredentialsSetupService', '🚀 Iniciando configuración masiva...')

      const companiesNeedingSetup = await this.detectCompaniesNeedingSetup()

      if (companiesNeedingSetup.length === 0) {
        logger.info('CompanyCredentialsSetupService', '✅ Todas las empresas ya tienen configuración')
        return {
          success: true,
          message: 'No hay empresas que necesiten configuración',
          processed: 0,
          errors: 0
        }
      }

      const results = {
        success: true,
        processed: 0,
        errors: 0,
        details: []
      }

      // Procesar cada empresa
      for (const company of companiesNeedingSetup) {
        try {
          logger.info('CompanyCredentialsSetupService', `🔧 Configurando ${company.name}...`)
          
          const companyResult = await this.setupCompanyCredentials(company)
          
          results.processed++
          results.details.push({
            companyId: company.id,
            companyName: company.name,
            success: true,
            message: 'Configuración completada'
          })

          logger.info('CompanyCredentialsSetupService', `✅ ${company.name} configurada exitosamente`)
          
          // Pausa entre configuraciones para evitar sobrecarga
          await this.delay(1000)
          
        } catch (companyError) {
          results.errors++
          results.details.push({
            companyId: company.id,
            companyName: company.name,
            success: false,
            error: companyError.message
          })

          logger.error('CompanyCredentialsSetupService', `❌ Error configurando ${company.name}: ${companyError.message}`)
        }
      }

      logger.info('CompanyCredentialsSetupService', `📊 Configuración masiva completada: ${results.processed} exitosas, ${results.errors} errores`)
      
      return results
    } catch (error) {
      logger.error('CompanyCredentialsSetupService', `❌ Error en configuración masiva: ${error.message}`)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Configura credenciales para una empresa específica
   */
  async setupCompanyCredentials(company) {
    try {
      logger.info('CompanyCredentialsSetupService', `🔧 Configurando credenciales para ${company.name}...`)

      // Crear credencial de ejemplo/temporal para activar el sistema
      const exampleCredential = {
        company_id: company.id,
        integration_type: 'google_drive',
        account_name: `${company.name} - Cuenta Principal`,
        status: 'pending_setup', // Estado especial para indicar que necesita configuración real
        credentials: {
          needsConfiguration: true,
          setupRequired: true,
          configuredAt: null
        },
        settings: {
          isInitialSetup: true,
          requiresManualConfiguration: true,
          setupInstructions: 'Esta empresa necesita configurar credenciales reales de Google Drive'
        },
        account_email: null,
        account_display_name: `${company.name} Admin`,
        expires_at: null
      }

      const { data, error } = await supabase
        .from('company_credentials')
        .insert(exampleCredential)
        .select()
        .single()

      if (error) {
        throw error
      }

      logger.info('CompanyCredentialsSetupService', `✅ Credencial inicial creada para ${company.name}`)
      
      return {
        success: true,
        credentialId: data.id,
        message: 'Configuración inicial completada'
      }
    } catch (error) {
      logger.error('CompanyCredentialsSetupService', `❌ Error configurando ${company.name}: ${error.message}`)
      throw error
    }
  }

  /**
   * Obtiene empresas que necesitan configuración manual
   */
  async getCompaniesRequiringManualSetup() {
    try {
      const { data, error } = await supabase
        .from('company_credentials')
        .select(`
          id,
          company_id,
          account_name,
          status,
          settings,
          companies (
            id,
            name
          )
        `)
        .eq('integration_type', 'google_drive')
        .eq('status', 'pending_setup')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('CompanyCredentialsSetupService', `❌ Error obteniendo empresas que requieren setup manual: ${error.message}`)
      throw error
    }
  }

  /**
   * Completa la configuración real de una empresa
   */
  async completeCompanySetup(credentialId, realCredentials) {
    try {
      logger.info('CompanyCredentialsSetupService', `🔧 Completando configuración real para credencial ${credentialId}...`)

      const { data, error } = await supabase
        .from('company_credentials')
        .update({
          status: 'active',
          credentials: {
            access_token: realCredentials.access_token,
            refresh_token: realCredentials.refresh_token,
            expires_at: realCredentials.expires_at,
            expires_in: realCredentials.expires_in,
            configuredAt: new Date().toISOString()
          },
          settings: {
            isInitialSetup: false,
            requiresManualConfiguration: false,
            configuredAt: new Date().toISOString()
          },
          account_email: realCredentials.account_email,
          account_display_name: realCredentials.account_display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentialId)
        .select()
        .single()

      if (error) {
        throw error
      }

      logger.info('CompanyCredentialsSetupService', `✅ Configuración real completada para credencial ${credentialId}`)
      
      return {
        success: true,
        credential: data,
        message: 'Configuración completada exitosamente'
      }
    } catch (error) {
      logger.error('CompanyCredentialsSetupService', `❌ Error completando configuración: ${error.message}`)
      throw error
    }
  }

  /**
   * Obtiene estadísticas del sistema de configuración
   */
  async getSetupStatistics() {
    try {
      // Contar empresas totales
      const { count: totalCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Contar empresas con credenciales
      const { count: companiesWithCredentials } = await supabase
        .from('company_credentials')
        .select('company_id', { count: 'exact', head: true })
        .eq('integration_type', 'google_drive')
        .eq('status', 'active')

      // Contar empresas pendientes de setup
      const { count: companiesPendingSetup } = await supabase
        .from('company_credentials')
        .select('company_id', { count: 'exact', head: true })
        .eq('integration_type', 'google_drive')
        .eq('status', 'pending_setup')

      const companiesWithoutCredentials = (totalCompanies || 0) - (companiesWithCredentials || 0)

      return {
        totalCompanies: totalCompanies || 0,
        companiesWithCredentials: companiesWithCredentials || 0,
        companiesWithoutCredentials: companiesWithoutCredentials,
        companiesPendingSetup: companiesPendingSetup || 0,
        setupProgress: totalCompanies > 0 ? ((companiesWithCredentials || 0) / totalCompanies * 100).toFixed(1) : 0
      }
    } catch (error) {
      logger.error('CompanyCredentialsSetupService', `❌ Error obteniendo estadísticas: ${error.message}`)
      throw error
    }
  }

  /**
   * Utilidad para delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Verifica si el servicio está procesando
   */
  isCurrentlyProcessing() {
    return this.isProcessing
  }
}

// Instancia singleton
const companyCredentialsSetupService = new CompanyCredentialsSetupService()

export default companyCredentialsSetupService
export { CompanyCredentialsSetupService }