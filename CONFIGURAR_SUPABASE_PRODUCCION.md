# 🔐 Configuración de Supabase Self-Hosted para Producción

## ✅ KEYS GENERADAS (Guarda esto en lugar seguro)

### Para Supabase (.env del servicio supastaff en Easypanel):

```bash
# Secrets
POSTGRES_PASSWORD=/fx7dnfr0Hn2vFUpctkWJL3SH58jSY0n
JWT_SECRET=5JMm0zXaegvTzVtyKGSKQ9Vrkf0C3wrzoa0OZRYcg9dY8xTpoFwDvcs9CjjtKH/8V
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTEzNzk4LCJleHAiOjIwODQ0NzM3OTh9.5bKRVp-u2I1m_RWsOZBYQR522YUcYFBlBUTR_d9E3JQ
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTM3OTgsImV4cCI6MjA4NDQ3Mzc5OH0.OWa5cKVo35c3g--PAwxaL9fcGOpU2scua16KQD4zc2o
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=ECHyicBfvlqu2Aykk5VA55dG
SECRET_KEY_BASE=NSb+TlJArcdbSNHPilrIciFakWwR0vSgpk55YjGT4se5+uuKypp8XXhLgVHsO7mSE
VAULT_ENC_KEY=5FoCspPLyK+7YEqvB7ayS+tHXTktPGbm
PG_META_CRYPTO_KEY=lVCAOtM+xmf+8f66vmxwbxyV3Zc+q8hW
LOGFLARE_PUBLIC_ACCESS_TOKEN=Qi+zSKWSd3FxJyWwaD49m1SvSRuzQB3h
LOGFLARE_PRIVATE_ACCESS_TOKEN=uzfZoJZhHFlVzAm72t9f4ZIhQAqGbfFz

# URLs (CORREGIDAS - HTTPS)
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl
SITE_URL=https://www.staffhub.cl
API_EXTERNAL_URL=https://supabase.staffhub.cl
ADDITIONAL_REDIRECT_URLS=https://www.staffhub.cl/auth/callback,https://staffhub.cl/auth/callback
GOTRUE_SITE_URL=https://www.staffhub.cl
GOTRUE_URI_ALLOW_LIST=https://www.staffhub.cl/**,https://staffhub.cl/**
```

### Para tu Aplicación React (servicio staffhub en Easypanel):

```bash
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTYzNTgsImV4cCI6MjA4NDQ3NjM1OH0.ck89urip20NQN4WgOLVCLTXc97JQYIX_-QqyJ4lDwco
```

---

## 🚀 PASOS PARA APLICAR:

### 1. Actualizar Supabase (servicio supastaff)

1. Ve a Easypanel → Proyecto staffhub → Servicio **supastaff**
2. **Environment Variables**
3. Reemplaza TODAS las variables de secrets con las nuevas
4. **Guarda** y **Redeploy**
5. Espera a que todos los contenedores se reinicien

### 2. Actualizar Aplicación React (servicio staffhub)

1. Ve a Easypanel → Proyecto staffhub → Servicio **staffhub**
2. **Environment Variables** Y **Build Arguments**
3. Actualiza:
   ```bash
   REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
   ```
4. **Rebuild** (no solo redeploy)

### 3. Verificar Conexión

Después del rebuild, abre la consola en `https://www.staffhub.cl`:

```javascript
// Deberías ver:
✅ URL: https://supabase.staffhub.cl
✅ Cliente de Supabase creado exitosamente
```

---

## 🔒 SEGURIDAD:

### ⚠️ CRÍTICO - NO COMPARTAS:
- ❌ SERVICE_ROLE_KEY (tiene acceso total)
- ❌ POSTGRES_PASSWORD
- ❌ JWT_SECRET
- ❌ DASHBOARD_PASSWORD

### ✅ Puedes compartir:
- ✅ ANON_KEY (es pública, va en el frontend)
- ✅ URLs públicas

---

## 📋 CHECKLIST:

- [ ] Actualizar variables en servicio **supastaff**
- [ ] Reiniciar servicio supastaff
- [ ] Verificar que Supabase esté funcionando: `https://supabase.staffhub.cl`
- [ ] Actualizar variables en servicio **staffhub**
- [ ] Rebuild servicio staffhub
- [ ] Verificar login en `https://www.staffhub.cl`
- [ ] Crear usuario Camilo con `create_user_camilo_fixed.sql`
- [ ] Probar login con: camiloalegriabarra@gmail.com / Antonito26$

---

## 🐛 Si algo falla:

### Error: "Invalid JWT"
- Verifica que JWT_SECRET, ANON_KEY y SERVICE_ROLE_KEY coincidan
- Las keys deben generarse con el mismo JWT_SECRET

### Error: "Connection refused"
- Verifica que Supabase esté corriendo
- Verifica que el puerto esté abierto
- Verifica SSL/HTTPS

### Error: CSP
- Ya está configurado en el código
- Si persiste, desactiva temporalmente en Cloudflare

---

## ✅ RESULTADO ESPERADO:

Después de aplicar todo:
1. ✅ Supabase funcionando en `https://supabase.staffhub.cl`
2. ✅ App funcionando en `https://www.staffhub.cl`
3. ✅ Login funcionando correctamente
4. ✅ Sin errores de CSP
5. ✅ Sin errores de conexión

¡Todo listo para producción! 🎉
