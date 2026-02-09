# Solución: Conflicto Puerto 4000 en Easypanel

## Problema
```
Error: Bind for 0.0.0.0:4000 failed: port is already allocated
```

El contenedor `analytics` está intentando usar el puerto 4000 que ya está ocupado en el servidor.

## Causa
- Easypanel está recreando el contenedor `analytics` a pesar del override
- El puerto 4000 está siendo usado por otro servicio en el servidor
- El `docker-compose.override.yml` no está deshabilitando analytics efectivamente

## Solución Inmediata

### Opción 1: Deshabilitar Analytics Completamente (RECOMENDADO)

1. **Accede al servidor via SSH:**
   ```bash
   ssh tu-usuario@tu-servidor
   ```

2. **Navega al directorio del proyecto:**
   ```bash
   cd /etc/easypanel/projects/staffhub/staffhubbdv5/code
   ```

3. **Detén todos los contenedores:**
   ```bash
   docker compose -p staffhub_staffhubbdv5 down
   ```

4. **Elimina el contenedor analytics manualmente:**
   ```bash
   docker rm -f staffhub_staffhubbdv5-analytics-1
   ```

5. **Verifica qué está usando el puerto 4000:**
   ```bash
   netstat -tulpn | grep :4000
   # o
   lsof -i :4000
   ```

6. **Edita el docker-compose.override.yml:**
   ```bash
   nano docker-compose.override.yml
   ```
   
   Asegúrate que contenga:
   ```yaml
   version: "3.8"
   
   services:
     analytics:
       scale: 0
       image: tianon/true
       restart: "no"
       command: ["true"]
       profiles:
         - disabled
       ports: []
       networks: []
   ```

7. **Reinicia los servicios:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d
   ```

### Opción 2: Cambiar Puerto de Analytics

Si necesitas analytics, cambia su puerto:

1. **Edita docker-compose.override.yml:**
   ```yaml
   version: "3.8"
   
   services:
     analytics:
       ports:
         - "4001:4000"  # Usar 4001 en lugar de 4000
   ```

2. **Reinicia:**
   ```bash
   docker compose -p staffhub_staffhubbdv5 up -d --force-recreate analytics
   ```

### Opción 3: Liberar el Puerto 4000

Si otro servicio está usando el puerto 4000:

1. **Identifica el proceso:**
   ```bash
   sudo lsof -i :4000
   ```

2. **Detén el proceso conflictivo:**
   ```bash
   sudo kill -9 <PID>
   ```

3. **Reinicia Supabase:**
   ```bash
   docker compose -p staffhub_staffhubbdv5 up -d
   ```

## Verificación

Después de aplicar la solución:

```bash
# Ver contenedores corriendo
docker ps | grep staffhub

# Verificar logs
docker logs staffhub_staffhubbdv5-kong-1

# Verificar que analytics NO esté corriendo
docker ps | grep analytics
# (no debería aparecer nada)

# Verificar puertos en uso
netstat -tulpn | grep -E ':(4000|8000|5432|54321)'
```

## Configuración en Easypanel UI

Si estás usando la interfaz de Easypanel:

1. Ve a tu proyecto **staffhub/staffhubbdv5**
2. Click en **Settings** → **Advanced**
3. En **Docker Compose Override**, pega:
   ```yaml
   services:
     analytics:
       scale: 0
   ```
4. Click **Save** y **Rebuild**

## Prevención

Para evitar este problema en el futuro:

1. **Commit el override actualizado:**
   ```bash
   git add docker-compose.override.yml
   git commit -m "Fix: Disable analytics to prevent port 4000 conflict"
   git push origin main
   ```

2. **En Easypanel, asegúrate que:**
   - El override esté en el repositorio
   - Easypanel esté configurado para usar el override
   - No haya otros servicios usando el puerto 4000

## Notas Importantes

- **Analytics NO es esencial** para el funcionamiento de Supabase
- Analytics es principalmente para métricas y monitoreo
- Todos los servicios críticos (auth, rest, realtime, storage) funcionan sin analytics
- Si necesitas analytics más adelante, usa un puerto diferente

## Archivos Actualizados

- ✅ `docker-compose.override.yml` - Override mejorado
- ✅ `docker-compose.easypanel.yml` - Configuración alternativa
- ✅ Este documento de solución

## Siguiente Paso

Después de aplicar la solución, ejecuta en Easypanel:
```bash
docker compose -p staffhub_staffhubbdv5 up -d
```

Y verifica que todos los servicios estén corriendo excepto analytics.
