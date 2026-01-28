-- Script para arreglar funciones de autenticación con esquema correcto
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Eliminar funciones existentes
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_with_password(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_user_password(UUID, TEXT);

-- 2. Crear función para verificar contraseñas (con esquema extensions.crypt)
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
SET search_path = public, extensions
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
      AND u.password_hash = extensions.crypt(password, u.password_hash)
      AND u.is_active = true;
END;
$$;

-- 3. Crear función para crear usuario con contraseña (con esquema extensions.crypt)
CREATE OR REPLACE FUNCTION public.create_user_with_password(
    user_email TEXT,
    password TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
        extensions.crypt(password, extensions.gen_salt('bf')),
        user_full_name,
        user_role,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        password_hash = extensions.crypt(password, extensions.gen_salt('bf')),
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        role = COALESCE(EXCLUDED.role, users.role),
        updated_at = NOW()
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$;

-- 4. Crear función para actualizar contraseña (con esquema extensions.crypt)
CREATE OR REPLACE FUNCTION public.update_user_password(
    user_id UUID,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE public.users
    SET 
        password_hash = extensions.crypt(new_password, extensions.gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$;

-- 5. Actualizar usuario Camilo con contraseña
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
        extensions.crypt('Antonito26$', extensions.gen_salt('bf')),
        'Camilo Alegría',
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        password_hash = extensions.crypt('Antonito26$', extensions.gen_salt('bf')),
        role = 'admin',
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO camilo_id;
    
    RAISE NOTICE '✅ Usuario Camilo configurado con ID: %', camilo_id;
END $$;

-- 6. Verificar que todo funcionó
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

-- 7. Probar la función de verificación
SELECT 
    user_id,
    email,
    full_name,
    role,
    is_active
FROM public.verify_password('camiloalegriabarra@gmail.com', 'Antonito26$');

-- 8. Dar permisos a anon y authenticated para ejecutar las funciones
GRANT EXECUTE ON FUNCTION public.verify_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_with_password(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password(UUID, TEXT) TO authenticated;
