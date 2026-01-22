-- ========================================
-- CREAR USUARIO: Camilo Alegria
-- Email: camiloalegriabarra@gmail.com
-- ========================================

-- IMPORTANTE: Este script debe ejecutarse en Supabase SQL Editor
-- con privilegios de administrador

-- 1. Crear usuario en auth.users (tabla de autenticación de Supabase)
-- Nota: Supabase hashea automáticamente la contraseña
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
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'camiloalegriabarra@gmail.com',
    crypt('Antonito26$', gen_salt('bf')), -- Hashea la contraseña con bcrypt
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Camilo Alegria"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- 2. Crear perfil de usuario en la tabla users (si existe)
-- Primero obtenemos el ID del usuario recién creado
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'camiloalegriabarra@gmail.com';
    
    -- Insertar en la tabla users si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
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
            'admin', -- Puedes cambiar a 'user', 'manager', 'super_admin'
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = 'Camilo Alegria',
            email = 'camiloalegriabarra@gmail.com',
            updated_at = NOW();
        
        RAISE NOTICE 'Usuario creado en tabla users con ID: %', user_id;
    END IF;
END $$;

-- 3. Verificar que el usuario fue creado correctamente
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- 4. Verificar en tabla users (si existe)
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM public.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ Usuario creado en auth.users
-- ✅ Usuario creado en public.users
-- ✅ Email: camiloalegriabarra@gmail.com
-- ✅ Contraseña: Antonito26$
-- ✅ Nombre: Camilo Alegria
-- ✅ Rol: admin
-- ========================================

-- NOTA: El usuario puede iniciar sesión inmediatamente
-- No necesita confirmar el email porque email_confirmed_at está establecido
