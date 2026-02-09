# 🎯 SOLUCIÓN DEFINITIVA: Puerto 4000 en Easypanel

## 🔍 Diagnóstico del Problema Real

### Por Qué Falla el Override

Easypanel genera automáticamente un `docker-compose.yml` base que incluye:

```yaml
services:
  analytics:
    image: supabase/logflare:1.4.0
    ports:
      - "4000:4000"  # <-- ESTE ES EL PROBLEMA
```

Cuando Docker Compose hace merge con el override:
- Los puertos del archivo BASE tienen prioridad
- El override solo puede AGREGAR, no ELIMINAR puertos ya definidos
- Por eso `ports: []` en el override NO funciona

### El Puerto 4000 Está Ocupado

Algo en tu servidor ya está usando el puerto 4000. Puede ser:
1. Otro contenedor Docker
2. Otro proyecto de Easypanel
3. Un servicio del sistema
4. Un proceso zombie

## 🎯 SOLUCIÓN 1: Configurar Easypanel para NO Generar Analytics (MEJOR)

### Paso 1: Acceder a Easypanel UI

1. Ve a tu proyecto: **staffhub → staffhubbdv5**
2. Click en **Settings**
3. Busca la sección **Services** o **Docker Compose**

### Paso 2: Deshabilitar Analytics en la Configuración

En Easypanel, busca si hay una opción para deshabilitar servicios específicos. Si existe:

- Desmarca o deshabilita **Analytics**
- Guarda y redeploy

### Paso 3: Si No Hay Opción UI, Editar Variables de Entorno

En **Settings → Environment Variables**, agrega:

```
DISABLE_ANALYTICS=true
ANALYTICS_ENABLED=false
```

Luego **Save** y **Rebuild**.

## 🎯 SOLUCIÓN 2: Liberar el Puerto 4000 (SSH Requerido)

Si no puedes deshabilitar analytics desde Easypanel, necesitas liberar el puerto 4000.

### Script Completo para Ejecutar en el Servidor

```bash
#!/bin/bash

echo "🔧 SOLUCIÓN DEFINITIVA: Liberando puerto 4000"
echo "=============================================="

# 1. Identificar qué está usando el puerto 4000
echo ""
echo "🔍 Paso 1: Identificando proceso en puerto 4000..."
PORT_INFO=$(sudo lsof -i :4000 2>/dev/null || sudo netstat -tulpn | grep :4000)

if [ -z "$PORT_INFO" ]; then
    echo "✅ Puerto 4000 está libre"
else
    echo "⚠️  Puerto 4000 está ocupado:"
    echo "$PORT_INFO"
    echo ""
    
    # Extraer PID
    PID=$(echo "$PORT_INFO" | awk '{print $2}' | head -1)
    
    if [ ! -z "$PID" ]; then
        echo "🔪 Matando proceso PID: $PID"
        sudo kill -9 $PID
        sleep 2
        
        # Verificar que se liberó
        if sudo lsof -i :4000 2>/dev/null; then
            echo "❌ No se pudo liberar el puerto"
            exit 1
        else
            echo "✅ Puerto 4000 liberado"
        fi
    fi
fi

# 2. Verificar si es un contenedor Docker
echo ""
echo "🔍 Paso 2: Verificando contenedores Docker en puerto 4000..."
DOCKER_CONTAINERS=$(docker ps --format "{{.ID}}\t{{.Names}}\t{{.Ports}}" | grep ":4000")

if [ ! -z "$DOCKER_CONTAINERS" ]; then
    echo "⚠️  Contenedores usando puerto 4000:"
    echo "$DOCKER_CONTAINERS"
    echo ""
    
    # Detener contenedores que usan el puerto 4000
    CONTAINER_IDS=$(echo "$DOCKER_CONTAINERS" | awk '{print $1}')
    for CID in $CONTAINER_IDS; do
        echo "🛑 Deteniendo contenedor: $CID"
        docker stop $CID
        docker rm $CID
    done
fi

# 3. Navegar al proyecto Easypanel
echo ""
echo "📍 Paso 3: Navegando al proyecto..."
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code || exit 1
echo "Directorio: $(pwd)"

# 4. Detener todos los contenedores del proyecto
echo ""
echo "🛑 Paso 4: Deteniendo contenedores del proyecto..."
docker compose -p staffhub_staffhubbdv5 down --remove-orphans

# 5. Eliminar contenedor analytics específicamente
echo ""
echo "🗑️  Paso 5: Eliminando contenedor analytics..."
docker rm -f staffhub_staffhubbdv5-analytics-1 2>/dev/null || echo "   (ya estaba eliminado)"

# 6. Verificar que el puerto esté libre
echo ""
echo "🔍 Paso 6: Verificación final del puerto 4000..."
if sudo lsof -i :4000 2>/dev/null; then
    echo "❌ ERROR: Puerto 4000 todavía está ocupado"
    echo "Ejecuta: sudo lsof -i :4000"
    exit 1
else
    echo "✅ Puerto 4000 está libre"
fi

# 7. Crear override que NO expone el puerto
echo ""
echo "📝 Paso 7: Creando override sin puerto..."
cat > docker-compose.override.yml << 'EOF'
version: "3.8"

services:
  analytics:
    # No exponer NINGÚN puerto
    ports: []
    # Comando que no hace nada
    command: ["tail", "-f", "/dev/null"]
    restart: "no"
    # Asegurar que no se conecte a la red externa
    networks:
      - default
  
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

networks:
  default:
    driver: bridge
EOF

echo "✅ Override creado"

# 8. Iniciar servicios
echo ""
echo "🚀 Paso 8: Iniciando servicios..."
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans

# 9. Esperar
echo ""
echo "⏳ Esperando 20 segundos para que los servicios inicien..."
sleep 20

# 10. Verificar estado
echo ""
echo "📊 Paso 9: Estado de contenedores..."
docker ps --filter "name=staffhub_staffhubbdv5" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 11. Verificar analytics
echo ""
echo "🔍 Paso 10: Verificando analytics..."
ANALYTICS_STATUS=$(docker ps --filter "name=analytics" --format "{{.Names}}\t{{.Ports}}" | grep staffhub || echo "Analytics no está exponiendo puertos")
echo "$ANALYTICS_STATUS"

# 12. Verificar puerto 4000
echo ""
echo "🔍 Paso 11: Verificación final..."
if sudo lsof -i :4000 2>/dev/null; then
    echo "⚠️  Algo todavía usa el puerto 4000"
    sudo lsof -i :4000
else
    echo "✅ Puerto 4000 está libre"
fi

# 13. Verificar logs de Kong
echo ""
echo "📋 Paso 12: Logs de Kong (últimas 20 líneas)..."
docker logs --tail 20 staffhub_staffhubbdv5-kong-1

echo ""
echo "=============================================="
echo "✅ PROCESO COMPLETADO"
echo "=============================================="
echo ""
echo "Si hay errores, revisa:"
echo "  docker logs staffhub_staffhubbdv5-kong-1"
echo "  docker logs staffhub_staffhubbdv5-auth-1"
echo ""
echo "Para ver todos los logs:"
echo "  docker compose -p staffhub_staffhubbdv5 logs -f"
EOF

chmod +x script.sh
```

