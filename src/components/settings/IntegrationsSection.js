import React from 'react'
import {
  CloudIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

const IntegrationsSection = ({
  integrations,
  hierarchyMode,
  isGoogleDriveConnected,
  connectingGoogleDrive,
  onConnectGoogleDrive,
  onDisconnectGoogleDrive,
  onConfigureIntegration,
  onDisconnectIntegration,
  getStatusBadge
}) => {
  const integrationCards = [
    {
      id: 'google',
      name: 'Google Drive',
      description: 'Almacenamiento en la nube',
      icon: CloudIcon,
      gradient: 'from-green-500 to-green-600',
      connected: isGoogleDriveConnected,
      action: onConnectGoogleDrive,
      disconnect: onDisconnectGoogleDrive
    },
    {
      id: 'googlemeet',
      name: 'Google Meet',
      description: 'Videoconferencias',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-green-500 to-green-600',
      action: () => onConfigureIntegration('googlemeet')
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Notificaciones colaborativas',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-purple-500 to-purple-600',
      action: () => onConfigureIntegration('slack')
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Notificaciones empresariales',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-indigo-500 to-indigo-600',
      action: () => onConfigureIntegration('teams')
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM y marketing',
      icon: BuildingStorefrontIcon,
      gradient: 'from-orange-500 to-orange-600',
      action: () => onConfigureIntegration('hubspot')
    },
    {
      id: 'brevo',
      name: 'Brevo',
      description: 'SMS y Email Masivo',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-blue-500 to-blue-600',
      action: () => onConfigureIntegration('brevo')
    },
    {
      id: 'groq',
      name: 'Groq AI',
      description: 'Inteligencia Artificial',
      icon: PuzzlePieceIcon,
      gradient: 'from-teal-500 to-teal-600',
      action: () => onConfigureIntegration('groq')
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Mensajería empresarial',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-green-500 to-green-600',
      action: () => onConfigureIntegration('whatsapp')
    },
    {
      id: 'whatsappOfficial',
      name: 'WhatsApp Official API',
      description: 'API oficial de WhatsApp',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-green-500 to-green-600',
      action: () => onConfigureIntegration('whatsappOfficial')
    },
    {
      id: 'whatsappWaha',
      name: 'WhatsApp WAHA API',
      description: 'API alternativa de WhatsApp',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-purple-500 to-purple-600',
      action: () => onConfigureIntegration('whatsappWaha')
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Mensajería segura',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-blue-500 to-blue-600',
      action: () => onConfigureIntegration('telegram')
    }
  ]

  const handleHierarchyModeChange = (newMode) => {
    onConfigureIntegration('hierarchy', newMode)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Integraciones Globales</h2>
          <p className="text-gray-600 mt-1">Configuraciones por defecto para todas las empresas</p>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
          Configuración global
        </span>
      </div>

      {/* Información sobre el sistema jerárquico */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
        <div className="flex items-start">
          <div className="p-2 rounded-lg bg-blue-100 mr-4">
            <PuzzlePieceIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Configuración Jerárquico</h3>
            <p className="text-gray-600 mb-4">
              Las configuraciones aquí establecidas sirven como valores por defecto para todas las empresas.
              Cada empresa puede tener sus propias credenciales específicas que sobreescriben estas configuraciones globales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">🌐 Configuración Global</h4>
                <p className="text-sm text-gray-600">
                  Se usa cuando una empresa no tiene configuración específica. Ideal para startups y empresas pequeñas.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">🏢 Configuración por Empresa</h4>
                <p className="text-sm text-gray-600">
                  Sobreescribe la configuración global. Perfecta para empresas con múltiples marcas o requisitos específicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control de Modo de Jerarquía */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100">
        <div className="flex items-start">
          <div className="p-2 rounded-lg bg-purple-100 mr-4">
            <Cog6ToothIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Control de Configuración Jerárquico</h3>
            <p className="text-gray-600 mb-4">
              Selecciona cómo el sistema debe priorizar las configuraciones globales vs. las específicas de cada empresa.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => handleHierarchyModeChange('global_only')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  hierarchyMode === 'global_only'
                    ? 'border-purple-500 bg-purple-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${hierarchyMode === 'global_only' ? 'text-purple-600' : 'text-gray-400'}`}>
                    🌐
                  </div>
                  <h4 className={`font-semibold mb-1 ${hierarchyMode === 'global_only' ? 'text-purple-900' : 'text-gray-700'}`}>
                    Solo Global
                  </h4>
                  <p className={`text-xs ${hierarchyMode === 'global_only' ? 'text-purple-700' : 'text-gray-500'}`}>
                    Usa solo configuraciones globales
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleHierarchyModeChange('company_first')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  hierarchyMode === 'company_first'
                    ? 'border-purple-500 bg-purple-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${hierarchyMode === 'company_first' ? 'text-purple-600' : 'text-gray-400'}`}>
                    🏢➡️🌐
                  </div>
                  <h4 className={`font-semibold mb-1 ${hierarchyMode === 'company_first' ? 'text-purple-900' : 'text-gray-700'}`}>
                    Empresa Primero
                  </h4>
                  <p className={`text-xs ${hierarchyMode === 'company_first' ? 'text-purple-700' : 'text-gray-500'}`}>
                    Prioriza config. por empresa
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleHierarchyModeChange('both')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  hierarchyMode === 'both'
                    ? 'border-purple-500 bg-purple-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${hierarchyMode === 'both' ? 'text-purple-600' : 'text-gray-400'}`}>
                    🔄
                  </div>
                  <h4 className={`font-semibold mb-1 ${hierarchyMode === 'both' ? 'text-purple-900' : 'text-gray-700'}`}>
                    Ambas
                  </h4>
                  <p className={`text-xs ${hierarchyMode === 'both' ? 'text-purple-700' : 'text-gray-500'}`}>
                    Combina ambas configuraciones
                  </p>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Modo Actual:</h4>
                  <p className="text-sm text-gray-600">
                    {hierarchyMode === 'global_only' && 'Solo se usarán configuraciones globales. Las configuraciones por empresa serán ignoradas.'}
                    {hierarchyMode === 'company_first' && 'Se priorizarán configuraciones por empresa. Si no existen, se usarán las globales.'}
                    {hierarchyMode === 'both' && 'Se combinarán ambas configuraciones. Las específicas de empresa sobreescribirán las globales.'}
                  </p>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  {hierarchyMode.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrationCards.map((integration) => {
          const Icon = integration.icon
          const isConnected = integration.id === 'google' 
            ? isGoogleDriveConnected 
            : integrations[integration.id]?.connected

          return (
            <div
              key={integration.id}
              className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${integration.gradient} shadow-lg mr-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>
                {getStatusBadge(integration.id)}
              </div>

              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  {integration.id === 'google' && 'Sincroniza tus archivos y carpetas con Google Drive para acceso universal.'}
                  {integration.id === 'googlemeet' && 'Sincroniza reuniones de Google Meet y envía recordatorios automáticos por WhatsApp.'}
                  {integration.id === 'slack' && 'Envía notificaciones automáticas a canales de Slack.'}
                  {integration.id === 'teams' && 'Envía notificaciones automáticas a equipos de Microsoft Teams.'}
                  {integration.id === 'hubspot' && 'Sincroniza datos de contactos y automatiza comunicaciones basadas en CRM.'}
                  {integration.id === 'brevo' && 'Envía SMS y emails masivos con seguimiento en tiempo real.'}
                  {integration.id === 'groq' && 'Integra inteligencia artificial para análisis y generación de contenido.'}
                  {integration.id === 'whatsapp' && 'Envía mensajes de WhatsApp a través de la API de Business.'}
                  {integration.id === 'whatsappOfficial' && 'Usa la API oficial de WhatsApp para mensajería empresarial.'}
                  {integration.id === 'whatsappWaha' && 'Usa la API de WAHA para mensajería de WhatsApp.'}
                  {integration.id === 'telegram' && 'Envía mensajes a través de bots de Telegram.'}
                </p>

                <div className="space-y-2 mb-4">
                  {integrations[integration.id]?.lastSync && (
                    <div className="text-xs text-gray-500">
                      Última sincronización: {new Date(integrations[integration.id].lastSync).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              </div>

              {isConnected ? (
                <button
                  onClick={() => onDisconnectIntegration(integration.id)}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={integration.action}
                  disabled={integrations[integration.id]?.status === 'connecting' || connectingGoogleDrive}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {integrations[integration.id]?.status === 'connecting' || connectingGoogleDrive ? 'Conectando...' : `Configurar ${integration.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IntegrationsSection