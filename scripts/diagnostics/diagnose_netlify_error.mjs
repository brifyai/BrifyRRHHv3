import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabaseRoute() {
  console.log('🔍 Diagnosticando error en ruta /base-de-datos...\n');
  
  try {
    // 1. Verificar conexión a Supabase
    console.log('1. Verificando conexión a Supabase...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ Error conectando a Supabase:', companiesError.message);
    } else {
      console.log('✅ Conexión a Supabase OK');
    }
    
    // 2. Verificar tabla communication_logs
    console.log('\n2. Verificando tabla communication_logs...');
    const { data: logs, error: logsError } = await supabase
      .from('communication_logs')
      .select('status, created_at, type, employee_id')
      .limit(5);
    
    if (logsError) {
      console.error('❌ Error en communication_logs:', logsError.message);
    } else {
      console.log('✅ Tabla communication_logs accesible');
      console.log('📋 Muestra de datos:', logs);
    }
    
    // 3. Verificar rutas críticas
    console.log('\n3. Verificando rutas críticas...');
    const tables = ['companies', 'employees', 'folders', 'documents', 'communication_logs'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error en ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${count} registros`);
      }
    }
    
    // 4. Verificar estructura de la base de datos
    console.log('\n4. Verificando estructura de base de datos...');
    const { data: tableInfo, error: infoError } = await supabase
      .from('communication_logs')
      .select('*')
      .limit(1);
    
    if (!infoError && tableInfo && tableInfo.length > 0) {
      console.log('📊 Columnas en communication_logs:', Object.keys(tableInfo[0]).join(', '));
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

diagnoseDatabaseRoute();