# 🚨 Solución Error 502 - Supabase No Accesible

## Problema Actual

- ✅ Aplicación funcionando en `https://www.staffhub.cl` (puerto 4004)
- ❌ Supabase devuelve **502 Bad Gateway** en `https://supabase.staffhub.cl/rest/v1/`
- ❌ No puedes hacer login porque la app no puede conectarse a Supabase
- ⚠️ EasyPanel muestra: "Some issues were found in your Docker Compose configuration"

## Causa Raíz

El archivo `docker-compose.yml` de tu servicio Supabase en EasyPanel está **vacío o mal configurado**. Kong (el API gateway de Supabase) no está corriendo en el puerto 8000.

---

## 🔧 Solución Paso a Paso

### PASO 1: Acceder a la Configuración de Supabase en EasyPanel

1. Abre EasyPanel
2. Ve a tu proyecto
3. Busca el servicio de **Supabase** (puede llamarse "supastaff", "supabase", etc.)
4. Haz click en el servicio
5. Busca la sección **"Docker Compose"** o **"Configuration"**
6. Verás un warning: **"Some issues were found in your Docker Compose configuration"**
7. Haz click en **"View"** o **"Edit"** para ver los errores

---

### PASO 2: Obtener la Configuración Correcta

Tienes **2 opciones**:

#### Opción A: Configuración Oficial Completa (Recomendada)

Usa la configuración oficial de Supabase:

```bash
# Descarga la configuración oficial
curl -o docker-compose.yml https://raw.githubusercontent.com/supabase/supabase/master/docker/docker-compose.yml

# También necesitas el archivo de configuración de Kong
curl -o kong.yml https://raw.githubusercontent.com/supabase/supabase/master/docker/volumes/api/kong.yml
```

**Ventajas:**
- Configuración probada y mantenida por Supabase
- Incluye todos los servicios necesarios
- Actualizaciones regulares

**Desventajas:**
- Más compleja
- Requiere más recursos

#### Opción B: Configuración Mínima (Más Simple)

Usa el archivo que acabo de crear: `supabase-docker-compose-minimal.yml`

**Ventajas:**
- Más simple y fácil de entender
- Menos recursos necesarios
- Solo los servicios esenciales

**Desventajas:**
- Puede faltar alguna funcionalidad avanzada

---

### PASO 3: Configurar las Variables de Entorno en EasyPanel

En EasyPanel, en la sección de **Environment Variables** del servicio Supabase, asegúrate de tener TODAS estas variables:

```bash
# ========================================
# CLAVES SEGURAS (USA LAS NUEVAS)
# ========================================
JWT_SECRET=NOfWAIo3Pe6J2IY9TkNBFIFRwa0y/W3cICO9qgE9NNE=
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs

# ========================================
# DATABASE
# ========================================
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

# ========================================
# API
# ========================================
PGRST_DB_SCHEMAS=public,storage,graphql_public

# ========================================
# AUTH
# ========================================
SITE_URL=https://www.staffhub.cl
ADDITIONAL_REDIRECT_URLS=https://www.staffhub.cl/auth/callback,https://staffhub.cl/auth/callback
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://supabase.staffhub.cl

# Email
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender

# Phone
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true
ENABLE_ANONYMOUS_USERS=false

# ========================================
# GOOGLE OAUTH (usa tus credenciales de Google Cloud Console)
# ========================================
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>
GOTRUE_EXTERNAL_GOOGLE_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://supabase.staffhub.cl/auth/v1/callback
GOTRUE_SITE_URL=https://www.staffhub.cl
GOTRUE_URI_ALLOW_LIST=https://www.staffhub.cl/**,https://staffhub.cl/**

# ========================================
# STUDIO
# ========================================
STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl

# ========================================
# DASHBOARD
# ========================================
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=c50556b2f5b99f71b5dffd03802b31bd

# ========================================
# ENCRYPTION
# ========================================
SECRET_KEY_BASE=k40Wvt9Vu1gY223n2I5lH+U895Ir+Lzt5STvItXMCMo=
VAULT_ENC_KEY=b2d03a00cb236918a3cef17fafd7f3a9
PG_META_CRYPTO_KEY=46264ac0204c7d7d956eacef942b51b6

# ========================================
# ANALYTICS
# ========================================
LOGFLARE_PUBLIC_ACCESS_TOKEN=7433e5522fe7035db95ece8b0b54dc0c24c4a16fd3b09a55d4e046f698cce98f
LOGFLARE_PRIVATE_ACCESS_TOKEN=9cc078b968e8161aee0de266bd22bc072a253a7de4de2d0c78b7c33dd2171967

# ========================================
# KONG
# ========================================
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# ========================================
# POOLER
# ========================================
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_TENANT_ID=your-tenant-id
POOLER_DB_POOL_SIZE=5

# ========================================
# FUNCTIONS
# ========================================
FUNCTIONS_VERIFY_JWT=false

# ========================================
# DOCKER
# ========================================
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# ========================================
# GOOGLE CLOUD
# ========================================
GOOGLE_PROJECT_ID=stratega-ai-x
GOOGLE_PROJECT_NUMBER=777409222994
```

