-- =====================================================
-- ACTUALIZACIÓN DE TABLA EMPLOYEE_FOLDERS PARA FLUJO ORDENADO
-- =====================================================
-- Fecha: 2025-11-24
-- Propósito: Agregar campos token_id, carpeta_id y email_type para el nuevo flujo ordenado
-- Estructura: Clasificación automática Gmail/No-Gmail

-- 1. AGREGAR NUEVOS CAMPOS A LA TABLA EMPLOYEE_FOLDERS
ALTER TABLE employee_folders 
ADD COLUMN IF NOT EXISTS token_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS carpeta_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS email_type VARCHAR(20) CHECK (email_type IN ('gmail', 'no_gmail')),
ADD COLUMN IF NOT EXISTS parent_folder_id VARCHAR(255);

-- 2. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_employee_folders_token_id ON employee_folders(token_id);
CREATE INDEX IF NOT EXISTS idx_employee_folders_carpeta_id ON employee_folders(carpeta_id);
CREATE INDEX IF NOT EXISTS idx_employee_folders_email_type ON employee_folders(email_type);
CREATE INDEX IF NOT EXISTS idx_employee_folders_parent_folder_id ON employee_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_employee_folders_company_email_type ON employee_folders(company_id, email_type);

-- 3. CREAR ÍNDICE COMPUESTO PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_employee_folders_unique_company_email ON employee_folders(company_id, employee_email) WHERE folder_status = 'active';

-- 4. AGREGAR COMENTARIOS A LOS CAMPOS
COMMENT ON COLUMN employee_folders.token_id IS 'ID único para autenticación y seguridad del empleado';
COMMENT ON COLUMN employee_folders.carpeta_id IS 'ID único para identificación de carpeta del empleado';
COMMENT ON COLUMN employee_folders.email_type IS 'Tipo de email: gmail (terminado en @gmail.com) o no_gmail (otros dominios)';
COMMENT ON COLUMN employee_folders.parent_folder_id IS 'ID de la carpeta padre (empresa, Gmail o No-Gmail)';

