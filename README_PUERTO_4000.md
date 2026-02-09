# 🚨 SOLUCIÓN: Conflicto Puerto 4000 en Easypanel

## TL;DR (Resumen Ultra Rápido)

**Problema:** Analytics intenta usar puerto 4000 que está ocupado  
**Solución:** Ejecuta esto en tu servidor:

```bash
ssh tu-usuario@tu-servidor
cd /tmp
curl -O https://raw.githubusercontent.com/brifyai/BrifyRRHHv3/main/fix_port_4000_DEFINITIVO.sh
chmod +x fix_port_4000_DEFINITIVO.sh
sudo bash fix_port_4000_DEFINITIVO.sh
```

**Tiempo:** 5 minutos  
**Resultado:** Puerto 4000 libre, analytics deshabilitado, Supabase funcionando

---

## 📚 Documentación Completa

### 1. **GUIA_PASO_A_PASO_PUERTO_4000.md** ⭐ EMPIEZA AQUÍ
   - Guía visual paso a paso
   - 3 opciones: Automática, Manual, UI
   - Checklist de verificación
   - Diagnóstico avanzado

### 2. **SOLUCION_DEFINITIVA_PUERTO_4000.md**
   - Análisis técnico profundo
   - 4 enfoques diferentes
   - Explicación del problema raíz
   - Soluciones alternativas

### 3. **fix_port_4000_DEFINITIVO.sh**
   - Script automático completo
   - 13 pasos automatizados
   - Verificaciones exhaustivas
   - Output con colores

### 4. **ACCION_INMEDIATA_PUERTO_4000.md**
   - Guía rápida de 2 minutos
   - Comandos directos
   - Sin explicaciones técnicas

---

## 🎯 ¿Qué Archivo Usar?

| Situación | Archivo Recomendado |
|-----------|-------------------|
| Primera vez con el problema | `GUIA_PASO_A_PASO_PUERTO_4000.md` |
| Quiero entender el problema | `SOLUCION_DEFINITIVA_PUERTO_4000.md` |
| Solo dame la solución rápida | `ACCION_INMEDIATA_PUERTO_4000.md` |
| Quiero ejecutar un script | `fix_port_4000_DEFINITIVO.sh` |

---

## ⚡ Solución Rápida (3 Comandos)

```bash
# 1. SSH al servidor
ssh tu-usuario@tu-servidor

# 2. Ir al proyecto
cd /etc/easypanel/projects/staffhub/staffhubbdv5/code

# 3. Ejecutar
docker compose -p staffhub_staffhubbdv5 down && \
docker rm -f staffhub_staffhubbdv5-analytics-1 && \
sudo kill -9 $(sudo lsof -t -i:4000) 2>/dev/null ; \
docker compose -f docker-compose.yml -f docker-compose.override.yml -p staffhub_staffhubbdv5 up -d --remove-orphans
```

---

## 🔍 Diagnóstico Rápido

```bash
# ¿Qué usa el puerto 4000?
sudo lsof -i :4000

# ¿Qué contenedores están corriendo?
docker ps | grep staffhub

# ¿Hay errores en los logs?
docker logs staffhub_staffhubbdv5-kong-1 | tail -20
```

---

## ✅ Verificación Post-Solución

Después de aplicar la solución, verifica:

```bash
# Puerto 4000 libre (sin output = correcto)
sudo lsof -i :4000

# Contenedores corriendo (todos excepto analytics)
docker ps | grep staffhub

# API funcionando (debería responder)
curl http://localhost:8000/health
```

---

## ❓ FAQ

### ¿Por qué falla el override?

Easypanel genera su propio `docker-compose.yml` que define analytics con puerto 4000. Cuando hace merge, el puerto del archivo base tiene prioridad sobre el override.

### ¿Necesito analytics?

No. Analytics es solo para métricas y monitoreo. Todos los servicios críticos (auth, rest, realtime, storage) funcionan perfectamente sin él.

### ¿Afecta esto a mi app en PORT=4004?

No. El PORT=4004 es para tu servidor Node.js y es completamente independiente del puerto 4000 de analytics de Supabase.

### ¿Qué pasa si el script falla?

Lee `GUIA_PASO_A_PASO_PUERTO_4000.md` para soluciones manuales y diagnóstico avanzado.

### ¿Puedo cambiar el puerto en lugar de deshabilitar analytics?

Sí, pero Easypanel seguirá regenerando el docker-compose.yml con puerto 4000. La solución más estable es deshabilitar analytics.

---

## 🆘 Soporte

Si después de seguir todas las guías el problema persiste:

1. **Recopila diagnóstico:**
   ```bash
   sudo lsof -i :4000 > diagnostico.txt
   docker ps -a >> diagnostico.txt
   docker logs staffhub_staffhubbdv5-kong-1 >> diagnostico.txt
   ```

2. **Contacta:**
   - Soporte Easypanel: support@easypanel.io
   - Discord Easypanel: https://discord.gg/easypanel

3. **Considera alternativas:**
   - Supabase Cloud (sin problemas de puertos)
   - Servidor dedicado con Docker Compose

---

## 📦 Archivos en Este Repositorio

```
├── README_PUERTO_4000.md                    ← Estás aquí
├── GUIA_PASO_A_PASO_PUERTO_4000.md        ← Guía visual completa
├── SOLUCION_DEFINITIVA_PUERTO_4000.md     ← Análisis técnico
├── ACCION_INMEDIATA_PUERTO_4000.md        ← Solución rápida
├── fix_port_4000_DEFINITIVO.sh            ← Script automático
├── docker-compose.override.yml             ← Override actualizado
└── SOLUCION_PUERTO_4000_EASYPANEL.md      ← Versión anterior
```

---

## 🚀 Siguiente Paso

**Ejecuta el script automático:**

```bash
ssh tu-usuario@tu-servidor
cd /tmp
curl -O https://raw.githubusercontent.com/brifyai/BrifyRRHHv3/main/fix_port_4000_DEFINITIVO.sh
chmod +x fix_port_4000_DEFINITIVO.sh
sudo bash fix_port_4000_DEFINITIVO.sh
```

O lee `GUIA_PASO_A_PASO_PUERTO_4000.md` para opciones manuales.

---

**Última actualización:** 2026-02-09  
**Estado:** Solución definitiva probada
