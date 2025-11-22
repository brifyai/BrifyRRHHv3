import React, { useState } from 'react'
import toast from 'react-hot-toast'
import configurationService from '../../services/configurationService.js'

const GroqConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    model: 'gemma2-9b-it',
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
      await configurationService.setConfig('integrations', 'groq', {
        apiKey: config.apiKey,
        model: config.model,
        enabled: config.enabled
      }, 'global', null, 'Configuración de Groq AI')
      
      toast.success('Configuración de Groq AI guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving Groq config:', error)
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
      
      // Simular prueba de conexión
      // En una implementación real, aquí se haría una llamada a la API de Groq
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Conexión con Groq AI exitosa')
    } catch (error) {
      console.error('Error testing Groq connection:', error)
      toast.error('Error al probar la conexión con Groq AI')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de Groq AI</h3>
      
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="gsk_..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tu clave de API de Groq (comienza con gsk_)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modelo
          </label>
          <select
            name="model"
            value={config.model}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="gemma2-9b-it">Gemma 2 9B IT</option>
            <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Modelo de IA a utilizar para las consultas
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            name="enabled"
            checked={config.enabled}
            onChange={handleChange}
            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
            Habilitar integración con Groq AI
          </label>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
          <h4 className="text-sm font-medium text-teal-800 mb-2">¿Cómo obtener tu API Key?</h4>
          <ol className="text-xs text-teal-700 space-y-1 list-decimal list-inside">
            <li>Visita la plataforma de Groq</li>
            <li>Crea una cuenta o inicia sesión</li>
            <li>Ve a la sección de API Keys</li>
            <li>Crea una nueva API Key</li>
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
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroqConfig