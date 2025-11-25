-- ======================================================
-- SOLUCIÓN INMEDIATA: Políticas RLS para system_configurations
-- ======================================================
-- Copia y pega esto en el SQL Editor de Supabase
-- ======================================================

-- Asegurar que RLS está habilitado
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- POLÍTICAS PARA USUARIOS AUTENTICADOS
-- ======================================================

-- ✅ PERMITIR SELECT (lectura)
DROP POLICY IF EXISTS "Permitir lectura de configuraciones" ON system_configurations;
CREATE POLICY "Permitir lectura de configuraciones" ON system_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- ✅ PERMITIR INSERT (creación)
DROP POLICY IF EXISTS "Permitir creación de configuraciones" ON system_configurations;
CREATE POLICY "Permitir creación de configuraciones" ON system_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Permite insertar cualquier configuración

-- ✅ PERMITIR UPDATE (actualización)
DROP POLICY IF EXISTS "Permitir actualización de configuraciones" ON system_configurations;
CREATE POLICY "Permitir actualización de configuraciones" ON system_configurations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ PERMITIR DELETE (eliminación)
DROP POLICY IF EXISTS "Permitir eliminación de configuraciones" ON system_configurations;
CREATE POLICY "Permitir eliminación de configuraciones" ON system_configurations
  FOR DELETE
  TO authenticated
  USING (true);

-- ======================================================
-- VERIFICACIÓN: Mostrar políticas creadas
-- ======================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'system_configurations'
ORDER BY policyname;

-- ======================================================
-- PRUEBA DE INSERCIÓN (opcional)
-- ======================================================
/*
-- Intentar insertar un registro de prueba
INSERT INTO system_configurations (
  user_id,
  scope,
  company_id,
  category,
  config_key,
  config_value,
  description,
  is_active,
  updated_at
) VALUES (
  null, -- Configuración global
  'global',
  null,
  'system',
  'test_hierarchy_mode',
  '"company_first"', -- JSON válido
  'Prueba de modo de jerarquía',
  true,
  NOW()
);

-- Verificar si se insertó
SELECT * FROM system_configurations 
WHERE config_key = 'test_hierarchy_mode';

-- Limpiar
DELETE FROM system_configurations 
WHERE config_key = 'test_hierarchy_mode';
*/