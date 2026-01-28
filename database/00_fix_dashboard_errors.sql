-- Script para arreglar errores del dashboard
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Habilitar RLS en tabla users y crear policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy para que usuarios autenticados puedan leer todos los usuarios
CREATE POLICY "Users can read all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Policy para que usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy para anon (para el login)
CREATE POLICY "Anon can read users for login"
ON public.users
FOR SELECT
TO anon
USING (true);

-- 2. Verificar si existe la tabla communication_logs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'communication_logs'
    ) THEN
        -- Agregar columna type si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'communication_logs' 
            AND column_name = 'type'
        ) THEN
            ALTER TABLE public.communication_logs 
            ADD COLUMN type TEXT DEFAULT 'email';
            
            RAISE NOTICE '✅ Columna type agregada a communication_logs';
        ELSE
            RAISE NOTICE '✅ Columna type ya existe en communication_logs';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Tabla communication_logs no existe, se omite';
    END IF;
END $$;

-- 3. Verificar que las policies se crearon
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
