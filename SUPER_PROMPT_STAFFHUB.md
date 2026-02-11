# 🚀 SUPER PROMPT: Construcción de StaffHub - Sistema Completo de Gestión de RRHH

## 📋 ÍNDICE

1. [Visión General del Sistema](#visión-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos Principales](#módulos-principales)
6. [Base de Datos](#base-de-datos)
7. [Servicios y APIs](#servicios-y-apis)
8. [Seguridad](#seguridad)
9. [Integraciones](#integraciones)
10. [Deployment](#deployment)

---

## 🎯 VISIÓN GENERAL DEL SISTEMA

### Descripción
StaffHub es un sistema empresarial completo de gestión de recursos humanos que combina:
- Gestión multi-empresa y multi-usuario
- Automatización inteligente con IA
- Base de conocimiento vectorizada
- Comunicaciones multi-canal
- Seguridad empresarial de 4 niveles
- Analíticas en tiempo real

### Objetivos del Sistema
1. **Centralizar** toda la gestión de RRHH en una plataforma
2. **Automatizar** procesos repetitivos con IA
3. **Escalar** para soportar múltiples empresas simultáneamente
4. **Asegurar** datos sensibles con encriptación end-to-end
5. **Integrar** múltiples canales de comunicación
6. **Analizar** datos en tiempo real para toma de decisiones

### Capacidades del Sistema
- ✅ Gestión de 16+ empresas simultáneas
- ✅ Manejo de 800+ empleados con datos completos
- ✅ Creación automática de 800+ carpetas individuales
- ✅ Base de conocimiento con vectorización IA
- ✅ Comunicaciones WhatsApp, Email, Telegram
- ✅ Dashboard con analíticas en tiempo real
- ✅ Sistema de seguridad de 4 fases
- ✅ Autenticación multi-factor (MFA)
- ✅ Control de acceso basado en roles (RBAC)

---


## 🏗️ ARQUITECTURA TÉCNICA

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Employees │  │Knowledge │  │Settings  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Employee     │  │ Knowledge    │  │ Communication│     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Supabase  │  │Google    │  │WhatsApp  │  │Groq AI   │   │
│  │Database  │  │Drive     │  │API       │  │Service   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Patrones de Arquitectura

1. **Arquitectura en Capas**
   - Presentación (React Components)
   - Lógica de Negocio (Services)
   - Acceso a Datos (Lib/Adapters)
   - Integraciones (External APIs)

2. **Microservicios Internos**
   - Cada módulo es independiente
   - Comunicación mediante eventos
   - Escalabilidad horizontal

3. **Event-Driven Architecture**
   - Sistema de eventos para comunicación
   - Webhooks para integraciones externas
   - Real-time updates con Supabase Realtime

4. **Cache Strategy**
   - localStorage como cache L1
   - Supabase como cache L2
   - TTL de 5 minutos
   - Invalidación inteligente

---


## 💻 STACK TECNOLÓGICO

### Frontend
```javascript
{
  "framework": "React 18.2.0",
  "routing": "React Router DOM 6.20.1",
  "styling": "Tailwind CSS 3.3.6",
  "ui-components": [
    "@headlessui/react 1.7.17",
    "@heroicons/react 2.0.18",
    "lucide-react 0.294.0"
  ],
  "state-management": "React Context API",
  "forms": "@tailwindcss/forms 0.5.7",
  "animations": "framer-motion 12.23.24",
  "charts": "chart.js 4.5.1 + react-chartjs-2 5.3.0",
  "notifications": [
    "react-hot-toast 2.4.1",
    "sweetalert2 11.23.0"
  ],
  "rich-text": "draft-js 0.11.7 + react-draft-wysiwyg 1.15.0",
  "virtualization": "react-window 2.1.2"
}
```

### Backend & Services
```javascript
{
  "runtime": "Node.js 18+",
  "server": "Express 4.18.2",
  "database": "Supabase (PostgreSQL)",
  "authentication": "Supabase Auth",
  "storage": "Google Cloud Storage 7.7.0",
  "realtime": "socket.io-client 4.8.1"
}
```

### AI & Machine Learning
```javascript
{
  "llm": "Groq SDK 0.30.0",
  "embeddings": "@google/generative-ai 0.24.1",
  "nlp": "Custom sentiment analysis",
  "vector-search": "Supabase pgvector"
}
```

### Integraciones
```javascript
{
  "google": "googleapis 131.0.0",
  "whatsapp": "Custom API integration",
  "email": "Custom SMTP service",
  "telegram": "Custom Bot API"
}
```

### Utilidades
```javascript
{
  "http-client": "axios 1.6.2",
  "date-handling": "date-fns 2.30.0",
  "encryption": "bcryptjs 3.0.2",
  "file-processing": [
    "mammoth 1.10.0",
    "pdfjs-dist 5.4.54",
    "xlsx 0.18.5"
  ],
  "environment": "dotenv 17.2.3"
}
```

### Development Tools
```javascript
{
  "build": "react-scripts 5.0.1",
  "bundler": "webpack (via react-scripts)",
  "css-processor": "postcss 8.4.32 + autoprefixer 10.4.16",
  "concurrent-tasks": "concurrently 9.2.1"
}
```

---


## 📁 ESTRUCTURA DEL PROYECTO

### Estructura de Directorios

```
staffhub/
├── public/                          # Archivos estáticos
│   ├── images/                      # Logos e imágenes
│   ├── index.html                   # HTML principal
│   └── manifest.json                # PWA manifest
│
├── src/
│   ├── components/                  # Componentes React
│   │   ├── agency/                  # Gestión de agencias
│   │   ├── analytics/               # Dashboards y gráficos
│   │   ├── auth/                    # Autenticación
│   │   ├── communication/           # Comunicaciones multi-canal
│   │   ├── dashboard/               # Dashboard principal
│   │   ├── employees/               # Gestión de empleados
│   │   ├── folders/                 # Carpetas de empleados
│   │   ├── knowledge/               # Base de conocimiento
│   │   ├── integrations/            # Integraciones externas
│   │   ├── settings/                # Configuración
│   │   ├── templates/               # Plantillas
│   │   └── common/                  # Componentes reutilizables
│   │
│   ├── services/                    # Lógica de negocio
│   │   ├── employeeDataService.js   # CRUD empleados
│   │   ├── companyKnowledgeService.js # Base de conocimiento
│   │   ├── communicationService.js  # Comunicaciones
│   │   ├── integrationService.js    # Integraciones
│   │   ├── gamificationService.js   # Gamificación
│   │   └── [50+ servicios más]
│   │
│   ├── lib/                         # Utilidades y configuración
│   │   ├── supabase.js              # Cliente Supabase
│   │   ├── googleDrive.js           # Google Drive API
│   │   ├── embeddings.js            # Vectorización IA
│   │   ├── encryptionService.js     # Encriptación
│   │   ├── mfaService.js            # Multi-factor auth
│   │   ├── rbacService.js           # Control de acceso
│   │   └── [40+ librerías más]
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useEmployeeFolders.js    # Hook carpetas
│   │   ├── useMultiGoogleDrive.js   # Hook Google Drive
│   │   ├── useErrorHandler.js       # Hook errores
│   │   └── [10+ hooks más]
│   │
│   ├── contexts/                    # React Contexts
│   │   └── AuthContext.js           # Contexto autenticación
│   │
│   ├── utils/                       # Utilidades generales
│   │   ├── formatters.js            # Formateo de datos
│   │   ├── cryptoUtils.js           # Utilidades crypto
│   │   ├── performanceMonitor.js    # Monitoreo
│   │   └── [10+ utilidades más]
│   │
│   ├── config/                      # Configuración
│   │   ├── constants.js             # Constantes globales
│   │   ├── errorMessages.js         # Mensajes de error
│   │   └── codeSplitting.js         # Code splitting
│   │
│   ├── styles/                      # Estilos CSS
│   │   ├── accessibility.css        # Accesibilidad
│   │   ├── flip-cards.css           # Animaciones
│   │   └── responsive-tables.css    # Tablas responsivas
│   │
│   ├── App.js                       # Componente principal
│   ├── index.js                     # Entry point
│   └── index.css                    # Estilos globales
│
├── database/                        # Scripts SQL
│   ├── 00_MASTER_SETUP.sql          # Setup principal
│   ├── 01_core_tables.sql           # Tablas core
│   ├── 02_integrations_tables.sql   # Tablas integraciones
│   ├── 03_critical_tables.sql       # Tablas críticas
│   ├── 04_important_tables.sql      # Tablas importantes
│   └── 05_optional_tables.sql       # Tablas opcionales
│
├── scripts/                         # Scripts de utilidad
│   ├── setup/                       # Scripts de setup
│   ├── diagnostics/                 # Scripts de diagnóstico
│   ├── fixes/                       # Scripts de corrección
│   └── testing/                     # Scripts de testing
│
├── server-simple.mjs                # Servidor Express
├── Dockerfile                       # Docker config
├── docker-compose.yml               # Docker Compose
├── package.json                     # Dependencias
├── tailwind.config.js               # Config Tailwind
├── postcss.config.js                # Config PostCSS
└── .env.production                  # Variables producción
```

---


## 🧩 MÓDULOS PRINCIPALES

### 1. MÓDULO DE AUTENTICACIÓN

**Ubicación**: `src/components/auth/` + `src/lib/supabaseAuth.js`

**Características**:
- Login con email/password
- Login con Google OAuth
- Multi-factor authentication (MFA)
- Recuperación de contraseña
- Gestión de sesiones
- Tokens JWT

**Componentes**:
```javascript
// LoginForm.js
- Formulario de login
- Validación de credenciales
- Manejo de errores
- Redirección post-login

// MFASetup.js
- Configuración de MFA
- Generación de códigos QR
- Verificación de códigos
- Backup codes

// PasswordRecovery.js
- Solicitud de recuperación
- Validación de email
- Reset de contraseña
```

**Servicios**:
```javascript
// supabaseAuth.js
export const authService = {
  signIn: async (email, password) => {},
  signUp: async (email, password, metadata) => {},
  signOut: async () => {},
  resetPassword: async (email) => {},
  updatePassword: async (newPassword) => {},
  getSession: async () => {},
  onAuthStateChange: (callback) => {}
}
```

---

### 2. MÓDULO DE GESTIÓN DE EMPLEADOS

**Ubicación**: `src/components/employees/` + `src/services/employeeDataService.js`

**Características**:
- CRUD completo de empleados
- Búsqueda y filtrado avanzado
- Importación masiva (Excel)
- Exportación de datos
- Historial de cambios
- Carpetas individuales automáticas

**Componentes**:
```javascript
// EmployeeList.js
- Lista virtualizada (react-window)
- Filtros múltiples
- Ordenamiento
- Paginación
- Acciones masivas

// EmployeeForm.js
- Formulario completo
- Validación en tiempo real
- Upload de foto
- Campos dinámicos por empresa

// EmployeeDetail.js
- Vista detallada
- Historial de actividad
- Documentos asociados
- Comunicaciones
```

**Servicios**:
```javascript
// employeeDataService.js
export const employeeService = {
  // CRUD
  getAll: async (companyId, filters) => {},
  getById: async (employeeId) => {},
  create: async (employeeData) => {},
  update: async (employeeId, data) => {},
  delete: async (employeeId) => {},
  
  // Búsqueda
  search: async (query, filters) => {},
  filter: async (criteria) => {},
  
  // Importación
  importFromExcel: async (file) => {},
  validateImport: async (data) => {},
  
  // Carpetas
  createFolder: async (employeeId) => {},
  getFolderStructure: async (employeeId) => {}
}
```

---

### 3. MÓDULO DE BASE DE CONOCIMIENTO

**Ubicación**: `src/components/knowledge/` + `src/services/companyKnowledgeService.js`

**Características**:
- Creación automática por empresa
- Vectorización con embeddings
- Búsqueda semántica
- FAQs inteligentes
- Documentos estructurados
- Versionado de contenido

**Componentes**:
```javascript
// KnowledgeBase.js
- Vista principal
- Categorías
- Búsqueda semántica
- Resultados relevantes

// KnowledgeEditor.js
- Editor WYSIWYG
- Markdown support
- Upload de archivos
- Preview en tiempo real

// KnowledgeSearch.js
- Búsqueda con IA
- Sugerencias
- Filtros por categoría
- Historial de búsquedas
```

**Servicios**:
```javascript
// companyKnowledgeService.js
export const knowledgeService = {
  // CRUD
  create: async (companyId, content) => {},
  update: async (knowledgeId, content) => {},
  delete: async (knowledgeId) => {},
  
  // Búsqueda
  search: async (query, companyId) => {},
  semanticSearch: async (query, companyId) => {},
  
  // Vectorización
  generateEmbeddings: async (text) => {},
  storeEmbeddings: async (knowledgeId, embeddings) => {},
  
  // FAQs
  generateFAQs: async (companyId) => {},
  updateFAQs: async (companyId, faqs) => {}
}
```

---


### 4. MÓDULO DE COMUNICACIONES

**Ubicación**: `src/components/communication/` + `src/services/communicationService.js`

**Características**:
- Multi-canal (WhatsApp, Email, Telegram)
- Plantillas personalizables
- Envío masivo
- Programación de mensajes
- Análisis de sentimiento
- Estadísticas de envío

**Componentes**:
```javascript
// CommunicationCenter.js
- Centro de comunicaciones
- Selección de canal
- Lista de destinatarios
- Historial de envíos

// MessageComposer.js
- Editor de mensajes
- Plantillas
- Variables dinámicas
- Preview multi-canal

// CommunicationStats.js
- Estadísticas de envío
- Tasa de apertura
- Tasa de respuesta
- Análisis de sentimiento
```

**Servicios**:
```javascript
// communicationService.js
export const communicationService = {
  // Envío
  sendMessage: async (channel, recipients, message) => {},
  sendBulk: async (channel, recipients, message) => {},
  scheduleMessage: async (channel, recipients, message, date) => {},
  
  // Plantillas
  getTemplates: async (channel) => {},
  createTemplate: async (template) => {},
  
  // Estadísticas
  getStats: async (messageId) => {},
  getChannelStats: async (channel, dateRange) => {},
  
  // Análisis
  analyzeSentiment: async (message) => {},
  getResponseRate: async (messageId) => {}
}
```

---

### 5. MÓDULO DE INTEGRACIONES

**Ubicación**: `src/components/integrations/` + `src/services/integrationService.js`

**Características**:
- Google Drive
- WhatsApp Business API
- Telegram Bot
- Brevo (Email)
- Groq AI
- Webhooks personalizados

**Componentes**:
```javascript
// IntegrationsDashboard.js
- Lista de integraciones
- Estado de conexión
- Configuración rápida
- Logs de actividad

// GoogleDriveSetup.js
- OAuth flow
- Selección de carpetas
- Permisos
- Sincronización

// WhatsAppSetup.js
- Configuración de API
- Webhooks
- Plantillas aprobadas
- Testing
```

**Servicios**:
```javascript
// integrationService.js
export const integrationService = {
  // Google Drive
  connectGoogleDrive: async (credentials) => {},
  syncFolders: async (companyId) => {},
  uploadFile: async (file, folderId) => {},
  
  // WhatsApp
  connectWhatsApp: async (credentials) => {},
  sendWhatsAppMessage: async (to, message) => {},
  getWhatsAppTemplates: async () => {},
  
  // Webhooks
  registerWebhook: async (url, events) => {},
  testWebhook: async (webhookId) => {}
}
```

---

### 6. MÓDULO DE ANALÍTICAS

**Ubicación**: `src/components/analytics/` + `src/services/analyticsInsightsService.js`

**Características**:
- Dashboard en tiempo real
- Métricas clave (KPIs)
- Gráficos interactivos
- Reportes personalizados
- Exportación de datos
- Alertas automáticas

**Componentes**:
```javascript
// AnalyticsDashboard.js
- Vista general
- KPIs principales
- Gráficos en tiempo real
- Filtros por fecha/empresa

// CompanyInsights.js
- Insights por empresa
- Comparativas
- Tendencias
- Predicciones

// CustomReports.js
- Constructor de reportes
- Selección de métricas
- Programación de envío
- Exportación (PDF, Excel)
```

**Servicios**:
```javascript
// analyticsInsightsService.js
export const analyticsService = {
  // KPIs
  getKPIs: async (companyId, dateRange) => {},
  calculateGrowth: async (metric, period) => {},
  
  // Insights
  generateInsights: async (companyId) => {},
  predictTrends: async (metric, period) => {},
  
  // Reportes
  generateReport: async (config) => {},
  scheduleReport: async (config, schedule) => {},
  exportReport: async (reportId, format) => {}
}
```

---


### 7. MÓDULO DE SEGURIDAD

**Ubicación**: `src/lib/` (múltiples archivos)

**Características**:
- Encriptación end-to-end
- Multi-factor authentication
- Control de acceso (RBAC)
- Auditoría completa
- Detección de anomalías
- Backup automático

**Componentes de Seguridad**:
```javascript
// encryptionService.js
export const encryptionService = {
  encrypt: async (data, key) => {},
  decrypt: async (encryptedData, key) => {},
  generateKey: () => {},
  hashPassword: async (password) => {},
  verifyPassword: async (password, hash) => {}
}

// mfaService.js
export const mfaService = {
  generateSecret: () => {},
  generateQRCode: async (secret, user) => {},
  verifyToken: (token, secret) => {},
  generateBackupCodes: () => {}
}

// rbacService.js
export const rbacService = {
  checkPermission: async (userId, resource, action) => {},
  assignRole: async (userId, role) => {},
  getRoles: async (userId) => {},
  getPermissions: async (role) => {}
}

// auditService.js
export const auditService = {
  log: async (action, userId, resource, details) => {},
  getAuditLog: async (filters) => {},
  detectAnomalies: async () => {}
}
```

**Niveles de Seguridad**:
1. **Nivel 1 - Autenticación**: Login seguro + MFA
2. **Nivel 2 - Autorización**: RBAC + permisos granulares
3. **Nivel 3 - Encriptación**: Datos en reposo y en tránsito
4. **Nivel 4 - Auditoría**: Logging completo + detección de anomalías

---

### 8. MÓDULO DE CONFIGURACIÓN

**Ubicación**: `src/components/settings/` + `src/services/configurationService.js`

**Características**:
- Configuración multi-nivel (global, empresa, usuario)
- Sincronización Supabase + localStorage
- Cache inteligente (TTL 5 min)
- Migración automática
- Backup de configuración

**Componentes**:
```javascript
// SettingsDashboard.js
- Vista general de configuración
- Categorías
- Búsqueda de settings
- Cambios recientes

// CompanySettings.js
- Configuración por empresa
- Branding
- Integraciones
- Notificaciones

// UserSettings.js
- Preferencias de usuario
- Idioma
- Tema
- Notificaciones personales
```

**Servicios**:
```javascript
// configurationService.js
export const configService = {
  // CRUD
  get: async (key, level, entityId) => {},
  set: async (key, value, level, entityId) => {},
  delete: async (key, level, entityId) => {},
  
  // Jerarquía
  getHierarchical: async (key, userId, companyId) => {},
  
  // Cache
  clearCache: () => {},
  syncCache: async () => {},
  
  // Migración
  migrateFromLocalStorage: async () => {},
  backup: async () => {},
  restore: async (backupId) => {}
}
```

---


## 🗄️ BASE DE DATOS

### Esquema de Base de Datos (Supabase/PostgreSQL)

#### Tablas Core

```sql
-- COMPANIES (Empresas)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE,
  industry VARCHAR(100),
  size VARCHAR(50),
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active'
);

-- EMPLOYEES (Empleados)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  rut VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  hire_date DATE,
  birth_date DATE,
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- EMPLOYEE_FOLDERS (Carpetas de Empleados)
CREATE TABLE employee_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  folder_id VARCHAR(255),
  drive_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, company_id)
);

-- USERS (Usuarios del sistema)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  company_id UUID REFERENCES companies(id),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tablas de Conocimiento

```sql
-- COMPANY_KNOWLEDGE (Base de Conocimiento)
CREATE TABLE company_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  embedding VECTOR(1536),
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- EMPLOYEE_KNOWLEDGE (Conocimiento por Empleado)
CREATE TABLE employee_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source VARCHAR(100),
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FAQS (Preguntas Frecuentes)
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tablas de Comunicaciones

```sql
-- COMMUNICATION_LOGS (Registro de Comunicaciones)
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL,
  message_type VARCHAR(50),
  recipient VARCHAR(255),
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- TEMPLATES (Plantillas de Mensajes)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  variables TEXT[],
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tablas de Integraciones

```sql
-- COMPANY_CREDENTIALS (Credenciales de Integraciones)
CREATE TABLE company_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  service VARCHAR(100) NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, service)
);

-- OAUTH_STATES (Estados de OAuth)
CREATE TABLE oauth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  service VARCHAR(100) NOT NULL,
  redirect_uri TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WEBHOOKS (Webhooks)
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  service VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tablas de Configuración

```sql
-- SYSTEM_CONFIGURATIONS (Configuración del Sistema)
CREATE TABLE system_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  level VARCHAR(50) NOT NULL,
  entity_id UUID,
  category VARCHAR(100),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(key, level, entity_id)
);
```

#### Tablas de Seguridad

```sql
-- AUDIT_LOGS (Logs de Auditoría)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER_SESSIONS (Sesiones de Usuario)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW()
);

-- MFA_SECRETS (Secretos MFA)
CREATE TABLE mfa_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret VARCHAR(255) NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Índices y Optimizaciones

```sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_folders_employee ON employee_folders(employee_id);
CREATE INDEX idx_knowledge_company ON company_knowledge(company_id);
CREATE INDEX idx_comm_logs_company ON communication_logs(company_id);
CREATE INDEX idx_comm_logs_status ON communication_logs(status);

-- Índices para búsqueda vectorial
CREATE INDEX idx_knowledge_embedding ON company_knowledge 
  USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_employee_knowledge_embedding ON employee_knowledge 
  USING ivfflat (embedding vector_cosine_ops);

-- Índices para auditoría
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

### Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_knowledge ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo
CREATE POLICY "Users can view their company data"
  ON companies FOR SELECT
  USING (user_id = auth.uid() OR id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their company employees"
  ON employees FOR ALL
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));
```

---


## 🔌 SERVICIOS Y APIs

### API REST Endpoints

#### Autenticación
```javascript
POST   /api/auth/login              // Login
POST   /api/auth/register           // Registro
POST   /api/auth/logout             // Logout
POST   /api/auth/refresh            // Refresh token
POST   /api/auth/reset-password     // Reset password
POST   /api/auth/verify-mfa         // Verificar MFA
```

#### Empresas
```javascript
GET    /api/companies               // Listar empresas
GET    /api/companies/:id           // Obtener empresa
POST   /api/companies               // Crear empresa
PUT    /api/companies/:id           // Actualizar empresa
DELETE /api/companies/:id           // Eliminar empresa
GET    /api/companies/:id/stats     // Estadísticas
```

#### Empleados
```javascript
GET    /api/employees               // Listar empleados
GET    /api/employees/:id           // Obtener empleado
POST   /api/employees               // Crear empleado
PUT    /api/employees/:id           // Actualizar empleado
DELETE /api/employees/:id           // Eliminar empleado
POST   /api/employees/import        // Importar desde Excel
GET    /api/employees/export        // Exportar a Excel
POST   /api/employees/:id/folder    // Crear carpeta
```

#### Base de Conocimiento
```javascript
GET    /api/knowledge               // Listar conocimiento
GET    /api/knowledge/:id           // Obtener conocimiento
POST   /api/knowledge               // Crear conocimiento
PUT    /api/knowledge/:id           // Actualizar conocimiento
DELETE /api/knowledge/:id           // Eliminar conocimiento
POST   /api/knowledge/search        // Búsqueda semántica
POST   /api/knowledge/embeddings    // Generar embeddings
GET    /api/knowledge/faqs          // Obtener FAQs
```

#### Comunicaciones
```javascript
POST   /api/communications/send     // Enviar mensaje
POST   /api/communications/bulk     // Envío masivo
POST   /api/communications/schedule // Programar mensaje
GET    /api/communications/logs     // Logs de comunicaciones
GET    /api/communications/stats    // Estadísticas
GET    /api/templates               // Listar plantillas
POST   /api/templates               // Crear plantilla
```

#### Integraciones
```javascript
GET    /api/integrations            // Listar integraciones
POST   /api/integrations/google     // Conectar Google Drive
POST   /api/integrations/whatsapp   // Conectar WhatsApp
POST   /api/integrations/webhook    // Registrar webhook
GET    /api/integrations/:id/status // Estado de integración
```

#### Analíticas
```javascript
GET    /api/analytics/dashboard     // Dashboard principal
GET    /api/analytics/kpis          // KPIs
GET    /api/analytics/insights      // Insights
POST   /api/analytics/report        // Generar reporte
GET    /api/analytics/trends        // Tendencias
```

---

### Webhooks

#### Google Drive Webhook
```javascript
POST /api/webhook/google-drive
// Payload:
{
  "kind": "api#channel",
  "id": "channel-id",
  "resourceId": "resource-id",
  "resourceUri": "https://www.googleapis.com/drive/v3/files/...",
  "token": "verification-token",
  "expiration": "1234567890000"
}
```

#### WhatsApp Webhook
```javascript
POST /api/webhook/whatsapp
// Payload:
{
  "entry": [{
    "id": "phone-number-id",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "phone_number_id": "..." },
        "messages": [{
          "from": "sender-number",
          "id": "message-id",
          "timestamp": "1234567890",
          "text": { "body": "message content" }
        }]
      }
    }]
  }]
}
```

---

### Servicios Externos

#### Google Drive API
```javascript
// googleDrive.js
export const googleDriveService = {
  // Autenticación
  getAuthUrl: () => {},
  handleCallback: async (code) => {},
  refreshToken: async (refreshToken) => {},
  
  // Carpetas
  createFolder: async (name, parentId) => {},
  listFolders: async (parentId) => {},
  deleteFolder: async (folderId) => {},
  
  // Archivos
  uploadFile: async (file, folderId) => {},
  downloadFile: async (fileId) => {},
  deleteFile: async (fileId) => {},
  
  // Permisos
  shareFolder: async (folderId, email, role) => {},
  revokeAccess: async (folderId, permissionId) => {},
  
  // Webhooks
  watchFolder: async (folderId, webhookUrl) => {},
  stopWatch: async (channelId) => {}
}
```

#### Groq AI Service
```javascript
// groqService.js
export const groqService = {
  // Chat
  chat: async (messages, model) => {},
  streamChat: async (messages, model, onChunk) => {},
  
  // Embeddings
  generateEmbeddings: async (text) => {},
  
  // Análisis
  analyzeSentiment: async (text) => {},
  extractKeywords: async (text) => {},
  summarize: async (text) => {},
  
  // FAQs
  generateFAQs: async (content) => {},
  answerQuestion: async (question, context) => {}
}
```

#### WhatsApp Business API
```javascript
// whatsappService.js
export const whatsappService = {
  // Mensajes
  sendMessage: async (to, message) => {},
  sendTemplate: async (to, templateName, params) => {},
  sendMedia: async (to, mediaUrl, caption) => {},
  
  // Plantillas
  getTemplates: async () => {},
  createTemplate: async (template) => {},
  
  // Webhooks
  verifyWebhook: (token, challenge) => {},
  processWebhook: async (payload) => {}
}
```

#### Brevo Email Service
```javascript
// brevoService.js
export const brevoService = {
  // Email
  sendEmail: async (to, subject, html) => {},
  sendBulkEmail: async (recipients, subject, html) => {},
  sendTemplate: async (to, templateId, params) => {},
  
  // Campañas
  createCampaign: async (campaign) => {},
  sendCampaign: async (campaignId) => {},
  getCampaignStats: async (campaignId) => {},
  
  // Contactos
  addContact: async (email, attributes) => {},
  updateContact: async (email, attributes) => {},
  deleteContact: async (email) => {}
}
```

---


## 🔒 SEGURIDAD

### Arquitectura de Seguridad de 4 Niveles

#### Nivel 1: Autenticación
```javascript
// Implementación de autenticación segura
const authConfig = {
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: '1h',
  refreshTokenExpiry: '7d',
  
  // Password
  passwordMinLength: 12,
  passwordRequirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  },
  
  // MFA
  mfaEnabled: true,
  mfaMethod: 'totp',
  backupCodesCount: 10,
  
  // Session
  sessionTimeout: 3600000, // 1 hora
  maxConcurrentSessions: 3
}
```

#### Nivel 2: Autorización (RBAC)
```javascript
// Roles y permisos
const roles = {
  superadmin: {
    permissions: ['*']
  },
  admin: {
    permissions: [
      'companies:*',
      'employees:*',
      'knowledge:*',
      'communications:*',
      'integrations:*',
      'analytics:read'
    ]
  },
  manager: {
    permissions: [
      'employees:read',
      'employees:create',
      'employees:update',
      'knowledge:read',
      'communications:send',
      'analytics:read'
    ]
  },
  user: {
    permissions: [
      'employees:read',
      'knowledge:read',
      'analytics:read'
    ]
  }
}

// Middleware de autorización
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    const user = req.user
    const hasPermission = await rbacService.checkPermission(
      user.id,
      resource,
      action
    )
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    next()
  }
}
```

#### Nivel 3: Encriptación
```javascript
// Encriptación de datos sensibles
const encryptionConfig = {
  // Algoritmo
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  
  // Datos a encriptar
  sensitiveFields: [
    'credentials',
    'api_keys',
    'tokens',
    'passwords',
    'secrets'
  ],
  
  // Encriptación en tránsito
  https: true,
  tlsVersion: '1.3',
  
  // Encriptación en reposo
  databaseEncryption: true,
  fileEncryption: true
}

// Implementación
export const encrypt = async (data, key) => {
  const iv = crypto.randomBytes(encryptionConfig.ivLength)
  const cipher = crypto.createCipheriv(
    encryptionConfig.algorithm,
    key,
    iv
  )
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}
```

#### Nivel 4: Auditoría
```javascript
// Sistema de auditoría completo
const auditConfig = {
  // Eventos a auditar
  events: [
    'auth:login',
    'auth:logout',
    'auth:failed_login',
    'data:create',
    'data:update',
    'data:delete',
    'permission:granted',
    'permission:revoked',
    'config:changed'
  ],
  
  // Retención
  retentionDays: 365,
  
  // Alertas
  alerts: {
    failedLoginThreshold: 5,
    suspiciousActivityThreshold: 10,
    dataExfiltrationThreshold: 100
  }
}

