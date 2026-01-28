# 📚 DOCUMENTACIÓN DE SERVICIOS PRINCIPALES - STAFFHUB

## 🎯 PROPÓSITO
Este documento describe los servicios principales de StaffHub, su función y cómo usarlos.

---

## 🔐 SERVICIOS DE AUTENTICACIÓN

### **customAuthService.js**
**Propósito:** Autenticación personalizada sin Supabase Auth

**Funciones principales:**
```javascript
// Iniciar sesión
const { data, error } = await customAuth.signIn(email, password)

// Registrar usuario
const { data, error } = await customAuth.signUp(email, password, fullName)

// Cerrar sesión
await customAuth.signOut()

// Obtener sesión actual
const { data } = customAuth.getSession()

// Actualizar contraseña
await customAuth.updatePassword(newPassword)
```

**Características:**
- ✅ Autenticación con bcrypt
- ✅ Sesiones en localStorage
- ✅ Eventos de cambio de estado
- ✅ Soporte multi-tab

---

## 🏢 SERVICIOS DE EMPRESAS Y EMPLEADOS

### **organizedDatabaseService.js**
**Propósito:** Gestión centralizada de empresas y empleados

**Funciones principales:**
```javascript
// Obtener empresas
const companies = await organizedDatabaseService.getCompanies()

// Obtener empleados
const employees = await organizedDatabaseService.getEmployees({ companyId })

// Crear empresa
const company = await organizedDatabaseService.createCompany(data)

// Crear empleado
const employee = await organizedDatabaseService.createEmployee(data)
```

**Características:**
- ✅ CRUD completo de empresas
- ✅ CRUD completo de empleados
- ✅ Filtros avanzados
- ✅ Validación de datos

---

## 💬 SERVICIOS DE WHATSAPP

### **multiWhatsAppService.js** ⭐ PRINCIPAL
**Propósito:** Gestión multi-cuenta de WhatsApp Business

**Funciones principales:**
```javascript
// Enviar mensaje por empresa
await multiWhatsAppService.sendMessageByCompany(companyId, {
  recipients: ['+56912345678'],
  messageType: 'text',
  content: 'Hola!'
})

// Obtener configuración
const config = await multiWhatsAppService.getWhatsAppConfigByCompany(companyId)

// Verificar estado
const status = await multiWhatsAppService.checkConnectionStatus(companyId)
```

**Características:**
- ✅ Multi-cuenta por empresa
- ✅ Soporte para múltiples APIs (Official, WAHA)
- ✅ Rate limiting automático
- ✅ Reintentos automáticos

### **whatsappComplianceService.js** ⭐ CUMPLIMIENTO
**Propósito:** Validación de políticas WhatsApp 2026

**Funciones principales:**
```javascript
// Validar consentimiento
const hasConsent = await whatsappComplianceService.hasActiveConsent(
  companyId, 
  phoneNumber
)

// Verificar ventana de 24 horas
const windowStatus = await whatsappComplianceService.check24HourWindow(
  companyId,
  phoneNumber
)

// Validar contenido
const validation = await whatsappComplianceService.validateMessageContent(
  content,
  'text'
)
```

**Características:**
- ✅ Gestión de consentimientos
- ✅ Ventana de 24 horas
- ✅ Validación de contenido
- ✅ Auditoría completa

### **whatsappAIService.js** ⭐ INTELIGENCIA ARTIFICIAL
**Propósito:** Análisis y respuestas inteligentes

**Funciones principales:**
```javascript
// Analizar sentimiento
const sentiment = await whatsappAIService.analyzeSentiment(message)

// Generar respuesta
const response = await whatsappAIService.generateResponse(
  message,
  context
)

// Clasificar mensaje
const category = await whatsappAIService.classifyMessage(message)
```

**Características:**
- ✅ Análisis de sentimiento
- ✅ Generación de respuestas
- ✅ Clasificación automática
- ✅ Cache inteligente

---

## 📁 SERVICIOS DE GOOGLE DRIVE

### **googleDriveSyncService.js** ⭐ PRINCIPAL
**Propósito:** Sincronización de carpetas de empleados

**Funciones principales:**
```javascript
// Crear carpeta de empleado
const folder = await googleDriveSyncService.createEmployeeFolderInDrive(
  email,
  name,
  companyName,
  employeeData
)

// Sincronizar desde Supabase
await googleDriveSyncService.syncDriveFromSupabase(
  employeeEmail,
  driveFolderId
)

// Verificar autenticación
const isAuth = googleDriveSyncService.isAuthenticated()
```

**Características:**
- ✅ Creación automática de carpetas
- ✅ Sincronización bidireccional
- ✅ Gestión de permisos
- ✅ Estructura jerárquica

### **googleDrivePermissionsService.js**
**Propósito:** Gestión de permisos de Drive

**Funciones principales:**
```javascript
// Compartir carpeta
await googleDrivePermissionsService.shareFolder(
  folderId,
  email,
  'writer'
)

// Revocar acceso
await googleDrivePermissionsService.revokeAccess(folderId, email)

// Listar permisos
const permissions = await googleDrivePermissionsService.listPermissions(folderId)
```

---

## 🧠 SERVICIOS DE BASE DE CONOCIMIENTO

### **companyKnowledgeService.js**
**Propósito:** Gestión de base de conocimiento por empresa

