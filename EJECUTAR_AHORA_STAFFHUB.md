# ⚡ EJECUTAR AHORA - StaffHub

## ✅ LO QUE YA ESTÁ LISTO:

1. ✅ HTTPS configurado en `https://supabase.staffhub.cl`
2. ✅ Keys de seguridad generadas
3. ✅ Scripts SQL listos
4. ✅ Código actualizado y en Git

---

## 🎯 LO QUE DEBES HACER AHORA (15 minutos):

### **PASO 1: Actualizar Variables en Easypanel (5 min)**

#### 1.1 Servicio **supastaff**:

```
Easypanel → Proyecto staffhub → Servicio supastaff → Environment Variables
```

Actualizar estas variables:

```bash
# URLs (cambiar de HTTP a HTTPS)
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl
API_EXTERNAL_URL=https://supabase.staffhub.cl

# Keys (las nuevas generadas)
JWT_SECRET=HtI6HS7RFu63Piu7vzjlItYxPtYs93Y5j0K47U0QxpDK4YGTx5KciP/9dnkozuqT
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE1ODk0LCJleHAiOjIwODQ0NzU4OTR9._OrONKSg7uI61pFwn72VUY__K9yn0FQlt9qptiiTzOY
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTU4OTQsImV4cCI6MjA4NDQ3NTg5NH0.JZQQhLISZ4hPNFJO2Bg04Eag3Hfc_WzgDe4LyVtZnrU
POSTGRES_PASSWORD=ZblG62hEqL6H2r0hCqjIyAGdGk7AgLXG
DASHBOARD_PASSWORD=fjEwXerwWyYSb2di9tT2SCUD
```

**Guardar → Redeploy**

---

#### 1.2 Servicio **staffhub**:

```
Easypanel → Proyecto staffhub → Servicio staffhub → Build Arguments
```

Actualizar:

```bash
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE1ODk0LCJleHAiOjIwODQ0NzU4OTR9._OrONKSg7uI61pFwn72VUY__K9yn0FQlt9qptiiTzOY
```

También en **Environment Variables**:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTU4OTQsImV4cCI6MjA4NDQ3NTg5NH0.JZQQhLISZ4hPNFJO2Bg04Eag3Hfc_WzgDe4LyVtZnrU
```

**Guardar → REBUILD** (no solo redeploy)

---

### **PASO 2: Acceder a Supabase Studio (2 min)**

```
URL: http://supabase.staffhub.cl:8002
Usuario: admin
Password: fjEwXerwWyYSb2di9tT2SCUD
```

Si no puedes acceder al puerto 8002, verifica en Easypanel que el puerto esté expuesto.

---

### **PASO 3: Crear Tablas (5 min)**

En Supabase Studio → SQL Editor → Ejecutar en orden:

#### 3.1 Tablas principales:
```sql
-- Copiar y pegar todo el contenido de:
database/01_core_tables.sql
```

#### 3.2 Integraciones:
```sql
-- Copiar y pegar todo el contenido de:
COMPLETE_INTEGRATIONS_TABLES.sql
```

#### 3.3 Base de conocimiento:
```sql
-- Copiar y pegar todo el contenido de:
supabase_knowledge_simple.sql
```

#### 3.4 Setup completo:
```sql
-- Copiar y pegar todo el contenido de:
database/complete_database_setup.sql
```

---

### **PASO 4: Verificar Tablas (1 min)**

En SQL Editor, ejecutar:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Deberías ver 30+ tablas.

---

### **PASO 5: Crear Usuario Camilo (2 min)**

#### Opción A: Dashboard (Más fácil)

```
1. Authentication → Users → Add user
2. Email: camiloalegriabarra@gmail.com
3. Password: Antonito26$
4. ✅ Auto Confirm User
5. Create User
```

#### Opción B: SQL

```sql
-- Copiar y pegar todo el contenido de:
create_user_camilo_fixed.sql
```

---

### **PASO 6: Verificar que Todo Funcione (2 min)**

#### 6.1 Verificar Supabase:

Abrir en navegador:
```
https://supabase.staffhub.cl/rest/v1/
```

Debería mostrar un JSON con error 401 (es normal, significa que está funcionando).

#### 6.2 Verificar App:

```
1. Abrir: https://www.staffhub.cl
2. Abrir consola del navegador (F12)
3. Buscar en consola: "Supabase URL"
4. Debería mostrar: https://supabase.staffhub.cl
```

#### 6.3 Probar Login:

```
Email: camiloalegriabarra@gmail.com
Password: Antonito26$
```

---

## ✅ CHECKLIST RÁPIDO:

```
[ ] Actualizar variables en servicio supastaff
[ ] Redeploy servicio supastaff
[ ] Actualizar variables en servicio staffhub
[ ] Rebuild servicio staffhub
[ ] Acceder a Supabase Studio
[ ] Ejecutar database/01_core_tables.sql
[ ] Ejecutar COMPLETE_INTEGRATIONS_TABLES.sql
[ ] Ejecutar supabase_knowledge_simple.sql
[ ] Ejecutar database/complete_database_setup.sql
[ ] Verificar 30+ tablas creadas
[ ] Crear usuario Camilo
[ ] Probar login en la app
[ ] Verificar sin errores en consola
```

---

## 🐛 SI ALGO FALLA:

### No puedo acceder a Supabase Studio (puerto 8002)
```
1. Easypanel → servicio supastaff → Ports
2. Verificar que 8002 esté expuesto
3. O usar: http://localhost:8002 si estás en el servidor
```

### Error: "Invalid JWT"
```
1. Verifica que copiaste las keys completas (sin espacios)
2. Reinicia servicio supastaff después de cambiar
3. Espera 1-2 minutos para que se apliquen
```

### Error: "Mixed Content" en la app
```
1. Verifica que REACT_APP_SUPABASE_URL sea HTTPS
2. Rebuild (no solo redeploy) el servicio staffhub
3. Limpia caché del navegador (Ctrl+Shift+R)
```

### Error: "Table does not exist"
```
1. Verifica que ejecutaste todos los scripts SQL
2. Verifica en SQL Editor: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## 📋 ARCHIVOS QUE NECESITAS:

Todos están en tu repositorio:

- `database/01_core_tables.sql` - Tablas principales
- `COMPLETE_INTEGRATIONS_TABLES.sql` - Integraciones
- `supabase_knowledge_simple.sql` - Base de conocimiento
- `database/complete_database_setup.sql` - Setup completo
- `create_user_camilo_fixed.sql` - Usuario Camilo
- `verificar_tablas.sql` - Verificación

---

## 🎉 RESULTADO ESPERADO:

Después de completar todos los pasos:

1. ✅ Supabase funcionando en HTTPS
2. ✅ App conectada correctamente
3. ✅ 30+ tablas creadas
4. ✅ Usuario Camilo funcionando
5. ✅ Login exitoso
6. ✅ Sin errores en consola
7. ✅ **LISTO PARA PRODUCCIÓN** 🚀

---

## ⏱️ TIEMPO TOTAL: ~15 minutos

¡Empieza con el PASO 1! 💪
