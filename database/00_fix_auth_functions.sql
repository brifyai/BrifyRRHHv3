-- Script para arreglar funciones de autenticación
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Eliminar funciones existentes si hay errores
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_with_password(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_user_password(UUID, TEXT);

-- 2. Asegurar que pgcrypto está habilitado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Agregar columna password_hash si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_hash TEXT;
    END IF;
END $$;

-- 4. Crear función para verificar contraseñas
CREATE OR REPLACE FUNCTION public.verify_password(
    user_email TEXT,
    password TEXT
)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.is_active
    FROM public.users u
    WHERE u.email = user_email
      AND u.password_hash = crypt(password, u.password_hash)
      AND u.is_active = true;
END;
$$;

-- 5. Crear función para crear usuario con contraseña
CREATE OR REPLACE FUNCTION public.create_user_with_password(
    user_email TEXT,
    password TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO public.users (
        id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        user_email,
        crypt(password, gen_salt('bf')),
        user_full_name,
        user_role,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        password_hash = crypt(password, gen_salt('bf')),
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        role = COALESCE(EXCLUDED.role, users.role),
        updated_at = NOW()
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$;

-- 6. Crear función para actualizar contraseña
CREATE OR REPLACE FUNCTION public.update_user_password(
    user_id UUID,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET 
        password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$;

-- 7. Actualizar usuario Camilo con contraseña
DO $$
DECLARE
    camilo_id UUID;
BEGIN
    -- Actualizar o crear usuario Camilo
    INSERT INTO public.users (
        id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'camiloalegriabarra@gmail.com',
        crypt('Antonito26$', gen_salt('bf')),
        'Camilo Alegría',
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        password_hash = crypt('Antonito26$', gen_salt('bf')),
        role = 'admin',
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO camilo_id;
    
    RAISE NOTICE '✅ Usuario Camilo configurado con ID: %', camilo_id;
END $$;

-- 8. Verificar que todo funcionó
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL AND password_hash != '' 
        THEN '✅ Contraseña configurada' 
        ELSE '❌ Sin contraseña' 
    END as password_status
FROM public.users
WHERE email = 'camiloalegriabarra@gmail.com';

-- 9. Probar la función de verificación
SELECT 
    user_id,
    email,
    full_name,
    role,
    is_active
FROM public.verify_password('camiloalegriabarra@gmail.com', 'Antonito26$');
