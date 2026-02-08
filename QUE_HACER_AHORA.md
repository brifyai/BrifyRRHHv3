# 🎯 QUÉ HACER AHORA - Guía Rápida

## 📊 ESTADO ACTUAL

```
✅ www.staffhub.cl → Funciona (puerto 4004)
❌ supabase.staffhub.cl → Error 502 (Kong no responde)
❌ Login → No funciona (claves JWT no coinciden)
```

---

## 🚨 PROBLEMA PRINCIPAL

**Las claves JWT de tu aplicación NO COINCIDEN con las de Supabase:**

| Componente | Claves Actuales |
|------------|----------------|
| **Tu App (staffhub)** | Claves SEGURAS generadas |
| **Supabase (supastaff)** | Claves DEMO públicas |
| **Resultado** | ❌ No pueden comunicarse |

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### 1️⃣ Actualizar Variables en EasyPanel

**Ve a: EasyPanel → Proyecto staffhub → Servicio staffhub**

#### Build Arguments:
```bash
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
PORT=4004
REACT_APP_GOOGLE_CLIENT_ID=777409222994-516v3sboje3thkpn5v71ah87lffk0ko4.apps.googleusercontent.com
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE
REACT_APP_GOOGLE_REDIRECT_URI=https://www.staffhub.cl/auth/google/callback
GENERATE_SOURCEMAP=false
CI=false
ESLINT_NO_DEV_ERRORS=true
CORS_ALLOW_ALL=true
```

#### Runtime Variables:
```bash
NODE_ENV=production
PORT=4004
CORS_ALLOW_ALL=true
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
REACT_APP_GOOGLE_CLIENT_ID=777409222994-516v3sboje3thkpn5v71ah87lffk0ko4.apps.googleusercontent.com
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE
```

### 2️⃣ Hacer REBUILD

⚠️ **IMPORTANTE**: Debes hacer **REBUILD**, NO restart

1. Click en **"Save"** después de pegar las variables
2. Click en **"Rebuild"** o **"Build & Deploy"**
3. Espera 5-7 minutos

---

## 🔍 DESPUÉS DEL REBUILD

### Verifica que funcionó:

1. **Abre** `https://www.staffhub.cl`
2. **Limpia caché**: Ctrl + Shift + R
3. **Abre DevTools**: F12
4. **Ve a Console**: ¿Hay errores?

**Si NO hay errores 404:**
```
✅ Build exitoso
✅ Claves alineadas
```

**Si SIGUE habiendo errores:**
```
❌ Envíame screenshot de la consola
```

---

## 🚨 PROBLEMA PENDIENTE: Error 502 en Supabase

Después de que el rebuild funcione, necesitamos arreglar el Error 502.

**Para eso necesito que me digas:**

### En EasyPanel - Servicio supastaff:

1. **Ve a Domains/Routing**
   - ¿Qué puerto está configurado para `supabase.staffhub.cl`?
   - Debería decir algo como: `supabase.staffhub.cl → 8000 → kong`

2. **Ve a Docker Compose**
   - ¿Hay algún warning o error?
   - Click en "View" si hay un botón

3. **Ve a Logs**
   - Busca el contenedor "kong"
   - ¿Está en estado "Healthy"?
   - ¿Qué dice el último log?

---

## 📸 ENVÍAME SCREENSHOTS DE:

1. **Logs del build** (después del rebuild)
2. **Consola del navegador** (F12 → Console)
3. **Configuración de dominio** de supastaff (donde dice el puerto)
4. **Logs de Kong** (si está disponible)

Con eso te doy la solución exacta para el Error 502.

---

## ⏱️ TIEMPO ESTIMADO

```
Paso 1: Actualizar variables → 2 minutos
Paso 2: Rebuild → 5-7 minutos
Paso 3: Verificar → 1 minuto
---
TOTAL: ~10 minutos
```

---

## 🎯 RESULTADO FINAL ESPERADO

```
✅ Build exitoso
✅ www.staffhub.cl carga sin errores
✅ Claves JWT alineadas
✅ supabase.staffhub.cl responde (después de arreglar puerto)
✅ Login funciona
✅ Aplicación 100% operativa
```

---

## 📞 SIGUIENTE PASO

**AHORA:**
1. Actualiza las variables en EasyPanel
2. Haz REBUILD
3. Espera 5-7 minutos

**DESPUÉS:**
4. Avísame si funcionó o envíame los screenshots
5. Arreglamos el Error 502 de Supabase juntos
