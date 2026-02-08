# 🔐 Aplicar Claves Seguras - Guía Paso a Paso

## ✅ Claves Generadas Exitosamente

Has generado claves seguras únicas para tu instalación de Supabase. Ahora necesitas aplicarlas en 3 lugares:

1. **Supabase Self-Hosted** (servidor)
2. **Aplicación StaffHub** (código)
3. **EasyPanel** (deployment)

---

## 📋 PASO 1: Actualizar Supabase Self-Hosted

### 1.1 Ubicar el archivo de configuración

En tu servidor donde corre Supabase, busca uno de estos archivos:
- `.env` (en el directorio de Supabase)
- `docker-compose.yml` (sección `environment`)

### 1.2 Actualizar las variables

Reemplaza estas variables con las nuevas claves:

```bash
# JWT Configuration
JWT_SECRET=NOfWAIo3Pe6J2IY9TkNBFIFRwa0y/W3cICO9qgE9NNE=
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs

# Dashboard (opcional pero recomendado)
DASHBOARD_PASSWORD=c50556b2f5b99f71b5dffd03802b31bd

# Encryption Keys (opcional pero recomendado)
SECRET_KEY_BASE=k40Wvt9Vu1gY223n2I5lH+U895Ir+Lzt5STvItXMCMo=
VAULT_ENC_KEY=b2d03a00cb236918a3cef17fafd7f3a9
PG_META_CRYPTO_KEY=46264ac0204c7d7d956eacef942b51b6

# Logflare (opcional)
LOGFLARE_PUBLIC_ACCESS_TOKEN=7433e5522fe7035db95ece8b0b54dc0c24c4a16fd3b09a55d4e046f698cce98f
LOGFLARE_PRIVATE_ACCESS_TOKEN=9cc078b968e8161aee0de266bd22bc072a253a7de4de2d0c78b7c33dd2171967
```

### 1.3 Reiniciar Supabase

```bash
# Detener Supabase
docker-compose down

# Iniciar con las nuevas claves
docker-compose up -d

# Verificar que todo esté corriendo
docker-compose ps
```

### 1.4 Verificar que funciona

```bash
# Probar el health check
curl https://supabase.staffhub.cl/rest/v1/

# Deberías ver una respuesta (puede ser 401, es normal)
```

---

## 📋 PASO 2: Actualizar Aplicación StaffHub

### 2.1 Actualizar .env.production

Abre el archivo `.env.production` y actualiza estas líneas:

```bash
# Cambiar estas dos líneas:
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs
```

### 2.2 Commit y Push

```bash
git add .env.production
git commit -m "security: Update to secure JWT keys"
git push
```

---

## 📋 PASO 3: Actualizar EasyPanel

### 3.1 Acceder a EasyPanel

1. Ve a tu panel de EasyPanel
2. Selecciona el proyecto "staffhub"
3. Selecciona el servicio

### 3.2 Actualizar Build Arguments

Busca la sección **"Build Arguments"** y actualiza esta variable:

```bash
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
```

**Build Arguments completos:**

```bash
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
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

### 3.3 Actualizar Runtime Variables

Busca la sección **"Environment Variables"** y actualiza estas variables:

```bash
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs
```

**Runtime Variables completas:**

```bash
NODE_ENV=production
PORT=4004
CORS_ALLOW_ALL=true
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs
REACT_APP_GOOGLE_CLIENT_ID=777409222994-516v3sboje3thkpn5v71ah87lffk0ko4.apps.googleusercontent.com
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE
```

### 3.4 Guardar y REBUILD

1. Click en **"Save"** o **"Update"**
2. Click en **"Rebuild"** (NO "Restart")
3. Espera 5-7 minutos

---

## 🔍 Verificación

### 1. Verificar Supabase

```bash
# Probar conexión
curl https://supabase.staffhub.cl/rest/v1/

# Verificar que los contenedores están corriendo
docker-compose ps
```

### 2. Verificar EasyPanel

En los logs de EasyPanel, busca:

```
✅ Build completed successfully
🚀 Servidor simple ejecutándose en puerto 4004
```

### 3. Verificar en el navegador

1. Abre `https://www.staffhub.cl`
2. Presiona **Ctrl + Shift + R** (limpiar caché)
3. Presiona **F12** (DevTools)
4. Ve a **Console** - No debe haber errores de autenticación
5. Intenta hacer login

---

## 🚨 Solución de Problemas

### Problema 1: "Invalid JWT" en Supabase

**Causa**: Las claves no coinciden entre Supabase y la app

**Solución**:
1. Verifica que copiaste las claves correctamente
2. Reinicia Supabase: `docker-compose restart`
3. Haz rebuild en EasyPanel

### Problema 2: "Unauthorized" en la app

**Causa**: La app está usando las claves antiguas

**Solución**:
1. Verifica que actualizaste `.env.production`
2. Verifica que hiciste commit y push
3. Verifica que actualizaste las variables en EasyPanel
4. Haz REBUILD (no restart)

### Problema 3: Supabase no inicia

**Causa**: Error en la configuración

**Solución**:
1. Revisa los logs: `docker-compose logs`
2. Verifica que las claves no tengan espacios extra
3. Verifica que el formato sea correcto

---

## 📋 Checklist Completo

```
PASO 1: Supabase Self-Hosted
[ ] Actualizar JWT_SECRET
[ ] Actualizar ANON_KEY
[ ] Actualizar SERVICE_ROLE_KEY
[ ] Actualizar DASHBOARD_PASSWORD (opcional)
[ ] Actualizar claves de encriptación (opcional)
[ ] Reiniciar Supabase (docker-compose down && up -d)
[ ] Verificar que Supabase está corriendo

PASO 2: Aplicación StaffHub
[ ] Actualizar REACT_APP_SUPABASE_ANON_KEY en .env.production
[ ] Actualizar SUPABASE_SERVICE_ROLE_KEY en .env.production
[ ] Commit y push

PASO 3: EasyPanel
[ ] Actualizar REACT_APP_SUPABASE_ANON_KEY en Build Arguments
[ ] Actualizar SUPABASE_SERVICE_ROLE_KEY en Runtime Variables
[ ] Guardar cambios
[ ] Hacer REBUILD (no restart)
[ ] Esperar 5-7 minutos

VERIFICACIÓN
[ ] Supabase responde en https://supabase.staffhub.cl
[ ] App carga en https://www.staffhub.cl
[ ] No hay errores en la consola
[ ] Login funciona correctamente
[ ] No hay errores de JWT
```

---

## 🎯 Orden de Ejecución Recomendado

**IMPORTANTE**: Sigue este orden para evitar problemas:

1. **Primero**: Actualiza Supabase y reinícialo
2. **Segundo**: Actualiza .env.production y haz push
3. **Tercero**: Actualiza EasyPanel y haz rebuild

Si lo haces en otro orden, puede haber un período donde las claves no coincidan.

---

## 🔐 Seguridad

### ✅ Ahora tienes:

- Claves únicas generadas específicamente para tu instalación
- Claves que NO están en la documentación pública
- Claves con expiración en 10 años (2035)
- Dashboard con contraseña segura

### ⚠️ Recuerda:

- Guarda `SUPABASE_SECURE_KEYS.txt` en un lugar seguro
- NO subas este archivo a Git (ya está en .gitignore)
- NO compartas estas claves públicamente
- Cambia las claves si sospechas que fueron comprometidas

---

## ✅ Resultado Esperado

Después de completar todos los pasos:

```
✅ Supabase corriendo con claves seguras
✅ Aplicación usando las nuevas claves
✅ EasyPanel deployado con las nuevas claves
✅ Login funcionando correctamente
✅ Sin errores de autenticación
✅ Sistema completamente seguro
```

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas en algún paso, avísame y te ayudo específicamente con:
- Logs de Supabase
- Logs de EasyPanel
- Errores en el navegador
- Cualquier otro problema

**¡Tu sistema ahora es seguro!** 🔐✨
