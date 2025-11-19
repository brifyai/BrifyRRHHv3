import React from 'react'
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  PlusIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const NotificationsSection = ({
  notificationSettings,
  onEmailNotificationChange,
  onReportsSettingsChange,
  onSoundSettingsChange,
  onSaveEmailPreferences,
  onAddEmailRecipient,
  onRemoveEmailRecipient,
  onScheduleReports,
  onTestSounds
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuración de Notificaciones</h2>
          <p className="text-gray-600 mt-1">Gestiona cómo y cuándo recibir notificaciones</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
          Notificaciones
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones por Email */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Notificaciones por Email</h3>
              <p className="text-sm text-gray-600">Configura alertas por correo electrónico</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Mensajes enviados</h4>
                <p className="text-xs text-gray-600">Notificaciones cuando se envían mensajes</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.email.messagesSent}
                onChange={(e) => onEmailNotificationChange('messagesSent', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Errores del sistema</h4>
                <p className="text-xs text-gray-600">Alertas de errores críticos</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.email.systemErrors}
                onChange={(e) => onEmailNotificationChange('systemErrors', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Reportes semanales</h4>
                <p className="text-xs text-gray-600">Resúmenes de actividad semanal</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.email.weeklyReports}
                onChange={(e) => onEmailNotificationChange('weeklyReports', e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Límites de uso</h4>
                <p className="text-xs text-gray-600">Cuando se acerca al límite de tokens</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.email.tokenLimits}
                onChange={(e) => onEmailNotificationChange('tokenLimits', e.target.checked)}
              />
            </div>

            <button
              onClick={onSaveEmailPreferences}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Guardar Preferencias de Email
            </button>
          </div>
        </div>

        {/* Programación de Reportes */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mr-4">
              <Cog6ToothIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Reportes Automáticos</h3>
              <p className="text-sm text-gray-600">Programación de reportes periódicos</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Reportes</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={notificationSettings.reports.frequency}
                onChange={(e) => onReportsSettingsChange('frequency', e.target.value)}
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="never">Nunca</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinatarios</label>
              <div className="space-y-2">
                {notificationSettings.reports.recipients.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={email}
                      onChange={(e) => {
                        const updatedRecipients = [...notificationSettings.reports.recipients]
                        updatedRecipients[index] = e.target.value
                        onReportsSettingsChange('recipients', updatedRecipients)
                      }}
                      placeholder="email@empresa.com"
                    />
                    <button
                      onClick={() => onRemoveEmailRecipient(email)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover email"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={onAddEmailRecipient}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar Destinatario
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {notificationSettings.reports.recipients.length} destinatario{notificationSettings.reports.recipients.length !== 1 ? 's' : ''} configurado{notificationSettings.reports.recipients.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-charts"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.reports.includeCharts}
                onChange={(e) => onReportsSettingsChange('includeCharts', e.target.checked)}
              />
              <label htmlFor="include-charts" className="ml-2 block text-sm text-gray-900">
                Incluir gráficos en reportes
              </label>
            </div>

            <button
              onClick={onScheduleReports}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              💾 Guardar y Ir a Reportes
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Las configuraciones se aplicarán en la página de informes
            </p>
          </div>
        </div>

        {/* Configuración de Sonido */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
              <Cog6ToothIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Sonidos y Alertas</h3>
              <p className="text-sm text-gray-600">Configura sonidos de notificación</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Sonidos activados</h4>
                <p className="text-xs text-gray-600">Reproducir sonidos en notificaciones</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.sound.enabled}
                onChange={(e) => onSoundSettingsChange('enabled', e.target.checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volumen de Notificaciones: {notificationSettings.sound.volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={notificationSettings.sound.volume}
                onChange={(e) => onSoundSettingsChange('volume', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Notificaciones silenciosas</h4>
                <p className="text-xs text-gray-600">Solo vibración sin sonido</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={notificationSettings.sound.silent}
                onChange={(e) => onSoundSettingsChange('silent', e.target.checked)}
              />
            </div>

            <button
              onClick={onTestSounds}
              disabled={!notificationSettings.sound.enabled}
              className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Probar Sonidos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsSection