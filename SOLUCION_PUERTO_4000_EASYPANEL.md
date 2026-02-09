# Solución: Conflicto Puerto 4000 en Easypanel

## Problema
```
Error: Bind for 0.0.0.0:4000 failed: port is already allocated
```

El contenedor `analytics` está intentando usar el puerto 4000 que ya está ocupado en el servidor.

## Causa
- El puerto 4000 está siendo usado por otro servicio en el servidor
- Easypanel genera un docker-compose.yml base que siempre incluye analytics
- El override con `scale: 0` no funciona en la versión de docker-compose de Easypanel

## ✅ Solución Aplicada: Cambiar Puerto de Analytics

En lugar de deshabilitar analytics, cambiamos su puerto de **4000 a 4001**.

### Cambios en docker-compose.override.yml:

```yaml
version: "3.8"

services:
  analytics:
    ports:
      - "4001:4000"  # Puerto externo 4001, interno 4000
```

Esto permite que:
- Analytics funcione sin conflictos
- El puerto 4000 quede libre para otros servicios
- Easypanel pueda recrear el contenedor sin errores

## Verificación Después del Deploy

Una vez que Easypanel termine el deployment:

```bash
# Ver contenedores corriendo
docker ps | grep staffhub

# Verificar que analytics esté en puerto 4001
docker ps | grep analytics
# Debería mostrar: 0.0.0.0:4001->4000/tcp

# Verificar logs de analytics
docker logs staffhub_staffhubbdv5-analytics-1

# Verificar que Kong esté funcionando
docker logs staffhub_staffhubbdv5-kong-1
```

## Si el Problema Persiste

Si después del deploy sigue habiendo error, significa que otro servicio está usando el puerto 4000 en el servidor. En ese caso:

### Opción A: Identificar y Liberar el Puerto 4000

```bash
# SSH al servidor
ssh tu-usuario@tu-servidor

# Ver qué está usando el puerto 4000
sudo netstat -tulpn | grep :4000
# o
sudo lsof -i :4000

# Si es un contenedor Docker:
docker ps | grep 4000

# Si es otro servicio de Easypanel:
# Ve a Easypanel UI y verifica otros proyectos
```

### Opción B: Deshabilitar Analytics Completamente

Si no necesitas analytics (solo es para métricas), puedes deshabilitarlo via SSH:

```bash
# SSH al servidor
ssh tu-usuario@tu-servidor

# Navegar al proyecto
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code

# Detener todo
docker compose -p staffhub_staffhubbdv5 down

# Eliminar analytics
docker rm -f staffhub_staffhubbdv5-analytics-1

# Editar el override para deshabilitar analytics
cat > docker-compose.override.yml << 'EOF'
version: "3.8"

services:
  analytics:
    entrypoint: ["/bin/sh", "-c", "exit 0"]
    restart: "no"
    ports: []
    
  kong:
    depends_on:
      db:
        condition: service_healthy
EOF

# Reiniciar sin analytics
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d
```

## Configuración en Easypanel UI

Alternativamente, puedes configurar esto desde la interfaz de Easypanel:

1. Ve a tu proyecto **staffhub/staffhubbdv5**
2. Click en **Settings** → **Advanced** → **Environment Variables**
3. Agrega: `DISABLE_ANALYTICS=true`
4. En **Docker Compose Override**, verifica que esté el cambio de puerto
5. Click **Save** y **Rebuild**

## Archivos Actualizados

- ✅ `docker-compose.override.yml` - Analytics en puerto 4001
- ✅ `SOLUCION_PUERTO_4000_EASYPANEL.md` - Esta guía actualizada

## Estado Actual

El override ahora cambia el puerto de analytics de 4000 a 4001. Esto debería resolver el conflicto en el próximo deployment de Easypanel.

Si el error persiste, significa que hay otro servicio usando el puerto 4000 que necesita ser identificado y movido o detenido.

