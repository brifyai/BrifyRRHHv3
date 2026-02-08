# 🔧 SOLUCIÓN: Conflicto Puerto PostgreSQL 5432

## 🚨 PROBLEMA ACTUAL

```
Error response from daemon: driver failed programming external connectivity 
on endpoint staffhub_supastaff-db-1: Bind for 0.0.0.0:5432 failed: 
port is already allocated
```

**Causa:** Otro servicio PostgreSQL ya está usando el puerto 5432 en el servidor de EasyPanel.

---

## ✅ SOLUCIÓN: Eliminar Exposición Externa del Puerto PostgreSQL

PostgreSQL **NO necesita** estar expuesto externamente. Solo necesita ser accesible internamente entre los contenedores de Supabase.

### 🎯 Cambio Necesario

En el servicio `db:` del docker-compose.yml, **comentar o eliminar** la sección `ports:`:

**ANTES:**
```yaml
db:
  container_name: supabase-db
  image: supabase/postgres:15.1.0.117
  healthcheck:
    test: pg_isready -U postgres -h localhost
    interval: 5s
    timeout: 5s
    retries: 10
  restart: unless-stopped
  ports:
    - ${POSTGRES_PORT:-5432}:5432  # ❌ ESTO CAUSA EL CONFLICTO
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB:-postgres}
    JWT_SECRET: ${JWT_SECRET}
  volumes:
    - db-data:/var/lib/postgresql/data
```

**DESPUÉS:**
```yaml
db:
  container_name: supabase-db
  image: supabase/postgres:15.1.0.117
  healthcheck:
    test: pg_isready -U postgres -h localhost
    interval: 5s
    timeout: 5s
    retries: 10
  restart: unless-stopped
  # PostgreSQL solo accesible internamente en db:5432
  # ports:
  #   - ${POSTGRES_PORT:-5432}:5432
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB:-postgres}
    JWT_SECRET: ${JWT_SECRET}
  volumes:
    - db-data:/var/lib/postgresql/data
```

---

## 📋 PASOS EN EASYPANEL

### Paso 1: Ir al Servicio Supabase

1. Abre EasyPanel
2. Ve al proyecto **staffhub**
3. Selecciona el servicio **supastaff** (Supabase)

### Paso 2: Editar docker-compose.yml

1. Click en la pestaña **"Source"** o **"Configuration"**
2. Busca el archivo **docker-compose.yml**
3. Localiza la sección `db:` (al inicio del archivo)

### Paso 3: Comentar la Sección de Puertos

Busca estas líneas:
```yaml
  ports:
    - ${POSTGRES_PORT:-5432}:5432
```

Y cámbialas a:
```yaml
  # ports:
  #   - ${POSTGRES_PORT:-5432}:5432
```

O simplemente **elimina esas 2 líneas completamente**.

### Paso 4: Guardar y Redesplegar

1. Click en **"Save"** o **"Guardar"**
2. Click en **"Redeploy"** o **"Rebuild"**
3. Espera 5-7 minutos

---

## 🔍 ¿POR QUÉ FUNCIONA ESTO?

### Acceso Interno vs Externo

- **Acceso Interno (db:5432)**: Los contenedores de Supabase (auth, rest, realtime, etc.) pueden conectarse a PostgreSQL usando `db:5432`
- **Acceso Externo (0.0.0.0:5432)**: Expone PostgreSQL al servidor host, causando conflicto con otros servicios

### Contenedores que Usan PostgreSQL Internamente

Todos estos servicios se conectan a `db:5432` (interno):
- ✅ `auth` → `postgres://supabase_auth_admin:password@db:5432/postgres`
- ✅ `rest` → `postgres://authenticator:password@db:5432/postgres`
- ✅ `realtime` → `DB_HOST: db` + `DB_PORT: 5432`
- ✅ `storage` → `postgres://supabase_storage_admin:password@db:5432/postgres`
- ✅ `meta` → `PG_META_DB_HOST: db` + `PG_META_DB_PORT: 5432`

**Ninguno necesita acceso externo al puerto 5432.**

---

## ✅ RESULTADO ESPERADO

Después del redeploy:

```
✅ Container staffhub_supastaff-db-1       Running
✅ Container staffhub_supastaff-kong-1     Running
✅ Container staffhub_supastaff-auth-1     Running
✅ Container staffhub_supastaff-rest-1     Running
✅ Container staffhub_supastaff-realtime-1 Running
✅ Container staffhub_supastaff-storage-1  Running
✅ Container staffhub_supastaff-meta-1     Running
✅ Container staffhub_supastaff-studio-1   Running
```

---

## 🧪 VERIFICACIÓN

### 1. Verificar que Kong está corriendo

```bash
curl https://supabase.staffhub.cl/rest/v1/
```

**Respuesta esperada:**
```json
{"message":"The server is running"}
```
O un error 401 (también válido, significa que Kong está funcionando).

### 2. Verificar Studio

Abre en el navegador:
```
https://supabase.staffhub.cl
```

Deberías ver la interfaz de Supabase Studio.

### 3. Verificar Auth

```bash
curl https://supabase.staffhub.cl/auth/v1/health
```

**Respuesta esperada:**
```json
{"version":"...","name":"GoTrue"}
```

---

## 📦 ARCHIVO COMPLETO LISTO PARA USAR

He creado el archivo **`docker-compose-supabase-sin-postgres-port.yml`** con todos los cambios aplicados.

**Para usarlo:**

1. Copia el contenido de `docker-compose-supabase-sin-postgres-port.yml`
2. Pégalo en EasyPanel reemplazando el docker-compose.yml actual
3. Guarda y redeploy

---

## 🚀 SIGUIENTE PASO

Una vez que todos los contenedores estén corriendo:

1. **Verifica** que `https://supabase.staffhub.cl/rest/v1/` responde
2. **Prueba** el login en `https://www.staffhub.cl`
3. **Confirma** que Google OAuth funciona

---

## 💡 NOTA IMPORTANTE

Si después de este cambio sigues teniendo problemas, es posible que:

1. **EasyPanel esté generando un override automático** con el puerto
2. **Necesites eliminar la variable** `POSTGRES_PORT` de las variables de entorno
3. **Considerar usar Supabase Cloud** (sin estos problemas de configuración)

---

## 📞 ¿NECESITAS AYUDA?

Si el problema persiste después de este cambio, avísame y revisaremos:
- Variables de entorno en EasyPanel
- Logs de los contenedores
- Configuración del override file

**¡Estamos cerca de resolverlo!** 🎯
