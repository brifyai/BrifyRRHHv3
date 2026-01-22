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
 * Función para generar un nombre único basado en el nombre original y el email
 */
function generateUniqueName(originalName, email) {
  // Extraer el nombre y apellido del nombre original
  const nameParts = originalName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  
  // Extraer parte del email (antes del @)
  const emailPrefix = email.split('@')[0] || '';
  
  // Crear un nombre único combinando nombre, apellido y parte del email
  const uniqueName = `${firstName} ${lastName} ${emailPrefix}`;
  
  return uniqueName;
}

/**
 * Función para corregir nombres con sufijos numéricos en la tabla employee_folders
 */
async function fixNamesWithSuffixes() {
  try {
    console.log('🔍 Iniciando corrección de nombres con sufijos numéricos...');
    
    // 1. Obtener todos los registros
    const { data: allRecords, error: fetchError } = await supabase
      .from('employee_folders')
      .select('id, employee_name, employee_email')
      .order('employee_name', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Error consultando registros: ${fetchError.message}`);
    }
    
    if (!allRecords || allRecords.length === 0) {
      console.log('ℹ️ No se encontraron registros en la tabla employee_folders');
      return;
    }
    
    console.log(`📊 Total de registros encontrados: ${allRecords.length}`);
    
    // 2. Identificar registros con sufijos numéricos
    const recordsWithSuffixes = allRecords.filter(record => {
      const name = record.employee_name || '';
      // Verificar si el nombre termina con un patrón como " (1)", " (2)", etc.
      return /\s\(\d+\)$/.test(name);
    });
    
    if (recordsWithSuffixes.length === 0) {
      console.log('✅ No se encontraron nombres con sufijos numéricos');
      return;
    }
    
    console.log(`⚠️ Se encontraron ${recordsWithSuffixes.length} nombres con sufijos numéricos`);
    
    // 3. Corregir nombres con sufijos
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const record of recordsWithSuffixes) {
      try {
        // Generar un nombre único
        const uniqueName = generateUniqueName(record.employee_name, record.employee_email);
        
        console.log(`🔄 Actualizando: ${record.employee_name} -> ${uniqueName} (${record.employee_email})`);
        
        const { error: updateError } = await supabase
          .from('employee_folders')
          .update({ employee_name: uniqueName })
          .eq('id', record.id);
        
        if (updateError) {
          throw updateError;
        }
        
        updatedCount++;
      } catch (error) {
        errorCount++;
        errors.push(`${record.employee_email}: ${error.message}`);
        console.error(`❌ Error actualizando ${record.employee_email}: ${error.message}`);
      }
    }
    
    // 4. Verificar que no queden duplicados
    console.log('\n🔍 Verificando que no queden duplicados...');
    
    const { data: verificationRecords, error: verificationError } = await supabase
      .from('employee_folders')
      .select('employee_name')
      .order('employee_name', { ascending: true });
    
    if (verificationError) {
      throw new Error(`Error en verificación: ${verificationError.message}`);
    }
    
    // Agrupar por nombre para verificar duplicados
    const verificationNameGroups = {};
    verificationRecords.forEach(record => {
      const name = record.employee_name || 'Sin nombre';
      if (!verificationNameGroups[name]) {
        verificationNameGroups[name] = 0;
      }
      verificationNameGroups[name]++;
    });
    
    // Verificar si hay duplicados
    const remainingDuplicates = Object.entries(verificationNameGroups)
      .filter(([name, count]) => count > 1);
    
    if (remainingDuplicates.length > 0) {
      console.log(`⚠️ Aún quedan ${remainingDuplicates.length} nombres duplicados`);
      remainingDuplicates.forEach(([name, count]) => {
        console.log(`   - "${name}": ${count} apariciones`);
      });
    } else {
      console.log('✅ Todos los nombres son únicos');
    }
    
    // 5. Mostrar resumen
    console.log('\n📊 Resumen de la operación:');
    console.log(`   - Registros procesados: ${allRecords.length}`);
    console.log(`   - Nombres con sufijos encontrados: ${recordsWithSuffixes.length}`);
    console.log(`   - Registros actualizados: ${updatedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    if (errors.length > 0) {
      console.log('   - Detalles de errores:');
      errors.forEach(error => console.log(`     * ${error}`));
    }
    
    return {
      totalRecords: allRecords.length,
      namesWithSuffixes: recordsWithSuffixes.length,
      updatedCount,
      errorCount,
      errors,
      remainingDuplicates: remainingDuplicates.length
    };
  } catch (error) {
    console.error('❌ Error corrigiendo nombres con sufijos:', error);
    return {
      error: error.message
    };
  }
}

// Ejecutar la función
fixNamesWithSuffixes().then(result => {
  console.log('\n' + JSON.stringify(result, null, 2));
  process.exit(0);
});