-- ========================================
-- CREAR USUARIO CAMILO ALEGRIA - EJECUTAR AHORA
-- ========================================
-- Email: camiloalegriabarra@gmail.com
-- Password: Antonito26$
-- Rol: admin
-- ========================================

-- PASO 1: Crear usuario en auth.users
DO $$
DECLARE
    v_user_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Verificar si ya existe
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com'
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
        -- Usuario ya existe, obtener su ID
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com';
        RAISE NOTICE '⚠️ Usuario ya existe con ID: %', v_user_id;
    ELSE
        -- Crear nuevo usuario
        v_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            last_sign_in_at,
            aud,
            role
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'camiloalegriabarra@gmail.com',
            crypt('Antonito26$', gen_salt('bf')),
            NOW(),
            '',
            '',
            '',
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Camilo Alegria","name":"Camilo Alegria"}',
            false,
            NOW(),
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
        
        RAISE NOTICE '✅ Usuario creado en auth.users con ID: %', v_user_id;
    END IF;
    
    -- PASO 2: Crear perfil en public.users (si la tabla existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Verificar si el perfil ya existe
        IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
            -- Actualizar perfil existente
            UPDATE public.users SET
                email = 'camiloalegriabarra@gmail.com',
                full_name = 'Camilo Alegria',
                role = 'admin',
                is_active = true,
                updated_at = NOW()
            WHERE id = v_user_id;
            
            RAISE NOTICE '✅ Perfil actualizado en public.users';
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
                v_user_id,
                'camiloalegriabarra@gmail.com',
                'Camilo Alegria',
                'admin',
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE '✅ Perfil creado en public.users';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabla public.users no existe todavía';
    END IF;
    
END $$;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver usuario en auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'full_name' as nombre,
    role,
    '✅ Usuario en auth.users' as estado
FROM auth.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- Ver perfil en public.users (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE '📋 Verificando perfil en public.users...';
        
        IF EXISTS (SELECT 1 FROM public.users WHERE email = 'camiloalegriabarra@gmail.com') THEN
            RAISE NOTICE '✅ Perfil encontrado en public.users';
        ELSE
            RAISE NOTICE '⚠️ Perfil NO encontrado en public.users';
        END IF;
    END IF;
END $$;

-- Mostrar perfil si existe
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    '✅ Perfil en public.users' as estado
FROM public.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ Usuario creado en auth.users
-- ✅ Perfil creado en public.users
-- ✅ Email confirmado automáticamente
-- ✅ Rol: admin
-- ✅ Estado: activo
--
-- CREDENCIALES:
-- Email: camiloalegriabarra@gmail.com
-- Password: Antonito26$
--
-- ¡Listo para hacer login!
-- ========================================
