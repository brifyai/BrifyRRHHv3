import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmqglnycivlcjijoymwe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function testFrontendVisualization() {
  console.log('🔍 DIAGNÓSTICO DE VISUALIZACIÓN EN FRONTEND');
  console.log('=' .repeat(60));

  try {
    // 1. Simular consulta del frontend (limit por defecto)
    console.log('\n📋 CONSULTA CON LIMIT 10 (como frontend típico):');
    const { data: limitedData, error: limitedError } = await supabase
      .from('employee_folders')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (limitedError) throw limitedError;
    console.log(`✅ Carpetas obtenidas con limit 10: ${limitedData?.length || 0}`);

    // 2. Consulta sin limit para verificar total
    console.log('\n📋 CONSULTA SIN LIMIT (total real):');
    const { data: allData, error: allError } = await supabase
      .from('employee_folders')
      .select('*')
      .order('updated_at', { ascending: false });

    if (allError) throw allError;
    console.log(`✅ Total de carpetas disponibles: ${allData?.length || 0}`);

    // 3. Verificar estructura de datos que ve el frontend
    if (allData && allData.length > 0) {
      console.log('\n📊 ESTRUCTURA DE DATOS (primera carpeta):');
      const sample = allData[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Email: ${sample.employee_email}`);
      console.log(`   Nombre: ${sample.employee_name}`);
      console.log(`   Departamento: ${sample.employee_department}`);
      console.log(`   Estado: ${sample.folder_status}`);
      console.log(`   Actualizado: ${sample.updated_at}`);
    }

    // 4. Verificar paginación
    console.log('\n📄 VERIFICANDO PAGINACIÓN:');
    const pageSize = 10;
    const totalPages = Math.ceil((allData?.length || 0) / pageSize);
    console.log(`   Tamaño de página: ${pageSize}`);
    console.log(`   Total de páginas: ${totalPages}`);
    console.log(`   Carpetas por página: ${pageSize}`);
    console.log(`   Total de carpetas: ${allData?.length || 0}`);

    // 5. Verificar si hay filtros activos
    console.log('\n🔍 VERIFICANDO POSIBLES FILTROS:');
    
    // Contar por estado
    const { data: statusData } = await supabase
      .from('employee_folders')
      .select('folder_status')
      .order('updated_at', { ascending: false });

    if (statusData) {
      const statusCounts = statusData.reduce((acc, item) => {
        acc[item.folder_status] = (acc[item.folder_status] || 0) + 1;
        return acc;
      }, {});

      console.log('   Distribución por estado:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     ${status}: ${count} carpetas`);
      });
    }

    // 6. Verificar empleados activos vs inactivos
    console.log('\n👥 VERIFICANDO EMPLEADOS ACTIVOS:');
    const { data: activeEmployees } = await supabase
      .from('employees')
      .select('id')
      .eq('status', 'active');

    console.log(`   Empleados activos: ${activeEmployees?.length || 0}`);

    // 7. Verificar si hay problema de RLS (Row Level Security)
    console.log('\n🔒 VERIFICANDO PERMISOS (RLS):');
    try {
      const { data: testData, error: testError } = await supabase
        .from('employee_folders')
        .select('id')
        .limit(1);

      if (testError) {
        console.log(`   ⚠️ Posible problema de RLS: ${testError.message}`);
      } else {
        console.log('   ✅ RLS permite lectura');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando RLS: ${error.message}`);
    }

    return {
      limitedCount: limitedData?.length || 0,
      totalCount: allData?.length || 0,
      pageSize,
      totalPages,
      hasData: (allData?.length || 0) > 0
    };

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    throw error;
  }
}

// Ejecutar diagnóstico
testFrontendVisualization()
  .then(result => {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`   Carpetas con limit 10: ${result.limitedCount}`);
    console.log(`   Total de carpetas: ${result.totalCount}`);
    console.log(`   Páginas totales: ${result.totalPages}`);
    console.log(`   Tamaño de página: ${result.pageSize}`);
    
    if (result.totalCount > result.pageSize) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('   El frontend solo muestra la primera página!');
      console.log('   Necesita implementar paginación o scroll infinito');
      console.log(`   Hay ${result.totalCount} carpetas pero solo se ven ${result.pageSize}`);
    } else {
      console.log('\n✅ No hay problema de paginación');
    }
  })
  .catch(console.error);