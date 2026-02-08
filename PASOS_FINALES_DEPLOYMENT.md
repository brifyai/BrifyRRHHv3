# 🚀 PASOS FINALES PARA DEPLOYMENT EN EASYPANEL

## 📊 Resumen de Cambios Realizados

He actualizado tu configuración para que funcione con Supabase self-hosted:

### ✅ Archivos Actualizados:

1. **Dockerfile** - Puerto cambiado a 4004
2. **server-simple.mjs** - Puerto cambiado a 4004
3. **.env.production** - Claves de Supabase self-hosted actualizadas
4. **.gitignore** - Protección para archivos de claves

### ⚠️ IMPORTANTE: Claves de Seguridad

Actualmente estás usando las **claves demo** de Supabase:
- Estas claves son **públicas** y están en la documentación oficial
- Son **INSEGURAS** para producción
- Cualquiera puede usarlas para acceder a tu base de datos

---

## 🎯 OPCIÓN 1: Deployment Rápido (con claves demo)

**Tiempo: 10 minutos**

Si solo quieres que funcione rápido para testing:

### 1. Commit y Push

```bash
git add .
git commit -m "fix: Update to port 4004 and Supabase self-hosted config"
git push
```

### 2. Configurar EasyPanel

Ve a **EASYPANEL_CONFIG_COMPLETA.md** y sigue las instrucciones exactas.

**Build Arguments:**
```bash
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
REACT_APP_GOOGLE_CLIENT_ID=777409222994-516v3sboje3thkpn5v71ah87lffk0ko4.apps.googleusercontent.com
REACT_APP_GOOGLE_REDIRECT_URI=https://www.staffhub.cl/auth/google/callback
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
PORT=4004
GENERATE_SOURCEMAP=false
CI=false
ESLINT_NO_DEV_ERRORS=true
CORS_ALLOW_ALL=true
```

**Runtime Variables:**
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

**Puerto:**
- Internal Port: **4004**

### 3. REBUILD

Click en **"Rebuild"** y espera 5-7 minutos.

### 4. Verificar

Abre `https://www.staffhub.cl` y verifica que funcione.

---

## 🔐 OPCIÓN 2: Deployment Seguro (RECOMENDADO)

**Tiempo: 20 minutos**

Para producción real con claves seguras:

### 1. Generar Claves Seguras

```bash
node scripts/setup/generate_secure_jwt_keys.mjs
```

Esto creará el archivo `SUPABASE_SECURE_KEYS.txt` con:
- JWT_SECRET
- ANON_KEY
- SERVICE_ROLE_KEY
- Y otras claves necesarias

### 2. Actualizar Supabase Self-Hosted

En tu servidor de Supabase, actualiza el archivo `.env` o `docker-compose.yml`:

```bash
# Reemplaza estas variables con las del archivo SUPABASE_SECURE_KEYS.txt
JWT_SECRET=<tu-nuevo-jwt-secret>
ANON_KEY=<tu-nuevo-anon-key>
SERVICE_ROLE_KEY=<tu-nuevo-service-role-key>
DASHBOARD_PASSWORD=<tu-nuevo-dashboard-password>
SECRET_KEY_BASE=<tu-nuevo-secret-key-base>
VAULT_ENC_KEY=<tu-nuevo-vault-enc-key>
PG_META_CRYPTO_KEY=<tu-nuevo-pg-meta-crypto-key>
LOGFLARE_PUBLIC_ACCESS_TOKEN=<tu-nuevo-logflare-public>
LOGFLARE_PRIVATE_ACCESS_TOKEN=<tu-nuevo-logflare-private>
```

### 3. Reiniciar Supabase

```bash
docker-compose down
docker-compose up -d
```

### 4. Actualizar .env.production

Actualiza el archivo `.env.production` con las nuevas claves:

```bash
REACT_APP_SUPABASE_ANON_KEY=<tu-nuevo-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-nuevo-service-role-key>
```

### 5. Commit y Push

```bash
git add .env.production
git commit -m "security: Update to secure JWT keys"
git push
```

### 6. Actualizar EasyPanel

Actualiza las Build Arguments y Runtime Variables en EasyPanel con las nuevas claves.

### 7. REBUILD

Click en **"Rebuild"** en EasyPanel.

---

## 🔍 Verificación Post-Deployment

### 1. Verificar que el sitio carga

```bash
curl -I https://www.staffhub.cl
```

Debe devolver `200 OK`.

### 2. Verificar el health check

```bash
curl https://www.staffhub.cl/api/health
```

Debe devolver:
```json
{"status":"ok","timestamp":"..."}
```

### 3. Verificar en el navegador

1. Abre `https://www.staffhub.cl`
2. Presiona **Ctrl + Shift + R** (limpiar caché)
3. Presiona **F12** (DevTools)
4. Ve a **Console** - No debe haber errores
5. Ve a **Network** - No debe haber 404s
6. Intenta hacer login con Google

### 4. Verificar logs en EasyPanel

Busca estos mensajes en los logs:

```
✅ Build completed successfully
🚀 Servidor simple ejecutándose en puerto 4004
📦 Sirviendo archivos estáticos desde: /app/build
```

---

## 🚨 Problemas Comunes

### Problema 1: Error 404 en archivos

**Causa**: El build no se completó o las variables no están configuradas

**Solución**:
1. Verifica que hiciste **REBUILD** (no restart)
2. Verifica los logs del build
3. Verifica que las Build Arguments estén configuradas

### Problema 2: Error de CORS

**Causa**: Supabase no tiene configurado el dominio correcto

**Solución**: En tu Supabase self-hosted, verifica:
```bash
GOTRUE_SITE_URL=https://www.staffhub.cl
GOTRUE_URI_ALLOW_LIST=https://www.staffhub.cl/**,https://staffhub.cl/**
```

### Problema 3: Google OAuth no funciona

**Causa**: Las redirect URIs no están configuradas en Google Cloud

**Solución**: Ve a Google Cloud Console y agrega:
- `https://supabase.staffhub.cl/auth/v1/callback`
- `https://www.staffhub.cl/auth/google/callback`

### Problema 4: JWT Invalid

**Causa**: Las claves no coinciden entre Supabase y la app

**Solución**: Verifica que las claves en EasyPanel sean las mismas que en Supabase.

---

## 📋 Checklist Completo

### Deployment Rápido (Opción 1):
```
[ ] Commit y push de cambios
[ ] Configurar Build Arguments en EasyPanel
[ ] Configurar Runtime Variables en EasyPanel
[ ] Configurar Internal Port = 4004
[ ] Hacer REBUILD
[ ] Esperar 5-7 minutos
[ ] Verificar que funciona
```

### Deployment Seguro (Opción 2):
```
[ ] Generar claves seguras con el script
[ ] Actualizar Supabase self-hosted con nuevas claves
[ ] Reiniciar Supabase
[ ] Actualizar .env.production
[ ] Commit y push
[ ] Actualizar EasyPanel con nuevas claves
[ ] Hacer REBUILD
[ ] Verificar que funciona
[ ] Guardar SUPABASE_SECURE_KEYS.txt en lugar seguro
[ ] NO subir las claves a Git
```

---

## 📚 Archivos de Referencia

- **EASYPANEL_CONFIG_COMPLETA.md** - Configuración detallada de EasyPanel
- **ACCION_INMEDIATA_EASYPANEL.md** - Pasos rápidos para deployment
- **SOLUCION_ERRORES_404_EASYPANEL.md** - Solución de problemas
- **COMANDOS_DEBUG_EASYPANEL.md** - Comandos de debugging

---

## 🎯 Siguiente Paso

**AHORA**: Elige una opción:

1. **Opción 1** (rápido): Si solo quieres que funcione para testing
2. **Opción 2** (seguro): Si vas a usar esto en producción real

Luego sigue los pasos correspondientes.

---

## 📞 Si Necesitas Ayuda

Si tienes problemas, envíame:

1. Screenshot de los logs del build en EasyPanel
2. Screenshot de la consola del navegador (F12)
3. Screenshot del Network tab mostrando los errores
4. Qué opción elegiste (1 o 2)

Con eso puedo ayudarte específicamente.

---

## ✅ Resultado Esperado

Después de completar estos pasos:

```
✅ Build exitoso en EasyPanel
✅ Contenedor corriendo en puerto 4004
✅ https://www.staffhub.cl carga sin errores
✅ No hay errores 404
✅ Login con Google funciona
✅ Conexión a Supabase self-hosted funciona
✅ Todas las rutas funcionan correctamente
```

**¡Éxito!** 🎉
