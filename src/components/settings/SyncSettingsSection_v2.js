import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import driveBidirectionalSyncActivator from '../../lib/driveBidirectionalSyncActivator.js';
import googleDriveConsolidatedService from '../../lib/googleDriveConsolidated.js';
import logger from '../../lib/logger.js';

/**
 * Componente para gestionar la sincronización bidireccional de Google Drive
 * VERSIÓN CORREGIDA - Soluciona error getAuthStatus undefined
 */
const SyncSettingsSection = ({ selectedCompanyId }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStats, setSyncStats] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [authStatus, setAuthStatus] = useState({ isAuthenticated: false, hasValidToken: false });
  
  // Configuración
  const [config, setConfig] = useState({
    // Configuración de la base de datos
    applySoftDelete: true,
    applyTriggers: true,
    applyIndexes: true,
    applyViews: true,
    applyFunctions: true,
    
    // Configuración del servicio
    auditIntervalMinutes: 60,
    retryAttempts: 3,
    retryDelayMs: 1000,
    batchSize: 50,
    enableNotifications: true,
    notificationThrottleMs: 5000,
    
    // Configuración de webhooks
    renewBeforeExpiration: true,
    renewalBufferMinutes: 60,
    maxRetries: 3,
    
    // Configuración de auditoría
    checkPermissions: true,
    autoFixIssues: true,
    detailedLogging: true
  });

  // Cargar estado actual al montar el componente
  useEffect(() => {
    loadSyncStatus();
  }, []);

  /**
   * Carga el estado actual de la sincronización
   */
  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ CORREGIDO: Usar método directo sin authService
      const authStatus = await googleDriveConsolidatedService.getAuthStatus(user.id);
      setAuthStatus(authStatus);
      
      if (!authStatus.isAuthenticated) {
        setError('Google Drive no está autenticado. Por favor, conecta tu cuenta de Google Drive primero.');
        setIsLoading(false);
        return;
      }
      
      // Obtener estado del servicio para la empresa específica
      const status = driveBidirectionalSyncActivator.getSyncStatus(selectedCompanyId);
      
      setIsActivated(status.isActivated);
      setIsRunning(status.isRunning);
      setIsInitialized(status.isInitialized);
      setSyncStats(status.stats);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('SyncSettingsSection', `Error cargando estado: ${error.message}`);
      setError(`Error cargando estado: ${error.message}`);
      setIsLoading(false);
    }
  };

  /**
   * Activa la sincronización bidireccional
   */
  const handleActivate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Activar sincronización
      const result = await driveBidirectionalSyncActivator.activate(config);
      
      if (result.success) {
        setIsActivated(true);
        setIsRunning(true);
        setIsInitialized(true);
        setSyncStats(result.stats);
        setSuccess('Sincronización bidireccional activada correctamente');
      } else {
        setError(`Error activando sincronización: ${result.error}`);
      }
      
      setIsLoading(false);
    } catch (error) {
      logger.error('SyncSettingsSection', `Error activando sincronización: ${error.message}`);
      setError(`Error activando sincronización: ${error.message}`);
      setIsLoading(false);
    }
  };

  /**
   * Desactiva la sincronización bidireccional
   */
  const handleDeactivate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Desactivar sincronización
      const result = await driveBidirectionalSyncActivator.deactivate();
      
      if (result.success) {
        setIsActivated(false);
        setIsRunning(false);
        setIsInitialized(false);
        setSyncStats(null);
        setSuccess('Sincronización bidireccional desactivada correctamente');
      } else {
        setError(`Error desactivando sincronización: ${result.error}`);
      }
      
      setIsLoading(false);
    } catch (error) {
      logger.error('SyncSettingsSection', `Error desactivando sincronización: ${error.message}`);
      setError(`Error desactivando sincronización: ${error.message}`);
      setIsLoading(false);
    }
  };

  /**
   * Ejecuta una auditoría manual
   */
  const handleRunAudit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Importar el servicio de sincronización
      const { default: driveBidirectionalSyncService } = await import('../../lib/driveBidirectionalSyncService.js');
      
      // Ejecutar auditoría
      const auditResult = await driveBidirectionalSyncService.runFullAudit();
      
      setSuccess(`Auditoría completada: ${auditResult.summary.totalIssues} problemas encontrados, ${auditResult.autoFixed} solucionados automáticamente`);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('SyncSettingsSection', `Error ejecutando auditoría: ${error.message}`);
      setError(`Error ejecutando auditoría: ${error.message}`);
      setIsLoading(false);
    }
  };

  /**
   * Maneja cambios en la configuración
   */
  const handleConfigChange = (key, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Sincronización Bidireccional de Google Drive</h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
            <p>{success}</p>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Estado Actual</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estado:</p>
                <p className="font-medium">
                  {isActivated ? 'Activado' : 'Desactivado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Funcionamiento:</p>
                <p className="font-medium">
                  {isRunning ? 'En ejecución' : 'Detenido'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inicialización:</p>
                <p className="font-medium">
                  {isInitialized ? 'Completada' : 'Pendiente'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Autenticación:</p>
                <p className="font-medium">
                  {authStatus.isAuthenticated ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Configuración</h3>
          <div className="bg-gray-50 p-4 rounded-md space-y-4">
            <div>
              <h4 className="font-medium mb-2">Base de Datos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applySoftDelete"
                    checked={config.applySoftDelete}
                    onChange={(e) => handleConfigChange('applySoftDelete', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="applySoftDelete" className="ml-2 block text-sm text-gray-700">
                    Aplicar Soft Delete
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applyTriggers"
                    checked={config.applyTriggers}
                    onChange={(e) => handleConfigChange('applyTriggers', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="applyTriggers" className="ml-2 block text-sm text-gray-700">
                    Aplicar Triggers
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applyIndexes"
                    checked={config.applyIndexes}
                    onChange={(e) => handleConfigChange('applyIndexes', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="applyIndexes" className="ml-2 block text-sm text-gray-700">
                    Aplicar Índices
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applyViews"
                    checked={config.applyViews}
                    onChange={(e) => handleConfigChange('applyViews', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="applyViews" className="ml-2 block text-sm text-gray-700">
                    Aplicar Vistas
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applyFunctions"
                    checked={config.applyFunctions}
                    onChange={(e) => handleConfigChange('applyFunctions', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="applyFunctions" className="ml-2 block text-sm text-gray-700">
                    Aplicar Funciones
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Servicio</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="auditIntervalMinutes" className="block text-sm text-gray-700 mb-1">
                    Intervalo de Auditoría (minutos)
                  </label>
                  <input
                    type="number"
                    id="auditIntervalMinutes"
                    value={config.auditIntervalMinutes}
                    onChange={(e) => handleConfigChange('auditIntervalMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1440"
                  />
                </div>
                <div>
                  <label htmlFor="retryAttempts" className="block text-sm text-gray-700 mb-1">
                    Intentos de Reintento
                  </label>
                  <input
                    type="number"
                    id="retryAttempts"
                    value={config.retryAttempts}
                    onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label htmlFor="retryDelayMs" className="block text-sm text-gray-700 mb-1">
                    Retraso entre Reintentos (ms)
                  </label>
                  <input
                    type="number"
                    id="retryDelayMs"
                    value={config.retryDelayMs}
                    onChange={(e) => handleConfigChange('retryDelayMs', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="10000"
                    step="100"
                  />
                </div>
                <div>
                  <label htmlFor="batchSize" className="block text-sm text-gray-700 mb-1">
                    Tamaño de Lote
                  </label>
                  <input
                    type="number"
                    id="batchSize"
                    value={config.batchSize}
                    onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableNotifications"
                    checked={config.enableNotifications}
                    onChange={(e) => handleConfigChange('enableNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-700">
                    Habilitar Notificaciones
                  </label>
                </div>
                <div>
                  <label htmlFor="notificationThrottleMs" className="block text-sm text-gray-700 mb-1">
                    Throttle de Notificaciones (ms)
                  </label>
                  <input
                    type="number"
                    id="notificationThrottleMs"
                    value={config.notificationThrottleMs}
                    onChange={(e) => handleConfigChange('notificationThrottleMs', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1000"
                    max="60000"
                    step="1000"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Webhooks</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="renewBeforeExpiration"
                    checked={config.renewBeforeExpiration}
                    onChange={(e) => handleConfigChange('renewBeforeExpiration', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="renewBeforeExpiration" className="ml-2 block text-sm text-gray-700">
                    Renovar antes de Expiración
                  </label>
                </div>
                <div>
                  <label htmlFor="renewalBufferMinutes" className="block text-sm text-gray-700 mb-1">
                    Buffer de Renovación (minutos)
                  </label>
                  <input
                    type="number"
                    id="renewalBufferMinutes"
                    value={config.renewalBufferMinutes}
                    onChange={(e) => handleConfigChange('renewalBufferMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1440"
                  />
                </div>
                <div>
                  <label htmlFor="maxRetries" className="block text-sm text-gray-700 mb-1">
                    Máximo de Reintentos
                  </label>
                  <input
                    type="number"
                    id="maxRetries"
                    value={config.maxRetries}
                    onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Auditoría</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="checkPermissions"
                    checked={config.checkPermissions}
                    onChange={(e) => handleConfigChange('checkPermissions', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="checkPermissions" className="ml-2 block text-sm text-gray-700">
                    Verificar Permisos
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoFixIssues"
                    checked={config.autoFixIssues}
                    onChange={(e) => handleConfigChange('autoFixIssues', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoFixIssues" className="ml-2 block text-sm text-gray-700">
                    Auto-corregir Problemas
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="detailedLogging"
                    checked={config.detailedLogging}
                    onChange={(e) => handleConfigChange('detailedLogging', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="detailedLogging" className="ml-2 block text-sm text-gray-700">
                    Registro Detallado
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div>
            {!isActivated ? (
              <button
                onClick={handleActivate}
                disabled={isLoading || !authStatus.isAuthenticated}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Activando...' : 'Activar Sincronización'}
              </button>
            ) : (
              <button
                onClick={handleDeactivate}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Desactivando...' : 'Desactivar Sincronización'}
              </button>
            )}
          </div>
          
          <div>
            <button
              onClick={handleRunAudit}
              disabled={isLoading || !isActivated}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Ejecutando...' : 'Ejecutar Auditoría'}
            </button>
          </div>
        </div>
      </div>
      
      {syncStats && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Estadísticas de Sincronización</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-600">Total Sincronizaciones</p>
              <p className="text-2xl font-bold text-blue-800">{syncStats.totalSyncs || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-600">Exitosas</p>
              <p className="text-2xl font-bold text-green-800">{syncStats.successfulSyncs || 0}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-600">Fallidas</p>
              <p className="text-2xl font-bold text-red-800">{syncStats.failedSyncs || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-600">Tiempo Promedio (ms)</p>
              <p className="text-2xl font-bold text-yellow-800">{Math.round(syncStats.averageSyncTime || 0)}</p>
            </div>
          </div>
          
          {syncStats.lastSyncTime && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Última Sincronización:</p>
              <p className="font-medium">{new Date(syncStats.lastSyncTime).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncSettingsSection;