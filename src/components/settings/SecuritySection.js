import React from 'react'
import {
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const SecuritySection = ({
  securitySettings,
  activeSessions,
  securityLogs,
  backupSettings,
  onSecuritySettingsChange,
  onToggle2FA,
  onCloseSession,
  onCreateBackup,
  onDownloadBackup,
  onSaveBackupSettings
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuración de Seguridad</h2>
          <p className="text-gray-600 mt-1">Gestiona la seguridad y permisos del sistema</p>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
          Seguridad
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autenticación de Dos Factores */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mr-4">
              <BuildingStorefrontIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Autenticación de Dos Factores</h3>
              <p className="text-sm text-gray-600">Aumenta la seguridad de tu cuenta</p>
            </div>
          </div>

          <div className="space-y-4">
            {securitySettings.twoFactorEnabled ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-800">2FA Activado</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Método: {securitySettings.twoFactorMethod === 'app' ? 'Aplicación' :
                           securitySettings.twoFactorMethod === 'sms' ? 'SMS' : 'Email'}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">2FA Desactivado</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Activa 2FA para mayor seguridad</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de 2FA</label>
                <select
                  value={securitySettings.twoFactorMethod}
                  onChange={(e) => onSecuritySettingsChange('twoFactorMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="app">Aplicación (Google Authenticator)</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <button
                onClick={onToggle2FA}
                className={`w-full px-4 py-2 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                  securitySettings.twoFactorEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                }`}
              >
                {securitySettings.twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
              </button>
            </div>
          </div>
        </div>

        {/* Sesiones Activas */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Sesiones Activas</h3>
              <p className="text-sm text-gray-600">Gestiona tus sesiones activas</p>
            </div>
          </div>

          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className={`rounded-lg p-4 ${session.current ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.current ? 'Sesión Actual' : 'Otra Sesión'}
                    </p>
                    <p className="text-xs text-gray-600">{session.device} • {session.location}</p>
                    <p className="text-xs text-gray-500">
                      Última actividad: {session.current ? 'hace 2 minutos' : `${Math.floor((Date.now() - session.lastActivity) / (1000 * 60))} minutos atrás`}
                    </p>
                    <p className="text-xs text-gray-400">IP: {session.ip}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.current
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.current ? 'Activa' : 'Inactiva'}
                    </span>
                    {!session.current && (
                      <button
                        onClick={() => onCloseSession(session.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Cerrar sesión"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Simular refresh de sesiones
                  onSecuritySettingsChange('refreshSessions', true)
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300"
              >
                Actualizar
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                Ver Todas las Sesiones
              </button>
            </div>
          </div>
        </div>

        {/* Logs de Seguridad */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mr-4">
              <Cog6ToothIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Logs de Seguridad</h3>
              <p className="text-sm text-gray-600">Historial de actividades de seguridad</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {securityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-600">{log.details}</p>
                      <p className="text-xs text-gray-400">IP: {log.ip}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onSecuritySettingsChange('refreshLogs', true)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300"
              >
                Actualizar
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                Ver Todos los Logs
              </button>
            </div>
          </div>
        </div>

        {/* Backup y Recuperación */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
              <PuzzlePieceIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Backup y Recuperación</h3>
              <p className="text-sm text-gray-600">Gestiona copias de seguridad</p>
            </div>
          </div>

          <div className="space-y-4">
            {backupSettings.lastBackup ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Último backup</p>
                    <p className="text-xs text-blue-600">
                      {new Date(backupSettings.lastBackup).toLocaleDateString('es-ES')} • {backupSettings.backupSize || '2.3 GB'}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Sin backups recientes</p>
                    <p className="text-xs text-yellow-600">Crea tu primer backup para proteger tus datos</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onCreateBackup}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
              >
                Crear Backup
              </button>
              <button
                onClick={onDownloadBackup}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-xl transition-all duration-300 text-sm"
              >
                Descargar
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-backup"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={backupSettings.autoBackup}
                  onChange={(e) => onSecuritySettingsChange('autoBackup', e.target.checked)}
                />
                <label htmlFor="auto-backup" className="ml-2 block text-sm text-gray-900">
                  Backup automático semanal
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Backup</label>
                <select
                  value={backupSettings.backupFrequency}
                  onChange={(e) => onSecuritySettingsChange('backupFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retención (días)</label>
                <input
                  type="number"
                  value={backupSettings.retentionDays}
                  onChange={(e) => onSecuritySettingsChange('retentionDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="365"
                />
              </div>
            </div>

            <button
              onClick={onSaveBackupSettings}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecuritySection