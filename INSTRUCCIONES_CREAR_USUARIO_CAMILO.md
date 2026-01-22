# 👤 CREAR USUARIO CAMILO ALEGRIA

**Email:** camiloalegriabarra@gmail.com  
**Password:** Antonito26$  
**Rol:** admin  
**Tiempo:** 2 minutos

---

## 🚀 **OPCIÓN 1: SQL (Recomendada - 1 minuto)**

### **Paso 1: Acceder a Supabase Studio**
```
URL: http://supabase.staffhub.cl:8002
Usuario: admin
Password: (tu DASHBOARD_PASSWORD)
```

### **Paso 2: Ir a SQL Editor**
1. Click en "SQL Editor" en el menú lateral
2. Click en "New query"

### **Paso 3: Ejecutar Script**
```sql
-- Copiar y pegar TODO el contenido de:
CREAR_USUARIO_CAMILO_AHORA.sql
```

### **Paso 4: Click en "Run" o presionar Ctrl+Enter**

### **Paso 5: Verificar Resultado**
Deberías ver:
```
✅ Usuario creado en auth.users con ID: [uuid]
✅ Perfil creado en public.users
```

---

## 🎯 **OPCIÓN 2: Dashboard (Alternativa - 2 minutos)**

### **Paso 1: Acceder a Supabase Studio**
```
URL: http://supabase.staffhub.cl:8002
```

### **Paso 2: Ir a Authentication**
1. Click en "Authentication" en el menú lateral
2. Click en "Users"

### **Paso 3: Agregar Usuario**
1. Click en "Add user" (botón verde)
2. Seleccionar "Create new user"

### **Paso 4: Llenar Formulario**
```
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
☑️ Auto Confirm User (marcar esta casilla)
```

### **Paso 5: Click en "Create user"**

### **Paso 6: Agregar Perfil en public.users (SQL)**
```sql
-- Ejecutar en SQL Editor:
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com'),
    'camiloalegriabarra@gmail.com',
    'Camilo Alegria',
    'admin',
    true,
    NOW(),
    NOW()
);
```

---

## ✅ **VERIFICACIÓN:**

### **1. Verificar en Authentication:**
```
Authentication → Users → Buscar: camiloalegriabarra@gmail.com
```

Deberías ver:
- ✅ Email confirmado (verde)
- ✅ Estado: Active
- ✅ Provider: email

### **2. Verificar en SQL:**
```sql
-- Ver usuario en auth.users
SELECT id, email, email_confirmed_at, role 
FROM auth.users 
WHERE email = 'camiloalegriabarra@gmail.com';

-- Ver perfil en public.users
SELECT id, email, full_name, role, is_active 
FROM public.users 
WHERE email = 'camiloalegriabarra@gmail.com';
```

---

## 🔐 **CREDENCIALES DE ACCESO:**

```
URL: https://www.staffhub.cl
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
```

---

## 🐛 **SOLUCIÓN DE PROBLEMAS:**

### **Error: "duplicate key value violates unique constraint"**
El usuario ya existe. Verifica con:
```sql
SELECT * FROM auth.users WHERE email = 'camiloalegriabarra@gmail.com';
```

### **Error: "relation auth.users does not exist"**
Estás conectado a la base de datos incorrecta. Asegúrate de estar en la base de datos de Supabase.

### **Error: "permission denied for table auth.users"**
Necesitas usar el `service_role_key` en lugar del `anon_key`. O ejecutar desde Supabase Studio con usuario admin.

### **El usuario se crea pero no puede hacer login**
Verifica que `email_confirmed_at` no sea NULL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'camiloalegriabarra@gmail.com';
```

---

## 📋 **CHECKLIST:**

```
[ ] Acceder a Supabase Studio
[ ] Ir a SQL Editor
[ ] Copiar script CREAR_USUARIO_CAMILO_AHORA.sql
[ ] Ejecutar script
[ ] Verificar mensaje de éxito
[ ] Verificar en Authentication → Users
[ ] Probar login en https://www.staffhub.cl
[ ] ✅ Usuario funcionando
```

---

## 🎉 **RESULTADO ESPERADO:**

Después de ejecutar el script:

- ✅ Usuario creado en `auth.users`
- ✅ Perfil creado en `public.users`
- ✅ Email confirmado automáticamente
- ✅ Rol: admin
- ✅ Estado: activo
- ✅ Puede hacer login inmediatamente

---

## 📝 **NOTAS:**

- El script es **idempotente**: puedes ejecutarlo múltiples veces sin problemas
- Si el usuario ya existe, solo actualiza el perfil
- La contraseña se encripta automáticamente con bcrypt
- El email se confirma automáticamente (no necesita verificación)

---

## ⏱️ **TIEMPO TOTAL: 2 minutos**

1. Acceder a Supabase Studio (30 seg)
2. Copiar y pegar script (30 seg)
3. Ejecutar y verificar (1 min)

**¡Listo para usar!** 🚀
