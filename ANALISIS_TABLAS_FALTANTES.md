# 📊 ANÁLISIS COMPLETO - Tablas Necesarias para StaffHub

**Fecha:** 22 de enero de 2026  
**Análisis basado en:** Código fuente completo de la aplicación

---

## ✅ **TABLAS QUE YA TENEMOS:**

### **Core Tables (database/01_core_tables.sql):**
1. ✅ `companies` - Empresas
2. ✅ `users` - Usuarios del sistema
3. ✅ `user_companies` - Relación usuarios-empresas
4. ✅ `employees` - Empleados de las empresas

### **Integration Tables (COMPLETE_INTEGRATIONS_TABLES.sql):**
5. ✅ `oauth_states` - Estados OAuth
6. ✅ `company_integrations` - Integraciones por empresa
7. ✅ `integration_logs` - Logs de integraciones
8. ✅ `integration_settings` - Configuración de integraciones
9. ✅ `webhook_endpoints` - Endpoints de webhooks

### **Knowledge Base (supabase_knowledge_simple.sql):**
10. ✅ `company_knowledge_bases` - Bases de conocimiento
11. ✅ `knowledge_folders` - Carpetas de conocimiento
12. ✅ `knowledge_categories` - Categorías
13. ✅ `knowledge_documents` - Documentos vectorizados
14. ✅ `faq_entries` - FAQs
15. ✅ `knowledge_permissions` - Permisos
16. ✅ `knowledge_ai_config` - Configuración IA

### **Brevo/Communication (database/complete_database_setup.sql):**
17. ✅ `brevo_campaigns` - Campañas de email
18. ✅ `brevo_campaign_recipients` - Destinatarios
19. ✅ `brevo_templates` - Plantillas
20. ✅ `brevo_statistics` - Estadísticas
21. ✅ `brevo_webhooks` - Webhooks Brevo
22. ✅ `brevo_webhook_events` - Eventos de webhooks
23. ✅ `brevo_user_config` - Configuración de usuario

### **Employee Folders (database/complete_database_setup.sql):**
24. ✅ `employee_folders` - Carpetas de empleados
25. ✅ `employee_documents` - Documentos de empleados
26. ✅ `employee_faqs` - FAQs de empleados
27. ✅ `employee_conversations` - Conversaciones
28. ✅ `employee_notification_settings` - Configuración de notificaciones

---

## ⚠️ **TABLAS QUE FALTAN (Encontradas en el código):**

### **1. Communication & Messaging:**
- ❌ `communication_logs` - Logs de comunicación (CRÍTICA)
- ❌ `messages` - Mensajes enviados
- ❌ `whatsapp_logs` - Logs de WhatsApp
- ❌ `compliance_logs` - Logs de cumplimiento
- ❌ `communication_blocked_logs` - Comunicaciones bloqueadas

### **2. Employee Skills & Interests:**
- ❌ `employee_skills` - Habilidades de empleados
- ❌ `employee_interests` - Intereses de empleados
- ❌ `skills` - Catálogo de habilidades
- ❌ `interests` - Catálogo de intereses

### **3. Projects:**
- ❌ `project_assignments` - Asignaciones a proyectos
- ❌ `projects` - Proyectos

### **4. Gamification:**
- ❌ `gamification_levels` - Niveles de gamificación
- ❌ `achievements` - Logros
- ❌ `leaderboards` - Tablas de clasificación
- ❌ `rewards` - Recompensas
- ❌ `employee_gamification` - Gamificación por empleado

### **5. Compliance & Consent:**
- ❌ `user_consent` - Consentimientos de usuarios
- ❌ `consent_history` - Historial de consentimientos

### **6. Analytics:**
- ❌ `message_analysis` - Análisis de mensajes
- ❌ `analytics_test_reports` - Reportes de pruebas
- ❌ `company_insights` - Insights de empresas
- ❌ `company_metrics` - Métricas de empresas

