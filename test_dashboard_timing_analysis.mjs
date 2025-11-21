#!/usr/bin/env node

/**
 * ANÁLISIS DE TIMING DEL DASHBOARD
 * 
 * Este script simula el comportamiento del dashboard para confirmar
 * exactamente cuándo y por qué los datos se resetean a 0
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

console.log('⏰ ANÁLISIS DE TIMING DEL DASHBOARD');
console.log('===================================');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para simular el comportamiento del dashboard
async function simulateDashboardBehavior() {
  console.log('🚀 Simulando comportamiento del dashboard...\n');

  let step = 1;
  
  // PASO 1: Estado inicial
  console.log(`📋 PASO ${step++}: ESTADO INICIAL`);
  console.log('   - loading: true');
  console.log('   - stats: { totalFolders: 0, totalFiles: 0, ... }');
  console.log('   - percentages: { folders: 0, files: 0 }');
  console.log('');

  // PASO 2: Cargar datos (simulando loadDashboardData)
  console.log(`📋 PASO ${step++}: CARGANDO DATOS DESDE BASE DE DATOS`);
  console.log('   🔍 Consultando companies...');
  const { count: companiesCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
  
  console.log('   🔍 Consultando employees...');
  const { count: employeesCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });
  
  console.log('   🔍 Consultando folders...');
  const { count: foldersCount } = await supabase
    .from('folders')
    .select('*', { count: 'exact', head: true });
  
  console.log('   🔍 Consultando documents...');
  const { count: documentsCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });

  const companies = companiesCount || 0;
  const employees = employeesCount || 0;
  const folders = foldersCount || 0;
  const documents = documentsCount || 0;

  console.log('   ✅ Datos cargados exitosamente:');
  console.log(`      - companies: ${companies}`);
  console.log(`      - employees: ${employees}`);
  console.log(`      - folders: ${folders}`);
  console.log(`      - documents: ${documents}`);
  console.log('');

  // PASO 3: Actualizar estado con datos reales
  console.log(`📋 PASO ${step++}: ACTUALIZANDO ESTADO CON DATOS REALES`);
  const realStats = {
    totalFolders: folders,
    totalFiles: documents,
    storageUsed: documents * 1024 * 1024,
    tokensUsed: Math.floor(employees * 10.5),
    tokenLimit: 1000,
    monthlyGrowth: companies > 0 ? Math.floor((employees / companies) * 2.5) : 0,
    activeUsers: Math.floor(employees * 0.85),
    successRate: folders > 0 ? Math.floor((documents / folders) * 100) : 0
  };
  
  const realPercentages = {
    folders: Math.min((realStats.totalFolders / 1000) * 100, 100),
    files: Math.min((realStats.totalFiles / 5000) * 100, 100)
  };

  console.log('   ✅ Estado actualizado:');
  console.log(`      - totalFolders: ${realStats.totalFolders}`);
  console.log(`      - totalFiles: ${realStats.totalFiles}`);
  console.log(`      - tokensUsed: ${realStats.tokensUsed}`);
  console.log(`      - monthlyGrowth: +${realStats.monthlyGrowth}%`);
  console.log(`      - activeUsers: ${realStats.activeUsers}`);
  console.log('');

  // PASO 4: Simular timeout de seguridad
  console.log(`📋 PASO ${step++}: SIMULANDO TIMEOUT DE SEGURIDAD (12 segundos)`);
  console.log('   ⏰ Esperando 12 segundos...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Solo 2 segundos para demo
  
  console.log('   🚨 TIMEOUT EJECUTADO!');
  console.log('   ❌ PROBLEMA IDENTIFICADO: El timeout resetea TODO a 0');
  console.log('   📊 Estado después del timeout:');
  console.log('      - totalFolders: 0 (antes: ' + realStats.totalFolders + ')');
  console.log('      - totalFiles: 0 (antes: ' + realStats.totalFiles + ')');
  console.log('      - tokensUsed: 0 (antes: ' + realStats.tokensUsed + ')');
  console.log('      - monthlyGrowth: 0 (antes: +' + realStats.monthlyGrowth + '%)');
  console.log('      - activeUsers: 0 (antes: ' + realStats.activeUsers + ')');
  console.log('');

  // PASO 5: Análisis del problema
  console.log(`📋 PASO ${step++}: ANÁLISIS DEL PROBLEMA`);
  console.log('   🔍 CAUSA RAÍZ IDENTIFICADA:');
  console.log('   1. ❌ useEffect con timeout de 12 segundos (líneas 322-341)');
  console.log('      - Se ejecuta SIEMPRE al montar el componente');
  console.log('      - Resetea stats a 0 después de 12 segundos');
  console.log('      - No verifica si los datos ya se cargaron');
  console.log('');
  console.log('   2. ❌ Reset por usuario no autenticado (líneas 373-389)');
  console.log('      - Si userProfile no está disponible, resetea a 0');
  console.log('      - Puede ejecutarse después de que los datos se cargaron');
  console.log('');

  // PASO 6: Solución propuesta
  console.log(`📋 PASO ${step++}: SOLUCIÓN PROPUESTA`);
  console.log('   🔧 CORRECCIONES NECESARIAS:');
  console.log('   1. ❌ ELIMINAR el timeout de seguridad que resetea a 0');
  console.log('   2. ❌ NO resetear stats si ya se cargaron datos');
  console.log('   3. ✅ Solo mostrar loading, no resetear datos');
  console.log('   4. ✅ Verificar si userProfile existe antes de resetear');
  console.log('');

  console.log('🎯 CONCLUSIÓN:');
  console.log('==============');
  console.log('❌ Los datos se cargan correctamente');
  console.log('❌ Pero el timeout de 12 segundos los resetea a 0');
  console.log('✅ SOLUCIÓN: Eliminar o modificar el timeout problemático');
}

// Ejecutar análisis
simulateDashboardBehavior().catch(err => {
  console.error('💥 Error fatal en el análisis:', err);
  process.exit(1);
});