#!/usr/bin/env node

/**
 * SCRIPT DE DIAGNÓSTICO DE BASE DE DATOS
 * 
 * Este script verifica el estado real de la base de datos Supabase
 * para diagnosticar por qué aparece "Error al cargar los datos de las empresas"
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY no están definidas');
  console.error('   Verifica tu archivo .env');
  process.exit(1);
}

console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS SUPABASE');
console.log('========================================');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para verificar una tabla
async function checkTable(tableName) {
  try {
    console.log(`🔍 Verificando tabla: ${tableName}`);
    
    // Verificar si la tabla existe y contar registros
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return { exists: false, count: 0, error: error.message };
    }

    console.log(`   ✅ Tabla existe: ${count || 0} registros`);
    
    // Si hay datos, obtener algunos ejemplos
    if (count > 0) {
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (!sampleError && sample) {
        console.log(`   📋 Ejemplos:`);
        sample.forEach((row, index) => {
          console.log(`      ${index + 1}. ${JSON.stringify(row, null, 2).split('\n')[0]}...`);
        });
      }
    }

    return { exists: true, count: count || 0, error: null };
  } catch (err) {
    console.log(`   ❌ Excepción: ${err.message}`);
    return { exists: false, count: 0, error: err.message };
  }
}

// Función para verificar conexión general
async function checkConnection() {
  try {
    console.log('🔗 Verificando conexión a Supabase...');
    
    // Hacer una consulta simple para verificar conexión
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
      return false;
    }

    console.log('   ✅ Conexión exitosa');
    return true;
  } catch (err) {
    console.log(`   ❌ Excepción de conexión: ${err.message}`);
    return false;
  }
}

// Función principal de diagnóstico
async function runDiagnosis() {
  console.log('🚀 Iniciando diagnóstico...\n');

  // 1. Verificar conexión
  const connectionOk = await checkConnection();
  console.log('');

  if (!connectionOk) {
    console.log('❌ DIAGNÓSTICO FALLIDO: No se puede conectar a Supabase');
    console.log('   Posibles causas:');
    console.log('   - Variables de entorno incorrectas');
    console.log('   - URL de Supabase inválida');
    console.log('   - Clave API incorrecta');
    console.log('   - Problemas de red');
    return;
  }

  // 2. Verificar tablas principales
  const tables = ['companies', 'employees', 'folders', 'documents', 'users', 'communication_logs'];
  const results = {};

  for (const table of tables) {
    results[table] = await checkTable(table);
    console.log('');
  }

  // 3. Resumen del diagnóstico
  console.log('📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('==========================');
  
  const existingTables = Object.entries(results).filter(([_, result]) => result.exists);
  const emptyTables = Object.entries(results).filter(([_, result]) => result.exists && result.count === 0);
  const missingTables = Object.entries(results).filter(([_, result]) => !result.exists);

  console.log(`📋 Tablas existentes: ${existingTables.length}/${tables.length}`);
  console.log(`📭 Tablas vacías: ${emptyTables.length}`);
  console.log(`❌ Tablas faltantes: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log('\n❌ TABLAS FALTANTES:');
    missingTables.forEach(([table, result]) => {
      console.log(`   - ${table}: ${result.error}`);
    });
  }

  if (emptyTables.length > 0) {
    console.log('\n📭 TABLAS VACÍAS:');
    emptyTables.forEach(([table, result]) => {
      console.log(`   - ${table}: ${result.count} registros`);
    });
  }

  // 4. Diagnóstico específico del problema
  console.log('\n🔍 DIAGNÓSTICO DEL PROBLEMA:');
  console.log('============================');

  const companiesResult = results['companies'];
  const employeesResult = results['employees'];

  if (!companiesResult.exists) {
    console.log('❌ PROBLEMA IDENTIFICADO: Tabla "companies" no existe');
    console.log('   Solución: Ejecutar scripts de creación de tablas');
  } else if (companiesResult.count === 0) {
    console.log('❌ PROBLEMA IDENTIFICADO: Tabla "companies" está vacía');
    console.log('   Solución: Insertar datos de empresas de prueba');
  } else if (!employeesResult.exists) {
    console.log('❌ PROBLEMA IDENTIFICADO: Tabla "employees" no existe');
    console.log('   Solución: Ejecutar scripts de creación de tablas');
  } else if (employeesResult.count === 0) {
    console.log('❌ PROBLEMA IDENTIFICADO: Tabla "employees" está vacía');
    console.log('   Solución: Insertar datos de empleados de prueba');
  } else {
    console.log('✅ DATOS ENCONTRADOS: Las tablas tienen datos');
    console.log('   El problema puede ser:');
    console.log('   - Errores de red intermitentes');
    console.log('   - Problemas de permisos RLS');
    console.log('   - Errores en el código de consulta');
  }

  console.log('\n🎯 RECOMENDACIONES:');
  console.log('==================');
  
  if (companiesResult.count === 0 || employeesResult.count === 0) {
    console.log('1. 📥 Insertar datos de prueba usando los scripts disponibles:');
    console.log('   - test_insert_sample_data.mjs');
    console.log('   - test_insert_realistic_data.mjs');
  } else {
    console.log('1. 🔄 Verificar configuración de RLS (Row Level Security)');
    console.log('2. 🌐 Revisar conectividad de red');
    console.log('3. 🔍 Revisar logs de Supabase para errores específicos');
    console.log('4. ⚡ Implementar reintentos en el código de carga');
  }
}

// Ejecutar diagnóstico
runDiagnosis().catch(err => {
  console.error('💥 Error fatal en el diagnóstico:', err);
  process.exit(1);
});