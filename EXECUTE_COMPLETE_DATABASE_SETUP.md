# 🗄️ Setup Completo de Base de Datos - BrifyRRHH v3

## Resumen

Este documento contiene las instrucciones para crear **TODAS** las tablas necesarias para el funcionamiento óptimo de la aplicación StaffHub/BrifyRRHH.

## 📋 Tablas a Crear

### 1. CORE (Tablas Principales)
- ✅ `companies` - Empresas del sistema
- ✅ `users` - Usuarios (extiende auth.users)
- ✅ `user_companies` - Relación usuarios-empresas
- ✅ `employees` - Empleados por empresa

### 2. INTEGRACIONES
- ✅ `oauth_states` - Estados OAuth temporales
- ✅ `company_integrations` - Integraciones por empresa
- ✅ `integration_logs` - Logs de integraciones
- ✅ `user_google_drive_credentials` - Credenciales Google Drive
- ✅ `system_configurations` - Configuraciones del sistema
- ✅ `operation_locks` - Locks para operaciones críticas

### 3. CARPETAS DE EMPLEADOS
- ✅ `employee_folders` - Carpetas de empleados
- ✅ `employee_documents` - Documentos de empleados
- ✅ `employee_faqs` - FAQs de empleados
- ✅ `employee_conversations` - Historial de conversaciones
- ✅ `employee_notification_settings` - Configuración de notificaciones

### 4. BASE DE CONOCIMIENTO
- ✅ `company_knowledge_bases` - Bases de conocimiento empresarial
- ✅ `knowledge_folders` - Carpetas de conocimiento
- ✅ `knowledge_categories` - Categorías de conocimiento
- ✅ `knowledge_documents` - Documentos vectorizados
- ✅ `faq_entries` - Entradas de FAQ
- ✅ `knowledge_permissions` - Permisos de conocimiento
- ✅ `knowledge_ai_config` - Configuración de IA

### 5. CAMPAÑAS BREVO
- ✅ `brevo_campaigns` - Campañas de email/SMS
- ✅ `brevo_campaign_recipients` - Destinatarios
- ✅ `brevo_templates` - Plantillas
- ✅ `brevo_statistics` - Estadísticas
- ✅ `brevo_user_config` - Configuración de usuario

## 🚀 Instrucciones de Instalación

### Opción 1: Scripts Individuales (Recomendado)

Ejecuta los scripts en este orden en Supabase SQL Editor:

```sql
-- 1. Core Tables
\i database/01_core_tables.sql

-- 2. Integrations
\i database/02_integrations_tables.sql

-- 3. Employee Folders (del archivo complete_database_setup.sql)
-- Copiar sección de employee_folders

-- 4. Knowledge Base
\i supabase_knowledge_simple.sql

-- 5. Brevo Campaigns (del archivo complete_database_setup.sql)
-- Copiar sección de brevo_campaigns

-- 6. Triggers y Funciones
-- Ver database/complete_database_setup.sql sección 5

-- 7. RLS Policies
-- Ver database/complete_database_setup.sql sección 6
```

### Opción 2: Script Completo Unificado

Usa el archivo `database/complete_database_setup.sql` que ya contiene la mayoría de las tablas.

## 📁 Archivos Disponibles

1. **database/01_core_tables.sql** - Tablas principales (NUEVO)
2. **database/02_integrations_tables.sql** - Integraciones (NUEVO)
3. **database/complete_database_setup.sql** - Setup completo existente
4. **supabase_knowledge_simple.sql** - Base de conocimiento
5. **COMPLETE_INTEGRATIONS_TABLES.sql** - Integraciones completas

## ✅ Verificación Post-Instalación

Ejecuta este query para verificar que todas las tablas se crearon:

```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'companies', 'users', 'user_companies', 'employees',
        'oauth_states', 'company_integrations', 'integration_logs',
        'user_google_drive_credentials', 'system_configurations', 'operation_locks',
        'employee_folders', 'employee_documents', 'employee_faqs',
        'employee_conversations', 'employee_notification_settings',
        'company_knowledge_bases', 'knowledge_folders', 'knowledge_categories',
        'knowledge_documents', 'faq_entries', 'knowledge_permissions', 'knowledge_ai_config',
        'brevo_campaigns', 'brevo_campaign_recipients', 'brevo_templates',
        'brevo_statistics', 'brevo_user_config'
    )
ORDER BY table_name;
```

Deberías ver **29 tablas** en total.

## 🔒 Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado con políticas que:
- Usuarios solo ven datos de sus empresas
- Admins tienen permisos completos
- Políticas basadas en `auth.uid()` y `user_companies`

## 🔄 Triggers Automáticos

- `updated_at` se actualiza automáticamente en todas las tablas
- Limpieza automática de `oauth_states` expirados
- Limpieza de logs antiguos (90 días)

## 📊 Funciones Útiles

- `get_user_companies()` - Obtiene empresas del usuario actual
- `update_updated_at_column()` - Actualiza timestamp automáticamente
- `get_brevo_campaign_stats()` - Estadísticas de campañas
- `cleanup_expired_oauth_states()` - Limpieza de estados OAuth
- `cleanup_old_integration_logs()` - Limpieza de logs antiguos

## 🎯 Próximos Pasos

1. ✅ Ejecutar scripts SQL en Supabase
2. ✅ Verificar que todas las tablas existen
3. ✅ Probar la aplicación
4. ✅ Insertar datos de prueba si es necesario

## 📝 Notas Importantes

- Todas las tablas usan UUID como primary key
- Timestamps en UTC (TIMESTAMP WITH TIME ZONE)
- JSONB para datos flexibles (settings, metadata)
- Índices optimizados para queries frecuentes
- Constraints para integridad de datos
