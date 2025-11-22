-- Script para añadir restricción UNIQUE a la columna employee_name en la tabla employee_folders
-- Esto evitará que se creen nombres duplicados en el futuro

-- Deshabilitar temporalmente RLS para poder ejecutar el comando
ALTER TABLE employee_folders DISABLE ROW LEVEL SECURITY;

-- Crear un índice único en employee_name para prevenir duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_folders_unique_name 
ON employee_folders (employee_name);

-- Volver a habilitar RLS
ALTER TABLE employee_folders ENABLE ROW LEVEL SECURITY;

-- Comentario sobre la restricción
COMMENT ON INDEX idx_employee_folders_unique_name IS 'Índice único para prevenir nombres de empleados duplicados en employee_folders';

-- Mensaje informativo
DO $$
BEGIN
    RAISE NOTICE '✅ Restricción UNIQUE añadida a la columna employee_name en la tabla employee_folders';
    RAISE NOTICE '🔒 Esto evitará la creación de nombres duplicados en el futuro';
    RAISE NOTICE '📝 Si necesitas insertar un nombre duplicado, primero debes eliminar o renombrar el registro existente';
END $$;