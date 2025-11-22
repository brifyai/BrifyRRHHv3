# Ejemplo de Uso: Servicio de Sincronización Bidireccional

## Introducción

Este documento proporciona ejemplos detallados de cómo utilizar el servicio de sincronización bidireccional para mantener la consistencia entre Supabase, Google Drive y StaffHub.

## Inicialización del Servicio

```javascript
import driveBidirectionalSyncService from './src/lib/driveBidirectionalSyncService.js';

// Configuración personalizada (opcional)
const config = {
  auditIntervalMinutes: 30,  // Auditoría cada 30 minutos
  retryAttempts: 5,          // Reintentar hasta 5 veces
  retryDelayMs: 2000,        // Retraso inicial de 2 segundos
  batchSize: 25,             // Procesar 25 empleados por lote
  enableNotifications: true, // Habilitar notificaciones
  notificationThrottleMs: 10000 // No notificar más de una vez cada 10 segundos
};

// Inicializar el servicio
async function initializeSyncService() {
  try {
    await driveBidirectionalSyncService.initialize(config);
    console.log('Servicio de sincronización inicializado correctamente');
  } catch (error) {
    console.error('Error inicializando el servicio:', error);
  }
}
```

## Iniciar y Detener la Sincronización

```javascript
// Iniciar el servicio completo
async function startSyncService() {
  try {
    await driveBidirectionalSyncService.start();
    console.log('Sincronización bidireccional iniciada');
  } catch (error) {
    console.error('Error iniciando la sincronización:', error);
  }
}

// Detener el servicio
async function stopSyncService() {
  try {
    await driveBidirectionalSyncService.stop();
    console.log('Sincronización bidireccional detenida');
  } catch (error) {
    console.error('Error deteniendo la sincronización:', error);
  }
}
```

## Sincronización Individual

```javascript
// Sincronizar un empleado específico
async function syncEmployee(employeeEmail) {
  try {
    const result = await driveBidirectionalSyncService.syncEmployeeFolder(
      employeeEmail,
      {
        verifyPermissions: true,  // Verificar y corregir permisos
        updateMetadata: true      // Actualizar metadatos si es necesario
      }
    );
    
    console.log(`Sincronización completada para ${employeeEmail}:`, result);
    return result;
  } catch (error) {
    console.error(`Error sincronizando ${employeeEmail}:`, error);
    throw error;
  }
}

// Ejemplo de uso
syncEmployee('juan.perez@empresa.com');
```

## Sincronización en Lotes

```javascript
// Sincronizar múltiples empleados en lotes
async function syncMultipleEmployees(employeeEmails) {
  try {
    const results = await driveBidirectionalSyncService.syncEmployeeFoldersBatch(
      employeeEmails,
      {
        batchSize: 30,  // Procesar 30 empleados por lote
        verifyPermissions: true,
        updateMetadata: true
      }
    );
    
    console.log('Resultados de sincronización en lotes:', results);
    return results;
  } catch (error) {
    console.error('Error en sincronización en lotes:', error);
    throw error;
  }
}

// Ejemplo de uso
const employeeEmails = [
  'juan.perez@empresa.com',
  'maria.gonzalez@empresa.com',
  'carlos.rodriguez@empresa.com',
  // ... más empleados
];

syncMultipleEmployees(employeeEmails);
```

## Auditoría del Sistema

```javascript
// Ejecutar una auditoría completa
async function runSystemAudit() {
  try {
    const auditResults = await driveBidirectionalSyncService.runFullAudit();
    
    console.log('Resultados de la auditoría:', auditResults);
    console.log(`Problemas encontrados: ${auditResults.summary.totalIssues}`);
    console.log(`Problemas solucionados automáticamente: ${auditResults.autoFixed}`);
    
    // Analizar problemas específicos
    if (auditResults.supabaseVsDrive.missingInDrive.length > 0) {
      console.log('Carpetas faltantes en Google Drive:', auditResults.supabaseVsDrive.missingInDrive);
    }
    
    if (auditResults.driveVsSupabase.missingInSupabase.length > 0) {
      console.log('Carpetas faltantes en Supabase:', auditResults.driveVsSupabase.missingInSupabase);
    }
    
    if (auditResults.permissions.missingPermissions.length > 0) {
      console.log('Permisos faltantes:', auditResults.permissions.missingPermissions);
    }
    
    return auditResults;
  } catch (error) {
    console.error('Error en auditoría:', error);
    throw error;
  }
}

// Ejemplo de uso
runSystemAudit();
```

