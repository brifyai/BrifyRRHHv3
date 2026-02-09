# 🎯 PASOS EXACTOS: Eliminar Analytics desde EasyPanel UI

## 🔍 EL PROBLEMA

EasyPanel está generando automáticamente un `docker-compose.override.yml` que:
- Re-agrega analytics
- Mapea puerto 3005 → 4000
- Sobrescribe tu configuración

**La solución está en la UI de EasyPanel, NO en archivos.**

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Abrir EasyPanel

1. Abre tu navegador
2. Ve a tu panel de EasyPanel
3. Inicia sesión

### PASO 2: Ir al Servicio Supabase

1. En el dashboard, busca el proyecto **"staffhub"**
2. Click en el proyecto
3. Busca el servicio **"supastaff"** (o como se llame tu Supabase)
4. Click en el servicio

### PASO 3: Buscar Configuración de Puertos

Ahora verás varias pestañas/secciones. **Revisa CADA UNA** buscando configuración de puertos:

#### Opción A: Pestaña "Ports" o "Port Mappings"

```
┌─────────────────────────────────────────┐
│ Tabs:                                   │
│ [General] [Environment] [Ports] [...]   │
└─────────────────────────────────────────┘
```

1. Click en **"Ports"** o **"Port Mappings"** o **"Networking"**
2. Busca una tabla como esta:

```
┌──────────────────────────────────────────┐
│ Host Port  →  Container Port  →  Service │
├──────────────────────────────────────────┤
│ 8000       →  8000            →  kong    │
│ 5432       →  5432            →  db      │
│ 3005       →  4000            →  analytics ❌ │
└──────────────────────────────────────────┘
```

3. **ELIMINA** la fila que dice `3005` o `analytics`
4. Click en el ícono de **basura** 🗑️ o **X**
5. **Guarda** los cambios

#### Opción B: Sección "Services" o "Containers"

1. Busca una lista de servicios/contenedores
2. Verás algo como:

```
☑️ db
☑️ kong
☑️ auth
☑️ rest
☑️ analytics ❌ ← DESMARCA ESTE
```

3. **DESMARCA** o **DESHABILITA** analytics
4. **Guarda** los cambios

#### Opción C: Variables de Entorno

1. Click en **"Environment"** o **"Environment Variables"**
2. Busca en la lista:

```
POSTGRES_PASSWORD=...
JWT_SECRET=...
ANALYTICS_PORT=3005 ❌ ← ELIMINA ESTA
```

3. Si encuentras `ANALYTICS_PORT`, **ELIMÍNALA**
4. Click en 🗑️ o **Delete**
5. **Guarda** los cambios

#### Opción D: Configuración Avanzada

1. Busca **"Advanced"** o **"Advanced Settings"**
2. Puede haber una sección de **"Enabled Services"** o **"Active Services"**
3. **DESMARCA** analytics
4. **Guarda** los cambios

### PASO 4: Editar docker-compose.yml

Aunque hayas deshabilitado analytics en la UI, también debes eliminarlo del docker-compose.yml:

1. En el servicio Supabase, busca **"Configuration"** o **"Docker Compose"**
2. Abre el editor del `docker-compose.yml`
3. Busca (Ctrl+F): `analytics:`
4. **ELIMINA** toda la sección de analytics (desde `analytics:` hasta el siguiente servicio)
5. Busca `kong:` y su sección `depends_on:`
6. **ELIMINA** cualquier mención de `analytics`

**Debe quedar así:**

```yaml
kong:
  container_name: supabase-kong
  image: kong:2.8.1
  restart: unless-stopped
  depends_on:
    db:
      condition: service_healthy
  # NO debe mencionar analytics
```

7. **Guarda** el archivo

### PASO 5: Redeploy

1. Click en **"Save"** o **"Update"**
2. Click en **"Redeploy"** o **"Rebuild"**
3. **Espera 5 minutos**

---

## 🔍 VERIFICACIÓN

### En los Logs de EasyPanel:

**Busca en los logs del deploy:**

