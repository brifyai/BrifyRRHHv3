# 🚨 ACCIÓN INMEDIATA: Resolver Puerto 4000

## El Problema
Easypanel sigue fallando porque el override NO está siendo aplicado correctamente. Analytics intenta usar el puerto 4000 que está ocupado.

## ✅ La Solución (2 opciones)

### OPCIÓN 1: Script Automático (RECOMENDADO)

```bash
# 1. SSH al servidor
ssh tu-usuario@tu-servidor

# 2. Ejecutar el script
cd /tmp
curl -O https://raw.githubusercontent.com/brifyai/BrifyRRHHv3/main/EJECUTAR_EN_EASYPANEL.sh
chmod +x EJECUTAR_EN_EASYPANEL.sh
sudo bash EJECUTAR_EN_EASYPANEL.sh
```

### OPCIÓN 2: Manual (5 comandos)

```bash
# 1. SSH al servidor
ssh tu-usuario@tu-servidor

# 2. Ir al proyecto
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code

# 3. Detener todo
docker compose -p staffhub_staffhubbdv5 down --remove-orphans

# 4. Ver qué usa el puerto 4000 y matarlo
sudo lsof -i :4000
sudo kill -9 <PID>

# 5. Reiniciar sin analytics
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans
```

## ¿Por Qué Falla el Override?

Easypanel genera su propio `docker-compose.yml` que define analytics con puerto 4000. Cuando hace el merge con el override, el puerto original tiene prioridad. Por eso necesitas ejecutar los comandos directamente en el servidor.

## Después de Ejecutar

Verifica que todo funcione:

```bash
# Ver contenedores (analytics NO debe estar exponiendo puertos)
docker ps | grep staffhub

# Ver logs de Kong
docker logs staffhub_staffhubbdv5-kong-1

# Verificar puerto 4000
sudo netstat -tulpn | grep :4000
```

## ⚠️ Nota sobre PORT=4004

El `PORT=4004` de tu app Node.js está bien, NO lo cambies. Ese es diferente al puerto 4000 de analytics de Supabase.

## Archivos Actualizados en GitHub

- ✅ `docker-compose.override.yml` - Analytics deshabilitado sin puertos
- ✅ `EJECUTAR_EN_EASYPANEL.sh` - Script automático de solución
- ✅ `SOLUCION_PUERTO_4000_EASYPANEL.md` - Documentación completa

## Siguiente Paso

Ejecuta una de las dos opciones arriba. El problema se resolverá inmediatamente.
