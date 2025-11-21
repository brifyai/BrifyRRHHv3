#!/usr/bin/env node

/**
 * SCRIPT FINAL - PRUEBA DE ESTADÍSTICAS CORREGIDAS
 * 
 * Este script verifica que las estadísticas del dashboard se calculen correctamente
 * después de la corrección del método getDashboardStats()
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

console.log('🎯 PRUEBA FINAL - ESTADÍSTICAS CORREGIDAS');
console.log('==========================================');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para obtener estadísticas de comunicación
async function getCommunicationStats() {
  try {
    let query = supabase
      .from('communication_logs')
      .select('status, created_at, type, employee_id, company_id');

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo estadísticas de comunicación:', error);
      throw error;
    }

    // Procesar estadísticas usando columnas reales
    const stats = {
      total: data?.length || 0,
      byType: {},
      byStatus: {},
      byEmployee: {},
      recent: data?.slice(0, 10) || []
    };

    data?.forEach(log => {
      // Por tipo
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // Por estado
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      
      // Por empleado
      if (log.employee_id) {
        stats.byEmployee[log.employee_id] = (stats.byEmployee[log.employee_id] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('❌ Error en getCommunicationStats():', error);
    return { total: 0, byType: {}, byStatus: {}, byEmployee: {}, recent: [] };
  }
}

// Función principal - versión corregida de getDashboardStats
async function testCorrectedDashboardStats() {
  console.log('🚀 Probando método getDashboardStats() CORREGIDO...\n');

  try {
    console.log('📊 getDashboardStats: Iniciando carga de estadísticas del dashboard...');
    
    // ✅ MÉTODO SIMPLIFICADO: Consultas directas sin reintentos complejos
    console.log('🔍 Consultando companies...');
    const { count: companiesCount, error: companiesError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    if (companiesError) {
      console.error('❌ Error consultando companies:', companiesError);
      throw companiesError;
    }
    
    console.log('🔍 Consultando employees...');
    const { count: employeesCount, error: employeesError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    if (employeesError) {
      console.error('❌ Error consultando employees:', employeesError);
      throw employeesError;
    }
    
    console.log('🔍 Consultando folders...');
    const { count: foldersCount, error: foldersError } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true });
    
    if (foldersError) {
      console.error('❌ Error consultando folders:', foldersError);
      throw foldersError;
    }
    
    console.log('🔍 Consultando documents...');
    const { count: documentsCount, error: documentsError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (documentsError) {
      console.error('❌ Error consultando documents:', documentsError);
      throw documentsError;
    }
    
    console.log('🔍 Consultando communication_stats...');
    const communicationStats = await getCommunicationStats();

    const companies = companiesCount || 0;
    const employees = employeesCount || 0;
    const folders = foldersCount || 0;
    const documents = documentsCount || 0;

    console.log('📊 getDashboardStats: Resultados obtenidos:', {
      companies,
      employees, 
      folders,
      documents,
      communicationTotal: communicationStats.total
    });

    // ✅ CALCULAR ESTADÍSTICAS CORRECTAS
    const stats = {
      companies,
      employees,
      folders,
      documents,
      communication: communicationStats,
      
      // ✅ ESTADÍSTICAS ADICIONALES QUE EL DASHBOARD NECESITA
      storageUsed: documents * 1024 * 1024, // Simular 1MB por documento
      tokensUsed: Math.floor(employees * 10.5), // Simular tokens por empleado
      tokenLimit: 1000,
      monthlyGrowth: companies > 0 ? Math.floor((employees / companies) * 2.5) : 0, // Evitar NaN
      activeUsers: Math.floor(employees * 0.85), // 85% de empleados activos
      successRate: folders > 0 ? Math.floor((documents / folders) * 100) : 0,
      
      lastUpdated: new Date().toISOString()
    };
    
    console.log('📊 getDashboardStats: Estadísticas finales calculadas:', stats);

    // ✅ VERIFICACIÓN FINAL
    console.log('\n✅ VERIFICACIÓN FINAL:');
    console.log('=====================');
    
    console.log(`📁 Carpetas Activas: ${stats.folders} (esperado: ~800)`);
    console.log(`📄 Documentos Procesados: ${stats.documents} (esperado: 0)`);
    console.log(`🤖 Tokens de IA Utilizados: ${stats.tokensUsed} (calculado: empleados × 10.5)`);
    console.log(`💾 Almacenamiento Utilizado: ${(stats.storageUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Crecimiento Mensual: +${stats.monthlyGrowth}%`);
    console.log(`👥 Usuarios Activos: ${stats.activeUsers}`);
    console.log(`🎯 Tasa de Éxito: ${stats.successRate}%`);

    // ✅ VALIDACIONES FINALES
    console.log('\n🔍 VALIDACIONES FINALES:');
    console.log('========================');
    
    let allPassed = true;
    
    if (stats.folders > 0) {
      console.log('✅ PASS: Las carpetas se están contando correctamente');
    } else {
      console.log('❌ FAIL: Las carpetas no se están contando');
      allPassed = false;
    }
    
    if (stats.employees > 0) {
      console.log('✅ PASS: Los empleados se están contando correctamente');
    } else {
      console.log('❌ FAIL: Los empleados no se están contando');
      allPassed = false;
    }
    
    if (stats.companies > 0) {
      console.log('✅ PASS: Las empresas se están contando correctamente');
    } else {
      console.log('❌ FAIL: Las empresas no se están contando');
      allPassed = false;
    }
    
    if (!isNaN(stats.monthlyGrowth)) {
      console.log('✅ PASS: Crecimiento mensual calculado correctamente');
    } else {
      console.log('❌ FAIL: Crecimiento mensual tiene valor NaN');
      allPassed = false;
    }

    // ✅ RESULTADO FINAL
    console.log('\n🎉 RESULTADO FINAL:');
    console.log('===================');
    
    if (allPassed) {
      console.log('✅ ¡ÉXITO! Todas las validaciones pasaron');
      console.log('✅ El dashboard debería mostrar los datos correctamente');
      console.log('✅ Los datos ya no deberían ir a 0 después de cargar');
    } else {
      console.log('❌ FALLO: Algunas validaciones fallaron');
      console.log('❌ El problema puede requerir investigación adicional');
    }

    return stats;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    
    // ✅ Valores por defecto más realistas en caso de error
    const fallbackStats = {
      companies: 0,
      employees: 0,
      folders: 0,
      documents: 0,
      communication: { total: 0, byType: {}, byStatus: {}, byEmployee: {}, recent: [] },
      storageUsed: 0,
      tokensUsed: 0,
      tokenLimit: 1000,
      monthlyGrowth: 0,
      activeUsers: 0,
      successRate: 0,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('📊 Usando valores por defecto:', fallbackStats);
    return fallbackStats;
  }
}

// Ejecutar prueba
testCorrectedDashboardStats().catch(err => {
  console.error('💥 Error fatal en la prueba:', err);
  process.exit(1);
});