---

### PASO 4: Configurar el Dominio y Puerto en EasyPanel

En la configuración del servicio Supabase:

1. **Domain**: `supabase.staffhub.cl`
2. **Internal Port**: `8000` (puerto de Kong)
3. **Protocol**: `HTTP` (EasyPanel maneja HTTPS)

---

### PASO 5: Aplicar la Configuración

1. **Guarda** todos los cambios
2. Haz click en **"Deploy"** o **"Rebuild"**
3. Espera 5-10 minutos (Supabase tarda en iniciar todos los servicios)

---

### PASO 6: Verificar que Funciona

#### 6.1 Verificar en EasyPanel

En los logs del servicio Supabase, deberías ver:

```
✅ Kong started on port 8000
✅ GoTrue started on port 9999
✅ PostgREST started on port 3000
✅ Realtime started
✅ Storage started
```

#### 6.2 Verificar desde tu navegador

Abre estas URLs:

```bash
# 1. Health check de la API REST
https://supabase.staffhub.cl/rest/v1/

# Deberías ver:
# {"message":"The server is running"}
# O un error 401 (es normal, significa que está funcionando)

# 2. Health check de Auth
https://supabase.staffhub.cl/auth/v1/health

# Deberías ver:
# {"version":"...","name":"GoTrue"}

# 3. Studio (opcional)
https://supabase.staffhub.cl/
# Deberías ver el dashboard de Supabase
```

#### 6.3 Verificar desde la terminal

```bash
# Probar la API REST
curl https://supabase.staffhub.cl/rest/v1/

# Probar Auth
curl https://supabase.staffhub.cl/auth/v1/health

# Ver headers
curl -I https://supabase.staffhub.cl/rest/v1/
```

---

## 🔍 Diagnóstico de Problemas

### Problema 1: Sigue dando 502

**Posibles causas:**
- Kong no está corriendo
- El puerto 8000 no está expuesto
- El dominio no apunta al puerto correcto

**Solución:**
```bash
# En EasyPanel, verifica los logs del servicio Supabase
# Busca errores de Kong

# Verifica que el puerto interno sea 8000
# Verifica que el dominio esté configurado correctamente
```

### Problema 2: "Connection refused"

**Causa:** Los servicios de Supabase no han iniciado completamente

**Solución:**
```bash
# Espera 5-10 minutos más
# Supabase tiene muchos servicios que deben iniciar en orden

# Verifica los logs en EasyPanel
# Busca mensajes como "waiting for database..."
```

### Problema 3: "Invalid JWT"

**Causa:** Las claves no coinciden

**Solución:**
```bash
# Verifica que usaste las NUEVAS claves seguras
# Verifica que las claves en Supabase coincidan con las de la app
# Reinicia ambos servicios
```

### Problema 4: "Database connection failed"

**Causa:** PostgreSQL no está corriendo o no es accesible