**Funciones principales:**
```javascript
// Crear FAQ
await companyKnowledgeService.createFAQ(companyId, {
  question: '¿Cómo...?',
  answer: 'Debes...',
  category: 'general'
})

// Buscar en knowledge base
const results = await companyKnowledgeService.searchKnowledge(
  companyId,
  query
)

// Obtener FAQs
const faqs = await companyKnowledgeService.getFAQs(companyId)
```

**Características:**
- ✅ FAQs por empresa
- ✅ Documentos
- ✅ Políticas y procedimientos
- ✅ Búsqueda semántica

### **employeeKnowledgeService.js**
**Propósito:** Base de conocimiento específica por empleado

**Funciones principales:**
```javascript
// Crear conocimiento de empleado
await employeeKnowledgeService.createEmployeeKnowledge(
  employeeEmail,
  data
)

// Obtener conocimiento
const knowledge = await employeeKnowledgeService.getEmployeeKnowledge(
  employeeEmail
)
```

---

## 📧 SERVICIOS DE COMUNICACIÓN

### **brevoService.js**
**Propósito:** Envío de emails con Brevo

**Funciones principales:**
```javascript
// Enviar email
await brevoService.sendEmail({
  to: ['email@example.com'],
  subject: 'Asunto',
  htmlContent: '<p>Contenido</p>'
})

// Enviar con plantilla
await brevoService.sendTemplateEmail({
  to: ['email@example.com'],
  templateId: 1,
  params: { name: 'Juan' }
})

// Obtener estadísticas
const stats = await brevoService.getEmailStats()
```

**Características:**
- ✅ Envío individual y masivo
- ✅ Plantillas
- ✅ Estadísticas
- ✅ Listas de contactos

### **communicationService.js**
**Propósito:** Servicio unificado de comunicaciones

**Funciones principales:**
```javascript
// Enviar mensaje multi-canal
await communicationService.sendMessage({
  channel: 'whatsapp', // o 'email', 'sms'
  companyId,
  recipients: ['+56912345678'],
  content: 'Mensaje'
})

// Obtener historial
const history = await communicationService.getHistory(companyId)
```

---

## ⚙️ SERVICIOS DE CONFIGURACIÓN

### **configurationService.js**
**Propósito:** Gestión centralizada de configuraciones

**Funciones principales:**
```javascript
// Obtener configuración
const config = await configurationService.getConfig(
  'category',
  'key',
  'scope',
  scopeId,
  defaultValue
)

// Guardar configuración
await configurationService.setConfig(
  'category',
  'key',
  value,
  'scope',
  scopeId,
  description
)

// Eliminar configuración
await configurationService.deleteConfig('category', 'key', 'scope', scopeId)
```

**Características:**
- ✅ Configuración por scope (global, empresa, usuario)
- ✅ Cache con TTL
- ✅ Sincronización con Supabase
- ✅ Valores por defecto

---

## 📊 SERVICIOS DE ANALÍTICAS

### **analyticsInsightsService.js**
**Propósito:** Análisis y métricas de la aplicación

**Funciones principales:**
```javascript
// Obtener insights de empresa
const insights = await analyticsInsightsService.getCompanyInsights(companyId)

// Obtener métricas de comunicación
const metrics = await analyticsInsightsService.getCommunicationMetrics(
  companyId,
  dateRange
)

// Generar reporte
const report = await analyticsInsightsService.generateReport(companyId)
```

---

## 🎮 SERVICIOS DE GAMIFICACIÓN

### **gamificationService.js**
**Propósito:** Sistema de puntos y logros

**Funciones principales:**
```javascript
// Agregar puntos
await gamificationService.addPoints(userId, points, reason)

// Obtener ranking
const ranking = await gamificationService.getRanking(companyId)

// Desbloquear logro
await gamificationService.unlockAchievement(userId, achievementId)
```

---

## 🔧 GUÍA DE USO GENERAL

### **Patrón de importación:**
```javascript
// Importar servicio
import serviceName from './services/serviceName.js'

// Usar servicio
const result = await serviceName.method(params)

// Manejar errores
try {
  const result = await serviceName.method(params)
  if (result.error) {
    console.error('Error:', result.error)
  }
} catch (error) {
  console.error('Error:', error)
}
```

### **Patrón de respuesta:**
```javascript
// Respuesta exitosa
{
  data: { ... },
  error: null
}

// Respuesta con error
{
  data: null,
  error: { message: 'Error description' }
}
```

---

## 📝 CONVENCIONES

### **Nombres de funciones:**
- `get*` - Obtener datos
- `create*` - Crear nuevo registro
- `update*` - Actualizar registro existente
- `delete*` - Eliminar registro
- `send*` - Enviar mensaje/email
- `validate*` - Validar datos
- `check*` - Verificar estado

### **Manejo de errores:**
- Siempre usar try/catch
- Retornar objeto con `{ data, error }`
- Loggear errores en console
- Mostrar mensajes amigables al usuario

### **Async/Await:**
- Todas las funciones de servicios son async
- Siempre usar await
- No usar .then()/.catch()

---

## 🚀 MEJORES PRÁCTICAS

1. **Siempre validar inputs** antes de llamar servicios
2. **Manejar errores** apropiadamente
3. **Usar loading states** en UI
4. **Cachear resultados** cuando sea posible
5. **Loggear operaciones** importantes
6. **Testear funcionalidad** crítica

---

**Última actualización:** 2026-01-28
**Versión:** 2.0
**Mantenedor:** Equipo StaffHub
