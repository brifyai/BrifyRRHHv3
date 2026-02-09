# 🎯 GUÍA PASO A PASO: Resolver Puerto 4000

## 📋 Resumen Ejecutivo

**Problema:** Analytics de Supabase intenta usar puerto 4000 que ya está ocupado  
**Causa:** Easypanel ignora el override porque genera su propio docker-compose.yml  
**Solución:** Ejecutar script en el servidor que libera el puerto y deshabilita analytics  
**Tiempo:** 5-10 minutos  
**Requiere:** Acceso SSH al servidor

---

## 🚀 OPCIÓN 1: Script Automático (RECOMENDADO)

### Paso 1: Conectar al Servidor

```bash
ssh tu-usuario@tu-servidor-easypanel
```

### Paso 2: Descargar el Script

```bash
cd /tmp
wget https://raw.githubusercontent.com/brifyai/BrifyRRHHv3/main/fix_port_4000_DEFINITIVO.sh
# O si no tienes wget:
curl -O https://raw.githubusercontent.com/brifyai/BrifyRRHHv3/main/fix_port_4000_DEFINITIVO.sh
```

### Paso 3: Ejecutar

```bash
chmod +x fix_port_4000_DEFINITIVO.sh
sudo bash fix_port_4000_DEFINITIVO.sh
```

### Paso 4: Verificar

El script mostrará el estado al final. Deberías ver:
- ✅ Puerto 4000 está LIBRE
- ✅ Analytics no está exponiendo puertos
- ✅ Kong y otros servicios corriendo

---

## 🔧 OPCIÓN 2: Manual (Si el Script Falla)

### Paso 1: Identificar Qué Usa el Puerto 4000

```bash
# Conectar al servidor
ssh tu-usuario@tu-servidor

# Ver qué usa el puerto
sudo lsof -i :4000
```

**Posibles resultados:**

#### A) Es un contenedor Docker
```
COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
docker-pr  1234 root    4u  IPv6  12345      0t0  TCP *:4000 (LISTEN)
```

**Solución:**
```bash
# Ver qué contenedor es
docker ps | grep 4000

# Detenerlo
docker stop <CONTAINER_ID>
docker rm <CONTAINER_ID>
```

#### B) Es un proceso del sistema
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node     5678 user    3u  IPv4  67890      0t0  TCP *:4000 (LISTEN)
```

**Solución:**
```bash
# Matar el proceso
sudo kill -9 5678
```

#### C) Puerto libre
```
(no output)
```

**Continúa al siguiente paso**

### Paso 2: Ir al Proyecto

```bash
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code
```

### Paso 3: Detener Contenedores

```bash
docker compose -p staffhub_staffhubbdv5 down --remove-orphans
```

### Paso 4: Crear Override Definitivo

```bash
cat > docker-compose.override.yml << 'EOF'
version: "3.8"

services:
  analytics:
    image: busybox:latest
    command: ["sh", "-c", "echo 'Analytics disabled' && tail -f /dev/null"]
    ports: []
    restart: "no"
    networks:
      - default
    healthcheck:
      disable: true
  
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
```

### Paso 5: Iniciar Servicios

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans
```

### Paso 6: Verificar

```bash
# Ver contenedores
docker ps | grep staffhub

# Verificar puerto 4000
sudo lsof -i :4000
# (no debería mostrar nada)

# Ver logs de Kong
docker logs staffhub_staffhubbdv5-kong-1 | tail -20
```

---

## 🎯 OPCIÓN 3: Desde Easypanel UI

Si tienes acceso a la interfaz de Easypanel:

### Paso 1: Acceder al Proyecto

1. Abre Easypanel en tu navegador
2. Ve a **Projects** → **staffhub** → **staffhubbdv5**

### Paso 2: Editar Configuración

1. Click en **Settings**
2. Busca **Docker Compose** o **Services**
3. Si hay opción para deshabilitar servicios:
   - Desmarca **Analytics**
   - Guarda

### Paso 3: Variables de Entorno

1. Ve a **Environment Variables**
2. Agrega:
   ```
   DISABLE_ANALYTICS=true
   ANALYTICS_ENABLED=false
   ```
3. Guarda

### Paso 4: Rebuild

1. Click en **Rebuild** o **Redeploy**
2. Espera a que termine

---

## 🔍 Diagnóstico Avanzado

Si ninguna solución funciona, el problema puede ser más profundo:

### Verificar Todos los Puertos en Uso

```bash
# Ver todos los puertos ocupados
sudo netstat -tulpn | grep LISTEN

# Ver específicamente rango 4000-4010
sudo netstat -tulpn | grep -E ':(400[0-9]|401[0-9])'

# Ver todos los contenedores con sus puertos
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Verificar Otros Proyectos de Easypanel

```bash
# Listar todos los proyectos
ls -la /etc/easypanel/projects/

# Ver contenedores de otros proyectos
docker ps -a | grep -v staffhub
```

### Verificar Configuración de Easypanel

```bash
# Ver configuración global
cat /etc/easypanel/config.yml

# Ver configuración del proyecto
cat /etc/easypanel/projects/staffhub/staffhubbdv5/config.yml
```

---

## ✅ Checklist de Verificación Final

Después de aplicar cualquier solución, verifica:

- [ ] Puerto 4000 está libre: `sudo lsof -i :4000` (sin output)
- [ ] Contenedores corriendo: `docker ps | grep staffhub` (todos excepto analytics)
- [ ] Kong funcionando: `docker logs staffhub_staffhubbdv5-kong-1` (sin errores)
- [ ] API responde: `curl http://localhost:8000/health`
- [ ] Analytics sin puerto: `docker ps | grep analytics` (sin :4000)
- [ ] Override existe: `cat docker-compose.override.yml`
- [ ] No hay errores en logs: `docker compose -p staffhub_staffhubbdv5 logs --tail 50`

---

## 🆘 Si Nada Funciona

### Plan B: Cambiar TODOS los Puertos

Si el puerto 4000 está permanentemente ocupado, cambia los puertos de Supabase:

```yaml
# docker-compose.override.yml
version: "3.8"

services:
  analytics:
    ports:
      - "14000:4000"  # Puerto 14000 en lugar de 4000
  
  kong:
    ports:
      - "18000:8000"  # Puerto 18000 en lugar de 8000
  
  studio:
    ports:
      - "13000:3000"  # Puerto 13000 en lugar de 3000
```

### Plan C: Migrar a Supabase Cloud

Si los problemas persisten, considera usar Supabase Cloud:
- Sin problemas de puertos
- Sin mantenimiento de Docker
- Más estable y rápido
- Plan gratuito disponible

Visita: https://supabase.com/dashboard

---

## 📞 Soporte

Si después de seguir esta guía el problema persiste:

1. **Recopila información:**
   ```bash
   # Guardar diagnóstico
   sudo lsof -i :4000 > diagnostico.txt
   docker ps -a >> diagnostico.txt
   docker compose -p staffhub_staffhubbdv5 logs >> diagnostico.txt
   ```

2. **Contacta soporte de Easypanel:**
   - Email: support@easypanel.io
   - Discord: https://discord.gg/easypanel
   - Incluye el archivo `diagnostico.txt`

3. **O considera alternativas:**
   - Supabase Cloud
   - Docker Compose en servidor dedicado
   - Kubernetes

---

## 📚 Archivos Relacionados

- `fix_port_4000_DEFINITIVO.sh` - Script automático completo
- `SOLUCION_DEFINITIVA_PUERTO_4000.md` - Documentación técnica detallada
- `docker-compose.override.yml` - Override actual
- `ACCION_INMEDIATA_PUERTO_4000.md` - Guía rápida

---

**Última actualización:** 2026-02-09  
**Versión:** 3.0 (Definitiva)
