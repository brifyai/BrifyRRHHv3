/**
 * Script para crear la tabla user_google_drive_credentials en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MjI0MzUsImV4cCI6MjA0ODQ5ODQzNX0.FQ1lW9VTRxDyQfBPZon81G7bE7tSvH_yjO3R_zAW1i0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('🚀 Iniciando creación de tabla user_google_drive_credentials...\n');
  
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database', 'user_google_drive_credentials.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ ERROR: No se encontró el archivo SQL en:', sqlPath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ Archivo SQL cargado correctamente');
    console.log(`📄 Tamaño del script: ${sqlContent.length} caracteres\n`);
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Total de statements SQL a ejecutar: ${statements.length}\n`);
    
    // Ejecutar cada statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
      
      console.log(`⏳ [${i + 1}/${statements.length}] Ejecutando: ${preview}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Algunos errores son esperados (como "tabla ya existe")
          if (error.message.includes('already exists') || error.message.includes('ya existe')) {
            console.log(`   ⚠️  Ya existe (omitiendo): ${error.message.substring(0, 80)}`);
            successCount++;
          } else {
            console.error(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Ejecutado exitosamente`);
          successCount++;
        }
      } catch (execError) {
        console.error(`   ❌ Error de ejecución: ${execError.message}`);
        errorCount++;
      }
      
      // Pequeño delay para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESUMEN DE EJECUCIÓN:`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📈 Total: ${statements.length}`);
    console.log('='.repeat(60) + '\n');
    
    // Verificar que la tabla existe
    console.log('🔍 Verificando que la tabla existe...');
    
    const { data: tableCheck, error: checkError } = await supabase
      .from('user_google_drive_credentials')
      .select('id')
      .limit(1);
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log('⚠️  La tabla no existe o no es accesible.');
        console.log('   Esto puede ser normal si Supabase no permite la creación de tablas vía API.');
        console.log('   Deberás ejecutar el SQL manualmente en el panel de Supabase.\n');
        console.log('📋 PASOS PARA EJECUTAR MANUALMENTE:');
        console.log('   1. Ve a https://supabase.com/dashboard');
        console.log('   2. Selecciona tu proyecto');
        console.log('   3. Ve a "SQL Editor"');
        console.log('   4. Copia y pega el contenido de database/user_google_drive_credentials.sql');
        console.log('   5. Ejecuta el script\n');
      } else {
        console.error('❌ Error verificando tabla:', checkError);
      }
    } else {
      console.log('✅ ¡Tabla user_google_drive_credentials verificada y accesible!\n');
      console.log('🎉 CREACIÓN COMPLETADA EXITOSAMENTE');
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
    console.log('\n⚠️  Si Supabase no permite ejecutar SQL vía API, deberás:');
    console.log('   1. Ir a https://supabase.com/dashboard');
    console.log('   2. Abrir el SQL Editor');
    console.log('   3. Ejecutar manualmente database/user_google_drive_credentials.sql\n');
    process.exit(1);
  }
}

createTable();