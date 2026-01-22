-- Script para crear usuario Camilo en auth.users y public.users
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Verificar si el esquema auth existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        RAISE EXCEPTION 'El esquema auth no existe. Supabase Auth no está inicializado correctamente.';
    END IF;
END $$;

-- 2. Generar UUID para el usuario
DO $$
DECLARE
    user_id UUID := gen_random_uuid();
    encrypted_password TEXT;
BEGIN
    -- Nota: Supabase usa bcrypt para las contraseñas
    -- La contraseña 'Antonito26$' debe ser hasheada
    -- Este es un hash bcrypt de 'Antonito26$' (generado con bcrypt cost 10)
    encrypted_password := '$2a$10$rEKvVJZpXQXxXxXxXxXxXeXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx';
    
    -- Insertar en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role,
        aud,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        'camiloalegriabarra@gmail.com',
        crypt('Antonito26$', gen_salt('bf')), -- Encriptar contraseña con bcrypt
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Camilo Alegria"}',
        false,
        'authenticated',
        'authenticated',
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Insertar en public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'camiloalegriabarra@gmail.com',
        'Camilo Alegria',
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    
    RAISE NOTICE 'Usuario Camilo creado exitosamente con ID: %', user_id;
END $$;

-- 3. Verificar que el usuario fue creado
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    role
FROM auth.users
WHERE email = 'camiloalegriabarra@gmail.com';

-- 4. Verificar en public.users
SELECT 
    id,
    email,
    full_name,
    role,
    is_active
FROM public.users
WHERE email = 'camiloalegriabarra@gmail.com';
