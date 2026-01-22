# 🚨 URGENTE - Corregir URL de Supabase en la App

**Problema:** La app está intentando conectarse a `supabase.imetricsstaffhub.cl` (URL incorrecta)  
**Solución:** Actualizar Build Arguments en Easypanel y hacer REBUILD  
**Tiempo:** 5 minutos

---

## 🔴 **ERROR ACTUAL:**

```
❌ https://supabase.imetricsstaffhub.cl/auth/v1/token
   Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

La app fue compilada con la URL incorrecta y está intentando conectarse a un servidor que no existe.

---

## ✅ **SOLUCIÓN RÁPIDA:**

### **Paso 1: Ir a Easypanel**
```
URL: (tu panel de Easypanel)
Proyecto: staffhub
Servicio: staffhub
```

### **Paso 2: Actualizar Build Arguments**

1. Click en el servicio **"staffhub"**
2. Click en la pestaña **"Build"** o **"Settings"**
3. Buscar **"Build Arguments"** o **"Environment Variables (Build Time)"**

### **Paso 3: Cambiar estas variables:**

#### **❌ INCORRECTO (actual):**
```bash
REACT_APP_SUPABASE_URL=https://supabase.imetricsstaffhub.cl
```

#### **✅ CORRECTO (cambiar a):**
```bash
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
```

### **Paso 4: REBUILD (IMPORTANTE)**

⚠️ **NO hagas solo "Redeploy"** - necesitas **REBUILD**

1. Click en **"Rebuild"** o **"Build & Deploy"**
2. Espera 3-5 minutos a que compile
3. Verifica que el deploy sea exitoso

---

## 🔍 **VERIFICACIÓN:**

### **1. Abrir la app:**
```
https://www.staffhub.cl
```

### **2. Abrir consola del navegador (F12)**

### **3. Buscar en la consola:**
```
✅ Debería decir: https://supabase.staffhub.cl
❌ NO debería decir: https://supabase.imetricsstaffhub.cl
```

### **4. Intentar hacer login:**
```
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
```

Si la URL está correcta, deberías ver intentos de conexión a `supabase.staffhub.cl`.

---

## 📋 **VARIABLES COMPLETAS PARA BUILD:**

Copia y pega estas variables en **Build Arguments**:

```bash
# Supabase
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=777409222994-977fdhkb9lfrq7v363hlndulq8k98lgk.apps.googleusercontent.com

# Entorno
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
PORT=3004

# Otros
GENERATE_SOURCEMAP=false
```

---

## 🔧 **VARIABLES DE RUNTIME (Environment Variables):**

También verifica que en **Environment Variables** (runtime) tengas:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTYzNTgsImV4cCI6MjA4NDQ3NjM1OH0.ck89urip20NQN4WgOLVCLTXc97JQYIX_-QqyJ4lDwco
PORT=3004
CORS_ALLOW_ALL=true
```

---

## 🎯 **DIFERENCIA ENTRE BUILD Y RUNTIME:**

### **Build Arguments (Build Time):**
- Se usan durante la **compilación** de React
- Se "queman" en el código JavaScript compilado
- Incluyen `REACT_APP_*` variables
- **Requieren REBUILD** para cambiar

### **Environment Variables (Runtime):**
- Se usan cuando el **servidor** está corriendo
- Se pueden cambiar con solo **Redeploy**
- Incluyen variables del servidor Node.js
- NO requieren rebuild

---

## ⚠️ **POR QUÉ NECESITAS REBUILD:**

Las variables `REACT_APP_*` se compilan dentro del JavaScript durante el build. Por eso:

1. ❌ **Redeploy** → NO cambia las URLs en el código compilado
2. ✅ **Rebuild** → Recompila el código con las nuevas URLs

---

## 🐛 **SI EL PROBLEMA PERSISTE:**

### **1. Limpiar caché del navegador:**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **2. Verificar que el build fue exitoso:**
En Easypanel, revisa los logs del build y busca:
```
✅ Build completed successfully
✅ Creating optimized production build
```

### **3. Verificar el código compilado:**
Abre la consola del navegador y ejecuta:
```javascript
console.log(process.env.REACT_APP_SUPABASE_URL)
```

Debería mostrar: `https://supabase.staffhub.cl`

---

## 📊 **CHECKLIST:**

```
[ ] Ir a Easypanel → Proyecto staffhub → Servicio staffhub
[ ] Click en Build o Settings
[ ] Actualizar Build Arguments con URL correcta
[ ] Actualizar ANON_KEY con la key correcta
[ ] Click en REBUILD (no solo Redeploy)
[ ] Esperar 3-5 minutos
[ ] Verificar que el build sea exitoso
[ ] Abrir https://www.staffhub.cl
[ ] Abrir consola (F12)
[ ] Verificar que NO aparezca "imetricsstaffhub"
[ ] Intentar login
[ ] ✅ Debería conectarse correctamente
```

---

## 🎉 **RESULTADO ESPERADO:**

Después del rebuild:

```
✅ URL correcta: https://supabase.staffhub.cl
✅ Conexión exitosa a Supabase
✅ Login funcionando
✅ Sin errores ERR_NAME_NOT_RESOLVED
```

---

## ⏱️ **TIEMPO ESTIMADO:**

- Actualizar variables: 1 minuto
- Rebuild: 3-5 minutos
- Verificar: 1 minuto

**Total: ~7 minutos** ⚡

---

**¡IMPORTANTE: Debes hacer REBUILD, no solo Redeploy!** 🚀
