import { supabase } from '../lib/supabase.js'
import realTimeStatsService from './realTimeStatsService.js'
import analyticsInsightsService from './analyticsInsightsService.js'

class CompanyReportsService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 10 * 60 * 1000 // 10 minutos
  }

  /**
   * Genera reporte completo para una empresa específica
   * @param {string} companyId - ID de la empresa
   * @param {Object} options - Opciones del reporte
   * @returns {Promise<Object>} Reporte completo
   */
  async generateCompanyReport(companyId, options = {}) {
    const {
      dateRange = '30d',
      includeComparison = true,
      includeInsights = true,
      includeEmployeeDetails = true,
      channels = null
    } = options

    const cacheKey = `company_report_${companyId}_${dateRange}_${JSON.stringify(options)}`
    
    // Verificar caché
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      // Obtener información básica de la empresa
      const companyInfo = await this.getCompanyInfo(companyId)
      
      // Obtener métricas de comunicación
      const communicationMetrics = await realTimeStatsService.getCompanyMetrics(companyId, {
        dateRange,
        channels
      })

      // Obtener métricas de empleados
      const employeeMetrics = includeEmployeeDetails 
        ? await this.getDetailedEmployeeMetrics(companyId, dateRange)
        : null

      // Obtener comparativas
      const comparison = includeComparison 
        ? await this.getCompanyComparisons(companyId, dateRange)
        : null

      // Generar insights
      const insights = includeInsights 
        ? await this.generateCompanySpecificInsights(companyId, communicationMetrics)
        : null

      // Obtener tendencias históricas
      const trends = await this.getHistoricalTrends(companyId, dateRange)

      // Calcular KPIs
      const kpis = this.calculateCompanyKPIs(communicationMetrics, employeeMetrics)

      const report = {
        company: companyInfo,
        report_period: {
          range: dateRange,
          start: this.getDateRange(dateRange).start,
          end: this.getDateRange(dateRange).end,
          generated_at: new Date().toISOString()
        },
        communication: communicationMetrics,
        employees: employeeMetrics,
        comparison,
        insights,
        trends,
        kpis,
        recommendations: this.generateRecommendations(kpis, insights)
      }

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: report,
        timestamp: Date.now()
      })

      return report
    } catch (error) {
      console.error('Error generando reporte de empresa:', error)
      throw error
    }
  }

  /**
   * Genera reporte comparativo entre múltiples empresas
   * @param {Array} companyIds - IDs de empresas a comparar
   * @param {Object} options - Opciones del reporte
   * @returns {Promise<Object>} Reporte comparativo
   */
  async generateComparativeReport(companyIds, options = {}) {
    const {
      dateRange = '30d',
      metrics = ['delivery', 'engagement', 'volume'],
      includeCharts = true
    } = options

    try {
      // Obtener datos de todas las empresas
      const companyData = await Promise.all(
        companyIds.map(async (companyId) => {
          const metrics = await realTimeStatsService.getCompanyMetrics(companyId, { dateRange })
          const info = await this.getCompanyInfo(companyId)
          return {
            id: companyId,
            name: info.name,
            metrics: metrics.communication,
            kpis: this.calculateCompanyKPIs(metrics.communication)
          }
        })
      )

      // Calcular comparativas
      const comparisons = this.calculateComparativeMetrics(companyData, metrics)

      // Generar rankings
      const rankings = this.generateCompanyRankings(companyData, metrics)

      // Identificar líderes y rezagados
      const leaders = this.identifyLeaders(companyData, metrics)
      const laggards = this.identifyLaggards(companyData, metrics)

      return {
        comparison_period: {
          range: dateRange,
          companies_count: companyIds.length,
          generated_at: new Date().toISOString()
        },
        companies: companyData,
        comparisons,
        rankings,
        leaders,
        laggards,
        insights: this.generateComparativeInsights(comparisons, rankings),
        charts: includeCharts ? this.generateComparisonCharts(companyData, metrics) : null
      }
    } catch (error) {
      console.error('Error generando reporte comparativo:', error)
      throw error
    }
  }

  /**
   * Obtiene información básica de la empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Información de la empresa
   */
  async getCompanyInfo(companyId) {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          rut,
          industry,
          size,
          status,
          created_at,
          updated_at,
          address,
          phone,
          email,
          website
        `)
        .eq('id', companyId)
        .single()

      if (error) throw error

      // Obtener estadísticas adicionales
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      return {
        ...company,
        employee_count: employeeCount || 0,
        tenure_days: Math.floor((Date.now() - new Date(company.created_at)) / (1000 * 60 * 60 * 24))
      }
    } catch (error) {
      console.error('Error obteniendo información de empresa:', error)
      throw error
    }
  }

  /**
   * Obtiene métricas detalladas de empleados
   * @param {string} companyId - ID de la empresa
   * @param {string} dateRange - Rango de fechas
   * @returns {Promise<Object>} Métricas detalladas
   */
  async getDetailedEmployeeMetrics(companyId, dateRange) {
    try {
      const dateFilter = this.getDateRange(dateRange)

      // Obtener todos los empleados de la empresa
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, email, position, department, is_active, created_at')
        .eq('company_id', companyId)

      if (empError) throw empError

      // Obtener métricas de comunicación por empleado
      const employeeMetrics = await Promise.all(
        employees.map(async (employee) => {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('employee_id', employee.id)
            .gte('created_at', dateFilter.start)
            .lte('created_at', dateFilter.end)

          if (msgError) throw msgError

          return {
            ...employee,
            metrics: this.calculateEmployeeMetrics(messages || [])
          }
        })
      )

      // Calcular agregados
      const totalMessages = employeeMetrics.reduce((sum, emp) => sum + emp.metrics.total_messages, 0)
      const activeEmployees = employeeMetrics.filter(emp => emp.is_active).length
      const engagedEmployees = employeeMetrics.filter(emp => emp.metrics.engagement_rate > 0).length

      return {
        employee_count: employees.length,
        active_employees: activeEmployees,
        engaged_employees: engagedEmployees,
        engagement_rate: activeEmployees > 0 ? (engagedEmployees / activeEmployees * 100).toFixed(1) : 0,
        total_messages: totalMessages,
        avg_messages_per_employee: employees.length > 0 ? (totalMessages / employees.length).toFixed(1) : 0,
        top_performers: this.getTopPerformers(employeeMetrics),
        department_breakdown: this.getDepartmentBreakdown(employeeMetrics),
        employee_details: employeeMetrics
      }
    } catch (error) {
      console.error('Error obteniendo métricas detalladas de empleados:', error)
      throw error
    }
  }

  /**
   * Calcula métricas para un empleado específico
   * @param {Array} messages - Mensajes del empleado
   * @returns {Object} Métricas calculadas
   */
  calculateEmployeeMetrics(messages) {
    if (!messages || messages.length === 0) {
      return {
        total_messages: 0,
        delivered_count: 0,
        read_count: 0,
        engagement_rate: 0,
        response_time: 0,
        last_activity: null
      }
    }

    const delivered = messages.filter(m => m.status === 'delivered')
    const read = delivered.filter(m => m.read_at)
    const clicked = read.filter(m => m.clicked_at)

    // Calcular tiempo de respuesta promedio
    const responseTimes = messages
      .filter(m => m.response_at && m.created_at)
      .map(m => new Date(m.response_at) - new Date(m.created_at))

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    return {
      total_messages: messages.length,
      delivered_count: delivered.length,
      read_count: read.length,
      clicked_count: clicked.length,
      delivery_rate: (delivered.length / messages.length * 100).toFixed(1),
      read_rate: (read.length / delivered.length * 100).toFixed(1),
      click_rate: (clicked.length / read.length * 100).toFixed(1),
      engagement_rate: (clicked.length / delivered.length * 100).toFixed(1),
      response_time: Math.round(avgResponseTime / 1000), // en segundos
      last_activity: messages.length > 0 ? messages[messages.length - 1].created_at : null
    }
  }

  /**
   * Obtiene comparativas de la empresa con otras
   * @param {string} companyId - ID de la empresa
   * @param {string} dateRange - Rango de fechas
   * @returns {Promise<Object>} Comparativas
   */
  async getCompanyComparisons(companyId, dateRange) {
    try {
      // Obtener todas las empresas activas
      const { data: allCompanies, error } = await supabase
        .from('companies')
        .select('id, name, industry, size')
        .eq('status', 'active')

      if (error) throw error

      // Obtener métricas de todas las empresas
      const allMetrics = await Promise.all(
        allCompanies.map(async (company) => {
          const metrics = await realTimeStatsService.getCompanyMetrics(company.id, { dateRange })
          return {
            id: company.id,
            name: company.name,
            industry: company.industry,
            size: company.size,
            metrics: metrics.communication
          }
        })
      )

      // Encontrar la empresa actual
      const currentCompany = allMetrics.find(c => c.id === companyId)
      if (!currentCompany) throw new Error('Empresa no encontrada')

      // Filtrar empresas similares (misma industria o tamaño)
      const similarCompanies = allMetrics.filter(c => 
        c.id !== companyId && 
        (c.industry === currentCompany.industry || c.size === currentCompany.size)
      )

      // Calcular percentiles
      const percentiles = this.calculatePercentiles(currentCompany.metrics, allMetrics.map(c => c.metrics))

      // Calcular promedios del sector
      const industryAverages = this.calculateIndustryAverages(currentCompany.industry, allMetrics)

      return {
        company_ranking: this.calculateRanking(currentCompany.metrics, allMetrics.map(c => c.metrics)),
        percentiles,
        industry_averages: industryAverages,
        similar_companies: {
          count: similarCompanies.length,
          avg_performance: this.calculateAverage(similarCompanies.map(c => c.metrics))
        },
        benchmarks: this.generateBenchmarks(currentCompany.metrics, industryAverages)
      }
    } catch (error) {
      console.error('Error obteniendo comparativas:', error)
      return null
    }
  }

  /**
   * Genera insights específicos para la empresa
   * @param {string} companyId - ID de la empresa
   * @param {Object} metrics - Métricas de la empresa
   * @returns {Promise<Object>} Insights generados
   */
  async generateCompanySpecificInsights(companyId, metrics) {
    try {
      // Usar el servicio de insights existente
      const insights = await analyticsInsightsService.generateCompanySpecificInsights(companyId, metrics)

      // Agregar insights específicos de reportes
      const reportInsights = this.generateReportSpecificInsights(metrics)

      return {
        ...insights,
        report_specific: reportInsights
      }
    } catch (error) {
      console.error('Error generando insights específicos:', error)
      return null
    }
  }

  /**
   * Obtiene tendencias históricas de la empresa
   * @param {string} companyId - ID de la empresa
   * @param {string} dateRange - Rango de fechas
   * @returns {Promise<Object>} Tendencias históricas
   */
  async getHistoricalTrends(companyId, dateRange) {
    try {
      const periods = this.getHistoricalPeriods(dateRange)
      
      const trends = await Promise.all(
        periods.map(async (period) => {
          const metrics = await realTimeStatsService.getCompanyMetrics(companyId, {
            dateRange: period.range
          })
          
          return {
            period: period.label,
            date_range: period.dates,
            metrics: metrics.communication.overview,
            delivery_rate: metrics.communication.delivery.delivery_rate,
            engagement_rate: metrics.communication.engagement.overall_engagement
          }
        })
      )

      return {
        trends,
        growth_analysis: this.analyzeGrowthTrends(trends),
        seasonality: this.detectSeasonality(trends)
      }
    } catch (error) {
      console.error('Error obteniendo tendencias históricas:', error)
      return null
    }
  }

  /**
   * Calcula KPIs de la empresa
   * @param {Object} communicationMetrics - Métricas de comunicación
   * @param {Object} employeeMetrics - Métricas de empleados
   * @returns {Object} KPIs calculados
   */
  calculateCompanyKPIs(communicationMetrics, employeeMetrics = null) {
    const { overview, delivery, engagement, performance } = communicationMetrics.communication

    const kpis = {
      communication_score: parseFloat(performance.performance_score),
      delivery_excellence: parseFloat(delivery.delivery_rate),
      engagement_quality: parseFloat(engagement.overall_engagement),
      message_volume: overview.total_messages,
      operational_efficiency: parseFloat(performance.efficiency)
    }

    // Agregar KPIs de empleados si están disponibles
    if (employeeMetrics) {
      kpis.employee_engagement = parseFloat(employeeMetrics.engagement_rate)
      kpis.team_productivity = parseFloat(employeeMetrics.avg_messages_per_employee)
      kpis.active_participation = (employeeMetrics.active_employees / employeeMetrics.employee_count * 100).toFixed(1)
    }

    // Calcular puntuación general
    kpis.overall_score = Object.values(kpis).reduce((sum, value) => sum + parseFloat(value), 0) / Object.keys(kpis).length

    return kpis
  }

  /**
   * Calcula métricas comparativas
   * @param {Array} companyData - Datos de empresas
   * @param {Array} metrics - Métricas a comparar
   * @returns {Object} Métricas comparativas
   */
  calculateComparativeMetrics(companyData, metrics) {
    const comparisons = {}

    metrics.forEach(metric => {
      const values = companyData.map(c => {
        switch (metric) {
          case 'delivery':
            return parseFloat(c.metrics.delivery.delivery_rate) || 0
          case 'engagement':
            return parseFloat(c.metrics.engagement.overall_engagement) || 0
          case 'volume':
            return c.metrics.overview.total_messages || 0
          default:
            return 0
        }
      })

      comparisons[metric] = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
        median: this.calculateMedian(values),
        standard_deviation: this.calculateStandardDeviation(values)
      }
    })

    return comparisons
  }

  /**
   * Genera rankings de empresas
   * @param {Array} companyData - Datos de empresas
   * @param {Array} metrics - Métricas para ranking
   * @returns {Object} Rankings generados
   */
  generateCompanyRankings(companyData, metrics) {
    const rankings = {}

    metrics.forEach(metric => {
      const ranked = companyData
        .map(c => ({
          id: c.id,
          name: c.name,
          value: this.getMetricValue(c, metric)
        }))
        .sort((a, b) => b.value - a.value)
        .map((c, index) => ({
          ...c,
          rank: index + 1,
          percentile: ((companyData.length - index) / companyData.length * 100).toFixed(1)
        }))

      rankings[metric] = ranked
    })

    return rankings
  }

  /**
   * Identifica líderes en cada métrica
   * @param {Array} companyData - Datos de empresas
   * @param {Array} metrics - Métricas a evaluar
   * @returns {Object} Líderes identificados
   */
  identifyLeaders(companyData, metrics) {
    const leaders = {}

    metrics.forEach(metric => {
      const topPerformers = companyData
        .filter(c => this.getMetricValue(c, metric) > 0)
        .sort((a, b) => this.getMetricValue(b, metric) - this.getMetricValue(a, metric))
        .slice(0, 3)

      leaders[metric] = topPerformers.map(c => ({
        id: c.id,
        name: c.name,
        value: this.getMetricValue(c, metric),
        rank: 1
      }))
    })

    return leaders
  }

  /**
   * Identifica rezagados en cada métrica
   * @param {Array} companyData - Datos de empresas
   * @param {Array} metrics - Métricas a evaluar
   * @returns {Object} Rezagados identificados
   */
  identifyLaggards(companyData, metrics) {
    const laggards = {}

    metrics.forEach(metric => {
      const bottomPerformers = companyData
        .filter(c => this.getMetricValue(c, metric) > 0)
        .sort((a, b) => this.getMetricValue(a, metric) - this.getMetricValue(b, metric))
        .slice(0, 3)

      laggards[metric] = bottomPerformers.map(c => ({
        id: c.id,
        name: c.name,
        value: this.getMetricValue(c, metric),
        rank: companyData.length
      }))
    })

    return laggards
  }

  /**
   * Genera insights comparativos
   * @param {Object} comparisons - Comparativas
   * @param {Object} rankings - Rankings
   * @returns {Array} Insights generados
   */
  generateComparativeInsights(comparisons, rankings) {
    const insights = []

    Object.keys(comparisons).forEach(metric => {
      const comparison = comparisons[metric]

      // Identificar gaps significativos
      if (comparison.max > comparison.average * 2) {
        insights.push({
          type: 'performance_gap',
          metric,
          description: `Existe una brecha significativa en ${metric} entre el líder y el promedio`,
          severity: 'high',
          recommendation: 'Analizar las prácticas del líder para identificar mejores prácticas'
        })
      }

      // Identificar consistencia
      if (comparison.standard_deviation < comparison.average * 0.1) {
        insights.push({
          type: 'consistency',
          metric,
          description: `Alta consistencia en ${metric} entre todas las empresas`,
          severity: 'low',
          recommendation: 'Mantener prácticas actuales'
        })
      }
    })

    return insights
  }

  /**
   * Genera gráficos de comparación
   * @param {Array} companyData - Datos de empresas
   * @param {Array} metrics - Métricas para gráficos
   * @returns {Object} Datos para gráficos
   */
  generateComparisonCharts(companyData, metrics) {
    return {
      bar_chart: {
        type: 'bar',
        data: companyData.map(c => ({
          name: c.name,
          ...metrics.reduce((acc, metric) => {
            acc[metric] = this.getMetricValue(c, metric)
            return acc
          }, {})
        }))
      },
      radar_chart: {
        type: 'radar',
        data: companyData.slice(0, 5).map(c => ({
          name: c.name,
          metrics: metrics.reduce((acc, metric) => {
            acc[metric] = this.getMetricValue(c, metric)
            return acc
          }, {})
        }))
      }
    }
  }

  /**
   * Obtiene valor de métrica específica
   * @param {Object} companyData - Datos de la empresa
   * @param {string} metric - Nombre de la métrica
   * @returns {number} Valor de la métrica
   */
  getMetricValue(companyData, metric) {
    switch (metric) {
      case 'delivery':
        return parseFloat(companyData.metrics.delivery.delivery_rate) || 0
      case 'engagement':
        return parseFloat(companyData.metrics.engagement.overall_engagement) || 0
      case 'volume':
        return companyData.metrics.overview.total_messages || 0
      default:
        return 0
    }
  }

  /**
   * Calcula percentiles
   * @param {Object} currentMetrics - Métricas actuales
   * @param {Array} allMetrics - Todas las métricas
   * @returns {Object} Percentiles calculados
   */
  calculatePercentiles(currentMetrics, allMetrics) {
    const deliveryRates = allMetrics.map(m => parseFloat(m.delivery.delivery_rate) || 0)
    const engagementRates = allMetrics.map(m => parseFloat(m.engagement.overall_engagement) || 0)
    const volumes = allMetrics.map(m => m.overview.total_messages || 0)

    return {
      delivery_rate: this.calculatePercentile(parseFloat(currentMetrics.delivery.delivery_rate), deliveryRates),
      engagement_rate: this.calculatePercentile(parseFloat(currentMetrics.engagement.overall_engagement), engagementRates),
      volume: this.calculatePercentile(currentMetrics.overview.total_messages, volumes)
    }
  }

  /**
   * Calcula percentil específico
   * @param {number} value - Valor a evaluar
   * @param {Array} values - Todos los valores
   * @returns {number} Percentil calculado
   */
  calculatePercentile(value, values) {
    const sorted = values.sort((a, b) => a - b)
    const index = sorted.indexOf(value)
    return ((index + 1) / sorted.length * 100).toFixed(1)
  }

  /**
   * Calcula promedios por industria
   * @param {string} industry - Industria
   * @param {Array} allMetrics - Todas las métricas
   * @returns {Object} Promedios de la industria
   */
  calculateIndustryAverages(industry, allMetrics) {
    const industryCompanies = allMetrics.filter(c => c.industry === industry)
    
    if (industryCompanies.length === 0) return null

    const deliveryRates = industryCompanies.map(c => parseFloat(c.metrics.delivery.delivery_rate) || 0)
    const engagementRates = industryCompanies.map(c => parseFloat(c.metrics.engagement.overall_engagement) || 0)
    const volumes = industryCompanies.map(c => c.metrics.overview.total_messages || 0)

    return {
      delivery_rate: deliveryRates.reduce((sum, val) => sum + val, 0) / deliveryRates.length,
      engagement_rate: engagementRates.reduce((sum, val) => sum + val, 0) / engagementRates.length,
      volume: volumes.reduce((sum, val) => sum + val, 0) / volumes.length,
      sample_size: industryCompanies.length
    }
  }

  /**
   * Genera benchmarks
   * @param {Object} currentMetrics - Métricas actuales
   * @param {Object} industryAverages - Promedios de la industria
   * @returns {Object} Benchmarks generados
   */
  generateBenchmarks(currentMetrics, industryAverages) {
    if (!industryAverages) return null

    return {
      delivery_vs_industry: {
        current: parseFloat(currentMetrics.delivery.delivery_rate),
        industry: industryAverages.delivery_rate,
        performance: parseFloat(currentMetrics.delivery.delivery_rate) > industryAverages.delivery_rate ? 'above' : 'below'
      },
      engagement_vs_industry: {
        current: parseFloat(currentMetrics.engagement.overall_engagement),
        industry: industryAverages.engagement_rate,
        performance: parseFloat(currentMetrics.engagement.overall_engagement) > industryAverages.engagement_rate ? 'above' : 'below'
      },
      volume_vs_industry: {
        current: currentMetrics.overview.total_messages,
        industry: industryAverages.volume,
        performance: currentMetrics.overview.total_messages > industryAverages.volume ? 'above' : 'below'
      }
    }
  }

  /**
   * Genera recomendaciones basadas en KPIs e insights
   * @param {Object} kpis - KPIs calculados
   * @param {Object} insights - Insights generados
   * @returns {Array} Recomendaciones generadas
   */
  generateRecommendations(kpis, insights) {
    const recommendations = []

    // Recomendaciones basadas en KPIs
    if (kpis.communication_score < 70) {
      recommendations.push({
        priority: 'high',
        category: 'communication',
        title: 'Mejorar puntuación de comunicación',
        description: 'La puntuación general de comunicación está por debajo del óptimo',
        actions: [
          'Revisar estrategias de entrega',
          'Optimizar contenido de mensajes',
          'Mejorar tiempos de envío'
        ]
      })
    }

    if (kpis.delivery_excellence < 85) {
      recommendations.push({
        priority: 'medium',
        category: 'delivery',
        title: 'Optimizar tasa de entrega',
        description: 'La tasa de entrega puede mejorar significativamente',
        actions: [
          'Verificar configuración de canales',
          'Limpiar listas de contactos',
          'Mejorar calidad de datos'
        ]
      })
    }

    if (kpis.engagement_quality < 50) {
      recommendations.push({
        priority: 'high',
        category: 'engagement',
        title: 'Aumentar engagement',
        description: 'El engagement actual es bajo y necesita atención urgente',
        actions: [
          'Personalizar contenido',
          'Segmentar audiencia',
          'Probar diferentes formatos'
        ]
      })
    }

    // Agregar recomendaciones de insights si están disponibles
    if (insights && insights.recommendations) {
      recommendations.push(...insights.recommendations)
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Obtiene períodos históricos para análisis
   * @param {string} dateRange - Rango de fechas actual
   * @returns {Array} Períodos históricos
   */
  getHistoricalPeriods(dateRange) {
    const now = new Date()
    const periods = []

    switch (dateRange) {
      case '7d':
        // Últimas 8 semanas
        for (let i = 7; i >= 0; i--) {
          const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
          const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
          periods.push({
            label: `Semana ${8 - i}`,
            range: '7d',
            dates: {
              start: start.toISOString(),
              end: end.toISOString()
            }
          })
        }
        break
      case '30d':
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
          const end = new Date(now.getFullYear(), now.getMonth() - i, 0)
          periods.push({
            label: start.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            range: '30d',
            dates: {
              start: start.toISOString(),
              end: end.toISOString()
            }
          })
        }
        break
      default:
        // Default a períodos semanales
        for (let i = 3; i >= 0; i--) {
          const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
          const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
          periods.push({
            label: `Semana ${4 - i}`,
            range: '7d',
            dates: {
              start: start.toISOString(),
              end: end.toISOString()
            }
          })
        }
    }

    return periods
  }

  /**
   * Analiza tendencias de crecimiento
   * @param {Array} trends - Datos de tendencias
   * @returns {Object} Análisis de crecimiento
   */
  analyzeGrowthTrends(trends) {
    if (trends.length < 2) return null

    const firstPeriod = trends[0]
    const lastPeriod = trends[trends.length - 1]

    const volumeGrowth = ((lastPeriod.metrics.total_messages - firstPeriod.metrics.total_messages) / firstPeriod.metrics.total_messages * 100).toFixed(1)
    const deliveryGrowth = (parseFloat(lastPeriod.delivery_rate) - parseFloat(firstPeriod.delivery_rate)).toFixed(1)
    const engagementGrowth = (parseFloat(lastPeriod.engagement_rate) - parseFloat(firstPeriod.engagement_rate)).toFixed(1)

    return {
      volume_growth: volumeGrowth,
      delivery_growth: deliveryGrowth,
      engagement_growth: engagementGrowth,
      trend_direction: this.determineTrendDirection([volumeGrowth, deliveryGrowth, engagementGrowth])
    }
  }

  /**
   * Detecta patrones estacionales
   * @param {Array} trends - Datos de tendencias
   * @returns {Object} Patrones estacionales
   */
  detectSeasonality(trends) {
    // Implementación básica de detección de estacionalidad
    // En un sistema real, esto sería más sofisticado
    const monthlyAverages = {}
    
    trends.forEach(trend => {
      const month = new Date(trend.date_range.start).getMonth()
      if (!monthlyAverages[month]) {
        monthlyAverages[month] = []
      }
      monthlyAverages[month].push(trend.metrics.total_messages)
    })

    const seasonality = {}
    Object.keys(monthlyAverages).forEach(month => {
      const values = monthlyAverages[month]
      seasonality[month] = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        pattern: this.identifyPattern(values)
      }
    })

    return seasonality
  }

  /**
   * Obtiene los mejores empleados
   * @param {Array} employeeMetrics - Métricas de empleados
   * @returns {Array} Mejores empleados
   */
  getTopPerformers(employeeMetrics) {
    return employeeMetrics
      .filter(emp => emp.metrics.total_messages > 0)
      .sort((a, b) => parseFloat(b.metrics.engagement_rate) - parseFloat(a.metrics.engagement_rate))
      .slice(0, 5)
      .map(emp => ({
        id: emp.id,
        name: emp.name,
        engagement_rate: emp.metrics.engagement_rate,
        total_messages: emp.metrics.total_messages
      }))
  }

  /**
   * Obtiene desglose por departamento
   * @param {Array} employeeMetrics - Métricas de empleados
   * @returns {Object} Desglose por departamento
   */
  getDepartmentBreakdown(employeeMetrics) {
    const departments = {}
    
    employeeMetrics.forEach(emp => {
      const dept = emp.department || 'Sin departamento'
      if (!departments[dept]) {
        departments[dept] = {
          employees: 0,
          total_messages: 0,
          avg_engagement: 0,
          engagement_rates: []
        }
      }
      
      departments[dept].employees++
      departments[dept].total_messages += emp.metrics.total_messages
      departments[dept].engagement_rates.push(parseFloat(emp.metrics.engagement_rate))
    })

    // Calcular promedios
    Object.keys(departments).forEach(dept => {
      const rates = departments[dept].engagement_rates
      departments[dept].avg_engagement = (rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(1)
      delete departments[dept].engagement_rates
    })

    return departments
  }

  /**
   * Genera insights específicos de reportes
   * @param {Object} metrics - Métricas de comunicación
   * @returns {Array} Insights generados
   */
  generateReportSpecificInsights(metrics) {
    const insights = []
    const { engagement, channels } = metrics.communication

    // Insight sobre rendimiento de canales
    const bestChannel = Object.keys(channels).reduce((best, channel) => {
      if (!best || parseFloat(channels[channel].delivery_rate) > parseFloat(channels[best].delivery_rate)) {
        return channel
      }
      return best
    }, null)

    if (bestChannel) {
      insights.push({
        type: 'channel_performance',
        title: 'Mejor canal identificado',
        description: `${bestChannel} tiene el mejor rendimiento con ${channels[bestChannel].delivery_rate}% de tasa de entrega`,
        recommendation: `Considerar aumentar el uso de ${bestChannel} para comunicaciones críticas`
      })
    }

    // Insight sobre patrones temporales
    if (engagement.read_trend === 'increasing') {
      insights.push({
        type: 'positive_trend',
        title: 'Tendencia positiva en lectura',
        description: 'La tasa de lectura está aumentando consistentemente',
        recommendation: 'Mantener estrategias actuales de contenido'
      })
    }

    return insights
  }

  /**
   * Calcula ranking de métricas
   * @param {Object} currentMetrics - Métricas actuales
   * @param {Array} allMetrics - Todas las métricas
   * @returns {Object} Ranking calculado
   */
  calculateRanking(currentMetrics, allMetrics) {
    const deliveryRates = allMetrics.map(m => parseFloat(m.delivery.delivery_rate) || 0)
    const engagementRates = allMetrics.map(m => parseFloat(m.engagement.overall_engagement) || 0)
    const volumes = allMetrics.map(m => m.overview.total_messages || 0)

    const deliveryRanking = this.getRank(parseFloat(currentMetrics.delivery.delivery_rate), deliveryRates)
    const engagementRanking = this.getRank(parseFloat(currentMetrics.engagement.overall_engagement), engagementRates)
    const volumeRanking = this.getRank(currentMetrics.overview.total_messages, volumes)

    return {
      delivery: deliveryRanking,
      engagement: engagementRanking,
      volume: volumeRanking,
      overall: Math.floor((deliveryRanking + engagementRanking + volumeRanking) / 3)
    }
  }

  /**
   * Obtiene ranking de un valor específico
   * @param {number} value - Valor a evaluar
   * @param {Array} values - Todos los valores
   * @returns {number} Ranking calculado
   */
  getRank(value, values) {
    const sorted = [...values].sort((a, b) => b - a)
    const index = sorted.indexOf(value)
    return index + 1
  }

  /**
   * Calcula mediana
   * @param {Array} values - Valores
   * @returns {number} Mediana calculada
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  /**
   * Calcula desviación estándar
   * @param {Array} values - Valores
   * @returns {number} Desviación estándar calculada
   */
  calculateStandardDeviation(values) {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const squareDiffs = values.map(val => Math.pow(val - avg, 2))
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(avgSquareDiff)
  }

  /**
   * Calcula promedio
   * @param {Array} values - Valores
   * @returns {number} Promedio calculado
   */
  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Determina dirección de tendencia
   * @param {Array} growthValues - Valores de crecimiento
   * @returns {string} Dirección de la tendencia
   */
  determineTrendDirection(growthValues) {
    const avgGrowth = growthValues.reduce((sum, val) => sum + parseFloat(val), 0) / growthValues.length
    if (avgGrowth > 5) return 'strong_growth'
    if (avgGrowth > 0) return 'moderate_growth'
    if (avgGrowth > -5) return 'stable'
    return 'declining'
  }

  /**
   * Identifica patrón en valores
   * @param {Array} values - Valores
   * @returns {string} Patrón identificado
   */
  identifyPattern(values) {
    if (values.length < 3) return 'insufficient_data'
    
    const increasing = values.every((val, i) => i === 0 || val >= values[i - 1])
    const decreasing = values.every((val, i) => i === 0 || val <= values[i - 1])
    
    if (increasing) return 'increasing'
    if (decreasing) return 'decreasing'
    return 'variable'
  }

  /**
   * Obtiene rango de fechas
   * @param {string} range - Rango de fechas
   * @returns {Object} Fechas de inicio y fin
   */
  getDateRange(range) {
    const now = new Date()
    const end = now.toISOString()
    
    let start
    switch (range) {
      case '1d':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    return { start, end }
  }

  /**
   * Limpia caché
   */
  clearCache() {
    this.cache.clear()
  }
}

const companyReportsService = new CompanyReportsService();
export default companyReportsService;