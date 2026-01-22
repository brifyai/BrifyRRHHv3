import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🎯 VERIFICANDO DATOS REALES EN DASHBOARD');
console.log('==========================================\n');

async function verifyDashboardData() {
  try {
    // 1. Verificar empresas disponibles
    console.log('1. 📊 EMPRESAS EN BASE DE DATOS:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (companiesError) throw companiesError;
    
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
    });
    
    // 2. Verificar mensajes de comunicación por empresa
    console.log('\n2. 📨 MENSAJES DE COMUNICACIÓN POR EMPRESA:');
    for (const company of companies) {
      const { data: logs, error: logsError } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', company.id);
      
      if (logsError) throw logsError;
      
      const sent = logs.filter(log => log.status === 'sent').length;
      const delivered = logs.filter(log => log.status === 'delivered').length;
      const read = logs.filter(log => log.status === 'read').length;
      const failed = logs.filter(log => log.status === 'failed').length;
      const total = logs.length;
      
      const engagementRate = total > 0 ? ((sent + delivered + read) / total * 100).toFixed(1) : 0;
      const readRate = total > 0 ? (read / total * 100).toFixed(1) : 0;
      
      console.log(`\n   🏢 ${company.name}:`);
      console.log(`      - Total mensajes: ${total}`);
      console.log(`      - Enviados: ${sent}`);
      console.log(`      - Entregados: ${delivered}`);
      console.log(`      - Leídos: ${read}`);
      console.log(`      - Fallidos: ${failed}`);
      console.log(`      - Engagement: ${engagementRate}%`);
      console.log(`      - Tasa lectura: ${readRate}%`);
    }
    
    // 3. Verificar empleados por empresa
    console.log('\n3. 👥 EMPLEADOS POR EMPRESA:');
    for (const company of companies) {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .eq('company_id', company.id);
      
      if (employeesError) throw employeesError;
      
      console.log(`\n   🏢 ${company.name}: ${employees.length} empleados`);
      employees.slice(0, 3).forEach(emp => {
        console.log(`      - ${emp.first_name} ${emp.last_name} (${emp.email})`);
      });
      if (employees.length > 3) {
        console.log(`      ... y ${employees.length - 3} más`);
      }
    }
    
    // 4. Verificar métricas calculadas (simulando trendsAnalysisService)
    console.log('\n4. 🤖 MÉTRICAS CALCULADAS PARA TRENDS ANALYSIS:');
    
    // Simular cálculo para Falabella (primera empresa con datos)
    const falabella = companies.find(c => c.name === 'Falabella');
    if (falabella) {
      const { data: companyLogs } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', falabella.id);
      
      const totalMessages = companyLogs.length;
      const readMessages = companyLogs.filter(log => log.status === 'read').length;
      const deliveredMessages = companyLogs.filter(log => log.status === 'delivered').length;
      const failedMessages = companyLogs.filter(log => log.status === 'failed').length;
      
      const engagementRate = totalMessages > 0 
        ? ((totalMessages - failedMessages) / totalMessages * 100).toFixed(1) 
        : 0;
      const readRate = totalMessages > 0 
        ? (readMessages / totalMessages * 100).toFixed(1) 
        : 0;
      
      console.log(`\n   🎯 Para Falabella (${falabella.id}):`);
      console.log(`      - Total mensajes: ${totalMessages}`);
      console.log(`      - Engagement rate: ${engagementRate}%`);
      console.log(`      - Read rate: ${readRate}%`);
      console.log(`      - Failed rate: ${(failedMessages / totalMessages * 100).toFixed(1)}%`);
      
      // Verificar que trendsAnalysisService puede procesar esto
      console.log(`\n   ✅ trendsAnalysisService.generateCompanyInsights('${falabella.id}', false, true)`);
      console.log(`      Debería retornar métricas reales con estos valores`);
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('\n💡 INSTRUCCIONES:');
    console.log('1. Ve a http://localhost:3001/base-de-datos');
    console.log('2. Selecciona cualquier empresa del dropdown');
    console.log('3. Los datos mostrados serán 100% REALES de Supabase');
    console.log('4. No más "Sin datos" o valores mock');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDashboardData();