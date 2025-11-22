# Arquitectura de Sincronización Bidireccional: Supabase ↔ Google Drive ↔ StaffHub

## Overview

El sistema de sincronización bidireccional mantiene la consistencia de datos entre tres plataformas:
- **Supabase**: Base de datos principal (metadatos y relaciones)
- **Google Drive**: Almacenamiento de archivos y carpetas
- **StaffHub**: Interfaz de usuario y lógica de negocio

## Flujo de Sincronización Actual

### 1. Creación de Carpetas

#### Flujo Principal (StaffHub → Supabase → Google Drive)
```
Usuario en StaffHub
    ↓
googleDriveSyncService.createEmployeeFolderInDrive()
    ↓
1. Verificar si existe en Supabase
2. Si no existe, verificar en Google Drive
3. Crear carpeta en Google Drive (si es necesario)
4. Crear/actualizar registro en Supabase
    ↓
Respuesta con estado de sincronización
```

#### Estados de Sincronización
- `already_exists`: Carpeta existe en Supabase y Google Drive
- `existed_in_drive_created_in_supabase`: Existía en Drive, se crea registro en Supabase
- `updated_drive_id`: Se actualiza ID de Drive en Supabase
- `created_in_both`: Se crea nueva carpeta en ambos sistemas

### 2. Estructura de Datos

#### Supabase (employee_folders)
```sql
- id: UUID único
- employee_email: Email del empleado (clave única)
- employee_name: Nombre completo
- company_id: ID de la empresa
- company_name: Nombre de la empresa
- drive_folder_id: ID de la carpeta en Google Drive
- drive_folder_url: URL completa de la carpeta
- folder_status: 'active' | 'deleted' | 'sync_error'
- created_at: Timestamp de creación
- updated_at: Timestamp de última actualización
```

#### Google Drive (Estructura de Carpetas)
```
📁 Empleados - [Nombre Empresa]
    📁 [Nombre Empleado] (email@ejemplo.com)
        📄 Archivos del empleado
```

## Nuevas Funcionalidades Implementadas

### 1. Webhooks de Google Drive

El sistema ahora utiliza webhooks para recibir notificaciones de cambios en Google Drive:

```javascript
// Iniciar observación de cambios
await driveWebhookService.startWatching();

// Procesar notificación de cambio
await driveWebhookService.processChangeNotification(notification);
```

**Beneficios:**
- Detecta cambios realizados directamente en Google Drive
- Permite sincronización en tiempo real
- Reduce la necesidad de auditorías frecuentes

### 2. Triggers en Supabase

Se han implementado triggers para detectar cambios en la base de datos:

```sql
-- Trigger para eliminar carpetas
CREATE TRIGGER trigger_folder_deletion
  AFTER DELETE ON employee_folders
  FOR EACH ROW
  EXECUTE FUNCTION handle_folder_deletion();
```

**Funcionalidades:**
- Registra todas las acciones en un log de sincronización
- Notifica a Google Drive cuando se elimina una carpeta
- Maneja reactivaciones de carpetas eliminadas

### 3. Auditoría Periódica

El sistema ahora realiza auditorías periódicas para detectar inconsistencias:

```javascript
// Iniciar auditoría periódica
driveAuditService.startPeriodicAudit(60); // Cada 60 minutos

// Ejecutar auditoría manual
const results = await driveAuditService.runAudit();
```

**Capacidades:**
- Detecta carpetas que existen en Supabase pero no en Google Drive
- Identifica carpetas en Google Drive sin registro en Supabase
- Verifica permisos de acceso a las carpetas
- Calcula un puntaje de salud del sistema

### 4. Eliminación Sincronizada

Mejora en el proceso de eliminación para asegurar consistencia:

```javascript
// Eliminar carpeta de forma sincronizada
const result = await driveSyncDeletionService.deleteEmployeeFolder(
  employeeEmail, 
  true // Eliminar también de Google Drive
);
```

**Características:**
- Elimina la carpeta de Google Drive si se solicita
- Marca la carpeta como eliminada en Supabase (soft delete)
- Registra todas las acciones en un log
- Permite recuperar carpetas eliminadas
- Limpia automáticamente las carpetas antiguas

