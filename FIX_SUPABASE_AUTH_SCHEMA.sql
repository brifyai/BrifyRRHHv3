-- Script para diagnosticar y arreglar el esquema de autenticación de Supabase
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Verificar si existe el esquema auth
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        RAISE NOTICE 'El esquema auth NO existe. Esto es un problema crítico.';
    ELSE
        RAISE NOTICE 'El esquema auth existe correctamente.';
    END IF;
END $$;

-- 2. Verificar tablas en el esquema auth
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 3. Verificar si existe auth.users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        RAISE NOTICE 'La tabla auth.users existe correctamente.';
    ELSE
        RAISE NOTICE 'La tabla auth.users NO existe. Supabase Auth no está inicializado.';
    END IF;
END $$;

-- 4. Contar usuarios en auth.users (si existe)
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        RAISE NOTICE 'Usuarios en auth.users: %', user_count;
    END IF;
END $$;

-- 5. Verificar la tabla public.users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email
FROM public.users;

-- 6. Mostrar estructura de public.users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
