import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY no están configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmployeeFoldersTables() {
  try {
    console.log('🚀 Iniciando creación de tablas de carpetas de empleados...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database', 'employee_folders_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📄 SQL cargado desde:', sqlPath);
    
    // Ejecutar el SQL usando RPC o directamente
    // Nota: Supabase no permite ejecutar SQL arbitrario desde el cliente
    // Necesitamos usar una función RPC o ejecutar manualmente
    
    // Opción 1: Crear tabla manualmente usando el cliente
    console.log('📋 Creando tabla employee_folders...');
    
    // Primero, verificar si la tabla ya existe
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'employee_folders');
    
    if (checkError) {
      console.log('ℹ️ No se pudo verificar tablas existentes (esto es normal)');
    } else if (existingTables && existingTables.length > 0) {
      console.log('✅ Tabla employee_folders ya existe');
      return;
    }
    
    // Crear tabla usando SQL directo
    // Nota: Esto requiere usar una función RPC o ejecutar desde el backend
    console.log('⚠️ Nota: Para crear las tablas, ejecuta el siguiente comando en la consola SQL de Supabase:');
    console.log('');
    console.log('1. Ve a: https://app.supabase.com/project/[tu-proyecto]/sql/new');
    console.log('2. Copia y pega el contenido de: database/employee_folders_setup.sql');
    console.log('3. Haz clic en "Run"');
    console.log('');
    console.log('O ejecuta este comando desde el terminal:');
    console.log('');
    console.log('psql -h db.[tu-proyecto].supabase.co -U postgres -d postgres -f database/employee_folders_setup.sql');
    console.log('');
    
    // Intentar crear la tabla de forma simple
    console.log('🔄 Intentando crear tabla de forma alternativa...');
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS employee_folders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_email TEXT NOT NULL UNIQUE,
          employee_id TEXT,
          employee_name TEXT,
          employee_position TEXT,
          employee_department TEXT,
          employee_phone TEXT,
          employee_region TEXT,
          employee_level TEXT,
          employee_work_mode TEXT,
          employee_contract_type TEXT,
          company_id UUID,
          company_name TEXT,
          drive_folder_id TEXT,
          drive_folder_url TEXT,
          local_folder_path TEXT,
          folder_status TEXT DEFAULT 'active',
          settings JSONB DEFAULT '{}',
          last_sync_at TIMESTAMP WITH TIME ZONE,
          sync_error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createError) {
      console.log('ℹ️ No se pudo crear tabla via RPC (esto es normal si no existe la función)');
      console.log('📝 Error:', createError.message);
    } else {
      console.log('✅ Tabla employee_folders creada exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createEmployeeFoldersTables();
