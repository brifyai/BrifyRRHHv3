# 🚨 SOLUCIÓN: Error 502 en Supabase + Login No Funciona

## 🎯 PROBLEMA IDENTIFICADO

Tu aplicación en `https://www.staffhub.cl` está funcionando ✅

**PERO** tienes 2 problemas críticos:

### 1. Supabase devuelve Error 502
- URL: `https://supabase.staffhub.cl`
- Error: Cannot connect to Kong service on port 8000
- **Causa**: El puerto configurado en EasyPanel no coincide con el puerto real de Kong

### 2. Las claves JWT NO COINCIDEN ⚠️
- **Tu aplicación** usa: Claves seguras generadas (en `.env.production`)
- **Supabase self-hosted** usa: Claves demo públicas
- **Resultado**: Aunque Supabase funcione, el login NUNCA va a funcionar porque las claves no coinciden

---

## ✅ SOLUCIÓN EN 2 PASOS

### PASO 1: Alinear las Claves JWT (URGENTE)

Tienes 2 opciones:

#### Opción A: Usar las claves DEMO en ambos lados (rápido, para testing)

**En EasyPanel - Servicio staffhub:**

Reemplaza las Build Arguments con:

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

Y las Runtime Variables con:

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

**Luego haz REBUILD del servicio staffhub**

#### Opción B: Usar las claves SEGURAS en ambos lados (recomendado para producción)

**En EasyPanel - Servicio supastaff (Supabase):**

Actualiza estas variables de entorno:

```bash
JWT_SECRET=NOfWAIo3Pe6J2IY9TkNBFIFRwa0y/W3cICO9qgE9NNE=
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs
```

**Luego reinicia el servicio supastaff**

---

### PASO 2: Arreglar el Error 502 de Supabase

El error 502 significa que EasyPanel no puede conectarse a Kong en el puerto 8000.

**Necesito que verifiques:**

1. **En EasyPanel - Servicio supastaff:**
   - Ve a la configuración de Domains
   - ¿Qué puerto está configurado para `supabase.staffhub.cl`?
   - Debería ser: **8000** → **kong**

2. **Verifica que Kong esté corriendo:**
   - Ve a los logs del servicio supastaff
   - Busca el contenedor "kong"
   - ¿Está en estado "Healthy"?
   - ¿En qué puerto está escuchando?

3. **Verifica el Docker Compose:**
   - En EasyPanel, ve a la configuración del servicio supastaff
   - Busca la sección "Docker Compose"
   - Click en "View" si hay un warning
   - Envíame qué dice

---

## 🔍 DIAGNÓSTICO RÁPIDO

Para ayudarte mejor, necesito que me digas:

### 1. ¿Qué opción prefieres?
- **Opción A**: Usar claves demo (rápido, para testing)
- **Opción B**: Usar claves seguras (recomendado)

### 2. En EasyPanel - Servicio supastaff:
- ¿Qué puerto está configurado en el dominio `supabase.staffhub.cl`?
- ¿Hay algún warning en la configuración de Docker Compose?
- ¿Qué dice el log del contenedor kong?

### 3. Envíame screenshots de:
- Configuración de dominio de supastaff (donde dice el puerto)
- Logs del contenedor kong (si está disponible)
- Warning de Docker Compose (si hay)

---

## ⚡ ACCIÓN INMEDIATA

**AHORA MISMO:**

1. **Decide qué opción usar** (A o B)
2. **Actualiza las variables** según la opción elegida
3. **Haz rebuild** del servicio staffhub
4. **Verifica** que `https://supabase.staffhub.cl` responda

**DESPUÉS:**

5. **Envíame la info** del diagnóstico rápido arriba
6. **Arreglamos** el puerto de Kong juntos

---

## 🎯 RESULTADO ESPERADO

Después del Paso 1:
```
✅ Claves JWT alineadas entre app y Supabase
✅ Rebuild exitoso
```

Después del Paso 2:
```
✅ https://supabase.staffhub.cl responde (no 502)
✅ Login funciona
✅ Aplicación completamente operativa
```

---

## 📞 SIGUIENTE PASO

**Dime:**
1. ¿Opción A (demo) o B (seguras)?
2. ¿Qué puerto está configurado para supabase.staffhub.cl?
3. ¿Hay warnings en Docker Compose?

Con eso te doy la solución exacta para el Error 502.
