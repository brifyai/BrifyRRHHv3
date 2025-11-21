import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChartBarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  RadialLinearScale
} from 'chart.js'
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2'
import realTimeStatsService from '../../services/realTimeStatsService.js'
import companyReportsService from '../../services/companyReportsService.js'
import analyticsInsightsService from '../../services/analyticsInsightsService.js'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
)

const AnalyticsDashboard = ({ companyId = null, isComparative = false }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('7d')
  const [selectedChannels, setSelectedChannels] = useState([])
  const [realTimeData, setRealTimeData] = useState(null)
  const [companyReport, setCompanyReport] = useState(null)
  const [insights, setInsights] = useState(null)

  // Opciones de rango de fechas
  const dateRangeOptions = [
    { value: '1d', label: 'Últimas 24 horas' },
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' }
  ]

  // Opciones de canales - envuelto en useMemo para evitar re-creación
  const channelOptions = useMemo(() => [
    { value: 'email', label: 'Email', color: '#3B82F6' },
    { value: 'sms', label: 'SMS', color: '#10B981' },
    { value: 'telegram', label: 'Telegram', color: '#8B5CF6' },
    { value: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
    { value: 'groq', label: 'Groq AI', color: '#F59E0B' }
  ], [])

  // Función para cargar todos los datos de analytics
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos en paralelo
      const promises = []

      // Estadísticas en tiempo real
      promises.push(
        realTimeStatsService.getRealTimeStats({
          companyId,
          dateRange,
          channels: selectedChannels.length > 0 ? selectedChannels : null,
          includeComparison: true
        })
      )

      // Reportes de empresa (si hay companyId)
      if (companyId && !isComparative) {
        promises.push(
          companyReportsService.generateCompanyReport(companyId, {
            dateRange,
            includeComparison: true,
            includeInsights: true,
            includeEmployeeDetails: true
          })
        )
      }

      // Insights con IA
      promises.push(
        analyticsInsightsService.generateInsights({
          dateRange,
          companyId,
          channels: selectedChannels
        })
      )

      const results = await Promise.all(promises)

      setRealTimeData(results[0])
      if (results[1]) setCompanyReport(results[1])
      setInsights(results[results.length - 1])

    } catch (err) {
      console.error('Error cargando datos de analytics:', err)
      setError('Error al cargar los datos de analytics')
    } finally {
      setLoading(false)
    }
  }, [companyId, dateRange, selectedChannels, isComparative])

  // Función para cargar estadísticas en tiempo real
  const loadRealTimeStats = useCallback(async () => {
    try {
      const stats = await realTimeStatsService.getRealTimeStats({
        companyId,
        dateRange,
        channels: selectedChannels.length > 0 ? selectedChannels : null
      })
      setRealTimeData(stats)
    } catch (err) {
      console.error('Error cargando estadísticas en tiempo real:', err)
    }
  }, [companyId, dateRange, selectedChannels])

  // Cargar datos iniciales
  // eslint-disable-next-line no-use-before-define, react-hooks/exhaustive-deps
useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  // Configurar actualización en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      loadRealTimeStats()
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [loadRealTimeStats])

  // Datos para gráficos de líneas - Tendencias temporales
  const temporalChartData = useMemo(() => {
    if (!realTimeData?.temporal?.hourly_distribution) return null

    const hours = realTimeData.temporal.hourly_distribution.map(item => item.hour)
    const counts = realTimeData.temporal.hourly_distribution.map(item => item.count)

    return {
      labels: hours,
      datasets: [
        {
          label: 'Mensajes enviados',
          data: counts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    }
  }, [realTimeData])

  // Datos para gráfico de barras - Rendimiento por canal
  const channelPerformanceData = useMemo(() => {
    if (!realTimeData?.channels) return null

    const channels = Object.keys(realTimeData.channels)
    const deliveryRates = channels.map(channel => parseFloat(realTimeData.channels[channel].delivery_rate) || 0)
    const engagementRates = channels.map(channel => parseFloat(realTimeData.channels[channel].engagement_rate) || 0)

    return {
      labels: channels.map(channel => channelOptions.find(opt => opt.value === channel)?.label || channel),
      datasets: [
        {
          label: 'Tasa de entrega (%)',
          data: deliveryRates,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        },
        {
          label: 'Tasa de engagement (%)',
          data: engagementRates,
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 1
        }
      ]
    }
  }, [realTimeData, channelOptions])

  // Datos para gráfico circular - Distribución de canales
  const channelDistributionData = useMemo(() => {
    if (!realTimeData?.channels) return null

    const channels = Object.keys(realTimeData.channels)
    const volumes = channels.map(channel => realTimeData.channels[channel].total || 0)
    const colors = channels.map(channel => channelOptions.find(opt => opt.value === channel)?.color || '#6B7280')

    return {
      labels: channels.map(channel => channelOptions.find(opt => opt.value === channel)?.label || channel),
      datasets: [
        {
          data: volumes,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    }
  }, [realTimeData, channelOptions])

  // Datos para gráfico de radar - KPIs
  const kpiRadarData = useMemo(() => {
    if (!realTimeData?.performance) return null

    const kpis = realTimeData.performance
    const metrics = [
      { label: 'Eficiencia', value: parseFloat(kpis.efficiency) || 0 },
      { label: 'Fiabilidad', value: parseFloat(kpis.reliability) || 0 },
      { label: 'Velocidad', value: parseFloat(kpis.speed) || 0 },
      { label: 'Rendimiento', value: parseFloat(kpis.performance_score) || 0 }
    ]

    return {
      labels: metrics.map(m => m.label),
      datasets: [
        {
          label: 'KPIs Actuales',
          data: metrics.map(m => m.value),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        }
      ]
    }
  }, [realTimeData])

  // Opciones de configuración para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  // Tarjetas de métricas principales
  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue', subtitle }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4">
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
          </div>
        )}
      </div>
    )
  }

  // Componente de insight
  const InsightCard = ({ insight, index }) => {
    const getIcon = () => {
      switch (insight.type) {
        case 'positive_trend':
          return <CheckCircleIcon className="w-5 h-5 text-green-500" />
        case 'negative_trend':
          return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
        case 'recommendation':
          return <LightBulbIcon className="w-5 h-5 text-yellow-500" />
        default:
          return <SparklesIcon className="w-5 h-5 text-blue-500" />
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            {insight.recommendation && (
              <p className="text-xs text-blue-600 mt-2 font-medium">💡 {insight.recommendation}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles superiores */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canales</label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map(channel => (
                <label key={channel.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChannels([...selectedChannels, channel.value])
                      } else {
                        setSelectedChannels(selectedChannels.filter(c => c !== channel.value))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{channel.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={loadAnalyticsData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChartBarIcon className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Tasa de Entrega"
          value={`${realTimeData?.delivery?.delivery_rate || 0}%`}
          icon={ChartBarIcon}
          trend={realTimeData?.comparison?.delivery_change?.percentage}
          color="green"
          subtitle={`${realTimeData?.delivery?.delivered_count || 0} mensajes entregados`}
        />
        <MetricCard
          title="Tasa de Lectura"
          value={`${realTimeData?.engagement?.read_rate || 0}%`}
          icon={UsersIcon}
          trend={realTimeData?.comparison?.engagement_change?.percentage}
          color="blue"
          subtitle={`${realTimeData?.engagement?.read_count || 0} mensajes leídos`}
        />
        <MetricCard
          title="Engagement Total"
          value={`${realTimeData?.engagement?.overall_engagement || 0}%`}
          icon={ArrowTrendingUpIcon}
          color="purple"
          subtitle={`${realTimeData?.engagement?.click_count || 0} interacciones`}
        />
        <MetricCard
          title="Mensajes Enviados"
          value={realTimeData?.overview?.total_messages || 0}
          icon={DocumentTextIcon}
          trend={realTimeData?.comparison?.volume_change?.percentage}
          color="yellow"
          subtitle="Último período"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencias temporales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad por Hora del Día</h3>
          <div className="h-64">
            {temporalChartData && (
              <Line data={temporalChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Gráfico de rendimiento por canal */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Canal</h3>
          <div className="h-64">
            {channelPerformanceData && (
              <Bar data={channelPerformanceData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Gráficos secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución de canales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Volumen</h3>
          <div className="h-64">
            {channelDistributionData && (
              <Doughnut 
                data={channelDistributionData} 
                options={{
                  ...chartOptions,
                  scales: undefined
                }} 
              />
            )}
          </div>
        </div>

        {/* KPIs Radar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KPIs de Rendimiento</h3>
          <div className="h-64">
            {kpiRadarData && (
              <Radar 
                data={kpiRadarData} 
                options={{
                  ...chartOptions,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    }
                  }
                }} 
              />
            )}
          </div>
        </div>

        {/* Tiempos pico */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempos Pico de Actividad</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Horas más activas</h4>
              <div className="flex flex-wrap gap-2">
                {realTimeData?.temporal?.peak_hours?.map((hour, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {hour}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Días más activos</h4>
              <div className="flex flex-wrap gap-2">
                {realTimeData?.temporal?.peak_days?.map((day, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights generados por IA */}
      {insights && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Insights Generados por IA</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.insights?.slice(0, 6).map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Reporte de empresa (si aplica) */}
      {companyReport && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Reporte Detallado de Empresa</h3>
          </div>
          
          {/* KPIs de la empresa */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{companyReport.kpis?.overall_score?.toFixed(1) || 0}</p>
              <p className="text-sm text-gray-600">Puntuación General</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{companyReport.employees?.employee_count || 0}</p>
              <p className="text-sm text-gray-600">Empleados Activos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{companyReport.employees?.engagement_rate || 0}%</p>
              <p className="text-sm text-gray-600">Engagement de Empleados</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{companyReport.comparison?.company_ranking?.overall || 'N/A'}</p>
              <p className="text-sm text-gray-600">Ranking General</p>
            </div>
          </div>

          {/* Recomendaciones */}
          {companyReport.recommendations && companyReport.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Recomendaciones</h4>
              <div className="space-y-2">
                {companyReport.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <LightBulbIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard