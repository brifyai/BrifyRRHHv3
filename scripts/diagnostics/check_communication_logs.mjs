import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://supabase.staffhub.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function checkCommunicationLogs() {
  try {
    console.log('🔍 Verificando tabla communication_logs...');
    
    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error contando registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros en communication_logs: ${count}`);
    
    if (count > 0) {
      // Mostrar primeros 10 registros
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .limit(10);
      
      if (error) {
        console.error('Error obteniendo registros:', error);
        return;
      }
      
      console.log('📋 Primeros 10 registros:');
      data.forEach((log, index) => {
        console.log(`  ${index + 1}. ID: ${log.id}`);
        console.log(`     Company ID: ${log.company_id}`);
        console.log(`     Status: ${log.status}`);
        console.log(`     Created: ${log.created_at}`);
        console.log('---');
      });
      
      // Agrupar por status
      const { data: statusData } = await supabase
        .from('communication_logs')
        .select('status');
      
      const statusCounts = {};
      statusData.forEach(log => {
        statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
      });
      
      console.log('📈 Distribución por status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
      
      // Verificar si hay datos de prueba
      console.log('\n🚨 ANÁLISIS DE DATOS SOSPECHOSOS:');
      const { data: allData } = await supabase
        .from('communication_logs')
        .select('*');
      
      const oldData = allData.filter(log => {
        const createdAt = new Date(log.created_at);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return createdAt < oneWeekAgo;
      });
      
      if (oldData.length > 0) {
        console.log(`⚠️ Se encontraron ${oldData.length} registros con más de una semana de antigüedad`);
        console.log('Estos podrían ser datos de prueba o falsos');
      }
      
      // Verificar empresas sin empleados pero con comunicación
      const { data: companiesWithEmployees } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          employees(count)
        `);
      
      const companiesWithoutEmployees = companiesWithEmployees.filter(company => 
        (company.employees || []).length === 0
      );
      
      if (companiesWithoutEmployees.length > 0) {
        console.log(`⚠️ Hay ${companiesWithoutEmployees.length} empresas sin empleados`);
        companiesWithoutEmployees.forEach(company => {
          const companyLogs = allData.filter(log => log.company_id === company.id);
          if (companyLogs.length > 0) {
            console.log(`   - ${company.name}: ${companyLogs.length} logs de comunicación pero 0 empleados`);
          }
        });
      }
    } else {
      console.log('✅ No hay registros en communication_logs - esto es correcto si no has enviado mensajes');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCommunicationLogs();