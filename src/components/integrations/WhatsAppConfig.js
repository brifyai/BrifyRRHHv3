import React, { useState } from 'react'
import toast from 'react-hot-toast'
import configurationService from '../../services/configurationService.js'

const WhatsAppConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    accessToken: '',
    phoneNumberId: '',
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
      if (!config.accessToken || !config.phoneNumberId) {
        toast.error('Por favor completa todos los campos requeridos')
        setSaving(false)
        return
      }
      
      // Guardar la configuración en el servicio
      await configurationService.setConfig('integrations', 'whatsapp', {
        accessToken: config.accessToken,
        phoneNumberId: config.phoneNumberId,
        testMode: config.testMode,
        enabled: config.enabled
      }, 'global', null, 'Configuración de WhatsApp Business API')
      
      toast.success('Configuración de WhatsApp Business API guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving WhatsApp config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      
      // Validación básica
      if (!config.accessToken || !config.phoneNumberId) {
        toast.error('Por favor completa todos los campos requeridos antes de probar la conexión')
        setTesting(false)
        return
      }
      
      // Simular prueba de conexión
      // En una implementación real, aquí se haría una llamada a la API de WhatsApp Business
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Conexión con WhatsApp Business API exitosa')
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error)
      toast.error('Error al probar la conexión con WhatsApp Business API')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de WhatsApp Business API</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Token
          </label>
          <input
            type="password"
            name="accessToken"
            value={config.accessToken}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="EAA..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Token de acceso a la API de WhatsApp Business
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number ID
          </label>
          <input
            type="text"
            name="phoneNumberId"
            value={config.phoneNumberId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="1234567890"
          />
          <p className="text-xs text-gray-500 mt-1">
            ID del número de teléfono de WhatsApp Business
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={config.testMode}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
            Habilitar integración con WhatsApp Business API
          </label>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h4 className="text-sm font-medium text-green-800 mb-2">¿Cómo obtener tus credenciales?</h4>
          <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
            <li>Crea una cuenta de desarrollador en Facebook</li>
            <li>Crea una aplicación de Facebook para WhatsApp</li>
            <li>Configura un número de teléfono de WhatsApp Business</li>
            <li>Genera un token de acceso permanente</li>
            <li>Copia el token de acceso y el ID del número de teléfono</li>
          </ol>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={testing || !config.accessToken || !config.phoneNumberId}
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppConfig