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

async function cleanMockCommunicationLogs() {
  console.log('🧹 LIMPIANDO DATOS MOCK DE COMMUNICATION_LOGS...\n');

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

    // 2. Identificar registros que parecen mock (generados automáticamente)
    // Características de datos mock:
    // - Mensajes genéricos como "Recordatorio de reunión semanal"
    // - Sender_id que no existe en employees
    // - Fechas aleatorias en los últimos 30 días
    // - Sentiment_score aleatorio entre -1 y 1

    const mockPatterns = [
      'Recordatorio de reunión semanal',
      'Actualización de beneficios laborales',
      'Información sobre capacitación',
      'Consulta sobre horarios flexibles',
      'Actualización de políticas de la empresa',
      'Felicitaciones por el aniversario',
      'Información sobre eventos sociales',
      'Actualización de proyectos',
      'Recordatorio de evaluaciones',
      'Información sobre salud y bienestar'
    ];

    const logsToDelete = [];
    const legitimateLogs = [];

    // Obtener todos los sender_id válidos de employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id');

    if (empError) {
      console.error('❌ Error al obtener employees:', empError);
      return;
    }

    const validEmployeeIds = new Set(employees.map(emp => emp.id));

    for (const log of allLogs) {
      const isMockPattern = mockPatterns.some(pattern => 
        log.message && log.message.includes(pattern)
      );
      
      const hasInvalidSender = log.sender_id && !validEmployeeIds.has(log.sender_id);
      
      // Si cumple alguna condición de mock, marcar para eliminación
      if (isMockPattern || hasInvalidSender) {
        logsToDelete.push(log.id);
      } else {
        legitimateLogs.push(log);
      }
    }

    console.log(`\n🎯 Registros identificados como MOCK: ${logsToDelete.length}`);
    console.log(`✅ Registros legítimos: ${legitimateLogs.length}`);

    if (logsToDelete.length === 0) {
      console.log('✅ No se encontraron registros mock para eliminar');
      return;
    }

    // 3. Mostrar muestra de registros a eliminar
    console.log('\n📋 Muestra de registros MOCK a eliminar:');
    const mockLogsSample = allLogs.filter(log => logsToDelete.includes(log.id)).slice(0, 5);
    mockLogsSample.forEach((log, index) => {
      console.log(`   ${index + 1}. ID: ${log.id}`);
      console.log(`      Mensaje: ${log.message?.substring(0, 60)}...`);
      console.log(`      Sender: ${log.sender_id} ${!validEmployeeIds.has(log.sender_id) ? '(❌ NO EXISTE)' : ''}`);
      console.log(`      Fecha: ${log.created_at}`);
      console.log('');
    });

    // 4. Confirmar eliminación
    console.log('⚠️  ESTA ACCIÓN ELIMINARÁ LOS REGISTROS PERMANENTEMENTE');
    
    // Eliminar directamente (sin prompt interactivo)
    console.log('🗑️  Eliminando registros mock...');
    
    const { error: deleteError } = await supabase
      .from('communication_logs')
      .delete()
      .in('id', logsToDelete);

    if (deleteError) {
      console.error('❌ Error al eliminar registros:', deleteError);
      return;
    }

    console.log(`✅ ELIMINADOS ${logsToDelete.length} registros mock exitosamente`);
    
    // 5. Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`   - Total registros antes: ${allLogs.length}`);
    console.log(`   - Registros mock eliminados: ${logsToDelete.length}`);
    console.log(`   - Registros legítimos restantes: ${legitimateLogs.length}`);
    
    if (legitimateLogs.length > 0) {
      console.log('\n   📋 Registros legítimos restantes:');
      legitimateLogs.slice(0, 3).forEach(log => {
        console.log(`   - ID: ${log.id} | Mensaje: ${log.message?.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Error crítico:', error);
  }
}

// Ejecutar limpieza
cleanMockCommunicationLogs();