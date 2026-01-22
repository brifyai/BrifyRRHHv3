import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://hacjbpqokpvbkczaqapk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhY2picHFva3B2YmtjemFxYXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMzIxMTksImV4cCI6MjA0OTgwODExOX0.7w6nK0jS_tZJbZwLrJGhP1rNjZ3xJ3XJfJkKJZJkKJk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICACIÓN DE DATOS DE TENDENCIAS');
console.log('=====================================');

async function checkTrendsData() {
  try {
    // 1. Verificar communication_logs
    console.log('\n📊 Paso 1: Verificando communication_logs...');
    const { data: logsData, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .limit(5);
    
    if (logsError) {
      console.error('❌ Error en communication_logs:', logsError);
    } else {
      console.log(`   Registros en communication_logs: ${logsData.length}`);
      if (logsData.length > 0) {
        console.log('   Muestra de datos:');
        logsData.forEach((log, index) => {
          console.log(`   ${index + 1}. ID: ${log.id}, Compañía: ${log.company_name}, Enviado: ${log.sent}, Leído: ${log.read}`);
        });
      }
    }

    // 2. Verificar empresas
    console.log('\n🏢 Paso 2: Verificando empresas...');
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, employee_count')
      .order('name');
    
    if (companiesError) {
      console.error('❌ Error en empresas:', companiesError);
    } else {
      console.log(`   Total de empresas: ${companiesData.length}`);
      console.log('   Lista de empresas:');
      companiesData.forEach(company => {
        console.log(`   - ${company.name} (ID: ${company.id}, Empleados: ${company.employee_count})`);
      });
    }

    // 3. Verificar empleados
    console.log('\n👥 Paso 3: Verificando empleados...');
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('company_id')
      .limit(10);
    
    if (employeesError) {
      console.error('❌ Error en empleados:', employeesError);
    } else {
      console.log(`   Total de empleados (muestra): ${employeesData.length}`);
      
      // Contar empleados por empresa
      const employeeCounts = {};
      employeesData.forEach(emp => {
        employeeCounts[emp.company_id] = (employeeCounts[emp.company_id] || 0) + 1;
      });
      
      console.log('   Distribución por empresa (muestra):');
      Object.entries(employeeCounts).forEach(([companyId, count]) => {
        const company = companiesData?.find(c => c.id === companyId);
        console.log(`   - ${company?.name || companyId}: ${count} empleados`);
      });
    }

    // 4. Verificar si hay datos de tendencias reales
    console.log('\n📈 Paso 4: Verificando datos para tendencias...');
    
    if (logsData && logsData.length > 0) {
      console.log('✅ Hay datos reales para generar tendencias');
      
      // Calcular métricas reales
      const totalSent = logsData.reduce((sum, log) => sum + (log.sent || 0), 0);
      const totalRead = logsData.reduce((sum, log) => sum + (log.read || 0), 0);
      const engagementRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;
      
      console.log(`   Métricas reales calculadas:`);
      console.log(`   - Mensajes enviados: ${totalSent}`);
      console.log(`   - Mensajes leídos: ${totalRead}`);
      console.log(`   - Engagement rate: ${engagementRate}%`);
    } else {
      console.log('❌ No hay datos en communication_logs para generar tendencias');
      console.log('   Las tendencias deberían mostrar "Sin Datos" o "0%"');
    }

    // 5. Verificación final
    console.log('\n🎯 Paso 5: Verificación final de tendencias...');
    console.log('   Valores esperados en la interfaz:');
    console.log('   - Engagement: 0% (sin datos)');
    console.log('   - Tasa de lectura: 0% (sin datos)');
    console.log('   - Mensajes enviados: 0 (sin datos)');
    console.log('   - Total empleados: ' + (companiesData?.reduce((sum, c) => sum + (c.employee_count || 0), 0) || '0'));
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('Si la interfaz muestra valores diferentes a los esperados, hay datos mock activos.');

  } catch (error) {
    console.error('❌ Error general en la verificación:', error);
  }
}

// Ejecutar verificación
checkTrendsData();