// Implementación
export const auditLog = async (event, details) => {
  await supabase.from('audit_logs').insert({
    user_id: details.userId,
    action: event,
    resource: details.resource,
    resource_id: details.resourceId,
    details: details.metadata,
    ip_address: details.ipAddress,
    user_agent: details.userAgent,
    created_at: new Date()
  })
  
  // Detectar anomalías
  await detectAnomalies(event, details)
}
```

---

### Protección contra Amenazas

#### SQL Injection
```javascript
// Usar prepared statements
const getEmployee = async (id) => {
  // ❌ VULNERABLE
  // const query = `SELECT * FROM employees WHERE id = '${id}'`
  
  // ✅ SEGURO
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()
  
  return data
}
```

#### XSS (Cross-Site Scripting)
```javascript
// Sanitizar inputs
import DOMPurify from 'dompurify'

const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  })
}

// Usar en componentes
const DisplayContent = ({ content }) => {
  const sanitized = sanitizeInput(content)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

#### CSRF (Cross-Site Request Forgery)
```javascript
// Tokens CSRF
const csrfProtection = (req, res, next) => {
  const token = req.headers['x-csrf-token']
  const sessionToken = req.session.csrfToken
  
  if (token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  
  next()
}
```

#### Rate Limiting
```javascript
// Limitar requests
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', rateLimiter)
```

---

### Backup y Recuperación

```javascript
// Sistema de backup automático
const backupConfig = {
  // Frecuencia
  schedule: '0 2 * * *', // Diario a las 2 AM
  
  // Retención
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 12
  },
  
  // Destinos
  destinations: [
    'google-cloud-storage',
    'aws-s3',
    'local-storage'
  ],
  
  // Encriptación
  encrypted: true,
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY
}

// Implementación
export const createBackup = async () => {
  const timestamp = new Date().toISOString()
  
  // Backup de base de datos
  const dbBackup = await backupDatabase()
  
  // Backup de archivos
  const filesBackup = await backupFiles()
  
  // Encriptar
  const encrypted = await encrypt({
    database: dbBackup,
    files: filesBackup
  }, backupConfig.encryptionKey)
  
  // Subir a destinos
  await uploadToDestinations(encrypted, timestamp)
  
  // Limpiar backups antiguos
  await cleanOldBackups()
}
```

---


## 🔗 INTEGRACIONES

### Google Drive Integration

#### Configuración
```javascript
// googleDriveConfig.js
export const googleDriveConfig = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.REACT_APP_URL}/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ]
}
```

#### Flujo de Autenticación
```javascript
// 1. Generar URL de autorización
export const getAuthUrl = () => {
  const oauth2Client = new google.auth.OAuth2(
    googleDriveConfig.clientId,
    googleDriveConfig.clientSecret,
    googleDriveConfig.redirectUri
  )
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: googleDriveConfig.scopes,
    prompt: 'consent'
  })
}

// 2. Manejar callback
export const handleCallback = async (code) => {
  const oauth2Client = new google.auth.OAuth2(
    googleDriveConfig.clientId,
    googleDriveConfig.clientSecret,
    googleDriveConfig.redirectUri
  )
  
  const { tokens } = await oauth2Client.getToken(code)
  
  // Guardar tokens en Supabase
  await supabase.from('company_credentials').upsert({
    company_id: currentCompanyId,
    service: 'google_drive',
    credentials: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    }
  })
  
  return tokens
}
```

#### Operaciones de Carpetas
```javascript
// Crear carpeta para empleado
export const createEmployeeFolder = async (employee) => {
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  // Crear carpeta principal
  const folder = await drive.files.create({
    requestBody: {
      name: `${employee.full_name} - ${employee.rut}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [companyFolderId]
    },
    fields: 'id, name, webViewLink'
  })
  
  // Crear subcarpetas
  const subfolders = [
    'Documentos Personales',
    'Contratos',
    'Certificados',
    'Evaluaciones',
    'Otros'
  ]
  
  for (const subfolder of subfolders) {
    await drive.files.create({
      requestBody: {
        name: subfolder,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folder.data.id]
      }
    })
  }
  
  // Guardar en base de datos
  await supabase.from('employee_folders').insert({
    employee_id: employee.id,
    company_id: employee.company_id,
    folder_name: folder.data.name,
    folder_id: folder.data.id,
    drive_url: folder.data.webViewLink
  })
  
  return folder.data
}
```

#### Sincronización Bidireccional
```javascript
// Configurar webhook para cambios
export const watchFolder = async (folderId) => {
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  const channel = await drive.files.watch({
    fileId: folderId,
    requestBody: {
      id: uuid(),
      type: 'web_hook',
      address: `${process.env.API_URL}/webhook/google-drive`,
      token: generateWebhookToken(),
      expiration: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
    }
  })
  
  // Guardar channel info
  await supabase.from('drive_channels').insert({
    channel_id: channel.data.id,
    resource_id: channel.data.resourceId,
    folder_id: folderId,
    expires_at: new Date(parseInt(channel.data.expiration))
  })
  
  return channel.data
}

// Procesar cambios del webhook
export const processWebhook = async (payload) => {
  const { resourceId, channelId } = payload
  
  // Obtener cambios
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  const changes = await drive.changes.list({
    pageToken: lastPageToken,
    includeRemoved: true
  })
  
  // Procesar cada cambio
  for (const change of changes.data.changes) {
    if (change.removed) {
      await handleFileDeleted(change.fileId)
    } else if (change.file) {
      await handleFileChanged(change.file)
    }
  }
  
  // Actualizar token
  lastPageToken = changes.data.newStartPageToken
}
```

---

### WhatsApp Business API Integration

#### Configuración
```javascript
// whatsappConfig.js
export const whatsappConfig = {
  apiUrl: 'https://graph.facebook.com/v18.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
}
```

#### Envío de Mensajes
```javascript
// Enviar mensaje de texto
export const sendTextMessage = async (to, message) => {
  const response = await axios.post(
    `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  // Registrar en logs
  await supabase.from('communication_logs').insert({
    channel: 'whatsapp',
    recipient: to,
    content: message,
    status: 'sent',
    message_id: response.data.messages[0].id,
    sent_at: new Date()
  })
  
  return response.data
}

// Enviar plantilla aprobada
export const sendTemplate = async (to, templateName, params) => {
  const response = await axios.post(
    `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: p }))
          }
        ]
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return response.data
}
```

#### Webhook Handler
```javascript
// Verificar webhook
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  
  if (mode === 'subscribe' && token === whatsappConfig.webhookVerifyToken) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
}

// Procesar mensajes entrantes
export const processIncomingMessage = async (req, res) => {
  const { entry } = req.body
  
  for (const change of entry[0].changes) {
    const { value } = change
    
    if (value.messages) {
      for (const message of value.messages) {
        // Procesar mensaje
        await handleIncomingMessage({
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type,
          content: message.text?.body || message.image?.id
        })
        
        // Responder con IA si está habilitado
        if (aiEnabled) {
          const response = await generateAIResponse(message.text.body)
          await sendTextMessage(message.from, response)
        }
      }
    }
    
    // Procesar estados de entrega
    if (value.statuses) {
      for (const status of value.statuses) {
        await updateMessageStatus(status.id, status.status)
      }
    }
  }
  
  res.sendStatus(200)
}
```

---

### Groq AI Integration

#### Configuración
```javascript
// groqConfig.js
import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY
})

export const groqConfig = {
  model: 'mixtral-8x7b-32768',
  temperature: 0.7,
  maxTokens: 2048
}
```

#### Chat Completion
```javascript
// Generar respuesta con contexto
export const generateResponse = async (message, context) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Eres un asistente de RRHH. Contexto: ${context}`
      },
      {
        role: 'user',
        content: message
      }
    ],
    model: groqConfig.model,
    temperature: groqConfig.temperature,
    max_tokens: groqConfig.maxTokens
  })
  
  return completion.choices[0].message.content
}
```

