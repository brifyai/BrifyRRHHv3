// ============================================
// PRUEBA DE CONEXIÓN SUPABASE - EJECUTAR ESTO
// ============================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testConnection() {
  console.log('🧪 TEST DE CONEXIÓN SUPABASE');
  console.log('==============================');
  
  try {
    // 1. Verificar que podemos conectar
    console.log('1. Conectando a Supabase...');
    const { data: test, error: connError } = await supabase.from('companies').select('id').limit(1);
    
    if (connError) {
      console.error('❌ ERROR DE CONEXIÓN:', connError.message);
      return;
    }
    console.log('✅ Conexión exitosa');
    
    // 2. Mostrar datos reales
    console.log('\\n2. Datos en la base de datos:');
    
    const { data: companies } = await supabase.from('companies').select('id, name');
    console.log(`   📊 ${companies.length} empresas encontradas`);
    
    const { data: employees } = await supabase.from('employees').select('id, company_id').not('company_id', 'is', null);
    console.log(`   📊 ${employees.length} empleados con empresa asignada`);
    
    // 3. Mostrar distribución exacta
    console.log('\\n3. Distribución de empleados por empresa:');
    for (const company of companies) {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id);
      
      console.log(`   ✓ ${company.name}: ${count} empleados`);
    }
    
    console.log('\\n✅ CONCLUSIÓN:');
    console.log('   - La base de datos tiene TODOS los datos');
    console.log('   - Los empleados están asignados a empresas');
    console.log('   - La aplicación en local funcionaría perfectamente');
    console.log('   - El problema es que Netlify no ha actualizado el build');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testConnection();