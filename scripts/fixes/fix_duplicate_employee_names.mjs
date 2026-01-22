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
 * Función para corregir nombres duplicados en la tabla employee_folders
 */
async function fixDuplicateEmployeeNames() {
  try {
    console.log('🔍 Iniciando corrección de nombres duplicados en Supabase...');
    
    // 1. Obtener todos los registros con nombres duplicados
    const { data: duplicateRecords, error: fetchError } = await supabase
      .from('employee_folders')
      .select('id, employee_name, employee_email')
      .order('employee_name', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Error consultando registros: ${fetchError.message}`);
    }
    
    if (!duplicateRecords || duplicateRecords.length === 0) {
      console.log('ℹ️ No se encontraron registros en la tabla employee_folders');
      return;
    }
    
    console.log(`📊 Total de registros encontrados: ${duplicateRecords.length}`);
    
    // 2. Agrupar por nombre para identificar duplicados
    const nameGroups = {};
    duplicateRecords.forEach(record => {
      const name = record.employee_name || 'Sin nombre';
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(record);
    });
    
    // 3. Identificar nombres duplicados
    const duplicates = Object.entries(nameGroups)
      .filter(([name, records]) => records.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    if (duplicates.length === 0) {
      console.log('✅ No se encontraron nombres duplicados');
      return;
    }
    
    console.log(`⚠️ Se encontraron ${duplicates.length} nombres duplicados`);
    
    // 4. Corregir duplicados
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const [name, records] of duplicates) {
      console.log(`\n📝 Procesando duplicados para: "${name}"`);
      
      // Ordenar registros por email para tener un orden consistente
      records.sort((a, b) => a.employee_email.localeCompare(b.employee_email));
      
      // Mantener el primer registro con el nombre original
      const [firstRecord, ...restRecords] = records;
      console.log(`   ✅ Manteniendo: ${firstRecord.employee_name} (${firstRecord.employee_email})`);
      
      // Actualizar los demás registros con un sufijo
      for (let i = 0; i < restRecords.length; i++) {
        const record = restRecords[i];
        const newName = `${name} (${i + 1})`;
        
        try {
          console.log(`   🔄 Actualizando: ${record.employee_name} -> ${newName} (${record.employee_email})`);
          
          const { error: updateError } = await supabase
            .from('employee_folders')
            .update({ employee_name: newName })
            .eq('id', record.id);
          
          if (updateError) {
            throw updateError;
          }
          
          updatedCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${record.employee_email}: ${error.message}`);
          console.error(`   ❌ Error actualizando ${record.employee_email}: ${error.message}`);
        }
      }
    }
    
    // 5. Verificar que no queden duplicados
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
    
    // 6. Mostrar resumen
    console.log('\n📊 Resumen de la operación:');
    console.log(`   - Registros procesados: ${duplicateRecords.length}`);
    console.log(`   - Nombres duplicados encontrados: ${duplicates.length}`);
    console.log(`   - Registros actualizados: ${updatedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    if (errors.length > 0) {
      console.log('   - Detalles de errores:');
      errors.forEach(error => console.log(`     * ${error}`));
    }
    
    return {
      totalRecords: duplicateRecords.length,
      duplicateNames: duplicates.length,
      updatedCount,
      errorCount,
      errors,
      remainingDuplicates: remainingDuplicates.length
    };
  } catch (error) {
    console.error('❌ Error corrigiendo nombres duplicados:', error);
    return {
      error: error.message
    };
  }
}

// Ejecutar la función
fixDuplicateEmployeeNames().then(result => {
  console.log('\n' + JSON.stringify(result, null, 2));
  process.exit(0);
});