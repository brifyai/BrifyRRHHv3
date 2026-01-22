import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import groqService from './src/services/groqService.js';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔬 DEBUG: Test del servicio trendsAnalysisService REAL');
console.log('=====================================================\n');

// Copiar los métodos EXACTOS del servicio para evitar dependencia de window
class TestTrendsAnalysisService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000;
  }

  async generateCompanyInsights(companyIdentifier, forceRegenerate = false, isId = false) {
    try {
      console.log(`\n🎯 [generateCompanyInsights] INICIO`);
      console.log(`   companyIdentifier: ${companyIdentifier}`);
      console.log(`   forceRegenerate: ${forceRegenerate}`);
      console.log(`   isId: ${isId}`);
      
      // PASO 1: Obtener datos de la empresa
      let companyData;
      if (isId) {
        console.log(`   🔍 Buscando empresa por ID: ${companyIdentifier}`);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyIdentifier)
          .maybeSingle();
        
        if (error) {
          console.log(`   ❌ Error buscando empresa por ID:`, error.message);
          throw error;
        }
        companyData = data;
        console.log(`   ✅ Empresa encontrada: ${companyData?.name || 'null'}`);
      } else {
        console.log(`   🔍 Buscando empresa por nombre: ${companyIdentifier}`);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .ilike('name', `%${companyIdentifier}%`)
          .maybeSingle();
        
        if (error) {
          console.log(`   ❌ Error buscando empresa por nombre:`, error.message);
          throw error;
        }
        companyData = data;
        console.log(`   ✅ Empresa encontrada: ${companyData?.name || 'null'}`);
      }
      
      if (!companyData) {
        console.log(`   ❌ Empresa no encontrada: ${companyIdentifier}`);
        throw new Error(`Empresa ${companyIdentifier} no encontrada`);
      }

      // PASO 2: Obtener métricas de comunicación
      console.log(`   📡 Obteniendo métricas de comunicación...`);
      const communicationMetrics = await this.getCommunicationMetrics(companyData.id);
      console.log(`   ✅ Métricas obtenidas:`, JSON.stringify(communicationMetrics, null, 2));

      // PASO 3: Obtener datos de empleados
      console.log(`   📡 Obteniendo datos de empleados...`);
      const employeeData = await this.getEmployeeData(companyData.id);
      console.log(`   ✅ Empleados obtenidos:`, JSON.stringify(employeeData, null, 2));

      // PASO 4: Generar insights con IA
      console.log(`   🤖 Generando insights con IA...`);
      const insights = await this.generateInsightsWithAI({
        companyName: companyData.name,
        companyData,
        communicationMetrics,
        employeeData
      });
      console.log(`   ✅ Insights generados:`, JSON.stringify(insights, null, 2));

      // PASO 5: Guardar insights
      console.log(`   💾 Guardando insights...`);
      await this.saveInsights(companyData.name, insights);

      // PASO 6: Retornar resultado FINAL
      console.log(`   📤 Construyendo objeto de retorno...`);
      const result = {
        ...insights,
        communicationMetrics,
        employeeData,
        companyData
      };
      console.log(`   ✅ Resultado final:`, JSON.stringify(result, null, 2));
      console.log(`   📊 employeeData.totalEmployees: ${result.employeeData?.totalEmployees}`);
      console.log(`   📊 communicationMetrics.totalMessages: ${result.communicationMetrics?.totalMessages}`);
      
      return result;
    } catch (error) {
      console.error(`   ❌ ERROR CRÍTICO en generateCompanyInsights:`, error.message);
      console.error(`   📋 Stack:`, error.stack);
      console.log(`   ⚠️ Retornando fallback...`);
      return this.getFallbackInsights(companyIdentifier);
    }
  }

  async getCommunicationMetrics(companyId) {
    try {
      console.log(`      🔍 [getCommunicationMetrics] companyId: ${companyId}`);
      
      const { data: logs, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.log(`      ❌ Error:`, error.message);
        throw error;
      }

      console.log(`      ✅ Logs encontrados: ${logs?.length || 0}`);
      
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

      if (metrics.totalMessages > 0) {
        metrics.deliveryRate = (metrics.sentMessages / metrics.totalMessages) * 100;
        metrics.readRate = (metrics.readMessages / metrics.totalMessages) * 100;
        metrics.engagementRate = ((metrics.sentMessages + metrics.readMessages) / metrics.totalMessages) * 100;
      }

      console.log(`      📊 Métricas calculadas:`, JSON.stringify(metrics, null, 2));
      return metrics;
    } catch (error) {
      console.error(`      ❌ Error en getCommunicationMetrics:`, error.message);
      return this.getEmptyMetrics();
    }
  }

  async getEmployeeData(companyId) {
    try {
      console.log(`      🔍 [getEmployeeData] companyId: ${companyId}`);
      
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        console.log(`      ❌ Error:`, error.message);
        throw error;
      }

      console.log(`      ✅ Empleados encontrados: ${employees?.length || 0}`);
      if (employees && employees.length > 0) {
        console.log(`      📋 Primer empleado:`, employees[0]);
      }

      const employeeData = {
        totalEmployees: employees?.length || 0,
        departments: {},
        levels: {},
        workModes: {},
        regions: {},
        positions: {}
      };

      employees?.forEach(employee => {
        const dept = employee.department || 'unknown';
        employeeData.departments[dept] = (employeeData.departments[dept] || 0) + 1;
      });

      console.log(`      📊 EmployeeData:`, JSON.stringify(employeeData, null, 2));
      return employeeData;
    } catch (error) {
      console.error(`      ❌ Error en getEmployeeData:`, error.message);
      return this.getEmptyEmployeeData();
    }
  }

  async generateInsightsWithAI(data) {
    try {
      console.log(`      🤖 [generateInsightsWithAI] Generando con IA...`);
      const { companyName, companyData, communicationMetrics, employeeData } = data;

      // Construir prompt
      const prompt = this.buildAnalysisPrompt(companyName, companyData, communicationMetrics, employeeData);
      console.log(`      📋 Prompt construido (${prompt.length} caracteres)`);

      // Llamar a Groq
      console.log(`      📡 Llamando a groqService...`);
      const response = await groqService.generateCompletion({
        messages: [
          {
            role: 'system',
            content: `Eres un experto en análisis de comunicación empresarial...`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 2000
      });

      console.log(`      ✅ Respuesta de Groq recibida (${response.content.length} caracteres)`);

      // Parsear JSON
      let insights;
      try {
        insights = JSON.parse(response.content);
        console.log(`      ✅ JSON parseado correctamente`);
      } catch (parseError) {
        console.log(`      ❌ Error parseando JSON:`, parseError.message);
        insights = this.getFallbackInsights(companyName);
      }

      return insights;
    } catch (error) {
      console.error(`      ❌ Error en generateInsightsWithAI:`, error.message);
      return this.getFallbackInsights(data.companyName);
    }
  }

  buildAnalysisPrompt(companyName, companyData, communicationMetrics, employeeData) {
    return `
Analiza los siguientes datos de la empresa "${companyName}":

DATOS DE LA EMPRESA:
- Nombre: ${companyName}
- ID: ${companyData.id}

MÉTRICAS DE COMUNICACIÓN:
- Total de mensajes: ${communicationMetrics.totalMessages}
- Mensajes enviados: ${communicationMetrics.sentMessages}
- Mensajes leídos: ${communicationMetrics.readMessages}
- Tasa de engagement: ${communicationMetrics.engagementRate.toFixed(1)}%

DATOS DE EMPLEADOS:
- Total de empleados: ${employeeData.totalEmployees}

Genera insights específicos basados en estos datos.
`;
  }

  async saveInsights(companyName, insights) {
    try {
      console.log(`      💾 [saveInsights] Guardando insights para ${companyName}...`);
      // Simular guardado (no necesario para el test)
      console.log(`      ✅ Insights guardados (simulado)`);
    } catch (error) {
      console.error(`      ❌ Error en saveInsights:`, error.message);
    }
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
    console.log(`      ⚠️ [getFallbackInsights] Retornando fallback para ${companyName}`);
    return {
      frontInsights: [
        {
          type: 'info',
          title: 'Sin Datos de Comunicación',
          description: `No hay mensajes enviados para ${companyName}.`
        }
      ],
      backInsights: [
        {
          type: 'info',
          title: 'Sistema Listo',
          description: 'El sistema está conectado y esperando datos reales.'
        }
      ],
      communicationMetrics: this.getEmptyMetrics(),
      employeeData: this.getEmptyEmployeeData()
    };
  }
}

async function testRealService() {
  console.log('🧪 TEST DEL SERVICIO REAL');
  console.log('=========================\n');
  
  const service = new TestTrendsAnalysisService();
  const companyId = 'e2bb6325-b623-44f8-87a6-dc65f5347bd8'; // Falabella
  
  console.log(`🎯 Test con empresa ID: ${companyId} (Falabella)\n`);
  
  try {
    const result = await service.generateCompanyInsights(companyId, false, true);
    
    console.log('\n✅ TEST COMPLETADO');
    console.log('==================');
    console.log('📊 Resultado final:');
    console.log(`- employeeData.totalEmployees: ${result.employeeData?.totalEmployees}`);
    console.log(`- communicationMetrics.totalMessages: ${result.communicationMetrics?.totalMessages}`);
    console.log(`- frontInsights: ${result.frontInsights?.length || 0} items`);
    console.log(`- backInsights: ${result.backInsights?.length || 0} items`);
    
    // Verificar si es fallback
    if (result.frontInsights?.[0]?.title.includes('Sin Datos')) {
      console.log('\n⚠️  RESULTADO: FALLBACK (error silencioso)');
    } else {
      console.log('\n✅ RESULTADO: DATOS REALES');
    }
    
    console.log('\n📋 Objeto completo:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
  }
}

testRealService().catch(console.error);