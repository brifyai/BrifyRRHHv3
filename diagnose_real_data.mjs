import { supabase } from './src/lib/supabaseClient.js';

async function diagnoseRealData() {
  console.log('🔍 DIAGNÓSTICO DE DATOS REALES EN SUPABASE\n');
  
  // 1. Verificar empresas activas
  console.log('1. EMPRESAS ACTIVAS:');
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .order('name');
  
  if (companiesError) {
    console.error('❌ Error:', companiesError.message);
  } else {
    console.log(`   ✅ Total empresas: ${companies.length}`);
    companies.forEach(c => {
      const status = c.status || 'null';
      console.log(`   - ${c.name} (ID: ${c.id}, Status: ${status})`);
    });
  }
  
  // 2. Verificar empleados
  console.log('\n2. EMPLEADOS:');
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, full_name, company_id')
    .order('company_id');
  
  if (employeesError) {
    console.error('❌ Error:', employeesError.message);
  } else {
    console.log(`   ✅ Total empleados: ${employees.length}`);
    // Contar por empresa
    const byCompany = {};
    employees.forEach(emp => {
      byCompany[emp.company_id] = (byCompany[emp.company_id] || 0) + 1;
    });
    console.log('   📊 Distribución por empresa:');
    Object.entries(byCompany).forEach(([companyId, count]) => {
      const company = companies.find(c => c.id === companyId);
      const name = company ? company.name : 'Empresa desconocida';
      console.log(`      - ${name}: ${count} empleados`);
    });
  }
  
  // 3. Verificar communication_logs (ESTO ES LO CRÍTICO)
  console.log('\n3. COMMUNICATION_LOGS (TABLA CRÍTICA):');
  const { data: commLogs, error: commError } = await supabase
    .from('communication_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (commError) {
    console.error('❌ Error:', commError.message);
  } else {
    console.log(`   ✅ Total registros: ${commLogs.length}`);
    
    if (commLogs.length === 0) {
      console.log('   ⚠️  TABLA VACÍA - Esto explica por qué los datos no deberían aparecer');
    } else {
      console.log('   📊 Muestra de registros:');
      commLogs.forEach((log, i) => {
        if (i < 5) { // Mostrar solo los primeros 5
          console.log(`      - ID: ${log.id}, Company: ${log.company_id}, Status: ${log.status}, Type: ${log.type}, Date: ${log.created_at}`);
        }
      });
      
      // Análisis por empresa
      console.log('\n   📊 Análisis por empresa:');
      const byCompany = {};
      commLogs.forEach(log => {
        byCompany[log.company_id] = (byCompany[log.company_id] || 0) + 1;
      });
      Object.entries(byCompany).forEach(([companyId, count]) => {
        const company = companies.find(c => c.id === companyId);
        const name = company ? company.name : 'Empresa desconocida';
        console.log(`      - ${name}: ${count} mensajes`);
      });
    }
  }
  
  // 4. Verificar estructura de communication_logs
  console.log('\n4. ESTRUCTURA DE COMMUNICATION_LOGS:');
  if (commLogs.length > 0 && commLogs[0]) {
    const columns = Object.keys(commLogs[0]);
    console.log('   ✅ Columnas:', columns.join(', '));
    
    // Verificar si hay columnas inesperadas con datos
    columns.forEach(col => {
      if (col !== 'id' && col !== 'company_id' && col !== 'employee_id' && 
          col !== 'status' && col !== 'type' && col !== 'created_at') {
        const hasData = commLogs.some(log => log[col] !== null && log[col] !== undefined);
        if (hasData) {
          console.log(`   ⚠️  Columna inesperada con datos: ${col}`);
        }
      }
    });
  }
  
  // 5. Verificar si hay datos antiguos (más de 30 días)
  console.log('\n5. VERIFICACIÓN DE FECHAS (últimos 30 días):');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  console.log('   📅 Fecha límite (30 días atrás):', thirtyDaysAgo.toISOString());
  
  if (commLogs.length > 0) {
    const recentLogs = commLogs.filter(log => new Date(log.created_at) >= thirtyDaysAgo);
    const oldLogs = commLogs.filter(log => new Date(log.created_at) < thirtyDaysAgo);
    
    console.log(`   ✅ Mensajes últimos 30 días: ${recentLogs.length}`);
    console.log(`   ⚠️  Mensajes antiguos (>30 días): ${oldLogs.length}`);
    
    if (oldLogs.length > 0) {
      console.log('   📊 Mensajes antiguos por empresa:');
      const oldByCompany = {};
      oldLogs.forEach(log => {
        oldByCompany[log.company_id] = (oldByCompany[log.company_id] || 0) + 1;
      });
      Object.entries(oldByCompany).forEach(([companyId, count]) => {
        const company = companies.find(c => c.id === companyId);
        const name = company ? company.name : 'Empresa desconocida';
        console.log(`      - ${name}: ${count} mensajes antiguos`);
      });
    }
  }
  
  console.log('\n🔍 RESUMEN:');
  console.log(`   - Empresas: ${companies?.length || 0}`);
  console.log(`   - Empleados: ${employees?.length || 0}`);
  console.log(`   - Mensajes totales: ${commLogs?.length || 0}`);
  console.log(`   - Mensajes últimos 30 días: ${commLogs?.filter(log => new Date(log.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0}`);
  
  if (commLogs.length === 0) {
    console.log('\n✅ CONCLUSIÓN: La tabla communication_logs está VACÍA.');
    console.log('   Esto significa que TODOS los valores deberían ser 0.');
    console.log('   Si ves valores diferentes, hay un BUG en el código.');
  }
}

diagnoseRealData().catch(console.error);