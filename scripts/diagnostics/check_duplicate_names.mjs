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
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Verifica si hay nombres de empleados duplicados en Supabase
 */
async function checkDuplicateNames() {
  try {
    console.log('🔍 Verificando nombres de empleados duplicados en Supabase...');
    
    // Consultar todos los registros de employee_folders
    const { data, error } = await supabase
      .from('employee_folders')
      .select('employee_name, employee_email, id');
    
    if (error) {
      throw new Error(`Error consultando Supabase: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No se encontraron registros en la tabla employee_folders');
      return;
    }
    
    console.log(`📊 Total de registros encontrados: ${data.length}`);
    
    // Agrupar por nombre y contar duplicados
    const nameCounts = {};
    data.forEach(record => {
      const name = record.employee_name || 'Sin nombre';
      if (!nameCounts[name]) {
        nameCounts[name] = {
          count: 0,
          emails: []
        };
      }
      nameCounts[name].count++;
      nameCounts[name].emails.push(record.employee_email);
    });
    
    // Encontrar nombres duplicados
    const duplicates = Object.entries(nameCounts)
      .filter(([name, data]) => data.count > 1)
      .sort((a, b) => b[1].count - a[1].count);
    
    if (duplicates.length === 0) {
      console.log('✅ No se encontraron nombres duplicados');
      return;
    }
    
    console.log(`⚠️ Se encontraron ${duplicates.length} nombres duplicados:`);
    duplicates.forEach(([name, data]) => {
      console.log(`\n📝 Nombre: "${name}"`);
      console.log(`   Apariciones: ${data.count}`);
      console.log(`   Emails:`);
      data.emails.forEach(email => console.log(`     - ${email}`));
    });
    
    // Estadísticas adicionales
    const totalDuplicates = duplicates.reduce((sum, [name, data]) => sum + (data.count - 1), 0);
    console.log(`\n📈 Estadísticas:`);
    console.log(`   - Total de registros: ${data.length}`);
    console.log(`   - Registros duplicados: ${totalDuplicates}`);
    console.log(`   - Porcentaje de duplicados: ${((totalDuplicates / data.length) * 100).toFixed(2)}%`);
    
    return {
      totalRecords: data.length,
      duplicateNames: duplicates.length,
      totalDuplicates,
      duplicates
    };
  } catch (error) {
    console.error('❌ Error verificando nombres duplicados:', error);
    return {
      error: error.message
    };
  }
}

// Ejecutar la verificación
checkDuplicateNames().then(result => {
  console.log('\n' + JSON.stringify(result, null, 2));
  process.exit(0);
});