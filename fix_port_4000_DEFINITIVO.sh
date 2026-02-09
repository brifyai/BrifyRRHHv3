#!/bin/bash

# Script DEFINITIVO para resolver el conflicto del puerto 4000
# Este script hace TODO lo necesario para liberar el puerto y deshabilitar analytics

set -e  # Salir si hay error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SOLUCIÓN DEFINITIVA: Puerto 4000 en Easypanel            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo "ℹ️  $1"; }

# ============================================
# PASO 1: Identificar qué usa el puerto 4000
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PASO 1: Identificando qué está usando el puerto 4000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PORT_INFO=$(sudo lsof -i :4000 2>/dev/null || sudo netstat -tulpn 2>/dev/null | grep :4000 || echo "")

if [ -z "$PORT_INFO" ]; then
    print_success "Puerto 4000 está libre"
else
    print_warning "Puerto 4000 está ocupado:"
    echo "$PORT_INFO"
    echo ""
    
    # Intentar extraer PID
    PID=$(echo "$PORT_INFO" | awk '{print $2}' | head -1)
    
    if [ ! -z "$PID" ] && [ "$PID" != "PID" ]; then
        print_info "Intentando matar proceso PID: $PID"
        sudo kill -9 $PID 2>/dev/null || print_warning "No se pudo matar el proceso"
        sleep 2
        
        # Verificar
        if sudo lsof -i :4000 2>/dev/null; then
            print_warning "El proceso sigue activo"
        else
            print_success "Proceso terminado"
        fi
    fi
fi

# ============================================
# PASO 2: Verificar contenedores Docker
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 PASO 2: Verificando contenedores Docker en puerto 4000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DOCKER_CONTAINERS=$(docker ps --format "{{.ID}}\t{{.Names}}\t{{.Ports}}" | grep ":4000" || echo "")

if [ -z "$DOCKER_CONTAINERS" ]; then
    print_success "No hay contenedores usando puerto 4000"
else
    print_warning "Contenedores usando puerto 4000:"
    echo "$DOCKER_CONTAINERS"
    echo ""
    
    # Detener contenedores
    CONTAINER_IDS=$(echo "$DOCKER_CONTAINERS" | awk '{print $1}')
    for CID in $CONTAINER_IDS; do
        CONTAINER_NAME=$(docker inspect --format='{{.Name}}' $CID | sed 's/\///')
        print_info "Deteniendo contenedor: $CONTAINER_NAME ($CID)"
        docker stop $CID 2>/dev/null || true
        docker rm $CID 2>/dev/null || true
    done
    
    print_success "Contenedores detenidos"
fi

# ============================================
# PASO 3: Navegar al proyecto
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 PASO 3: Navegando al proyecto Easypanel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_DIR="/etc/easypanel/projects/staffhub/staffhubbdv5/code"

if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Directorio no encontrado: $PROJECT_DIR"
    print_info "Buscando directorios alternativos..."
    find /etc/easypanel/projects -name "staffhub*" -type d 2>/dev/null || true
    exit 1
fi

cd "$PROJECT_DIR"
print_success "Directorio: $(pwd)"

# ============================================
# PASO 4: Detener todos los contenedores
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 PASO 4: Deteniendo todos los contenedores del proyecto"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker compose -p staffhub_staffhubbdv5 down --remove-orphans 2>/dev/null || \
    docker-compose -p staffhub_staffhubbdv5 down --remove-orphans 2>/dev/null || \
    print_warning "No se pudo ejecutar docker compose down"

print_success "Contenedores detenidos"

# ============================================
# PASO 5: Eliminar analytics específicamente
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  PASO 5: Eliminando contenedor analytics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker rm -f staffhub_staffhubbdv5-analytics-1 2>/dev/null && \
    print_success "Contenedor analytics eliminado" || \
    print_info "Contenedor analytics no existía"

