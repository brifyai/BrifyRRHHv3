#!/bin/bash

# Script para solucionar conflicto de puerto 4000 en Easypanel
# Ejecutar en el servidor: bash fix_port_4000.sh

echo "🔧 Solucionando conflicto de puerto 4000..."
echo ""

# Navegar al directorio del proyecto
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code || exit 1

echo "📍 Directorio actual: $(pwd)"
echo ""

# Detener todos los contenedores
echo "🛑 Deteniendo contenedores..."
docker compose -p staffhub_staffhubbdv5 down

# Eliminar contenedor analytics si existe
echo "🗑️  Eliminando contenedor analytics..."
docker rm -f staffhub_staffhubbdv5-analytics-1 2>/dev/null || echo "   (analytics ya estaba eliminado)"

# Verificar qué está usando el puerto 4000
echo ""
echo "🔍 Verificando puerto 4000..."
PORT_CHECK=$(netstat -tulpn 2>/dev/null | grep :4000 || lsof -i :4000 2>/dev/null || echo "Puerto libre")
echo "$PORT_CHECK"
echo ""

# Crear/actualizar override
echo "📝 Actualizando docker-compose.override.yml..."
cat > docker-compose.override.yml << 'EOF'
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
  
  kong:
    depends_on:
      db:
        condition: service_healthy
EOF

echo "✅ Override actualizado"
echo ""

# Reiniciar servicios
echo "🚀 Reiniciando servicios..."
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d

echo ""
echo "⏳ Esperando 10 segundos para que los servicios inicien..."
sleep 10

# Verificar estado
echo ""
echo "📊 Estado de contenedores:"
docker ps --filter "name=staffhub_staffhubbdv5" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Verificando que analytics NO esté corriendo..."
ANALYTICS_CHECK=$(docker ps | grep analytics || echo "✅ Analytics no está corriendo (correcto)")
echo "$ANALYTICS_CHECK"

echo ""
echo "✅ Proceso completado!"
echo ""
echo "Para verificar logs de Kong:"
echo "  docker logs staffhub_staffhubbdv5-kong-1"
echo ""
echo "Para verificar todos los logs:"
echo "  docker compose -p staffhub_staffhubbdv5 logs -f"
