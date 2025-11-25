-- ========================================
-- POLÍTICAS RLS PARA system_configurations
-- ========================================
-- Estas políticas permiten que usuarios autenticados gestionen configuraciones

-- Deshabilitar RLS temporalmente para verificar si es el problema
-- ALTER TABLE system_configurations DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS (si no está habilitado)
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA USUARIOS AUTENTICADOS
-- ========================================

-- Permitir SELECT a usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura de configuraciones" ON system_configurations;
CREATE POLICY "Permitir lectura de configuraciones" ON system_configurations
  FOR SELECT
  TO authenticated
  USING (true); -- Permitir leer todas las configuraciones activas

-- Permitir INSERT a usuarios autenticados
DROP POLICY IF EXISTS "Permitir creación de configuraciones" ON system_configurations;
CREATE POLICY "Permitir creación de configuraciones" ON system_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- El usuario puede crear configuraciones para sí mismo o globales (user_id = null)
    user_id = auth.uid() OR user_id IS NULL
  );

-- Permitir UPDATE a usuarios autenticados
DROP POLICY IF EXISTS "Permitir actualización de configuraciones" ON system_configurations;
CREATE POLICY "Permitir actualización de configuraciones" ON system_configurations
  FOR UPDATE
  TO authenticated
  USING (
    -- Puede actualizar sus propias configuraciones o configuraciones globales
    user_id = auth.uid() OR user_id IS NULL
  )
  WITH CHECK (
    -- No puede cambiar el user_id a otro usuario
    user_id = auth.uid() OR user_id IS NULL
  );

-- Permitir DELETE a usuarios autenticados
DROP POLICY IF EXISTS "Permitir eliminación de configuraciones" ON system_configurations;
CREATE POLICY "Permitir eliminación de configuraciones" ON system_configurations
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR user_id IS NULL
  );

-- ========================================
-- POLÍTICAS PARA SERVICIO (API KEY)
-- ========================================
-- Permitir todas las operaciones al servicio (para operaciones del backend)

DROP POLICY IF EXISTS "Permitir operaciones de servicio" ON system_configurations;
CREATE POLICY "Permitir operaciones de servicio" ON system_configurations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- VERIFICACIÓN DE POLÍTICAS
-- ========================================
-- Comentar estas líneas para verificar las políticas creadas

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'system_configurations'
ORDER BY policyname;

-- ========================================
-- EJEMPLOS DE USO
-- ========================================
/*
-- Insertar configuración global (accesible por todos)
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
  null, -- Global
  'global',
  null,
  'system',
  'hierarchy_mode',
  '"company_first"', -- JSON válido
  'Modo de jerarquía de configuración del sistema',
  true,
  NOW()
);

-- Insertar configuración de usuario
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
  auth.uid(), -- Configuración específica del usuario
  'user',
  null,
  'dashboard',
  'theme',
  '"dark"',
  'Tema preferido del usuario',
  true,
  NOW()
);
*/