import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmqglnycivlcjijoymwe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de employee_folders...');
    
    const { data, error } = await supabase.from('employee_folders').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('📋 ESTRUCTURA DE LA TABLA:');
    console.log('=' .repeat(50));
    
    if (data && data.length > 0) {
      const sample = data[0];
      console.log('📊 Columnas disponibles:');
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[key]} = ${sample[key]}`);
      });
      
      console.log('\n✅ Tabla tiene datos y estructura válida');
    } else {
      console.log('⚠️ Tabla existe pero no tiene datos');
      
      // Intentar obtener información de esquema
      const { data: schemaData, error: schemaError } = await supabase
        .from('employee_folders')
        .select('*')
        .limit(0);
        
      if (!schemaError) {
        console.log('✅ Tabla accesible para consultas');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkTableStructure();