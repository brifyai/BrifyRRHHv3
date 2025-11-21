#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN DE PERMISOS RLS
 * 
 * Este script verifica si las políticas RLS están bloqueando el acceso a los datos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY no están definidas');
  process.exit(1);
}

console.log('🔐 VERIFICACIÓN DE PERMISOS RLS');
console.log('================================');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para verificar una tabla con diferentes métodos
async function checkTablePermissions(tableName) {
  console.log(`🔍 Verificando permisos para tabla: ${tableName}`);
  
  try {
    // Método 1: Consulta simple con count
    console.log(`   📊 Método 1: Consulta con count...`);
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`   ❌ Error en count: ${countError.message}`);
    } else {
      console.log(`   ✅ Count exitoso: ${count} registros`);
    }

    // Método 2: Consulta con límite
    console.log(`   📋 Método 2: Consulta con límite...`);
    const { data: limitedData, error: limitedError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);

    if (limitedError) {
      console.log(`   ❌ Error en consulta limitada: ${limitedError.message}`);
    } else {
      console.log(`   ✅ Consulta limitada exitosa: ${limitedData?.length || 0} registros`);
      if (limitedData && limitedData.length > 0) {
        console.log(`   📄 Ejemplo de registro:`, JSON.stringify(limitedData[0], null, 2).split('\n')[0] + '...');
      }
    }

    // Método 3: Consulta sin filtros
    console.log(`   🔍 Método 3: Consulta sin filtros...`);
    const { data: allData, error: allError } = await supabase
      .from(tableName)
      .select('*');

    if (allError) {
      console.log(`   ❌ Error en consulta completa: ${allError.message}`);
    } else {
      console.log(`   ✅ Consulta completa exitosa: ${allData?.length || 0} registros`);
    }

    return {
      count: count || 0,
      limited: limitedData?.length || 0,
      all: allData?.length || 0,
      hasData: (allData?.length || 0) > 0,
      sample: allData?.[0] || null
    };

  } catch (err) {
    console.log(`   💥 Excepción: ${err.message}`);
    return {
      count: 0,
      limited: 0,
      all: 0,
      hasData: false,
      sample: null,
      error: err.message
    };
  }
}

// Función para verificar políticas RLS
async function checkRLSPolicies() {
  console.log('\n🔐 Verificando políticas RLS...');
  
  try {
    // Verificar si RLS está habilitado en las tablas
    const tables = ['companies', 'employees', 'folders', 'documents', 'users', 'communication_logs'];
    
    for (const table of tables) {
      console.log(`\n📋 Tabla: ${table}`);
      
      // Verificar si RLS está habilitado
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_enabled', { table_name: table })
        .single()
        .catch(() => ({ data: null, error: 'Función no existe' }));
      
      if (rlsError) {
        console.log(`   ⚠️  No se pudo verificar RLS: ${rlsError}`);
      } else {
        console.log(`   🔐 RLS habilitado: ${rlsData ? 'Sí' : 'No'}`);
      }
      
      // Intentar consultar políticas
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', table);
      
      if (policiesError) {
        console.log(`   ❌ Error consultando políticas: ${policiesError.message}`);
      } else {
        console.log(`   📜 Políticas encontradas: ${policies?.length || 0}`);
        if (policies && policies.length > 0) {
          policies.forEach((policy, index) => {
            console.log(`      ${index + 1}. ${policy.policyname} (${policy.cmd})`);
          });
        }
      }
    }
  } catch (err) {
    console.log(`❌ Error verificando RLS: ${err.message}`);
  }
}

// Función principal
async function runRLSCheck() {
  console.log('🚀 Iniciando verificación de permisos RLS...\n');

  // Verificar políticas RLS primero
  await checkRLSPolicies();

  // Verificar cada tabla
  const tables = ['companies', 'employees', 'folders', 'documents', 'users', 'communication_logs'];
  const results = {};

  for (const table of tables) {
    console.log(`\n${'='.repeat(50)}`);
    results[table] = await checkTablePermissions(table);
  }

  // Resumen final
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 RESUMEN FINAL:');
  console.log('==================');
  
  let totalIssues = 0;
  
  for (const [table, result] of Object.entries(results)) {
    console.log(`\n📋 ${table}:`);
    console.log(`   Count: ${result.count}`);
    console.log(`   Limit(5): ${result.limited}`);
    console.log(`   All: ${result.all}`);
    
    if (result.count === 0 && result.all === 0 && !result.error) {
      console.log(`   ❌ PROBLEMA: Sin acceso a datos (posible RLS)`);
      totalIssues++;
    } else if (result.count !== result.all) {
      console.log(`   ⚠️  ADVERTENCIA: Inconsistencia en conteos`);
      totalIssues++;
    } else {
      console.log(`   ✅ OK: Acceso correcto a datos`);
    }
  }

  // Diagnóstico y recomendaciones
  console.log(`\n${'='.repeat(50)}`);
  console.log('🎯 DIAGNÓSTICO Y RECOMENDACIONES:');
  console.log('=================================');
  
  if (totalIssues === 0) {
    console.log('✅ No se detectaron problemas de permisos');
  } else {
    console.log(`❌ Se detectaron ${totalIssues} problemas de permisos`);
    console.log('\n🔧 SOLUCIONES POSIBLES:');
    console.log('1. 🔐 Verificar políticas RLS en Supabase Dashboard');
    console.log('2. 👤 Asegurar que el usuario tiene permisos de lectura');
    console.log('3. 🛠️  Desactivar RLS temporalmente para pruebas:');
    console.log('   ALTER TABLE tabla_name DISABLE ROW LEVEL SECURITY;');
    console.log('4. 📝 Crear políticas RLS que permitan lectura pública:');
    console.log('   CREATE POLICY "Allow read access" ON tabla_name FOR SELECT USING (true);');
  }

  console.log('\n🎉 VERIFICACIÓN COMPLETADA');
}

// Ejecutar verificación
runRLSCheck().catch(err => {
  console.error('💥 Error fatal en la verificación:', err);
  process.exit(1);
});