## Escenarios de Sincronización

### ✅ Escenario 1: Creación Exitosa
**Acción**: Usuario sincroniza un empleado nuevo
**Resultado**: 
- ✅ Carpeta creada en Google Drive
- ✅ Registro creado en Supabase
- ✅ StaffHub muestra la carpeta como activa

### ✅ Escenario 2: Detección de Duplicados
**Acción**: Usuario sincroniza un empleado ya existente
**Resultado**:
- ✅ No se crea carpeta duplicada
- ✅ Se reutiliza carpeta existente
- ✅ Se actualizan metadatos si es necesario

### ✅ Escenario 3: Inconsistencia Parcial
**Acción**: Existe carpeta en Drive pero no en Supabase
**Resultado**:
- ✅ Se crea registro en Supabase
- ✅ Se vincula con carpeta existente en Drive
- ✅ StaffHub muestra la carpeta como sincronizada

### ✅ Escenario 4: Eliminación en Google Drive
**Acción**: Usuario elimina carpeta directamente en Google Drive
**Resultado Actual**:
- ✅ Webhook detecta la eliminación
- ✅ Registro en Supabase se marca como eliminado
- ✅ StaffHub muestra carpeta como eliminada

### ✅ Escenario 5: Eliminación en Supabase
**Acción**: Usuario elimina registro en Supabase directamente
**Resultado Actual**:
- ✅ Trigger detecta la eliminación
- ✅ Se elimina la carpeta en Google Drive
- ✅ StaffHub no muestra la carpeta

## Servicios Implementados

### 1. DriveWebhookService

Gestiona la comunicación con Google Drive mediante webhooks:

```javascript
// Inicializar el servicio
await driveWebhookService.initialize();

// Iniciar observación de cambios
await driveWebhookService.startWatching();

// Detener observación
await driveWebhookService.stopWatching();
```

### 2. DriveAuditService

Realiza auditorías periódicas para detectar inconsistencias:

```javascript
// Inicializar el servicio
await driveAuditService.initialize();

// Iniciar auditoría periódica
driveAuditService.startPeriodicAudit(60); // Cada 60 minutos

// Ejecutar auditoría manual
const results = await driveAuditService.runAudit();
```

### 3. DriveSyncDeletionService

Maneja la eliminación sincronizada de carpetas:

```javascript
// Inicializar el servicio
await driveSyncDeletionService.initialize();

// Eliminar carpeta de forma sincronizada
const result = await driveSyncDeletionService.deleteEmployeeFolder(
  employeeEmail, 
  true // Eliminar también de Google Drive
);

// Recuperar carpeta eliminada
const recoveryResult = await driveSyncDeletionService.recoverEmployeeFolder(
  employeeEmail
);
```

### 4. DriveBidirectionalSyncService (Servicio Unificado)

Servicio que orquesta todos los componentes de sincronización para proporcionar una API unificada:

```javascript
// Inicializar el servicio con configuración personalizada
await driveBidirectionalSyncService.initialize({
  auditIntervalMinutes: 30,  // Auditoría cada 30 minutos
  retryAttempts: 5,          // Reintentar hasta 5 veces
  retryDelayMs: 2000,        // Retraso inicial de 2 segundos
  batchSize: 25,             // Procesar 25 empleados por lote
  enableNotifications: true, // Habilitar notificaciones
  notificationThrottleMs: 10000 // No notificar más de una vez cada 10 segundos
});

// Iniciar el servicio completo
await driveBidirectionalSyncService.start();

// Sincronizar un empleado específico
const result = await driveBidirectionalSyncService.syncEmployeeFolder(
  'juan.perez@empresa.com',
  {
    verifyPermissions: true,  // Verificar y corregir permisos
    updateMetadata: true      // Actualizar metadatos si es necesario
  }
);

// Sincronizar múltiples empleados en lotes
const results = await driveBidirectionalSyncService.syncEmployeeFoldersBatch(
  ['juan.perez@empresa.com', 'maria.gonzalez@empresa.com', 'carlos.rodriguez@empresa.com'],
  {
    batchSize: 30,  // Procesar 30 empleados por lote
    verifyPermissions: true,
    updateMetadata: true
  }
);

// Ejecutar una auditoría completa
const auditResults = await driveBidirectionalSyncService.runFullAudit();

// Eliminar una carpeta de forma sincronizada
const deletionResult = await driveBidirectionalSyncService.deleteEmployeeFolder(
  'juan.perez@empresa.com',
  true // Eliminar también de Google Drive
);

// Obtener estadísticas del servicio
const stats = driveBidirectionalSyncService.getStats();
```