-- 5. CREAR FUNCIÓN PARA DETERMINAR TIPO DE EMAIL AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION determine_email_type(email_address TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Si termina en @gmail.com, es Gmail
  IF LOWER(email_address) LIKE '%@gmail.com' THEN
    RETURN 'gmail';
  ELSE
    RETURN 'no_gmail';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. CREAR FUNCIÓN PARA VALIDAR FORMATO DE IDs Y EMAIL
CREATE OR REPLACE FUNCTION validate_employee_folder_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que token_id tenga formato hexadecimal
  IF NEW.token_id IS NOT NULL AND NEW.token_id !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'token_id debe ser un hash hexadecimal de 64 caracteres';
  END IF;
  
  -- Validar que carpeta_id tenga formato hexadecimal
  IF NEW.carpeta_id IS NOT NULL AND NEW.carpeta_id !~ '^[a-f0-9]{32}$' THEN
    RAISE EXCEPTION 'carpeta_id debe ser un hash hexadecimal de 32 caracteres';
  END IF;
  
  -- Validar formato de email
  IF NEW.employee_email IS NOT NULL AND NEW.employee_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido: %', NEW.employee_email;
  END IF;
  
  -- Determinar email_type automáticamente si no se proporciona
  IF NEW.email_type IS NULL AND NEW.employee_email IS NOT NULL THEN
    NEW.email_type := determine_email_type(NEW.employee_email);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREAR TRIGGER PARA VALIDACIÓN
DROP TRIGGER IF EXISTS trigger_validate_employee_folder_ids ON employee_folders;
CREATE TRIGGER trigger_validate_employee_folder_ids
  BEFORE INSERT OR UPDATE ON employee_folders
  FOR EACH ROW
  EXECUTE FUNCTION validate_employee_folder_ids();

-- 8. CREAR FUNCIÓN PARA GENERAR IDs ÚNICOS AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION generate_employee_folder_ids()
RETURNS TRIGGER AS $$
DECLARE
  new_token_id VARCHAR(64);
  new_carpeta_id VARCHAR(32);
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Solo generar si no se proporcionan
  IF NEW.token_id IS NULL THEN
    LOOP
      new_token_id := encode(gen_random_bytes(32), 'hex');
      
      -- Verificar que no exista
      IF NOT EXISTS (SELECT 1 FROM employee_folders WHERE token_id = new_token_id) THEN
        NEW.token_id := new_token_id;
        EXIT;
      END IF;
      
      attempts := attempts + 1;
      IF attempts >= max_attempts THEN
        RAISE EXCEPTION 'No se pudo generar token_id único después de % intentos', max_attempts;
      END IF;
    END LOOP;
  END IF;
  
  IF NEW.carpeta_id IS NULL THEN
    LOOP
      new_carpeta_id := encode(gen_random_bytes(16), 'hex');
      
      -- Verificar que no exista
      IF NOT EXISTS (SELECT 1 FROM employee_folders WHERE carpeta_id = new_carpeta_id) THEN
        NEW.carpeta_id := new_carpeta_id;
        EXIT;
      END IF;
      
      attempts := attempts + 1;
      IF attempts >= max_attempts THEN
        RAISE EXCEPTION 'No se pudo generar carpeta_id único después de % intentos', max_attempts;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. CREAR TRIGGER PARA GENERACIÓN AUTOMÁTICA
DROP TRIGGER IF EXISTS trigger_generate_employee_folder_ids ON employee_folders;
CREATE TRIGGER trigger_generate_employee_folder_ids
  BEFORE INSERT ON employee_folders
  FOR EACH ROW
  EXECUTE FUNCTION generate_employee_folder_ids();

-- 10. CREAR VISTA PARA CONSULTAS OPTIMIZADAS
CREATE OR REPLACE VIEW employee_folders_with_company_structure AS
SELECT 
  ef.id,
  ef.employee_email,
  ef.employee_name,
  ef.company_id,
  c.name as company_name,
  ef.token_id,
  ef.carpeta_id,
  ef.email_type,
  ef.drive_folder_id,
  ef.parent_folder_id,
  ef.folder_status,
  ef.created_at,
  ef.updated_at,
  -- URLs de las carpetas
  CASE 
    WHEN ef.drive_folder_id IS NOT NULL THEN 
      'https://drive.google.com/drive/folders/' || ef.drive_folder_id 
    ELSE NULL 
  END as drive_folder_url,
  -- Determinar carpeta padre
  CASE 
    WHEN ef.email_type = 'gmail' THEN c.gmail_folder_id
    WHEN ef.email_type = 'no_gmail' THEN c.no_gmail_folder_id
    ELSE c.drive_folder_id
  END as expected_parent_folder_id
FROM employee_folders ef
JOIN companies c ON ef.company_id = c.id;

-- 11. CREAR VISTA PARA ESTADÍSTICAS DE EMPLEADOS
CREATE OR REPLACE VIEW employee_folders_statistics AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(*) as total_employees,
  COUNT(*) FILTER (WHERE ef.email_type = 'gmail') as gmail_employees,
  COUNT(*) FILTER (WHERE ef.email_type = 'no_gmail') as no_gmail_employees,
  COUNT(*) FILTER (WHERE ef.folder_status = 'active') as active_employees,
  COUNT(*) FILTER (WHERE ef.drive_folder_id IS NOT NULL) as employees_with_drive_folder
FROM companies c
LEFT JOIN employee_folders ef ON c.id = ef.company_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 12. CREAR FUNCIÓN PARA OBTENER CARPETA PADRE CORRECTA
CREATE OR REPLACE FUNCTION get_employee_parent_folder_id(
  p_company_id UUID,
  p_email_type TEXT
)
RETURNS TEXT AS $$
DECLARE
  parent_folder_id TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN p_email_type = 'gmail' THEN gmail_folder_id
      WHEN p_email_type = 'no_gmail' THEN no_gmail_folder_id
      ELSE drive_folder_id
    END INTO parent_folder_id
  FROM companies 
  WHERE id = p_company_id;
  
  RETURN parent_folder_id;
END;
$$ LANGUAGE plpgsql;

-- 13. CREAR FUNCIÓN PARA MIGRACIÓN DE DATOS EXISTENTES
CREATE OR REPLACE FUNCTION migrate_existing_employee_folders()
RETURNS TABLE (
  migrated_count BIGINT,
  errors_count BIGINT
) AS $$
DECLARE
  migrated_count INTEGER := 0;
  errors_count INTEGER := 0;
  rec RECORD;
BEGIN
  -- Migrar empleados existentes
  FOR rec IN 
    SELECT id, employee_email, company_id 
    FROM employee_folders 
    WHERE token_id IS NULL OR carpeta_id IS NULL
  LOOP
    BEGIN
      -- Actualizar con nuevos campos
      UPDATE employee_folders 
      SET 
        token_id = encode(gen_random_bytes(32), 'hex'),
        carpeta_id = encode(gen_random_bytes(16), 'hex'),
        email_type = determine_email_type(rec.employee_email),
        parent_folder_id = get_employee_parent_folder_id(rec.company_id, determine_email_type(rec.employee_email))
      WHERE id = rec.id;
      
      migrated_count := migrated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      errors_count := errors_count + 1;
      RAISE NOTICE 'Error migrando empleado %: %', rec.employee_email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT migrated_count, errors_count;
END;
$$ LANGUAGE plpgsql;

-- 14. PERMISOS RLS (Row Level Security)
-- Habilitar RLS en la tabla
ALTER TABLE employee_folders ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos pueden leer)
DROP POLICY IF EXISTS "employee_folders_select_policy" ON employee_folders;
CREATE POLICY "employee_folders_select_policy" ON employee_folders
  FOR SELECT USING (true);

