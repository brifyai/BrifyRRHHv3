import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.staffhub.cl';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo';

const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ========================================
  // MÉTODOS DE EMPRESAS
  // ========================================

  async getCompanies() {
    const cacheKey = 'companies';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  async createCompany(companyData) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...companyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      this.clearCache('companies');
      return data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async updateCompany(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      this.clearCache('companies');
      return data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async deleteCompany(id) {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      this.clearCache('companies');
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE EMPLEADOS
  // ========================================

  async getEmployees(companyId = null) {
    const cacheKey = `employees_${companyId || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('employees')
        .select(`
          *,
          company:companies(name, industry),
          user:users(email, full_name)
        `)
        .eq('status', 'active');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.order('last_name, first_name');

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  async getEmployeeById(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          company:companies(name, industry),
          user:users(email, full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  async getEmployeeCountByCompany(companyId) {
    try {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching employee count:', error);
      return 0;
    }
  }

  // ========================================
  // MÉTODOS DE CARPETAS
  // ========================================

  async getFolders(employeeId = null) {
    const cacheKey = `folders_${employeeId || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('folders')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_id),
          company:companies(name)
        `)
        .eq('is_active', true);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }

  async getFolderCount() {
    const cacheKey = 'folder_count';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { count, error } = await supabase
        .from('folders')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      
      this.setCache(cacheKey, count);
      return count || 0;
    } catch (error) {
      console.error('Error fetching folder count:', error);
      return 0;
    }
  }

  async createFolder(folderData) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          ...folderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      this.clearCache('folders');
      this.clearCache('folder_count');
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE DOCUMENTOS
  // ========================================

  async getDocuments(folderId = null) {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          folder:folders(name),
          employee:employees(first_name, last_name, employee_id)
        `)
        .eq('status', 'active');

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async getDocumentCount() {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching document count:', error);
      return 0;
    }
  }

  // ========================================
  // MÉTODOS DE COMUNICACIÓN
  // ========================================

  async getCommunicationStats(companyId = null) {
    try {
      let query = supabase
        .from('communication_logs')
        .select('status, company_id, scheduled_date');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        sent: 0,
        scheduled: 0,
        draft: 0,
        failed: 0
      };

      data.forEach(record => {
        stats[record.status] = (stats[record.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching communication stats:', error);
      return { sent: 0, scheduled: 0, draft: 0, failed: 0 };
    }
  }

  // ========================================
  // MÉTODOS DE DASHBOARD
  // ========================================

  async getDashboardStats() {
    const cacheKey = 'dashboard_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Ejecutar múltiples consultas en paralelo
      const [
        companiesResult,
        employeesResult,
        foldersResult,
        documentsResult,
        communicationResult
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('folders').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('communication_logs').select('*', { count: 'exact', head: true })
      ]);

      const stats = {
        companies: companiesResult.count || 0,
        employees: employeesResult.count || 0,
        folders: foldersResult.count || 0,
        documents: documentsResult.count || 0,
        communications: communicationResult.count || 0,
        tokensUsed: 50000, // Valor por defecto
        storageUsed: 10000 // Valor por defecto en MB
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        companies: 0,
        employees: 0,
        folders: 0,
        documents: 0,
        communications: 0,
        tokensUsed: 0,
        storageUsed: 0
      };
    }
  }

  // ========================================
  // MÉTODOS DE CACHE
  // ========================================

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
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
    } else {
      this.cache.clear();
    }
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;
      return { success: true, count: data || 0 };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Crear y exportar una instancia única
const databaseService = new DatabaseService();
export default databaseService;