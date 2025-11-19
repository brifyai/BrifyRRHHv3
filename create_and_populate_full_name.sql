-- ============================================
-- SOLUCIÓN: Crear y poblar columna full_name
-- ============================================

-- Paso 1: Crear la columna full_name en la tabla employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Paso 2: Crear índice para mejorar performance en búsquedas
CREATE INDEX IF NOT EXISTS idx_employees_full_name 
ON employees(full_name);

-- Paso 3: Poblar la columna full_name con datos combinados
-- Esto combina first_name + last_name para todos los empleados
UPDATE employees 
SET full_name = TRIM(CONCAT(
  COALESCE(first_name, ''), 
  ' ', 
  COALESCE(last_name, '')
))
WHERE full_name IS NULL;

-- Paso 4: Verificar que se crearon correctamente
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  CASE 
    WHEN full_name IS NOT NULL THEN '✅ OK'
    ELSE '❌ Faltante'
  END as status
FROM employees 
LIMIT 10;

-- Paso 5: Verificar conteo total
SELECT 
  COUNT(*) as total_empleados,
  COUNT(full_name) as con_full_name,
  COUNT(*) - COUNT(full_name) as faltantes
FROM employees;

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Ve a Supabase Dashboard (https://supabase.com)
-- 2. Abre tu proyecto
-- 3. Ve a Database > SQL Editor
-- 4. Pega y ejecuta todo este script
-- 5. Verifica que no haya errores
-- 6. Refresca tu dashboard en https://brifyrrhhv3.netlify.app/panel-principal
-- ============================================