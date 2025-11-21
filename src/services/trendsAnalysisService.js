import { supabase } from '../lib/supabase.js';
import groqService from './groqService.js';
import { withRateLimit } from '../lib/supabaseRateLimiter.js';

class TrendsAnalysisService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hora de cache
  }

  // ========================================
  // MÉTODOS PRINCIPALES DE ANÁLISIS
  // ========================================

  // Generar insights para una empresa específica usando datos reales
  async generateCompanyInsights(companyIdentifier, forceRegenerate = false, isId = false) {
    try {
      console.log(`🔍 Generando insights para ${companyIdentifier}...`);
      
      // Obtener datos reales de la empresa - soportar tanto ID como nombre
      let companyData;
      if (isId) {
        // Si es ID, buscar directamente por ID
        const { data, error } = await withRateLimit(
          `company-${companyIdentifier}`,
          () => supabase
            .from('companies')
            .select('*')
            .eq('id', companyIdentifier)
            .maybeSingle()
        );
        
        if (error) throw error;
        companyData = data;
      } else {
        // Si es nombre, usar el método existente
        companyData = await this.getCompanyRealData(companyIdentifier);
      }
      
      if (!companyData) {
        throw new Error(`Empresa ${companyIdentifier} no encontrada`);
      }

      // Verificar si ya existen insights recientes
      if (!forceRegenerate) {
        const existingInsights = await this.getExistingInsights(companyData.name);
        if (existingInsights && existingInsights.length > 0) {
          console.log(`✅ Usando insights existentes para ${companyData.name}`);
          const formattedInsights = this.formatInsights(existingInsights);
          
          // ✅ CORRECCIÓN: También obtener y retornar datos completos con insights existentes
          const communicationMetrics = await this.getCommunicationMetrics(companyData.id);
          const employeeData = await this.getEmployeeData(companyData.id);
          
          return {
            ...formattedInsights,
            communicationMetrics,
            employeeData,
            companyData
          };
        }
      }

      // Obtener métricas de comunicación reales
      const communicationMetrics = await this.getCommunicationMetrics(companyData.id);
      
      // Obtener datos de empleados
      const employeeData = await this.getEmployeeData(companyData.id);
      
      // Generar insights usando Groq AI con datos reales
      const insights = await this.generateInsightsWithAI({
        companyName: companyData.name,
        companyData,
        communicationMetrics,
        employeeData
      });

      // Guardar insights en la base de datos
      await this.saveInsights(companyData.name, insights);

      console.log(`✅ Insights generados y guardados para ${companyData.name}`);
      
      // ✅ CORRECCIÓN: Retornar TODOS los datos necesarios para el componente
      return {
        ...insights,
        communicationMetrics,
        employeeData,
        companyData
      };
    } catch (error) {
      console.error(`❌ Error generando insights para ${companyIdentifier}:`, error);
      return this.getFallbackInsights(companyIdentifier);
    }
  }

  // Obtener insights existentes de la base de datos
  async getExistingInsights(companyName) {
    try {
      const { data: insights, error } = await withRateLimit(
        `insights-${companyName}`,
        () => supabase
          .from('company_insights')
          .select('*')
          .eq('company_name', companyName)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      
      // Verificar si los insights son recientes (menos de 24 horas)
      const now = new Date();
      const validInsights = insights?.filter(insight => {
        const createdAt = new Date(insight.created_at);
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
        return hoursDiff < 24;
      }) || [];

      return validInsights;
    } catch (error) {
      console.error('Error obteniendo insights existentes:', error);
      return [];
    }
  }

  // Obtener datos reales de la empresa
  async getCompanyRealData(companyName) {
    try {
      const { data: company, error } = await withRateLimit(
        `company-search-${companyName}`,
        () => supabase
          .from('companies')
          .select('*')
          .ilike('name', `%${companyName}%`)
          .maybeSingle()
      );

      if (error) throw error;
      return company;
    } catch (error) {
      console.error('Error obteniendo datos de empresa:', error);
      return null;
    }
  }

  // Obtener métricas de comunicación reales
  async getCommunicationMetrics(companyId) {
    try {
      console.log(`🔍 DEBUG: Obteniendo métricas de comunicación para companyId: ${companyId}`);
      
      // Verificar si la tabla communication_logs existe
      const { error: tableError } = await withRateLimit(
        'check-communication_logs',
        () => supabase
          .from('communication_logs')
          .select('id')
          .limit(1)
      );

      console.log('🔍 DEBUG: Tabla communication_logs existe:', !tableError ? 'SÍ' : 'NO');
      if (tableError) {
        console.log('🔍 DEBUG: Error tabla communication_logs:', tableError.message);
        return this.getEmptyMetrics();
      }

      const { data: logs, error } = await withRateLimit(
        `communication_logs-${companyId}`,
        () => supabase
          .from('communication_logs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1000)
      );

      console.log('🔍 DEBUG: Logs encontrados para empresa:', logs?.length || 0);
      if (error) {
        console.log('🔍 DEBUG: Error obteniendo logs:', error.message);
        throw error;
      }

      const metrics = {
        totalMessages: logs?.length || 0,
        sentMessages: logs?.filter(log => log.status === 'sent').length || 0,
        readMessages: logs?.filter(log => log.status === 'read').length || 0,
        scheduledMessages: logs?.filter(log => log.status === 'scheduled').length || 0,
        failedMessages: logs?.filter(log => log.status === 'failed').length || 0,
        deliveryRate: 0,
        readRate: 0,
        engagementRate: 0,
        channelUsage: {},
        hourlyActivity: {},
        dailyActivity: {},
        recentActivity: logs?.slice(0, 50) || []
      };

      console.log('🔍 DEBUG: Métricas básicas calculadas:', {
        totalMessages: metrics.totalMessages,
        sentMessages: metrics.sentMessages,
        readMessages: metrics.readMessages
      });

      // Calcular tasas
      if (metrics.totalMessages > 0) {
        metrics.deliveryRate = (metrics.sentMessages / metrics.totalMessages) * 100;
        metrics.readRate = (metrics.readMessages / metrics.totalMessages) * 100;
        metrics.engagementRate = ((metrics.sentMessages + metrics.readMessages) / metrics.totalMessages) * 100;
      }

      // Analizar patrones temporales y de canales
      logs?.forEach(log => {
        // Análisis por canal
        const channel = log.channel_id || 'unknown';
        metrics.channelUsage[channel] = (metrics.channelUsage[channel] || 0) + 1;

        // Análisis por hora
        if (log.created_at) {
          const hour = new Date(log.created_at).getHours();
          metrics.hourlyActivity[hour] = (metrics.hourlyActivity[hour] || 0) + 1;

          const day = new Date(log.created_at).getDay();
          metrics.dailyActivity[day] = (metrics.dailyActivity[day] || 0) + 1;
        }
      });

      console.log('🔍 DEBUG: Métricas finales de comunicación:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error obteniendo métricas de comunicación:', error);
      console.log('🔍 DEBUG: Retornando métricas vacías debido a error');
      return this.getEmptyMetrics();
    }
  }

  // Obtener datos de empleados
  async getEmployeeData(companyId) {
    try {
      const { data: employees, error } = await withRateLimit(
        `employees-${companyId}`,
        () => supabase
          .from('employees')
          .select('*')
          .eq('company_id', companyId)
      );

      if (error) throw error;

      const employeeData = {
        totalEmployees: employees?.length || 0,
        departments: {},
        levels: {},
        workModes: {},
        regions: {},
        positions: {}
      };

      // Analizar distribución de empleados
      employees?.forEach(employee => {
        // Por departamento
        const dept = employee.department || 'unknown';
        employeeData.departments[dept] = (employeeData.departments[dept] || 0) + 1;

        // Por nivel
        const level = employee.level || 'unknown';
        employeeData.levels[level] = (employeeData.levels[level] || 0) + 1;

        // Por modo de trabajo
        const workMode = employee.work_mode || 'unknown';
        employeeData.workModes[workMode] = (employeeData.workModes[workMode] || 0) + 1;

        // Por región
        const region = employee.region || 'unknown';
        employeeData.regions[region] = (employeeData.regions[region] || 0) + 1;

        // Por posición
        const position = employee.position || 'unknown';
        employeeData.positions[position] = (employeeData.positions[position] || 0) + 1;
      });

      return employeeData;
    } catch (error) {
      console.error('Error obteniendo datos de empleados:', error);
      return this.getEmptyEmployeeData();
    }
  }

  // Generar insights usando Groq AI con datos reales
  async generateInsightsWithAI(data) {
    try {
      const { companyName, companyData, communicationMetrics, employeeData } = data;

      // Construir prompt para Groq con datos reales
      const prompt = this.buildAnalysisPrompt(companyName, companyData, communicationMetrics, employeeData);

      // Generar insights usando Groq
      const response = await groqService.generateCompletion({
        messages: [
          {
            role: 'system',
            content: `Eres un experto en análisis de comunicación empresarial y recursos humanos. 
            Analiza los datos proporcionados y genera insights accionables y específicos.
            Responde SIEMPRE en formato JSON con la siguiente estructura:
            {
              "frontInsights": [
                {
                  "type": "positive|negative|warning|info",
                  "title": "título breve",
                  "description": "descripción detallada y específica basada en los datos"
                }
              ],
              "backInsights": [
                {
                  "type": "positive|negative|warning|info", 
                  "title": "título breve",
                  "description": "descripción detallada y específica basada en los datos"
                }
              ]
            }
            
            Los insights deben ser:
            1. Basados en los datos reales proporcionados
            2. Específicos y accionables
            3. Relevantes para la empresa
            4. En español
            5. Máximo 5 insights por categoría`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 2000
      });

      // Parsear respuesta JSON
      let insights;
      try {
        insights = JSON.parse(response.content);
      } catch (parseError) {
        console.error('Error parseando respuesta de Groq:', parseError);
        insights = this.getFallbackInsights(companyName);
      }

      return insights;
    } catch (error) {
      console.error('Error generando insights con IA:', error);
      return this.getFallbackInsights(data.companyName);
    }
  }

  // Construir prompt de análisis con datos reales
  buildAnalysisPrompt(companyName, companyData, communicationMetrics, employeeData) {
    return `
Analiza los siguientes datos de la empresa "${companyName}" y genera insights inteligentes:

DATOS DE LA EMPRESA:
- Nombre: ${companyName}
- ID: ${companyData.id}
- Industria: ${companyData.industry || 'No especificada'}
- Ubicación: ${companyData.location || 'No especificada'}

MÉTRICAS DE COMUNICACIÓN:
- Total de mensajes: ${communicationMetrics.totalMessages}
- Mensajes enviados: ${communicationMetrics.sentMessages}
- Mensajes leídos: ${communicationMetrics.readMessages}
- Tasa de entrega: ${communicationMetrics.deliveryRate.toFixed(1)}%
- Tasa de lectura: ${communicationMetrics.readRate.toFixed(1)}%
- Tasa de engagement: ${communicationMetrics.engagementRate.toFixed(1)}%

Uso de canales:
${Object.entries(communicationMetrics.channelUsage).map(([channel, count]) => `- ${channel}: ${count} mensajes`).join('\n')}

Actividad por hora (más activas):
${Object.entries(communicationMetrics.hourlyActivity)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([hour, count]) => `- ${hour}:00 - ${count} mensajes`).join('\n')}

DATOS DE EMPLEADOS:
- Total de empleados: ${employeeData.totalEmployees}
- Distribución por departamentos:
${Object.entries(employeeData.departments).map(([dept, count]) => `- ${dept}: ${count} empleados`).join('\n')}

- Distribución por niveles:
${Object.entries(employeeData.levels).map(([level, count]) => `- ${level}: ${count} empleados`).join('\n')}

- Modos de trabajo:
${Object.entries(employeeData.workModes).map(([mode, count]) => `- ${mode}: ${count} empleados`).join('\n')}

Genera insights específicos basados en estos datos. Identifica patrones, tendencias, oportunidades de mejora y puntos fuertes.
`;
  }

  // Guardar insights en la base de datos
  async saveInsights(companyName, insights) {
    try {
      // Primero, desactivar insights anteriores
      await withRateLimit(
        `deactivate-insights-${companyName}`,
        () => supabase
          .from('company_insights')
          .update({ is_active: false })
          .eq('company_name', companyName)
      );

      // Guardar nuevos insights
      const insightsToSave = [];

      // Guardar front insights
      insights.frontInsights?.forEach((insight, index) => {
        insightsToSave.push({
          company_name: companyName,
          insight_type: 'front',
          insight_category: insight.type,
          title: insight.title,
          description: insight.description,
          confidence_score: 0.8,
          data_source: 'groq_ai_analysis'
        });
      });

      // Guardar back insights
      insights.backInsights?.forEach((insight, index) => {
        insightsToSave.push({
          company_name: companyName,
          insight_type: 'back',
          insight_category: insight.type,
          title: insight.title,
          description: insight.description,
          confidence_score: 0.8,
          data_source: 'groq_ai_analysis'
        });
      });

      if (insightsToSave.length > 0) {
        const { error } = await withRateLimit(
          `insert-insights-${companyName}`,
          () => supabase
            .from('company_insights')
            .insert(insightsToSave)
            .select()
        );

        if (error) throw error;
        console.log(`✅ ${insightsToSave.length} insights guardados para ${companyName}`);
      }

      // También guardar métricas actuales
      await this.saveCompanyMetrics(companyName, insights);
    } catch (error) {
      console.error('Error guardando insights:', error);
    }
  }

  // Guardar métricas de la empresa
  async saveCompanyMetrics(companyName, insights) {
    try {
      // Obtener datos actualizados de la empresa
      const companyData = await this.getCompanyRealData(companyName);
      if (!companyData) return;

      const communicationMetrics = await this.getCommunicationMetrics(companyData.id);
      const employeeData = await this.getEmployeeData(companyData.id);

      const metrics = {
        company_id: companyData.id,
        company_name: companyName,
        employee_count: employeeData.totalEmployees,
        total_messages: communicationMetrics.totalMessages,
        sent_messages: communicationMetrics.sentMessages,
        read_messages: communicationMetrics.readMessages,
        scheduled_messages: communicationMetrics.scheduledMessages,
        draft_messages: communicationMetrics.failedMessages,
        engagement_rate: communicationMetrics.engagementRate,
        delivery_rate: communicationMetrics.deliveryRate,
        sentiment_score: 0.5, // Placeholder, se puede calcular después
        most_active_hour: this.getMostActiveHour(communicationMetrics.hourlyActivity),
        most_active_day: this.getMostActiveDay(communicationMetrics.dailyActivity),
        preferred_channel: this.getPreferredChannel(communicationMetrics.channelUsage)
      };

      // Upsert métricas
      const { error } = await withRateLimit(
        `metrics-${companyName}`,
        () => supabase
          .from('company_metrics')
          .upsert(metrics, {
            onConflict: 'company_name'
          })
          .select()
      );

      if (error) throw error;
      console.log(`✅ Métricas guardadas para ${companyName}`);
    } catch (error) {
      console.error('Error guardando métricas:', error);
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  formatInsights(insights) {
    const frontInsights = insights
      .filter(i => i.insight_type === 'front')
      .map(i => ({
        type: i.insight_category,
        title: i.title,
        description: i.description
      }));

    const backInsights = insights
      .filter(i => i.insight_type === 'back')
      .map(i => ({
        type: i.insight_category,
        title: i.title,
        description: i.description
      }));

    return { frontInsights, backInsights };
  }

  getMostActiveHour(hourlyActivity) {
    if (!hourlyActivity || Object.keys(hourlyActivity).length === 0) return 9;
    
    return parseInt(Object.entries(hourlyActivity)
      .sort(([,a], [,b]) => b - a)[0][0]);
  }

  getMostActiveDay(dailyActivity) {
    if (!dailyActivity || Object.keys(dailyActivity).length === 0) return 1;
    
    return parseInt(Object.entries(dailyActivity)
      .sort(([,a], [,b]) => b - a)[0][0]);
  }

  getPreferredChannel(channelUsage) {
    if (!channelUsage || Object.keys(channelUsage).length === 0) return 'whatsapp';
    
    return Object.entries(channelUsage)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  getEmptyMetrics() {
    return {
      totalMessages: 0,
      sentMessages: 0,
      readMessages: 0,
      scheduledMessages: 0,
      failedMessages: 0,
      deliveryRate: 0,
      readRate: 0,
      engagementRate: 0,
      channelUsage: {},
      hourlyActivity: {},
      dailyActivity: {},
      recentActivity: []
    };
  }

  getEmptyEmployeeData() {
    return {
      totalEmployees: 0,
      departments: {},
      levels: {},
      workModes: {},
      regions: {},
      positions: {}
    };
  }

  getFallbackInsights(companyName) {
    return {
      frontInsights: [
        {
          type: 'info',
          title: 'Sin Datos de Comunicación',
          description: `No hay mensajes enviados para ${companyName}. Los insights se generarán automáticamente cuando haya actividad de comunicación real.`
        },
        {
          type: 'info',
          title: 'Sistema Listo',
          description: 'El sistema está conectado a la base de datos y esperando datos reales para generar análisis.'
        }
      ],
      backInsights: [
        {
          type: 'info',
          title: 'Estado Inicial',
          description: 'Comienza a enviar mensajes para ver análisis detallados y recomendaciones personalizadas.'
        },
        {
          type: 'positive',
          title: 'Base de Datos Conectada',
          description: 'La conexión con Supabase está activa. Los datos se mostrarán en tiempo real.'
        }
      ]
    };
  }

  // ========================================
  // MÉTODOS DE MANTENIMIENTO
  // ========================================

  // Limpiar insights expirados
  async cleanupExpiredInsights() {
    try {
      const { error } = await withRateLimit(
        'cleanup-expired-insights',
        () => supabase
          .from('company_insights')
          .update({ is_active: false })
          .lt('expires_at', new Date().toISOString())
          .eq('is_active', true)
      );

      if (error) throw error;
      console.log('✅ Insights expirados limpiados');
    } catch (error) {
      console.error('Error limpiando insights expirados:', error);
    }
  }

  // Generar insights para todas las empresas
  async generateAllCompanyInsights() {
    try {
      console.log('🔄 Generando insights para todas las empresas...');
      
      const { data: companies, error } = await withRateLimit(
        'all-companies',
        () => supabase
          .from('companies')
          .select('name')
          .order('name', { ascending: true })
      );

      if (error) throw error;

      const results = [];
      for (const company of companies || []) {
        try {
          const insights = await this.generateCompanyInsights(company.name, true);
          results.push({ company: company.name, success: true, insights });
        } catch (error) {
          console.error(`Error generando insights para ${company.name}:`, error);
          results.push({ company: company.name, success: false, error: error.message });
        }
      }

      console.log(`✅ Insights generados para ${results.filter(r => r.success).length} empresas`);
      return results;
    } catch (error) {
      console.error('Error generando insights para todas las empresas:', error);
      return [];
    }
  }
}

// Exportar instancia única
const trendsAnalysisService = new TrendsAnalysisService();
export default trendsAnalysisService;