-- Política para inserción (solo usuarios autenticados)
DROP POLICY IF EXISTS "employee_folders_insert_policy" ON employee_folders;
CREATE POLICY "employee_folders_insert_policy" ON employee_folders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización (solo usuarios autenticados)
DROP POLICY IF EXISTS "employee_folders_update_policy" ON employee_folders;
CREATE POLICY "employee_folders_update_policy" ON employee_folders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para eliminación (solo usuarios autenticados)
DROP POLICY IF EXISTS "employee_folders_delete_policy" ON employee_folders;
CREATE POLICY "employee_folders_delete_policy" ON employee_folders
  FOR DELETE USING (auth.role() = 'authenticated');

-- 15. CREAR FUNCIÓN PARA LIMPIEZA DE DATOS ÓRFANOS
CREATE OR REPLACE FUNCTION cleanup_orphaned_employee_folders()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar carpetas de empleados que no tienen empresa asociada
  DELETE FROM employee_folders 
  WHERE company_id NOT IN (SELECT id FROM companies);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 16. VERIFICACIÓN FINAL
DO $$
BEGIN
  RAISE NOTICE '✅ Actualización de tabla employee_folders completada';
  RAISE NOTICE '📊 Nuevos campos agregados: token_id, carpeta_id, email_type, parent_folder_id';
  RAISE NOTICE '🔍 Índices creados para optimización';
  RAISE NOTICE '🔒 Políticas RLS configuradas';
  RAISE NOTICE '🎯 Triggers de validación y generación automática creados';
  RAISE NOTICE '📈 Vistas employee_folders_with_company_structure y employee_folders_statistics disponibles';
  RAISE NOTICE '🔧 Funciones de utilidad creadas';
  RAISE NOTICE '🧹 Función cleanup_orphaned_employee_folders() disponible';
  RAISE NOTICE '🔄 Función migrate_existing_employee_folders() disponible para migración';
END $$;