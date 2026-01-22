# 🚀 Configuración Final StaffHub - Paso a Paso

## 📋 KEYS GENERADAS (Del último comando)

```bash
# SECRETS
POSTGRES_PASSWORD=ZblG62hEqL6H2r0hCqjIyAGdGk7AgLXG
JWT_SECRET=HtI6HS7RFu63Piu7vzjlItYxPtYs93Y5j0K47U0QxpDK4YGTx5KciP/9dnkozuqT
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE1ODk0LCJleHAiOjIwODQ0NzU4OTR9._OrONKSg7uI61pFwn72VUY__K9yn0FQlt9qptiiTzOY
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTU4OTQsImV4cCI6MjA4NDQ3NTg5NH0.JZQQhLISZ4hPNFJO2Bg04Eag3Hfc_WzgDe4LyVtZnrU
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=fjEwXerwWyYSb2di9tT2SCUD
SECRET_KEY_BASE=YqAnQCpcSJkHB73jUQ58AF71/bEyItdKL2C1LOfbAVJZgFUH1vo/H4lyJOa7Az83
VAULT_ENC_KEY=xP0iSxVMeI6r4Ns8JuMSkzLArBVc/19V
PG_META_CRYPTO_KEY=dX1dfnS0hXc51oja8apA5iMEAO3W3+/3
LOGFLARE_PUBLIC_ACCESS_TOKEN=YpXWKm3x7WeUAAnA02LZgxuyu5bR5lSo
LOGFLARE_PRIVATE_ACCESS_TOKEN=rJKqJeMmqYTcBVxFRBo+j4jVcRpQscoB
```

---

## ⚠️ DECISIÓN CRÍTICA: HTTP vs HTTPS

### Tu configuración actual:
- ✅ App: `https://www.staffhub.cl` (HTTPS)
- ❌ Supabase: `http://supabase.staffhub.cl` (HTTP)

### Problema:
**Los navegadores bloquean conexiones HTTP desde páginas HTTPS** (Mixed Content Error)

### Opciones:

#### **Opción A: Configurar HTTPS (RECOMENDADO)** ⭐
```
1. En Easypanel → servicio supastaff → Domains
2. Agregar: supabase.staffhub.cl
3. Enable SSL (automático con Let's Encrypt)
4. Esperar 5 minutos
5. Usar: https://supabase.staffhub.cl
```

#### **Opción B: Usar HTTP (Solo desarrollo)**
```
⚠️ NO funcionará en producción
✅ Solo para desarrollo local
```

**Lee el archivo `ADVERTENCIA_HTTP_SUPABASE.md` para más detalles**

---

## 🎯 PASOS DE CONFIGURACIÓN

### **PASO 1: Configurar Supabase (servicio supastaff)**

#### 1.1 En Easypanel → Proyecto staffhub → Servicio supastaff

#### 1.2 Environment Variables - Actualizar:

```bash
# Secrets (NUEVAS KEYS GENERADAS)
POSTGRES_PASSWORD=ZblG62hEqL6H2r0hCqjIyAGdGk7AgLXG
JWT_SECRET=HtI6HS7RFu63Piu7vzjlItYxPtYs93Y5j0K47U0QxpDK4YGTx5KciP/9dnkozuqT
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE1ODk0LCJleHAiOjIwODQ0NzU4OTR9._OrONKSg7uI61pFwn72VUY__K9yn0FQlt9qptiiTzOY
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTU4OTQsImV4cCI6MjA4NDQ3NTg5NH0.JZQQhLISZ4hPNFJO2Bg04Eag3Hfc_WzgDe4LyVtZnrU
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=fjEwXerwWyYSb2di9tT2SCUD
SECRET_KEY_BASE=YqAnQCpcSJkHB73jUQ58AF71/bEyItdKL2C1LOfbAVJZgFUH1vo/H4lyJOa7Az83
VAULT_ENC_KEY=xP0iSxVMeI6r4Ns8JuMSkzLArBVc/19V
PG_META_CRYPTO_KEY=dX1dfnS0hXc51oja8apA5iMEAO3W3+/3
LOGFLARE_PUBLIC_ACCESS_TOKEN=YpXWKm3x7WeUAAnA02LZgxuyu5bR5lSo
LOGFLARE_PRIVATE_ACCESS_TOKEN=rJKqJeMmqYTcBVxFRBo+j4jVcRpQscoB

# URLs (Elige HTTP o HTTPS según tu decisión)
# Si configuraste HTTPS (Opción A):
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl
API_EXTERNAL_URL=https://supabase.staffhub.cl

# Si usas HTTP (Opción B - solo desarrollo):
# SUPABASE_PUBLIC_URL=http://supabase.staffhub.cl
# API_EXTERNAL_URL=http://supabase.staffhub.cl

SITE_URL=https://www.staffhub.cl
ADDITIONAL_REDIRECT_URLS=https://www.staffhub.cl/auth/callback,https://staffhub.cl/auth/callback
GOTRUE_SITE_URL=https://www.staffhub.cl
GOTRUE_URI_ALLOW_LIST=https://www.staffhub.cl/**,https://staffhub.cl/**
```

#### 1.3 Guardar y Redeploy

---

### **PASO 2: Configurar Aplicación React (servicio staffhub)**

#### 2.1 En Easypanel → Proyecto staffhub → Servicio staffhub

