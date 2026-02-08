# Troubleshooting - Error 502 en Producción

## Problema Actual
La aplicación no carga en `staffhub.cl` - Error: "Host Error"

---

## Diagnóstico

### 1. Verificar Estado del Contenedor en Easypanel

**Pasos:**
1. Abre tu panel de Easypanel
2. Ve a "Services" o "Servicios"
3. Busca el servicio "staffhub" o "BrifyRRHHv3"
4. Verifica el estado:
   - ✅ **Running** (verde) = Contenedor corriendo
   - ❌ **Stopped** (rojo) = Contenedor detenido
   - ⚠️ **Crashed** (amarillo) = Contenedor crasheó

### 2. Revisar Logs del Contenedor

**En Easypanel:**
1. Haz clic en el servicio "staffhub"
2. Ve a la pestaña "Logs"
3. Busca errores en los últimos logs

**Errores comunes a buscar:**
```
Error: Cannot find module
SyntaxError: Unexpected token
ENOENT: no such file or directory
Port 3004 is already in use
```

---

## Posibles Causas y Soluciones

### Causa 1: Puerto Incorrecto
**Síntoma**: El contenedor intenta usar puerto 3004 pero Easypanel espera 3000

**Solución**: Verificar variable de entorno `PORT` en Easypanel
- Debe ser: `PORT=3004` (o el puerto que uses)

### Causa 2: Archivo Faltante
**Síntoma**: Error "Cannot find module" o "ENOENT"

**Solución**: Verificar que `server-simple.mjs` y carpeta `src` estén en el contenedor

### Causa 3: Error de Sintaxis
**Síntoma**: "SyntaxError" en los logs

**Solución**: Revisar el código de `server-simple.mjs`

### Causa 4: Variables de Entorno Faltantes
**Síntoma**: El servidor inicia pero crashea inmediatamente

**Solución**: Verificar que estas variables estén configuradas en Easypanel:
```
NODE_ENV=production
PORT=3004
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=tu_anon_key
CORS_ALLOW_ALL=true
```

---

## Soluciones Rápidas

### Solución 1: Restart del Contenedor
1. En Easypanel, haz clic en el servicio
2. Haz clic en "Restart" o "Reiniciar"
3. Espera 1-2 minutos
4. Verifica si la app carga

### Solución 2: Rebuild Completo
1. En Easypanel, haz clic en el servicio
2. Haz clic en "Rebuild" o "Reconstruir"
3. Espera a que termine el build (5-10 minutos)
4. Verifica si la app carga

### Solución 3: Verificar Health Check
El Dockerfile tiene un health check que verifica `/api/health`

**Verificar manualmente:**
```bash
curl https://staffhub.cl/api/health
```

Debería responder:
```json
{"status":"ok","timestamp":"2026-02-08T00:00:00.000Z"}
```

---

## Comandos de Debug

### Ver logs en tiempo real (si tienes acceso SSH)
```bash
docker logs -f nombre_del_contenedor
```

### Verificar que el contenedor está corriendo
```bash
docker ps | grep staffhub
```

### Entrar al contenedor para debug
```bash
docker exec -it nombre_del_contenedor sh
```

### Verificar archivos dentro del contenedor
```bash
ls -la /app
ls -la /app/build
cat /app/server-simple.mjs
```

---

## Checklist de Verificación

- [ ] El build se completó exitosamente (sin errores)
- [ ] El contenedor está en estado "Running"
- [ ] Los logs no muestran errores
- [ ] Las variables de entorno están configuradas
- [ ] El puerto está correctamente configurado
- [ ] El health check responde correctamente
- [ ] Cloudflare está apuntando al servidor correcto

---

## Próximos Pasos

1. **Revisa los logs del contenedor** en Easypanel
2. **Copia los últimos 50 líneas de logs** y compártelos
3. **Verifica el estado del contenedor** (Running/Stopped/Crashed)
4. **Intenta hacer Restart** del contenedor

---

## Notas Importantes

- El código está correcto (compila sin errores)
- El problema es de deployment/infraestructura, no de código
- El modal de SweetAlert funciona correctamente en localhost
- Una vez que el contenedor inicie, el fix estará en producción
