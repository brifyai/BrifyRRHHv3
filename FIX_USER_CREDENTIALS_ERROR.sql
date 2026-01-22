-- ========================================
-- FIX: Error de user_credentials
-- ========================================
-- 
-- Este script corrige el error:
-- "column service_name does not exist"
--
-- CAUSA: La tabla user_credentials ya existe con 
-- estructura diferente en complete_database_setup.sql
--
-- SOLUCIÓN: No intentar crear índices o políticas
-- para columnas que no existen
-- ========================================

-- Verificar qué estructura tiene user_credentials
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_credentials'
ORDER BY ordinal_position;

-- Si la tabla tiene service_name, todo está bien
-- Si NO tiene service_name, significa que se creó con la estructura
-- de complete_database_setup.sql (columnas específicas por servicio)

-- Limpiar políticas que puedan haber fallado
DO $$ 
BEGIN
    -- Eliminar política si existe
    DROP POLICY IF EXISTS "Users can manage their own credentials" ON user_credentials;
    
    -- Crear política genérica que funciona con ambas estructuras
    ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own credentials"
        ON user_credentials FOR ALL
        USING (user_id = auth.uid());
        
    RAISE NOTICE '✅ Política de user_credentials corregida';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Error al corregir política: %', SQLERRM;
END $$;

-- Verificar que la política existe
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'user_credentials';

SELECT '✅ Corrección completada' as status;
