import React, { useState } from 'react'
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ChannelConfig = ({ 
  channelType, 
  config, 
  onChange, 
  globalConfig,
  isConnected = false,
  onConnect = null,
  onDisconnect = null,
  onTestConnection = null
}) => {
  const [testing, setTesting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Determinar el color del tema según el tipo de canal
  const getTheme = () => {
    const themes = {
      email: { primary: 'blue', bg: 'blue-50', border: 'blue-200', text: 'blue-800', icon: EnvelopeIcon },
      sms: { primary: 'green', bg: 'green-50', border: 'green-200', text: 'green-800', icon: DevicePhoneMobileIcon },
      telegram: { primary: 'blue', bg: 'blue-50', border: 'blue-200', text: 'blue-800', icon: ChatBubbleLeftIcon },
      whatsapp: { primary: 'green', bg: 'green-50', border: 'green-200', text: 'green-800', icon: PhoneIcon },
      groq: { primary: 'purple', bg: 'purple-50', border: 'purple-200', text: 'purple-800', icon: Cog6ToothIcon },
      google: { primary: 'red', bg: 'red-50', border: 'red-200', text: 'red-800', icon: GlobeAltIcon },
      microsoft: { primary: 'blue', bg: 'blue-50', border: 'blue-200', text: 'blue-800', icon: ComputerDesktopIcon },
      slack: { primary: 'purple', bg: 'purple-50', border: 'purple-200', text: 'purple-800', icon: ChatBubbleLeftRightIcon },
      teams: { primary: 'purple', bg: 'purple-50', border: 'purple-200', text: 'purple-800', icon: BriefcaseIcon },
      hubspot: { primary: 'orange', bg: 'orange-50', border: 'orange-200', text: 'orange-800', icon: CubeIcon },
      salesforce: { primary: 'blue', bg: 'blue-50', border: 'blue-200', text: 'blue-800', icon: BriefcaseIcon }
    }
    return themes[channelType] || themes.email
  }
  
  const theme = getTheme()
  const Icon = theme.icon
  
  // Obtener el nombre del canal para mostrar
  const getChannelName = () => {
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
  
  // Obtener la descripción del canal
  const getChannelDescription = () => {
    const descriptions = {
      email: 'Envío de correos electrónicos a empleados y clientes',
      sms: 'Mensajes de texto SMS para notificaciones urgentes',
      telegram: 'Notificaciones y comunicación a través de Telegram',
      whatsapp: 'Mensajes de WhatsApp para comunicación directa',
      groq: 'Inteligencia artificial para análisis y generación de contenido',
      google: 'Integración con Google Workspace para productividad',
      microsoft: 'Integración con Microsoft 365 para productividad',
      slack: 'Notificaciones en canales de Slack',
      teams: 'Notificaciones en Microsoft Teams',
      hubspot: 'Sincronización con HubSpot CRM',
      salesforce: 'Integración con Salesforce CRM'
    }
    return descriptions[channelType] || ''
  }
  
  // Verificar si el canal está configurado correctamente
  const isConfigValid = () => {
    // Verificar si el canal está habilitado
    if (!config[`${channelType}_enabled`]) return false
    
    // Verificar campos requeridos según el tipo de canal
    switch (channelType) {
      case 'email':
        return !!(config.email_sender_name && config.email_sender_email)
      case 'sms':
        return !!(config.sms_sender_name && config.sms_sender_phone)
      case 'telegram':
        return !!(config.telegram_bot_token && config.telegram_bot_username)
      case 'whatsapp':
        return !!(config.whatsapp_access_token && config.whatsapp_phone_number_id)
      case 'groq':
        return !!config.groq_api_key
      case 'google':
        return !!(config.google_api_key && config.google_client_id && config.google_client_secret)
      case 'microsoft':
        return !!(config.microsoft_client_id && config.microsoft_client_secret && config.microsoft_tenant_id)
      case 'slack':
        return !!(config.slack_bot_token && config.slack_signing_secret)
      case 'teams':
        return !!(config.teams_app_id && config.teams_client_secret && config.teams_tenant_id)
      case 'hubspot':
        return !!(config.hubspot_api_key && config.hubspot_portal_id)
      case 'salesforce':
        return !!(config.salesforce_consumer_key && config.salesforce_consumer_secret && 
                 config.salesforce_username && config.salesforce_password)
      default:
        return false
    }
  }
  
  // Manejar la prueba de conexión
  const handleTestConnection = async () => {
    if (!onTestConnection) return
    
    setTesting(true)
    try {
      await onTestConnection(channelType)
      toast.success(`Conexión con ${getChannelName()} verificada correctamente`)
    } catch (error) {
      console.error(`Error testing ${channelType} connection:`, error)
      toast.error(`Error al verificar la conexión con ${getChannelName()}`)
    } finally {
      setTesting(false)
    }
  }
  
  // Renderizar campos específicos según el tipo de canal
  const renderFields = () => {
    switch (channelType) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Remitente
                </label>
                <input
                  type="text"
                  value={config.email_sender_name || ''}
                  onChange={(e) => onChange('email_sender_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Empresa XYZ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Remitente
                </label>
                <input
                  type="email"
                  value={config.email_sender_email || ''}
                  onChange={(e) => onChange('email_sender_email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="noreply@empresa.cl"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Respuesta
                </label>
                <input
                  type="email"
                  value={config.email_reply_to || ''}
                  onChange={(e) => onChange('email_reply_to', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="soporte@empresa.cl"
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> La configuración de SMTP se gestiona desde la página de
                <a href="/configuracion/integraciones" className="text-blue-600 underline ml-1">Integraciones</a>.
                Aquí solo configuras los datos específicos de esta empresa.
              </p>
            </div>
          </div>
        )
        
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Remitente SMS
                </label>
                <input
                  type="text"
                  value={config.sms_sender_name || ''}
                  onChange={(e) => onChange('sms_sender_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="EmpresaXYZ"
                  maxLength={11}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Remitente
                </label>
                <input
                  type="tel"
                  value={config.sms_sender_phone || ''}
                  onChange={(e) => onChange('sms_sender_phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="+56912345678"
                />
              </div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> La configuración del proveedor de SMS (Brevo) se gestiona desde
                <a href="/configuracion/integraciones" className="text-green-600 underline ml-1">Integraciones</a>.
              </p>
            </div>
          </div>
        )
        
      case 'telegram':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token del Bot
                </label>
                <input
                  type="password"
                  value={config.telegram_bot_token || ''}
                  onChange={(e) => onChange('telegram_bot_token', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario del Bot
                </label>
                <input
                  type="text"
                  value={config.telegram_bot_username || ''}
                  onChange={(e) => onChange('telegram_bot_username', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="@mi_bot_empresa"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Webhook
                </label>
                <input
                  type="url"
                  value={config.telegram_webhook_url || ''}
                  onChange={(e) => onChange('telegram_webhook_url', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="https://tu-sitio.com/api/telegram/webhook"
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Puedes obtener un token de bot de Telegram creando un bot con @BotFather.
              </p>
            </div>
          </div>
        )
        
      case 'whatsapp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={config.whatsapp_access_token || ''}
                  onChange={(e) => onChange('whatsapp_access_token', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="EAAKZC..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={config.whatsapp_phone_number_id || ''}
                  onChange={(e) => onChange('whatsapp_phone_number_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="123456789012345"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={config.whatsapp_webhook_verify_token || ''}
                  onChange={(e) => onChange('whatsapp_webhook_verify_token', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="token_secreto_verificacion"
                />
              </div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                <strong>Tip:</strong> Puedes obtener las credenciales de WhatsApp Business API desde Facebook Developers.
              </p>
            </div>
          </div>
        )
        
      case 'groq':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.groq_api_key || ''}
                  onChange={(e) => onChange('groq_api_key', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="gsk_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <select
                  value={config.groq_model || 'gemma2-9b-it'}
                  onChange={(e) => onChange('groq_model', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <option value="gemma2-9b-it">Gemma 2 9B IT</option>
                  <option value="llama3-8b-8192">Llama 3 8B 8192</option>
                  <option value="llama3-70b-8192">Llama 3 70B 8192</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B 32768</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.groq_temperature || 0.7}
                  onChange={(e) => onChange('groq_temperature', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="8000"
                  value={config.groq_max_tokens || 800}
                  onChange={(e) => onChange('groq_max_tokens', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <p className="text-sm text-purple-800">
                <strong>Tip:</strong> Puedes obtener una API Key de Groq registrándote en su plataforma.
              </p>
            </div>
          </div>
        )
        
      // Otros casos para google, microsoft, slack, teams, hubspot, salesforce...
      default:
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600">
              Configuración avanzada para {getChannelName()}. Por favor, contacta al soporte técnico para obtener ayuda.
            </p>
          </div>
        )
    }
  }
  
  // Estado del canal
  const getStatusInfo = () => {
    if (!config[`${channelType}_enabled`]) {
      return {
        text: 'Deshabilitado',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100'
      }
    }
    
    if (isConfigValid()) {
      return {
        text: 'Configurado',
        color: 'text-green-700',
        bgColor: 'bg-green-100'
      }
    }
    
    return {
      text: 'Configuración incompleta',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Icon className={`h-5 w-5 mr-2 text-${theme.primary}-600`} />
          {getChannelName()}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config[`${channelType}_enabled`] || false}
              onChange={(e) => onChange(`${channelType}_enabled`, e.target.checked)}
              className={`text-${theme.primary}-600 focus:ring-${theme.primary}-500 rounded`}
            />
            <span className="ml-2 text-sm text-gray-700">Habilitar</span>
          </label>
        </div>
      </div>
      
      <p className="text-sm text-gray-600">{getChannelDescription()}</p>
      
      {config[`${channelType}_enabled`] && (
        <>
          {renderFields()}
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">No conectado</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {onTestConnection && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !isConfigValid()}
                  className={`px-3 py-1 text-sm border border-${theme.primary}-300 text-${theme.primary}-700 rounded-lg hover:bg-${theme.bg} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {testing ? 'Probando...' : 'Probar conexión'}
                </button>
              )}
              
              {onConnect && !isConnected && (
                <button
                  type="button"
                  onClick={() => onConnect(channelType)}
                  className={`px-3 py-1 text-sm bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 transition-colors`}
                >
                  Conectar
                </button>
              )}
              
              {onDisconnect && isConnected && (
                <button
                  type="button"
                  onClick={() => onDisconnect(channelType)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Desconectar
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChannelConfig