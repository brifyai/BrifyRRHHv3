import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno no configuradas');
  console.log('   REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseCommLogs() {
  console.log('🔍 DIAGNÓSTICO DE COMMUNICATION_LOGS\n');
  
  // 1. Verificar registros totales
  console.log('1. TOTAL DE REGISTROS:');
  const { count, error: countError } = await supabase
    .from('communication_logs')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Error al contar:', countError.message);
    return;
  }
  
  console.log(`   ✅ Total registros en tabla: ${count || 0}`);
  
  if (count === 0) {
    console.log('   ⚠️  LA TABLA ESTÁ VACÍA');
    console.log('   ✅ Los valores en el dashboard deberían ser:');
    console.log('      - Mensajes Enviados: 0');
    console.log('      - Tasa de Lectura: 0%');
    console.log('      - Sentimiento: 0.00');
  } else {
    // 2. Verificar muestra de datos
    console.log('\n2. MUESTRA DE DATOS:');
    const { data: logs, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error('❌ Error al obtener datos:', logsError.message);
      return;
    }
    
    logs.forEach((log, i) => {
      console.log(`   ${i + 1}. ID: ${log.id}`);
      console.log(`      Empresa: ${log.company_id}`);
      console.log(`      Empleado: ${log.employee_id}`);
      console.log(`      Status: ${log.status}`);
      console.log(`      Type: ${log.type}`);
      console.log(`      Fecha: ${log.created_at}`);
      if (log.sentiment !== undefined) {
        console.log(`      Sentimiento: ${log.sentiment}`);
      }
      console.log('');
    });
    
    // 3. Análisis por empresa
    console.log('3. ANÁLISIS POR EMPRESA:');
    const { data: allLogs } = await supabase
      .from('communication_logs')
      .select('company_id, status');
    
    const byCompany = {};
    allLogs.forEach(log => {
      byCompany[log.company_id] = (byCompany[log.company_id] || 0) + 1;
    });
    
    Object.entries(byCompany).forEach(([companyId, msgCount]) => {
      console.log(`   - Empresa ${companyId}: ${msgCount} mensajes`);
    });
  }
  
  // 4. Verificar estructura de la tabla
  console.log('\n4. ESTRUCTURA DE LA TABLA:');
  if (logs && logs.length > 0) {
    const columns = Object.keys(logs[0]);
    console.log('   Columnas:', columns.join(', '));
  }
  
  console.log('\n✅ DIAGNÓSTICO COMPLETO');
  console.log(`   - Tabla communication_logs: ${count || 0} registros`);
  
  if (count === 0) {
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('   Si ves valores en el dashboard (mensajes, sentimientos),');
    console.log('   el código NO está leyendo correctamente de Supabase.');
    console.log('   Hay un BUG que usa datos mock o cacheados.');
  }
}

diagnoseCommLogs().catch(console.error);