#### Embeddings para Búsqueda Semántica
```javascript
// Generar embeddings
export const generateEmbeddings = async (text) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY)
  
  const model = genAI.getGenerativeModel({ model: 'embedding-001' })
  const result = await model.embedContent(text)
  
  return result.embedding.values
}

// Búsqueda semántica
export const semanticSearch = async (query, companyId) => {
  // Generar embedding de la consulta
  const queryEmbedding = await generateEmbeddings(query)
  
  // Buscar en base de datos con pgvector
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
    company_id: companyId
  })
  
  return data
}
```

---


## 🚀 DEPLOYMENT

### Configuración de Entorno

#### Variables de Entorno (.env.production)
```bash
# ========================================
# CONFIGURACIÓN DE PRODUCCIÓN - STAFFHUB
# ========================================

# Puerto
PORT=4004

# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Entorno
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_GOOGLE_CLIENT_SECRET=your-client-secret
REACT_APP_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback

# Google Drive
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PROJECT_NUMBER=your-project-number

# Groq AI
REACT_APP_GROQ_API_KEY=your-groq-api-key

# Gemini (Embeddings)
REACT_APP_GEMINI_API_KEY=your-gemini-api-key

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Brevo (Email)
BREVO_API_KEY=your-brevo-api-key

# CORS
CORS_ALLOW_ALL=true

# Seguridad
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
MFA_ISSUER=StaffHub
```

