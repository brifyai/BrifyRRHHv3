/**
 * Base Multi-Account Manager
 * Clase base abstracta para implementar soporte multi-cuenta en cualquier servicio
 */
export class BaseMultiAccountManager {
  constructor(serviceName) {
    this.serviceName = serviceName
    this.sessions = new Map() // Map<companyId, sessionData>
    this.supabase = null
    this.initialized = false
  }

  /**
   * Inicializar el manager con cliente Supabase
   */
  async initialize(supabaseClient = null, companyId = null) {
    try {
      if (supabaseClient) {
        this.supabase = supabaseClient
      } else {
        const { supabase } = await import('./supabase.js')
        this.supabase = supabase
      }

      if (!this.supabase) {
        throw new Error('No se pudo inicializar cliente Supabase')
      }

      this.initialized = true

      if (companyId) {
        await this.loadCompanyCredentials(companyId)
      }

      return true
    } catch (error) {
      console.error(`[${this.serviceName}] Error initializing:`, error.message)
      this.initialized = false
      return false
    }
  }

  /**
   * Cargar credenciales de una empresa específica
   */
  async loadCompanyCredentials(companyId) {
    try {
      if (!this.initialized) {
        throw new Error('Manager no inicializado')
      }

      const { data, error } = await this.supabase
        .from('company_credentials')
        .select('*')
        .eq('company_id', companyId)
        .eq('integration_type', this.serviceName)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Error loading credentials: ${error.message}`)
      }

      // Guardar credenciales en sesión
      if (data && data.length > 0) {
        this.sessions.set(companyId, {
          credentials: data,
          currentCredential: data[0]
        })
      }

      return data || []
    } catch (error) {
      console.error(`[${this.serviceName}] Error loading company credentials:`, error.message)
      return []
    }
  }

  /**
   * Guardar credenciales para una empresa
   */
  async saveCredentials(companyId, credentials, accountName = 'Cuenta Principal') {
    try {
      if (!this.initialized) {
        throw new Error('Manager no inicializado')
      }

      const credentialData = {
        company_id: companyId,
        integration_type: this.serviceName,
        credentials: credentials,
        account_name: accountName,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('company_credentials')
        .insert([credentialData])
        .select()
        .single()

      if (error) {
        throw new Error(`Error saving credentials: ${error.message}`)
      }

      // Actualizar sesión
      if (!this.sessions.has(companyId)) {
        this.sessions.set(companyId, { credentials: [], currentCredential: null })
      }

      const session = this.sessions.get(companyId)
      session.credentials.push(data)
      session.currentCredential = data

      return data
    } catch (error) {
      console.error(`[${this.serviceName}] Error saving credentials:`, error.message)
      return null
    }
  }

  /**
   * Actualizar credenciales existentes
   */
  async updateCredentials(credentialId, updates) {
    try {
      if (!this.initialized) {
        throw new Error('Manager no inicializado')
      }

      const { data, error } = await this.supabase
        .from('company_credentials')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentialId)
        .select()
        .single()

      if (error) {
        throw new Error(`Error updating credentials: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error(`[${this.serviceName}] Error updating credentials:`, error.message)
      return null
    }
  }

  /**
   * Desactivar credenciales (en lugar de eliminar)
   */
  async deactivateCredentials(credentialId) {
    try {
      if (!this.initialized) {
        throw new Error('Manager no inicializado')
      }

      const { data, error } = await this.supabase
        .from('company_credentials')
        .update({ status: 'inactive' })
        .eq('id', credentialId)

      if (error) {
        throw new Error(`Error deactivating credentials: ${error.message}`)
      }

      // Limpiar sesión
      for (const [companyId, session] of this.sessions.entries()) {
        if (session.currentCredential?.id === credentialId) {
          session.currentCredential = null
        }
        session.credentials = session.credentials.filter(c => c.id !== credentialId)
      }

      return true
    } catch (error) {
      console.error(`[${this.serviceName}] Error deactivating credentials:`, error.message)
      return false
    }
  }

  /**
   * Seleccionar credencial activa para una empresa
   */
  async selectCredential(companyId, credentialId) {
    try {
      if (!this.initialized) {
        throw new Error('Manager no inicializado')
      }

      const session = this.sessions.get(companyId)
      if (!session) {
        throw new Error('No hay sesión para esta empresa')
      }

      const credential = session.credentials.find(c => c.id === credentialId)
      if (!credential) {
        throw new Error('Credencial no encontrada')
      }

      session.currentCredential = credential
      return true
    } catch (error) {
      console.error(`[${this.serviceName}] Error selecting credential:`, error.message)
      return false
    }
  }

  /**
   * Obtener credenciales disponibles para una empresa
   */
  getAvailableCredentials(companyId) {
    const session = this.sessions.get(companyId)
    return session?.credentials || []
  }

  /**
   * Verificar si hay una sesión activa para la empresa
   */
  isAuthenticated(companyId) {
    const session = this.sessions.get(companyId)
    return !!(session?.currentCredential && session.currentCredential.status === 'active')
  }

  /**
   * Limpiar sesión de una empresa
   */
  clearSession(companyId) {
    this.sessions.delete(companyId)
  }

  /**
   * Obtener credencial actual para una empresa
   */
  getCurrentCredential(companyId) {
    const session = this.sessions.get(companyId)
    return session?.currentCredential || null
  }

  /**
   * Método abstracto para conectar (debe ser implementado por subclases)
   */
  async connect(companyId, credentials) {
    throw new Error('Método connect() debe ser implementado por subclase')
  }

  /**
   * Método abstracto para desconectar (debe ser implementado por subclases)
   */
  async disconnect(companyId) {
    throw new Error('Método disconnect() debe ser implementado por subclase')
  }
}

export default BaseMultiAccountManager