import React, { useState } from 'react'
import toast from 'react-hot-toast'

const SlackConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    botToken: '',
    signingSecret: '',
    defaultChannel: '',
    enabled: true
  })
  const [saving, setSaving] = useState(false)

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
      if (!config.botToken || !config.signingSecret) {
        toast.error('Por favor completa todos los campos requeridos')
        setSaving(false)
        return
      }
      
      // Aquí se guardaría la configuración en Supabase
      // Por ahora solo simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Configuración de Slack guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving Slack config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de Slack</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bot Token
          </label>
          <input
            type="password"
            name="botToken"
            value={config.botToken}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="xoxb-..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Token de tu aplicación Slack (comienza con xoxb-)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Signing Secret
          </label>
          <input
            type="password"
            name="signingSecret"
            value={config.signingSecret}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Signing Secret"
          />
          <p className="text-xs text-gray-500 mt-1">
            Secreto para verificar las solicitudes entrantes de Slack
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Canal por Defecto
          </label>
          <input
            type="text"
            name="defaultChannel"
            value={config.defaultChannel}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="#general"
          />
          <p className="text-xs text-gray-500 mt-1">
            Canal donde se enviarán las notificaciones por defecto
          </p>
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
            Habilitar integración con Slack
          </label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
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
  )
}

export default SlackConfig