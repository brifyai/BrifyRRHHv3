import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔍 DEBUG: Flujo de datos simple en el componente');
console.log('==============================================\n');

async function debugSimpleDataFlow() {
  try {
    // PASO 1: Cargar empresas (como loadCompaniesFromDB)
    console.log('1. 📊 CARGANDO EMPRESAS:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (companiesError) throw companiesError;
    console.log(`   ✅ ${companies.length} empresas cargadas`);
    
    // PASO 2: Seleccionar Falabella
    const falabella = companies.find(c => c.name === 'Falabella');
    console.log(`\n2. 🎯 EMPRESA SELECCIONADA: ${falabella.name}`);
    console.log(`   ID: ${falabella.id} (tipo: ${typeof falabella.id})`);
    
    // PASO 3: Simular loadCompanyMetrics (línea 304 del componente)
    console.log('\n3. 📈 SIMULANDO loadCompanyMetrics:');
    console.log(`   trendsAnalysisService.generateCompanyInsights('${falabella.id}', false, true)`);
    
    // PASO 4: Obtener datos manualmente (lo que hace el servicio)
    console.log('\n4. 🔍 OBTENIENDO DATOS MANUALMENTE:');
    
    // Obtener empresa por ID (como en trendsAnalysisService línea 23-27)
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', falabella.id)
      .maybeSingle();
    
    if (companyError || !companyData) {
      console.log(`   ❌ Error obteniendo empresa:`, companyError || 'No encontrada');
      return;
    }
    console.log(`   ✅ Empresa: ${companyData.name}`);
    
    // Obtener métricas de comunicación (como trendsAnalysisService línea 135-140)
    const { data: logs, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('company_id', falabella.id);
    
    if (logsError) {
      console.log(`   ❌ Error obteniendo logs:`, logsError.message);
    } else {
      console.log(`   📨 Mensajes: ${logs?.length || 0}`);
    }
    
    // Obtener empleados (como trendsAnalysisService línea 204-207) - ESTO ES CRÍTICO
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', falabella.id);
    
    if (employeesError) {
      console.log(`   ❌ Error obteniendo empleados:`, employeesError.message);
    } else {
      console.log(`   👥 Empleados: ${employees?.length || 0}`);
    }
    
    // PASO 5: Construir el objeto como lo hace el componente (líneas 310-322)
    console.log('\n5. 🏗️  CONSTRUYENDO companyMetrics (como el componente):');
    
    const employeeData = {
      totalEmployees: employees?.length || 0,
      departments: {},
      levels: {},
      workModes: {},
      regions: {},
      positions: {}
    };
    
    // Analizar distribución (como trendsAnalysisService líneas 221-241)
    employees?.forEach(employee => {
      const dept = employee.department || 'unknown';
      employeeData.departments[dept] = (employeeData.departments[dept] || 0) + 1;
    });
    
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
    
    const companyMetrics = {
      employeeCount: employeeData.totalEmployees || 0,
      messageStats: {
        total: communicationMetrics.totalMessages || 0,
        read: communicationMetrics.readMessages || 0,
        sent: communicationMetrics.sentMessages || 0
      },
      engagementRate: communicationMetrics.engagementRate || 0
    };
    
    console.log('\n6. 📤 RESULTADO FINAL (setCompanyMetrics):');
    console.log(JSON.stringify(companyMetrics, null, 2));
    
    // PASO 7: Verificar qué muestra el componente
    console.log('\n7. 🖥️  RENDERIZADO EN EL COMPONENTE:');
    console.log(`   Línea 695: Empleados: ${companyMetrics.employeeCount}`);
    console.log(`   Línea 718: Engagement: ${companyMetrics.engagementRate}%`);
    console.log(`   Línea 735: Tasa Lectura: ${companyMetrics.messageStats.read}%`);
    console.log(`   Línea 752: Mensajes: ${companyMetrics.messageStats.total}`);
    console.log(`   Línea 765: Empleados: ${companyMetrics.employeeCount}`);
    
    if (companyMetrics.employeeCount === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   El componente recibiría employeeCount: 0');
      console.log('   Esto significa que trendsAnalysisService no está retornando los datos correctamente');
    } else {
      console.log('\n✅ DATOS CORRECTOS:');
      console.log('   El componente debería mostrar los datos reales correctamente');
      console.log('   Si muestra 0, el problema está en cómo el componente recibe o renderiza los datos');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugSimpleDataFlow();