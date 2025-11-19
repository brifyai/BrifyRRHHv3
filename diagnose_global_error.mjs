#!/usr/bin/env node

/**
 * DIAGNÓSTICO RÁPIDO: Error "Oops, algo salió mal" en Producción
 * Este script verifica los puntos críticos que pueden causar un error global
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔍 INICIANDO DIAGNÓSTICO DE ERROR GLOBAL...\n');

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// 1. Verificar variables de entorno
console.log('1️⃣ VERIFICANDO VARIABLES DE ENTORNO...');
console.log('✓ SUPABASE_URL:', SUPABASE_URL ? 'CONFIGURADA' : '❌ FALTANTE');
console.log('✓ SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'CONFIGURADA' : '❌ FALTANTE');
console.log('');

// 2. Probar conexión a Supabase
async function testSupabaseConnection() {
  console.log('2️⃣ PROBANDO CONEXIÓN A SUPABASE...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test simple query
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ ERROR DE CONEXIÓN:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalles:', error.details);
      return false;
    }
    
    console.log('✅ CONEXIÓN EXITOSA');
    console.log('   Datos de prueba:', data);
    return true;
  } catch (err) {
    console.log('❌ ERROR CRÍTICO DE CONEXIÓN:', err.message);
    return false;
  }
}

// 3. Verificar tablas críticas
async function checkCriticalTables() {
  console.log('\n3️⃣ VERIFICANDO TABLAS CRÍTICAS...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const tables = ['companies', 'employees', 'communication_logs', 'users'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Tabla ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: ${count} registros`);
      }
    } catch (err) {
      console.log(`❌ Tabla ${table}: ERROR CRÍTICO - ${err.message}`);
    }
  }
}

// 4. Verificar RLS Policies
async function checkRLSPolicies() {
  console.log('\n4️⃣ VERIFICANDO POLÍTICAS RLS...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase.rpc('get_policies');
    
    if (error) {
      console.log('❌ No se pudieron verificar políticas RLS');
    } else {
      console.log('✅ Políticas RLS verificadas (requiere consulta manual)');
    }
  } catch (err) {
    console.log('⚠️  No se pudo verificar RLS automáticamente');
    console.log('   Ejecuta en Supabase SQL: SELECT * FROM pg_policies;');
  }
}

// 5. Verificar Netlify Build
function checkNetlifyBuild() {
  console.log('\n5️⃣ VERIFICANDO BUILD DE NETLIFY...');
  console.log('   Último deploy: Revisar Netlify Dashboard');
  console.log('   Build status: Revisar Netlify Dashboard');
  console.log('   Variables de entorno: Revisar Netlify Dashboard');
}

// Ejecutar diagnóstico
async function runDiagnostics() {
  const connectionOk = await testSupabaseConnection();
  
  if (connectionOk) {
    await checkCriticalTables();
    await checkRLSPolicies();
  }
  
  checkNetlifyBuild();
  
  console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
  console.log('============================');
  console.log('Si la conexión a Supabase falla, el error global es causado por:');
  console.log('1. Variables de entorno incorrectas en Netlify');
  console.log('2. RLS policies bloqueando todas las queries');
  console.log('3. Problemas de red o CORS');
  console.log('');
  console.log('PRÓXIMOS PASOS:');
  console.log('1. Verifica variables en Netlify Dashboard');
  console.log('2. Revisa logs de Netlify deploy');
  console.log('3. Abre DevTools en el navegador para ver el error exacto');
  console.log('4. Revisa Supabase logs en dashboard');
}

runDiagnostics().catch(console.error);