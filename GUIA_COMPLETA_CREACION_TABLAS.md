# 📚 GUÍA COMPLETA - Creación de Todas las Tablas StaffHub

**Fecha:** 22 de enero de 2026  
**Total de tablas:** 63 tablas  
**Tiempo estimado:** 15-20 minutos

---

## 🎯 **RESUMEN:**

He creado **TODOS** los scripts SQL necesarios para el funcionamiento óptimo de StaffHub, basándome en un análisis completo del código fuente.

---

## 📦 **ARCHIVOS CREADOS:**

### **Scripts SQL Principales:**

1. **`database/01_core_tables.sql`** ✅ (Ya existía)
   - 4 tablas: companies, users, user_companies, employees

2. **`COMPLETE_INTEGRATIONS_TABLES.sql`** ✅ (Ya existía)
   - 5 tablas: oauth_states, company_integrations, integration_logs, integration_settings, webhook_endpoints

3. **`database/03_critical_tables.sql`** 🆕 (NUEVO)
   - 5 tablas: communication_logs, messages, company_insights, system_configurations, operation_locks

4. **`database/04_important_tables.sql`** 🆕 (NUEVO)
   - 11 tablas: skills, employee_skills, interests, employee_interests, projects, project_assignments, user_consent, consent_history, whatsapp_logs, compliance_logs, communication_blocked_logs

5. **`supabase_knowledge_simple.sql`** ✅ (Ya existía)
   - 7 tablas: company_knowledge_bases, knowledge_folders, knowledge_categories, knowledge_documents, faq_entries, knowledge_permissions, knowledge_ai_config

6. **`database/complete_database_setup.sql`** ✅ (Ya existía)
   - 12 tablas: brevo_campaigns, brevo_campaign_recipients, brevo_templates, brevo_statistics, brevo_webhooks, brevo_webhook_events, brevo_user_config, employee_folders, employee_documents, employee_faqs, employee_conversations, employee_notification_settings

7. **`database/05_optional_tables.sql`** 🆕 (NUEVO)
   - 19 tablas: gamification_levels, achievements, employee_gamification, leaderboards, rewards, message_analysis, analytics_test_reports, company_metrics, user_google_drive_credentials, google_drive_tokens, google_drive_permissions, non_gmail_employees, drive_sync_log, drive_sync_tokens, drive_webhook_channels, folders, documents, knowledge_chunks, user_credentials

### **Script Maestro:**

8. **`database/00_MASTER_SETUP_COMPLETE.sql`** 🆕 (NUEVO)
   - Ejecuta todos los scripts en el orden correcto

### **Documentación:**

9. **`ANALISIS_TABLAS_FALTANTES.md`** 🆕 (NUEVO)
   - Análisis detallado de qué tablas teníamos y cuáles faltaban

10. **`GUIA_COMPLETA_CREACION_TABLAS.md`** 🆕 (Este archivo)
    - Guía paso a paso para crear todas las tablas

---

## 📊 **DESGLOSE DE TABLAS:**

| Categoría | Tablas | Archivo |
|-----------|--------|---------|
| **Core** | 4 | 01_core_tables.sql |
| **Integrations** | 5 | COMPLETE_INTEGRATIONS_TABLES.sql |
| **Critical** | 5 | 03_critical_tables.sql |
| **Skills & Projects** | 6 | 04_important_tables.sql |
| **Compliance** | 5 | 04_important_tables.sql |
| **Knowledge Base** | 7 | supabase_knowledge_simple.sql |
| **Brevo** | 7 | complete_database_setup.sql |
| **Employee Folders** | 5 | complete_database_setup.sql |
| **Gamification** | 5 | 05_optional_tables.sql |
| **Analytics** | 3 | 05_optional_tables.sql |
| **Google Drive** | 7 | 05_optional_tables.sql |
| **General** | 4 | 05_optional_tables.sql |
| **TOTAL** | **63** | - |

