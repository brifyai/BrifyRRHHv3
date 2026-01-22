-- Agregar campo de contraseña a la tabla users
-- Ejecutar PRIMERO en Supabase Studio

-- 1. Agregar columna password_hash si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Columna password_hash agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna password_hash ya existe';
    END IF;
END $$;

-- 2. Habilitar la extensión pgcrypto para bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Crear función para verificar contraseñas
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear función para crear usuario con contraseña
CREATE OR REPLACE FUNCTION public.create_user_with_password(
    user_email TEXT,
    password TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
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
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Crear función para actualizar contraseña
CREATE OR REPLACE FUNCTION public.update_user_password(
    user_id UUID,
    new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users
    SET 
        password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear usuario Camilo con contraseña
SELECT public.create_user_with_password(
    'camiloalegriabarra@gmail.com',
    'Antonito26$',
    'Camilo Alegria',
    'admin'
);

-- 7. Verificar que el usuario fue creado
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    CASE WHEN password_hash IS NOT NULL THEN '✅ Contraseña configurada' ELSE '❌ Sin contraseña' END as password_status
FROM public.users
WHERE email = 'camiloalegriabarra@gmail.com';

-- 8. Probar la función de verificación
SELECT * FROM public.verify_password('camiloalegriabarra@gmail.com', 'Antonito26$');
