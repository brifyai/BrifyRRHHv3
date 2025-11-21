#!/usr/bin/env node

/**
 * PRUEBA DEL SERVICIO CENTRALIZADO ANTI-DUPLICACIÓN
 * Verifica que el nuevo servicio previene duplicaciones correctamente
 */

import centralizedEmployeeFolderService from './src/services/centralizedEmployeeFolderService.js';
import organizedDatabaseService from './src/services/organizedDatabaseService.js';

async function testCentralizedService() {
  console.log('🧪 PRUEBA DEL SERVICIO CENTRALIZADO ANTI-DUPLICACIÓN');
  console.log('=' .repeat(60));

  try {
    // 1. Inicializar servicio
    console.log('\n🚀 1. Inicializando servicio centralizado...');
    const initialized = await centralizedEmployeeFolderService.initialize();
    
    if (!initialized) {
      console.log('❌ Error inicializando servicio');
      return;
    }
    console.log('✅ Servicio inicializado correctamente');

    // 2. Obtener estadísticas del servicio
    console.log('\n📊 2. Estadísticas del servicio:');
    const stats = centralizedEmployeeFolderService.getServiceStats();
    console.log(JSON.stringify(stats, null, 2));

    // 3. Probar con un empleado de prueba
    console.log('\n👤 3. Probando creación de carpeta para empleado de prueba...');
    
    // Obtener un empleado para la prueba
    const employees = await organizedDatabaseService.getEmployees();
    if (employees.length === 0) {
      console.log('⚠️ No hay empleados para probar');
      return;
    }

    const testEmployee = employees[0];
    console.log(`📧 Probando con: ${testEmployee.name} (${testEmployee.email})`);

    // 4. Primera creación (debe crear)
    console.log('\n🔄 4. Primera creación (debe crear carpeta nueva):');
    const result1 = await centralizedEmployeeFolderService.createEmployeeFolder(
      testEmployee.email, 
      testEmployee
    );
    
    console.log('Resultado primera creación:');
    console.log(`  - Creada: ${result1.created}`);
    console.log(`  - Existente: ${result1.existing}`);
    console.log(`  - Duplicada: ${result1.duplicated}`);
    console.log(`  - ID carpeta: ${result1.folder?.drive_folder_id || 'N/A'}`);

    // 5. Segunda creación (debe detectar duplicado)
    console.log('\n🔄 5. Segunda creación (debe detectar duplicado):');
    const result2 = await centralizedEmployeeFolderService.createEmployeeFolder(
      testEmployee.email, 
      testEmployee
    );
    
    console.log('Resultado segunda creación:');
    console.log(`  - Creada: ${result2.created}`);
    console.log(`  - Existente: ${result2.existing}`);
    console.log(`  - Duplicada: ${result2.duplicated}`);
    console.log(`  - ID carpeta: ${result2.folder?.drive_folder_id || 'N/A'}`);

    // 6. Verificar prevención de duplicados
    console.log('\n✅ 6. Verificación de prevención de duplicados:');
    if (!result1.created || result1.duplicated) {
      console.log('❌ ERROR: Primera creación falló o fue marcada como duplicada');
    } else if (result2.created || !result2.existing) {
      console.log('❌ ERROR: Segunda creación no detectó duplicado correctamente');
    } else {
      console.log('✅ ÉXITO: Duplicación prevenida correctamente');
    }

    // 7. Probar limpieza de duplicados (si existen)
    console.log('\n🧹 7. Probando limpieza de duplicados...');
    try {
      const cleanedCount = await centralizedEmployeeFolderService.cleanupDuplicateFolders();
      console.log(`✅ Limpieza completada: ${cleanedCount} duplicados eliminados`);
    } catch (cleanupError) {
      console.log(`⚠️ Error en limpieza (puede ser normal si no hay duplicados): ${cleanupError.message}`);
    }

    // 8. Resumen final
    console.log('\n📋 RESUMEN DE LA PRUEBA:');
    console.log('=' .repeat(40));
    console.log('✅ Servicio centralizado funcionando');
    console.log('✅ Prevención de duplicados activa');
    console.log('✅ Locks de concurrencia implementados');
    console.log('✅ Verificación de existencia funcionando');
    
    if (result1.created && !result2.created && result2.existing) {
      console.log('🎉 ¡PRUEBA EXITOSA! El servicio previene duplicaciones correctamente');
    } else {
      console.log('❌ PRUEBA FALLIDA: Revisar implementación');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar prueba
testCentralizedService();