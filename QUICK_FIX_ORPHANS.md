# ⚡ QUICK FIX: Contenedores Huérfanos (2 minutos)

## 🎯 PROBLEMA
Error 502 en `https://supabase.staffhub.cl`

## 🚀 SOLUCIÓN RÁPIDA

### En EasyPanel:
1. **Stop** el servicio Supabase
2. Esperar 30 segundos
3. **Start** el servicio Supabase
4. Esperar 1-2 minutos

### Verificar:
```
https://supabase.staffhub.cl/rest/v1/
```

**Debe responder:**
```json
{"message":"The server is running"}
```

## ✅ LISTO

Si responde correctamente:
- ✅ Problema resuelto
- ✅ Prueba el login en www.staffhub.cl
- ✅ Verifica Google OAuth

## 📚 Más Info

- **Guía completa:** ACCION_INMEDIATA_ORPHANS.md
- **Pasos detallados:** PASOS_EXACTOS_EASYPANEL_ORPHANS.md
- **Diagrama visual:** DIAGRAMA_PROBLEMA_ORPHANS.md
- **Verificación:** `node scripts/diagnostics/verify_orphans_cleanup.mjs`

---

**Tiempo total: 2-3 minutos** ⏱️
