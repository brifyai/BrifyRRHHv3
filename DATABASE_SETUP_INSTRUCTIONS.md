# 🗄️ Instrucciones de Setup de Base de Datos - BrifyRRHH v3

## ✅ Archivos SQL Disponibles

Ya tienes los siguientes archivos SQL completos en tu proyecto:

### 1. **database/complete_database_setup.sql** ⭐ PRINCIPAL
Contiene:
- ✅ Tablas de campañas Brevo (5 tablas)
- ✅ Tablas de integraciones API (8 tablas)
- ✅ Tablas de carpetas de empleados (5 tablas)
- ✅ Tabla de credenciales de usuario
- ✅ Funciones y triggers
- ✅ Políticas RLS

### 2. **COMPLETE_INTEGRATIONS_TABLES.sql**
Contiene:
- ✅ oauth_states
- ✅ company_integrations
- ✅ integration_logs
- ✅ integration_settings
- ✅ webhook_endpoints
- ✅ Índices optimizados
- ✅ Triggers automáticos
- ✅ RLS policies completas

### 3. **supabase_knowledge_simple.sql**
Contiene:
- ✅ company_knowledge_bases
- ✅ knowledge_folders
- ✅ knowledge_categories
- ✅ knowledge_documents
- ✅ faq_entries
- ✅ knowledge_permissions
- ✅ knowledge_ai_config

### 4. **Nuevos archivos creados:**
- ✅ database/01_core_tables.sql (companies, users, employees)
- ✅ database/02_integrations_tables.sql (integraciones completas)

## 🚀 PASOS PARA EJECUTAR

### Paso 1: Tablas Core (Principales)

```bash
# Ejecutar en Supabase SQL Editor:
```

```sql
-- Copiar y pegar el contenido de: database/01_core_tables.sql
```

### Paso 2: Integraciones

```sql
-- Copiar y pegar el contenido de: COMPLETE_INTEGRATIONS_TABLES.sql
```

### Paso 3: Base de Conocimiento

```sql
-- Copiar y pegar el contenido de: supabase_knowledge_simple.sql
```

### Paso 4: Campañas y Carpetas de Empleados

```sql
-- Copiar y pegar el contenido de: database/complete_database_setup.sql
```

## ✅ Verificación Rápida

Ejecuta este query después de cada paso:

```sql
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 📊 Total de Tablas Esperadas

Deberías tener al menos **30+ tablas**:

**Core (4):**
- companies
- users  
- user_companies
- employees

**Integraciones (6):**
- oauth_states
- company_integrations
- integration_logs
- user_google_drive_credentials
- system_configurations
- operation_locks

**Employee Folders (5):**
- employee_folders
- employee_documents
- employee_faqs
- employee_conversations
- employee_notification_settings

**Knowledge Base (7):**
- company_knowledge_bases
- knowledge_folders
- knowledge_categories
- knowledge_documents
- faq_entries
- knowledge_permissions
- knowledge_ai_config

**Brevo (5):**
- brevo_campaigns
- brevo_campaign_recipients
- brevo_templates
- brevo_statistics
- brevo_user_config

**Otros:**
- integration_webhooks
- integration_webhook_events
- integration_sync_logs
- integration_usage_stats
- user_integration_credentials

## 🔧 Si algo falla

1. **Error de tabla ya existe**: Normal, el script usa `IF NOT EXISTS`
2. **Error de foreign key**: Asegúrate de ejecutar en orden
3. **Error de auth.users**: Verifica que Supabase Auth esté habilitado

## 📝 Notas Importantes

- ✅ Todos los scripts usan `IF NOT EXISTS` - son seguros de re-ejecutar
- ✅ RLS está habilitado automáticamente
- ✅ Triggers de `updated_at` se crean automáticamente
- ✅ Índices optimizados incluidos

## 🎯 Siguiente Paso

Después de ejecutar todos los scripts, verifica la app en:
- http://localhost:3004 (local)
- Tu dominio de producción

¡La base de datos estará lista para funcionar!
