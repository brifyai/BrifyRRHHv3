import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔬 DEBUG ULTRA-DETALLADO: Simulación exacta del componente React');
console.log('================================================================\n');

// Simular el estado del componente
let mockState = {
  companiesFromDB: [],
  selectedCompany: 'all',
  companyMetrics: null,
  loading: true
};

// Simular setState
function setCompaniesFromDB(data) {
  mockState.companiesFromDB = data;
  console.log(`📊 Estado actualizado - companiesFromDB: ${data.length} empresas`);
}

function setSelectedCompany(id) {
  mockState.selectedCompany = id;
  console.log(`🎯 Estado actualizado - selectedCompany: ${id}`);
}

function setCompanyMetrics(metrics) {
  mockState.companyMetrics = metrics;
  console.log(`📈 Estado actualizado - companyMetrics:`, JSON.stringify(metrics, null, 2));
}

function setLoadingCompanies(isLoading) {
  mockState.loading = isLoading;
  console.log(`⏳ Estado actualizado - loading: ${isLoading}`);
}

async function loadCompaniesFromDB() {
  console.log('🔄 [loadCompaniesFromDB] INICIO');
  setLoadingCompanies(true);
  
  try {
    // PASO 1: Limpiar estado (línea 220)
    console.log('   🧹 Limpiando estado previo...');
    setCompaniesFromDB([]);
    
    // PASO 2: Cargar empresas (línea 228)
    console.log('   📡 Llamando a organizedDatabaseService.getCompanies()...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (companiesError) throw companiesError;
    console.log(`   ✅ Empresas cargadas: ${companies.length}`);
    
    // PASO 3: Cargar empleados (línea 238)
    console.log('   📡 Llamando a organizedDatabaseService.getEmployees()...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*');
    
    if (employeesError) throw employeesError;
    console.log(`   ✅ Empleados cargados: ${employees.length}`);
    
    // PASO 4: Verificar duplicados (líneas 242-256)
    const uniqueCompanies = companies.filter((company, index, self) =>
      index === self.findIndex((c) => c.id === company.id)
    );
    console.log(`   🔍 Empresas únicas: ${uniqueCompanies.length}`);
    
    // PASO 5: Actualizar estado (líneas 259-260)
    setCompaniesFromDB(uniqueCompanies);
    console.log(`   📊 Estado companiesFromDB actualizado: ${mockState.companiesFromDB.length}`);
    
  } catch (error) {
    console.error('❌ Error en loadCompaniesFromDB:', error.message);
    setCompaniesFromDB([]);
  } finally {
    setLoadingCompanies(false);
    console.log('✅ [loadCompaniesFromDB] FIN\n');
  }
}

async function loadCompanyMetrics(companyId) {
  console.log(`🔄 [loadCompanyMetrics] INICIO - companyId: ${companyId}`);
  
  try {
    // PASO 1: Validar companyId (línea 289)
    if (!companyId || companyId === 'all') {
      console.log('   ⚠️ companyId es "all" o null, estableciendo null');
      setCompanyMetrics(null);
      return;
    }
    
    // PASO 2: Buscar empresa en el estado (línea 295)
    console.log(`   🔍 Buscando empresa en companiesFromDB...`);
    const company = mockState.companiesFromDB.find(c => c.id === companyId);
    
    if (!company) {
      console.warn(`   ❌ No se encontró empresa con ID: ${companyId}`);
      console.warn(`   📋 Empresas disponibles:`, mockState.companiesFromDB.map(c => ({ id: c.id, name: c.name })));
      setCompanyMetrics(null);
      return;
    }
    
    console.log(`   ✅ Empresa encontrada: ${company.name} (${company.id})`);
    
    // PASO 3: Llamar a trendsAnalysisService (línea 304)
    console.log(`   📡 Llamando a trendsAnalysisService.generateCompanyInsights...`);
    console.log(`      Parámetros: companyId='${companyId}', forceRegenerate=false, isId=true`);
    
    // SIMULAR EL SERVICIO PASO A PASO
    console.log(`   🔍 [SIMULACIÓN SERVICIO] Obteniendo datos de Supabase...`);
    
    // Obtener empresa por ID (servicio línea 23-27)
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();
    
    if (companyError || !companyData) {
      console.log(`   ❌ Error obteniendo empresa:`, companyError?.message || 'No encontrada');
      return;
    }
    console.log(`   ✅ Empresa obtenida: ${companyData.name}`);
    
    // Obtener métricas de comunicación (servicio línea 135-140)
    const { data: logs, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('company_id', companyId);
    
    if (logsError) {
      console.log(`   ❌ Error obteniendo logs:`, logsError.message);
    } else {
      console.log(`   📨 Mensajes obtenidos: ${logs?.length || 0}`);
    }
    
    // Obtener empleados (servicio línea 204-207) - ESTO ES CRÍTICO
    console.log(`   🔍 [CRÍTICO] Obteniendo empleados con company_id='${companyId}'...`);
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId);
    
    if (employeesError) {
      console.log(`   ❌ Error obteniendo empleados:`, employeesError.message);
      console.log(`   📋 Error completo:`, JSON.stringify(employeesError, null, 2));
    } else {
      console.log(`   ✅ Empleados obtenidos: ${employees?.length || 0}`);
      if (employees && employees.length > 0) {
        console.log(`   📋 Primer empleado:`, employees[0]);
      }
    }
    
    // Construir employeeData (servicio línea 211-218)
    const employeeData = {
      totalEmployees: employees?.length || 0,
      departments: {},
      levels: {},
      workModes: {},
      regions: {},
      positions: {}
    };
    
    // Analizar distribución (servicio línea 221-241)
    employees?.forEach(employee => {
      const dept = employee.department || 'unknown';
      employeeData.departments[dept] = (employeeData.departments[dept] || 0) + 1;
    });
    
    console.log(`   📊 EmployeeData construido:`, JSON.stringify(employeeData, null, 2));
    
    // Construir communicationMetrics (servicio línea 148-174)
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
    
    console.log(`   📊 CommunicationMetrics construido:`, JSON.stringify(communicationMetrics, null, 2));
    
    // PASO 4: Construir objeto final (componente líneas 310-322)
    console.log(`   🏗️  Construyendo companyMetrics para setState...`);
    
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
    
    console.log(`   📤 Objeto companyMetrics final:`, JSON.stringify(companyMetrics, null, 2));
    
    // PASO 5: Actualizar estado (componente línea 310)
    setCompanyMetrics(companyMetrics);
    console.log(`   ✅ Estado companyMetrics actualizado`);
    
  } catch (error) {
    console.error(`   ❌ Error en loadCompanyMetrics:`, error.message);
    console.error(`   📋 Stack:`, error.stack);
    
    // Fallback (componente líneas 332-338)
    console.log(`   ⚠️ Aplicando fallback por error...`);
    setCompanyMetrics({
      employeeCount: 0,
      messageStats: { total: 0, read: 0, sent: 0, scheduled: 0, failed: 0 },
      engagementRate: 0,
      deliveryRate: 0,
      readRate: 0
    });
  }
  
  console.log('✅ [loadCompanyMetrics] FIN\n');
}

async function debugComponentFlow() {
  console.log('🎬 INICIANDO SIMULACIÓN EXACTA DEL COMPONENTE');
  console.log('==============================================\n');
  
  // PASO 1: Inicializar dashboard (simula useEffect línea 343)
  console.log('📌 PASO 1: useEffect inicial (línea 343)');
  await loadCompaniesFromDB();
  
  // PASO 2: Verificar estado después de cargar empresas
  console.log('📊 ESTADO ACTUAL DESPUÉS DE CARGAR EMPRESAS:');
  console.log(`- companiesFromDB: ${mockState.companiesFromDB.length} empresas`);
  console.log(`- selectedCompany: ${mockState.selectedCompany}`);
  console.log(`- loading: ${mockState.loading}`);
  
  // PASO 3: Seleccionar Falabella (simula cambio en dropdown línea 383)
  const falabella = mockState.companiesFromDB.find(c => c.name === 'Falabella');
  if (falabella) {
    console.log(`\n📌 PASO 2: Seleccionando empresa (simula onChange)`);
    console.log(`🎯 Empresa seleccionada: ${falabella.name} (${falabella.id})`);
    setSelectedCompany(falabella.id);
  } else {
    console.log('\n❌ ERROR CRÍTICO: No se encontró Falabella en companiesFromDB');
    console.log('📋 Empresas disponibles:', mockState.companiesFromDB.map(c => c.name));
    return;
  }
  
  // PASO 4: Cargar métricas (simula useEffect línea 382-384)
  console.log('\n📌 PASO 3: useEffect de métricas (línea 382-384)');
  console.log(`🔄 selectedCompany cambió a: ${mockState.selectedCompany}`);
  await loadCompanyMetrics(mockState.selectedCompany);
  
  // PASO 5: Verificar estado final
  console.log('\n📊 ESTADO FINAL DEL COMPONENTE:');
  console.log(`- selectedCompany: ${mockState.selectedCompany}`);
  console.log(`- companyMetrics:`, JSON.stringify(mockState.companyMetrics, null, 2));
  
  // PASO 6: Verificar renderizado
  console.log('\n🖥️  LO QUE DEBERÍA RENDERIZAR EL COMPONENTE:');
  if (mockState.companyMetrics) {
    console.log(`   Línea 695: Empleados: ${mockState.companyMetrics.employeeCount}`);
    console.log(`   Línea 718: Engagement: ${mockState.companyMetrics.engagementRate}%`);
    console.log(`   Línea 735: Tasa Lectura: ${mockState.companyMetrics.readRate}%`);
    console.log(`   Línea 752: Mensajes: ${mockState.companyMetrics.messageStats.total}`);
    console.log(`   Línea 765: Empleados: ${mockState.companyMetrics.employeeCount}`);
  } else {
    console.log('   ❌ companyMetrics es null - no se renderizará nada');
  }
  
  console.log('\n✅ SIMULACIÓN COMPLETADA');
}

debugComponentFlow().catch(console.error);