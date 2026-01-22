-- ========================================
-- CREAR USUARIO: Camilo Alegria (VERSIÓN CORREGIDA)
-- Email: camiloalegriabarra@gmail.com
-- ========================================

-- OPCIÓN 1: Verificar si el usuario ya existe
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Verificar si el usuario ya existe
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '⚠️ El usuario ya existe con email: camiloalegriabarra@gmail.com';
        
        -- Obtener el ID del usuario existente
        SELECT id INTO user_id FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com';
        RAISE NOTICE 'ID del usuario: %', user_id;
        
    ELSE
        -- Crear nuevo usuario
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'camiloalegriabarra@gmail.com',
            crypt('Antonito26$', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Camilo Alegria"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        )
        RETURNING id INTO user_id;
        
        RAISE NOTICE '✅ Usuario creado con ID: %', user_id;
    END IF;
    
    -- Crear o actualizar perfil en tabla users (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Verificar si el perfil ya existe
        IF EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
            -- Actualizar perfil existente
            UPDATE public.users SET
                full_name = 'Camilo Alegria',
                email = 'camiloalegriabarra@gmail.com',
                role = 'admin',
                is_active = true,
                updated_at = NOW()
            WHERE id = user_id;
            
            RAISE NOTICE '✅ Perfil actualizado en tabla users';
        ELSE
            -- Crear nuevo perfil
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
            );
            
            RAISE NOTICE '✅ Perfil creado en tabla users';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabla users no existe, saltando creación de perfil';
    END IF;
    
END $$;

-- Verificar resultado
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'full_name' as full_name,
    '✅ Usuario listo para usar' as status
FROM auth.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- Verificar en tabla users (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        PERFORM * FROM public.users WHERE email = 'camiloalegriabarra@gmail.com';
        IF FOUND THEN
            RAISE NOTICE '✅ Perfil encontrado en tabla users';
        END IF;
    END IF;
END $$;

-- ========================================
-- CREDENCIALES DE ACCESO
-- ========================================
-- Email: camiloalegriabarra@gmail.com
-- Contraseña: Antonito26$
-- Rol: admin
-- ========================================