**Características:**
- Orquesta todos los servicios de sincronización sin modificar el código existente
- Implementa reintentos con backoff exponencial para mejorar la robustez
- Optimiza el rendimiento mediante procesamiento en lotes y control de concurrencia
- Proporciona estadísticas detalladas del estado del sistema
- Incluye un sistema de notificaciones para eventos importantes
- Ofrece corrección automática de problemas detectados durante las auditorías

## Configuración

### Variables de Entorno

```env
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=tu_client_secret
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
REACT_APP_WEBHOOK_URL=http://localhost:3000/api/webhooks/drive
```

### Tablas de Base de Datos

Se han añadido las siguientes tablas para soportar la sincronización bidireccional:

```sql
-- Tabla para registrar el log de sincronización
CREATE TABLE drive_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  source TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar los tokens de sincronización
CREATE TABLE drive_sync_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_page_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar los canales de webhook
CREATE TABLE drive_webhook_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT UNIQUE NOT NULL,
  resource_id TEXT,
  webhook_url TEXT,
  expiration TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registrar el log de eliminaciones
CREATE TABLE drive_deletion_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registrar resultados de auditorías
CREATE TABLE drive_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_timestamp TIMESTAMP WITH TIME ZONE,
  audit_duration INTEGER,
  total_issues INTEGER,
  health_score INTEGER,
  audit_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registrar errores de sincronización
CREATE TABLE drive_sync_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_email TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registrar notificaciones
CREATE TABLE drive_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Monitoreo y Logging

### Logs Actuales

```javascript
logger.info('GoogleDriveSyncService', `📁 Procesando carpeta para ${employeeEmail}...`)
logger.info('GoogleDriveSyncService', `✅ Carpeta ya existe en Supabase: ${existingFolder.id}`)
logger.warn('GoogleDriveSyncService', `⚠️ Carpeta existe en Supabase pero no en Drive, recreando...`)
```

### Nuevos Logs

```javascript
logger.info('DriveWebhookService', `📨 Procesando notificación de cambio...`)
logger.info('DriveAuditService', `🔍 Iniciando auditoría completa...`)
logger.info('DriveSyncDeletionService', `🗑️ Iniciando eliminación sincronizada para ${employeeEmail}`)
logger.info('DriveBidirectionalSyncService', `🚀 Iniciando sincronización bidireccional...`)
```

### Métricas Recomendadas

- Tiempo de sincronización por carpeta
- Tasa de éxito/fracaso
- Número de inconsistencias detectadas
- Carpetas recuperadas automáticamente
- Latencia de webhooks
- Efectividad de la auditoría
- Estadísticas del servicio unificado (operaciones totales, exitosas, fallidas)
- Tiempo promedio de sincronización
- Efectividad de la corrección automática

## Conclusión

El sistema de sincronización bidireccional implementado resuelve los problemas identificados en la versión anterior:

1. **Sincronización Bidireccional**: Ahora detecta cambios en ambas direcciones
2. **Manejo de Eliminación**: Implementa eliminación sincronizada y recuperación
3. **Detección de Conflictos**: Auditoría periódica para identificar inconsistencias
4. **Recuperación Automática**: Sistema para recuperar carpetas huérfanas
5. **Servicio Unificado**: API simplificada que orquesta todos los componentes

El servicio unificado `DriveBidirectionalSyncService` proporciona una capa de abstracción que mejora la integración, el manejo de errores y el rendimiento del sistema, sin modificar el código existente. Ofrece características avanzadas como reintentos con backoff exponencial, procesamiento en lotes, control de concurrencia y corrección automática de problemas.

Con estas mejoras, el sistema es completamente robusto y maneja todos los escenarios posibles de sincronización, asegurando la consistencia de datos entre Supabase, Google Drive y StaffHub.