# ============================================
# PASO 6: Verificar puerto libre
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PASO 6: Verificación del puerto 4000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if sudo lsof -i :4000 2>/dev/null; then
    print_error "Puerto 4000 TODAVÍA está ocupado"
    print_info "Ejecuta manualmente: sudo lsof -i :4000"
    print_info "Y luego: sudo kill -9 <PID>"
    exit 1
else
    print_success "Puerto 4000 está LIBRE"
fi

# ============================================
# PASO 7: Crear override definitivo
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 PASO 7: Creando docker-compose.override.yml definitivo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup del override anterior si existe
if [ -f "docker-compose.override.yml" ]; then
    cp docker-compose.override.yml "docker-compose.override.yml.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "Backup creado del override anterior"
fi

# Crear nuevo override
cat > docker-compose.override.yml << 'EOFOVERRIDE'
version: "3.8"

services:
  # Analytics completamente deshabilitado - NO exponer puerto 4000
  analytics:
    # Usar imagen mínima que no hace nada
    image: busybox:latest
    # Comando que mantiene el contenedor vivo pero sin hacer nada
    command: ["sh", "-c", "echo 'Analytics disabled to avoid port conflict' && tail -f /dev/null"]
    # NO exponer NINGÚN puerto
    ports: []
    # No reiniciar automáticamente
    restart: "no"
    # Usar solo red interna
    networks:
      - default
    # Sin healthcheck
    healthcheck:
      disable: true
  
  # Kong sin dependencia de analytics
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
      # NO incluir analytics

networks:
  default:
    driver: bridge
EOFOVERRIDE

print_success "Override creado"
print_info "Contenido del override:"
cat docker-compose.override.yml

# ============================================
# PASO 8: Iniciar servicios
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PASO 8: Iniciando servicios (sin analytics en puerto 4000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans 2>/dev/null || \
    docker-compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans

print_success "Servicios iniciados"

# ============================================
# PASO 9: Esperar inicialización
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ PASO 9: Esperando inicialización de servicios (30 seg)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in {1..30}; do
    echo -n "."
    sleep 1
done
echo ""
print_success "Espera completada"

# ============================================
# PASO 10: Verificar estado
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PASO 10: Estado de contenedores"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker ps --filter "name=staffhub_staffhubbdv5" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ============================================
# PASO 11: Verificar analytics
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PASO 11: Verificando analytics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ANALYTICS_INFO=$(docker ps --filter "name=analytics" --format "{{.Names}}\t{{.Ports}}" | grep staffhub || echo "")

if [ -z "$ANALYTICS_INFO" ]; then
    print_success "Analytics no está corriendo (correcto)"
elif echo "$ANALYTICS_INFO" | grep -q ":4000"; then
    print_error "Analytics TODAVÍA está exponiendo puerto 4000"
    echo "$ANALYTICS_INFO"
else
    print_success "Analytics está corriendo SIN exponer puerto 4000"
    echo "$ANALYTICS_INFO"
fi

# ============================================
# PASO 12: Verificar puerto 4000 final
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PASO 12: Verificación FINAL del puerto 4000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if sudo lsof -i :4000 2>/dev/null; then
    print_warning "Algo todavía está usando el puerto 4000:"
    sudo lsof -i :4000
else
    print_success "Puerto 4000 está LIBRE"
fi

# ============================================
# PASO 13: Verificar logs de Kong
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PASO 13: Logs de Kong (últimas 30 líneas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker logs --tail 30 staffhub_staffhubbdv5-kong-1 2>/dev/null || \
    print_warning "No se pudieron obtener logs de Kong"

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
print_success "El script ha terminado"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs de Kong:     docker logs -f staffhub_staffhubbdv5-kong-1"
echo "   Ver logs de Auth:     docker logs -f staffhub_staffhubbdv5-auth-1"
echo "   Ver todos los logs:   docker compose -p staffhub_staffhubbdv5 logs -f"
echo "   Ver contenedores:     docker ps | grep staffhub"
echo "   Verificar puerto:     sudo lsof -i :4000"
echo ""
echo "🌐 Endpoints:"
echo "   Kong API:             http://localhost:8000"
echo "   Studio:               http://localhost:3000"
echo ""
