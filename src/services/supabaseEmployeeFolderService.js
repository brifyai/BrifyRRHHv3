/**
 * 🏗️ SERVICIO UNIFICADO DE CARPETAS DE EMPLEADOS - ARQUITECTURA MEJORADA
 * 
 * NUEVA ARQUITECTURA: Supabase como fuente principal
 * Google Drive como sincronización en background
 * 
 * Flujo: Frontend → Supabase (lectura/escritura) → Google Drive (sincronización)
 */

import { supabase } from '../lib/supabaseClient.js';
import googleDriveConsolidatedService from '../lib/googleDriveConsolidated.js';

class SupabaseEmployeeFolderService {
  constructor() {
    this.initialized = false;
    this.driveInitialized = false;
    this.supabase = supabase;
    
    // 🆕 NUEVAS CARACTERÍSTICAS ARQUITECTÓNICAS
    this.syncQueue = new Map(); // Cola de sincronización
    this.cache = new Map(); // Cache inteligente
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    // Configuración de sincronización
    this.syncConfig = {
      batchSize: 10,
      retryDelay: 2000,
      maxRetries: 3,
      syncInterval: 30000 // 30 segundos
    };
    
    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Conexión restaurada, procesando cola de sincronización...');
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Conexión perdida, entrando en modo offline');
    });
    
    // Iniciar sincronización periódica
    this.startPeriodicSync();
  }

  /**
   * 🚀 INICIALIZAR SERVICIO
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log('🚀 Inicializando Servicio Supabase como Fuente Principal...');
      
      // Verificar conexión con Supabase
      const { error } = await supabase.from('employee_folders').select('count').limit(1);
      if (error) {
        console.warn('⚠️ Verificación de employee_folders falló:', error.message);
      }
      
      // Inicializar Google Drive
      await this.initializeGoogleDrive();
      
      this.initialized = true;
      console.log('✅ Servicio Supabase inicializado como fuente principal');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Servicio Supabase:', error);
      return false;
    }
  }

  /**
   * 🚀 INICIALIZAR GOOGLE DRIVE
   */
  async initializeGoogleDrive() {
    if (this.driveInitialized) return true;
    
    try {
      console.log('🚀 Inicializando Google Drive para sincronización...');
      await googleDriveConsolidatedService.initialize();
      this.driveInitialized = true;
      console.log('✅ Google Drive inicializado para sincronización');
      return true;
    } catch (error) {
      console.warn('⚠️ Google Drive no disponible:', error.message);
      this.driveInitialized = false;
      return false;
    }
  }

  /**
   * ✅ OBTENER CARPETA DESDE SUPABASE (FUENTE PRINCIPAL)
   */
  async getEmployeeFolder(employeeEmail) {
    try {
      console.log('🏗️ [SUPABASE SERVICE] Obteniendo carpeta desde Supabase:', employeeEmail);
      
      // 1. PRIMERO: Intentar obtener desde Supabase (fuente principal)
      const { data: folderData, error: supabaseError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .single();

      if (!supabaseError && folderData) {
        console.log('✅ [SUPABASE SERVICE] Carpeta encontrada en Supabase');
        
        // Guardar en cache
        this.cache.set(employeeEmail, {
          data: folderData,
          timestamp: Date.now(),
          source: 'supabase'
        });
        
        return {
          ...folderData,
          source: 'supabase',
          lastSync: new Date().toISOString()
        };
      }

      // 2. SI NO EXISTE EN SUPABASE: Crear desde Google Drive
      console.log('🔄 [SUPABASE SERVICE] Carpeta no existe en Supabase, creando desde Google Drive...');
      
      const googleDriveFolder = await this.getFromGoogleDrive(employeeEmail);
      
      if (googleDriveFolder) {
        // 3. GUARDAR EN SUPABASE PARA FUTURAS CONSULTAS
        const savedFolder = await this.saveEmployeeFolder(employeeEmail, googleDriveFolder);
        
        return {
          ...savedFolder,
          source: 'supabase_with_google_drive',
          lastSync: new Date().toISOString()
        };
      }

      // 4. FALLBACK: Crear carpeta básica
      return this.createBasicFolder(employeeEmail);

    } catch (error) {
      console.error('❌ [SUPABASE SERVICE] Error obteniendo carpeta:', error);
      
      // FALLBACK: Intentar desde cache
      const cached = this.cache.get(employeeEmail);
      if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutos
        console.log('📦 [SUPABASE SERVICE] Usando datos del cache');
        return cached.data;
      }
      
      // FALLBACK FINAL: Crear carpeta básica
      return this.createBasicFolder(employeeEmail);
    }
  }

  /**
   * 🔄 OBTENER DESDE GOOGLE DRIVE
   */
  async getFromGoogleDrive(employeeEmail) {
    try {
      if (!this.driveInitialized) {
        await this.initializeGoogleDrive();
      }
      
      if (!this.driveInitialized) {
        console.warn('⚠️ [SUPABASE SERVICE] Google Drive no disponible');
        return null;
      }
      
      console.log('📁 [SUPABASE SERVICE] Obteniendo desde Google Drive:', employeeEmail);
      
      // Implementar lógica para obtener desde Google Drive
      // Esto depende de la implementación específica de googleDriveConsolidatedService
      const driveFolder = await googleDriveConsolidatedService.getEmployeeFolder(employeeEmail);
      
      if (driveFolder) {
        console.log('✅ [SUPABASE SERVICE] Carpeta obtenida desde Google Drive');
        return driveFolder;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [SUPABASE SERVICE] Error obteniendo desde Google Drive:', error);
      return null;
    }
  }

  /**
   * ✅ GUARDAR CARPETA EN SUPABASE (FUENTE PRINCIPAL)
   */
  async saveEmployeeFolder(employeeEmail, folderData) {
    try {
      console.log('💾 [SUPABASE SERVICE] Guardando carpeta en Supabase:', employeeEmail);
      
      const folderToSave = {
        employee_email: employeeEmail,
        employee_name: folderData.employeeName || folderData.name || 'Empleado',
        employee_position: folderData.employeePosition || folderData.position || '',
        employee_department: folderData.employeeDepartment || folderData.department || '',
        employee_phone: folderData.employeePhone || folderData.phone || '',
        employee_region: folderData.employeeRegion || folderData.region || '',
        employee_level: folderData.employeeLevel || folderData.level || '',
        employee_work_mode: folderData.employeeWorkMode || folderData.workMode || '',
        employee_contract_type: folderData.employeeContractType || folderData.contractType || '',
        company_name: folderData.companyName || folderData.company || '',
        knowledge_base: JSON.stringify(folderData.knowledgeBase || {
          faqs: [],
          documents: [],
          policies: [],
          procedures: []
        }),
        conversation_history: JSON.stringify(folderData.conversationHistory || []),
        settings: JSON.stringify(folderData.settings || {
          notificationPreferences: {
            whatsapp: true,
            telegram: true,
            email: true
          },
          responseLanguage: 'es',
          timezone: 'America/Santiago'
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'synced',
        google_drive_url: folderData.googleDriveUrl || null
      };

      const { data, error } = await supabase
        .from('employee_folders')
        .upsert(folderToSave, { 
          onConflict: 'employee_email',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [SUPABASE SERVICE] Error guardando en Supabase:', error);
        throw error;
      }

      console.log('✅ [SUPABASE SERVICE] Carpeta guardada exitosamente en Supabase');
      
      // 4. SINCRONIZAR CON GOOGLE DRIVE EN BACKGROUND
      this.scheduleGoogleDriveSync(employeeEmail, folderData);

      // Actualizar cache
      this.cache.set(employeeEmail, {
        data: data,
        timestamp: Date.now(),
        source: 'supabase'
      });

      return data;

    } catch (error) {
      console.error('❌ [SUPABASE SERVICE] Error en saveEmployeeFolder:', error);
      throw error;
    }
  }

  /**
   * 🔄 SINCRONIZACIÓN CON GOOGLE DRIVE (BACKGROUND)
   */
  async scheduleGoogleDriveSync(employeeEmail, folderData) {
    try {
      console.log('🔄 [SYNC] Programando sincronización con Google Drive:', employeeEmail);
      
      // Agregar a cola de sincronización
      this.syncQueue.set(employeeEmail, {
        data: folderData,
        timestamp: Date.now(),
        retries: 0
      });

      // Procesar cola si estamos online
      if (this.isOnline) {
        await this.processSyncQueue();
      }

    } catch (error) {
      console.error('❌ [SYNC] Error programando sincronización:', error);
    }
  }

  /**
   * ⚡ PROCESAR COLA DE SINCRONIZACIÓN
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.size === 0 || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log(`⚡ [SYNC] Procesando cola de sincronización (${this.syncQueue.size} elementos)`);

    try {
      const syncItems = Array.from(this.syncQueue.entries());
      
      for (const [employeeEmail, syncItem] of syncItems) {
        try {
          if (!this.driveInitialized) {
            await this.initializeGoogleDrive();
          }
          
          if (this.driveInitialized) {
            await googleDriveConsolidatedService.syncEmployeeFolder(employeeEmail, syncItem.data);
            this.syncQueue.delete(employeeEmail);
            console.log(`✅ [SYNC] Sincronizado con Google Drive:`, employeeEmail);
          }
          
        } catch (error) {
          console.error(`❌ [SYNC] Error sincronizando ${employeeEmail}:`, error);
          
          // Reintentar con backoff exponencial
          syncItem.retries++;
          if (syncItem.retries < this.syncConfig.maxRetries) {
            const delay = Math.pow(2, syncItem.retries) * this.syncConfig.retryDelay;
            setTimeout(() => {
              this.syncQueue.set(employeeEmail, syncItem);
            }, delay);
          } else {
            console.error(`❌ [SYNC] Máximos reintentos para ${employeeEmail}`);
            this.syncQueue.delete(employeeEmail);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 📊 OBTENER TODAS LAS CARPETAS DESDE SUPABASE
   */
  async getAllEmployeeFolders(limit = 100, offset = 0) {
    try {
      console.log('📊 [SUPABASE SERVICE] Obteniendo todas las carpetas desde Supabase');
      
      const { data, error, count } = await supabase
        .from('employee_folders')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ [SUPABASE SERVICE] Error obteniendo carpetas:', error);
        throw error;
      }

      console.log(`✅ [SUPABASE SERVICE] Obtenidas ${data?.length || 0} carpetas de ${count || 0} total`);
      
      return {
        folders: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };

    } catch (error) {
      console.error('❌ [SUPABASE SERVICE] Error en getAllEmployeeFolders:', error);
      throw error;
    }
  }

  /**
   * 🔍 BUSCAR CARPETAS EN SUPABASE
   */
  async searchEmployeeFolders(searchTerm, filters = {}) {
    try {
      console.log('🔍 [SUPABASE SERVICE] Buscando carpetas:', { searchTerm, filters });
      
      let query = supabase
        .from('employee_folders')
        .select('*');

      // Filtro por término de búsqueda
      if (searchTerm) {
        query = query.or(`employee_name.ilike.%${searchTerm}%,employee_email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
      }

      // Filtros adicionales
      if (filters.department) {
        query = query.eq('employee_department', filters.department);
      }
      
      if (filters.level) {
        query = query.eq('employee_level', filters.level);
      }
      
      if (filters.workMode) {
        query = query.eq('employee_work_mode', filters.workMode);
      }
      
      if (filters.contractType) {
        query = query.eq('employee_contract_type', filters.contractType);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ [SUPABASE SERVICE] Error en búsqueda:', error);
        throw error;
      }

      console.log(`✅ [SUPABASE SERVICE] Búsqueda completada: ${data?.length || 0} resultados`);
      
      return data || [];

    } catch (error) {
      console.error('❌ [SUPABASE SERVICE] Error en searchEmployeeFolders:', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR CARPETA DE SUPABASE
   */
  async deleteEmployeeFolder(employeeEmail) {
    try {
      console.log('🗑️ [SUPABASE SERVICE] Eliminando carpeta:', employeeEmail);
      
      const { error } = await supabase
        .from('employee_folders')
        .delete()
        .eq('employee_email', employeeEmail);

      if (error) {
        console.error('❌ [SUPABASE SERVICE] Error eliminando carpeta:', error);
        throw error;
      }

      // También eliminar de Google Drive
      try {
        if (this.driveInitialized) {
          await googleDriveConsolidatedService.deleteEmployeeFolder(employeeEmail);
        }
      } catch (driveError) {
        console.warn('⚠️ [SUPABASE SERVICE] Error eliminando de Google Drive:', driveError);
      }

      // Limpiar cache
      this.cache.delete(employeeEmail);
      this.syncQueue.delete(employeeEmail);

      console.log('✅ [SUPABASE SERVICE] Carpeta eliminada exitosamente');
      
    } catch (error) {
      console.error('❌ [SUPABASE SERVICE] Error en deleteEmployeeFolder:', error);
      throw error;
    }
  }

  /**
   * 🔄 FORZAR SINCRONIZACIÓN COMPLETA
   */
  async forceFullSync() {
    try {
      console.log('🔄 [SYNC] Iniciando sincronización completa...');
      
      // Obtener todas las carpetas de Supabase
      const { folders } = await this.getAllEmployeeFolders(1000, 0);
      
      // Sincronizar cada carpeta con Google Drive
      for (const folder of folders) {
        await this.scheduleGoogleDriveSync(folder.employee_email, folder);
      }
      
      console.log('✅ [SYNC] Sincronización completa iniciada');
      
    } catch (error) {
      console.error('❌ [SYNC] Error en sincronización completa:', error);
      throw error;
    }
  }

  /**
   * 📋 CREAR CARPETA BÁSICA
   */
  createBasicFolder(employeeEmail) {
    return {
      email: employeeEmail,
      employeeName: 'Empleado',
      employeePosition: '',
      employeeDepartment: '',
      employeePhone: '',
      employeeRegion: '',
      employeeLevel: '',
      employeeWorkMode: '',
      employeeContractType: '',
      companyName: 'Empresa',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      knowledgeBase: {
        faqs: [],
        documents: [],
        policies: [],
        procedures: []
      },
      conversationHistory: [],
      settings: {
        notificationPreferences: {
          whatsapp: true,
          telegram: true,
          email: true
        },
        responseLanguage: 'es',
        timezone: 'America/Santiago'
      },
      source: 'basic_fallback',
      lastSync: new Date().toISOString()
    };
  }

  /**
   * 🔄 SINCRONIZACIÓN PERIÓDICA
   */
  startPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.size > 0) {
        this.processSyncQueue();
      }
    }, this.syncConfig.syncInterval);
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DEL SERVICIO
   */
  getServiceStats() {
    return {
      syncQueueSize: this.syncQueue.size,
      cacheSize: this.cache.size,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      initialized: this.initialized,
      driveInitialized: this.driveInitialized,
      pendingSyncs: Array.from(this.syncQueue.keys()),
      lastSyncTime: new Date().toISOString(),
      architecture: 'Frontend → Supabase → Google Drive'
    };
  }
}

// Instancia singleton
const supabaseEmployeeFolderService = new SupabaseEmployeeFolderService();

export default supabaseEmployeeFolderService;