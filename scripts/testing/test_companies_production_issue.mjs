#!/usr/bin/env node
/**
 * Script de Diagnóstico - Problema de Carga de Empresas en Producción
 * URL afectada: https://brifyrrhhv3.netlify.app/base-de-datos
 * 
 * Este script diagnostica:
 * 1. Conectividad Supabase
 * 2. Estructura de tabla companies
 * 3. Permisos RLS
 * 4. Datos existentes
 * 5. Performance de consultas
 */

import { createClient } from '@supabase/supabase-js';

// Configuración Supabase - Credenciales reales del proyecto
const SUPABASE_URL = 'https://tmqglnycivlcjijoymwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

console.log('🔍 DIAGNÓSTICO DE EMPRESAS EN PRODUCCIÓN');
console.log('=========================================');
console.log('URL afectada:', 'https://brifyrrhhv3.netlify.app/base-de-datos');
console.log('Timestamp:', new Date().toISOString());
console.log('');

// Crear cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función para medir tiempo de ejecución
const measureTime = async (name, fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`✅ ${name}: ${duration}ms`);
    return { result, duration, error: null };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ ${name}: ${duration}ms - Error: ${error.message}`);
    return { result: null, duration, error: error.message };
  }
};

// Función para verificar conectividad básica
const testBasicConnectivity = async () => {
  console.log('🔌 1. PRUEBA DE CONECTIVIDAD BÁSICA');
  console.log('-----------------------------------');
  
  const { result, error } = await measureTime('Ping Supabase', async () => {
    const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return data;
  });
  
  if (error) {
    console.log('❌ FALLO DE CONECTIVIDAD:', error);
    return false;
  }
  
  console.log('✅ Conectividad básica: OK');
  return true;
};

// Función para verificar estructura de tabla
const testTableStructure = async () => {
  console.log('\n📊 2. VERIFICACIÓN DE ESTRUCTURA DE TABLA');
  console.log('-----------------------------------------');
  
  const { result, error } = await measureTime('Describir tabla companies', async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log('📋 Columnas disponibles:', Object.keys(data[0]));
      return Object.keys(data[0]);
    } else {
      console.log('⚠️ Tabla existe pero no tiene datos');
      return [];
    }
  });
  
  if (error) {
    console.log('❌ Error en estructura:', error);
    return false;
  }
  
  return true;
};

// Función para verificar permisos RLS
const testRLSPermissions = async () => {
  console.log('\n🔐 3. VERIFICACIÓN DE PERMISOS RLS');
  console.log('----------------------------------');
  
  // Intentar diferentes tipos de consultas
  const tests = [
    { name: 'SELECT simple', query: () => supabase.from('companies').select('id').limit(1) },
    { name: 'SELECT con count', query: () => supabase.from('companies').select('*', { count: 'exact', head: true }) },
    { name: 'SELECT con order', query: () => supabase.from('companies').select('id, name').order('name').limit(5) }
  ];
  
  for (const test of tests) {
    const { result, error } = await measureTime(test.name, async () => {
      const { data, error } = await test.query();
      if (error) throw error;
      return data;
    });
    
    if (error) {
      console.log(`❌ ${test.name}: Error de permisos - ${error}`);
      return false;
    }
  }
  
  console.log('✅ Permisos RLS: OK');
  return true;
};

// Función para verificar datos existentes
const testExistingData = async () => {
  console.log('\n📈 4. VERIFICACIÓN DE DATOS EXISTENTES');
  console.log('--------------------------------------');
  
  const { result, error } = await measureTime('Contar empresas', async () => {
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count;
  });
  
  if (error) {
    console.log('❌ Error contando empresas:', error);
    return false;
  }
  
  console.log(`📊 Total de empresas: ${result}`);
  
  if (result === 0) {
    console.log('⚠️ ADVERTENCIA: No hay empresas en la base de datos');
    return false;
  }
  
  // Obtener muestra de empresas
  const { result: sampleData, error: sampleError } = await measureTime('Obtener muestra', async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, status')
      .order('name')
      .limit(5);
    
    if (error) throw error;
    return data;
  });
  
  if (sampleError) {
    console.log('❌ Error obteniendo muestra:', sampleError);
    return false;
  }
  
  console.log('📋 Muestra de empresas:');
  sampleData.forEach((company, index) => {
    console.log(`   ${index + 1}. ${company.name} (${company.status || 'sin estado'})`);
  });
  
  return true;
};

// Función para verificar performance
const testPerformance = async () => {
  console.log('\n⚡ 5. PRUEBA DE PERFORMANCE');
  console.log('---------------------------');
  
  const tests = [
    { name: 'Consulta simple', query: () => supabase.from('companies').select('id').limit(10) },
    { name: 'Consulta con orden', query: () => supabase.from('companies').select('*').order('name').limit(10) },
    { name: 'Consulta con filtros', query: () => supabase.from('companies').select('*').ilike('name', '%a%').limit(10) }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const { result, duration, error } = await measureTime(test.name, async () => {
      const { data, error } = await test.query();
      if (error) throw error;
      return data;
    });
    
    results.push({ test: test.name, duration, error, success: !error });
  }
  
  console.log('\n📊 Resumen de Performance:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.test}: ${result.duration}ms`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  // Verificar si alguna consulta es muy lenta
  const slowQueries = results.filter(r => r.duration > 3000);
  if (slowQueries.length > 0) {
    console.log('\n⚠️ CONSULTAS LENTAS DETECTADAS:');
    slowQueries.forEach(query => {
      console.log(`   - ${query.test}: ${query.duration}ms`);
    });
    return false;
  }
  
  console.log('✅ Performance: OK');
  return true;
};

// Función para simular el comportamiento de la aplicación
const testAppBehavior = async () => {
  console.log('\n🎯 6. SIMULACIÓN DE COMPORTAMIENTO DE APP');
  console.log('-----------------------------------------');
  
  // Simular la consulta que hace organizedDatabaseService
  const { result, error } = await measureTime('Simular getCompanies()', async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  });
  
  if (error) {
    console.log('❌ Error simulando getCompanies():', error);
    return false;
  }
  
  console.log(`📊 getCompanies() devolvió: ${result.length} empresas`);
  
  if (result.length === 0) {
    console.log('⚠️ ADVERTENCIA: getCompanies() devuelve lista vacía');
    return false;
  }
  
  // Verificar duplicados
  const uniqueCompanies = result.filter((company, index, self) =>
    index === self.findIndex((c) => c.id === company.id)
  );
  
  if (uniqueCompanies.length !== result.length) {
    console.log(`⚠️ DUPLICADOS DETECTADOS: ${result.length - uniqueCompanies.length}`);
    return false;
  }
  
  console.log('✅ Sin duplicados detectados');
  console.log('✅ Comportamiento de app: OK');
  return true;
};

// Función principal de diagnóstico
const runDiagnostics = async () => {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...\n');
  
  const tests = [
    { name: 'Conectividad Básica', fn: testBasicConnectivity },
    { name: 'Estructura de Tabla', fn: testTableStructure },
    { name: 'Permisos RLS', fn: testRLSPermissions },
    { name: 'Datos Existentes', fn: testExistingData },
    { name: 'Performance', fn: testPerformance },
    { name: 'Comportamiento de App', fn: testAppBehavior }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ test: test.name, success });
    } catch (error) {
      console.log(`❌ Error crítico en ${test.name}:`, error.message);
      results.push({ test: test.name, success: false, error: error.message });
    }
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMEN DE DIAGNÓSTICO');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log(`\n📊 RESULTADO FINAL: ${passedTests}/${totalTests} pruebas exitosas`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODAS LAS PRUEBAS PASARON - El problema podría estar en el frontend');
  } else {
    console.log('⚠️ ALGUNAS PRUEBAS FALLARON - Problema identificado en backend/DB');
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  if (!results.find(r => r.test === 'Conectividad Básica')?.success) {
    console.log('   - Verificar configuración de Supabase (URL, API Key)');
    console.log('   - Comprobar conectividad de red');
  }
  if (!results.find(r => r.test === 'Permisos RLS')?.success) {
    console.log('   - Revisar políticas RLS en Supabase');
    console.log('   - Verificar permisos del usuario');
  }
  if (!results.find(r => r.test === 'Datos Existentes')?.success) {
    console.log('   - Poblar tabla companies con datos de prueba');
    console.log('   - Verificar migración de datos');
  }
  if (!results.find(r => r.test === 'Performance')?.success) {
    console.log('   - Optimizar consultas de companies');
    console.log('   - Agregar índices a la tabla');
  }
  
  console.log('\n🔍 SIGUIENTE PASO: Revisar logs del navegador en producción');
  console.log('URL: https://brifyrrhhv3.netlify.app/base-de-datos');
};

// Ejecutar diagnóstico
runDiagnostics().catch(error => {
  console.error('❌ Error crítico en diagnóstico:', error);
  process.exit(1);
});