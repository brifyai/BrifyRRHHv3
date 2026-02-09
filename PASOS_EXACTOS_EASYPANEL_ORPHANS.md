# PASOS EXACTOS EN EASYPANEL UI PARA ELIMINAR ORPHANS

## MÉTODO MÁS SIMPLE: Stop/Start (SIN NECESIDAD DE TERMINAL)

### Paso 1: Ir al Servicio Supabase
1. Abre EasyPanel en tu navegador
2. Ve a tu proyecto "StaffHub" o como se llame
3. Busca el servicio "Supabase" o "supastaff"
4. Haz clic en él

### Paso 2: Detener el Servicio
1. Busca el botón **"Stop"** o **"Detener"** (generalmente arriba a la derecha)
2. Haz clic en **Stop**
3. Espera a que todos los contenedores se detengan (30-60 segundos)
4. Verifica que el estado sea "Stopped" o "Detenido"

### Paso 3: Reiniciar el Servicio
1. Busca el botón **"Start"** o **"Iniciar"**
2. Haz clic en **Start**
3. Espera a que todos los servicios inicien (1-2 minutos)

### Paso 4: Verificar los Logs
1. Ve a la pestaña **"Logs"** del servicio
2. Busca el mensaje de inicio
3. **NO DEBES VER** el mensaje de "Found orphan containers"
4. **DEBES VER**: "Success" al final de los logs

### Paso 5: Probar Supabase
Abre en el navegador:
```
https://supabase.staffhub.cl/rest/v1/
```

**Si ves esto = ÉXITO:**
```json
{"message":"The server is running"}
```

**O esto también es válido:**
```json
{"message":"JWT expired"}
```

---

## MÉTODO ALTERNATIVO: Rebuild (SI STOP/START NO FUNCIONA)

### Paso 1: Ir a Settings del Servicio
1. En el servicio Supabase, busca **"Settings"** o **"Configuración"**
2. Haz clic en la pestaña Settings

### Paso 2: Rebuild
1. Busca el botón **"Rebuild"** o **"Reconstruir"**
2. Haz clic en **Rebuild**
3. Confirma la acción
4. Espera a que termine (2-3 minutos)

### Paso 3: Verificar
Igual que el Paso 4 y 5 del método anterior.

---

## MÉTODO AVANZADO: Modificar Comando (SI TIENES ACCESO)

### Paso 1: Buscar Command Override
1. En el servicio Supabase, ve a **"Advanced"** o **"Avanzado"**
2. Busca una opción como:
   - "Command Override"
   - "Custom Command"
   - "Docker Compose Command"
   - "Startup Command"

### Paso 2: Agregar --remove-orphans
Si encuentras un campo de comando, modifícalo para incluir `--remove-orphans`:

**Antes:**
```bash
docker-compose up -d
```

**Después:**
```bash
docker-compose up -d --remove-orphans
```

O si usa el archivo específico:

**Antes:**
```bash
docker-compose -f docker-compose-supabase-fixed.yml up -d
```

**Después:**
```bash
docker-compose -f docker-compose-supabase-fixed.yml up -d --remove-orphans
```

### Paso 3: Guardar y Reiniciar
1. Guarda los cambios
2. Reinicia el servicio
3. Verifica los logs

---

## QUÉ BUSCAR EN LOS LOGS DESPUÉS

### ✅ LOGS CORRECTOS (Sin orphans):
```
Container supabase-db  Running
Container supabase-meta  Running
Container supabase-storage  Running
Container supabase-realtime  Running
Container supabase-studio  Running
Container supabase-auth  Running
Container supabase-rest  Running
Container supabase-kong  Starting
Container supabase-kong  Started
### Success ###
```

### ❌ LOGS CON PROBLEMA (Con orphans):
```
Found orphan containers ([staffhub_supastaff-analytics-1 ...])
```

Si ves el mensaje de orphans, el problema persiste.

---

## SI NADA FUNCIONA: Eliminar y Recrear Servicio

### Último Recurso (CUIDADO: Perderás datos si no tienes backup)

1. **Exporta/Backup** cualquier dato importante de la base de datos
2. En EasyPanel, **elimina completamente** el servicio Supabase
3. **Crea un nuevo servicio** desde cero con el mismo docker-compose
4. Esto garantiza que no haya contenedores huérfanos

---

## RESUMEN: ¿QUÉ MÉTODO USAR?

1. **Primero intenta**: Stop/Start (más simple)
2. **Si no funciona**: Rebuild
3. **Si tienes acceso**: Agregar --remove-orphans al comando
4. **Último recurso**: Eliminar y recrear servicio

## TIEMPO ESTIMADO
- Stop/Start: 2-3 minutos
- Rebuild: 3-5 minutos
- Eliminar y recrear: 5-10 minutos

## NOTA IMPORTANTE
El archivo `docker-compose-supabase-fixed.yml` está perfecto. No necesitas modificarlo. Solo necesitas que EasyPanel limpie los contenedores viejos.
