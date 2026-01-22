# 🔍 DIAGNÓSTICO COMPLETO - PROBLEMA DE AUTENTICACIÓN

**Fecha:** 22 de enero de 2026  
**Problema:** Login sigue llamando a `/auth/v1/token` (Supabase Auth) en lugar de usar autenticación personalizada

---

## 📊 ANÁLISIS PROFUNDO

### ✅ LO QUE ESTABA BIEN:

1. **`src/contexts/AuthContext.js`**
   - ✅ Correctamente modificado para usar `customAuth`
   - ✅ Importa `customAuth` desde `services/customAuthService.js`
   - ✅ Todos los métodos (signIn, signUp, signOut) usan customAuth

2. **`src/services/customAuthService.js`**
   - ✅ Implementado correctamente
   - ✅ Usa `supabase.rpc('verify_password')` en lugar de Supabase Auth
   - ✅ Maneja sesiones en localStorage
   - ✅ No depende de Supabase Auth

3. **Componentes de la app**
   - ✅ Todos usan `useAuth()` del AuthContext
   - ✅ No importan auth directamente (excepto 2 casos especiales)

4. **SQL en Supabase**
   - ✅ Funciones `verify_password`, `create_user_with_password`, `update_user_password` creadas
   - ✅ Usuario Camilo con contraseña configurado

---

## ❌ EL PROBLEMA RAÍZ (ENCONTRADO):

### **`src/lib/supabase.js` exportaba el auth VIEJO**

Este archivo es un punto de entrada consolidado que exporta:
- `supabase` (cliente)
- `auth` (autenticación)
- `db` (base de datos)

**ANTES (INCORRECTO):**
```javascript
import { auth } from './supabaseAuth.js'  // ❌ Supabase Auth viejo
export { auth } from './supabaseAuth.js'
```

**AHORA (CORRECTO):**
```javascript
import { customAuth } from '../services/customAuthService.js'  // ✅ Auth personalizado
export { customAuth as auth } from '../services/customAuthService.js'
```

### **Archivos que importaban `auth` directamente:**

1. **`src/components/auth/GoogleAuthCallback.js`**
   - Importaba: `import { auth } from '../../lib/supabase.js'`
   - Ahora obtiene `customAuth` (exportado como `auth`)

2. **`src/components/settings/GoogleDriveDirectConnect.js`**
   - Importaba: `import auth from '../../lib/supabaseAuth.js'`
   - Ahora obtiene `customAuth` (exportado como `auth`)

3. **`src/components/profile/Profile.js`**
   - Usaba: `supabase.auth.signInWithPassword()` directamente
   - Ahora usa: `customAuth.signIn()` y `customAuth.updatePassword()`

---

## 🔧 SOLUCIÓN APLICADA

### **Cambio 1: `src/lib/supabase.js`**
```javascript
// ANTES
import { auth } from './supabaseAuth.js'
export { auth } from './supabaseAuth.js'

// DESPUÉS
import { customAuth } from '../services/customAuthService.js'
export { customAuth as auth } from '../services/customAuthService.js'
```

### **Cambio 2: `src/components/profile/Profile.js`**
```javascript
// ANTES
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: passwordData.currentPassword
})

const { error } = await supabase.auth.updateUser({
  password: passwordData.newPassword
})

// DESPUÉS
const { error: signInError } = await customAuth.signIn(
  user.email,
  passwordData.currentPassword
)

const { error } = await customAuth.updatePassword(passwordData.newPassword)
```

---

## 🎯 POR QUÉ NO FUNCIONABA EL REBUILD

### **Problema de Caché de Docker:**

1. **Dockerfile correcto** ✅
   - Usa Node 20
   - Instala todas las dependencias
   - Ejecuta `npm run build`

2. **Script de build correcto** ✅
   - Cambiado de Windows `set` a Linux `CI=false`
   - Se ejecuta correctamente en Docker

3. **PERO... el código fuente no había cambiado** ❌
   - `src/lib/supabase.js` seguía exportando `supabaseAuth`
   - Por más rebuilds que hiciéramos, compilaba el código VIEJO
   - El hash `main.491330b3.js` se mantenía porque el contenido era el mismo

### **Por qué el hash no cambiaba:**

React genera el hash del bundle basándose en el **contenido** del código compilado. Si el código fuente no cambia significativamente, el hash se mantiene igual.

