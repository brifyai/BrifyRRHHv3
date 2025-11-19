import { supabase } from '../lib/supabaseClient.js';
import { CACHE_CONFIG, DEV_CONFIG } from '../config/constants.js';

/**
 * SERVICIO DE BASE DE DATOS ORGANIZADA
 * 
 * Este servicio proporciona una interfaz limpia y organizada
 * para interactuar con la base de datos reestructurada.
 * 
 * Estructura de tablas:
 * - users: Usuarios del sistema
 * - companies: Empresas reales (16 empresas)
 * - employees: Empleados (800 empleados distribuidos entre empresas)
 * - folders: Carpetas (una por cada empleado = 800 carpetas)
 * - documents: Documentos (relacionados con carpetas)
 * - communication_logs: Logs de comunicación
 */

class OrganizedDatabaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = CACHE_CONFIG.DASHBOARD_STATS_DURATION; // Usar configuración centralizada
    
    // Logging en desarrollo
    this.log = DEV_CONFIG.ENABLE_LOGGING ?
      (...args) => console.log('[OrganizedDatabaseService]', ...args) :
      () => {};
  }

  // ========================================
  // MÉTODOS DE EMPRESAS
  // ========================================

  async getCompanies() {
    const cacheKey = 'companies';
    
    // 🛡️ PRODUCTION FIX: Bypass cache in production to avoid stale data
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      console.log('🔍 DEBUG: organizedDatabaseService.getCompanies() - Usando caché:', cached.length, 'empresas');
      return cached;
    }

    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getCompanies() - Consultando BD (Production mode: ' + (process.env.NODE_ENV || 'development') + ')...');
      
      // ⚡ PERFORMANCE FIX: Optimize query for production
      const selectFields = process.env.NODE_ENV === 'production'
        ? 'id, name, industry, created_at'
        : '*';

      const { data, error } = await supabase
        .from('companies')
        .select(selectFields)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo empresas:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getCompanies() - Empresas obtenidas:', data?.length || 0);
      
      // 🛡️ PRODUCTION FIX: Don't cache in production
      if (useCache) {
        this.setCache(cacheKey, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error en getCompanies():', error);
      return [];
    }
  }

  async getCompanyById(id) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error obteniendo empresa por ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error en getCompanyById():', error);
      return null;
    }
  }

  /**
   * Obtiene empresas con estadísticas combinadas
   * Método requerido por DatabaseCompanySummary.js
   */
  async getCompaniesWithStats() {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getCompaniesWithStats() - INICIO');
      
      // Obtener empresas básicas
      const allCompanies = await this.getCompanies();
      
      // ✅ FILTRAR EMPRESAS ACTIVAS (incluyendo empresas sin status definido para compatibilidad)
      const companies = allCompanies.filter(c => {
        // Incluir si status es 'active' O si no tiene status definido (null/undefined)
        return c.status === 'active' || c.status === null || c.status === undefined;
      });
      console.log('🔍 DEBUG: getCompaniesWithStats() - Empresas obtenidas:', allCompanies.length, '- Activas (incl. sin status):', companies.length);
      
      if (companies.length === 0) {
        console.log('⚠️ DEBUG: getCompaniesWithStats() - No hay empresas activas, retornando array vacío');
        return [];
      }

      // Obtener empleados para calcular estadísticas
      const employees = await this.getEmployees();
      console.log('🔍 DEBUG: getCompaniesWithStats() - Empleados obtenidos:', employees.length);

      // Obtener estadísticas de comunicación reales para cada empresa
      const companiesWithStats = await Promise.all(companies.map(async (company) => {
        const companyEmployees = employees.filter(emp => emp.company_id === company.id);
        const employeeIds = companyEmployees.map(emp => emp.id);
        
        // ✅ DATOS REALES DE COMUNICACIÓN
        const { data: commLogs, error: commError } = await supabase
          .from('communication_logs')
          .select('status, channel_id, recipient_ids, created_at')
          .eq('company_id', company.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 30 días

        if (commError) {
          console.error(`❌ Error obteniendo logs para empresa ${company.id}:`, commError);
        }

        const logs = commLogs || [];
        
        // Calcular métricas reales
        const sentMessages = logs.length;
        const readMessages = logs.filter(log => log.status === 'read').length;
        const readRate = sentMessages > 0 ? (readMessages / sentMessages) * 100 : 0;
        
        // Sentimiento promedio (placeholder - la tabla no tiene sentiment_score actualmente)
        const sentimentScore = 0; // Valor neutral hasta que se agregue la columna
        
        // Engagement rate basado en interacciones
        const engagementRate = sentMessages > 0
          ? Math.min(95, 70 + (readRate / 100) * 25) // Base 70% + bonus por lectura
          : 0;

        return {
          ...company,
          employeeCount: companyEmployees.length,
          sentMessages,
          readMessages,
          readRate: Math.round(readRate),
          sentimentScore: Math.round(sentimentScore * 100) / 100, // 2 decimales
          engagementRate: Math.round(engagementRate),
          scheduledMessages: logs.filter(log => log.status === 'scheduled').length,
          draftMessages: logs.filter(log => log.status === 'draft').length,
          lastActivity: logs.length > 0 ? logs[0].created_at : null
        };
      }));

      console.log('✅ DEBUG: getCompaniesWithStats() - Estadísticas calculadas para', companiesWithStats.length, 'empresas');
      return companiesWithStats;
      
    } catch (error) {
      console.error('❌ Error en getCompaniesWithStats():', error);
      throw error;
    }
  }

  async createCompany(companyData) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando empresa:', error);
        throw error;
      }

      // Limpiar caché de empresas
      this.clearCache('companies');
      
      return data;
    } catch (error) {
      console.error('❌ Error en createCompany():', error);
      throw error;
    }
  }

  async updateCompany(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error actualizando empresa:', error);
        throw error;
      }

      // Limpiar caché de empresas
      this.clearCache('companies');
      
      return data;
    } catch (error) {
      console.error('❌ Error en updateCompany():', error);
      throw error;
    }
  }

  async deleteCompany(id) {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando empresa:', error);
        throw error;
      }

      // Limpiar caché de empresas
      this.clearCache('companies');
      
      return true;
    } catch (error) {
      console.error('❌ Error en deleteCompany():', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE EMPLEADOS
  // ========================================

  // Obtener empleados (acepta companyId directo o un objeto de filtros)
  async getEmployees(params = null) {
    // Normalizar parámetros
    let companyId = null;
    let filters = {};
    
    if (typeof params === 'string') {
      // Si es string, asumir que es companyId
      companyId = params;
    } else if (params && typeof params === 'object') {
      // Si es objeto, extraer companyId y otros filtros
      companyId = params.companyId || null;
      filters = { ...params };
      delete filters.companyId; // Remover companyId de filtros
    }

    const cacheKey = `employees_${companyId || 'all'}_${JSON.stringify(filters)}`;
    
    // 🛡️ PRODUCTION FIX: Bypass cache in production
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      console.log('🔍 DEBUG: organizedDatabaseService.getEmployees() - Usando caché:', cached.length, 'empleados');
      return cached;
    }

    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getEmployees() - Consultando empleados...');
      
      let query = supabase
        .from('employees')
        .select(`
          *,
          companies (
            id,
            name,
            industry
          )
        `);

      // Aplicar filtros
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      // Aplicar filtros adicionales
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo empleados:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getEmployees() - Empleados obtenidos:', data?.length || 0);
      
      // 🛡️ PRODUCTION FIX: Don't cache in production
      if (useCache) {
        this.setCache(cacheKey, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error en getEmployees():', error);
      return [];
    }
  }

  async getEmployeeById(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies (
            id,
            name,
            industry
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error obteniendo empleado por ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error en getEmployeeById():', error);
      return null;
    }
  }

  async getEmployeeCountByCompany(companyId) {
    try {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) {
        console.error('❌ Error obteniendo conteo de empleados:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Error en getEmployeeCountByCompany():', error);
      return 0;
    }
  }

  // ========================================
  // MÉTODOS DE CARPETAS
  // ========================================

  async getFolders(employeeId = null) {
    const cacheKey = `folders_${employeeId || 'all'}`;
    
    // 🛡️ PRODUCTION FIX: Bypass cache in production
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      console.log('🔍 DEBUG: organizedDatabaseService.getFolders() - Usando caché:', cached.length, 'carpetas');
      return cached;
    }

    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getFolders() - Consultando carpetas...');
      
      let query = supabase
        .from('folders')
        .select(`
          *,
          employees (
            id,
            full_name,
            email,
            companies (
              id,
              name
            )
          )
        `);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo carpetas:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getFolders() - Carpetas obtenidas:', data?.length || 0);
      
      // 🛡️ PRODUCTION FIX: Don't cache in production
      if (useCache) {
        this.setCache(cacheKey, data);
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error en getFolders():', error);
      return [];
    }
  }

  async getFolderCount() {
    try {
      const { count, error } = await supabase
        .from('folders')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Error obteniendo conteo de carpetas:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Error en getFolderCount():', error);
      return 0;
    }
  }

  async createFolder(folderData) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert(folderData)
        .select(`
          *,
          employees (
            id,
            full_name,
            email,
            companies (
              id,
              name
            )
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creando carpeta:', error);
        throw error;
      }

      // Limpiar caché de carpetas
      this.clearCache('folders');
      
      return data;
    } catch (error) {
      console.error('❌ Error en createFolder():', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE DOCUMENTOS
  // ========================================

  async getDocuments(folderId = null) {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getDocuments() - Consultando documentos...');
      
      let query = supabase
        .from('documents')
        .select(`
          *,
          folders (
            id,
            name,
            employees (
              id,
              full_name,
              companies (
                id,
                name
              )
            )
          )
        `);

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo documentos:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getDocuments() - Documentos obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getDocuments():', error);
      return [];
    }
  }

  async getDocumentCount() {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Error obteniendo conteo de documentos:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Error en getDocumentCount():', error);
      return 0;
    }
  }

  // ========================================
  // MÉTODOS DE COMUNICACIÓN
  // ========================================

  async getCommunicationLogs(companyId = null) {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getCommunicationLogs() - Consultando logs...');
      
      let query = supabase
        .from('communication_logs')
        .select(`
          *,
          companies (
            id,
            name
          )
        `);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', { ascending: false }).limit(1000);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo logs de comunicación:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getCommunicationLogs() - Logs obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getCommunicationLogs():', error);
      return [];
    }
  }

  async getCommunicationStats(companyId = null) {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getCommunicationStats() - Calculando estadísticas...');
      
      // ✅ CORREGIDO: Usar columnas REALES que existen en la tabla communication_logs
      let query = supabase
        .from('communication_logs')
        .select('status, created_at, type, employee_id, company_id');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo estadísticas de comunicación:', error);
        throw error;
      }

      // ✅ CORREGIDO: Procesar estadísticas usando columnas reales
      const stats = {
        total: data?.length || 0,
        byType: {}, // type en lugar de channel
        byStatus: {},
        byEmployee: {},
        recent: data?.slice(0, 10) || []
      };

      data?.forEach(log => {
        // Por tipo (type en lugar de channel)
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
        
        // Por estado
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
        
        // Por empleado (en lugar de recipient)
        if (log.employee_id) {
          stats.byEmployee[log.employee_id] = (stats.byEmployee[log.employee_id] || 0) + 1;
        }
      });

      console.log('✅ DEBUG: organizedDatabaseService.getCommunicationStats() - Estadísticas calculadas');
      return stats;
    } catch (error) {
      console.error('❌ Error en getCommunicationStats():', error);
      return { total: 0, byType: {}, byStatus: {}, byEmployee: {}, recent: [] };
    }
  }

  // ========================================
  // MÉTODOS DE DASHBOARD
  // ========================================

  async getDashboardStats() {
    const cacheKey = 'dashboard_stats';
    
    // 🛡️ PRODUCTION FIX: Bypass cache in production
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      console.log('🔍 DEBUG: organizedDatabaseService.getDashboardStats() - Usando caché');
      return cached;
    }

    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getDashboardStats() - Calculando estadísticas del dashboard...');
      
      // Obtener estadísticas en paralelo
      const [
        companiesResult,
        employeesResult,
        foldersResult,
        documentsResult,
        communicationStatsResult
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('folders').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        this.getCommunicationStats()
      ]);

      const stats = {
        companies: companiesResult.count || 0,
        employees: employeesResult.count || 0,
        folders: foldersResult.count || 0,
        documents: documentsResult.count || 0,
        communication: communicationStatsResult,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ DEBUG: organizedDatabaseService.getDashboardStats() - Estadísticas calculadas:', stats);
      
      // 🛡️ PRODUCTION FIX: Don't cache in production
      if (useCache) {
        this.setCache(cacheKey, stats);
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error en getDashboardStats():', error);
      return {
        companies: 0,
        employees: 0,
        folders: 0,
        documents: 0,
        communication: { total: 0, byType: {}, byStatus: {}, recent: [] },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // ========================================
  // MÉTODOS DE USUARIOS Y ROLES
  // ========================================

  async getUsers() {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getUsers() - Consultando usuarios...');
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          roles (
            id,
            name,
            name_es,
            description,
            hierarchy_level
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getUsers() - Usuarios obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getUsers():', error);
      return [];
    }
  }

  async getRoles() {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.getRoles() - Consultando roles...');
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('hierarchy_level', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo roles:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.getRoles() - Roles obtenidos:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getRoles():', error);
      return [];
    }
  }

  async createUser(userData) {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.createUser() - Creando usuario...');
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select(`
          *,
          roles (
            id,
            name,
            name_es,
            description,
            hierarchy_level
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creando usuario:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.createUser() - Usuario creado:', data?.id);
      
      // Limpiar caché de usuarios
      this.clearCache('users');
      
      return data;
    } catch (error) {
      console.error('❌ Error en createUser():', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.updateUser() - Actualizando usuario:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select(`
          *,
          roles (
            id,
            name,
            name_es,
            description,
            hierarchy_level
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error actualizando usuario:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.updateUser() - Usuario actualizado:', data?.id);
      
      // Limpiar caché de usuarios
      this.clearCache('users');
      
      return data;
    } catch (error) {
      console.error('❌ Error en updateUser():', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      console.log('🔍 DEBUG: organizedDatabaseService.deleteUser() - Eliminando usuario:', userId);
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Error eliminando usuario:', error);
        throw error;
      }

      console.log('✅ DEBUG: organizedDatabaseService.deleteUser() - Usuario eliminado:', userId);
      
      // Limpiar caché de usuarios
      this.clearCache('users');
      
      return true;
    } catch (error) {
      console.error('❌ Error en deleteUser():', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE VERIFICACIÓN
  // ========================================

  async verifyDatabaseStructure() {
    const tables = ['companies', 'employees', 'folders', 'documents', 'users', 'communication_logs'];
    const results = {};

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        results[tableName] = {
          exists: !error,
          count: count || 0,
          error: error?.message
        };
      } catch (err) {
        results[tableName] = {
          exists: false,
          count: 0,
          error: err.message
        };
      }
    }

    return results;
  }

  // ========================================
  // MÉTODOS DE CACHÉ
  // ========================================

  /**
   * Fuerza la limpieza completa del caché
   * Método requerido por DatabaseCompanySummary.js
   */
  forceClearCache() {
    console.log('🧹 OrganizedDatabaseService: Limpiando caché forzosamente...');
    this.cache.clear();
    console.log('✅ OrganizedDatabaseService: Caché limpiado completamente');
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      console.log(`🧹 OrganizedDatabaseService: Caché '${key}' limpiado`);
    } else {
      this.cache.clear();
      console.log('🧹 OrganizedDatabaseService: Caché completamente limpiado');
    }
  }
}

// Exportar instancia única
const organizedDatabaseService = new OrganizedDatabaseService();
export default organizedDatabaseService;