---

## 🚀 **OPCIÓN 1: EJECUCIÓN RÁPIDA (Recomendada)**

### **Paso 1: Acceder a Supabase Studio**

```
URL: http://supabase.staffhub.cl:8002
Usuario: admin
Password: (tu DASHBOARD_PASSWORD)
```

### **Paso 2: Ejecutar Scripts en Orden**

En SQL Editor, ejecutar UNO POR UNO en este orden:

#### **2.1 Core Tables (OBLIGATORIO)**
```sql
-- Copiar y pegar todo el contenido de:
database/01_core_tables.sql
```

#### **2.2 Integrations (OBLIGATORIO)**
```sql
-- Copiar y pegar todo el contenido de:
COMPLETE_INTEGRATIONS_TABLES.sql
```

#### **2.3 Critical Tables (OBLIGATORIO)**
```sql
-- Copiar y pegar todo el contenido de:
database/03_critical_tables.sql
```

#### **2.4 Important Tables (OBLIGATORIO)**
```sql
-- Copiar y pegar todo el contenido de:
database/04_important_tables.sql
```

#### **2.5 Knowledge Base (OBLIGATORIO)**
```sql
-- Copiar y pegar todo el contenido de:
supabase_knowledge_simple.sql
```

#### **2.6 Brevo & Employee Folders (OBLIGATORIO)**
```sql
-- Copiar y pegar todo el contenido de:
database/complete_database_setup.sql
```

#### **2.7 Optional Tables (OPCIONAL)**
```sql
-- Copiar y pegar todo el contenido de:
database/05_optional_tables.sql
```

### **Paso 3: Verificar**

```sql
-- Ver todas las tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Contar tablas
SELECT COUNT(*) as total_tablas FROM pg_tables WHERE schemaname = 'public';
```

Deberías ver **63 tablas** (o 44 si omitiste las opcionales).

---

## 🎯 **OPCIÓN 2: EJECUCIÓN AUTOMÁTICA (Avanzada)**

Si tienes acceso SSH al servidor de Supabase:

```bash
# Navegar a la carpeta del proyecto
cd /ruta/a/BrifyRRHHv3

# Ejecutar el script maestro
psql -h localhost -U postgres -d postgres -f database/00_MASTER_SETUP_COMPLETE.sql
```

---

## ✅ **VERIFICACIÓN COMPLETA:**

Después de ejecutar todos los scripts, verifica que tengas estas tablas:

### **Core (4):**
- [x] companies
- [x] users
- [x] user_companies
- [x] employees

### **Integrations (5):**
- [x] oauth_states
- [x] company_integrations
- [x] integration_logs
- [x] integration_settings
- [x] webhook_endpoints

### **Critical (5):**
- [x] communication_logs
- [x] messages
- [x] company_insights
- [x] system_configurations
- [x] operation_locks

### **Skills & Projects (6):**
- [x] skills
- [x] employee_skills
- [x] interests
- [x] employee_interests
- [x] projects
- [x] project_assignments

### **Compliance (5):**
- [x] user_consent
- [x] consent_history
- [x] whatsapp_logs
- [x] compliance_logs
- [x] communication_blocked_logs

### **Knowledge Base (7):**
- [x] company_knowledge_bases
- [x] knowledge_folders
- [x] knowledge_categories
- [x] knowledge_documents
- [x] faq_entries
- [x] knowledge_permissions
- [x] knowledge_ai_config

### **Brevo (7):**
- [x] brevo_campaigns
- [x] brevo_campaign_recipients
- [x] brevo_templates
- [x] brevo_statistics
- [x] brevo_webhooks
- [x] brevo_webhook_events
- [x] brevo_user_config

### **Employee Folders (5):**
- [x] employee_folders
- [x] employee_documents
- [x] employee_faqs
- [x] employee_conversations
- [x] employee_notification_settings

### **Gamification (5) - OPCIONAL:**
- [ ] gamification_levels
- [ ] achievements
- [ ] employee_gamification
- [ ] leaderboards
- [ ] rewards

### **Analytics (3) - OPCIONAL:**
- [ ] message_analysis
- [ ] analytics_test_reports
- [ ] company_metrics

### **Google Drive (7) - OPCIONAL:**
- [ ] user_google_drive_credentials
- [ ] google_drive_tokens
- [ ] google_drive_permissions
- [ ] non_gmail_employees
- [ ] drive_sync_log
- [ ] drive_sync_tokens
- [ ] drive_webhook_channels

### **General (4) - OPCIONAL:**
- [ ] folders
- [ ] documents
- [ ] knowledge_chunks
- [ ] user_credentials

---

## 🔍 **CARACTERÍSTICAS DE LOS SCRIPTS:**

### **✅ Seguridad:**
- Todas las tablas tienen **RLS (Row Level Security)** habilitado
- Políticas de acceso basadas en `user_companies`
- Solo los usuarios de la empresa pueden ver sus datos

### **✅ Integridad:**
- Foreign keys correctas
- Cascadas de eliminación configuradas
- Constraints de validación

### **✅ Performance:**
- Índices en columnas frecuentemente consultadas
- Índices compuestos para queries complejas
- Índices en timestamps para ordenamiento

### **✅ Auditoría:**
- Campos `created_at` y `updated_at` en todas las tablas
- Triggers automáticos para actualizar `updated_at`
- Logs de cambios en tablas críticas

### **✅ Flexibilidad:**
- Campos JSONB para metadata extensible
- Enums para valores controlados
- Campos opcionales donde tiene sentido

---

## 🐛 **SOLUCIÓN DE PROBLEMAS:**

### **Error: "relation already exists"**
```sql
-- Algunas tablas ya existen, está bien
-- El script usa "IF NOT EXISTS" para evitar errores
```

### **Error: "function update_updated_at_column() does not exist"**
```sql
-- Ejecutar primero el script que crea la función:
database/01_core_tables.sql
```

### **Error: "permission denied"**
```sql
-- Asegúrate de estar conectado como usuario con permisos
-- O usa el service_role_key en lugar del anon_key
```

### **Error: "foreign key constraint"**
```sql
-- Ejecuta los scripts EN ORDEN
-- Las tablas referenciadas deben existir primero
```

---

## 📝 **NOTAS IMPORTANTES:**

1. **Orden de ejecución:** Es CRÍTICO ejecutar los scripts en el orden indicado
2. **Tablas opcionales:** Puedes omitir el script 05 si no usas gamificación o Google Drive
3. **RLS:** Todas las tablas tienen RLS habilitado, necesitas autenticarte correctamente
4. **Service Role:** Para operaciones administrativas, usa el `service_role_key`
5. **Backup:** Si ya tienes datos, haz backup antes de ejecutar

---

## 🎉 **RESULTADO ESPERADO:**

Después de ejecutar todos los scripts:

- ✅ **63 tablas creadas** (o 44 sin opcionales)
- ✅ **RLS configurado** en todas las tablas
- ✅ **Índices optimizados** para performance
- ✅ **Triggers automáticos** para auditoría
- ✅ **Foreign keys** para integridad
- ✅ **App 100% funcional** con todas las features

---

## ⏱️ **TIEMPO ESTIMADO:**

- Ejecución manual (copiar/pegar): **15-20 minutos**
- Ejecución automática (SSH): **2-3 minutos**
- Verificación: **2 minutos**

**Total: ~20 minutos para tener la base de datos completa** 🚀

---

## 📞 **SIGUIENTE PASO:**

Después de crear las tablas, ejecuta:
```sql
-- Archivo: create_user_camilo_fixed.sql
-- Para crear el usuario administrador
```

¡Todo listo para usar StaffHub! 🎊
