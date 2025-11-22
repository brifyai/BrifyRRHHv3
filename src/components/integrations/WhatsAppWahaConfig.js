import React, { useState } from 'react'
import toast from 'react-hot-toast'
import whatsappWahaService from '../../services/whatsappWahaService.js'

const WhatsAppWahaConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    sessionId: '',
    webhookUrl: `${window.location.origin}/api/whatsapp/waha/webhook`,
    testMode: true,
    enabled: true
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validación básica
      if (!config.apiKey || !config.sessionId) {
        toast.error('Por favor completa todos los campos requeridos')
        setSaving(false)
        return
      }
      
      // Guardar la configuración en el servicio
      await whatsappWahaService.saveConfiguration({
        apiKey: config.apiKey,
        sessionId: config.sessionId,
        webhookUrl: config.webhookUrl,
        testMode: config.testMode
      })
      
      toast.success('Configuración de WhatsApp WAHA API guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving WhatsApp WAHA config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      
      // Validación básica
      if (!config.apiKey || !config.sessionId) {
        toast.error('Por favor completa todos los campos requeridos antes de probar la conexión')
        setTesting(false)
        return
      }
      
      // Probar la conexión con la API de WAHA
      const result = await whatsappWahaService.testConnection({
        apiKey: config.apiKey,
        sessionId: config.sessionId,
        testMode: config.testMode
      })
      
      if (result.success) {
        toast.success('Conexión con WhatsApp WAHA API exitosa')
      } else {
        toast.error(`Error de conexión: ${result.message}`)
      }
    } catch (error) {
      console.error('Error testing WhatsApp WAHA connection:', error)
      toast.error('Error al probar la conexión con WhatsApp WAHA API')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de WhatsApp WAHA API</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            name="apiKey"
            value={config.apiKey}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="API Key de WAHA"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tu clave de API para acceder a WAHA
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session ID
          </label>
          <input
            type="text"
            name="sessionId"
            value={config.sessionId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="session-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Identificador de la sesión de WhatsApp
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook URL
          </label>
          <input
            type="text"
            name="webhookUrl"
            value={config.webhookUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://tu-dominio.com/api/whatsapp/waha/webhook"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL para recibir notificaciones de WAHA
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={config.testMode}
            onChange={handleChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="testMode" className="ml-2 block text-sm text-gray-700">
            Modo de prueba (no se enviarán mensajes reales)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            name="enabled"
            checked={config.enabled}
            onChange={handleChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
            Habilitar integración con WhatsApp WAHA API
          </label>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h4 className="text-sm font-medium text-purple-800 mb-2">¿Cómo obtener tus credenciales?</h4>
          <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
            <li>Instala WAHA en tu servidor</li>
            <li>Inicia una sesión de WhatsApp</li>
            <li>Obtén la API Key y Session ID desde la interfaz de WAHA</li>
            <li>Configura el webhook URL para recibir notificaciones</li>
            <li>Copia las credenciales aquí</li>
          </ol>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={testing || !config.apiKey || !config.sessionId}
        >
          {testing ? 'Probando...' : 'Probar Conexión'}
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppWahaConfig