# 📊 DIAGRAMA: PROBLEMA DE CONTENEDORES HUÉRFANOS

## ESTADO ACTUAL (CON PROBLEMA)

```
┌─────────────────────────────────────────────────────────────┐
│                    EASYPANEL - DOCKER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ CONTENEDORES ACTIVOS (del docker-compose actual)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ supabase-db  │  │ supabase-kong│  │ supabase-auth│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ supabase-rest│  │supabase-real │  │supabase-stor │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ supabase-meta│  │supabase-stud │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
│  ❌ CONTENEDORES HUÉRFANOS (de configuración anterior)      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  analytics-1 │  │ supavisor-1  │  │ functions-1  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  vector-1    │  │  imgproxy-1  │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
│  🌐 RED DOCKER: supabase-network                            │
│  ├─ Todos los contenedores están en la misma red            │
│  ├─ Kong intenta resolver DNS de servicios huérfanos        │
│  └─ Resultado: :nxdomain errors → 502 Bad Gateway           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

PROBLEMA:
Kong recibe request → Intenta enrutar → Busca "analytics" en DNS
→ No existe (huérfano) → :nxdomain error → 502 Bad Gateway
```

## FLUJO DEL ERROR

```
Usuario
  ↓
https://supabase.staffhub.cl/rest/v1/
  ↓
Kong (supabase-kong)
  ↓
Intenta resolver servicios en la red
  ↓
Encuentra referencias a: analytics, functions, vector, etc.
  ↓
Intenta conectar con ellos
  ↓
:nxdomain (no such host)
  ↓
502 Bad Gateway
```

## DESPUÉS DE APLICAR LA SOLUCIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                    EASYPANEL - DOCKER                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ CONTENEDORES ACTIVOS (del docker-compose actual)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ supabase-db  │  │ supabase-kong│  │ supabase-auth│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ supabase-rest│  │supabase-real │  │supabase-stor │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ supabase-meta│  │supabase-stud │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
│  ✅ CONTENEDORES HUÉRFANOS: ELIMINADOS                      │
│                                                               │
│  🌐 RED DOCKER: supabase-network (LIMPIA)                   │
│  ├─ Solo contenedores activos en la red                     │
│  ├─ Kong solo resuelve servicios existentes                 │
│  └─ Resultado: Enrutamiento correcto → 200 OK               │
│                                                               │
└─────────────────────────────────────────────────────────────┘

FLUJO CORRECTO:
Usuario
  ↓
https://supabase.staffhub.cl/rest/v1/
  ↓
Kong (supabase-kong)
  ↓
Enruta a: http://rest:3000/
  ↓
supabase-rest responde
  ↓
200 OK (o 401 si falta auth)
```

## COMPARACIÓN: ANTES vs DESPUÉS

### ANTES (CON ORPHANS)
```
Logs de Kong:
❌ lookup analytics on 172.x.x.x:53: no such host
❌ lookup functions on 172.x.x.x:53: no such host
❌ lookup vector on 172.x.x.x:53: no such host

Resultado:
❌ 502 Bad Gateway
```

### DESPUÉS (SIN ORPHANS)
```
Logs de Kong:
✅ Routing to http://rest:3000/
✅ Routing to http://auth:9999/
✅ Routing to http://realtime:4000/

Resultado:
✅ 200 OK (o 401 si falta API key)
```

## CÓMO ELIMINAR LOS ORPHANS

### MÉTODO 1: Stop/Start (RECOMENDADO)
```
EasyPanel UI
  ↓
Servicio Supabase
  ↓
Botón "Stop" → Esperar 30s → Botón "Start"
  ↓
Docker limpia automáticamente los orphans
  ↓
✅ Solo quedan los contenedores del docker-compose actual
```

### MÉTODO 2: --remove-orphans Flag
```
docker-compose up -d --remove-orphans
  ↓
Docker detecta orphans
  ↓
Los elimina automáticamente
  ↓
Inicia solo los servicios del docker-compose actual
```

## VERIFICACIÓN VISUAL

### ❌ PROBLEMA PRESENTE
```bash
# En logs de EasyPanel verás:
Found orphan containers ([...analytics-1 ...functions-1...])

# Al probar la URL:
curl https://supabase.staffhub.cl/rest/v1/
→ 502 Bad Gateway
```

### ✅ PROBLEMA RESUELTO
```bash
# En logs de EasyPanel verás:
Container supabase-db  Running
Container supabase-kong  Started
### Success ###

# Al probar la URL:
curl https://supabase.staffhub.cl/rest/v1/
→ {"message":"The server is running"}
```

## RESUMEN VISUAL

```
PROBLEMA:
[Contenedores Activos] + [Contenedores Huérfanos] = 502 Error
        8 servicios    +    5 orphans           = Conflicto DNS

SOLUCIÓN:
[Stop] → [Limpieza Automática] → [Start] = Funcionando
         Elimina orphans                   Solo 8 servicios
```

## TIEMPO DE RESOLUCIÓN

```
┌─────────────────────────────────────┐
│ LÍNEA DE TIEMPO                     │
├─────────────────────────────────────┤
│ 0:00 - Click en "Stop"              │
│ 0:30 - Todos los contenedores down  │
│ 0:31 - Click en "Start"             │
│ 1:30 - Servicios iniciando          │
│ 2:00 - Todos los servicios running  │
│ 2:01 - Verificar URL                │
│ 2:02 - ✅ FUNCIONANDO               │
└─────────────────────────────────────┘
Total: ~2 minutos
```

## NOTA IMPORTANTE

```
╔═══════════════════════════════════════════════════════╗
║  NO NECESITAS MODIFICAR NINGÚN ARCHIVO               ║
║                                                       ║
║  ✅ docker-compose-supabase-fixed.yml → CORRECTO    ║
║  ✅ .env.production → CORRECTO                       ║
║  ✅ Configuración de red → CORRECTA                  ║
║                                                       ║
║  SOLO NECESITAS:                                     ║
║  → Stop/Start en EasyPanel                           ║
║  → Esperar 2 minutos                                 ║
║  → Verificar que funciona                            ║
╚═══════════════════════════════════════════════════════╝
```