## Eliminación de Carpetas

```javascript
// Eliminar una carpeta de empleado
async function deleteEmployeeFolder(employeeEmail, deleteFromDrive = true) {
  try {
    const result = await driveBidirectionalSyncService.deleteEmployeeFolder(
      employeeEmail,
      deleteFromDrive
    );
    
    console.log(`Carpeta eliminada para ${employeeEmail}:`, result);
    return result;
  } catch (error) {
    console.error(`Error eliminando carpeta para ${employeeEmail}:`, error);
    throw error;
  }
}

// Ejemplo de uso
deleteEmployeeFolder('juan.perez@empresa.com', true); // Eliminar también de Google Drive
```

## Monitoreo y Estadísticas

```javascript
// Obtener estadísticas del servicio
function getSyncStats() {
  const stats = driveBidirectionalSyncService.getStats();
  
  console.log('Estado del servicio:', {
    Inicializado: stats.isInitialized,
    En ejecución: stats.isRunning,
    Total de sincronizaciones: stats.totalSyncs,
    Sincronizaciones exitosas: stats.successfulSyncs,
    Sincronizaciones fallidas: stats.failedSyncs,
    Última sincronización: stats.lastSyncTime,
    Tiempo promedio de sincronización: `${stats.averageSyncTime.toFixed(2)}ms`
  });
  
  return stats;
}

// Ejemplo de uso
getSyncStats();

// También se puede acceder al estado de los servicios individuales
console.log('Estado del servicio de webhooks:', stats.services.webhook);
console.log('Estado del servicio de auditoría:', stats.services.audit);
console.log('Estado del servicio de eliminación:', stats.services.deletion);
```

## Integración en Componentes React

