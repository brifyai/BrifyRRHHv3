# SOLUCIÓN FINAL: Eliminar Contenedores Huérfanos en EasyPanel

## PROBLEMA IDENTIFICADO

Error 502 en `https://supabase.staffhub.cl` causado por **contenedores huérfanos** de una configuración anterior:

```
Found orphan containers:
- staffhub_supastaff-analytics-1
- staffhub_supastaff-supavisor-1
- staffhub_supastaff-functions-1
- staffhub_supastaff-vector-1
- staffhub_supastaff-imgproxy-1
```

Estos contenedores están causando errores `:nxdomain` porque intentan comunicarse con servicios que ya no existen.

## SOLUCIÓN: 3 OPCIONES

### OPCIÓN 1: Agregar --remove-orphans al comando de EasyPanel (RECOMENDADO)

En EasyPanel, en la configuración del servicio Supabase:

1. Ve a la sección de **Advanced Settings** o **Command Override**
2. Busca el comando que ejecuta docker-compose
3. Agrega el flag `--remove-orphans`:

```bash
docker-compose -f docker-compose-supabase-fixed.yml up -d --remove-orphans
```

### OPCIÓN 2: Detener y Reiniciar el Servicio Completamente

En EasyPanel:

1. **DETENER** el servicio Supabase completamente (botón Stop)
2. Esperar 30 segundos
3. **INICIAR** el servicio nuevamente (botón Start)

Esto forzará a Docker a limpiar los contenedores huérfanos.

### OPCIÓN 3: Eliminar Contenedores Manualmente (Si tienes acceso a terminal)

Si EasyPanel te da acceso a una terminal o consola:

```bash
# Detener todos los contenedores del proyecto
docker-compose -f docker-compose-supabase-fixed.yml down

# Eliminar contenedores huérfanos específicos
docker rm -f staffhub_supastaff-analytics-1
docker rm -f staffhub_supastaff-supavisor-1
docker rm -f staffhub_supastaff-functions-1
docker rm -f staffhub_supastaff-vector-1
docker rm -f staffhub_supastaff-imgproxy-1

# Reiniciar con --remove-orphans
docker-compose -f docker-compose-supabase-fixed.yml up -d --remove-orphans
```

## VERIFICACIÓN DESPUÉS DE APLICAR LA SOLUCIÓN

### 1. Verificar que no hay errores de red en los logs

En EasyPanel, revisa los logs de Kong y NO deberías ver:

```
❌ NO DEBE APARECER: lookup analytics on 172.x.x.x:53: no such host
❌ NO DEBE APARECER: lookup functions on 172.x.x.x:53: no such host
```

### 2. Verificar que Supabase responde

Abre en el navegador:

```
https://supabase.staffhub.cl/rest/v1/
```

**Respuesta esperada:**
```json
{"message":"The server is running"}
```

O un error de autenticación (que es normal sin API key):
```json
{"message":"JWT expired"}
```

### 3. Verificar Studio

```
https://supabase.staffhub.cl/
```

Debería cargar la interfaz de Supabase Studio.

### 4. Verificar que todos los servicios están corriendo

En EasyPanel, deberías ver SOLO estos contenedores:

✅ supabase-db
✅ supabase-kong
✅ supabase-auth
✅ supabase-rest
✅ supabase-realtime
✅ supabase-storage
✅ supabase-meta
✅ supabase-studio

❌ NO DEBEN EXISTIR: analytics, functions, vector, imgproxy, supavisor

## POR QUÉ ESTO SOLUCIONA EL PROBLEMA

Los contenedores huérfanos están en la misma red Docker y causan:

1. **Errores de DNS**: Kong intenta resolver nombres de servicios que ya no existen
2. **Conflictos de red**: Los contenedores antiguos ocupan IPs en la red
3. **502 Bad Gateway**: Kong no puede enrutar correctamente porque hay servicios fantasma

Al eliminar los huérfanos con `--remove-orphans`, Docker:
- Limpia todos los contenedores que no están en el docker-compose actual
- Libera las IPs de la red
- Elimina las entradas DNS fantasma
- Permite que Kong funcione correctamente

## SIGUIENTE PASO DESPUÉS DE APLICAR

Una vez que apliques cualquiera de las 3 opciones:

1. Espera 1-2 minutos para que todos los servicios inicien
2. Verifica `https://supabase.staffhub.cl/rest/v1/`
3. Si responde correctamente, prueba el login en `https://www.staffhub.cl`
4. Confirma que Google OAuth funciona

## NOTAS IMPORTANTES

- El archivo `docker-compose-supabase-fixed.yml` está CORRECTO
- NO necesitas modificar ninguna variable de entorno
- NO necesitas cambiar la configuración de red
- SOLO necesitas eliminar los contenedores huérfanos
- Esto es un problema de limpieza, no de configuración
