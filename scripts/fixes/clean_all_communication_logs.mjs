import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAllCommunicationLogs() {
  console.log('🧹 LIMPIANDO TODOS LOS REGISTROS DE COMMUNICATION_LOGS...\n');

  try {
    // 1. Verificar registros actuales
    const { data: allLogs, error: fetchError } = await supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error al obtener logs:', fetchError);
      return;
    }

    console.log(`📊 Total de registros encontrados: ${allLogs.length}`);
    
    if (allLogs.length === 0) {
      console.log('✅ No hay registros para limpiar');
      return;
    }

    // 2. Mostrar muestra de registros
    console.log('\n📋 Muestra de registros a eliminar:');
    allLogs.slice(0, 5).forEach((log, index) => {
      console.log(`   ${index + 1}. ID: ${log.id}`);
      console.log(`      Empresa: ${log.company_id}`);
      console.log(`      Sender: ${log.sender_id}`);
      console.log(`      Mensaje: ${log.message?.substring(0, 60)}...`);
      console.log(`      Status: ${log.status}`);
      console.log(`      Fecha: ${log.created_at}`);
      console.log('');
    });

    if (allLogs.length > 5) {
      console.log(`   ... y ${allLogs.length - 5} registros más`);
    }

    // 3. Confirmar y eliminar
    console.log('⚠️  ESTA ACCIÓN ELIMINARÁ TODOS LOS REGISTROS PERMANENTEMENTE');
    console.log('🗑️  Eliminando todos los registros...');
    
    const { error: deleteError } = await supabase
      .from('communication_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos los registros

    if (deleteError) {
      console.error('❌ Error al eliminar registros:', deleteError);
      return;
    }

    console.log(`✅ ELIMINADOS ${allLogs.length} registros exitosamente`);
    
    // 4. Verificar que la tabla está vacía
    const { data: remainingLogs, error: verifyError } = await supabase
      .from('communication_logs')
      .select('id');

    if (verifyError) {
      console.error('❌ Error al verificar tabla:', verifyError);
      return;
    }

    console.log(`\n✅ Tabla communication_logs limpia. Registros restantes: ${remainingLogs.length}`);
    console.log('🎯 El dashboard ahora debería mostrar 0 mensajes enviados/leídos');

  } catch (error) {
    console.error('❌ Error crítico:', error);
  }
}

// Ejecutar limpieza
cleanAllCommunicationLogs();