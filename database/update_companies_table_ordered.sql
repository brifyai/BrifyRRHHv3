-- =====================================================
-- ACTUALIZACIÓN DE TABLA COMPANIES PARA FLUJO ORDENADO
-- =====================================================
-- Fecha: 2025-11-24
-- Propósito: Agregar campos token_id y carpeta_id para el nuevo flujo ordenado
-- Estructura: Gmail/No-Gmail automática

-- 1. AGREGAR NUEVOS CAMPOS A LA TABLA COMPANIES
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS token_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS carpeta_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS gmail_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS no_gmail_folder_id VARCHAR(255);

-- 2. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_companies_token_id ON companies(token_id);
CREATE INDEX IF NOT EXISTS idx_companies_carpeta_id ON companies(carpeta_id);
CREATE INDEX IF NOT EXISTS idx_companies_gmail_folder_id ON companies(gmail_folder_id);
CREATE INDEX IF NOT EXISTS idx_companies_no_gmail_folder_id ON companies(no_gmail_folder_id);

-- 3. CREAR ÍNDICE COMPUESTO PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_companies_token_carpeta_unique ON companies(token_id, carpeta_id);

-- 4. AGREGAR COMENTARIOS A LOS CAMPOS
COMMENT ON COLUMN companies.token_id IS 'ID único para autenticación y seguridad de la empresa';
COMMENT ON COLUMN companies.carpeta_id IS 'ID único para identificación de carpetas de la empresa';
COMMENT ON COLUMN companies.gmail_folder_id IS 'ID de la subcarpeta Gmail en Google Drive';
COMMENT ON COLUMN companies.no_gmail_folder_id IS 'ID de la subcarpeta No-Gmail en Google Drive';

-- 5. CREAR FUNCIÓN PARA VALIDAR FORMATO DE IDs
CREATE OR REPLACE FUNCTION validate_company_ids()
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGER PARA VALIDACIÓN
DROP TRIGGER IF EXISTS trigger_validate_company_ids ON companies;
CREATE TRIGGER trigger_validate_company_ids
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_ids();

-- 7. CREAR FUNCIÓN PARA GENERAR IDs ÚNICOS AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION generate_company_ids()
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
      IF NOT EXISTS (SELECT 1 FROM companies WHERE token_id = new_token_id) THEN
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
      IF NOT EXISTS (SELECT 1 FROM companies WHERE carpeta_id = new_carpeta_id) THEN
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

-- 8. CREAR TRIGGER PARA GENERACIÓN AUTOMÁTICA
DROP TRIGGER IF EXISTS trigger_generate_company_ids ON companies;
CREATE TRIGGER trigger_generate_company_ids
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION generate_company_ids();

-- 9. CREAR VISTA PARA CONSULTAS OPTIMIZADAS
CREATE OR REPLACE VIEW companies_with_folder_structure AS
SELECT 
  c.id,
  c.name,
  c.token_id,
  c.carpeta_id,
  c.drive_folder_id,
  c.gmail_folder_id,
  c.no_gmail_folder_id,
  c.status,
  c.created_at,
  c.updated_at,
  -- URLs de las carpetas (se pueden construir desde los IDs)
  CASE 
    WHEN c.drive_folder_id IS NOT NULL THEN 
      'https://drive.google.com/drive/folders/' || c.drive_folder_id 
    ELSE NULL 
  END as drive_folder_url,
  CASE 
    WHEN c.gmail_folder_id IS NOT NULL THEN 
      'https://drive.google.com/drive/folders/' || c.gmail_folder_id 
    ELSE NULL 
  END as gmail_folder_url,
  CASE 
    WHEN c.no_gmail_folder_id IS NOT NULL THEN 
      'https://drive.google.com/drive/folders/' || c.no_gmail_folder_id 
    ELSE NULL 
  END as no_gmail_folder_url
FROM companies c;

-- 10. COMENTARIOS PARA LA VISTA
COMMENT ON VIEW companies_with_folder_structure IS 'Vista optimizada para consultar empresas con estructura de carpetas';

-- 11. CREAR FUNCIÓN PARA OBTENER ESTADÍSTICAS DE EMPRESAS
CREATE OR REPLACE FUNCTION get_company_statistics()
RETURNS TABLE (
  total_companies BIGINT,
  active_companies BIGINT,
  companies_with_gmail_folder BIGINT,
  companies_with_no_gmail_folder BIGINT,
  companies_with_complete_structure BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_companies,
    COUNT(*) FILTER (WHERE status = 'active') as active_companies,
    COUNT(*) FILTER (WHERE gmail_folder_id IS NOT NULL) as companies_with_gmail_folder,
    COUNT(*) FILTER (WHERE no_gmail_folder_id IS NOT NULL) as companies_with_no_gmail_folder,
    COUNT(*) FILTER (
      WHERE drive_folder_id IS NOT NULL 
      AND gmail_folder_id IS NOT NULL 
      AND no_gmail_folder_id IS NOT NULL
    ) as companies_with_complete_structure
  FROM companies;
END;
$$ LANGUAGE plpgsql;

-- 12. PERMISOS RLS (Row Level Security)
-- Habilitar RLS en la tabla
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos pueden leer)
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT USING (true);

-- Política para inserción (solo usuarios autenticados)
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
CREATE POLICY "companies_insert_policy" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización (solo usuarios autenticados)
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para eliminación (solo usuarios autenticados)
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;
CREATE POLICY "companies_delete_policy" ON companies
  FOR DELETE USING (auth.role() = 'authenticated');

-- 13. VERIFICACIÓN FINAL
DO $$
BEGIN
  RAISE NOTICE '✅ Actualización de tabla companies completada';
  RAISE NOTICE '📊 Nuevos campos agregados: token_id, carpeta_id, gmail_folder_id, no_gmail_folder_id';
  RAISE NOTICE '🔍 Índices creados para optimización';
  RAISE NOTICE '🔒 Políticas RLS configuradas';
  RAISE NOTICE '🎯 Triggers de validación y generación automática creados';
  RAISE NOTICE '📈 Vista companies_with_folder_structure disponible';
  RAISE NOTICE '📋 Función get_company_statistics() disponible';
END $$;