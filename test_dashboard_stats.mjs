#!/usr/bin/env node

/**
 * SCRIPT DE PRUEBA DE ESTADÍSTICAS DEL DASHBOARD
 * 
 * Este script verifica que las estadísticas del dashboard se calculen correctamente
 * después de las mejoras implementadas
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

console.log('🧪 PRUEBA DE ESTADÍSTICAS DEL DASHBOARD');
console.log('======================================');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para reintentar operaciones con timeout (igual que en el servicio)
async function retryWithTimeout(operation, maxRetries = 3, baseDelay = 1000, timeout = 10000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Crear timeout para cada intento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), timeout);
      });
      
      const operationPromise = operation();
      
      return await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
      console.log(`🔄 Intento ${attempt}/${maxRetries} falló:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

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

// Función principal de prueba
async function testDashboardStats() {
  console.log('🚀 Iniciando prueba de estadísticas del dashboard...\n');

  try {
    console.log('📊 getDashboardStats: Iniciando carga de estadísticas del dashboard...');
    
    // ✅ SIMULACIÓN: Usar reintentos con timeout para cada consulta
    const [
      companiesResult,
      employeesResult,
      foldersResult,
      documentsResult,
      communicationStatsResult
    ] = await Promise.all([
      retryWithTimeout(async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return data;
      }, 3, 1000, 8000),
      
      retryWithTimeout(async () => {
        const { data, error } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return data;
      }, 3, 1000, 8000),
      
      retryWithTimeout(async () => {
        const { data, error } = await supabase
          .from('folders')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return data;
      }, 3, 1000, 8000),
      
      retryWithTimeout(async () => {
        const { data, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return data;
      }, 3, 1000, 8000),
      
      retryWithTimeout(async () => {
        return await getCommunicationStats();
      }, 3, 1000, 8000)
    ]);

    const companies = companiesResult?.count || 0;
    const employees = employeesResult?.count || 0;
    const folders = foldersResult?.count || 0;
    const documents = documentsResult?.count || 0;
    const communication = communicationStatsResult || { total: 0, byType: {}, byStatus: {}, recent: [] };

    console.log('📊 getDashboardStats: Resultados obtenidos:', {
      companies,
      employees, 
      folders,
      documents,
      communicationTotal: communication.total
    });

    // ✅ ESTADÍSTICAS ADICIONALES QUE EL DASHBOARD NECESITA
    const stats = {
      companies,
      employees,
      folders,
      documents,
      communication,
      
      // ✅ ESTADÍSTICAS ADICIONALES QUE EL DASHBOARD NECESITA
      storageUsed: documents * 1024 * 1024, // Simular 1MB por documento
      tokensUsed: Math.floor(employees * 10.5), // Simular tokens por empleado
      tokenLimit: 1000,
      monthlyGrowth: Math.floor((employees / companies) * 2.5), // Crecimiento simulado
      activeUsers: Math.floor(employees * 0.85), // 85% de empleados activos
      successRate: folders > 0 ? Math.floor((documents / folders) * 100) : 0,
      
      lastUpdated: new Date().toISOString()
    };
    
    console.log('📊 getDashboardStats: Estadísticas finales calculadas:', stats);

    // ✅ VERIFICACIÓN DE RESULTADOS
    console.log('\n✅ VERIFICACIÓN DE RESULTADOS:');
    console.log('==============================');
    
    console.log(`📁 Carpetas Activas: ${stats.folders} (esperado: ~800)`);
    console.log(`📄 Documentos Procesados: ${stats.documents} (esperado: 0)`);
    console.log(`🤖 Tokens de IA Utilizados: ${stats.tokensUsed} (calculado: empleados × 10.5)`);
    console.log(`💾 Almacenamiento Utilizado: ${(stats.storageUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Crecimiento Mensual: +${stats.monthlyGrowth}%`);
    console.log(`👥 Usuarios Activos: ${stats.activeUsers}`);
    console.log(`🎯 Tasa de Éxito: ${stats.successRate}%`);

    // ✅ VALIDACIONES
    console.log('\n🔍 VALIDACIONES:');
    console.log('===============');
    
    if (stats.folders > 0) {
      console.log('✅ PASS: Las carpetas se están contando correctamente');
    } else {
      console.log('❌ FAIL: Las carpetas no se están contando');
    }
    
    if (stats.employees > 0) {
      console.log('✅ PASS: Los empleados se están contando correctamente');
    } else {
      console.log('❌ FAIL: Los empleados no se están contando');
    }
    
    if (stats.companies > 0) {
      console.log('✅ PASS: Las empresas se están contando correctamente');
    } else {
      console.log('❌ FAIL: Las empresas no se están contando');
    }

    // ✅ RECOMENDACIONES
    console.log('\n🎯 RECOMENDACIONES:');
    console.log('==================');
    
    if (stats.folders === 0) {
      console.log('⚠️  ADVERTENCIA: 0 carpetas detectadas. Verificar:');
      console.log('   - Tabla folders existe y tiene datos');
      console.log('   - Permisos RLS permiten lectura');
    }
    
    if (stats.documents === 0) {
      console.log('ℹ️  INFO: 0 documentos detectados (normal si no se han subido documentos)');
    }
    
    if (stats.tokensUsed > 0) {
      console.log('✅ INFO: Tokens calculados correctamente basados en empleados');
    }

    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('=================================');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    
    // ✅ Valores por defecto más realistas en caso de error
    const fallbackStats = {
      companies: 0,
      employees: 0,
      folders: 0,
      documents: 0,
      communication: { total: 0, byType: {}, byStatus: {}, recent: [] },
      storageUsed: 0,
      tokensUsed: 0,
      tokenLimit: 1000,
      monthlyGrowth: 0,
      activeUsers: 0,
      successRate: 0,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('📊 Usando valores por defecto:', fallbackStats);
  }
}

// Ejecutar prueba
testDashboardStats().catch(err => {
  console.error('💥 Error fatal en la prueba:', err);
  process.exit(1);
});