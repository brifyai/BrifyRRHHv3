# 🚀 EJECUTAR SCRIPTS SQL EN SUPABASE - PASO A PASO

## ⚠️ IMPORTANTE
Los archivos SQL en Git son solo scripts. **Debes ejecutarlos en Supabase** para crear las tablas.

## 📋 PASOS PARA CREAR LAS TABLAS

### 1️⃣ Abrir Supabase SQL Editor

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **tmqglnycivlcjijoymwe**
3. En el menú lateral, click en **SQL Editor**
4. Click en **New query**

### 2️⃣ Ejecutar Scripts en Este Orden

#### **Script 1: Tablas Core** (2 minutos)

```sql
-- Copiar y pegar TODO el contenido de: database/01_core_tables.sql
```

**Qué crea:**
- ✅ companies
- ✅ users
- ✅ user_companies
- ✅ employees

**Cómo ejecutar:**
1. Abre el archivo `database/01_core_tables.sql`
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)
3. Pega en Supabase SQL Editor
4. Click en **Run** (o F5)
5. Espera el mensaje: ✅ "Tablas CORE creadas exitosamente!"

---

#### **Script 2: Integraciones** (3 minutos)

```sql
-- Copiar y pegar TODO el contenido de: COMPLETE_INTEGRATIONS_TABLES.sql
```

**Qué crea:**
- ✅ oauth_states
- ✅ company_integrations
- ✅ integration_logs
- ✅ integration_settings
- ✅ webhook_endpoints
- ✅ Índices y triggers

**Cómo ejecutar:**
1. Abre el archivo `COMPLETE_INTEGRATIONS_TABLES.sql`
2. Copia TODO el contenido
3. Pega en Supabase SQL Editor (nueva query)
4. Click en **Run**
5. Espera confirmación

---

#### **Script 3: Base de Conocimiento** (2 minutos)

```sql
-- Copiar y pegar TODO el contenido de: supabase_knowledge_simple.sql
```

**Qué crea:**
- ✅ company_knowledge_bases
- ✅ knowledge_folders
- ✅ knowledge_categories
- ✅ knowledge_documents
- ✅ faq_entries
- ✅ knowledge_permissions
- ✅ knowledge_ai_config

**Cómo ejecutar:**
1. Abre el archivo `supabase_knowledge_simple.sql`
2. Copia TODO el contenido
3. Pega en Supabase SQL Editor (nueva query)
4. Click en **Run**
5. Espera el mensaje: ✅ "Tablas de base de conocimiento empresarial creadas exitosamente!"

---

#### **Script 4: Campañas y Employee Folders** (3 minutos)

```sql
-- Copiar y pegar TODO el contenido de: database/complete_database_setup.sql
```

**Qué crea:**
- ✅ brevo_campaigns
- ✅ brevo_campaign_recipients
- ✅ brevo_templates
- ✅ brevo_statistics
- ✅ brevo_user_config
- ✅ employee_folders
- ✅ employee_documents
- ✅ employee_faqs
- ✅ employee_conversations
- ✅ employee_notification_settings
- ✅ Funciones y triggers
- ✅ RLS policies

**Cómo ejecutar:**
1. Abre el archivo `database/complete_database_setup.sql`
2. Copia TODO el contenido
3. Pega en Supabase SQL Editor (nueva query)
4. Click en **Run**
5. Espera el mensaje: ✅ "Base de datos completa de BrifyRRHH v2 creada exitosamente!"

---

### 3️⃣ Verificar que Todo se Creó

Ejecuta este query en Supabase SQL Editor:

```sql
-- Ver todas las tablas creadas
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Deberías ver 30+ tablas** ✅

---

### 4️⃣ Crear Usuario Camilo (Opcional)

Si quieres crear el usuario ahora:

```sql
-- Copiar y pegar: create_user_camilo.sql
```

O usa Supabase Dashboard:
- Authentication → Users → Add user
- Email: camiloalegriabarra@gmail.com
- Password: Antonito26$
- ✅ Auto Confirm User

---

## ⚡ ATAJO RÁPIDO

Si quieres ejecutar todo de una vez (10 minutos):

1. Abre Supabase SQL Editor
2. Ejecuta los 4 scripts en orden (uno por uno)
3. Verifica con el query de verificación
4. ¡Listo!

---

## ❓ Si Algo Falla

### Error: "relation already exists"
✅ **Normal** - La tabla ya existe, puedes continuar

### Error: "column does not exist"
⚠️ **Ejecuta los scripts en orden** - Algunas tablas dependen de otras

### Error: "permission denied"
⚠️ **Verifica que estás usando el proyecto correcto** en Supabase

### Error: "syntax error"
⚠️ **Copia TODO el archivo** - No copies solo una parte

---

## 🎯 Resultado Final

Después de ejecutar todos los scripts tendrás:

✅ 30+ tablas creadas
✅ Índices optimizados
✅ Triggers automáticos
✅ RLS policies configuradas
✅ Funciones útiles
✅ Base de datos lista para producción

**Tiempo total: 10-15 minutos** ⏱️

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún error:
1. Copia el mensaje de error completo
2. Dime en qué script estabas
3. Te ayudo a resolverlo

¡Vamos a crear esas tablas! 🚀
