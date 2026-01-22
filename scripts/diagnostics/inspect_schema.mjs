import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('🔍 Inspeccionando schema de Supabase...\n');
  
  try {
    // Intentar obtener datos de communication_logs con select simple
    console.log('📊 Probando consulta a communication_logs...');
    const { data, error } = await supabase
      .from('communication_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error en consulta:', error.message);
      console.log('\n💡 Intentando obtener metadata de la tabla...');
      
      // Intentar con una consulta más simple
      const { data: simpleData, error: simpleError } = await supabase
        .from('communication_logs')
        .select('id')
        .limit(1);
      
      if (simpleError) {
        console.error('❌ Error incluso con select simple:', simpleError.message);
      } else {
        console.log('✅ Tabla existe, pero hay problemas con ciertas columnas');
        console.log('📋 Datos obtenidos:', simpleData);
      }
    } else {
      console.log('✅ Consulta exitosa');
      if (data && data.length > 0) {
        console.log('\n📋 Columnas disponibles en communication_logs:');
        const columns = Object.keys(data[0]);
        columns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('📋 Tabla existe pero está vacía');
        
        // Intentar describir la tabla usando una técnica alternativa
        console.log('\n🔍 Intentando describir estructura de la tabla...');
        const { data: allData, error: allError } = await supabase
          .from('communication_logs')
          .select('*')
          .limit(0);
        
        if (!allError) {
          console.log('✅ Tabla accesible, pero necesitamos ver el schema');
        }
      }
    }
    
    // Verificar otras tablas para comparar
    console.log('\n📊 Verificando otras tablas...');
    const tables = ['companies', 'employees', 'folders', 'documents', 'users'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: ${count} registros`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Error - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error inspeccionando schema:', error);
  }
}

inspectSchema();