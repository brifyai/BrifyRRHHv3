import { supabase } from './src/lib/supabaseServer.js';

async function diagnoseDB() {
  console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS REAL\n');
  
  // Verificar communication_logs
  console.log('1. COMMUNICATION_LOGS:');
  const { data: logs, error } = await supabase
    .from('communication_logs')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`   ✅ Total registros encontrados: ${logs.length}`);
  
  if (logs.length === 0) {
    console.log('   ⚠️  TABLA COMPLETAMENTE VACÍA');
    console.log('   ✅ Esto significa que NO deberías ver mensajes en el dashboard');
  } else {
    console.log('   📊 Registros:');
    logs.forEach((log, i) => {
      console.log(`      ${i + 1}. ID: ${log.id}, Company: ${log.company_id}, Status: ${log.status}, Type: ${log.type}`);
      console.log(`         Fecha: ${log.created_at}`);
      if (log.sentiment !== undefined) console.log(`         Sentimiento: ${log.sentiment}`);
    });
  }
  
  // Verificar empresas
  console.log('\n2. EMPRESAS:');
  const { data: companies } = await supabase.from('companies').select('*');
  console.log(`   ✅ Total: ${companies.length}`);
  companies.forEach(c => console.log(`      - ${c.name} (ID: ${c.id})`));
  
  console.log('\n🔍 RESUMEN:');
  console.log(`   - Empresas: ${companies.length}`);
  console.log(`   - Mensajes: ${logs.length}`);
  
  if (logs.length === 0) {
    console.log('\n✅ CONCLUSIÓN: No hay mensajes en la base de datos.');
    console.log('   Si ves mensajes en el dashboard, el código NO está usando los datos reales.');
  }
}

diagnoseDB().catch(console.error);