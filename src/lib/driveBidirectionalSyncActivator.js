/**
 * Activador de Sincronización Bidireccional
 * Este archivo configura y activa todos los componentes necesarios para la sincronización bidireccional
 */

import { supabase } from './supabaseClient.js';
import googleDriveConsolidatedService from './googleDriveConsolidated.js';
import driveBidirectionalSyncService from './driveBidirectionalSyncService.js';
import logger from './logger.js';

/**
 * Clase para activar y configurar la sincronización bidireccional
 */
class DriveBidirectionalSyncActivator {
  constructor() {
    this.isActivated = false;
    this.config = {
      // Configuración de la base de datos
      dbConfig: {
        applySoftDelete: true,
        applyTriggers: true,
        applyIndexes: true,
        applyViews: true,
        applyFunctions: true
      },
      
      // Configuración del servicio
      serviceConfig: {
        auditIntervalMinutes: 60,
        retryAttempts: 3,
        retryDelayMs: 1000,
        batchSize: 50,
        enableNotifications: true,
        notificationThrottleMs: 5000
      },
      
      // Configuración de webhooks
      webhookConfig: {
        renewBeforeExpiration: true,
        renewalBufferMinutes: 60,
        maxRetries: 3
      },
      
      // Configuración de auditoría
      auditConfig: {
        checkPermissions: true,
        autoFixIssues: true,
        detailedLogging: true
      }
    };
  }