### Ejecutar el Script

```bash
# SSH al servidor
ssh tu-usuario@tu-servidor

# Copiar el script
nano fix_port_4000_definitivo.sh
# (pegar el script de arriba)

# Ejecutar
chmod +x fix_port_4000_definitivo.sh
sudo bash fix_port_4000_definitivo.sh
```

## 🎯 SOLUCIÓN 3: Cambiar el Puerto en el docker-compose.yml Base de Easypanel

Esta es la solución más técnica pero más efectiva.

### Paso 1: Encontrar el docker-compose.yml Base

```bash
ssh tu-usuario@tu-servidor
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code
ls -la
```

Busca archivos como:
- `docker-compose.yml`
- `docker-compose.generated.yml`
- `.easypanel/docker-compose.yml`

### Paso 2: Editar el Archivo Base

```bash
# Hacer backup
sudo cp docker-compose.yml docker-compose.yml.backup

# Editar
sudo nano docker-compose.yml
```

Busca la sección de analytics:

```yaml
analytics:
  image: supabase/logflare:1.4.0
  ports:
    - "4000:4000"  # <-- CAMBIAR ESTA LÍNEA
```

Cámbiala a:

```yaml
analytics:
  image: supabase/logflare:1.4.0
  ports:
    - "4001:4000"  # <-- Puerto externo 4001
```

O elimina completamente el servicio analytics.

### Paso 3: Reiniciar

```bash
docker compose -p staffhub_staffhubbdv5 down
docker compose -p staffhub_staffhubbdv5 up -d
```

## 🎯 SOLUCIÓN 4: Usar Easypanel CLI (Si Está Disponible)

```bash
# Listar servicios
easypanel service list staffhub/staffhubbdv5

# Deshabilitar analytics
easypanel service disable staffhub/staffhubbdv5/analytics

# O cambiar puerto
easypanel service update staffhub/staffhubbdv5/analytics --port 4001:4000
```

## 🔍 Diagnóstico: Qué Está Usando el Puerto 4000

Antes de aplicar cualquier solución, identifica el culpable:

```bash
# Opción 1: lsof
sudo lsof -i :4000

# Opción 2: netstat
sudo netstat -tulpn | grep :4000

# Opción 3: ss
sudo ss -tulpn | grep :4000

# Opción 4: fuser
sudo fuser 4000/tcp

# Ver todos los contenedores con sus puertos
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 4000
```

## 📋 Checklist de Verificación

Después de aplicar cualquier solución:

```bash
# ✅ Puerto 4000 está libre
sudo lsof -i :4000
# (no debería mostrar nada)

# ✅ Contenedores corriendo
docker ps | grep staffhub
# (todos excepto analytics deberían estar running)

# ✅ Kong está funcionando
docker logs staffhub_staffhubbdv5-kong-1 | tail -20
# (no debería haber errores)

# ✅ API responde
curl http://localhost:8000/health
# (debería responder)

# ✅ Analytics NO está exponiendo puerto 4000
docker ps | grep analytics
# (no debería mostrar :4000)
```

## 🎯 Recomendación Final

**Orden de prioridad:**

1. **PRIMERO**: Intenta SOLUCIÓN 1 (deshabilitar analytics desde Easypanel UI)
2. **SI FALLA**: Ejecuta SOLUCIÓN 2 (script completo para liberar puerto)
3. **SI PERSISTE**: Aplica SOLUCIÓN 3 (editar docker-compose.yml base)
4. **ÚLTIMO RECURSO**: Contacta soporte de Easypanel

## 📞 Si Nada Funciona

El problema puede ser que Easypanel regenera el docker-compose.yml en cada deploy. En ese caso:

1. **Contacta soporte de Easypanel** y pregunta cómo deshabilitar servicios específicos
2. **Considera migrar a Supabase Cloud** (sin estos problemas de puertos)
3. **Usa un servidor dedicado** donde tengas control total del docker-compose

## 🔗 Archivos Relacionados

- `docker-compose.override.yml` - Override actual
- `EJECUTAR_EN_EASYPANEL.sh` - Script anterior
- `fix_port_4000.sh` - Script básico
- Este documento - Solución completa

---

**Nota**: El `PORT=4004` de tu app Node.js NO tiene nada que ver con este problema. Ese puerto está bien y no lo cambies.
