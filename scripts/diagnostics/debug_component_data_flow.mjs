import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import trendsAnalysisService from './src/services/trendsAnalysisService.js';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔍 DEBUG: Flujo de datos en el componente React');
console.log('==============================================\n');

async function debugComponentDataFlow() {
  try {
    // Simular EXACTAMENTE lo que hace el componente
    
    // PASO 1: Cargar empresas (como loadCompaniesFromDB)
    console.log('1. 📊 CARGANDO EMPRESAS DESDE organizedDatabaseService:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (companiesError) throw companiesError;
    console.log(`   ✅ ${companies.length} empresas cargadas`);
    
    // PASO 2: Seleccionar Falabella (como cuando el usuario selecciona en el dropdown)
    const falabella = companies.find(c => c.name === 'Falabella');
    console.log(`\n2. 🎯 EMPRESA SELECCIONADA: ${falabella.name} (ID: ${falabella.id})`);
    
    // PASO 3: Llamar a loadCompanyMetrics (como en el useEffect)
    console.log('\n3. 📈 LLAMANDO A loadCompanyMetrics:');
    console.log(`   companyId: ${falabella.id}`);
    console.log(`   isId: true`);
    
    // Esto es EXACTAMENTE lo que hace el componente en la línea 304
    const insights = await trendsAnalysisService.generateCompanyInsights(falabella.id, false, true);
    
    console.log('\n4. 📤 RESULTADO DE generateCompanyInsights:');
    console.log(JSON.stringify(insights, null, 2));
    
    // PASO 5: Extraer métricas (como en el componente líneas 310-322)
    console.log('\n5. 🔍 EXTRAYENDO MÉTRICAS PARA EL ESTADO:');
    
    const employeeData = insights.employeeData || {};
    const communicationMetrics = insights.communicationMetrics || {};
    
    const companyMetrics = {
      employeeCount: employeeData.totalEmployees || 0,
      messageStats: {
        total: communicationMetrics.totalMessages || 0,
        read: communicationMetrics.readMessages || 0,
        sent: communicationMetrics.sentMessages || 0,
        scheduled: communicationMetrics.scheduledMessages || 0,
        failed: communicationMetrics.failedMessages || 0
      },
      engagementRate: communicationMetrics.engagementRate || 0,
      deliveryRate: communicationMetrics.deliveryRate || 0,
      readRate: communicationMetrics.readRate || 0
    };
    
    console.log('   companyMetrics final:', JSON.stringify(companyMetrics, null, 2));
    
    // PASO 6: Verificar qué muestra el componente
    console.log('\n6. 🖥️  LO QUE DEBERÍA MOSTRAR EL COMPONENTE:');
    console.log(`   - Empleados: ${companyMetrics.employeeCount}`);
    console.log(`   - Engagement: ${companyMetrics.engagementRate}%`);
    console.log(`   - Mensajes: ${companyMetrics.messageStats.total}`);
    
    // PASO 7: Verificar si hay error en el servicio
    if (companyMetrics.employeeCount === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   El servicio trendsAnalysisService está retornando employeeData vacío');
      console.log('   o el componente no está recibiendo los datos correctamente.');
    } else {
      console.log('\n✅ TODO FUNCIONA CORRECTAMENTE');
      console.log('   El problema está en cómo el componente renderiza los datos');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugComponentDataFlow();