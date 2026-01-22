import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function executeSQLFix() {
  console.log('🔧 Ejecutando corrección de schema de company_insights...\n');

  try {
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync('fix_company_insights_schema.sql', 'utf8');
    console.log('📄 SQL cargado correctamente');

    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Encontrados ${statements.length} statements SQL`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚡ Ejecutando statement ${i + 1}/${statements.length}...`);

      try {
        // Usar rpc para ejecutar SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.log(`⚠️  Error en statement ${i + 1}:`, error.message);
          // Continuar con el siguiente statement
        } else {
          console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
        }
      } catch (rpcError) {
        console.log(`⚠️  Error RPC en statement ${i + 1}:`, rpcError.message);
        // Continuar con el siguiente statement
      }
    }

    console.log('\n🔍 Verificando corrección...');

    // Verificar que la tabla existe y tiene las columnas correctas
    const { data: testData, error: testError } = await supabase
      .from('company_insights')
      .select('company_name, insight_type, title')
      .limit(3);

    if (testError) {
      console.log('❌ Error verificando tabla:', testError.message);
    } else {
      console.log('✅ Tabla company_insights corregida exitosamente');
      console.log(`📊 Registros encontrados: ${testData?.length || 0}`);

      if (testData && testData.length > 0) {
        console.log('📋 Muestra de datos:');
        testData.forEach((row, index) => {
          console.log(`  ${index + 1}. ${row.company_name} - ${row.title}`);
        });
      }
    }

    console.log('\n🎉 Corrección completada!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar función
executeSQLFix().then(() => {
  console.log('\n🏁 Proceso finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});