  /**
   * Activa la sincronización bidireccional completa
   * @param {object} customConfig - Configuración personalizada (opcional)
   * @returns {Promise<object>} - Resultado de la activación
   */
  async activate(customConfig = {}) {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🚀 Iniciando activación de sincronización bidireccional...');
      
      // Aplicar configuración personalizada
      this.config = { ...this.config, ...customConfig };
      
      // 1. Verificar autenticación
      if (!googleDriveConsolidatedService.authService.isAuthenticated()) {
        throw new Error('Google Drive no está autenticado. Por favor, conecta tu cuenta de Google Drive primero.');
      }
      
      // 2. Configurar base de datos
      const dbConfigResult = await this.configureDatabase();
      if (!dbConfigResult.success) {
        throw new Error(`Error configurando base de datos: ${dbConfigResult.error}`);
      }
      
      // 3. Inicializar servicio de sincronización
      const serviceInitResult = await this.initializeSyncService();
      if (!serviceInitResult.success) {
        throw new Error(`Error inicializando servicio: ${serviceInitResult.error}`);
      }
      
      // 4. Iniciar sincronización
      const startResult = await this.startSync();
      if (!startResult.success) {
        throw new Error(`Error iniciando sincronización: ${startResult.error}`);
      }
      
      // 5. Ejecutar auditoría inicial
      const auditResult = await this.runInitialAudit();
      if (!auditResult.success) {
        logger.warn('DriveBidirectionalSyncActivator', `⚠️ Advertencia en auditoría inicial: ${auditResult.error}`);
      }
      
      this.isActivated = true;
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Sincronización bidireccional activada correctamente');
      
      return {
        success: true,
        message: 'Sincronización bidireccional activada correctamente',
        stats: {
          dbConfigured: dbConfigResult,
          serviceInitialized: serviceInitResult,
          syncStarted: startResult,
          auditCompleted: auditResult
        }
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error activando sincronización: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Configura la base de datos con los componentes necesarios
   * @returns {Promise<object>} - Resultado de la configuración
   */
  async configureDatabase() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔧 Configurando base de datos...');
      
      // 1. Aplicar soft delete
      if (this.config.dbConfig.applySoftDelete) {
        await this.applySoftDelete();
      }
      
      // 2. Aplicar triggers
      if (this.config.dbConfig.applyTriggers) {
        await this.applyTriggers();
      }
      
      // 3. Aplicar índices
      if (this.config.dbConfig.applyIndexes) {
        await this.applyIndexes();
      }
      
      // 4. Aplicar vistas
      if (this.config.dbConfig.applyViews) {
        await this.applyViews();
      }
      
      // 5. Aplicar funciones
      if (this.config.dbConfig.applyFunctions) {
        await this.applyFunctions();
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Base de datos configurada correctamente');
      
      return {
        success: true,
        message: 'Base de datos configurada correctamente'
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error configurando base de datos: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Aplica el soporte de soft delete a la tabla employee_folders
   * @returns {Promise<void>}
   */
  async applySoftDelete() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔄 Aplicando soporte de soft delete...');
      
      // Verificar si ya existe el campo folder_status
      const { data: columnExists } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'employee_folders')
        .eq('column_name', 'folder_status')
        .maybeSingle();
      
      if (!columnExists) {
        // Agregar campo para soft delete
        await supabase.rpc('execute_sql', {
          query: `
            ALTER TABLE employee_folders 
            ADD COLUMN IF NOT EXISTS folder_status VARCHAR(20) DEFAULT 'active' 
            CHECK (folder_status IN ('active', 'deleted', 'sync_error', 'archived'));
            
            ALTER TABLE employee_folders 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
          `
        });
        
        logger.info('DriveBidirectionalSyncActivator', '✅ Campos de soft delete agregados');
      } else {
        logger.info('DriveBidirectionalSyncActivator', 'ℹ️ Campos de soft delete ya existen');
      }
      
      // Actualizar carpetas existentes para que tengan el estado correcto
      await supabase.rpc('execute_sql', {
        query: `
          UPDATE employee_folders 
          SET folder_status = 'active' 
          WHERE folder_status IS NULL;
        `
      });
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Soft delete aplicado correctamente');
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error aplicando soft delete: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aplica los triggers para sincronización bidireccional
   * @returns {Promise<void>}
   */
  async applyTriggers() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔄 Aplicando triggers de sincronización...');
      
      // Verificar si ya existe el trigger de eliminación
      const { data: triggerExists } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name')
        .eq('trigger_name', 'trigger_folder_deletion')
        .maybeSingle();
      
      if (!triggerExists) {
        // Aplicar triggers desde el archivo drive_sync_triggers.sql
        await supabase.rpc('execute_sql', {
          query: `
            -- Tabla para registrar el log de sincronización
            CREATE TABLE IF NOT EXISTS drive_sync_log (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              employee_email TEXT NOT NULL,
              action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
              source TEXT NOT NULL, -- 'supabase', 'drive', 'api'
              details JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Índices para mejorar el rendimiento de las consultas
            CREATE INDEX IF NOT EXISTS idx_drive_sync_log_employee_email ON drive_sync_log(employee_email);
            CREATE INDEX IF NOT EXISTS idx_drive_sync_log_action_type ON drive_sync_log(action_type);
            CREATE INDEX IF NOT EXISTS idx_drive_sync_log_created_at ON drive_sync_log(created_at);
            
            -- Tabla para almacenar los tokens de sincronización
            CREATE TABLE IF NOT EXISTS drive_sync_tokens (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              start_page_token TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Tabla para almacenar los canales de webhook
            CREATE TABLE IF NOT EXISTS drive_webhook_channels (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              channel_id TEXT UNIQUE NOT NULL,
              resource_id TEXT,
              webhook_url TEXT,
              expiration TIMESTAMP WITH TIME ZONE,
              is_active BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Función para manejar la eliminación de carpetas
            CREATE OR REPLACE FUNCTION handle_folder_deletion()
            RETURNS TRIGGER AS $$
            BEGIN
              -- Registrar la eliminación en el log de sincronización
              INSERT INTO drive_sync_log (
                employee_email,
                action_type,
                source,
                details,
                created_at
              ) VALUES (
                OLD.employee_email,
                'deleted',
                'supabase',
                json_build_object(
                  'folder_id', OLD.id,
                  'drive_folder_id', OLD.drive_folder_id,
                  'deleted_at', NOW()
                ),
                NOW()
              );
              
              -- Si la carpeta tiene un ID de Google Drive, intentar eliminar de Drive también
              IF OLD.drive_folder_id IS NOT NULL THEN
                -- Aquí se podría implementar una llamada a una API o función externa
                -- Por ahora, solo registramos la acción
                PERFORM net.http_post(
                  url := COALESCE(current_setting('app.drive_webhook_url', true), 'http://localhost:3000/api/webhooks/drive'),
                  headers := '{"Content-Type": "application/json"}'::jsonb,
                  body := json_build_object(
                    'action', 'delete_folder',
                    'folder_id', OLD.drive_folder_id,
                    'employee_email', OLD.employee_email,
                    'source', 'supabase_trigger'
                  )::text
                );
              END IF;
              
              RETURN OLD;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Función para manejar la actualización de carpetas
            CREATE OR REPLACE FUNCTION handle_folder_update()
            RETURNS TRIGGER AS $$
            BEGIN
              -- Registrar la actualización en el log de sincronización
              INSERT INTO drive_sync_log (
                employee_email,
                action_type,
                source,
                details,
                created_at
              ) VALUES (
                NEW.employee_email,
                'updated',
                'supabase',
                json_build_object(
                  'folder_id', NEW.id,
                  'drive_folder_id', NEW.drive_folder_id,
                  'changes', json_build_object(
                    'old_status', OLD.folder_status,
                    'new_status', NEW.folder_status,
                    'old_drive_id', OLD.drive_folder_id,
                    'new_drive_id', NEW.drive_folder_id
                  )
                ),
                NOW()
              );
              
              -- Si la carpeta fue reactivada después de estar eliminada
              IF OLD.folder_status = 'deleted' AND NEW.folder_status = 'active' THEN
                -- Notificar que la carpeta fue reactivada
                PERFORM net.http_post(
                  url := COALESCE(current_setting('app.drive_webhook_url', true), 'http://localhost:3000/api/webhooks/drive'),
                  headers := '{"Content-Type": "application/json"}'::jsonb,
                  body := json_build_object(
                    'action', 'reactivate_folder',
                    'folder_id', NEW.drive_folder_id,
                    'employee_email', NEW.employee_email,
                    'source', 'supabase_trigger'
                  )::text
                );
              END IF;
              
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Función para manejar la inserción de carpetas
            CREATE OR REPLACE FUNCTION handle_folder_insert()
            RETURNS TRIGGER AS $$
            BEGIN
              -- Registrar la creación en el log de sincronización
              INSERT INTO drive_sync_log (
                employee_email,
                action_type,
                source,
                details,
                created_at
              ) VALUES (
                NEW.employee_email,
                'created',
                'supabase',
                json_build_object(
                  'folder_id', NEW.id,
                  'drive_folder_id', NEW.drive_folder_id,
                  'folder_status', NEW.folder_status
                ),
                NOW()
              );
              
              -- Si la carpeta tiene un ID de Google Drive, verificar que existe
              IF NEW.drive_folder_id IS NOT NULL THEN
                -- Aquí se podría implementar una verificación de existencia en Drive
                -- Por ahora, solo registramos la acción
                PERFORM net.http_post(
                  url := COALESCE(current_setting('app.drive_webhook_url', true), 'http://localhost:3000/api/webhooks/drive'),
                  headers := '{"Content-Type": "application/json"}'::jsonb,
                  body := json_build_object(
                    'action', 'verify_folder',
                    'folder_id', NEW.drive_folder_id,
                    'employee_email', NEW.employee_email,
                    'source', 'supabase_trigger'
                  )::text
                );
              END IF;
              
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Crear los triggers en la tabla employee_folders
            DROP TRIGGER IF EXISTS trigger_folder_deletion ON employee_folders;
            CREATE TRIGGER trigger_folder_deletion
              AFTER DELETE ON employee_folders
              FOR EACH ROW
              EXECUTE FUNCTION handle_folder_deletion();
            
            DROP TRIGGER IF EXISTS trigger_folder_update ON employee_folders;
            CREATE TRIGGER trigger_folder_update
              AFTER UPDATE ON employee_folders
              FOR EACH ROW
              EXECUTE FUNCTION handle_folder_update();
            
            DROP TRIGGER IF EXISTS trigger_folder_insert ON employee_folders;
            CREATE TRIGGER trigger_folder_insert
              AFTER INSERT ON employee_folders
              FOR EACH ROW
              EXECUTE FUNCTION handle_folder_insert();
          `
        });
        
        logger.info('DriveBidirectionalSyncActivator', '✅ Triggers de sincronización aplicados');
      } else {
        logger.info('DriveBidirectionalSyncActivator', 'ℹ️ Triggers de sincronización ya existen');
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Triggers aplicados correctamente');
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error aplicando triggers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aplica índices para mejorar el rendimiento
   * @returns {Promise<void>}
   */
  async applyIndexes() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔄 Aplicando índices...');
      
      // Verificar si ya existe el índice de estado
      const { data: indexExists } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('indexname', 'idx_employee_folders_status')
        .maybeSingle();
      
      if (!indexExists) {
        await supabase.rpc('execute_sql', {
          query: `
            -- Agregar índices para mejorar rendimiento
            CREATE INDEX IF NOT EXISTS idx_employee_folders_status 
            ON employee_folders(folder_status);
            
            CREATE INDEX IF NOT EXISTS idx_employee_folders_deleted_at 
            ON employee_folders(deleted_at) WHERE deleted_at IS NOT NULL;
          `
        });
        
        logger.info('DriveBidirectionalSyncActivator', '✅ Índices aplicados');
      } else {
        logger.info('DriveBidirectionalSyncActivator', 'ℹ️ Índices ya existen');
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Índices aplicados correctamente');
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error aplicando índices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aplica vistas para facilitar las consultas
   * @returns {Promise<void>}
   */
  async applyViews() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔄 Aplicando vistas...');
      
      // Verificar si ya existe la vista de carpetas activas
      const { data: viewExists } = await supabase
        .from('information_schema.views')
        .select('table_name')
        .eq('table_name', 'active_employee_folders')
        .maybeSingle();
      
      if (!viewExists) {
        await supabase.rpc('execute_sql', {
          query: `
            -- Vista para carpetas activas (excluye eliminadas)
            CREATE OR REPLACE VIEW active_employee_folders AS
            SELECT 
                id,
                employee_email,
                employee_name,
                employee_id,
                employee_position,
                employee_department,
                employee_phone,
                employee_region,
                employee_level,
                employee_work_mode,
                employee_contract_type,
                company_id,
                company_name,
                drive_folder_id,
                drive_folder_url,
                settings,
                created_at,
                updated_at
            FROM employee_folders
            WHERE folder_status = 'active';
            
            -- Vista para carpetas eliminadas (para auditoría)
            CREATE OR REPLACE VIEW deleted_employee_folders AS
            SELECT 
                id,
                employee_email,
                employee_name,
                employee_id,
                company_id,
                company_name,
                drive_folder_id,
                folder_status,
                deleted_at,
                created_at,
                updated_at
            FROM employee_folders
            WHERE folder_status = 'deleted'
            ORDER BY deleted_at DESC;
            
            -- Vista para estadísticas de sincronización
            CREATE OR REPLACE VIEW sync_statistics AS
            SELECT 
                'Total Activas'::TEXT as metric,
                COUNT(*) FILTER (WHERE folder_status = 'active')::BIGINT as value
            FROM employee_folders
            UNION ALL
            SELECT 
                'Total Eliminadas'::TEXT as metric,
                COUNT(*) FILTER (WHERE folder_status = 'deleted')::BIGINT as value
            FROM employee_folders
            UNION ALL
            SELECT 
                'Con Errores'::TEXT as metric,
                COUNT(*) FILTER (WHERE folder_status = 'sync_error')::BIGINT as value
            FROM employee_folders
            UNION ALL
            SELECT 
                'Sin Drive ID'::TEXT as metric,
                COUNT(*) FILTER (WHERE drive_folder_id IS NULL OR drive_folder_id = '')::BIGINT as value
            FROM employee_folders
            WHERE folder_status = 'active';
          `
        });
        
        logger.info('DriveBidirectionalSyncActivator', '✅ Vistas aplicadas');
      } else {
        logger.info('DriveBidirectionalSyncActivator', 'ℹ️ Vistas ya existen');
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Vistas aplicadas correctamente');
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error aplicando vistas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aplica funciones de utilidad
   * @returns {Promise<void>}
   */
  async applyFunctions() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔄 Aplicando funciones...');
      
      // Verificar si ya existe la función de soft delete
      const { data: functionExists } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', 'soft_delete_employee_folder')
        .maybeSingle();
      
      if (!functionExists) {
        await supabase.rpc('execute_sql', {
          query: `
            -- Función para contar carpetas por estado
            CREATE OR REPLACE FUNCTION count_folders_by_status()
            RETURNS TABLE(
              status TEXT,
              count BIGINT
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    folder_status::TEXT,
                    COUNT(*)::BIGINT
                FROM employee_folders
                GROUP BY folder_status;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Función de utilidad para soft delete
            CREATE OR REPLACE FUNCTION soft_delete_employee_folder(p_employee_email TEXT)
            RETURNS BOOLEAN AS $$
            DECLARE
                folder_id UUID;
            BEGIN
                -- Obtener ID de la carpeta
                SELECT id INTO folder_id
                FROM employee_folders
                WHERE employee_email = p_employee_email AND folder_status = 'active';
                
                IF folder_id IS NULL THEN
                    RETURN FALSE;
                END IF;
                
                -- Marcar como eliminada
                UPDATE employee_folders
                SET 
                    folder_status = 'deleted',
                    deleted_at = CURRENT_TIMESTAMP
                WHERE id = folder_id;
                
                RETURN TRUE;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Función de utilidad para restaurar carpeta eliminada
            CREATE OR REPLACE FUNCTION restore_employee_folder(p_employee_email TEXT)
            RETURNS BOOLEAN AS $$
            DECLARE
                folder_id UUID;
            BEGIN
                -- Obtener ID de la carpeta eliminada
                SELECT id INTO folder_id
                FROM employee_folders
                WHERE employee_email = p_employee_email AND folder_status = 'deleted';
                
                IF folder_id IS NULL THEN
                    RETURN FALSE;
                END IF;
                
                -- Restaurar carpeta
                UPDATE employee_folders
                SET 
                    folder_status = 'active',
                    deleted_at = NULL
                WHERE id = folder_id;
                
                RETURN TRUE;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Función para limpiar logs antiguos (más de 30 días)
            CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
            RETURNS void AS $$
            BEGIN
              DELETE FROM drive_sync_log
              WHERE created_at < NOW() - INTERVAL '30 days';
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Función para obtener estadísticas de sincronización
            CREATE OR REPLACE FUNCTION get_sync_stats()
            RETURNS TABLE (
              total_actions BIGINT,
              actions_by_type JSONB,
              recent_actions BIGINT
            ) AS $$
            BEGIN
              RETURN QUERY
              SELECT 
                COUNT(*) as total_actions,
                jsonb_object_agg(action_type, type_count) as actions_by_type,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_actions
              FROM (
                SELECT action_type, COUNT(*) as type_count
                FROM drive_sync_log
                GROUP BY action_type
              ) as type_counts;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `
        });
        
        logger.info('DriveBidirectionalSyncActivator', '✅ Funciones aplicadas');
      } else {
        logger.info('DriveBidirectionalSyncActivator', 'ℹ️ Funciones ya existen');
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Funciones aplicadas correctamente');
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error aplicando funciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicializa el servicio de sincronización bidireccional
   * @returns {Promise<object>} - Resultado de la inicialización
   */
  async initializeSyncService() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔧 Inicializando servicio de sincronización...');
      
      // Inicializar servicio con configuración personalizada
      const initResult = await driveBidirectionalSyncService.initialize(this.config.serviceConfig);
      
      if (!initResult) {
        throw new Error('Error inicializando el servicio de sincronización');
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Servicio de sincronización inicializado correctamente');
      
      return {
        success: true,
        message: 'Servicio de sincronización inicializado correctamente'
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error inicializando servicio: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Inicia la sincronización bidireccional
   * @returns {Promise<object>} - Resultado del inicio
   */
  async startSync() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🚀 Iniciando sincronización bidireccional...');
      
      // Iniciar servicio
      const startResult = await driveBidirectionalSyncService.start();
      
      if (!startResult) {
        throw new Error('Error iniciando el servicio de sincronización');
      }
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Sincronización bidireccional iniciada correctamente');
      
      return {
        success: true,
        message: 'Sincronización bidireccional iniciada correctamente'
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error iniciando sincronización: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ejecuta una auditoría inicial del sistema
   * @returns {Promise<object>} - Resultado de la auditoría
   */
  async runInitialAudit() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '🔍 Ejecutando auditoría inicial...');
      
      // Ejecutar auditoría completa
      const auditResult = await driveBidirectionalSyncService.runFullAudit();
      
      logger.info('DriveBidirectionalSyncActivator', `✅ Auditoría inicial completada: ${auditResult.summary.totalIssues} problemas encontrados, ${auditResult.autoFixed} solucionados automáticamente`);
      
      return {
        success: true,
        message: 'Auditoría inicial completada',
        data: auditResult
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error en auditoría inicial: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el estado actual de la sincronización
   * @returns {object} - Estado de la sincronización
   */
  getSyncStatus() {
    try {
      // Obtener estadísticas del servicio
      const stats = driveBidirectionalSyncService.getStats();
      
      return {
        isActivated: this.isActivated,
        isRunning: stats.isRunning,
        isInitialized: stats.isInitialized,
        stats: stats.stats,
        config: this.config
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error obteniendo estado: ${error.message}`);
      return {
        isActivated: false,
        isRunning: false,
        isInitialized: false,
        error: error.message
      };
    }
  }

  /**
   * Desactiva la sincronización bidireccional
   * @returns {Promise<object>} - Resultado de la desactivación
   */
  async deactivate() {
    try {
      logger.info('DriveBidirectionalSyncActivator', '⏹️ Desactivando sincronización bidireccional...');
      
      // Detener servicio
      await driveBidirectionalSyncService.stop();
      
      this.isActivated = false;
      
      logger.info('DriveBidirectionalSyncActivator', '✅ Sincronización bidireccional desactivada correctamente');
      
      return {
        success: true,
        message: 'Sincronización bidireccional desactivada correctamente'
      };
    } catch (error) {
      logger.error('DriveBidirectionalSyncActivator', `❌ Error desactivando sincronización: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia singleton
const driveBidirectionalSyncActivator = new DriveBidirectionalSyncActivator();

export default driveBidirectionalSyncActivator;
export { DriveBidirectionalSyncActivator };