import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDashboardData() {
  console.log('🔍 DIAGNÓSTICO DE DATOS DEL DASHBOARD\n');

  try {
    // 1. Verificar communication_logs está vacía
    const { data: commLogs, error: commError } = await supabase
      .from('communication_logs')
      .select('*');

    if (commError) {
      console.error('❌ Error al verificar communication_logs:', commError);
      return;
    }

    console.log(`1. TABLA COMMUNICATION_LOGS: ${commLogs.length} registros`);
    if (commLogs.length === 0) {
      console.log('   ✅ CONFIRMADO: La tabla está VACÍA');
    }

    // 2. Obtener empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (companiesError) {
      console.error('❌ Error al obtener empresas:', companiesError);
      return;
    }

    console.log(`\n2. EMPRESAS ENCONTRADAS: ${companies.length}`);
    
    // 3. Simular la lógica de getCompaniesWithStats
    console.log('\n3. SIMULANDO CÁLCULO DE ESTADÍSTICAS:');
    
    const employees = await supabase
      .from('employees')
      .select('id, company_id')
      .eq('is_active', true);

    if (employees.error) {
      console.error('❌ Error al obtener empleados:', employees.error);
      return;
    }

    const allEmployees = employees.data || [];

    for (const company of companies) {
      const companyEmployees = allEmployees.filter(emp => emp.company_id === company.id);
      const employeeIds = companyEmployees.map(emp => emp.id);
      
      // Obtener logs para esta empresa específica
      const { data: companyLogs } = await supabase
        .from('communication_logs')
        .select('status, channel_id, created_at')
        .eq('company_id', company.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const logs = companyLogs || [];
      
      const sentMessages = logs.length;
      const readMessages = logs.filter(log => log.status === 'read').length;
      const readRate = sentMessages > 0 ? (readMessages / sentMessages) * 100 : 0;
      const sentimentScore = 0; // No hay sentiment_score en la tabla actualmente

      console.log(`\n   📊 ${company.name}:`);
      console.log(`      - Empleados: ${companyEmployees.length}`);
      console.log(`      - Logs encontrados: ${logs.length}`);
      console.log(`      - Mensajes enviados: ${sentMessages}`);
      console.log(`      - Mensajes leídos: ${readMessages}`);
      console.log(`      - Tasa lectura: ${readRate.toFixed(1)}%`);
      console.log(`      - Sentimiento: ${sentimentScore}`);

      // ALERTA: Si hay valores cuando logs.length === 0
      if (logs.length === 0 && (sentMessages > 0 || readMessages > 0)) {
        console.log(`   🚨 BUG DETECTADO: Hay mensajes (${sentMessages}) pero 0 logs en BD!`);
      }
    }

    // 4. Resumen global
    const totalSent = companies.reduce((sum, company) => {
      const companyLogs = commLogs.filter(log => log.company_id === company.id);
      return sum + companyLogs.length;
    }, 0);

    console.log(`\n4. RESUMEN GLOBAL:`);
    console.log(`   - Total empresas: ${companies.length}`);
    console.log(`   - Total mensajes en BD: ${commLogs.length}`);
    console.log(`   - Total mensajes calculados: ${totalSent}`);

    if (commLogs.length === 0 && totalSent > 0) {
      console.log('\n🚨🚨🚨 BUG CRÍTICO CONFIRMADO 🚨🚨🚨');
      console.log('   El cálculo muestra mensajes pero la tabla está VACÍA');
      console.log('   Esto significa que hay código generando datos falsos');
    } else if (commLogs.length === 0) {
      console.log('\n✅ RESULTADO ESPERADO:');
      console.log('   La tabla está vacía y el cálculo muestra 0 mensajes');
      console.log('   Si el dashboard muestra valores > 0, el BUG está en el frontend');
    }

  } catch (error) {
    console.error('❌ Error crítico:', error);
  }
}

diagnoseDashboardData();