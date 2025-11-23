import React, { useState } from 'react'
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import ChannelConfig from './ChannelConfig.js'

const CommunicationChannelsSection = ({
  channels,
  onUpdateChannel,
  onTestConnection,
  onConnect,
  onDisconnect,
  globalConfig,
  hierarchyMode
}) => {
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testingChannel, setTestingChannel] = useState(null)
  
  // Estado para controlar qué componente de configuración se está mostrando
  const [showConfig, setShowConfig] = useState(null)
  
  // Handler para mostrar el componente de configuración correspondiente
  const handleShowConfig = (channelType) => {
    setShowConfig(channelType)
  }
  
  // Handler para cerrar el componente de configuración
  const handleCloseConfig = () => {
    setShowConfig(null)
  }
  
  // Handler para guardar la configuración
  const handleSaveConfig = (channelType, config) => {
    // Actualizar el estado del canal
    onUpdateChannel(channelType, config)
    setShowConfig(null)
    toast.success(`Configuración de ${getChannelName(channelType)} guardada`)
  }
  
  // Obtener el nombre del canal para mostrar
  const getChannelName = (channelType) => {
    const names = {
      email: 'Email',
      sms: 'SMS',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      groq: 'Groq AI',
      google: 'Google Workspace',
      microsoft: 'Microsoft 365',
      slack: 'Slack',
      teams: 'Microsoft Teams',
      hubspot: 'HubSpot',
      salesforce: 'Salesforce'
    }
    return names[channelType] || channelType
  }
  
  // Manejar la prueba de conexión
  const handleTestConnection = async (channelType) => {
    if (!onTestConnection) return
    
    setIsTesting(true)
    setTestingChannel(channelType)
    
    try {
      await onTestConnection(channelType)
      toast.success(`Conexión con ${getChannelName(channelType)} verificada correctamente`)
    } catch (error) {
      console.error(`Error testing ${channelType} connection:`, error)
      toast.error(`Error al verificar la conexión con ${getChannelName(channelType)}`)
    } finally {
      setIsTesting(false)
      setTestingChannel(null)
    }
  }
  
  // Renderizar el componente de configuración correspondiente
  const renderConfigComponent = () => {
    if (!showConfig) return null
    
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
            Volver a canales de comunicación
          </button>
        </div>
        
        <ChannelConfig
          channelType={showConfig}
          config={(channels && channels[showConfig]) || {}}
          onChange={(field, value) => {
            const newConfig = { ...((channels && channels[showConfig]) || {}), [field]: value }
            handleSaveConfig(showConfig, newConfig)
          }}
          globalConfig={globalConfig}
          isConnected={(channels && channels[showConfig]?.connected) || false}
          onConnect={(channelType) => {
            if (onConnect) onConnect(channelType)
          }}
          onDisconnect={(channelType) => {
            if (onDisconnect) onDisconnect(channelType)
          }}
          onTestConnection={handleTestConnection}
        />
      </div>
    )
  }
  
  // Si se está mostrando un componente de configuración, renderizarlo
  if (showConfig) {
    return renderConfigComponent()
  }
  
  // Obtener la lista de canales disponibles (solo métodos de comunicación, no integraciones)
  const availableChannels = [
    { id: 'email', name: 'Email', icon: EnvelopeIcon, description: 'Envío de correos electrónicos' },
    { id: 'sms', name: 'SMS', icon: DevicePhoneMobileIcon, description: 'Mensajes de texto SMS' },
    { id: 'telegram', name: 'Telegram', icon: ChatBubbleLeftIcon, description: 'Notificaciones por Telegram' },
    { id: 'whatsapp', name: 'WhatsApp', icon: PhoneIcon, description: 'Mensajes de WhatsApp' },
    { id: 'whatsappBusiness', name: 'WhatsApp Business', icon: PhoneIcon, description: 'WhatsApp Business API' },
    { id: 'whatsappOfficial', name: 'WhatsApp Official', icon: PhoneIcon, description: 'API oficial de WhatsApp' },
    { id: 'whatsappWaha', name: 'WhatsApp WAHA', icon: PhoneIcon, description: 'API alternativa de WhatsApp' }
  ]
  
  // Obtener el estado de conexión para cada canal
  const getChannelStatus = (channelId) => {
    const channel = channels[channelId]
    if (!channel) return { text: 'No configurado', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    
    if (!channel.enabled) {
      return { text: 'Deshabilitado', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    }
    
    if (channel.connected) {
      return { text: 'Conectado', color: 'text-green-700', bgColor: 'bg-green-100' }
    }
    
    return { text: 'Configuración incompleta', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Canales de Comunicación</h2>
          <p className="text-gray-600 mt-1">Configura los canales para enviar mensajes a empleados y clientes</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
          Configuración por empresa
        </span>
      </div>
      
      {/* Información sobre el sistema jerárquico */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
        <div className="flex items-start">
          <div className="p-2 rounded-lg bg-blue-100 mr-4">
            <InformationCircleIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Configuración Jerárquico</h3>
            <p className="text-gray-600 mb-4">
              Los canales de comunicación están organizados según la arquitectura del sistema.
              Las integraciones externas son específicas por empresa, mientras que los servicios base son globales.
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableChannels.map((channel) => {
          const Icon = channel.icon
          const status = getChannelStatus(channel.id)
          
          return (
            <div
              key={channel.id}
              className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{channel.name}</h3>
                    <p className="text-sm text-gray-600">{channel.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                  {status.text}
                </span>
              </div>
              
              <div className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">
                  {channel.id === 'email' && 'Envía correos electrónicos a empleados y clientes con plantillas personalizables.'}
                  {channel.id === 'sms' && 'Mensajes de texto SMS para notificaciones urgentes y recordatorios importantes.'}
                  {channel.id === 'telegram' && 'Notificaciones y comunicación a través de bots de Telegram seguros.'}
                  {channel.id === 'whatsapp' && 'Mensajes de WhatsApp para comunicación directa con empleados y clientes.'}
                  {channel.id === 'groq' && 'Inteligencia artificial para análisis de contenido y generación de respuestas automáticas.'}
                  {channel.id === 'google' && 'Integración con Google Workspace para productividad y colaboración.'}
                  {channel.id === 'microsoft' && 'Integración con Microsoft 365 para productividad empresarial.'}
                  {channel.id === 'slack' && 'Notificaciones automáticas en canales de Slack para equipos colaborativos.'}
                  {channel.id === 'teams' && 'Notificaciones en Microsoft Teams para comunicación empresarial.'}
                  {channel.id === 'hubspot' && 'Sincronización con HubSpot CRM para automatizar comunicaciones basadas en datos.'}
                  {channel.id === 'salesforce' && 'Integración con Salesforce para comunicaciones basadas en el ciclo de ventas.'}
                </p>
              </div>
              
              <button
                onClick={() => handleShowConfig(channel.id)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {status.text === 'Conectado' ? 'Gestionar' : 'Configurar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CommunicationChannelsSection