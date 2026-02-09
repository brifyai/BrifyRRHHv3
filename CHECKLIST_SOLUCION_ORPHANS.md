# ✅ CHECKLIST: Solución Contenedores Huérfanos

## ANTES DE EMPEZAR

- [ ] Tengo acceso a EasyPanel
- [ ] Puedo ver el servicio Supabase en EasyPanel
- [ ] La app principal funciona: `https://www.staffhub.cl`

## APLICAR SOLUCIÓN

### Método 1: Stop/Start (RECOMENDADO)

- [ ] Abrir EasyPanel en el navegador
- [ ] Ir al proyecto StaffHub
- [ ] Buscar servicio Supabase
- [ ] Click en botón "Stop"
- [ ] Esperar 30 segundos (hasta que diga "Stopped")
- [ ] Click en botón "Start"
- [ ] Esperar 1-2 minutos (hasta que diga "Running")

## VERIFICACIÓN BÁSICA

- [ ] Abrir `https://supabase.staffhub.cl/rest/v1/`
- [ ] Debe responder con JSON (no 502)
- [ ] Respuesta válida: `{"message":"The server is running"}` o `{"message":"JWT expired"}`

## VERIFICACIÓN DE LOGS

- [ ] Ir a pestaña "Logs" en EasyPanel
- [ ] NO debe aparecer: "Found orphan containers"
- [ ] DEBE aparecer: "Success" al final de los logs
- [ ] Todos los servicios muestran "Running" o "Started"

## VERIFICACIÓN COMPLETA

- [ ] `https://supabase.staffhub.cl/rest/v1/` → Responde correctamente
- [ ] `https://supabase.staffhub.cl/` → Carga Supabase Studio
- [ ] `https://www.staffhub.cl` → Carga la aplicación
- [ ] Ejecutar: `node scripts/diagnostics/verify_orphans_cleanup.mjs`
- [ ] Script muestra: "¡ÉXITO! Los contenedores huérfanos fueron eliminados"

## PRUEBAS FUNCIONALES

- [ ] Abrir `https://www.staffhub.cl`
- [ ] Click en "Login" o "Iniciar Sesión"
- [ ] Seleccionar "Login with Google"
- [ ] Completar autenticación de Google
- [ ] Verificar que redirige al dashboard
- [ ] Dashboard carga sin errores
- [ ] No hay errores en consola del navegador

## SERVICIOS ACTIVOS

Verificar que SOLO estos contenedores están corriendo:

- [ ] supabase-db
- [ ] supabase-kong
- [ ] supabase-auth
- [ ] supabase-rest
- [ ] supabase-realtime
- [ ] supabase-storage
- [ ] supabase-meta
- [ ] supabase-studio

**Total: 8 contenedores**

## SERVICIOS QUE NO DEBEN EXISTIR

Verificar que estos NO están corriendo:

- [ ] ❌ analytics-1 (eliminado)
- [ ] ❌ supavisor-1 (eliminado)
- [ ] ❌ functions-1 (eliminado)
- [ ] ❌ vector-1 (eliminado)
- [ ] ❌ imgproxy-1 (eliminado)

## SI ALGO FALLA

### Si sigue apareciendo 502:

- [ ] Intentar Stop/Start una segunda vez
- [ ] Esperar más tiempo (3-4 minutos)
- [ ] Verificar logs en busca de errores específicos
- [ ] Intentar método "Rebuild" (ver PASOS_EXACTOS_EASYPANEL_ORPHANS.md)

### Si un servicio no inicia:

- [ ] Revisar logs de ese servicio específico
- [ ] Verificar variables de entorno en `.env.production`
- [ ] Confirmar que el servicio tiene dependencias satisfechas

### Si nada funciona:

- [ ] Leer PASOS_EXACTOS_EASYPANEL_ORPHANS.md
- [ ] Intentar método "Rebuild"
- [ ] Considerar eliminar y recrear el servicio
- [ ] Revisar RECOMENDACION_SUPABASE_CLOUD.md

## DOCUMENTACIÓN DE REFERENCIA

- [ ] **QUICK_FIX_ORPHANS.md** - Solución en 2 minutos
- [ ] **ACCION_INMEDIATA_ORPHANS.md** - Guía rápida
- [ ] **PASOS_EXACTOS_EASYPANEL_ORPHANS.md** - Pasos detallados
- [ ] **SOLUCION_FINAL_ORPHAN_CONTAINERS.md** - Explicación completa
- [ ] **DIAGRAMA_PROBLEMA_ORPHANS.md** - Diagramas visuales
- [ ] **RESUMEN_SOLUCION_ORPHANS.md** - Resumen ejecutivo

## RESULTADO FINAL

### ✅ ÉXITO - Todos los checks pasados:

- [x] Supabase REST API responde
- [x] Supabase Studio carga
- [x] App principal funciona
- [x] Login con Google funciona
- [x] Dashboard carga correctamente
- [x] Sin errores en logs
- [x] Sin contenedores huérfanos

### ⏱️ TIEMPO TOTAL

- Aplicar solución: _____ minutos
- Verificación: _____ minutos
- Pruebas: _____ minutos
- **Total:** _____ minutos

### 📝 NOTAS

Espacio para notas adicionales:

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Fecha de aplicación:** _______________  
**Aplicado por:** _______________  
**Resultado:** ✅ Éxito / ❌ Requiere más trabajo  
**Próximos pasos:** _______________
