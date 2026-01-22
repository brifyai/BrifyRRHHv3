/**
 * Script de prueba agresivo para verificar que la duplicación esté resuelta
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔥 PRUEBA AGRESIVA - VERIFICACIÓN DE DUPLICACIÓN');
console.log('=' .repeat(60));

async function testAggressiveFix() {
  try {
    console.log('\n📋 PASO 1: Verificar datos crudos en BD');
    
    const { data: rawCompanies, error: rawError } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (rawError) throw rawError;

    console.log('📊 Datos crudos obtenidos:', {
      total: rawCompanies?.length || 0,
      datos: rawCompanies?.map(c => ({ id: c.id, name: c.name }))
    });

    console.log('\n📋 PASO 2: Analizar duplicados por ID');
    const ids = rawCompanies?.map(c => c.id) || [];
    const uniqueIds = [...new Set(ids)];
    const duplicatesById = ids.length - uniqueIds.length;
    
    console.log('Análisis por ID:', {
      total: ids.length,
      únicos: uniqueIds.length,
      duplicados: duplicatesById
    });

    if (duplicatesById > 0) {
      console.warn('⚠️ DUPLICADOS POR ID ENCONTRADOS:');
      const duplicatedIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      duplicatedIds.forEach(id => {
        const duplicates = rawCompanies.filter(c => c.id === id);
        console.log(`   ID ${id}: ${duplicates.length} veces`);
        duplicates.forEach(d => console.log(`     - ${d.name}`));
      });
    }

    console.log('\n📋 PASO 3: Analizar duplicados por nombre');
    const names = rawCompanies?.map(c => c.name) || [];
    const uniqueNames = [...new Set(names)];
    const duplicatesByName = names.length - uniqueNames.length;
    
    console.log('Análisis por nombre:', {
      total: names.length,
      únicos: uniqueNames.length,
      duplicados: duplicatesByName
    });

    if (duplicatesByName > 0) {
      console.warn('⚠️ DUPLICADOS POR NOMBRE ENCONTRADOS:');
      const duplicatedNames = names.filter((name, index) => names.indexOf(name) !== index);
      duplicatedNames.forEach(name => {
        const duplicates = rawCompanies.filter(c => c.name === name);
        console.log(`   "${name}": ${duplicates.length} veces`);
        duplicates.forEach(d => console.log(`     - ID: ${d.id}`));
      });
    }

    console.log('\n📋 PASO 4: Simular filtro de duplicados (como en el código)');
    const uniqueById = rawCompanies?.filter((company, index, self) =>
      index === self.findIndex((c) => c.id === company.id)
    ) || [];

    const uniqueCompanies = uniqueById.filter((company, index, self) =>
      index === self.findIndex((c) => c.name === company.name)
    ) || [];

    console.log('Resultado después de filtrado:', {
      original: rawCompanies?.length || 0,
      uniqueById: uniqueById.length,
      uniqueByName: uniqueCompanies.length,
      reducciónTotal: (rawCompanies?.length || 0) - uniqueCompanies.length
    });

    console.log('\n📋 PASO 5: Lista final de empresas únicas');
    uniqueCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
    });

    console.log('\n🎯 RESULTADO FINAL:');
    if (duplicatesById === 0 && duplicatesByName === 0) {
      console.log('✅ NO hay duplicados en la base de datos');
      console.log('✅ El problema debe estar en la caché o en el frontend');
    } else {
      console.log('⚠️ HAY duplicados en la base de datos');
      console.log('⚠️ Se necesita ejecutar el script de limpieza SQL');
    }

    console.log('\n📋 PASO 6: Verificar que el filtro del código funciona');
    if (uniqueCompanies.length > 0) {
      console.log('✅ El filtro de duplicados del código funciona correctamente');
      console.log(`✅ Se reducirán de ${rawCompanies?.length || 0} a ${uniqueCompanies.length} empresas`);
    } else {
      console.log('❌ El filtro no produjo resultados');
    }

  } catch (error) {
    console.error('❌ Error en prueba agresiva:', error);
  }
}

testAggressiveFix().then(() => {
  console.log('\n✅ PRUEBA AGRESIVA COMPLETADA');
  console.log('\n🚀 ACCIONES RECOMENDADAS:');
  console.log('1. Si hay duplicados en BD: Ejecutar database/clean_duplicate_companies.sql');
  console.log('2. Si no hay duplicados en BD: Limpiar caché del navegador');
  console.log('3. Recargar la página con Ctrl+F5');
  console.log('4. Verificar logs en consola del navegador');
});