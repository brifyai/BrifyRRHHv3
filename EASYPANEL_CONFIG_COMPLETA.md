# 🚀 Configuración Completa para EasyPanel

## ⚠️ IMPORTANTE: Claves de Supabase Self-Hosted

Estás usando Supabase self-hosted con las claves **por defecto de demo**. 

**🔴 CRÍTICO**: Estas claves son públicas y NO son seguras para producción.

Las claves actuales son:
- `ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
- `SERVICE_ROLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

Estas son las claves de **demo** que vienen en la documentación de Supabase.

---

## 🔐 Generar Claves Seguras (RECOMENDADO)

### Opción 1: Usar el generador de Supabase

```bash
# Instalar supabase CLI
npm install -g supabase

# Generar nuevas claves
supabase gen keys jwt
```

### Opción 2: Usar script de Node.js

Crea un archivo `generate-jwt-keys.js`:

```javascript
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generar un JWT_SECRET seguro (32+ caracteres)
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('JWT_SECRET:', jwtSecret);

// Generar ANON_KEY
const anonKey = jwt.sign(
  {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 años
  },
  jwtSecret
);

console.log('ANON_KEY:', anonKey);

// Generar SERVICE_ROLE_KEY
const serviceRoleKey = jwt.sign(
  {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 años
  },
  jwtSecret
);

console.log('SERVICE_ROLE_KEY:', serviceRoleKey);
```

Ejecuta:
```bash
npm install jsonwebtoken
node generate-jwt-keys.js
```

### Opción 3: Usar las claves demo (SOLO para testing)

Si estás en desarrollo/testing, puedes usar las claves demo temporalmente, pero **DEBES cambiarlas antes de ir a producción**.

---

## 📋 Variables de Entorno para EasyPanel

### **1. Build Arguments** (se usan durante `npm run build`)

Copia y pega esto en la sección **Build Arguments** de EasyPanel:

```bash
# Supabase (Self-Hosted)
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# Google OAuth (Credenciales correctas para self-hosted)
REACT_APP_GOOGLE_CLIENT_ID=777409222994-516v3sboje3thkpn5v71ah87lffk0ko4.apps.googleusercontent.com
REACT_APP_GOOGLE_REDIRECT_URI=https://www.staffhub.cl/auth/google/callback

# Gemini API
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE

# Entorno
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
PORT=4004
GENERATE_SOURCEMAP=false
CI=false
ESLINT_NO_DEV_ERRORS=true
CORS_ALLOW_ALL=true
```

---

### **2. Runtime Environment Variables** (se usan cuando el contenedor corre)

Copia y pega esto en la sección **Environment Variables** de EasyPanel:

```bash
# Entorno
NODE_ENV=production
PORT=4004
CORS_ALLOW_ALL=true

# Supabase
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=777409222994-516v3sboje3thkpn5v71ah87lffk0ko4.apps.googleusercontent.com

# Gemini API
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE
```

---

## 🔧 Configuración del Puerto

**IMPORTANTE**: He actualizado el puerto de **3004** a **4004** para que coincida con tu configuración de deployment.

Archivos actualizados:
- ✅ `Dockerfile` - Puerto 4004
- ✅ `server-simple.mjs` - Puerto 4004
- ✅ `.env.production` - Puerto 4004

---

## 🚀 Pasos para Deployar en EasyPanel

### **1. Commit y Push de los cambios**

```bash
git add Dockerfile server-simple.mjs .env.production
git commit -m "fix: Update to port 4004 and correct Supabase self-hosted keys"
git push
```

### **2. Configurar en EasyPanel**

1. Ve a tu proyecto en EasyPanel
2. Selecciona el servicio "staffhub"
3. Ve a **Build** → **Build Arguments**
4. Pega las Build Arguments de arriba
5. Ve a **Environment** → **Environment Variables**
6. Pega las Runtime Variables de arriba
7. **Guarda los cambios**

### **3. Configurar el Puerto en EasyPanel**

En la configuración del servicio:
- **Internal Port**: 4004
- **External Port**: 80 o 443 (según tu configuración)

### **4. Hacer REBUILD**

⚠️ **CRÍTICO**: Debes hacer **REBUILD**, no solo restart.

1. Click en **"Rebuild"** o **"Build & Deploy"**
2. Espera 5-7 minutos

---

## 🔍 Verificación

### **1. Verificar que el build fue exitoso**

En los logs de EasyPanel, busca:

```
✅ Build completed successfully
📦 Build files: [lista de archivos]
🚀 Servidor simple ejecutándose en puerto 4004
```

### **2. Verificar en el navegador**

1. Abre `https://www.staffhub.cl`
2. Presiona **Ctrl + Shift + R** (limpiar caché)
3. Presiona **F12** (DevTools)
4. Ve a **Network** tab
5. Recarga la página

**Deberías ver:**
- ✅ Status 200 en `index.html`
- ✅ Status 200 en `main.XXXXX.js`
- ✅ Peticiones a `https://supabase.staffhub.cl`

### **3. Verificar autenticación**

1. Intenta hacer login con Google
2. Verifica que la redirección funcione
3. Verifica que no haya errores de CORS

---

## 🚨 Problemas Comunes

### **Problema 1: Error de CORS**

**Síntoma**: `Access-Control-Allow-Origin` error

**Solución**: Verifica que en tu Supabase self-hosted tengas configurado:

```bash
GOTRUE_SITE_URL=https://www.staffhub.cl
GOTRUE_URI_ALLOW_LIST=https://www.staffhub.cl/**,https://staffhub.cl/**
```

### **Problema 2: Google OAuth no funciona**

**Síntoma**: Error al hacer login con Google

**Solución**: Verifica en Google Cloud Console:

1. Ve a https://console.cloud.google.com
2. Selecciona tu proyecto "stratega-ai-x"
3. Ve a **APIs & Services** → **Credentials**
4. Edita el OAuth 2.0 Client ID: `777409222994-516v3sboje3thkpn5v71ah87lffk0ko4`
5. En **Authorized redirect URIs**, agrega:
   - `https://supabase.staffhub.cl/auth/v1/callback`
   - `https://www.staffhub.cl/auth/google/callback`

### **Problema 3: JWT Invalid**

**Síntoma**: Errores de "Invalid JWT" o "JWT expired"

**Causa**: Las claves demo tienen una fecha de expiración

**Solución**: Genera nuevas claves JWT (ver sección "Generar Claves Seguras")

---

## 📊 Checklist Completo

```
[ ] Commit y push de los cambios (puerto 4004)
[ ] Configurar Build Arguments en EasyPanel
[ ] Configurar Runtime Variables en EasyPanel
[ ] Configurar Internal Port = 4004 en EasyPanel
[ ] Hacer REBUILD (no restart)
[ ] Esperar 5-7 minutos
[ ] Verificar logs del build
[ ] Abrir https://www.staffhub.cl
[ ] Limpiar caché (Ctrl + Shift + R)
[ ] Verificar que no hay errores 404
[ ] Probar login con Google
[ ] Verificar que la app funciona correctamente
```

---

## 🔐 Siguiente Paso: Seguridad

**DESPUÉS de que funcione**, debes:

1. **Generar nuevas claves JWT** (ver sección arriba)
2. **Actualizar las claves en Supabase self-hosted**
3. **Actualizar las claves en EasyPanel**
4. **Hacer rebuild nuevamente**

Las claves demo son públicas y cualquiera puede usarlas para acceder a tu base de datos.

---

## 📞 Si Necesitas Ayuda

Si después de seguir estos pasos sigues teniendo problemas, envíame:

1. **Screenshot de los logs del build** en EasyPanel
2. **Screenshot de los logs del runtime**
3. **Screenshot de la consola del navegador** (F12)
4. **Screenshot del Network tab** mostrando los errores

Con eso puedo ayudarte específicamente.

---

## ✅ Resultado Esperado

Después de seguir estos pasos:

```
✅ Build exitoso en EasyPanel
✅ Contenedor corriendo en puerto 4004
✅ https://www.staffhub.cl carga sin errores 404
✅ Login con Google funciona
✅ Conexión a Supabase self-hosted funciona
✅ Todas las rutas de React Router funcionan
```
