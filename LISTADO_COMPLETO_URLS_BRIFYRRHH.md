# 📍 LISTADO COMPLETO DE URLs - BRIFYRRHH V2

## 🌐 RUTAS PRINCIPALES DE LA APLICACIÓN

### **🏠 PÁGINA PRINCIPAL**
- `/` - Home principal (HomeStaffHubSEO)

---

### **🔐 RUTAS PÚBLICAS (Sin Autenticación)**
- `/login` - Página de login (LoginUltraModern)
- `/register` - Página de registro (RegisterInnovador)
- `/forgot-password` - Recuperación de contraseña (ForgotPassword)
- `/reset-password` - Reset de contraseña (ResetPassword)
- `/auth/google/callback` - Callback de Google Auth (GoogleAuthCallback)

---

### **📊 DASHBOARD PRINCIPAL (Protegidas)**
- `/panel-principal` - Dashboard principal (ModernDashboard)
- `/plans` - Planes de suscripción (Plans)

---

### **📁 GESTIÓN DE ARCHIVOS Y CARPETAS**
- `/folders` - Gestión de carpetas (Folders)
- `/files` - Gestión de archivos (Files)
- `/perfil` - Perfil de usuario (Profile)

---

### **⚙️ CONFIGURACIÓN COMPLETA**

#### **Configuración General**
- `/configuracion` - Configuración principal (Settings)
- `/configuracion/general` - Configuración general (Settings con activeTab="general")
- `/configuracion/notificaciones` - Configuración de notificaciones (Settings con activeTab="notifications")
- `/configuracion/seguridad` - Configuración de seguridad (Settings con activeTab="security")
- `/configuracion/integraciones` - Configuración de integraciones (Settings con activeTab="integrations")
- `/configuracion/base-de-datos` - Configuración de base de datos (Settings con activeTab="database")
- `/configuracion/sincronizacion` - Configuración de sincronización (Settings con activeTab="sync")

#### **Gestión de Empresas**
- `/configuracion/empresas` - Gestión de empresas (Settings con activeTab="companies")
- `/configuracion/empresas/:companyId` - Empresa específica (Settings con companyId=true)
- `/configuracion/empresas/:companyId/sincronizacion` - Sincronización de empresa específica
- `/configuracion/empresas/:companyId/integraciones` - Integraciones de empresa específica

#### **Gestión de Usuarios**
- `/configuracion/usuarios` - Gestión de usuarios (Settings con activeTab="users")

#### **Redirecciones de Configuración**
- `/integraciones` - Redirige a `/configuracion/integraciones`

---

### **💬 SISTEMA DE COMUNICACIÓN COMPLETO**

#### **Dashboard de Comunicación**
- `/communication` - Dashboard principal de comunicación (WebrifyCommunicationDashboard)
- `/base-de-datos` - Base de datos de comunicación (WebrifyCommunicationDashboard)
- `/base-de-datos/database` - Vista específica de base de datos

#### **Módulos de Comunicación**
- `/communication/send` - Envío de mensajes (WebrifyCommunicationDashboard con activeTab="send")
- `/communication/folders` - Gestión de carpetas de empleados (WebrifyCommunicationDashboard con activeTab="folders")
- `/communication/templates` - Plantillas de comunicación (WebrifyCommunicationDashboard con activeTab="templates")
- `/communication/bulk-upload` - Carga masiva de empleados (WebrifyCommunicationDashboard con activeTab="bulk-upload")
- `/communication/reports` - Reportes de comunicación (WebrifyCommunicationDashboard con activeTab="reports")

---

### **📧 SISTEMA BREVO (Email Marketing)**

#### **Gestión de Brevo**
- `/estadisticas-brevo` - Dashboard de estadísticas de Brevo (BrevoStatisticsDashboard)
- `/plantillas-brevo` - Gestor de plantillas de Brevo (BrevoTemplatesManager)

#### **Redirecciones de Brevo**
- `/configuracion/estadisticas-brevo` - Redirige a `/estadisticas-brevo`
- `/configuracion/plantillas-brevo` - Redirige a `/plantillas-brevo`

---

### **📱 SISTEMA WHATSAPP**

#### **Configuración de WhatsApp**
- `/whatsapp/setup` - Asistente de configuración de WhatsApp (WhatsAppOnboarding)
- `/whatsapp/multi-manager` - Gestor Multi-WhatsApp para agencias (MultiWhatsAppManager)

#### **Redirecciones de WhatsApp**
- `/whatsapp/setup-wizard` - Redirige a `/whatsapp/setup`

---

### **🔍 BÚSQUEDA Y ASISTENTES**

#### **Búsqueda Inteligente**
- `/busqueda-ia` - Búsqueda con IA (SemanticSearch)

#### **Asistente Legal**
- `/lawyer` - Asistente legal (Abogado)

---

### **☁️ INTEGRACIÓN GOOGLE DRIVE**

#### **Configuración Principal de Google Drive**
- `/integrations/google-drive` - Selector de integración de Google Drive (GoogleDriveIntegrationSelector)
- `/integrations/google-drive/auto-setup` - Configuración automática (GoogleDriveAutoSetup)
- `/integrations/google-drive/wizard` - Wizard de configuración (GoogleDriveSetupWizard)
- `/google-drive-quick-setup` - Configuración rápida (GoogleDriveSimplePage)
- `/integrations/my-google-drive` - Mi Google Drive (UserGoogleDriveConnector)

#### **Diagnóstico y Pruebas de Google Drive**
- `/test-google-drive` - Página de prueba de Google Drive (GoogleDriveTestPage)
- `/test-google-drive-local` - Prueba local de Google Drive (GoogleDriveLocalTest)
- `/diagnostico-google-drive` - Diagnóstico para producción (GoogleDriveProductionDiagnosis)
- `/google-drive-uri-checker` - Verificador de URI (GoogleDriveURIChecker)
- `/google-drive-connection-verifier` - Verificador de conexión (GoogleDriveConnectionVerifier)
- `/google-drive-uri-debugger` - Debugger de URI (GoogleDriveURIDebugger)

---

### **🧪 RUTAS DE PRUEBAS Y DESARROLLO**

#### **Pruebas de Empresas y Empleados**
- `/test-company-employee` - Prueba de empresa/empleado (CompanyEmployeeTest)
- `/test-company-sync` - Prueba de sincronización de empresas (CompanySyncTest)
- `/test-whatsapp-apis` - Prueba de APIs de WhatsApp (WhatsAppAPITest)

---

### **❌ PÁGINA DE ERROR**
- `/*` - Página 404 (Página no encontrada)

---

## 📋 RESUMEN POR CATEGORÍAS

### **🔐 Autenticación (5 rutas)**
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/google/callback`

### **📊 Dashboard Principal (2 rutas)**
- `/`, `/panel-principal`, `/plans`

### **📁 Archivos y Perfil (3 rutas)**
- `/folders`, `/files`, `/perfil`

### **⚙️ Configuración (15+ rutas)**
- `/configuracion` y todas sus sub-rutas

### **💬 Comunicación (8 rutas)**
- `/communication` y todas sus sub-rutas

### **📧 Brevo (4 rutas)**
- `/estadisticas-brevo`, `/plantillas-brevo` y redirecciones

### **📱 WhatsApp (3 rutas)**
- `/whatsapp/setup`, `/whatsapp/multi-manager`, `/whatsapp/setup-wizard`

### **🔍 Búsqueda y Legal (2 rutas)**
- `/busqueda-ia`, `/lawyer`

### **☁️ Google Drive (10+ rutas)**
- `/integrations/google-drive` y todas sus sub-rutas

### **🧪 Pruebas (3 rutas)**
- `/test-company-employee`, `/test-company-sync`, `/test-whatsapp-apis`

---

## 🎯 TOTAL: **50+ RUTAS ÚNICAS**

### **🔒 Rutas Protegidas:** ~45 rutas
### **🌐 Rutas Públicas:** 5 rutas
### **🔄 Rutas de Redirección:** ~8 rutas

---

## 📝 NOTAS IMPORTANTES

1. **Todas las rutas bajo `/configuracion/*` requieren autenticación**
2. **Las rutas de comunicación están bajo el sistema Webrify unificado**
3. **Google Drive tiene múltiples niveles de configuración y diagnóstico**
4. **Las rutas de prueba están disponibles para desarrollo y debugging**
5. **El sistema de comunicación incluye base de datos, envío, carpetas, plantillas, carga masiva y reportes**

---

*Última actualización: 2025-11-24*
*Aplicación: BrifyRRHH v2*
*Framework: React + React Router*