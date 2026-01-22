import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔬 TEST PURO: Verificando datos sin dependencias de React');
console.log('=======================================================\n');

// Simular EXACTAMENTE lo que hace trendsAnalysisService sin importar nada
async function simulateTrendsAnalysisService(companyId) {
  console.log(`🎯 Simulando trendsAnalysisService.generateCompanyInsights`);
  console.log(`   companyId: ${companyId}, forceRegenerate=false, isId=true\n`);
  
  try {
    // PASO 1: Obtener empresa por ID (servicio línea 23-27)
    console.log('1️⃣  Obteniendo empresa por ID...');
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();
    
    if (companyError) {
      console.log(`   ❌ Error: ${companyError.message}`);
      throw companyError;
    }
    if (!companyData) {
      console.log(`   ❌ Empresa no encontrada`);
      throw new Error('Empresa no encontrada');
    }
    console.log(`   ✅ Empresa: ${companyData.name} (${companyData.id})`);
    
    // PASO 2: Obtener métricas de comunicación (servicio línea 135-140)
    console.log('\n2️⃣  Obteniendo métricas de comunicación...');
    const { data: logs, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('company_id', companyId);
    
    if (logsError) {
      console.log(`   ❌ Error: ${logsError.message}`);
      throw logsError;
    }
    console.log(`   ✅ Mensajes encontrados: ${logs?.length || 0}`);
    
    // PASO 3: Obtener empleados (servicio línea 204-207) - CRÍTICO
    console.log('\n3️⃣  Obteniendo empleados - PASO CRÍTICO...');
    console.log(`   🔍 Query: SELECT * FROM employees WHERE company_id = '${companyId}'`);
    
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId);
    
    if (employeesError) {
      console.log(`   ❌ Error: ${employeesError.message}`);
      console.log(`   📋 Error completo:`, JSON.stringify(employeesError, null, 2));
      throw employeesError;
    }
    console.log(`   ✅ Empleados encontrados: ${employees?.length || 0}`);
    
    if (employees && employees.length > 0) {
      console.log(`   📋 Primer empleado:`, employees[0]);
      console.log(`   📋 Último empleado:`, employees[employees.length - 1]);
    }
    
    // PASO 4: Construir employeeData (servicio línea 211-218)
    console.log('\n4️⃣  Construyendo employeeData...');
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
    
    console.log(`   📊 EmployeeData:`, JSON.stringify(employeeData, null, 2));
    
    // PASO 5: Construir communicationMetrics (servicio línea 148-174)
    console.log('\n5️⃣  Construyendo communicationMetrics...');
    const communicationMetrics = {
      totalMessages: logs?.length || 0,
      sentMessages: logs?.filter(log => log.status === 'sent').length || 0,
      readMessages: logs?.filter(log => log.status === 'read').length || 0,
      engagementRate: 0
    };
    
    if (communicationMetrics.totalMessages > 0) {
      communicationMetrics.engagementRate = 
        ((communicationMetrics.sentMessages + communicationMetrics.readMessages) / communicationMetrics.totalMessages) * 100;
    }
    
    console.log(`   📊 CommunicationMetrics:`, JSON.stringify(communicationMetrics, null, 2));
    
    // PASO 6: Construir objeto final (servicio línea 68-73 - CORREGIDO)
    console.log('\n6️⃣  Construyendo objeto de retorno FINAL...');
    const result = {
      // Insights de IA (simulados)
      frontInsights: [
        {
          type: 'positive',
          title: 'Comunicación Activa',
          description: `Se han enviado ${communicationMetrics.totalMessages} mensajes.`
        }
      ],
      backInsights: [
        {
          type: 'info',
          title: 'Datos Procesados',
          description: `Análisis completado para ${employeeData.totalEmployees} empleados.`
        }
      ],
      // Datos CRÍTICOS que faltaban
      communicationMetrics,
      employeeData,
      companyData
    };
    
    console.log(`   ✅ Objeto construido:`, JSON.stringify(result, null, 2));
    console.log(`   📊 Resultado final:`);
    console.log(`      - employeeData.totalEmployees: ${result.employeeData.totalEmployees}`);
    console.log(`      - communicationMetrics.totalMessages: ${result.communicationMetrics.totalMessages}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error('📋 Stack:', error.stack);
    
    // Retornar fallback
    return {
      frontInsights: [{ type: 'info', title: 'Error', description: error.message }],
      backInsights: [],
      communicationMetrics: {
        totalMessages: 0, sentMessages: 0, readMessages: 0, engagementRate: 0
      },
      employeeData: {
        totalEmployees: 0, departments: {}, levels: {}, workModes: {}, regions: {}, positions: {}
      }
    };
  }
}

// PASO 7: Simular el componente React
async function simulateComponent() {
  console.log('🎬 SIMULACIÓN DEL COMPONENTE REACT');
  console.log('===================================\n');
  
  // Estado inicial
  let state = {
    companiesFromDB: [],
    selectedCompany: 'all',
    companyMetrics: null
  };
  
  console.log('📌 ESTADO INICIAL:', JSON.stringify(state, null, 2));
  
  // PASO 7.1: Cargar empresas (simula loadCompaniesFromDB)
  console.log('\n1️⃣  Cargando empresas...');
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');
  
  state.companiesFromDB = companies;
  console.log(`   ✅ ${companies.length} empresas cargadas`);
  
  // PASO 7.2: Seleccionar Falabella
  console.log('\n2️⃣  Seleccionando Falabella...');
  const falabella = companies.find(c => c.name === 'Falabella');
  if (!falabella) {
    console.log('❌ Falabella no encontrada');
    return;
  }
  state.selectedCompany = falabella.id;
  console.log(`   ✅ Empresa seleccionada: ${falabella.name} (${falabella.id})`);
  
  // PASO 7.3: Llamar al servicio (simula loadCompanyMetrics línea 304)
  console.log('\n3️⃣  Llamando a trendsAnalysisService...');
  const serviceResult = await simulateTrendsAnalysisService(falabella.id);
  
  // PASO 7.4: Extraer métricas (simula componente líneas 307-322)
  console.log('\n4️⃣  Extrayendo métricas para el estado...');
  const employeeData = serviceResult.employeeData || {};
  const communicationMetrics = serviceResult.communicationMetrics || {};
  
  state.companyMetrics = {
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
  
  console.log('📌 ESTADO FINAL:', JSON.stringify(state, null, 2));
  
  // PASO 7.5: Verificar renderizado
  console.log('\n🖥️  RENDERIZADO EN EL COMPONENTE:');
  if (state.companyMetrics) {
    console.log(`   Línea 695: Empleados: ${state.companyMetrics.employeeCount}`);
    console.log(`   Línea 718: Engagement: ${state.companyMetrics.engagementRate}%`);
    console.log(`   Línea 735: Tasa Lectura: ${state.companyMetrics.readRate}%`);
    console.log(`   Línea 752: Mensajes: ${state.companyMetrics.messageStats.total}`);
    console.log(`   Línea 765: Empleados: ${state.companyMetrics.employeeCount}`);
    
    if (state.companyMetrics.employeeCount === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: employeeCount es 0');
      console.log('   Esto significa que el servicio retornó employeeData vacío');
      console.log('   o el componente no está recibiendo los datos correctamente');
    } else {
      console.log('\n✅ TODO FUNCIONA CORRECTAMENTE');
      console.log('   Si el navegador muestra 0, el problema es específico del entorno React');
    }
  }
}

// EJECUTAR TEST
console.log('🚀 INICIANDO TEST COMPLETO');
console.log('=========================\n');

simulateComponent().catch(error => {
  console.error('\n❌ ERROR EN TEST:', error.message);
  console.error('📋 Stack:', error.stack);
});