# 🔧 Corrección Variables Supabase - Error 502

## 🎯 Problema Encontrado

Tu Supabase tiene **2 errores de configuración**:

1. **Kong escucha en puerto 8001** pero el dominio apunta a **8000** → Error 502
2. **SUPABASE_PUBLIC_URL usa HTTP** en vez de HTTPS

---

## ✅ SOLUCIÓN

### En EasyPanel - Servicio Supabase (supastaff)

Ve a **Environment Variables** y cambia estas 2 variables:

```bash
# CAMBIAR ESTO:
KONG_HTTP_PORT=8001
SUPABASE_PUBLIC_URL=http://supabase.staffhub.cl

# POR ESTO:
KONG_HTTP_PORT=8000
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl
```

---

## 📋 Variables Completas Corregidas

Copia y pega TODAS estas variables en EasyPanel:

```bash
############# Secrets
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated
SECRET_KEY_BASE=UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq
VAULT_ENC_KEY=your-32-character-encryption-key
PG_META_CRYPTO_KEY=your-encryption-key-32-chars-min

############# Database
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
ANALYTICS_PORT=3004

############# Supavisor
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_TENANT_ID=your-tenant-id
POOLER_DB_POOL_SIZE=5

############# API Proxy - Kong (CORREGIDO)
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############# API - PostgREST
PGRST_DB_SCHEMAS=public,storage,graphql_public

############# Auth - GoTrue
SITE_URL=https://www.staffhub.cl
ADDITIONAL_REDIRECT_URLS=https://www.staffhub.cl/auth/callback,https://staffhub.cl/auth/callback
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://supabase.staffhub.cl

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender
ENABLE_ANONYMOUS_USERS=false

## Phone auth
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true

############# Studio (CORREGIDO)
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl
IMGPROXY_ENABLE_WEBP_DETECTION=true
OPENAI_API_KEY=

############# Functions
FUNCTIONS_VERIFY_JWT=false

############# Logs
LOGFLARE_PUBLIC_ACCESS_TOKEN=your-super-secret-and-long-logflare-key-public
LOGFLARE_PRIVATE_ACCESS_TOKEN=your-super-secret-and-long-logflare-key-private
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

############# Google Cloud (usa tus credenciales de Google Cloud Console)
GOOGLE_PROJECT_ID=<TU_GOOGLE_PROJECT_ID>
GOOGLE_PROJECT_NUMBER=<TU_GOOGLE_PROJECT_NUMBER>
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>
GOTRUE_EXTERNAL_GOOGLE_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://supabase.staffhub.cl/auth/v1/callback
GOTRUE_SITE_URL=https://www.staffhub.cl
GOTRUE_URI_ALLOW_LIST=https://www.staffhub.cl/**,https://staffhub.cl/**
```

---

## 🚀 Pasos a Seguir

### 1. Actualizar Variables en EasyPanel

1. Ve a EasyPanel
2. Abre el servicio **Supabase** (supastaff)
3. Ve a **Environment Variables**
4. Reemplaza TODAS las variables con las de arriba
5. Click en **"Save"**

### 2. Reiniciar el Servicio

1. Click en **"Restart"** o **"Redeploy"**
2. **Espera 5-10 minutos** (Supabase tarda en iniciar)

### 3. Verificar que Funciona

Después de 5-10 minutos, prueba:

```bash
# 1. Health check de la API
https://supabase.staffhub.cl/rest/v1/

# Deberías ver:
# {"message":"The server is running"} o un 401 (es normal)

# 2. Health check de Auth
https://supabase.staffhub.cl/auth/v1/health

# Deberías ver:
# {"version":"...","name":"GoTrue"}
```

---

## 🔍 Por Qué Esto Arregla el Error 502

### Antes:
```
Dominio: supabase.staffhub.cl → Puerto 8000
Kong escuchando en: Puerto 8001
Resultado: ❌ 502 Bad Gateway (no hay nada en 8000)
```

### Después:
```
Dominio: supabase.staffhub.cl → Puerto 8000
Kong escuchando en: Puerto 8000
Resultado: ✅ Conexión exitosa
```

---

## ⏱️ Tiempo Estimado

```
Actualizar variables: 2 minutos
Reiniciar servicio: 1 minuto
Esperar inicio: 5-10 minutos
Verificar: 1 minuto
---
TOTAL: ~15 minutos
```

---

## ✅ Resultado Esperado

Después de seguir estos pasos:

```
✅ Kong escuchando en puerto 8000
✅ Dominio apuntando a puerto 8000
✅ https://supabase.staffhub.cl responde (no 502)
✅ API REST funciona
✅ Auth funciona
✅ Login funciona
```

---

## 📞 Siguiente Paso

Una vez que Supabase responda (sin 502):

1. Verifica que la app puede conectarse
2. Prueba el login con Google
3. Verifica que todo funciona

**¡Avísame cuando hayas actualizado las variables y reiniciado el servicio!** 🚀
