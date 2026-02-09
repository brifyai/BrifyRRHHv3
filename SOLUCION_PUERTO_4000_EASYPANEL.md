# Solución DEFINITIVA: Conflicto Puerto 4000 en Easypanel

## ⚠️ Problema Persistente
```
Error: Bind for 0.0.0.0:4000 failed: port is already allocated
```

El override no está siendo aplicado correctamente por Easypanel. El contenedor analytics sigue intentando usar el puerto 4000.

## 🎯 Solución DEFINITIVA

Necesitas ejecutar un script directamente en el servidor Easypanel para forzar la solución.

### Paso 1: Acceder al Servidor

```bash
ssh tu-usuario@tu-servidor-easypanel
```

### Paso 2: Ejecutar el Script de Solución

```bash
# Descargar el script desde el repositorio
cd /tmp
curl -O https://raw.githubusercontent.com/brifyai/BrifyRRHHv3/main/EJECUTAR_EN_EASYPANEL.sh

# Hacer ejecutable
chmod +x EJECUTAR_EN_EASYPANEL.sh

# Ejecutar
sudo bash EJECUTAR_EN_EASYPANEL.sh
```

### O Ejecutar Manualmente (Paso a Paso)

Si prefieres hacerlo manual:

```bash
# 1. Navegar al proyecto
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code

# 2. Detener todo
docker compose -p staffhub_staffhubbdv5 down --remove-orphans

# 3. Eliminar analytics
docker rm -f staffhub_staffhubbdv5-analytics-1

# 4. Ver qué usa el puerto 4000
sudo netstat -tulpn | grep :4000
# o
sudo lsof -i :4000

# 5. Si hay algo, matar el proceso
sudo kill -9 <PID_DEL_PROCESO>

# 6. Crear override que deshabilita analytics
cat > docker-compose.override.yml << 'EOF'
version: "3.8"

services:
  analytics:
    command: ["sh", "-c", "echo 'Analytics disabled' && sleep infinity"]
    ports: []
    restart: "no"
  
  kong:
    depends_on:
      db:
        condition: service_healthy
      auth:
        condition: service_started
      rest:
        condition: service_started
      realtime:
        condition: service_started
      storage:
        condition: service_started
EOF

# 7. Iniciar servicios
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans

# 8. Verificar
docker ps | grep staffhub
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