**Solución:**
```bash
# Verifica que el servicio 'db' esté corriendo
# Verifica que POSTGRES_PASSWORD esté configurado
# Verifica que los otros servicios puedan conectarse a 'db:5432'
```

---

## 📋 Checklist de Verificación

```
CONFIGURACIÓN
[ ] Docker Compose configurado correctamente
[ ] Todas las variables de entorno configuradas
[ ] JWT_SECRET actualizado con la clave segura
[ ] ANON_KEY actualizado con la clave segura
[ ] SERVICE_ROLE_KEY actualizado con la clave segura
[ ] Dominio configurado: supabase.staffhub.cl
[ ] Puerto interno configurado: 8000

DEPLOYMENT
[ ] Cambios guardados en EasyPanel
[ ] Rebuild ejecutado (no solo restart)
[ ] Esperado 5-10 minutos
[ ] Logs revisados (sin errores críticos)

VERIFICACIÓN
[ ] https://supabase.staffhub.cl/rest/v1/ responde (no 502)
[ ] https://supabase.staffhub.cl/auth/v1/health responde
[ ] No hay errores en los logs de Supabase
[ ] No hay errores en los logs de la aplicación

APLICACIÓN
[ ] https://www.staffhub.cl carga correctamente
[ ] No hay errores en la consola del navegador
[ ] Login funciona correctamente
```

---

## 🎯 Orden de Ejecución

**IMPORTANTE:** Sigue este orden exacto:

1. ✅ **Primero**: Configura Supabase en EasyPanel
   - Actualiza docker-compose.yml
   - Actualiza variables de entorno
   - Deploy/Rebuild
   - **ESPERA 10 minutos**

2. ✅ **Segundo**: Verifica que Supabase funciona
   - Prueba `https://supabase.staffhub.cl/rest/v1/`
   - Debe responder (no 502)

3. ✅ **Tercero**: Verifica que la app puede conectarse
   - Abre `https://www.staffhub.cl`
   - Abre DevTools (F12)
   - Busca errores de conexión

4. ✅ **Cuarto**: Prueba el login
   - Intenta hacer login
   - Verifica que funciona

---

## 🚀 Resultado Esperado

Después de completar todos los pasos:

```
✅ Supabase accesible en https://supabase.staffhub.cl
✅ Kong corriendo en puerto 8000
✅ API REST respondiendo correctamente
✅ Auth funcionando
✅ Aplicación puede conectarse a Supabase
✅ Login funciona correctamente
✅ Sin errores 502
✅ Sin errores de JWT
```

---

## 📞 Siguiente Paso

Una vez que Supabase esté funcionando (sin error 502), el siguiente paso es:

1. Verificar que las claves coincidan entre Supabase y la app
2. Si no coinciden, seguir la guía `APLICAR_CLAVES_SEGURAS.md`
3. Probar el login completo

---

## 💡 Notas Importantes

### Sobre los Puertos

- **Puerto 8000**: Kong (API Gateway) - Este es el que debe estar expuesto
- **Puerto 5432**: PostgreSQL - Solo interno
- **Puerto 9999**: GoTrue (Auth) - Solo interno
- **Puerto 3000**: PostgREST - Solo interno (Kong hace proxy)

### Sobre las Claves

- Las claves **DEBEN** ser las mismas en Supabase y en la aplicación
- Si cambias las claves en Supabase, debes cambiarlas en la app
- Si cambias las claves en la app, debes cambiarlas en Supabase
- **Ambos servicios deben usar las NUEVAS claves seguras**

### Sobre el Tiempo de Inicio

- Supabase tarda **5-10 minutos** en iniciar completamente
- No te preocupes si al principio da errores
- Espera a que todos los servicios estén "healthy"
- Revisa los logs para ver el progreso

---

## ✅ ¿Listo para Continuar?

Una vez que hayas completado estos pasos y Supabase esté respondiendo (sin 502), avísame y continuamos con:

1. Verificar la conexión entre la app y Supabase
2. Alinear las claves JWT
3. Probar el login completo
4. Verificar que todo funciona correctamente

**¡Vamos a arreglar esto!** 🚀
