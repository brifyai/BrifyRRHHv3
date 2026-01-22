import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

// Configuración directa desde .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 VERIFICANDO BASE DE DATOS DIRECTAMENTE\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Falta configuración en .env');
  console.log('   REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('   REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    // 1. Verificar communication_logs
    console.log('1. TABLA COMMUNICATION_LOGS:');
    const { data: logs, error: logsError, count } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact' });
    
    if (logsError) {
      console.error('❌ Error:', logsError.message);
      return;
    }
    
    console.log(`   ✅ Total registros: ${count || 0}`);
    
    if (count === 0) {
      console.log('   ⚠️  LA TABLA ESTÁ VACÍA');
      console.log('\n🎯 CONCLUSIÓN:');
      console.log('   Si ves mensajes/sentimientos en el dashboard,');
      console.log('   el código NO está leyendo de Supabase correctamente.');
      console.log('   Hay un BUG que usa datos falsos (mock).');
    } else {
      console.log(`   📊 Se encontraron ${count} registros`);
      console.log('   Esto explica por qué ves datos en el dashboard');
      
      // Mostrar muestra
      const sample = logs.slice(0, 3);
      sample.forEach((log, i) => {
        console.log(`\n   Registro ${i + 1}:`);
        console.log(`   - ID: ${log.id}`);
        console.log(`   - Empresa: ${log.company_id}`);
        console.log(`   - Status: ${log.status}`);
        console.log(`   - Fecha: ${log.created_at}`);
      });
    }
    
    // 2. Verificar empresas
    console.log('\n2. TABLA EMPRESAS:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
    
    if (companiesError) {
      console.error('❌ Error:', companiesError.message);
    } else {
      console.log(`   ✅ Total empresas: ${companies.length}`);
      companies.forEach(c => {
        console.log(`   - ${c.name} (ID: ${c.id})`);
      });
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETA');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

checkDatabase().catch(console.error);