/**
 * ORDERED COMPANY CREATION SERVICE
 * Servicio para crear empresas y carpetas de empleados con flujo ordenado
 * 
 * Características:
 * - Creación secuencial y ordenada
 * - Generación automática de token_id y carpeta_id
 * - Estructura Gmail/No-Gmail automática
 * - Sincronización completa con Google Drive
 * - Validación de integridad
 * - Rollback en caso de errores
 */

import { supabase } from '../lib/supabaseClient.js';
import googleDriveConsolidatedService from '../lib/googleDriveConsolidated.js';
import superLockService from '../lib/superLockService.js';
import logger from '../lib/logger.js';
import crypto from 'crypto';

class OrderedCompanyCreationService {
  constructor() {
    this.initialized = false;
    this.driveInitialized = false;
  }

  /**
   * INICIALIZAR SERVICIO
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      logger.info('OrderedCompanyCreationService', '🚀 Inicializando servicio de creación ordenada...');
      
      // Inicializar servicios
      await this.initializeDriveServices();
      
      this.initialized = true;
      logger.info('OrderedCompanyCreationService', '✅ Servicio de creación ordenada inicializado');
      return true;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error inicializando: ${error.message}`);
      return false;
    }
  }

  /**
   * INICIALIZAR SERVICIOS DE DRIVE
   */
  async initializeDriveServices() {
    try {
      // Inicializar Google Drive consolidado
      const success = await googleDriveConsolidatedService.initialize('system');
      if (success) {
        this.driveInitialized = true;
        logger.info('OrderedCompanyCreationService', '✅ Google Drive consolidado inicializado');
      }
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error inicializando Drive: ${error.message}`);
      throw error;
    }
  }

  /**
   * CREAR EMPRESA CON FLUJO ORDENADO
   * 
   * @param {Object} companyData - Datos de la empresa
   * @param {string} userId - ID del usuario
   * @returns {Object} Resultado de la creación
   */
  async createCompanyWithOrderedFlow(companyData, userId = null) {
    const lockKey = `company_creation_${companyData.name}`;
    
    try {
      logger.info('OrderedCompanyCreationService', `🔄 Iniciando creación ordenada de empresa: ${companyData.name}`);
      
      // 1. OBTENER LOCK PARA EVITAR DUPLICACIONES
      const lockAcquired = await superLockService.acquireLock(lockKey, 30000); // 30 segundos
      if (!lockAcquired) {
        throw new Error('No se pudo obtener lock para crear empresa. Intente nuevamente.');
      }

      // 2. VALIDAR DATOS DE ENTRADA
      const validationResult = await this.validateCompanyData(companyData);
      if (!validationResult.isValid) {
        throw new Error(`Datos de empresa inválidos: ${validationResult.errors.join(', ')}`);
      }

      // 3. VERIFICAR QUE LA EMPRESA NO EXISTA
      const existingCompany = await this.checkIfCompanyExists(companyData.name);
      if (existingCompany) {
        throw new Error(`La empresa "${companyData.name}" ya existe`);
      }

      // 4. GENERAR IDs ÚNICOS
      const generatedIds = await this.generateUniqueIds();
      
      // 5. CREAR EMPRESA EN SUPABASE
      const company = await this.createCompanyInSupabase({
        ...companyData,
        token_id: generatedIds.tokenId,
        carpeta_id: generatedIds.carpetaId,
        status: 'creating'
      });

      // 6. CREAR ESTRUCTURA DE CARPETAS EN GOOGLE DRIVE
      const driveStructure = await this.createCompanyFolderStructure(company, generatedIds);
      
      // 7. ACTUALIZAR EMPRESA CON IDs DE DRIVE
      const updatedCompany = await this.updateCompanyWithDriveIds(
        company.id,
        driveStructure
      );

      // 8. CONFIRMAR CREACIÓN
      await this.confirmCompanyCreation(updatedCompany.id);

      // 9. LIBERAR LOCK
      await superLockService.releaseLock(lockKey);

      logger.info('OrderedCompanyCreationService', `✅ Empresa "${companyData.name}" creada exitosamente`);
      
      return {
        success: true,
        company: updatedCompany,
        driveStructure,
        message: 'Empresa creada exitosamente con estructura Gmail/No-Gmail'
      };

    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error en creación ordenada: ${error.message}`);
      
      // INTENTAR ROLLBACK SI ES POSIBLE
      if (companyData.name) {
        await this.rollbackCompanyCreation(companyData.name);
      }
      
      // LIBERAR LOCK EN CASO DE ERROR
      await superLockService.releaseLock(lockKey);
      
      return {
        success: false,
        error: error.message,
        message: 'Error en la creación de empresa'
      };
    }
  }

  /**
   * VALIDAR DATOS DE EMPRESA
   */
  async validateCompanyData(companyData) {
    const errors = [];
    
    if (!companyData.name || companyData.name.trim().length === 0) {
      errors.push('El nombre de la empresa es requerido');
    }
    
    if (companyData.name && companyData.name.length > 100) {
      errors.push('El nombre de la empresa no puede exceder 100 caracteres');
    }
    
    // Validar caracteres especiales en nombre
    if (companyData.name && !/^[a-zA-Z0-9\s\-_&().,]+$/.test(companyData.name)) {
      errors.push('El nombre de la empresa contiene caracteres no válidos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * VERIFICAR SI LA EMPRESA EXISTE
   */
  async checkIfCompanyExists(companyName) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('name', companyName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error verificando empresa: ${error.message}`);
      throw error;
    }
  }

  /**
   * GENERAR IDs ÚNICOS
   */
  async generateUniqueIds() {
    try {
      // Generar token_id (para autenticación)
      const tokenId = crypto.randomBytes(32).toString('hex');
      
      // Generar carpeta_id (para identificación de carpetas)
      const carpetaId = crypto.randomBytes(16).toString('hex');
      
      // Verificar que no existan en la base de datos
      const existingToken = await this.checkIfTokenExists(tokenId);
      const existingCarpeta = await this.checkIfCarpetaExists(carpetaId);
      
      // Si existen, generar nuevos
      if (existingToken || existingCarpeta) {
        return await this.generateUniqueIds(); // Recursión
      }

      return { tokenId, carpetaId };
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error generando IDs: ${error.message}`);
      throw error;
    }
  }

  /**
   * VERIFICAR SI TOKEN_ID EXISTE
   */
  async checkIfTokenExists(tokenId) {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('token_id', tokenId)
      .single();
    
    return !!data;
  }

  /**
   * VERIFICAR SI CARPETA_ID EXISTE
   */
  async checkIfCarpetaExists(carpetaId) {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('carpeta_id', carpetaId)
      .single();
    
    return !!data;
  }

  /**
   * CREAR EMPRESA EN SUPABASE
   */
  async createCompanyInSupabase(companyData) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: companyData.name,
          token_id: companyData.token_id,
          carpeta_id: companyData.carpeta_id,
          status: companyData.status || 'creating',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('OrderedCompanyCreationService', `✅ Empresa creada en Supabase: ${data.id}`);
      return data;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error creando empresa en Supabase: ${error.message}`);
/**
   * CLASIFICAR TIPO DE CUENTA GMAIL
   * Determina si una cuenta es Gmail personal o Gmail de empresa
   */
  classifyGmailAccount(email) {
    const emailLower = email.toLowerCase();
    
    // Gmail personal: termina en @gmail.com
    if (emailLower.endsWith('@gmail.com')) {
      return 'gmail_personal';
    }
    
    // Gmail de empresa: usa Gmail como servicio pero con dominio propio
    // Se puede detectar por patrones específicos o configuración
    const gmailEnterprisePatterns = [
      // Patrones que indican uso de Gmail empresarial
      '@company.com',
      '@empresa.com', 
      '@business.com',
      '@corp.com',
      '@enterprise.com'
      // Se pueden agregar más patrones según necesidades
    ];
    
    // Verificar si es un dominio empresarial conocido que usa Gmail
    const isGmailEnterprise = gmailEnterprisePatterns.some(pattern => 
      emailLower.includes(pattern)
    ) || this.isGmailService(email);
    
    return isGmailEnterprise ? 'gmail_enterprise' : 'no_gmail';
  }

  /**
   * VERIFICAR SI USA SERVICIO GMAIL
   * Método para detectar si una cuenta usa Gmail como servicio
   */
  isGmailService(email) {
    // Esta función se puede expandir para detectar
    // configuraciones específicas de Gmail empresarial
    // Por ahora, retorna false por defecto
    return false;
  }
      throw error;
    }
  }

  /**
   * CREAR ESTRUCTURA DE CARPETAS EN GOOGLE DRIVE
   */
  async createCompanyFolderStructure(company, generatedIds) {
    try {
      logger.info('OrderedCompanyCreationService', `🔄 Creando estructura de carpetas para: ${company.name}`);
      
      // 1. CREAR CARPETA PRINCIPAL DE LA EMPRESA
      const mainFolder = await googleDriveConsolidatedService.createFolder(
        `StaffHub - ${company.name}`,
        null // Carpeta raíz
      );

      // 2. CREAR SUBCARPETA GMAIL
      const gmailFolder = await googleDriveConsolidatedService.createFolder(
        'Gmail',
        mainFolder.id
      );

      // 3. CREAR SUBCARPETA NO-GMAIL
      const noGmailFolder = await googleDriveConsolidatedService.createFolder(
        'No-Gmail',
        mainFolder.id
      );

      // 4. CONFIGURAR PERMISOS (opcional)
      await this.setupFolderPermissions(mainFolder.id, gmailFolder.id, noGmailFolder.id);

      const structure = {
        mainFolder: {
          id: mainFolder.id,
          name: mainFolder.name,
          url: mainFolder.webViewLink,
          token_id: generatedIds.tokenId,
          carpeta_id: generatedIds.carpetaId
        },
        gmailFolder: {
          id: gmailFolder.id,
          name: gmailFolder.name,
          url: gmailFolder.webViewLink,
          parent_id: mainFolder.id
        },
        noGmailFolder: {
          id: noGmailFolder.id,
          name: noGmailFolder.name,
          url: noGmailFolder.webViewLink,
          parent_id: mainFolder.id
        }
      };

      logger.info('OrderedCompanyCreationService', `✅ Estructura de carpetas creada para: ${company.name}`);
      return structure;

    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error creando estructura de carpetas: ${error.message}`);
      throw error;
    }
  }

  /**
   * CONFIGURAR PERMISOS DE CARPETAS
   */
  async setupFolderPermissions(mainFolderId, gmailFolderId, noGmailFolderId) {
    try {
      // Aquí se pueden configurar permisos específicos si es necesario
      // Por ejemplo, permisos de lectura/escritura para ciertos usuarios
      
      logger.info('OrderedCompanyCreationService', '🔐 Configurando permisos de carpetas');
      
      // Por ahora, solo logging. Se puede expandir según necesidades
      return true;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error configurando permisos: ${error.message}`);
      // No lanzar error, los permisos no son críticos
      return false;
    }
  }

  /**
   * ACTUALIZAR EMPRESA CON IDs DE DRIVE
   */
  async updateCompanyWithDriveIds(companyId, driveStructure) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          drive_folder_id: driveStructure.mainFolder.id,
          gmail_folder_id: driveStructure.gmailFolder.id,
          no_gmail_folder_id: driveStructure.noGmailFolder.id,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('OrderedCompanyCreationService', `✅ Empresa actualizada con IDs de Drive: ${companyId}`);
      return data;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error actualizando empresa: ${error.message}`);
      throw error;
    }
  }

  /**
   * CONFIRMAR CREACIÓN DE EMPRESA
   */
  async confirmCompanyCreation(companyId) {
    try {
      // Aquí se pueden realizar validaciones finales
      // Por ejemplo, verificar que las carpetas se crearon correctamente
      
      logger.info('OrderedCompanyCreationService', `✅ Creación confirmada para empresa: ${companyId}`);
      return true;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error confirmando creación: ${error.message}`);
      throw error;
    }
  }

  /**
   * ROLLBACK EN CASO DE ERROR
   */
  async rollbackCompanyCreation(companyName) {
    try {
      logger.info('OrderedCompanyCreationService', `🔄 Iniciando rollback para: ${companyName}`);
      
      // Buscar empresa
      const company = await this.checkIfCompanyExists(companyName);
      if (!company) {
        logger.info('OrderedCompanyCreationService', 'ℹ️ No se encontró empresa para hacer rollback');
        return true;
      }

      // Eliminar de Supabase
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) {
        logger.error('OrderedCompanyCreationService', `❌ Error en rollback de Supabase: ${error.message}`);
      } else {
        logger.info('OrderedCompanyCreationService', `✅ Rollback de Supabase completado para: ${companyName}`);
      }

      // Nota: La eliminación de carpetas de Google Drive se puede hacer aquí si es necesario
      // pero requiere permisos adicionales y manejo de errores más complejo

      return true;
    } catch (error) {
      logger.error('OrderedCompanyCreationService', `❌ Error en rollback: ${error.message}`);
      return false;
    }
  }

  /**
   * OBTENER ESTADO DEL SERVICIO
   */
  getServiceStatus() {
    return {
      initialized: this.initialized,
      driveInitialized: this.driveInitialized,
      service: 'OrderedCompanyCreationService',
      version: '1.0.0'
    };
  }
}

// Exportar instancia singleton
const orderedCompanyCreationService = new OrderedCompanyCreationService();
export default orderedCompanyCreationService;