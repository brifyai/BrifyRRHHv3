/**
 * Dashboard de Estado de Empresas
 * 
 * Este componente muestra:
 * - Estado actual de todas las empresas (activa/inactiva)
 * - Estadísticas de comunicaciones bloqueadas
 * - Historial de intentos de comunicación bloqueados
 * - Controles para activar/desactivar empresas
 */

import React, { useState, useEffect } from 'react'
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import companyStatusVerificationService from '../../services/companyStatusVerificationService.js'
import communicationStatusMiddleware from '../../services/communicationStatusMiddleware.js'
import companySyncService from '../../services/companySyncService.js'

const CompanyStatusDashboard = () => {
  const [companies, setCompanies] = useState([])
  const [blockedStats, setBlockedStats] = useState({
    totalBlocked: 0,
    byType: {},
    byDay: {},
    recentBlocks: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar empresas
      const companiesData = await companySyncService.getCompanies()
      setCompanies(companiesData || [])
      
      // Cargar estadísticas de bloqueos
      const stats = await communicationStatusMiddleware.getCommunicationStats()
      setBlockedStats(stats.blockedCommunications)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Error cargando datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCompanyStatus = async (company) => {
    try {
      const newStatus = company.status === 'active' ? 'inactive' : 'active'
      
      // Actualizar en la base de datos
      await companySyncService.updateCompany(company.id, { status: newStatus })
      
      // Actualizar estado local
      setCompanies(prev => prev.map(c =>
        c.id === company.id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      ))
      
      // Limpiar cache de verificación
      communicationStatusMiddleware.clearStatusCache(company.id)
      
      toast.success(`Empresa ${newStatus === 'active' ? 'activada' : 'desactivada'}`)
      
      // Recargar datos para asegurar sincronización
      await loadDashboardData()
      
    } catch (error) {
      console.error('Error toggling company status:', error)
      toast.error('Error al cambiar el estado de la empresa')
    }
  }

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'whatsapp':
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500" />
      case 'email':
        return <EnvelopeIcon className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <DevicePhoneMobileIcon className="h-4 w-4 text-purple-500" />
      case 'telegram':
        return <PaperAirplaneIcon className="h-4 w-4 text-cyan-500" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getCommunicationName = (type) => {
    const names = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      sms: 'SMS',
      telegram: 'Telegram'
    }
    return names[type] || type
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard de Estado de Empresas
        </h1>
        <p className="text-gray-600">
          Monitorea el estado de las empresas y las comunicaciones bloqueadas
        </p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Empresas</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empresas Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empresas Inactivas</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter(c => c.status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comunicaciones Bloqueadas</p>
              <p className="text-2xl font-bold text-gray-900">{blockedStats.totalBlocked}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de Empresas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Estado de Empresas</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    company.status === 'active' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center">
                    <BuildingOfficeIcon className={`h-6 w-6 ${
                      company.status === 'active' ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">
                        {company.status === 'active' ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleCompanyStatus(company)}
                    className={`p-2 rounded-full ${
                      company.status === 'active'
                        ? 'text-red-600 hover:bg-red-100'
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                    title={company.status === 'active' ? 'Desactivar empresa' : 'Activar empresa'}
                  >
                    {company.status === 'active' ? (
                      <XCircleIcon className="h-5 w-5" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comunicaciones Bloqueadas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Comunicaciones Recientes Bloqueadas</h2>
          </div>
          <div className="p-6">
            {blockedStats.recentBlocks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay comunicaciones bloqueadas</h3>
                <p className="mt-1 text-sm text-gray-500">Todas las empresas activas pueden comunicarse normalmente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedStats.recentBlocks.map((block, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      {getCommunicationIcon(block.communication_type)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {getCommunicationName(block.communication_type)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Empresa ID: {block.company_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(block.blocked_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas por Tipo de Comunicación */}
      {Object.keys(blockedStats.byType).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Comunicaciones Bloqueadas por Tipo</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(blockedStats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  {getCommunicationIcon(type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {getCommunicationName(type)}
                    </p>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyStatusDashboard