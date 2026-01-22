import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Usar la misma configuración de Supabase que en el proyecto principal
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.staffhub.cl';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Función para aplicar la restricción UNIQUE a la columna employee_name
 */
async function applyUniqueConstraint() {
  try {
    console.log('🔒 Aplicando restricción UNIQUE a la columna employee_name...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database/add_unique_constraint_employee_name.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir el SQL en comandos individuales
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    // Ejecutar cada comando SQL
    for (const command of sqlCommands) {
      if (command.startsWith('--') || command.startsWith('/*') || command.startsWith('*')) {
        // Es un comentario, lo omitimos
        continue;
      }
      
      console.log(`🔄 Ejecutando: ${command.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Si el error es porque ya existe el índice, lo ignoramos
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`⚠️ El índice ya existe, omitiendo...`);
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Comando ejecutado correctamente`);
        }
      } catch (cmdError) {
        console.error(`❌ Error ejecutando comando: ${cmdError.message}`);
        throw cmdError;
      }
    }
    
    console.log('✅ Restricción UNIQUE aplicada correctamente a la columna employee_name');
    console.log('🔒 Esto evitará la creación de nombres duplicados en el futuro');
    
    return {
      success: true,
      message: 'Restricción UNIQUE aplicada correctamente'
    };
  } catch (error) {
    console.error('❌ Error aplicando restricción UNIQUE:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar la función
applyUniqueConstraint().then(result => {
  console.log('\n' + JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});