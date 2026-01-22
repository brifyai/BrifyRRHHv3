# 👤 Crear Usuario: Camilo Alegria

## Datos del Usuario
- **Nombre:** Camilo Alegria
- **Email:** camiloalegriabarra@gmail.com
- **Contraseña:** Antonito26$
- **Rol:** Admin

## 🚀 Opción 1: Usando Supabase Dashboard (Recomendado)

### Paso 1: Ir a Authentication
1. Abre tu proyecto en Supabase Dashboard
2. Ve a **Authentication** → **Users**
3. Click en **Add user** → **Create new user**

### Paso 2: Llenar el formulario
```
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
Auto Confirm User: ✅ (marcar)
```

### Paso 3: Agregar metadata (opcional)
En **User Metadata** agregar:
```json
{
  "full_name": "Camilo Alegria"
}
```

### Paso 4: Click en **Create user**

---

## 🔧 Opción 2: Usando SQL (Avanzado)

### Ejecutar en Supabase SQL Editor:

```sql
-- Ejecutar el archivo: create_user_camilo.sql
```

O copiar y pegar este código:

```sql
-- Crear usuario en auth.users
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
ON CONFLICT (email) DO NOTHING;

-- Crear perfil en tabla users
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active
)
SELECT 
    id,
    'camiloalegriabarra@gmail.com',
    'Camilo Alegria',
    'admin',
    true
FROM auth.users 
WHERE email = 'camiloalegriabarra@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = 'Camilo Alegria',
    role = 'admin',
    updated_at = NOW();
```

---

## 🔧 Opción 3: Usando la API de Supabase

Si prefieres crear el usuario desde código:

```javascript
// En tu aplicación o en un script Node.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tmqglnycivlcjijoymwe.supabase.co',
  'TU_SERVICE_ROLE_KEY' // Usar service_role_key, NO anon key
)

const { data, error } = await supabase.auth.admin.createUser({
  email: 'camiloalegriabarra@gmail.com',
  password: 'Antonito26$',
  email_confirm: true,
  user_metadata: {
    full_name: 'Camilo Alegria'
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Usuario creado:', data)
}
```

---

## ✅ Verificación

Después de crear el usuario, verifica:

### En Supabase Dashboard:
1. Ve a **Authentication** → **Users**
2. Busca: camiloalegriabarra@gmail.com
3. Verifica que aparezca con estado **Confirmed**

### En SQL Editor:
```sql
-- Verificar en auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- Verificar en public.users (si existe la tabla)
SELECT id, email, full_name, role, is_active
FROM public.users 
WHERE email = 'camiloalegriabarra@gmail.com';
```

---

## 🔐 Iniciar Sesión

El usuario puede iniciar sesión inmediatamente en:
- **Local:** http://localhost:3004
- **Producción:** Tu dominio de producción

**Credenciales:**
- Email: camiloalegriabarra@gmail.com
- Contraseña: Antonito26$

---

## 🎯 Siguiente Paso

Si necesitas asignar el usuario a una empresa:

```sql
-- Asignar usuario a una empresa
INSERT INTO user_companies (user_id, company_id, role, is_primary)
SELECT 
    u.id,
    c.id,
    'owner', -- o 'admin', 'manager', 'member'
    true
FROM auth.users u
CROSS JOIN companies c
WHERE u.email = 'camiloalegriabarra@gmail.com'
AND c.name = 'NOMBRE_DE_TU_EMPRESA'
LIMIT 1;
```

---

## ⚠️ Notas Importantes

1. **Seguridad:** No compartas la contraseña en texto plano
2. **Service Role Key:** Solo usar en backend, nunca en frontend
3. **Email Confirmado:** El usuario está pre-confirmado, no necesita verificar email
4. **Rol Admin:** Tiene permisos completos en el sistema

¡Usuario listo para usar! 🎉
