import { supabase } from '../lib/supabase.js';

class DatabaseEmployeeService {
  // Obtener todos los empleados con filtros opcionales
  async getEmployees(filters = {}) {
    try {
      let query = supabase
        .from('companies')
        .select('*');

      // Aplicar filtros
      if (filters.companyId) {
        query = query.eq('id', filters.companyId);
      }

      if (filters.region) {
        query = query.ilike('location', `%${filters.region}%`);
      }

      if (filters.department) {
        query = query.ilike('department', `%${filters.department}%`);
      }

      if (filters.position) {
        query = query.ilike('position', `%${filters.position}%`);
      }

      if (filters.role) {
        query = query.ilike('role', `%${filters.role}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Solo empleados activos por defecto
      query = query.eq('status', 'active');

      // Ordenar por nombre
      query = query.order('name');

      // Limitar resultados
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: employees, error } = await query;

      if (error) {
        console.error('Error obteniendo empleados:', error);
        throw error;
      }

      // Formatear respuesta para mantener compatibilidad
      return employees.map(employee => ({
        ...employee,
        company: employee.name || null
      }));

    } catch (error) {
      console.error('Error obteniendo empleados:', error);
      throw error;
    }
  }

  // Obtener todas las empresas - SOLO desde base de datos
  async getCompanies() {
    try {
      console.log('🔍 DEBUG: databaseEmployeeService.getCompanies() - Iniciando...');
      
      // ✅ CORRECCIÓN: Obtener empresas reales desde la base de datos SIN fallback
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error obteniendo empresas de BD:', error);
        console.log('🔍 DEBUG: Retornando lista vacía - no hay fallback para evitar duplicaciones');
        return [];
      }

      // Si no hay empresas, retornar lista vacía
      if (!companies || companies.length === 0) {
        console.log('🔍 DEBUG: No hay empresas en BD, retornando lista vacía');
        return [];
      }

      // Verificar duplicados antes de retornar
      const uniqueCompanies = companies.filter((company, index, self) =>
        index === self.findIndex((c) => c.id === company.id)
      );

      if (uniqueCompanies.length !== companies.length) {
        console.warn('⚠️ databaseEmployeeService: Se detectaron duplicados en BD:', {
          original: companies.length,
          unique: uniqueCompanies.length,
          duplicados: companies.length - uniqueCompanies.length,
          datosOriginales: companies,
          datosUnicos: uniqueCompanies,
          idsOriginales: companies.map(c => c.id),
          idsUnicos: uniqueCompanies.map(c => c.id)
        });
      }

      console.log('🔍 DEBUG: Empresas reales cargadas desde databaseEmployeeService:', uniqueCompanies.length);
      console.log('🔍 DEBUG: Datos completos:', uniqueCompanies);
      return uniqueCompanies;
    } catch (error) {
      console.error('❌ Error en databaseEmployeeService.getCompanies():', error);
      console.log('🔍 DEBUG: Retornando lista vacía debido a error - sin fallback');
      return [];
    }
  }

  // Obtener empleado por ID
  async getEmployeeById(id) {
    try {
      const { data: employee, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error obteniendo empleado:', error);
        throw error;
      }

      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      return {
        ...employee,
        company: employee.name || null
      };
    } catch (error) {
      console.error('Error obteniendo empleado:', error);
      throw error;
    }
  }

  // Obtener conteo de empleados por empresa
  async getEmployeeCountByCompany(companyId) {
    try {
      console.log(`🔍 DEBUG: Obteniendo conteo de empleados para companyId: ${companyId}`);
      
      // Verificar si la tabla employees existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('employees')
        .select('id')
        .limit(1);

      if (tableError) {
        console.log('🔍 DEBUG: Tabla employees no existe:', tableError.message);
        return 0;
      }

      // Obtener conteo real de empleados
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (error) {
        console.error('Error obteniendo conteo de empleados:', error);
        return 0;
      }

      console.log(`🔍 DEBUG: Empleados reales encontrados para ${companyId}:`, count || 0);
      return count || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de empleados:', error);
      return 0;
    }
  }

  // Obtener estadísticas de mensajes por empresa
  async getMessageStatsByCompany(companyId) {
    try {
      console.log(`🔍 DEBUG: Obteniendo estadísticas de mensajes para companyId: ${companyId}`);
      
      // Verificar si la tabla communication_logs existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('communication_logs')
        .select('id')
        .limit(1);

      if (tableError) {
        console.log('🔍 DEBUG: Tabla communication_logs no existe:', tableError.message);
        return { scheduled: 0, draft: 0, sent: 0, read: 0, total: 0 };
      }

      // Obtener estadísticas reales
      const { data: logs, error } = await supabase
        .from('communication_logs')
        .select('status')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error obteniendo estadísticas de mensajes:', error);
        return { scheduled: 0, draft: 0, sent: 0, read: 0, total: 0 };
      }

      const stats = {
        scheduled: 0,
        draft: 0,
        sent: 0,
        read: 0,
        total: 0
      };

      logs?.forEach(log => {
        if (stats[log.status] !== undefined) {
          stats[log.status]++;
        }
      });

      stats.total = logs?.length || 0;

      console.log(`🔍 DEBUG: Estadísticas reales para ${companyId}:`, stats);
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de mensajes:', error);
      return { scheduled: 0, draft: 0, sent: 0, read: 0, total: 0 };
    }
  }

  // Obtener próximo mensaje programado
  async getNextScheduledMessage(companyId) {
    // Como no hay tabla de mensajes, retornamos null
    // Función placeholder para futura implementación
    return null;
  }

  // Obtener estadísticas generales para el dashboard
  async getDashboardStats() {
    try {
      console.log('🔍 DEBUG: Verificando existencia de tablas...');
      
      // Verificar si las tablas existen primero
      const { data: tablesCheck, error: tablesError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);

      console.log('🔍 DEBUG: Tabla companies existe:', !tablesError ? 'SÍ' : 'NO');
      if (tablesError) {
        console.log('🔍 DEBUG: Error en tabla companies:', tablesError.message);
      }

      // Verificar tabla communication_logs
      const { data: commCheck, error: commError } = await supabase
        .from('communication_logs')
        .select('id')
        .limit(1);

      console.log('🔍 DEBUG: Tabla communication_logs existe:', !commError ? 'SÍ' : 'NO');
      if (commError) {
        console.log('🔍 DEBUG: Error en tabla communication_logs:', commError.message);
      }

      // Total empleados (empresas activas)
      const { count: totalEmployees, error: employeesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (employeesError) {
        console.error('Error obteniendo total empleados:', employeesError);
        throw employeesError;
      }

      // Obtener datos REALES de communication_logs en lugar de generarlos
      let sentMessages = 0;
      let readRate = 0;

      if (!commError) {
        try {
          const { data: commStats, error: statsError } = await supabase
            .from('communication_logs')
            .select('status')
            .eq('status', 'sent');

          if (!statsError && commStats) {
            sentMessages = commStats.length;
            console.log('🔍 DEBUG: Mensajes enviados reales encontrados:', sentMessages);
          }

          const { data: readStats, error: readError } = await supabase
            .from('communication_logs')
            .select('status')
            .eq('status', 'read');

          if (!readError && readStats) {
            readRate = sentMessages > 0 ? Math.round((readStats.length / sentMessages) * 100) : 0;
            console.log('🔍 DEBUG: Mensajes leídos reales encontrados:', readStats.length);
          }
        } catch (error) {
          console.warn('🔍 DEBUG: Error obteniendo estadísticas reales de comunicación:', error.message);
        }
      } else {
        console.log('🔍 DEBUG: Tabla communication_logs no existe, usando valores 0');
      }

      const result = {
        totalEmployees: totalEmployees || 0,
        sentMessages: sentMessages,
        readRate: readRate
      };

      console.log('🔍 DEBUG: Estadísticas finales del dashboard:', result);
      return result;
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      // En caso de error, retornar valores vacíos en lugar de simulados
      return {
        totalEmployees: 0,
        sentMessages: 0,
        readRate: 0
      };
    }
  }
}

const databaseEmployeeService = new DatabaseEmployeeService();
export default databaseEmployeeService;