```
✅ DEBE aparecer:
Container staffhub_supastaff-kong-1  Starting
Container staffhub_supastaff-kong-1  Started

❌ NO debe aparecer:
Container staffhub_supastaff-analytics-1
Error: Bind for 0.0.0.0:3005 failed
```

### En el Navegador:

Después de 5 minutos, abre:

```
https://supabase.staffhub.cl/rest/v1/
```

**Deberías ver:**
- ✅ `{"message":"The server is running"}` → ¡Perfecto!
- ✅ Error 401 → ¡También funciona!
- ❌ Error 502 → Espera 5 minutos más

---

## 🚨 SI NO ENCUENTRAS LA CONFIGURACIÓN

Si no encuentras ninguna de las opciones anteriores, entonces EasyPanel está usando el docker-compose.yml directamente.

### Solución Alternativa:

**Usa un docker-compose.yml MÍNIMO sin analytics:**

1. En EasyPanel, abre el editor de `docker-compose.yml`
2. **BORRA TODO** el contenido actual
3. **COPIA Y PEGA** este docker-compose.yml mínimo:

```yaml
version: "3.8"

services:
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
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-postgres}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - db-data:/var/lib/postgresql/data

  kong:
    container_name: supabase-kong
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
    depends_on:
      db:
        condition: service_healthy
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
    volumes:
      - ./volumes/api/kong.yml:/usr/local/kong/kong.yml:ro

  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.132.3
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-postgres}
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: ${ADDITIONAL_REDIRECT_URLS}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOTRUE_EXTERNAL_GOOGLE_ENABLED}
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID}
      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOTRUE_EXTERNAL_GOOGLE_SECRET}
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI}

  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:v11.2.2
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-postgres}
      PGRST_DB_SCHEMAS: ${PGRST_DB_SCHEMAS:-public}
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}

  realtime:
    container_name: supabase-realtime
    image: supabase/realtime:v2.25.50
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB:-postgres}
      API_JWT_SECRET: ${JWT_SECRET}
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}

  storage:
    container_name: supabase-storage
    image: supabase/storage-api:v0.43.11
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-postgres}
    volumes:
      - storage-data:/var/lib/storage

  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:v0.68.0
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: ${POSTGRES_DB:-postgres}
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}

  studio:
    container_name: supabase-studio
    image: supabase/studio:20240101-5e5586d
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      SUPABASE_URL: ${SUPABASE_PUBLIC_URL}
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}

volumes:
  db-data:
  storage-data:
```

4. **Guarda** el archivo
5. **Redeploy**
6. **Espera 5 minutos**

---

## 📸 CAPTURAS QUE NECESITO

Si después de seguir TODOS estos pasos sigue sin funcionar, envíame capturas de:

1. **Todas las pestañas** del servicio Supabase en EasyPanel
2. **Variables de entorno** completas
3. **Logs del último deploy** (últimas 100 líneas)
4. **Configuración de puertos** (si existe la sección)

Con eso te doy la solución exacta.

---

## ⏱️ Tiempo Estimado

```
Buscar configuración: 5 minutos
Eliminar analytics: 2 minutos
Editar docker-compose.yml: 3 minutos
Redeploy: 5 minutos
---
TOTAL: ~15 minutos
```

---

## 🎯 RESULTADO ESPERADO

Después de seguir estos pasos:

```
✅ Analytics NO aparece en los logs
✅ Kong inicia correctamente
✅ https://supabase.staffhub.cl/rest/v1/ responde
✅ Login funciona
✅ Aplicación 100% operativa
```

---

## 📞 SIGUIENTE PASO

**AHORA:**
1. Sigue los pasos de arriba
2. Busca en TODAS las pestañas de EasyPanel
3. Elimina cualquier configuración de analytics
4. Redeploy

**DESPUÉS:**
5. Avísame el resultado
6. Si funciona: ¡Celebramos! 🎉
7. Si no funciona: Envíame las capturas

🚀 ¡Vamos a resolverlo!
