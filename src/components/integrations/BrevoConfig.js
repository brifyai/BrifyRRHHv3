import React, { useState } from 'react'
import toast from 'react-hot-toast'
import brevoService from '../../services/brevoService.js'

const BrevoConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    apiKey: '',
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
      if (!config.apiKey) {
        toast.error('Por favor completa todos los campos requeridos')
        setSaving(false)
        return
      }
      
      // Guardar la configuración en el servicio
      await brevoService.saveConfiguration({
        apiKey: config.apiKey,
        testMode: config.testMode
      })
      
      toast.success('Configuración de Brevo guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving Brevo config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      
      // Validación básica
      if (!config.apiKey) {
        toast.error('Por favor ingresa tu API Key antes de probar la conexión')
        setTesting(false)
        return
      }
      
      // Probar la conexión con Brevo
      const result = await brevoService.testConnection({
        apiKey: config.apiKey,
        testMode: config.testMode
      })
      
      if (result.success) {
        toast.success('Conexión con Brevo exitosa')
      } else {
        toast.error(`Error de conexión: ${result.message}`)
      }
    } catch (error) {
      console.error('Error testing Brevo connection:', error)
      toast.error('Error al probar la conexión con Brevo')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de Brevo</h3>
      
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="xkeysib-..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tu clave de API de Brevo (comienza con xkeysib-)
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="testMode"
            name="testMode"
            checked={config.testMode}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
            Habilitar integración con Brevo
          </label>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2">¿Cómo obtener tu API Key?</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Inicia sesión en tu cuenta de Brevo</li>
            <li>Ve a la sección de API Keys en la configuración</li>
            <li>Crea una nueva API Key con los permisos necesarios</li>
            <li>Copia la clave y pégala aquí</li>
          </ol>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={testing || !config.apiKey}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrevoConfig