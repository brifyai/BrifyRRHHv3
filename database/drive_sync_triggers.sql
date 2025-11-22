-- Triggers para sincronización bidireccional entre Supabase y Google Drive
-- Estos triggers detectan cambios en la tabla employee_folders y ejecutan acciones correspondientes

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