### **7. Google Drive:**
- ❌ `user_google_drive_credentials` - Credenciales de Drive
- ❌ `google_drive_tokens` - Tokens de Drive
- ❌ `google_drive_permissions` - Permisos de Drive
- ❌ `non_gmail_employees` - Empleados sin Gmail
- ❌ `drive_sync_log` - Log de sincronización
- ❌ `drive_sync_tokens` - Tokens de sincronización
- ❌ `drive_webhook_channels` - Canales de webhook

### **8. System Configuration:**
- ❌ `system_configurations` - Configuraciones del sistema
- ❌ `operation_locks` - Locks de operaciones
- ❌ `user_credentials` - Credenciales de usuario

### **9. Additional Tables:**
- ❌ `folders` - Carpetas generales
- ❌ `documents` - Documentos generales
- ❌ `knowledge_chunks` - Chunks de conocimiento (para vectorización)

---

## 📊 **RESUMEN:**

| Categoría | Tenemos | Faltan | Total |
|-----------|---------|--------|-------|
| Core | 4 | 0 | 4 |
| Integrations | 5 | 0 | 5 |
| Knowledge Base | 7 | 1 | 8 |
| Brevo/Communication | 7 | 5 | 12 |
| Employee Folders | 5 | 0 | 5 |
| Skills & Projects | 0 | 6 | 6 |
| Gamification | 0 | 5 | 5 |
| Compliance | 0 | 2 | 2 |
| Analytics | 0 | 4 | 4 |
| Google Drive | 0 | 7 | 7 |
| System | 0 | 3 | 3 |
| General | 0 | 2 | 2 |
| **TOTAL** | **28** | **35** | **63** |

---

## 🎯 **PRIORIDAD DE IMPLEMENTACIÓN:**

### **CRÍTICAS (Necesarias para funcionalidad básica):**
1. ✅ `communication_logs` - Sin esto no funciona la comunicación
2. ✅ `messages` - Almacenamiento de mensajes
3. ✅ `company_insights` - Dashboard necesita esto
4. ✅ `system_configurations` - Configuración global
5. ✅ `operation_locks` - Prevenir operaciones concurrentes

### **IMPORTANTES (Funcionalidad avanzada):**
6. ✅ `employee_skills` + `skills` - Filtrado por habilidades
7. ✅ `employee_interests` + `interests` - Filtrado por intereses
8. ✅ `project_assignments` + `projects` - Gestión de proyectos
9. ✅ `user_consent` - Cumplimiento legal
10. ✅ `whatsapp_logs` - Auditoría de WhatsApp

### **OPCIONALES (Features adicionales):**
11. ⏳ `gamification_levels` - Gamificación
12. ⏳ `achievements` - Logros
13. ⏳ `leaderboards` - Rankings
14. ⏳ `rewards` - Recompensas
15. ⏳ Google Drive tables - Si se usa integración

---

## 📝 **PRÓXIMOS PASOS:**

1. ✅ Crear script SQL con tablas CRÍTICAS
2. ✅ Crear script SQL con tablas IMPORTANTES
3. ⏳ Crear script SQL con tablas OPCIONALES
4. ⏳ Ejecutar scripts en orden en Supabase
5. ⏳ Verificar que todas las tablas existan
6. ⏳ Probar funcionalidad de la app

---

## 🔍 **NOTAS IMPORTANTES:**

- Las tablas de **Brevo** ya están creadas (7 tablas)
- Las tablas de **Knowledge Base** ya están creadas (7 tablas)
- Las tablas de **Employee Folders** ya están creadas (5 tablas)
- Faltan principalmente tablas de **comunicación**, **skills**, **gamificación** y **Google Drive**
- Las tablas de Google Drive son opcionales si no se usa esa integración

---

**Total de tablas a crear: 35 tablas adicionales**
**Total de tablas en el sistema: 63 tablas**
