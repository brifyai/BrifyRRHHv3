# 🚀 Guía Rápida de Deployment

## 📋 Resumen

Tu aplicación StaffHub está lista para deployar en EasyPanel con Supabase self-hosted.

## ⚡ Inicio Rápido (3 pasos)

### 1. Commit y Push

```bash
git add .
git commit -m "fix: Configure for Supabase self-hosted and EasyPanel"
git push
```

### 2. Configurar EasyPanel

Lee **PASOS_FINALES_DEPLOYMENT.md** y elige:
- **Opción 1**: Deployment rápido (10 min) - Para testing
- **Opción 2**: Deployment seguro (20 min) - Para producción

### 3. REBUILD

En EasyPanel, click en **"Rebuild"** y espera 5-7 minutos.

---

## 📚 Documentación Completa

| Archivo | Descripción |
|---------|-------------|
| **PASOS_FINALES_DEPLOYMENT.md** | Guía completa paso a paso |
| **EASYPANEL_CONFIG_COMPLETA.md** | Configuración detallada de EasyPanel |
| **ACCION_INMEDIATA_EASYPANEL.md** | Pasos rápidos actualizados |
| **SOLUCION_ERRORES_404_EASYPANEL.md** | Solución de problemas |
| **COMANDOS_DEBUG_EASYPANEL.md** | Comandos de debugging |

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**: Actualmente usas claves demo de Supabase (inseguras).

Para producción, genera claves seguras:

```bash
node scripts/setup/generate_secure_jwt_keys.mjs
```

Luego sigue las instrucciones en **PASOS_FINALES_DEPLOYMENT.md → Opción 2**.

---

## ✅ Configuración Actual

- **Puerto**: 4004
- **Supabase URL**: https://supabase.staffhub.cl
- **Frontend URL**: https://www.staffhub.cl
- **Google OAuth**: Configurado
- **Gemini API**: Configurado

---

## 🆘 ¿Problemas?

1. Lee **SOLUCION_ERRORES_404_EASYPANEL.md**
2. Ejecuta el diagnóstico: `node scripts/diagnostics/diagnose_easypanel_404.mjs`
3. Revisa **COMANDOS_DEBUG_EASYPANEL.md**

---

## 📞 Soporte

Si necesitas ayuda, proporciona:
- Screenshot de logs del build en EasyPanel
- Screenshot de la consola del navegador (F12)
- Screenshot del Network tab
- Qué opción elegiste (1 o 2)

---

**¡Éxito con tu deployment!** 🎉
