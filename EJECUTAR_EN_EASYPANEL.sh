#!/bin/bash

# Script para ejecutar DIRECTAMENTE en el servidor Easypanel
# Este script fuerza la eliminación de analytics y libera el puerto 4000

echo "🔧 SOLUCIÓN FORZADA: Eliminando analytics y liberando puerto 4000"
echo "=================================================================="
echo ""

# Navegar al directorio del proyecto
PROJECT_DIR="/etc/easypanel/projects/staffhub/staffhubbdv5/code"
cd "$PROJECT_DIR" || exit 1

echo "📍 Directorio: $(pwd)"
echo ""

# Paso 1: Detener TODOS los contenedores
echo "🛑 Paso 1: Deteniendo todos los contenedores..."
docker compose -p staffhub_staffhubbdv5 down --remove-orphans
echo "✅ Contenedores detenidos"
echo ""

# Paso 2: Eliminar contenedor analytics si existe
echo "🗑️  Paso 2: Eliminando contenedor analytics..."
docker rm -f staffhub_staffhubbdv5-analytics-1 2>/dev/null || echo "   (ya estaba eliminado)"
echo ""

# Paso 3: Verificar qué está usando el puerto 4000
echo "🔍 Paso 3: Verificando puerto 4000..."
PORT_INFO=$(netstat -tulpn 2>/dev/null | grep :4000 || lsof -i :4000 2>/dev/null || echo "Puerto 4000 está libre")
echo "$PORT_INFO"
echo ""

# Paso 4: Si hay algo en el puerto 4000, intentar liberarlo
if echo "$PORT_INFO" | grep -q "LISTEN"; then
    echo "⚠️  Puerto 4000 está ocupado. Intentando liberar..."
    PID=$(echo "$PORT_INFO" | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "$PID" ]; then
        echo "   Matando proceso PID: $PID"
        kill -9 "$PID" 2>/dev/null || echo "   No se pudo matar el proceso (puede requerir sudo)"
    fi
    echo ""
fi

# Paso 5: Crear override que REALMENTE deshabilita analytics
echo "📝 Paso 5: Creando override definitivo..."
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

echo "✅ Override creado"
echo ""

# Paso 6: Iniciar servicios SIN analytics
echo "🚀 Paso 6: Iniciando servicios (sin analytics)..."
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans
echo ""

# Paso 7: Esperar a que los servicios inicien
echo "⏳ Esperando 15 segundos para que los servicios inicien..."
sleep 15
echo ""

# Paso 8: Verificar estado
echo "📊 Paso 8: Verificando estado de contenedores..."
echo ""
docker ps --filter "name=staffhub_staffhubbdv5" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20
echo ""

# Paso 9: Verificar que analytics NO esté corriendo
echo "🔍 Paso 9: Verificando que analytics NO esté usando puerto 4000..."
ANALYTICS_CHECK=$(docker ps --filter "name=analytics" --format "{{.Names}}\t{{.Ports}}" | grep staffhub || echo "✅ Analytics no está exponiendo puertos (correcto)")
echo "$ANALYTICS_CHECK"
echo ""

# Paso 10: Verificar puerto 4000
echo "🔍 Paso 10: Verificación final del puerto 4000..."
PORT_FINAL=$(netstat -tulpn 2>/dev/null | grep :4000 || echo "✅ Puerto 4000 está libre")
echo "$PORT_FINAL"
echo ""

echo "=================================================================="
echo "✅ PROCESO COMPLETADO"
echo "=================================================================="
echo ""
echo "Si ves errores arriba, ejecuta:"
echo "  docker logs staffhub_staffhubbdv5-kong-1"
echo ""
echo "Para ver todos los logs:"
echo "  docker compose -p staffhub_staffhubbdv5 logs -f"
echo ""
echo "Para verificar que todo funciona:"
echo "  curl http://localhost:8000/health"