---

### Docker Deployment

#### Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG PORT=4004
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_GROQ_API_KEY
ARG REACT_APP_GEMINI_API_KEY

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_ANON_KEY=${REACT_APP_SUPABASE_ANON_KEY}
ENV REACT_APP_GOOGLE_CLIENT_ID=${REACT_APP_GOOGLE_CLIENT_ID}
ENV REACT_APP_GROQ_API_KEY=${REACT_APP_GROQ_API_KEY}
ENV REACT_APP_GEMINI_API_KEY=${REACT_APP_GEMINI_API_KEY}

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar build y servidor
COPY --from=builder /app/build ./build
COPY --from=builder /app/server-simple.mjs ./

# Exponer puerto
EXPOSE ${PORT:-4004}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4004}/api/health || exit 1

# Iniciar servidor
CMD ["node", "server-simple.mjs"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  staffhub:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
        PORT: 4004
        REACT_APP_SUPABASE_URL: ${REACT_APP_SUPABASE_URL}
        REACT_APP_SUPABASE_ANON_KEY: ${REACT_APP_SUPABASE_ANON_KEY}
        REACT_APP_GOOGLE_CLIENT_ID: ${REACT_APP_GOOGLE_CLIENT_ID}
        REACT_APP_GROQ_API_KEY: ${REACT_APP_GROQ_API_KEY}
        REACT_APP_GEMINI_API_KEY: ${REACT_APP_GEMINI_API_KEY}
    ports:
      - "4004:4004"
    environment:
      - NODE_ENV=production
      - PORT=4004
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4004/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

### EasyPanel Deployment

#### Configuración en EasyPanel

**1. Build Arguments:**
```bash
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
PORT=4004
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GEMINI_API_KEY=your-gemini-key
REACT_APP_GROQ_API_KEY=your-groq-key
REACT_APP_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
GENERATE_SOURCEMAP=false
CI=false
ESLINT_NO_DEV_ERRORS=true
CORS_ALLOW_ALL=true
```

**2. Runtime Variables:**
```bash
NODE_ENV=production
PORT=4004
CORS_ALLOW_ALL=true
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_GEMINI_API_KEY=your-gemini-key
REACT_APP_GROQ_API_KEY=your-groq-key
```

**3. Configuración de Puerto:**
- Internal Port: 4004
- External Port: 80 o 443
- Protocol: HTTP (EasyPanel maneja HTTPS)

**4. Dominio:**
- Domain: your-domain.com
- SSL: Automático (Let's Encrypt)

---

### Netlify Deployment

#### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

---

### Vercel Deployment

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "REACT_APP_SUPABASE_URL": "@supabase-url",
    "REACT_APP_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

---

### CI/CD Pipeline (GitHub Actions)

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          REACT_APP_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build
          path: build/
      
      - name: Deploy to EasyPanel
        run: |
          # Trigger EasyPanel deployment
          curl -X POST ${{ secrets.EASYPANEL_WEBHOOK_URL }}
```

---


## 📝 GUÍA DE CONSTRUCCIÓN PASO A PASO

### Fase 1: Setup Inicial (Día 1)

#### 1.1 Crear Proyecto
```bash
# Crear proyecto React
npx create-react-app staffhub
cd staffhub

# Instalar dependencias principales
npm install @supabase/supabase-js react-router-dom
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react @heroicons/react
npm install axios date-fns clsx

# Configurar Tailwind
npx tailwindcss init -p
```

#### 1.2 Configurar Supabase
```bash
# 1. Crear proyecto en Supabase
# 2. Copiar URL y ANON_KEY
# 3. Crear archivo .env

# .env
REACT_APP_SUPABASE_URL=your-url
REACT_APP_SUPABASE_ANON_KEY=your-key
```

#### 1.3 Estructura Base
```bash
# Crear estructura de carpetas
mkdir -p src/{components,services,lib,hooks,contexts,utils,config,styles}
mkdir -p src/components/{auth,dashboard,employees,knowledge,communication}
mkdir -p database scripts
```

---

### Fase 2: Autenticación (Día 2-3)

#### 2.1 Configurar Supabase Client
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)
```

#### 2.2 Crear Auth Context
```javascript
// src/contexts/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

#### 2.3 Crear Componentes de Login
```javascript
// src/components/auth/LoginForm.js
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full px-4 py-2 border rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
        Login
      </button>
    </form>
  )
}
```

---

### Fase 3: Base de Datos (Día 4-5)

#### 3.1 Crear Tablas en Supabase
```sql
-- database/01_core_tables.sql

-- Empresas
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Empleados
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their companies"
  ON companies FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their employees"
  ON employees FOR ALL
  USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));
```

#### 3.2 Ejecutar en Supabase
```bash
# 1. Ir a Supabase Dashboard
# 2. SQL Editor
# 3. Copiar y ejecutar el SQL
```

---

### Fase 4: CRUD de Empleados (Día 6-8)

#### 4.1 Crear Servicio
```javascript
// src/services/employeeDataService.js
import { supabase } from '../lib/supabase'

export const employeeService = {
  async getAll(companyId) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(employee) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
```

#### 4.2 Crear Componentes
```javascript
// src/components/employees/EmployeeList.js
import { useState, useEffect } from 'react'
import { employeeService } from '../../services/employeeDataService'

export const EmployeeList = ({ companyId }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [companyId])

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll(companyId)
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {employees.map(employee => (
        <div key={employee.id} className="p-4 border rounded">
          <h3 className="font-bold">{employee.full_name}</h3>
          <p>{employee.position}</p>
          <p>{employee.email}</p>
        </div>
      ))}
    </div>
  )
}
```

---

### Fase 5: Dashboard y Analíticas (Día 9-11)

#### 5.1 Instalar Chart.js
```bash
npm install chart.js react-chartjs-2
```

#### 5.2 Crear Dashboard
```javascript
// src/components/dashboard/Dashboard.js
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useState, useEffect } from 'react'

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: []
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    // Cargar estadísticas desde Supabase
    const { data } = await supabase
      .from('employees')
      .select('*')
    
    setStats({
      totalEmployees: data.length,
      activeEmployees: data.filter(e => e.status === 'active').length,
      departments: [...new Set(data.map(e => e.department))]
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Total Empleados</h3>
        <p className="text-3xl font-bold">{stats.totalEmployees}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Empleados Activos</h3>
        <p className="text-3xl font-bold">{stats.activeEmployees}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Departamentos</h3>
        <p className="text-3xl font-bold">{stats.departments.length}</p>
      </div>
    </div>
  )
}
```

---

### Fase 6: Integraciones (Día 12-15)

#### 6.1 Google Drive
```bash
npm install googleapis
```

```javascript
// Implementar según sección de Integraciones
```

#### 6.2 WhatsApp
```bash
npm install axios
```

```javascript
// Implementar según sección de Integraciones
```

---

### Fase 7: Base de Conocimiento + IA (Día 16-20)

#### 7.1 Instalar dependencias
```bash
npm install groq-sdk @google/generative-ai
```

#### 7.2 Implementar embeddings
```javascript
// Implementar según sección de Base de Conocimiento
```

---

### Fase 8: Seguridad (Día 21-23)

#### 8.1 Implementar MFA
```javascript
// Implementar según sección de Seguridad
```

#### 8.2 Implementar RBAC
```javascript
// Implementar según sección de Seguridad
```

---

### Fase 9: Testing y Optimización (Día 24-26)

#### 9.1 Tests
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

#### 9.2 Optimización
- Code splitting
- Lazy loading
- Caching
- Performance monitoring

---

### Fase 10: Deployment (Día 27-30)

#### 10.1 Configurar Docker
```bash
# Crear Dockerfile
# Crear docker-compose.yml
```

#### 10.2 Deploy a EasyPanel
```bash
# Seguir guía de Deployment
```

---

## ✅ CHECKLIST FINAL

```
[ ] Autenticación funcionando
[ ] CRUD de empresas
[ ] CRUD de empleados
[ ] Dashboard con estadísticas
[ ] Base de conocimiento
[ ] Integraciones (Google Drive, WhatsApp)
[ ] IA y embeddings
[ ] Seguridad (MFA, RBAC, Encriptación)
[ ] Tests unitarios
[ ] Tests de integración
[ ] Optimización de performance
[ ] Documentación completa
[ ] Deployment en producción
[ ] Monitoreo y logs
[ ] Backup automático
```

---

## 📚 RECURSOS ADICIONALES

### Documentación
- [React](https://react.dev/)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Google Drive API](https://developers.google.com/drive)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Groq AI](https://console.groq.com/docs)

### Herramientas
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Meta Business Suite](https://business.facebook.com)
- [EasyPanel](https://easypanel.io)

---

## 🎯 CONCLUSIÓN

Este super prompt proporciona una guía completa para construir StaffHub desde cero, incluyendo:

✅ Arquitectura completa del sistema
✅ Stack tecnológico detallado
✅ Estructura de proyecto organizada
✅ Módulos principales con código
✅ Esquema de base de datos completo
✅ Servicios y APIs documentados
✅ Sistema de seguridad de 4 niveles
✅ Integraciones con servicios externos
✅ Guía de deployment paso a paso
✅ Plan de construcción de 30 días

**Tiempo estimado de desarrollo**: 30 días con 1 desarrollador full-time

**Resultado**: Sistema empresarial completo de gestión de RRHH listo para producción

---

**🚀 ¡Listo para construir StaffHub!**
