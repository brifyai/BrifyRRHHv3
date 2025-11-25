-- Solución CORREGIDA para errores de duplicación en non_gmail_employees
-- Este script previene errores 409 al sincronizar carpetas
-- VERSIÓN CORREGIDA - No asume que company_id existe

-- 1. Primero, eliminar duplicados existentes (solo con columnas que existen)
DELETE FROM non_gmail_employees 
WHERE id NOT IN (
  SELECT MIN(id)
  FROM non_gmail_employees
  GROUP BY employee_email
);

-- 2. Verificar si la constraint existe y crearla si no existe
DO $$ 
BEGIN
  -- Verificar si la constraint unique existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'non_gmail_employees_employee_email_key'
  ) THEN
    -- Crear la constraint si no existe
    ALTER TABLE non_gmail_employees
    ADD CONSTRAINT non_gmail_employees_employee_email_key 
    UNIQUE (employee_email);
  END IF;
END $$;

-- 3. Crear una función para insertar o actualizar (UPSERT) - SIN company_id
CREATE OR REPLACE FUNCTION upsert_non_gmail_employee(
  p_employee_email TEXT,
  p_employee_name TEXT,
  p_folder_id TEXT,
  p_folder_name TEXT,
  p_folder_url TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO non_gmail_employees (
    employee_email,
    employee_name,
    folder_id,
    folder_name,
    folder_url,
    created_at,
    updated_at
  ) VALUES (
    p_employee_email,
    p_employee_name,
    p_folder_id,
    p_folder_name,
    p_folder_url,
    NOW(),
    NOW()
  )
  ON CONFLICT (employee_email) 
  DO UPDATE SET
    employee_name = EXCLUDED.employee_name,
    folder_id = EXCLUDED.folder_id,
    folder_name = EXCLUDED.folder_name,
    folder_url = EXCLUDED.folder_url,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_non_gmail_employees_email 
ON non_gmail_employees(employee_email);

-- 5. Verificar RLS (Row Level Security)
ALTER TABLE non_gmail_employees ENABLE ROW LEVEL SECURITY;

-- Política genérica (sin company_id)
DROP POLICY IF EXISTS "Users can view non-gmail employees" ON non_gmail_employees;
CREATE POLICY "Users can view non-gmail employees" ON non_gmail_employees
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Dar permisos a la tabla
GRANT ALL ON non_gmail_employees TO authenticated;
GRANT SELECT ON non_gmail_employees TO anon;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla non_gmail_employees configurada correctamente';
  RAISE NOTICE '✅ Duplicados eliminados';
  RAISE NOTICE '✅ Constraint única verificada';
  RAISE NOTICE '✅ Función upsert creada';
  RAISE NOTICE '✅ Índices creados';
  RAISE NOTICE '✅ RLS habilitado';
END $$;