# 🔐 IMPLEMENTACIÓN DE AUTENTICACIÓN PERSONALIZADA

**Fecha:** 22 de enero de 2026  
**Razón:** Eliminar dependencia de Supabase Auth y usar solo `public.users`

---

## 📋 PASOS DE IMPLEMENTACIÓN

### **Paso 1: Ejecutar Script SQL en Supabase** ✅

Ejecuta este script en Supabase Studio SQL Editor:

```
database/00_add_password_to_users.sql
```

Este script:
- ✅ Agrega columna `password_hash` a `public.users`
- ✅ Habilita extensión `pgcrypto` para bcrypt
- ✅ Crea función `verify_password()` para login
- ✅ Crea función `create_user_with_password()` para registro
- ✅ Crea función `update_user_password()` para cambiar contraseña
- ✅ Crea usuario Camilo con contraseña `Antonito26$`

---

### **Paso 2: Reemplazar AuthContext** ⏳

Reemplazar el archivo actual con el nuevo:

```bash
# Backup del AuthContext actual
mv src/contexts/AuthContext.js src/contexts/AuthContext.supabase.backup.js

# Usar el nuevo AuthContext personalizado
mv src/contexts/AuthContext.custom.js src/contexts/AuthContext.js
```

O manualmente:
1. Renombrar `src/contexts/AuthContext.js` a `src/contexts/AuthContext.supabase.backup.js`
2. Renombrar `src/contexts/AuthContext.custom.js` a `src/contexts/AuthContext.js`

---

### **Paso 3: Verificar Imports** ⏳

El nuevo AuthContext ya está configurado para funcionar con el código existente. No necesitas cambiar imports en otros archivos.

---

### **Paso 4: Rebuild en Easypanel** ⏳

```
Easypanel → Proyecto staffhub → Servicio staffhub → REBUILD
```

---

### **Paso 5: Probar Login** ⏳

```
URL: https://www.staffhub.cl
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
```

---

## 🎯 ARCHIVOS CREADOS

### **1. database/00_add_password_to_users.sql**
Script SQL para preparar la base de datos

### **2. src/services/customAuthService.js**
Servicio de autenticación personalizado que:
- Maneja login/logout
- Gestiona sesiones en localStorage
- Verifica contraseñas con bcrypt
- No depende de Supabase Auth

### **3. src/contexts/AuthContext.custom.js**
Nuevo AuthContext que usa `customAuthService`

### **4. IMPLEMENTACION_AUTH_PERSONALIZADA.md**
Este documento con instrucciones

---

## ✅ VENTAJAS DE LA AUTENTICACIÓN PERSONALIZADA

1. **Control Total**
   - ✅ Controlas completamente el flujo de autenticación
   - ✅ No dependes de servicios externos
   - ✅ Puedes personalizar todo

2. **Simplicidad**
   - ✅ Solo usa `public.users`
   - ✅ No necesita configurar Supabase Auth
   - ✅ Menos complejidad

3. **Seguridad**
   - ✅ Contraseñas hasheadas con bcrypt
   - ✅ Funciones SQL con `SECURITY DEFINER`
   - ✅ Sesiones con expiración

4. **Flexibilidad**
   - ✅ Fácil agregar campos personalizados
   - ✅ Fácil implementar 2FA en el futuro
   - ✅ Fácil integrar con otros sistemas

---

## 🔄 CÓMO FUNCIONA

### **Login:**
```
1. Usuario ingresa email y contraseña
2. Frontend llama a customAuth.signIn()
3. customAuth llama a función SQL verify_password()
4. SQL verifica contraseña con bcrypt
5. Si es correcta, retorna datos del usuario
6. Frontend guarda sesión en localStorage
7. Usuario autenticado ✅
```

### **Sesión:**
```
1. Sesión guardada en localStorage
2. Token de acceso generado
3. Expiración: 24 horas
4. Se verifica en cada carga de página
5. Se sincroniza entre tabs
```

### **Logout:**
```
1. Usuario hace click en cerrar sesión
2. Frontend llama a customAuth.signOut()
3. Se elimina sesión de localStorage
4. Usuario desautenticado ✅
```

---

## 🔐 SEGURIDAD

### **Contraseñas:**
- ✅ Hasheadas con bcrypt (cost 10)
- ✅ Nunca se envían en texto plano
- ✅ Nunca se almacenan en texto plano
- ✅ Verificación en servidor (SQL)

### **Sesiones:**
- ✅ Token único por sesión
- ✅ Expiración automática (24h)
- ✅ Almacenadas en localStorage
- ⚠️ En producción, considera usar httpOnly cookies

### **SQL:**
- ✅ Funciones con `SECURITY DEFINER`
- ✅ Validación de datos
- ✅ Protección contra SQL injection

---

## 🚀 PRÓXIMAS MEJORAS (Opcional)

### **Corto Plazo:**
- [ ] Agregar "Recordarme" (sesión más larga)
- [ ] Agregar "Olvidé mi contraseña"
- [ ] Agregar límite de intentos de login

### **Mediano Plazo:**
- [ ] Implementar refresh tokens
- [ ] Usar httpOnly cookies en lugar de localStorage
- [ ] Agregar logs de actividad de usuario

### **Largo Plazo:**
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Implementar OAuth (Google, Microsoft)
- [ ] Implementar SSO (Single Sign-On)

---

## 🐛 TROUBLESHOOTING

### **Error: "verify_password function does not exist"**
**Solución:** Ejecuta el script SQL `database/00_add_password_to_users.sql`

### **Error: "password_hash column does not exist"**
**Solución:** Ejecuta el script SQL `database/00_add_password_to_users.sql`

### **Error: "Credenciales inválidas"**
**Solución:** Verifica que el usuario existe y la contraseña es correcta

### **Sesión no persiste al recargar**
**Solución:** Verifica que localStorage no esté bloqueado en el navegador

---

## 📝 COMANDOS ÚTILES

### **Verificar usuario en SQL:**
```sql
SELECT id, email, full_name, role, is_active,
       CASE WHEN password_hash IS NOT NULL THEN '✅' ELSE '❌' END as has_password
FROM public.users
WHERE email = 'camiloalegriabarra@gmail.com';
```

### **Probar login en SQL:**
```sql
SELECT * FROM public.verify_password('camiloalegriabarra@gmail.com', 'Antonito26$');
```

### **Cambiar contraseña en SQL:**
```sql
SELECT public.update_user_password(
    (SELECT id FROM public.users WHERE email = 'camiloalegriabarra@gmail.com'),
    'NuevaContraseña123'
);
```

### **Crear nuevo usuario en SQL:**
```sql
SELECT public.create_user_with_password(
    'nuevo@email.com',
    'ContraseñaSegura123',
    'Nombre Completo',
    'user'
);
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

```
[ ] Ejecutar database/00_add_password_to_users.sql en Supabase
[ ] Verificar que el usuario Camilo fue creado
[ ] Probar función verify_password en SQL
[ ] Hacer backup de AuthContext.js actual
[ ] Reemplazar AuthContext.js con AuthContext.custom.js
[ ] Commit cambios a Git
[ ] Rebuild en Easypanel
[ ] Probar login en https://www.staffhub.cl
[ ] Verificar que la sesión persiste al recargar
[ ] Probar logout
```

---

**Última actualización:** 22 de enero de 2026  
**Estado:** ⏳ PENDIENTE DE IMPLEMENTACIÓN
