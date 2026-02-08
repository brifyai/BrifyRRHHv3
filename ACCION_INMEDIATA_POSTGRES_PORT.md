# 🎯 ACCIÓN INMEDIATA: Resolver Conflicto Puerto PostgreSQL

## ⚡ QUÉ HACER AHORA MISMO

### Opción 1: Copiar el Archivo Completo (MÁS RÁPIDO)

1. **Abre** el archivo `docker-compose-supabase-sin-postgres-port.yml` (ya está en el repo)
2. **Copia** TODO su contenido
3. **Ve a EasyPanel** → Proyecto staffhub → Servicio supastaff
4. **Pega** el contenido reemplazando el docker-compose.yml actual
5. **Guarda** y **Redeploy**
6. **Espera** 5-7 minutos

### Opción 2: Editar Solo la Sección db (MÁS RÁPIDO SI PREFIERES)

1. **Ve a EasyPanel** → Proyecto staffhub → Servicio supastaff
2. **Busca** la sección `db:` en docker-compose.yml
3. **Encuentra** estas líneas:
   ```yaml
   ports:
     - ${POSTGRES_PORT:-5432}:5432
   ```
4. **Cámbialas** a:
   ```yaml
   # ports:
   #   - ${POSTGRES_PORT:-5432}:5432
   ```
5. **Guarda** y **Redeploy**
6. **Espera** 5-7 minutos

---

## 🔍 QUÉ CAMBIÓ

**ANTES:**
- PostgreSQL intentaba exponerse en el puerto 5432 del servidor
- Conflicto con otro PostgreSQL ya corriendo en el servidor

**DESPUÉS:**
- PostgreSQL solo accesible internamente entre contenedores (db:5432)
- Sin conflictos de puerto
- Todos los servicios de Supabase siguen funcionando normalmente

---

## ✅ VERIFICACIÓN DESPUÉS DEL REDEPLOY

### 1. Espera 5-7 minutos

Los contenedores necesitan tiempo para iniciar correctamente.

### 2. Verifica los Logs en EasyPanel

Deberías ver:
```
✅ Container staffhub_supastaff-db-1       Healthy
✅ Container staffhub_supastaff-kong-1     Running
✅ Container staffhub_supastaff-auth-1     Running
✅ Container staffhub_supastaff-rest-1     Running
```

### 3. Prueba el Endpoint

Abre en el navegador o usa curl:
```
https://supabase.staffhub.cl/rest/v1/
```

**Respuesta esperada:**
- `{"message":"The server is running"}` ✅
- O error 401 (también válido) ✅

### 4. Prueba Studio

Abre en el navegador:
```
https://supabase.staffhub.cl
```

Deberías ver la interfaz de Supabase Studio.

---

## 🚀 DESPUÉS DE QUE FUNCIONE

1. **Prueba el login** en `https://www.staffhub.cl`
2. **Verifica Google OAuth** funciona
3. **Confirma** que puedes acceder al dashboard

---

## 🆘 SI SIGUE FALLANDO

Si después de este cambio aún hay errores:

1. **Revisa los logs** en EasyPanel para ver qué servicio falla
2. **Verifica** que no haya una variable `POSTGRES_PORT` en las variables de entorno
3. **Considera** eliminar el archivo `docker-compose.override.yml` si existe
4. **Avísame** el error exacto que aparece

---

## 📦 ARCHIVOS CREADOS

- ✅ `docker-compose-supabase-sin-postgres-port.yml` - Docker compose sin puerto externo
- ✅ `FIX_POSTGRES_PORT_CONFLICT.md` - Documentación detallada
- ✅ Cambios subidos a GitHub

---

## 💡 POR QUÉ ESTO FUNCIONA

Los servicios de Supabase se conectan a PostgreSQL usando el nombre del servicio `db:5432` (red interna de Docker). No necesitan que el puerto esté expuesto externamente en el servidor.

**Conexiones internas que siguen funcionando:**
- auth → `postgres://supabase_auth_admin@db:5432/postgres`
- rest → `postgres://authenticator@db:5432/postgres`
- realtime → `DB_HOST: db, DB_PORT: 5432`
- storage → `postgres://supabase_storage_admin@db:5432/postgres`
- meta → `PG_META_DB_HOST: db, PG_META_DB_PORT: 5432`

---

## 🎯 RESUMEN

**Problema:** Puerto 5432 ya en uso por otro PostgreSQL
**Solución:** Eliminar exposición externa del puerto
**Resultado:** PostgreSQL accesible solo internamente, sin conflictos
**Tiempo:** 5-7 minutos de redeploy

**¡Vamos a resolverlo!** 🚀
