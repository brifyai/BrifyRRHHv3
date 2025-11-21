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
    
    // Bypass cache in production to avoid stale data
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo empresas:', error);
        throw error;
      }
      
      // Don't cache in production
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

  // Función para reintentar operaciones con timeout
  async retryWithTimeout(operation, maxRetries = 3, baseDelay = 1000, timeout = 10000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Crear timeout para cada intento
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), timeout);
        });
        
        const operationPromise = operation();
        
        return await Promise.race([operationPromise, timeoutPromise]);
      } catch (error) {
        console.log(`🔄 Intento ${attempt}/${maxRetries} falló:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Backoff exponencial: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Obtiene empresas con estadísticas combinadas
   * Método requerido por DatabaseCompanySummary.js
   */
  async getCompaniesWithStats() {
    try {
      console.log('🚀 getCompaniesWithStats: Iniciando carga de datos desde Supabase...');
      
      // ✅ MEJORADO: Usar reintentos con timeout para cada consulta
      const [companiesResult, employeesResult, logsResult] = await Promise.all([
        this.retryWithTimeout(async () => {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true });
          
          if (error) throw error;
          return data;
        }, 3, 1000, 8000),
        
        this.retryWithTimeout(async () => {
          const { data, error } = await supabase
            .from('employees')
            .select('company_id')
            .eq('status', 'active');
          
          if (error) throw error;
          return data;
        }, 3, 1000, 8000),
        
        this.retryWithTimeout(async () => {
          const { data, error } = await supabase
            .from('communication_logs')
            .select('status, type, employee_id, created_at, company_id')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
          
          if (error) throw error;
          return data;
        }, 3, 1000, 8000)
      ]);
      
      const allCompanies = companiesResult || [];
      const allEmployees = employeesResult || [];
      const allLogs = logsResult || [];
      
      const companies = allCompanies.filter(c =>
        c.status === 'active' || c.status === null || c.status === undefined
      );

      console.log(`📊 getCompaniesWithStats: ${companies.length} empresas activas encontradas`);

      // 4. Agrupar empleados por company_id en memoria
      const employeesByCompany = {};
      allEmployees.forEach(employee => {
        if (!employeesByCompany[employee.company_id]) employeesByCompany[employee.company_id] = 0;
        employeesByCompany[employee.company_id]++;
      });

      // 5. Agrupar logs por company_id en memoria (más rápido que N queries)
      const logsByCompany = {};
      allLogs.forEach(log => {
        if (!logsByCompany[log.company_id]) logsByCompany[log.company_id] = [];
        logsByCompany[log.company_id].push(log);
      });

      console.log(`👥 getCompaniesWithStats: ${allEmployees.length} empleados activos encontrados`);
      console.log(`💬 getCompaniesWithStats: ${allLogs.length} logs de comunicación encontrados`);

      // 6. Calcular estadísticas
      return companies.map(company => {
        const employeeCount = employeesByCompany[company.id] || 0;
        const logs = logsByCompany[company.id] || [];
        const sentMessages = logs.length;
        const readMessages = logs.filter(log => log.status === 'read').length;
        const readRate = sentMessages > 0 ? (readMessages / sentMessages) * 100 : 0;
        
        console.log(`📈 Empresa ${company.name}: ${employeeCount} empleados, ${sentMessages} mensajes`);
        
        return {
          ...company,
          employeeCount,
          sentMessages,
          readMessages,
          readRate: Math.round(readRate),
          sentimentScore: 0,
          engagementRate: sentMessages > 0 ? Math.min(95, (readRate / 100) * 95) : 0,
          scheduledMessages: logs.filter(log => log.status === 'scheduled').length,
          draftMessages: logs.filter(log => log.status === 'draft').length,
          lastActivity: logs.length > 0 ? logs[0].created_at : null
        };
      });
    } catch (error) {
      console.error('❌ Error en getCompaniesWithStats():', error);
      
      // ✅ MEJORADO: Clasificar errores para mejor diagnóstico
      if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        throw new Error('RECURSOS_INSUFICIENTES: Error de red o servidor sobrecargado');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('CONEXION_FALLIDA: No se pudo conectar con el servidor');
      } else if (error.message.includes('Timeout')) {
        throw new Error('TIMEOUT: La consulta tardó demasiado tiempo');
      } else if (error.message.includes('timeout')) {
        throw new Error('TIMEOUT: Tiempo de espera agotado');
      }
      
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
    
    // Bypass cache in production
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      return cached;
    }

    try {
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
      
      // Don't cache in production
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
    
    // Bypass cache in production
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      return cached;
    }

    try {
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
      
      // Don't cache in production
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

      return data || [];
    } catch (error) {
      console.error('❌ Error en getCommunicationLogs():', error);
      return [];
    }
  }

  async getCommunicationStats(companyId = null) {
    try {
      // Usar columnas REALES que existen en la tabla communication_logs
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

      // Procesar estadísticas usando columnas reales
      const stats = {
        total: data?.length || 0,
        byType: {},
        byStatus: {},
        byEmployee: {},
        recent: data?.slice(0, 10) || []
      };

      data?.forEach(log => {
        // Por tipo
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
        
        // Por estado
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
        
        // Por empleado
        if (log.employee_id) {
          stats.byEmployee[log.employee_id] = (stats.byEmployee[log.employee_id] || 0) + 1;
        }
      });

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
    
    // Bypass cache in production
    const useCache = process.env.NODE_ENV !== 'production';
    const cached = useCache ? this.getFromCache(cacheKey) : null;
    
    if (cached) {
      console.log('📊 getDashboardStats: Usando datos cacheados');
      return cached;
    }

    try {
      console.log('📊 getDashboardStats: Iniciando carga de estadísticas del dashboard...');
      
      // ✅ MÉTODO SIMPLIFICADO: Consultas directas sin reintentos complejos
      console.log('🔍 Consultando companies...');
      const { count: companiesCount, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      if (companiesError) {
        console.error('❌ Error consultando companies:', companiesError);
        throw companiesError;
      }
      
      console.log('🔍 Consultando employees...');
      const { count: employeesCount, error: employeesError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      if (employeesError) {
        console.error('❌ Error consultando employees:', employeesError);
        throw employeesError;
      }
      
      console.log('🔍 Consultando folders...');
      const { count: foldersCount, error: foldersError } = await supabase
        .from('folders')
        .select('*', { count: 'exact', head: true });
      
      if (foldersError) {
        console.error('❌ Error consultando folders:', foldersError);
        throw foldersError;
      }
      
      console.log('🔍 Consultando documents...');
      const { count: documentsCount, error: documentsError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });
      
      if (documentsError) {
        console.error('❌ Error consultando documents:', documentsError);
        throw documentsError;
      }
      
      console.log('🔍 Consultando communication_stats...');
      const communicationStats = await this.getCommunicationStats();

      // ✅ OBTENER DATOS REALES ADICIONALES DESDE LA BASE DE DATOS
      console.log('🔍 Consultando datos reales adicionales...');
      
      // 1. Tokens reales desde user_tokens_usage
      const { count: tokensCount, error: tokensError } = await supabase
        .from('user_tokens_usage')
        .select('*', { count: 'exact', head: true });
      
      if (tokensError) {
        console.warn('⚠️ Error consultando tokens:', tokensError);
      }
      
      // 2. Usuarios activos reales (usuarios que han usado el sistema en los últimos 30 días)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: activeUsersCount, error: activeUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo);
      
      if (activeUsersError) {
        console.warn('⚠️ Error consultando usuarios activos:', activeUsersError);
      }
      
      // 3. Calcular crecimiento mensual real (nuevos empleados este mes vs mes anterior)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const { count: currentMonthEmployees, error: currentMonthError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString());
      
      if (currentMonthError) {
        console.warn('⚠️ Error consultando empleados del mes:', currentMonthError);
      }
      
      const { count: lastMonthEmployees, error: lastMonthError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', currentMonth.toISOString());
      
      if (lastMonthError) {
        console.warn('⚠️ Error consultando empleados del mes anterior:', lastMonthError);
      }
      
      // 4. Almacenamiento real (suma de tamaños de documentos)
      const { data: documentsWithSize, error: sizeError } = await supabase
        .from('documents')
        .select('file_size')
        .not('file_size', 'is', null);
      
      let totalStorageUsed = 0;
      if (sizeError) {
        console.warn('⚠️ Error consultando tamaños de documentos:', sizeError);
      } else if (documentsWithSize) {
        totalStorageUsed = documentsWithSize.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
      }
      
      // 5. Calcular tasa de éxito real (operaciones exitosas vs fallidas)
      const { count: successOperations, error: successError } = await supabase
        .from('communication_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered');
      
      const { count: totalOperations, error: totalError } = await supabase
        .from('communication_logs')
        .select('*', { count: 'exact', head: true });
      
      let successRate = 0;
      if (!successError && !totalError && totalOperations > 0) {
        successRate = Math.floor((successOperations / totalOperations) * 100);
      }
      
      // 6. Calcular crecimiento mensual real
      let monthlyGrowth = 0;
      if (lastMonthEmployees > 0) {
        monthlyGrowth = Math.floor(((currentMonthEmployees - lastMonthEmployees) / lastMonthEmployees) * 100);
      } else if (currentMonthEmployees > 0) {
        monthlyGrowth = 100; // Si no había empleados el mes anterior, es 100% de crecimiento
      }

      const companies = companiesCount || 0;
      const employees = employeesCount || 0;
      const folders = foldersCount || 0;
      const documents = documentsCount || 0;

      console.log('📊 getDashboardStats: Resultados obtenidos:', {
        companies,
        employees,
        folders,
        documents,
        communicationTotal: communicationStats.total
      });

      // ✅ CALCULAR ESTADÍSTICAS 100% REALES
      const stats = {
        companies,
        employees,
        folders,
        documents,
        communication: communicationStats,
        
        // ✅ ESTADÍSTICAS 100% REALES DESDE LA BASE DE DATOS
        storageUsed: totalStorageUsed, // Tamaño real en bytes
        tokensUsed: tokensCount || 0, // Conteo real de tokens
        tokenLimit: 1000,
        monthlyGrowth: monthlyGrowth, // Crecimiento real basado en nuevos empleados
        activeUsers: activeUsersCount || 0, // Usuarios que han usado el sistema recientemente
        successRate: successRate, // Tasa real de operaciones exitosas
        
        lastUpdated: new Date().toISOString()
      };
      
      console.log('📊 getDashboardStats: Estadísticas finales calculadas:', stats);
      
      // Don't cache in production
      if (useCache) {
        this.setCache(cacheKey, stats);
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error en getDashboardStats():', error);
      
      // ✅ MEJORADO: Valores por defecto más realistas en caso de error
      return {
        companies: 0,
        employees: 0,
        folders: 0,
        documents: 0,
        communication: { total: 0, byType: {}, byStatus: {}, recent: [] },
        storageUsed: 0,
        tokensUsed: 0,
        tokenLimit: 1000,
        monthlyGrowth: 0,
        activeUsers: 0,
        successRate: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // ========================================
  // MÉTODOS DE USUARIOS Y ROLES
  // ========================================

  async getUsers() {
    try {
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

      return data || [];
    } catch (error) {
      console.error('❌ Error en getUsers():', error);
      return [];
    }
  }

  async getRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('hierarchy_level', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo roles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getRoles():', error);
      return [];
    }
  }

  async createUser(userData) {
    try {
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Error eliminando usuario:', error);
        throw error;
      }
      
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

  invalidateCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
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