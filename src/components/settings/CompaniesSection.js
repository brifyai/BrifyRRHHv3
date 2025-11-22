import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BuildingOfficeIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CompaniesSection = ({
  companies,
  loading,
  onCreateCompany,
  onDeleteCompany,
  onToggleCompanyStatus
}) => {
  const navigate = useNavigate()

  const handleDeleteCompany = async (companyId) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return

    const confirmed = await new Promise((resolve) => {
      const confirmDelete = () => resolve(true)
      const cancelDelete = () => resolve(false)

      toast((t) => (
        <div>
          <p className="font-medium">¿Eliminar empresa "{company.name}"?</p>
          <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                confirmDelete()
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Eliminar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                cancelDelete()
              }}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ), { duration: 10000 })
    })

    if (!confirmed) return
    onDeleteCompany(companyId)
  }

  const handleToggleStatus = async (company) => {
    onToggleCompanyStatus(company)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera empresa.</p>
        <div className="mt-6">
          <button
            onClick={onCreateCompany}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Primera Empresa
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Botón flotante para agregar empresa */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={onCreateCompany}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Agregar Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="relative bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-3">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                  <div className="flex items-center mt-1">
                    {company.status === 'active' ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${company.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                      {company.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(company)}
                className={`p-1 rounded-full ${
                  company.status === 'active'
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                title={company.status === 'active' ? 'Desactivar empresa' : 'Activar empresa'}
              >
                {company.status === 'active' ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <XCircleIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {company.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{company.description}</p>
            )}

            <div className="space-y-2 mb-4">
              {company.telegram_bot && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Telegram:</span>
                  <span className="truncate">{company.telegram_bot}</span>
                </div>
              )}
              {company.whatsapp_number && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">WhatsApp:</span>
                  <span>{company.whatsapp_number}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => navigate(`/configuracion/empresas/${company.id}`)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Configurar canales de comunicación"
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteCompany(company.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar empresa"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default CompaniesSection