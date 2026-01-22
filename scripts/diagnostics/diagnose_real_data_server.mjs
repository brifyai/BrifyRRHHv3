import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Configurar Supabase con variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno no configuradas');
  console.log('   REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
      console.log('   ✅ Los valores deberían ser: sentMessages=0, readMessages=0, readRate=0%');
    } else {
      console.log('   📊 Muestra de registros:');
      commLogs.forEach((log, i) => {
        if (i < 5) {
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
  
  // 4. Verificar si hay datos antiguos (más de 30 días)
  console.log('\n4. VERIFICACIÓN DE FECHAS (últimos 30 días):');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  console.log('   📅 Fecha límite (30 días atrás):', thirtyDaysAgo.toISOString());
  
  if (commLogs && commLogs.length > 0) {
    const recentLogs = commLogs.filter(log => new Date(log.created_at) >= thirtyDaysAgo);
    const oldLogs = commLogs.filter(log => new Date(log.created_at) < thirtyDaysAgo);
    
    console.log(`   ✅ Mensajes últimos 30 días: ${recentLogs.length}`);
    console.log(`   ⚠️  Mensajes antiguos (>30 días): ${oldLogs.length}`);
  }
  
  console.log('\n🔍 RESUMEN FINAL:');
  console.log(`   - Empresas: ${companies?.length || 0}`);
  console.log(`   - Empleados: ${employees?.length || 0}`);
  console.log(`   - Mensajes totales: ${commLogs?.length || 0}`);
  console.log(`   - Mensajes últimos 30 días: ${commLogs?.filter(log => new Date(log.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0}`);
  
  if (!commLogs || commLogs.length === 0) {
    console.log('\n✅ CONCLUSIÓN: La tabla communication_logs está VACÍA.');
    console.log('   ✅ Los valores en el dashboard deberían ser:');
    console.log('      - Mensajes Enviados: 0');
    console.log('      - Tasa de Lectura: 0%');
    console.log('      - Sentimiento: 0.00');
  }
}

diagnoseRealData().catch(console.error);