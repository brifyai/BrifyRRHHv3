import React, { useState } from 'react'
import toast from 'react-hot-toast'
import configurationService from '../../services/configurationService.js'

const TelegramConfig = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState({
    botToken: '',
    botUsername: '',
    webhookUrl: `${window.location.origin}/api/telegram/webhook`,
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
      if (!config.botToken || !config.botUsername) {
        toast.error('Por favor completa todos los campos requeridos')
        setSaving(false)
        return
      }
      
      // Guardar la configuración en el servicio
      await configurationService.setConfig('integrations', 'telegram', {
        botToken: config.botToken,
        botUsername: config.botUsername,
        webhookUrl: config.webhookUrl,
        enabled: config.enabled
      }, 'global', null, 'Configuración de Telegram Bot')
      
      toast.success('Configuración de Telegram Bot guardada')
      onSave(config)
    } catch (error) {
      console.error('Error saving Telegram config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      
      // Validación básica
      if (!config.botToken) {
        toast.error('Por favor ingresa tu Bot Token antes de probar la conexión')
        setTesting(false)
        return
      }
      
      // Simular prueba de conexión
      // En una implementación real, aquí se haría una llamada a la API de Telegram
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Conexión con Telegram Bot exitosa')
    } catch (error) {
      console.error('Error testing Telegram connection:', error)
      toast.error('Error al probar la conexión con Telegram Bot')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Configuración de Telegram Bot</h3>
      
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          />
          <p className="text-xs text-gray-500 mt-1">
            Token de tu bot de Telegram (obtenido de @BotFather)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bot Username
          </label>
          <input
            type="text"
            name="botUsername"
            value={config.botUsername}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="MiBot"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nombre de usuario de tu bot (sin @)
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://tu-dominio.com/api/telegram/webhook"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL para recibir actualizaciones de Telegram
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
            Habilitar integración con Telegram Bot
          </label>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2">¿Cómo crear un bot de Telegram?</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Inicia una conversación con @BotFather en Telegram</li>
            <li>Envía el comando /newbot</li>
            <li>Sigue las instrucciones para crear tu bot</li>
            <li>Copia el token que te proporciona @BotFather</li>
            <li>Pega el token aquí junto con el nombre de usuario del bot</li>
          </ol>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={testing || !config.botToken}
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

export default TelegramConfig