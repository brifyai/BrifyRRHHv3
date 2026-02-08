# 📤 Cómo Subir docker-compose.override.yml a EasyPanel

## 🎯 Objetivo

Subir el archivo `docker-compose.override.yml` que acabo de crear para deshabilitar analytics y resolver el conflicto de puertos.

---

## ✅ MÉTODO 1: Subir vía Git (Recomendado)

### Paso 1: Commit y Push

```bash
git add docker-compose.override.yml
git commit -m "fix: Add override to disable analytics service"
git push
```

### Paso 2: En EasyPanel

1. Ve al servicio Supabase
2. EasyPanel detectará automáticamente el nuevo archivo
3. Click en **"Redeploy"** o espera el auto-deploy
4. Espera 5 minutos

---

## ✅ MÉTODO 2: Copiar Contenido Manualmente

Si EasyPanel tiene una sección de "Override":

### Paso 1: Copiar el Contenido

Abre el archivo `docker-compose.override.yml` y copia TODO:

```yaml
version: "3.8"

services:
  analytics:
    deploy:
      replicas: 0
    restart: "no"
    profiles:
      - disabled
```

### Paso 2: En EasyPanel

1. Ve al servicio Supabase
2. Busca una sección llamada:
   - **"Override"**
   - **"Docker Compose Override"**
   - **"Additional Configuration"**
   - **"Advanced Settings"**
3. Pega el contenido
4. Click en **"Save"**
5. Click en **"Redeploy"**
6. Espera 5 minutos

---

## ✅ MÉTODO 3: Subir Archivo Directamente

Si EasyPanel tiene un explorador de archivos:

### Paso 1: En EasyPanel

1. Ve al servicio Supabase
2. Busca **"Files"** o **"File Manager"**
3. Navega a la carpeta del proyecto
4. Click en **"Upload"** o **"Add File"**
5. Sube el archivo `docker-compose.override.yml`
6. Click en **"Redeploy"**
7. Espera 5 minutos

---

## 🔍 Verificación

Después de 5 minutos, verifica:

### 1. En los Logs de EasyPanel

Busca en los logs del deploy:

```
✅ NO debe aparecer: "Container staffhub_supastaff-analytics-1"
✅ Debe aparecer: "Container staffhub_supastaff-kong-1  Starting"
✅ Debe aparecer: "Container staffhub_supastaff-kong-1  Started"
```

### 2. En el Navegador

Abre:
```
https://supabase.staffhub.cl/rest/v1/
```

**Deberías ver:**
- ✅ `{"message":"The server is running"}` → ¡Perfecto!
- ✅ Error 401 → ¡También está bien! (Kong funciona)
- ❌ Error 502 → Espera 5 minutos más

---

## 🚨 Si Sigue Sin Funcionar

### Opción A: Eliminar Analytics del docker-compose.yml Principal

Además del override, elimina analytics del `docker-compose.yml`:

1. Abre `docker-compose.yml` en EasyPanel
2. Busca la sección completa de `analytics:`
3. **ELIMÍNALA COMPLETAMENTE**
4. Busca en `kong:` la dependencia de `analytics`
5. **ELIMÍNALA**
6. Guarda y redeploy

### Opción B: Usar Supabase Cloud

Si self-hosted sigue dando problemas:

1. Ve a https://supabase.com
2. Crea un proyecto (gratis)
3. Copia la URL y las claves
4. Actualiza las variables en tu app:

```bash
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key
```

5. Redeploy tu app
6. Listo en 5 minutos

---

## 📋 Checklist

```
[ ] Archivo docker-compose.override.yml creado
[ ] Subido a EasyPanel (vía Git, manual, o upload)
[ ] Redeploy ejecutado
[ ] Esperado 5 minutos
[ ] Verificado logs (sin analytics)
[ ] Verificado https://supabase.staffhub.cl/rest/v1/
[ ] Kong responde correctamente
```

---

## 📞 Siguiente Paso

**Después de subir el archivo:**

1. Haz redeploy
2. Espera 5 minutos
3. Verifica `https://supabase.staffhub.cl/rest/v1/`
4. Avísame el resultado

**Si funciona:**
- ✅ Prueba el login en tu app
- ✅ Verifica que todo funcione

**Si NO funciona:**
- ❌ Envíame los logs del deploy
- ❌ Consideramos cambiar a Supabase Cloud

🚀 ¡Vamos a resolverlo!