#### 2.2 Build Arguments - Actualizar:

```bash
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
PORT=3004

# Supabase (Elige HTTP o HTTPS según tu decisión)
# Si configuraste HTTPS (Opción A):
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl

# Si usas HTTP (Opción B - solo desarrollo):
# REACT_APP_SUPABASE_URL=http://supabase.staffhub.cl

REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE1ODk0LCJleHAiOjIwODQ0NzU4OTR9._OrONKSg7uI61pFwn72VUY__K9yn0FQlt9qptiiTzOY

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=777409222994-977fdhkb9lfrq7v363hlndulq8k98lgk.apps.googleusercontent.com

# Otras
CORS_ALLOW_ALL=true
```

#### 2.3 Environment Variables - Actualizar:

```bash
# Service Role Key (para backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTU4OTQsImV4cCI6MjA4NDQ3NTg5NH0.JZQQhLISZ4hPNFJO2Bg04Eag3Hfc_WzgDe4LyVtZnrU
```

#### 2.4 **REBUILD** (no solo redeploy)

---

### **PASO 3: Crear Tablas en Supabase**

#### 3.1 Acceder a Supabase Studio:

```
URL: http://supabase.staffhub.cl (o https si configuraste SSL)
Usuario: admin
Password: fjEwXerwWyYSb2di9tT2SCUD
```

#### 3.2 SQL Editor → Ejecutar en orden:

1. `database/01_core_tables.sql`
2. `COMPLETE_INTEGRATIONS_TABLES.sql`
3. `supabase_knowledge_simple.sql`
4. `database/complete_database_setup.sql`

#### 3.3 Verificar:

```sql
-- Ejecutar en SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Deberías ver 30+ tablas.

---

### **PASO 4: Crear Usuario Camilo**

#### Opción A: Dashboard (Fácil)

```
1. Authentication → Users → Add user
2. Email: camiloalegriabarra@gmail.com
3. Password: Antonito26$
4. ✅ Auto Confirm User
5. Create User
```

#### Opción B: SQL

```sql
-- Ejecutar en SQL Editor
-- Usar: create_user_camilo_fixed.sql
```

---

### **PASO 5: Verificación Final**

#### 5.1 Verificar Supabase:

```bash
# Debería responder
curl http://supabase.staffhub.cl/rest/v1/
# o
curl https://supabase.staffhub.cl/rest/v1/
```

#### 5.2 Verificar App:

```
1. Abrir: https://www.staffhub.cl
2. Abrir consola (F12)
3. Buscar: "Supabase URL"
4. Debería mostrar: http://supabase.staffhub.cl (o https)
```

#### 5.3 Probar Login:

```
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
```

---

## ✅ CHECKLIST COMPLETO

- [ ] **Decidir:** HTTP o HTTPS para Supabase
- [ ] **Si HTTPS:** Configurar dominio en Easypanel
- [ ] **Actualizar:** Variables en servicio supastaff
- [ ] **Redeploy:** Servicio supastaff
- [ ] **Verificar:** Supabase funcionando
- [ ] **Actualizar:** Variables en servicio staffhub
- [ ] **Rebuild:** Servicio staffhub (no solo redeploy)
- [ ] **Acceder:** Supabase Studio
- [ ] **Ejecutar:** Scripts SQL (4 archivos)
- [ ] **Verificar:** 30+ tablas creadas
- [ ] **Crear:** Usuario Camilo
- [ ] **Probar:** Login en la app
- [ ] **Verificar:** Sin errores en consola

---

## 🐛 TROUBLESHOOTING

### Error: "Mixed Content"
- ✅ Configura HTTPS en Supabase
- ✅ Lee `ADVERTENCIA_HTTP_SUPABASE.md`

### Error: "Invalid JWT"
- ✅ Verifica que JWT_SECRET, ANON_KEY y SERVICE_ROLE_KEY coincidan
- ✅ Reinicia servicio supastaff después de cambiar

### Error: "Connection refused"
- ✅ Verifica que Supabase esté corriendo
- ✅ Verifica puertos en docker-compose
- ✅ Revisa logs del contenedor

### Error: "Table does not exist"
- ✅ Ejecuta los scripts SQL en orden
- ✅ Verifica en SQL Editor que las tablas existan

---

## 📞 ARCHIVOS DE REFERENCIA

- `ADVERTENCIA_HTTP_SUPABASE.md` - Problema HTTP vs HTTPS
- `DROP_ALL_TABLES.sql` - Limpiar base de datos
- `database/01_core_tables.sql` - Tablas principales
- `COMPLETE_INTEGRATIONS_TABLES.sql` - Integraciones
- `supabase_knowledge_simple.sql` - Base de conocimiento
- `database/complete_database_setup.sql` - Setup completo
- `create_user_camilo_fixed.sql` - Crear usuario

---

## 🎉 RESULTADO ESPERADO

Después de completar todos los pasos:

1. ✅ Supabase funcionando en `supabase.staffhub.cl`
2. ✅ App funcionando en `https://www.staffhub.cl`
3. ✅ 30+ tablas creadas
4. ✅ Usuario Camilo creado
5. ✅ Login funcionando
6. ✅ Sin errores en consola
7. ✅ Listo para producción

**¡Todo configurado y funcionando!** 🚀
