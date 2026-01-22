# 🎯 PASOS EXACTOS - Rebuild en Easypanel

**Problema confirmado:** La URL incorrecta está compilada en `main.b8d0135f.js`  
**Solución:** REBUILD con Build Arguments correctos  
**Tiempo:** 5-7 minutos

---

## 📍 **UBICACIÓN DEL PROBLEMA:**

El archivo compilado `main.b8d0135f.js` contiene:
```javascript
POST https://supabase.imetricsstaffhub.cl/auth/v1/token
```

Esto significa que la URL se "quemó" en el código durante el build anterior.

---

## 🚀 **PASOS EXACTOS EN EASYPANEL:**

### **Paso 1: Acceder al Servicio**

1. Ir a tu panel de Easypanel
2. Click en el proyecto **"staffhub"**
3. Click en el servicio **"staffhub"** (la aplicación React)

### **Paso 2: Ir a Build Settings**

Busca una de estas opciones (depende de la versión de Easypanel):
- **"Build"** (pestaña)
- **"Settings"** → **"Build"**
- **"Configuration"** → **"Build Arguments"**

### **Paso 3: Encontrar Build Arguments**

Busca una sección llamada:
- **"Build Arguments"**
- **"Build-time Environment Variables"**
- **"ARG Variables"**

### **Paso 4: Actualizar Variables**

Busca esta variable:
```bash
REACT_APP_SUPABASE_URL
```

**Cambiar de:**
```bash
REACT_APP_SUPABASE_URL=https://supabase.imetricsstaffhub.cl
```

**A:**
```bash
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
```

También actualiza (si existe):
```bash
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
```

### **Paso 5: Guardar Cambios**

Click en:
- **"Save"**
- **"Update"**
- **"Apply"**

### **Paso 6: REBUILD (CRÍTICO)**

⚠️ **IMPORTANTE:** NO hagas solo "Redeploy" o "Restart"

Busca y click en:
- **"Rebuild"**
- **"Build & Deploy"**
- **"Rebuild from Source"**

### **Paso 7: Esperar el Build**

El proceso tomará 3-5 minutos. Verás algo como:
```
Building...
Step 1/10: FROM node:18-alpine
Step 2/10: WORKDIR /app
...
Successfully built
Deploying...
✅ Deployment successful
```

---

## 🔍 **VERIFICACIÓN:**

### **1. Verificar que el build fue exitoso:**

En Easypanel, busca los logs del build y confirma:
```
✅ Build completed successfully
✅ Deployment successful
```

### **2. Verificar la nueva versión:**

1. Abrir `https://www.staffhub.cl`
2. Hacer **Ctrl + Shift + R** (limpiar caché)
3. Abrir consola del navegador (F12)
4. Ir a la pestaña **"Network"** o **"Red"**
5. Intentar hacer login
6. Buscar las peticiones HTTP

**Deberías ver:**
```
✅ POST https://supabase.staffhub.cl/auth/v1/token
```

**NO deberías ver:**
```
❌ POST https://supabase.imetricsstaffhub.cl/auth/v1/token
```

### **3. Verificar el archivo JS:**

El nombre del archivo cambiará (ya no será `main.b8d0135f.js`), será algo como:
```
main.a1b2c3d4.js  (nuevo hash)
```

Esto confirma que se generó un nuevo build.

---

## 📋 **TODAS LAS BUILD ARGUMENTS RECOMENDADAS:**

Si quieres configurar todo de una vez, usa estas variables en Build Arguments:

```bash
# Supabase (CRÍTICO)
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=777409222994-977fdhkb9lfrq7v363hlndulq8k98lgk.apps.googleusercontent.com

# Entorno
REACT_APP_ENVIRONMENT=production
NODE_ENV=production

# Configuración
PORT=3004
GENERATE_SOURCEMAP=false
```

---

## 🔧 **SI NO ENCUENTRAS BUILD ARGUMENTS:**

### **Opción A: Buscar en diferentes lugares**

En Easypanel, las Build Arguments pueden estar en:
1. **Service Settings** → **Build** → **Build Arguments**
2. **Service Settings** → **Environment** → **Build-time Variables**
3. **Advanced** → **Build Configuration**

### **Opción B: Editar docker-compose.yml o Dockerfile**

Si Easypanel usa un `docker-compose.yml`, busca la sección `args:` bajo `build:`:

```yaml
services:
  staffhub:
    build:
      context: .
      args:
        - REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl  # Cambiar aquí
        - REACT_APP_SUPABASE_ANON_KEY=...
```

### **Opción C: Usar .env en el repositorio**

Si Easypanel lee del repositorio, puedes crear un archivo `.env.production`:

```bash
# .env.production
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
```

Luego hacer commit y push, y Easypanel hará rebuild automáticamente.

---

## 🐛 **SOLUCIÓN DE PROBLEMAS:**

### **Problema: No encuentro "Build Arguments"**

**Solución:** Busca en:
- Settings → Build
- Configuration → Build
- Advanced Settings
- Environment Variables (busca una sección separada para "Build Time")

### **Problema: El rebuild falla**

**Solución:** Revisa los logs del build. Errores comunes:
- Falta alguna variable requerida
- Error de sintaxis en el código
- Falta memoria/recursos

### **Problema: Después del rebuild sigue con la URL incorrecta**

**Solución:**
1. Limpia caché del navegador: **Ctrl + Shift + R**
2. Verifica que el hash del archivo JS cambió (ej: `main.XXXXXX.js`)
3. Verifica en Network que las peticiones van a la URL correcta

### **Problema: No sé si hice rebuild o redeploy**

**Diferencia:**
- **Redeploy:** Usa el código ya compilado (rápido, 30 seg)
- **Rebuild:** Compila el código de nuevo (lento, 3-5 min)

Si tomó menos de 1 minuto, probablemente fue redeploy. Necesitas rebuild.

---

## ✅ **CHECKLIST COMPLETO:**

```
[ ] Acceder a Easypanel
[ ] Ir a proyecto "staffhub"
[ ] Ir a servicio "staffhub"
[ ] Encontrar "Build Arguments" o "Build Settings"
[ ] Cambiar REACT_APP_SUPABASE_URL a https://supabase.staffhub.cl
[ ] Actualizar REACT_APP_SUPABASE_ANON_KEY
[ ] Guardar cambios
[ ] Click en "Rebuild" (NO "Redeploy")
[ ] Esperar 3-5 minutos
[ ] Verificar que el build sea exitoso
[ ] Abrir https://www.staffhub.cl
[ ] Limpiar caché (Ctrl + Shift + R)
[ ] Abrir consola (F12)
[ ] Verificar que las peticiones van a supabase.staffhub.cl
[ ] Intentar login
[ ] ✅ Debería funcionar
```

---

## 🎯 **RESULTADO ESPERADO:**

Después del rebuild exitoso:

```
✅ Nuevo archivo JS: main.XXXXXX.js (hash diferente)
✅ URL correcta en el código: https://supabase.staffhub.cl
✅ Peticiones HTTP a supabase.staffhub.cl
✅ Login funcionando
✅ Sin errores ERR_NAME_NOT_RESOLVED
```

---

## ⏱️ **TIEMPO TOTAL:**

- Encontrar Build Arguments: 1-2 min
- Actualizar variables: 1 min
- Rebuild: 3-5 min
- Verificar: 1 min

**Total: 6-9 minutos** ⚡

---

**🚨 ACCIÓN REQUERIDA:** Debes hacer REBUILD en Easypanel con las Build Arguments correctas. Sin esto, la app seguirá intentando conectarse a la URL incorrecta que está compilada en el JavaScript.
