import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  PuzzlePieceIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

const SettingsHeader = ({ activeTab }) => {
  const location = useLocation()

  const tabs = [
    { id: 'companies', label: 'Empresas', icon: BuildingOfficeIcon, path: '/configuracion/empresas' },
    { id: 'users', label: 'Usuarios', icon: UserGroupIcon, path: '/configuracion/usuarios' },
    { id: 'general', label: 'General', icon: Cog6ToothIcon, path: '/configuracion/general' },
    { id: 'notifications', label: 'Notificaciones', icon: ChatBubbleLeftRightIcon, path: '/configuracion/notificaciones' },
    { id: 'security', label: 'Seguridad', icon: BuildingStorefrontIcon, path: '/configuracion/seguridad' },
    { id: 'integrations', label: 'Integraciones', icon: PuzzlePieceIcon, path: '/configuracion/integraciones' },
    { id: 'database', label: 'Base de Datos', icon: ServerIcon, path: '/configuracion/base-de-datos' }
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
          <Cog6ToothIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona tus empresas y configuraciones del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(({ id, label, icon: Icon, path }) => (
            <Link
              key={id}
              to={path}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5 inline mr-2" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default SettingsHeader