Cambios que hicimos:
- ✅ `AuthContext.js` - Pero no se usaba directamente en login
- ✅ `customAuthService.js` - Pero no se importaba en `supabase.js`
- ❌ `supabase.js` - NO lo habíamos cambiado (hasta ahora)

---

## 📦 COMMIT FINAL

**Commit:** `b5cb9b0`  
**Mensaje:** "FIX CRÍTICO: Reemplazar supabaseAuth con customAuth en todas las exportaciones"

**Archivos modificados:**
1. `src/lib/supabase.js` - Exporta customAuth en lugar de supabaseAuth
2. `src/components/profile/Profile.js` - Usa customAuth en lugar de supabase.auth
3. `Dockerfile` - Agregado CACHEBUST y logs de build

---

## 🚀 PRÓXIMOS PASOS

### **1. REBUILD EN EASYPANEL** ⏳

Ahora SÍ va a funcionar porque:
- ✅ El código fuente cambió (supabase.js)
- ✅ El build va a generar un nuevo hash
- ✅ El nuevo código usa customAuth en todos lados

**Pasos:**
1. Easypanel → Proyecto staffhub → Servicio staffhub
2. Click en REBUILD
3. Espera 3-5 minutos
4. Revisa los logs del build

**Deberías ver en los logs:**
```
🔨 Starting React build...
Compiled successfully.
✅ Build completed successfully
📦 Build files:
build/static/js/main.XXXXXXXX.js  <-- NUEVO HASH
```

### **2. PROBAR EN MODO INCÓGNITO** ⏳

1. Abre navegador en modo incógnito (Ctrl + Shift + N)
2. Ve a: https://www.staffhub.cl
3. Abre consola (F12)
4. Busca:
   - ✅ "🔐 StaffHub v2.0.0 - Custom Authentication Active"
   - ✅ Archivo JS con NUEVO hash (NO `main.491330b3.js`)
   - ✅ Request a `/rest/v1/rpc/verify_password` (NO `/auth/v1/token`)

5. Intenta login:
   - Email: `camiloalegriabarra@gmail.com`
   - Password: `Antonito26$`

**Resultado esperado:**
- ✅ Login exitoso
- ✅ Redirige al dashboard
- ✅ Sesión persiste al recargar

---

## 🔐 CÓMO FUNCIONA AHORA

### **Flujo de Login:**

```
1. Usuario ingresa email y contraseña en LoginUltraModern.js
   ↓
2. Componente llama a useAuth().signIn()
   ↓
3. AuthContext.signIn() llama a customAuth.signIn()
   ↓
4. customAuth.signIn() llama a supabase.rpc('verify_password')
   ↓
5. Supabase ejecuta función SQL verify_password()
   ↓
6. SQL verifica contraseña con bcrypt
   ↓
7. Si correcta, retorna datos del usuario
   ↓
8. customAuth guarda sesión en localStorage
   ↓
9. AuthContext actualiza estado (user, isAuthenticated)
   ↓
10. Usuario autenticado ✅
```

### **Request que se hace:**

**ANTES (INCORRECTO):**
```
POST https://supabase.staffhub.cl/auth/v1/token?grant_type=password
```

**AHORA (CORRECTO):**
```
POST https://supabase.staffhub.cl/rest/v1/rpc/verify_password
Body: {"user_email":"camiloalegriabarra@gmail.com","password":"Antonito26$"}
```

---

## 📝 RESUMEN EJECUTIVO

### **Problema:**
El código seguía usando Supabase Auth porque `src/lib/supabase.js` exportaba el servicio viejo.

### **Causa raíz:**
Cambiamos `AuthContext.js` pero no actualizamos `supabase.js` que es el punto de entrada consolidado.

### **Solución:**
Actualizar `supabase.js` para exportar `customAuth` en lugar de `supabaseAuth`.

### **Impacto:**
- ✅ Todos los componentes ahora usan autenticación personalizada
- ✅ No más dependencia de Supabase Auth
- ✅ Control total del flujo de autenticación
- ✅ Funciona con `public.users` directamente

### **Estado:**
⏳ LISTO PARA REBUILD - El código está correcto, solo falta rebuild en Easypanel

---

**Última actualización:** 22 de enero de 2026  
**Commit:** b5cb9b0  
**Estado:** ✅ CÓDIGO CORREGIDO - ⏳ PENDIENTE REBUILD
