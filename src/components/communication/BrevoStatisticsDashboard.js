import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import brevoCampaignService from '../../services/brevoCampaignService.js'
import brevoService from '../../services/brevoService.js'

const BrevoStatisticsDashboard = () => {
  const [statistics, setStatistics] = useState({
    overview: {
      totalCampaigns: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalCost: 0,
      avgDeliveryRate: 0,
      avgOpenRate: 0,
      avgClickRate: 0
    },
    smsStats: {
      sent: 0,
      delivered: 0,
      failed: 0,
      cost: 0,
      deliveryRate: 0
    },
    emailStats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      cost: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0
    },
    recentCampaigns: [],
    monthlyStats: [],
    dailyStats: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedType, setSelectedType] = useState('all')
  const [showDetails, setShowDetails] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  // Cargar estadísticas
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Verificar si Brevo está configurado
      const config = brevoService.loadConfiguration()
      if (!config.apiKey) {
        setError('Brevo no está configurado. Por favor, configura tu API key en Integraciones.')
        return
      }
      
      // Cargar estadísticas generales
      const generalStats = await brevoCampaignService.getGeneralStatistics(selectedPeriod)
      
      // Cargar campañas recientes
      const recentCampaigns = await brevoCampaignService.getCampaigns({
        limit: 10,
        status: selectedType === 'all' ? undefined : 'completed'
      })
      
      // Procesar estadísticas
      const processedStats = processStatistics(generalStats, recentCampaigns)
      
      setStatistics(prev => ({
        ...prev,
        ...processedStats,
        recentCampaigns
      }))
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setError(error.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedType])

  // Procesar estadísticas
  const processStatistics = (generalStats, campaigns) => {
    const overview = {
      totalCampaigns: campaigns.length,
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalCost: 0,
      avgDeliveryRate: 0,
      avgOpenRate: 0,
      avgClickRate: 0
    }
    
    const smsStats = {
      sent: 0,
      delivered: 0,
      failed: 0,
      cost: 0,
      deliveryRate: 0
    }
    
    const emailStats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      cost: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0
    }
    
    // Procesar estadísticas generales
    generalStats.forEach(stat => {
      overview.totalSent += stat.total_sent || 0
      overview.totalCost += stat.total_cost || 0
      
      smsStats.sent += stat.sms_sent || 0
      smsStats.delivered += stat.sms_delivered || 0
      smsStats.failed += stat.sms_failed || 0
      smsStats.cost += stat.sms_cost || 0
      
      emailStats.sent += stat.email_sent || 0
      emailStats.delivered += stat.email_delivered || 0
      emailStats.opened += stat.email_opened || 0
      emailStats.clicked += stat.email_clicked || 0
      emailStats.failed += stat.email_failed || 0
      emailStats.cost += stat.email_cost || 0
    })
    
    // Calcular tasas
    overview.totalDelivered = smsStats.delivered + emailStats.delivered
    overview.totalFailed = smsStats.failed + emailStats.failed
    
    smsStats.deliveryRate = smsStats.sent > 0 ? (smsStats.delivered / smsStats.sent) * 100 : 0
    emailStats.deliveryRate = emailStats.sent > 0 ? (emailStats.delivered / emailStats.sent) * 100 : 0
    emailStats.openRate = emailStats.delivered > 0 ? (emailStats.opened / emailStats.delivered) * 100 : 0
    emailStats.clickRate = emailStats.opened > 0 ? (emailStats.clicked / emailStats.opened) * 100 : 0
    
    overview.avgDeliveryRate = overview.totalSent > 0 ? (overview.totalDelivered / overview.totalSent) * 100 : 0
    overview.avgOpenRate = emailStats.openRate
    overview.avgClickRate = emailStats.clickRate
    
    return {
      overview,
      smsStats,
      emailStats,
      monthlyStats: generalStats
    }
  }

  // Cargar detalles de campaña
  const loadCampaignDetails = async (campaignId) => {
    try {
      const details = await brevoCampaignService.getCampaignDetails(campaignId)
      const stats = await brevoCampaignService.getCampaignStatistics(campaignId)
      
      setSelectedCampaign({
        ...details,
        statistics: stats
      })
      setShowDetails(true)
    } catch (error) {
      console.error('Error cargando detalles de campaña:', error)
    }
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount || 0)
  }

  // Formatear número
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL').format(num || 0)
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Obtener color para tasa
  const getRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Obtener icono para estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'sending':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />
    }
  }

  // eslint-disable-next-line no-use-before-define, react-hooks/exhaustive-deps
useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Estadísticas de Envío Masivo
          </h1>
          <p className="text-gray-600">
            Monitoriza el rendimiento de tus campañas de SMS y Email con Brevo
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="sms">Solo SMS</option>
              <option value="email">Solo Email</option>
            </select>
            
            <button
              onClick={loadStatistics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`text-sm font-medium ${getRateColor(statistics.overview.avgDeliveryRate)}`}>
                {statistics.overview.avgDeliveryRate.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(statistics.overview.totalCampaigns)}
            </h3>
            <p className="text-sm text-gray-600">Campañas Totales</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <EnvelopeIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600">
                {formatNumber(statistics.overview.totalDelivered)}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(statistics.overview.totalSent)}
            </h3>
            <p className="text-sm text-gray-600">Mensajes Enviados</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-yellow-600">
                {statistics.emailStats.avgOpenRate.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(statistics.emailStats.opened)}
            </h3>
            <p className="text-sm text-gray-600">Emails Abiertos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-600">
                Total
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(statistics.overview.totalCost)}
            </h3>
            <p className="text-sm text-gray-600">Costo de Envíos</p>
          </motion.div>
        </div>

        {/* Estadísticas por Canal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Estadísticas SMS */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600" />
                Estadísticas SMS
              </h2>
              <span className={`text-sm font-medium ${getRateColor(statistics.smsStats.deliveryRate)}`}>
                {statistics.smsStats.deliveryRate.toFixed(1)}% entrega
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Enviados</span>
                <span className="font-semibold">{formatNumber(statistics.smsStats.sent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Entregados</span>
                <span className="font-semibold text-green-600">{formatNumber(statistics.smsStats.delivered)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fallidos</span>
                <span className="font-semibold text-red-600">{formatNumber(statistics.smsStats.failed)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600">Costo Total</span>
                <span className="font-semibold">{formatCurrency(statistics.smsStats.cost)}</span>
              </div>
            </div>
          </motion.div>

          {/* Estadísticas Email */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                Estadísticas Email
              </h2>
              <span className={`text-sm font-medium ${getRateColor(statistics.emailStats.deliveryRate)}`}>
                {statistics.emailStats.deliveryRate.toFixed(1)}% entrega
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Enviados</span>
                <span className="font-semibold">{formatNumber(statistics.emailStats.sent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Entregados</span>
                <span className="font-semibold text-green-600">{formatNumber(statistics.emailStats.delivered)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Abiertos</span>
                <span className="font-semibold text-blue-600">{formatNumber(statistics.emailStats.opened)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clics</span>
                <span className="font-semibold text-purple-600">{formatNumber(statistics.emailStats.clicked)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600">Costo Total</span>
                <span className="font-semibold">{formatCurrency(statistics.emailStats.cost)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Campañas Recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Campañas Recientes</h2>
          
          {statistics.recentCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay campañas</h3>
              <p className="text-gray-600">Aún no has enviado ninguna campaña</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Destinatarios</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tasa Entrega</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-gray-600">{campaign.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.campaign_type === 'sms' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {campaign.campaign_type === 'sms' ? 'SMS' : 'Email'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(campaign.status)}
                          <span className="text-sm text-gray-900">{campaign.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatNumber(campaign.total_recipients)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${getRateColor(
                          campaign.total_recipients > 0 
                            ? (campaign.sent_count / campaign.total_recipients) * 100 
                            : 0
                        )}`}>
                          {campaign.total_recipients > 0 
                            ? ((campaign.sent_count / campaign.total_recipients) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => loadCampaignDetails(campaign.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de Detalles de Campaña */}
      <AnimatePresence>
        {showDetails && selectedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedCampaign.name}
                    </h3>
                    <p className="text-gray-600">{selectedCampaign.description}</p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Tipo</div>
                    <div className="font-semibold">
                      {selectedCampaign.campaign_type === 'sms' ? 'SMS' : 'Email'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Estado</div>
                    <div className="font-semibold flex items-center gap-2">
                      {getStatusIcon(selectedCampaign.status)}
                      {selectedCampaign.status}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Destinatarios</div>
                    <div className="font-semibold">
                      {formatNumber(selectedCampaign.total_recipients)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Fecha Creación</div>
                    <div className="font-semibold">
                      {formatDate(selectedCampaign.created_at)}
                    </div>
                  </div>
                </div>

                {selectedCampaign.statistics && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Estadísticas Detalladas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enviados:</span>
                        <span className="font-semibold">
                          {formatNumber(selectedCampaign.statistics.sent_count)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entregados:</span>
                        <span className="font-semibold text-green-600">
                          {formatNumber(selectedCampaign.statistics.delivered_count)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fallidos:</span>
                        <span className="font-semibold text-red-600">
                          {formatNumber(selectedCampaign.statistics.failed_count)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasa Entrega:</span>
                        <span className={`font-semibold ${getRateColor(
                          selectedCampaign.statistics.delivery_rate
                        )}`}>
                          {selectedCampaign.statistics.delivery_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BrevoStatisticsDashboard