```jsx
import React, { useEffect, useState } from 'react';
import driveBidirectionalSyncService from '../lib/driveBidirectionalSyncService';

function SyncDashboard() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState(null);
  const [auditResults, setAuditResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar el servicio al montar el componente
  useEffect(() => {
    const initializeService = async () => {
      try {
        setLoading(true);
        await driveBidirectionalSyncService.initialize();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(`Error inicializando el servicio: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initializeService();
  }, []);

  // Iniciar sincronización
  const handleStartSync = async () => {
    try {
      setLoading(true);
      await driveBidirectionalSyncService.start();
      setIsRunning(true);
      setError(null);
    } catch (err) {
      setError(`Error iniciando la sincronización: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Detener sincronización
  const handleStopSync = async () => {
    try {
      setLoading(true);
      await driveBidirectionalSyncService.stop();
      setIsRunning(false);
      setError(null);
    } catch (err) {
      setError(`Error deteniendo la sincronización: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar auditoría
  const handleRunAudit = async () => {
    try {
      setLoading(true);
      const results = await driveBidirectionalSyncService.runFullAudit();
      setAuditResults(results);
      setError(null);
    } catch (err) {
      setError(`Error ejecutando auditoría: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estadísticas
  const handleRefreshStats = () => {
    const currentStats = driveBidirectionalSyncService.getStats();
    setStats(currentStats);
  };

  // Sincronizar empleado específico
  const handleSyncEmployee = async (email) => {
    try {
      setLoading(true);
      await driveBidirectionalSyncService.syncEmployeeFolder(email);
      setError(null);
      handleRefreshStats(); // Actualizar estadísticas
    } catch (err) {
      setError(`Error sincronizando empleado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar la interfaz
  return (
    <div className="sync-dashboard">
      <h2>Panel de Sincronización Bidireccional</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="status-section">
        <h3>Estado del Servicio</h3>
        <div>
          <strong>Inicializado:</strong> {isInitialized ? 'Sí' : 'No'}
        </div>
        <div>
          <strong>En ejecución:</strong> {isRunning ? 'Sí' : 'No'}
        </div>
        <div>
          <strong>Cargando:</strong> {loading ? 'Sí' : 'No'}
        </div>
      </div>
      
      <div className="controls-section">
        <h3>Controles</h3>
        <button 
          onClick={handleStartSync} 
          disabled={!isInitialized || isRunning || loading}
        >
          Iniciar Sincronización
        </button>
        <button 
          onClick={handleStopSync} 
          disabled={!isRunning || loading}
        >
          Detener Sincronización
        </button>
        <button 
          onClick={handleRunAudit} 
          disabled={!isInitialized || loading}
        >
          Ejecutar Auditoría
        </button>
        <button 
          onClick={handleRefreshStats} 
          disabled={!isInitialized || loading}
        >
          Actualizar Estadísticas
        </button>
      </div>
      
      {stats && (
        <div className="stats-section">
          <h3>Estadísticas</h3>
          <div>Total de sincronizaciones: {stats.totalSyncs}</div>
          <div>Sincronizaciones exitosas: {stats.successfulSyncs}</div>
          <div>Sincronizaciones fallidas: {stats.failedSyncs}</div>
          <div>Tiempo promedio: {stats.averageSyncTime.toFixed(2)}ms</div>
          {stats.lastSyncTime && (
            <div>Última sincronización: {new Date(stats.lastSyncTime).toLocaleString()}</div>
          )}
        </div>
      )}
      
      {auditResults && (
        <div className="audit-section">
          <h3>Resultados de Auditoría</h3>
          <div>Total de problemas: {auditResults.summary.totalIssues}</div>
          <div>Problemas solucionados: {auditResults.autoFixed}</div>
          <div>Puntaje de salud: {auditResults.summary.healthScore}/100</div>
          
          {auditResults.supabaseVsDrive.missingInDrive.length > 0 && (
            <div>
              <h4>Carpetas faltantes en Google Drive:</h4>
              <ul>
                {auditResults.supabaseVsDrive.missingInDrive.map((item, index) => (
                  <li key={index}>
                    {item.employeeEmail} - {item.reason}
                    <button 
                      onClick={() => handleSyncEmployee(item.employeeEmail)}
                      disabled={loading}
                    >
                      Sincronizar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {auditResults.driveVsSupabase.missingInSupabase.length > 0 && (
            <div>
              <h4>Carpetas faltantes en Supabase:</h4>
              <ul>
                {auditResults.driveVsSupabase.missingInSupabase.map((item, index) => (
                  <li key={index}>
                    {item.employeeEmail} - {item.reason}
                    <button 
                      onClick={() => handleSyncEmployee(item.employeeEmail)}
                      disabled={loading}
                    >
                      Sincronizar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="manual-sync-section">
        <h3>Sincronización Manual</h3>
        <EmployeeSyncForm onSync={handleSyncEmployee} loading={loading} />
      </div>
    </div>
  );
}

// Componente para sincronización manual de empleados
function EmployeeSyncForm({ onSync, loading }) {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const syncResult = await onSync(email);
      setResult(syncResult);
      setEmail('');
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email del empleado"
        disabled={loading}
        required
      />
      <button type="submit" disabled={!email || loading}>
        Sincronizar Empleado
      </button>
      
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.success 
            ? `Sincronización completada en ${result.duration}ms` 
            : `Error: ${result.error || result.message}`}
        </div>
      )}
    </form>
  );
}

export default SyncDashboard;
```

## Consideraciones Importantes

1. **Manejo de Errores**: Siempre envuelve las llamadas al servicio en bloques try/catch para manejar errores adecuadamente.

2. **Rendimiento**: Para grandes volúmenes de datos, utiliza la sincronización en lotes en lugar de sincronizaciones individuales.

3. **Monitoreo**: Implementa un sistema de monitoreo para seguir el estado del servicio y detectar problemas.

4. **Configuración**: Ajusta la configuración según las necesidades específicas de tu entorno.

5. **Seguridad**: Asegúrate de que el servicio tenga los permisos adecuados para acceder a Supabase y Google Drive.

## Conclusión

El servicio de sincronización bidireccional proporciona una solución robusta para mantener la consistencia entre Supabase, Google Drive y StaffHub. Con estos ejemplos, deberías poder integrar y utilizar el servicio eficazmente en tu aplicación.