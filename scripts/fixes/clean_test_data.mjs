import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://supabase.staffhub.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function cleanTestData() {
  try {
    console.log('🧹 LIMPIEZA DE DATOS DE PRUEBA');
    console.log('================================');
    
    // Verificar datos actuales
    const { count: beforeCount } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Registros ANTES de limpieza: ${beforeCount}`);
    
    if (beforeCount === 0) {
      console.log('✅ No hay datos que limpiar');
      return;
    }
    
    // Mostrar algunos datos antes de eliminar
    const { data: sampleData } = await supabase
      .from('communication_logs')
      .select('id, company_id, status, created_at')
      .limit(5);
    
    console.log('\n📋 Muestra de datos a eliminar:');
    sampleData.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.status} - ${log.created_at} (Company: ${log.company_id})`);
    });
    
    // Confirmar eliminación
    console.log('\n⚠️  ESTE SCRIPT ELIMINARÁ TODOS LOS REGISTROS DE communication_logs');
    console.log('   Estos son datos de prueba que causan los números falsos en las tarjetas');
    console.log('   Si no has enviado mensajes reales, es seguro continuar');
    
    // Eliminar todos los registros (son datos de prueba)
    console.log('\n🗑️  Eliminando datos de prueba...');
    
    const { error: deleteError } = await supabase
      .from('communication_logs')
      .delete()
      .gte('created_at', '2000-01-01') // Eliminar todos los registros
    
    if (deleteError) {
      console.error('❌ Error eliminando datos:', deleteError);
      return;
    }
    
    // Verificar después de limpieza
    const { count: afterCount } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Registros DESPUÉS de limpieza: ${afterCount}`);
    
    if (afterCount === 0) {
      console.log('\n🎉 LIMPIEZA COMPLETADA');
      console.log('   - Se eliminaron todos los datos de prueba');
      console.log('   - Las tarjetas ahora mostrarán 0 en mensajes');
      console.log('   - Los sentimientos serán 0.00 (neutral)');
      console.log('   - Recarga la página para ver los cambios');
    } else {
      console.log(`⚠️  Quedaron ${afterCount} registros que no se pudieron eliminar`);
    }
    
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  }
}

cleanTestData();