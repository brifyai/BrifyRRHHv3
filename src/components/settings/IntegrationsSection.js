import React, { useState } from 'react'
import {
  PuzzlePieceIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

// Importar los componentes de configuración
import GoogleMeetConfig from '../integrations/GoogleMeetConfig.js'
import SlackConfig from '../integrations/SlackConfig.js'
import TeamsConfig from '../integrations/TeamsConfig.js'
import HubSpotConfig from '../integrations/HubSpotConfig.js'
import BrevoConfig from '../integrations/BrevoConfig.js'
import GroqConfig from '../integrations/GroqConfig.js'
import WhatsAppConfig from '../integrations/WhatsAppConfig.js'
import WhatsAppOfficialConfig from '../integrations/WhatsAppOfficialConfig.js'
import WhatsAppWahaConfig from '../integrations/WhatsAppWahaConfig.js'
import TelegramConfig from '../integrations/TelegramConfig.js'

const IntegrationsSection = ({
  integrations,
  hierarchyMode,
  isGoogleDriveConnected,
  connectingGoogleDrive,
  onConnectGoogleDrive,
  onDisconnectGoogleDrive,
  onConfigureIntegration,
  onDisconnectIntegration,
  getStatusBadge,
  companyId,
  companies
}) => {
  // Detectar si estamos en modo empresa específica
  const currentCompany = companyId ? companies.find(c => c.id === companyId) : null
  const isCompanySpecificMode = !!currentCompany

  // Estado para controlar qué componente de configuración se está mostrando
  const [showConfig, setShowConfig] = useState(null)
  
  // Handler para mostrar el componente de configuración correspondiente
  const handleShowConfig = (integrationId) => {
    setShowConfig(integrationId)
  }
  
  // Handler para cerrar el componente de configuración
  const handleCloseConfig = () => {
    setShowConfig(null)
  }
  
  // Handler para guardar la configuración
  const handleSaveConfig = (integrationId, config) => {
    // Aquí se guardaría la configuración en el estado global o en la base de datos
    console.log(`Guardando configuración para ${integrationId}:`, config)
    setShowConfig(null)
    
    // Actualizar el estado de la integración para reflejar que está conectada
    onConfigureIntegration(integrationId, config)
  }
  
  // Integraciones globales (solo para el sistema, no por empresa)
  const globalIntegrationCards = [
    {
      id: 'groq',
      name: 'Groq AI',
      description: 'Inteligencia Artificial',
      icon: PuzzlePieceIcon,
      gradient: 'from-teal-500 to-teal-600',
      action: () => handleShowConfig('groq')
    }
  ]

  // Determinar qué integraciones mostrar según el contexto
  const integrationCards = isCompanySpecificMode ? [] : globalIntegrationCards
  
  // Renderizar el componente de configuración correspondiente
  const renderConfigComponent = () => {
    switch (showConfig) {
      case 'googlemeet':
        return <GoogleMeetConfig onSave={(config) => handleSaveConfig('googlemeet', config)} onCancel={handleCloseConfig} />
      case 'slack':
        return <SlackConfig onSave={(config) => handleSaveConfig('slack', config)} onCancel={handleCloseConfig} />
      case 'teams':
        return <TeamsConfig onSave={(config) => handleSaveConfig('teams', config)} onCancel={handleCloseConfig} />
      case 'hubspot':
        return <HubSpotConfig onSave={(config) => handleSaveConfig('hubspot', config)} onCancel={handleCloseConfig} />
      case 'brevo':
        return <BrevoConfig onSave={(config) => handleSaveConfig('brevo', config)} onCancel={handleCloseConfig} />
      case 'groq':
        return <GroqConfig onSave={(config) => handleSaveConfig('groq', config)} onCancel={handleCloseConfig} />
      case 'whatsapp':
        return <WhatsAppConfig onSave={(config) => handleSaveConfig('whatsapp', config)} onCancel={handleCloseConfig} />
      case 'whatsappOfficial':
        return <WhatsAppOfficialConfig onSave={(config) => handleSaveConfig('whatsappOfficial', config)} onCancel={handleCloseConfig} />
      case 'whatsappWaha':
        return <WhatsAppWahaConfig onSave={(config) => handleSaveConfig('whatsappWaha', config)} onCancel={handleCloseConfig} />
      case 'telegram':
        return <TelegramConfig onSave={(config) => handleSaveConfig('telegram', config)} onCancel={handleCloseConfig} />
      default:
        return null
    }
  }

  // Si se está mostrando un componente de configuración, renderizarlo
  if (showConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleCloseConfig}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Volver a integraciones
          </button>
        </div>
        {renderConfigComponent()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isCompanySpecificMode ? `Integraciones - ${currentCompany.name}` : 'Integraciones Globales'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isCompanySpecificMode 
              ? `Configuraciones específicas para ${currentCompany.name}` 
              : 'Configuraciones por defecto para todas las empresas'
            }
          </p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
          isCompanySpecificMode 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-purple-100 text-purple-700'
        }`}>
          {isCompanySpecificMode ? 'Configuración por empresa' : 'Configuración global'}
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
              {isCompanySpecificMode
                ? `Las integraciones aquí mostradas son específicas para ${currentCompany.name}. Cada empresa gestiona sus propias credenciales y configuraciones de servicios externos.`
                : 'Las configuraciones aquí establecidas sirven como valores por defecto para todas las empresas. Cada empresa puede tener sus propias credenciales específicas que sobreescriben estas configuraciones globales.'
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">🌐 Configuración Global</h4>
                <p className="text-sm text-gray-600">
                  Solo para servicios base del sistema (como Groq AI). Se usa cuando una empresa no tiene configuración específica.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">🏢 Configuración por Empresa</h4>
                <p className="text-sm text-gray-600">
                  Cada empresa gestiona sus propias integraciones (Google Drive, WhatsApp, Slack, etc.) con credenciales independientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración Global del Sistema - Solo mostrar en modo global */}
      {!isCompanySpecificMode && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-green-100 mr-4">
              <Cog6ToothIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Global del Sistema</h3>
              <p className="text-gray-600 mb-4">
                Estas son las únicas configuraciones globales del sistema. Todas las demás integraciones son específicas por empresa.
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Estado Actual:</h4>
                    <p className="text-sm text-gray-600">
                      Solo se muestran configuraciones globales del sistema. Las integraciones externas se configuran por empresa.
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    GLOBAL ONLY
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner de modo empresa específica */}
      {isCompanySpecificMode && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-blue-100 mr-4">
              <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Específica de Empresa</h3>
              <p className="text-gray-600 mb-4">
                Estás configurando integraciones específicamente para <strong>{currentCompany.name}</strong>. 
                Estas configuraciones tendrán prioridad sobre las configuraciones globales.
              </p>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Empresa Actual:</h4>
                    <p className="text-sm text-gray-600">{currentCompany.name}</p>
                    {currentCompany.status && (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                        currentCompany.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currentCompany.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    EMPRESA ESPECÍFICA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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