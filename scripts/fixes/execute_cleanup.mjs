import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno REACT_APP_SUPABASE_URL o SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔥 EJECUTANDO LIMPIEZA INMEDIATA DE DUPLICADOS');
console.log('================================================');

async function executeCleanup() {
  try {
    // Paso 1: Verificar estado actual
    console.log('\n📋 PASO 1: Verificar estado actual de duplicados');
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error al obtener empresas:', error);
      return;
    }

    console.log(`📊 Total de registros en BD: ${companies.length}`);

    // Contar duplicados por nombre
    const nameCounts = {};
    companies.forEach(company => {
      nameCounts[company.name] = (nameCounts[company.name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
    console.log(`📊 Empresas duplicadas: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('✅ No hay duplicados en la base de datos');
      return;
    }

    // Paso 2: Ejecutar limpieza SQL
    console.log('\n📋 PASO 2: Ejecutar script de limpieza SQL');
    
    const cleanupSQL = `
      -- Eliminar duplicados manteniendo el registro más antiguo
      DELETE FROM companies 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM companies 
        GROUP BY name
      );
    `;

    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupSQL });
    
    if (cleanupError) {
      console.log('⚠️ RPC no disponible, intentando método alternativo...');
      
      // Método alternativo: identificar y eliminar duplicados uno por uno
      for (const [companyName] of duplicates) {
        const companyRecords = companies.filter(c => c.name === companyName);
        
        // Mantener el primero (más antiguo), eliminar el resto
        const toDelete = companyRecords.slice(1);
        
        for (const company of toDelete) {
          const { error: deleteError } = await supabase
            .from('companies')
            .delete()
            .eq('id', company.id);
            
          if (deleteError) {
            console.error(`❌ Error al eliminar duplicado ${company.name}:`, deleteError);
          } else {
            console.log(`✅ Eliminado duplicado: ${company.name} (ID: ${company.id})`);
          }
        }
      }
    } else {
      console.log('✅ Script de limpieza SQL ejecutado correctamente');
    }

    // Paso 3: Verificar resultado
    console.log('\n📋 PASO 3: Verificar resultado final');
    const { data: finalCompanies, error: finalError } = await supabase
      .from('companies')
      .select('id, name');

    if (finalError) {
      console.error('❌ Error al verificar resultado:', finalError);
      return;
    }

    console.log(`📊 Total final de registros: ${finalCompanies.length}`);

    // Verificar que no quedan duplicados
    const finalNameCounts = {};
    finalCompanies.forEach(company => {
      finalNameCounts[company.name] = (finalNameCounts[company.name] || 0) + 1;
    });

    const finalDuplicates = Object.entries(finalNameCounts).filter(([name, count]) => count > 1);
    
    if (finalDuplicates.length === 0) {
      console.log('✅ No quedan duplicados en la base de datos');
      console.log('\n🎯 LISTA FINAL DE EMPRESAS ÚNICAS:');
      finalCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
      });
    } else {
      console.log(`⚠️ Aún quedan ${finalDuplicates.length} empresas duplicadas`);
    }

    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('🚀 Ahora recarga la página con Ctrl+F5 para ver los cambios');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

executeCleanup();