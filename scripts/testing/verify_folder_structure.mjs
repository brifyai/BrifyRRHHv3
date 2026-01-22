#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN - ESTRUCTURA DE CARPETAS ACTUALIZADA
 * Verifica que los cambios en la estructura de carpetas se aplicaron correctamente
 */

import fs from 'fs';

function verifyFolderStructureChanges() {
  console.log('🔍 VERIFICANDO CAMBIOS EN ESTRUCTURA DE CARPETAS');
  console.log('=' .repeat(60));

  const filesToCheck = [
    {
      path: 'src/services/unifiedEmployeeFolderService.js',
      expectedPattern: '/Empleados',
      description: 'Unified Employee Folder Service'
    },
    {
      path: 'src/services/enhancedEmployeeFolderService.js', 
      expectedPattern: '/Empleados',
      description: 'Enhanced Employee Folder Service'
    },
    {
      path: 'src/services/googleDriveSyncService.js',
      expectedPattern: '/Empleados', 
      description: 'Google Drive Sync Service'
    }
  ];

  let allChangesApplied = true;

  filesToCheck.forEach((file, index) => {
    console.log(`\n📄 ${index + 1}. Verificando: ${file.description}`);
    console.log(`   Archivo: ${file.path}`);
    
    try {
      if (fs.existsSync(file.path)) {
        const content = fs.readFileSync(file.path, 'utf8');
        
        // Buscar la nueva estructura
        const hasNewStructure = content.includes(file.expectedPattern);
        
        // Buscar la estructura antigua (debe estar ausente)
        const hasOldStructure = content.includes('Empleados - ${companyName}');
        
        if (hasNewStructure && !hasOldStructure) {
          console.log(`   ✅ Nueva estructura encontrada: "${file.expectedPattern}"`);
          console.log(`   ✅ Estructura antigua eliminada`);
        } else if (hasOldStructure) {
          console.log(`   ❌ Estructura antigua aún presente: "Empleados - \${companyName}"`);
          allChangesApplied = false;
        } else if (!hasNewStructure) {
          console.log(`   ⚠️ Nueva estructura no encontrada en el archivo`);
          allChangesApplied = false;
        }
      } else {
        console.log(`   ❌ Archivo no encontrado: ${file.path}`);
        allChangesApplied = false;
      }
    } catch (error) {
      console.log(`   ❌ Error leyendo archivo: ${error.message}`);
      allChangesApplied = false;
    }
  });

  // Resumen final
  console.log('\n📋 RESUMEN DE VERIFICACIÓN:');
  console.log('=' .repeat(40));
  
  if (allChangesApplied) {
    console.log('🎉 ¡TODOS LOS CAMBIOS APLICADOS CORRECTAMENTE!');
    console.log('\n✅ Cambios verificados:');
    console.log('   • unifiedEmployeeFolderService.js');
    console.log('   • enhancedEmployeeFolderService.js');
    console.log('   • googleDriveSyncService.js');
    console.log('\n🔄 ESTRUCTURA ANTERIOR: "Empleados - {companyName}"');
    console.log('🆕 ESTRUCTURA NUEVA: "{companyName}/Empleados"');
    console.log('\n📁 Beneficios de la nueva estructura:');
    console.log('   • Mejor organización jerárquica');
    console.log('   • Compatible con sistemas de archivos');
    console.log('   • Más fácil navegación');
    console.log('   • Estándar de la industria');
  } else {
    console.log('❌ Algunos cambios no se aplicaron correctamente');
    console.log('🔧 Revisar los archivos marcados con ❌ o ⚠️');
  }

  return allChangesApplied;
}

// Ejecutar verificación
const success = verifyFolderStructureChanges();
process.exit(success ? 0 : 1);