import React, { useState } from 'react'
import toast from 'react-hot-toast'

const GoogleMeetConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: `${window.location.origin}/auth/google-meet/callback`,
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
      if (!config.clientId || !config.clientSecret) {
        toast.error('Por favor completa todos los campos requeridos')
        setSaving(false)
        return
      }
      
      // Aquí se guardaría la configuración en Supabase
      // Por ahora solo simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Configuración de Google Meet guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving Google Meet config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de Google Meet</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            name="clientId"
            value={config.clientId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingresa tu Client ID"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            name="clientSecret"
            value={config.clientSecret}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingresa tu Client Secret"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URI de Redirección
          </label>
          <input
            type="text"
            name="redirectUri"
            value={config.redirectUri}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="URI de redirección"
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta URL debe estar registrada en tu aplicación de Google Cloud Console
          </p>
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
            Habilitar integración con Google Meet
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}

export default GoogleMeetConfig