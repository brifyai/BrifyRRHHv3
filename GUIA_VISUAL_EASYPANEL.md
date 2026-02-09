# 📸 GUÍA VISUAL: Encontrar y Eliminar Override en EasyPanel

## 🎯 OBJETIVO

Encontrar y eliminar el archivo `docker-compose.override.yml` que está causando el conflicto de puertos.

---

## 📋 PASO 1: Ejecutar Script de Diagnóstico

Primero, ejecuta el script que creé para identificar el problema:

```bash
node scripts/diagnostics/diagnose_easypanel_override.mjs
```

Este script te dirá:
- ✅ Si existe el archivo override
- ✅ Dónde está ubicado
- ✅ Qué puertos están en conflicto
- ✅ Qué contenedores están corriendo

---

## 📋 PASO 2: Buscar Override en EasyPanel

### Opción A: En la Interfaz Web

1. **Abre EasyPanel** en tu navegador
2. **Ve al proyecto** "staffhub"
3. **Selecciona el servicio** "supastaff" (Supabase)
4. **Busca estas pestañas/secciones:**

```
┌─────────────────────────────────────┐
│  General  │  Environment  │  Ports  │
│  Volumes  │  Advanced  │  Logs     │
└─────────────────────────────────────┘
```

5. **Haz click en cada pestaña** y busca:
   - "Override"
   - "Additional Configuration"
   - "Docker Compose Override"
   - "Advanced Settings"
   - "Custom Configuration"

### Opción B: En la Sección de Archivos

Algunos paneles de EasyPanel tienen un explorador de archivos:

1. **Busca un ícono de carpeta** 📁 o "Files"
2. **Navega a:** `/projects/staffhub/supastaff/code/`
3. **Busca el archivo:** `docker-compose.override.yml`
4. **Si lo encuentras:** Elimínalo o edítalo

### Opción C: En la Configuración de Puertos

1. **Ve a la pestaña "Ports"** o "Port Mappings"
2. **Busca configuraciones como:**
   ```
   Host Port → Container Port
   3005      → 4000 (analytics)
   4000      → 4000 (analytics)
   ```
3. **Elimina** cualquier mapeo que mencione analytics

---

## 📋 PASO 3: Eliminar Variable ANALYTICS_PORT

1. **Ve a la pestaña "Environment"** o "Environment Variables"
2. **Busca la variable:** `ANALYTICS_PORT`
3. **Si existe, ELIMÍNALA** (click en el ícono de basura 🗑️)
4. **Guarda** los cambios

---

## 📋 PASO 4: Verificar docker-compose.yml

1. **Ve a la pestaña de configuración** donde está el docker-compose.yml
2. **Busca (Ctrl+F)** la palabra "analytics"
3. **Si aparece, ELIMINA** toda la sección de analytics
4. **Verifica que Kong NO dependa de analytics:**

```yaml
# DEBE verse así:
kong:
  depends_on:
    db:
      condition: service_healthy
  # NO debe mencionar analytics aquí
```

---

## 📋 PASO 5: Guardar y Redeploy

1. **Click en "Save"** o "Guardar"
2. **Click en "Redeploy"** o "Rebuild"
3. **Espera 5 minutos**
4. **Verifica los logs**

---

## 🔍 CÓMO VERIFICAR QUE FUNCIONÓ

### En los Logs de EasyPanel:

**ANTES (con error):**
```
Container staffhub_supastaff-analytics-1  Starting
Error: Bind for 0.0.0.0:3005 failed: port is already allocated
```

**DESPUÉS (funcionando):**
```
Container staffhub_supastaff-kong-1  Started
Container staffhub_supastaff-auth-1  Started
Container staffhub_supastaff-rest-1  Started
✅ All containers started successfully
```

### En tu navegador:

```bash
# Prueba esta URL:
https://supabase.staffhub.cl/rest/v1/

# Deberías ver:
✅ {"message":"The server is running"}
# O
✅ Error 401 (también es válido)
```

---

## 🚨 SI NO ENCUENTRAS EL OVERRIDE

Si no encuentras ninguna opción de "Override" en EasyPanel, significa que se está generando automáticamente.

### Solución Alternativa:

**Crea un archivo `docker-compose.override.yml` VACÍO:**

1. En EasyPanel, busca cómo agregar archivos
2. Crea un archivo llamado `docker-compose.override.yml`
3. Con este contenido:

```yaml
version: "3.8"
services: {}
```

4. Esto sobrescribirá el override automático con uno vacío
5. Guarda y redeploy

---

## 📸 CAPTURAS QUE NECESITO (Si Sigue Sin Funcionar)

Si después de seguir estos pasos sigue sin funcionar, envíame capturas de:

1. **Pestaña "Ports"** del servicio Supabase
2. **Variables de entorno** del servicio Supabase
3. **Logs del último deploy** (las últimas 50 líneas)
4. **Resultado del script de diagnóstico**

---

## 🎯 RESUMEN RÁPIDO

```
1. Ejecutar: node scripts/diagnostics/diagnose_easypanel_override.mjs
2. En EasyPanel → Servicio Supabase:
   - Buscar pestaña "Override" o "Advanced"
   - Eliminar docker-compose.override.yml
   - Eliminar variable ANALYTICS_PORT
   - Eliminar sección analytics del docker-compose.yml
   - Eliminar mapeos de puerto 3005 y 4000
3. Guardar y Redeploy
4. Esperar 5 minutos
5. Verificar: https://supabase.staffhub.cl/rest/v1/
```

---

## 💡 ALTERNATIVA RÁPIDA: Supabase Cloud

Si esto sigue siendo complicado, considera usar Supabase Cloud:

1. Ve a https://supabase.com
2. Crea un proyecto (gratis)
3. Copia URL y claves
4. Actualiza variables en tu app
5. Listo en 5 minutos

**Ventajas:**
- ✅ Sin configuración de Docker
- ✅ Sin conflictos de puertos
- ✅ Mantenimiento automático
- ✅ Backups automáticos

---

## 📞 SIGUIENTE PASO

**Ejecuta el script de diagnóstico:**

```bash
node scripts/diagnostics/diagnose_easypanel_override.mjs
```

**Y comparte el resultado** para darte la solución exacta. 🚀
