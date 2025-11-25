import React, { useState } from 'react'
import { useMultiGoogleDrive } from '../../hooks/useMultiGoogleDrive.js'
import { useAuth } from '../../contexts/AuthContext.js'
import Swal from 'sweetalert2'
import logger from '../../lib/logger.js'

/**
 * COMPONENTE: MultiGoogleDriveManagerUI
 * 
 * UI para gestionar múltiples cuentas de Google Drive por empresa
 */
const MultiGoogleDriveManagerUI = ({ companyId }) => {
  const { user } = useAuth()
  const {
    sessions,
    loading,
    error,
    connecting,
    connect,
    disconnect,
    isConnected,
    refreshSessions
  } = useMultiGoogleDrive(companyId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccount, setNewAccount] = useState({
    clientId: '',
    clientSecret: '',
    accountName: ''
  })

  const handleConnect = async () => {
    if (!newAccount.clientId || !newAccount.clientSecret) {
      Swal.fire('Error', 'Client ID y Client Secret son obligatorios', 'error')
      return
    }

    const result = await Swal.fire({
      title: '¿Conectar cuenta de Google Drive?',
      html: `
        <div style="text-align: left;">
          <p><strong>Empresa:</strong> ${companyId}</p>
          <p><strong>Cuenta:</strong> ${newAccount.accountName || 'Cuenta Principal'}</p>
          <p><strong>Client ID:</strong> ${newAccount.clientId.substring(0, 20)}...</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Conectar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      const success = await connect(companyId, newAccount.clientId, newAccount.clientSecret)
      if (success) {
        Swal.fire('Éxito', 'Redirigiendo a Google para autorización...', 'success')
        setShowAddForm(false)
        setNewAccount({ clientId: '', clientSecret: '', accountName: '' })
      }
    }
  }

  const handleDisconnect = async (session) => {
    const result = await Swal.fire({
      title: '¿Desconectar cuenta?',
      text: `Se desconectará ${session.accountName || 'la cuenta'} de Google Drive`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Desconectar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      await disconnect(session.companyId)
      Swal.fire('Desconectado', 'La cuenta ha sido desconectada', 'success')
      refreshSessions()
    }
  }

  const handleSelectAccount = (session) => {
    // Marcar como cuenta activa
    Swal.fire('Cuenta seleccionada', `${session.accountName} ahora es la cuenta activa`, 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando cuentas de Google Drive...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={refreshSessions}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Cuentas de Google Drive
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={connecting}
        >
          {connecting ? 'Conectando...' : '+ Agregar Cuenta'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">Nueva Cuenta de Google Drive</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Cuenta
              </label>
              <input
                type="text"
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                placeholder="Ej: Cuenta Principal Aguas Andinas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID (de Google Cloud Console)
              </label>
              <input
                type="text"
                value={newAccount.clientId}
                onChange={(e) => setNewAccount({...newAccount, clientId: e.target.value})}
                placeholder="1234567890-abc123.apps.googleusercontent.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret (de Google Cloud Console)
              </label>
              <input
                type="password"
                value={newAccount.clientSecret}
                onChange={(e) => setNewAccount({...newAccount, clientSecret: e.target.value})}
                placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting || !newAccount.clientId || !newAccount.clientSecret}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {connecting ? 'Conectando...' : 'Conectar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No hay cuentas conectadas</h3>
          <p className="text-gray-500 mb-4">Agrega tu primera cuenta de Google Drive para esta empresa</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Conectar Primera Cuenta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.companyId}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                session.isConnected
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  session.isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {session.accountName || 'Cuenta Principal'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {session.accountEmail || 'Email no disponible'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {session.isConnected ? 'Conectada' : 'Pendiente de verificación'}
                    {session.lastSync && ` • Última sync: ${new Date(session.lastSync).toLocaleString()}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {session.isConnected && (
                  <button
                    onClick={() => handleSelectAccount(session)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                  >
                    Seleccionar
                  </button>
                )}
                
                <button
                  onClick={() => handleDisconnect(session)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}

export default MultiGoogleDriveManagerUI