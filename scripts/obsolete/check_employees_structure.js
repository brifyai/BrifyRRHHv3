/**
 * Script para verificar la estructura de la tabla employees
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmployeesStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla employees...');
    
    // 1. Obtener un registro para ver las columnas
    const { data: sampleEmployee, error: sampleError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error obteniendo muestra de empleados:', sampleError);
      return;
    }
    
    if (sampleEmployee && sampleEmployee.length > 0) {
      console.log('📋 Columnas encontradas en la tabla employees:');
      console.log(Object.keys(sampleEmployee[0]));
      
      console.log('\n📋 Datos de muestra:');
      console.log(JSON.stringify(sampleEmployee[0], null, 2));
    } else {
      console.log('⚠️ No se encontraron empleados en la tabla');
    }
    
    // 2. Contar total de empleados
    const { count: totalEmployees, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error contando empleados:', countError);
    } else {
      console.log(`\n📊 Total de empleados: ${totalEmployees}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkEmployeesStructure().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});