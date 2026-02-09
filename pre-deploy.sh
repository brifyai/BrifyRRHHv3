#!/bin/bash

# Script que Easypanel ejecuta ANTES del deploy
# Este script limpia el puerto 4000 automáticamente

echo "🔧 Pre-deploy: Limpiando puerto 4000..."

# Detener contenedor analytics si existe
docker stop staffhub_staffhubbdv5-analytics-1 2>/dev/null || true
docker rm staffhub_staffhubbdv5-analytics-1 2>/dev/null || true

# Intentar liberar el puerto 4000
PID=$(lsof -t -i:4000 2>/dev/null || netstat -tulpn 2>/dev/null | grep :4000 | awk '{print $7}' | cut -d'/' -f1 | head -1)

if [ ! -z "$PID" ]; then
    echo "⚠️  Puerto 4000 ocupado por PID: $PID"
    echo "🔪 Intentando liberar..."
    kill -9 $PID 2>/dev/null || true
    sleep 2
fi

# Verificar
if lsof -i :4000 2>/dev/null; then
    echo "⚠️  Puerto 4000 todavía ocupado, pero continuando..."
else
    echo "✅ Puerto 4000 libre"
fi

echo "✅ Pre-deploy completado"
exit 0
