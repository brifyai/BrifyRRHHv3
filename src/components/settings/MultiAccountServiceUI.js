import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext.js'
import MultiAccountServiceManager from '../../lib/multiAccountServiceManager.js'
import googleDriveAuthServiceDynamic from '../../lib/googleDriveAuthServiceDynamic.js'
import GoogleDriveDirectConnect from './GoogleDriveDirectConnect.js'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

/**
 * Multi-Account Service UI Component
 * Componente genérico para gestionar múltiples cuentas de cualquier servicio
 */
const MultiAccountServiceUI = ({ 
  serviceName, 
  companyId, 
  companies,
  displayName,
  icon,
  color,
  credentialFields
}) => {
  const { user } = useAuth()
  const [manager, setManager] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Inicializar manager
  useEffect(() => {
    const initManager = async () => {
      try {
        const serviceManager = MultiAccountServiceManager.getInstance(serviceName)
        await serviceManager.initialize(null, companyId)
        setManager(serviceManager)
        
        // Cargar cuentas
        if (companyId) {
          await loadAccounts(serviceManager)
        }
      } catch (error) {
        console.error(`[${serviceName}] Error initializing manager:`, error)
        toast.error(`Error inicializando ${displayName}`)
      }
    }

    initManager()
  }, [serviceName, companyId])

  // Cargar cuentas del servicio
  const loadAccounts = useCallback(async (serviceManager) => {
    try {
      setLoading(true)
      const credentials = serviceManager.getAvailableCredentials(companyId)
      setAccounts(credentials)
    } catch (error) {
      console.error(`[${serviceName}] Error loading accounts:`, error)
      toast.error(`Error cargando cuentas de ${displayName}`)
    } finally {
      setLoading(false)
    }
  }, [serviceName, companyId])

  // Manejar conexión de nueva cuenta
  const handleConnectAccount = useCallback(async () => {
    try {
      console.log('🔍 [MultiAccountServiceUI] Iniciando conexión para:', serviceName)
      
      if (!manager || !companyId) {
        console.error('❌ [MultiAccountServiceUI] Manager no inicializado o empresa no seleccionada')
        toast.error('Manager no inicializado o empresa no seleccionada')
        return
      }

      setConnecting(true)
      console.log('✅ [MultiAccountServiceUI] Connecting set to true')

      // ✅ SOLUCIÓN ESPECIAL PARA GOOGLE DRIVE: Usar componente directo en lugar de formulario manual
      if (serviceName === 'googledrive') {
        console.log('🔍 [MultiAccountServiceUI] Detectado Google Drive, usando componente directo')
        
        // Obtener el nombre de la empresa para mostrarlo en el componente
        const companyName = companies?.find(c => c.id === companyId)?.name || 'Empresa'
        
        // Mostrar el componente GoogleDriveDirectConnect en un modal
        const { value: result } = await Swal.fire({
          title: `🔧 Conectar ${displayName}`,
          html: '<div id="google-drive-direct-connect-container"></div>',
          showConfirmButton: false,
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          cancelButtonColor: '#6c757d',
          width: '600px',
          didOpen: () => {
            // Renderizar el componente React dentro del modal
            const container = document.getElementById('google-drive-direct-connect-container')
            if (container) {
              // Crear un div para montar el componente
              const mountPoint = document.createElement('div')
              container.appendChild(mountPoint)
              
              // Importar ReactDOM para renderizar el componente
              import('react-dom').then(ReactDOM => {
                const root = ReactDOM.createRoot(mountPoint)
                root.render(
                  React.createElement(GoogleDriveDirectConnect, {
                    companyId: companyId,
                    companyName: companyName,
                    onConnectionSuccess: (data) => {
                      console.log('✅ [MultiAccountServiceUI] Conexión exitosa:', data)
                      Swal.close()
                      toast.success(`✅ Cuenta de ${displayName} conectada exitosamente`)
                      loadAccounts(manager)
                    },
                    onConnectionError: (error) => {
                      console.error('❌ [MultiAccountServiceUI] Error en conexión:', error)
                      Swal.close()
                      toast.error(`❌ Error conectando ${displayName}: ${error.message}`)
                    }
                  })
                )
              })
            }
          },
          willClose: () => {
            // Limpiar el contenedor al cerrar
            const container = document.getElementById('google-drive-direct-connect-container')
            if (container) {
              container.innerHTML = ''
            }
          }
        })
        
        setConnecting(false)
        return
      }

      // Para otros servicios, usar el flujo normal
      // Mostrar formulario para credenciales
      const formHtml = credentialFields.map(field => `
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">${field.label}:</label>
          <input type="${field.type || 'text'}" id="${field.id}" class="swal2-input" placeholder="${field.placeholder}" style="width: 100%;">
          ${field.help ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${field.help}</p>` : ''}
        </div>
      `).join('')

      const { value: formData } = await Swal.fire({
        title: `🔧 Configurar ${displayName}`,
        html: `
          <div style="text-align: left; max-width: 500px;">
            <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #495057;">Credenciales de ${displayName}</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                Ingresa las credenciales de ${displayName} para esta empresa.
              </p>
            </div>
            ${formHtml}
          </div>
        `,
        confirmButtonText: 'Conectar',
        confirmButtonColor: color,
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#6c757d',
        showCancelButton: true,
        preConfirm: () => {
          const data = {}
          const missingFields = []
          
          credentialFields.forEach(field => {
            const value = document.getElementById(field.id).value
            if (field.required && !value) {
              missingFields.push(field.label)
            }
            data[field.id] = value
          })
          
          if (missingFields.length > 0) {
            Swal.showValidationMessage(`Por favor completa: ${missingFields.join(', ')}`)
            return false
          }
          
          return data
        }
      })

      if (!formData) {
        setConnecting(false)
        return
      }

      // Crear objeto de credenciales según el servicio
      const credentials = {}
      credentialFields.forEach(field => {
        credentials[field.id] = formData[field.id]
      })

      // Conectar cuenta
      const result = await manager.connect(companyId, credentials, `Cuenta ${accounts.length + 1}`)

      if (result.success) {
        toast.success(`✅ Cuenta de ${displayName} conectada exitosamente`)
        await loadAccounts(manager)
      } else {
        toast.error(`❌ Error conectando ${displayName}: ${result.error}`)
      }
    } catch (error) {
      console.error(`[${serviceName}] Error connecting account:`, error)
      toast.error(`Error conectando ${displayName}`)
    } finally {
      setConnecting(false)
    }
  }, [manager, companyId, serviceName, displayName, color, credentialFields, accounts.length, loadAccounts])

  // Manejar desconexión de cuenta
  const handleDisconnectAccount = useCallback(async (credentialId) => {
    try {
      if (!manager) {
        toast.error('Manager no inicializado')
        return
      }

      const result = await Swal.fire({
        title: `¿Desconectar ${displayName}?`,
        text: 'Se eliminarán las credenciales guardadas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Desconectar',
        cancelButtonText: 'Cancelar'
      })

      if (!result.isConfirmed) {
        return
      }

      const disconnectResult = await manager.disconnect(companyId, credentialId)

      if (disconnectResult.success) {
        toast.success(`✅ Cuenta de ${displayName} desconectada`)
        await loadAccounts(manager)
      } else {
        toast.error(`❌ Error desconectando ${displayName}: ${disconnectResult.error}`)
      }
    } catch (error) {
      console.error(`[${serviceName}] Error disconnecting account:`, error)
      toast.error(`Error desconectando ${displayName}`)
    }
  }, [manager, companyId, serviceName, displayName, loadAccounts])

  // Seleccionar cuenta activa
  const handleSelectAccount = useCallback(async (credentialId) => {
    try {
      if (!manager) {
        toast.error('Manager no inicializado')
        return
      }

      const success = await manager.selectCredential(companyId, credentialId)

      if (success) {
        toast.success(`✅ Cuenta de ${displayName} seleccionada`)
        await loadAccounts(manager)
      } else {
        toast.error(`❌ Error seleccionando cuenta de ${displayName}`)
      }
    } catch (error) {
      console.error(`[${serviceName}] Error selecting account:`, error)
      toast.error(`Error seleccionando cuenta de ${displayName}`)
    }
  }, [manager, companyId, serviceName, displayName, loadAccounts])

  // Testear conexión
  const handleTestConnection = useCallback(async (credentialId) => {
    try {
      if (!manager) {
        toast.error('Manager no inicializado')
        return
      }

      // Seleccionar cuenta temporalmente para testear
      await manager.selectCredential(companyId, credentialId)
      const isConnected = await manager.testConnection(companyId)

      if (isConnected) {
        toast.success(`✅ Conexión de ${displayName} exitosa`)
      } else {
        toast.error(`❌ Conexión de ${displayName} fallida`)
      }
    } catch (error) {
      console.error(`[${serviceName}] Error testing connection:`, error)
      toast.error(`Error testeando conexión de ${displayName}`)
    }
  }, [manager, companyId, serviceName, displayName])

  if (!companyId) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Selecciona una empresa para gestionar cuentas de {displayName}</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className={`text-2xl mr-2 ${icon}`}></span>
          <h4 className="font-semibold text-gray-900">{displayName}</h4>
        </div>
        <button
          onClick={handleConnectAccount}
          disabled={connecting}
          className={`px-3 py-1 text-sm text-white rounded-lg hover:opacity-90 disabled:opacity-50`}
          style={{ backgroundColor: color }}
        >
          {connecting ? 'Conectando...' : '+ Agregar Cuenta'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-600 mt-2">Cargando cuentas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No hay cuentas de {displayName} conectadas
        </p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                account.status === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  {account.account_name}
                </p>
                <p className="text-xs text-gray-600">
                  Conectado el {new Date(account.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTestConnection(account.id)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  title="Testear conexión"
                >
                  Test
                </button>
                {account.status === 'active' && (
                  <button
                    onClick={() => handleSelectAccount(account.id)}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    title="Seleccionar como activa"
                  >
                    Activar
                  </button>
                )}
                <button
                  onClick={() => handleDisconnectAccount(account.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Desconectar cuenta"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MultiAccountServiceUI