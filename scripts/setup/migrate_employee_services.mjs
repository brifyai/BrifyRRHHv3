#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN: Reemplazar inMemoryEmployeeService con organizedDatabaseService
 *
 * Este script reemplaza todas las referencias de inMemoryEmployeeService
 * con organizedDatabaseService para eliminar la duplicación crítica de datos.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos que necesitan ser actualizados
const filesToUpdate = [
  'src/services/multiChannelCommunicationService.js',
  'src/services/enhancedEmployeeFolderService.js',
  'src/services/enhancedCommunicationService.js',
  'src/services/employeeFolderService.js',
  'src/services/communicationService.js',
  'src/hooks/useEmployeeFolders.js',
  'src/components/communication/CreateEventModal.js',
  'src/components/embeddings/AIChat.js',
  'backup_redundant_files/scripts/test-communication-system.js'
];

console.log('🚀 Iniciando migración de servicios de empleados...\n');

// Función para actualizar un archivo
function updateFile(filePath) {
  try {
    console.log(`📝 Procesando: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;

    // Reemplazar import
    const importRegex = /import inMemoryEmployeeService from '\.\/inMemoryEmployeeService'/g;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, "import organizedDatabaseService from './organizedDatabaseService'");
      changes++;
      console.log(`   ✅ Import actualizado`);
    }

    // Reemplazar import con extensión .js
    const importRegexJs = /import inMemoryEmployeeService from '\.\/inMemoryEmployeeService\.js'/g;
    if (importRegexJs.test(content)) {
      content = content.replace(importRegexJs, "import organizedDatabaseService from './organizedDatabaseService.js'");
      changes++;
      console.log(`   ✅ Import con extensión actualizado`);
    }

    // Reemplazar import relativo con ../
    const importRegexRelative = /import inMemoryEmployeeService from '\.\.\/services\/inMemoryEmployeeService'/g;
    if (importRegexRelative.test(content)) {
      content = content.replace(importRegexRelative, "import organizedDatabaseService from '../services/organizedDatabaseService'");
      changes++;
      console.log(`   ✅ Import relativo actualizado`);
    }

    // Reemplazar referencias a propiedades directas
    const companiesRegex = /inMemoryEmployeeService\.companies/g;
    if (companiesRegex.test(content)) {
      content = content.replace(companiesRegex, 'await organizedDatabaseService.getCompanies()');
      changes++;
      console.log(`   ✅ Referencia a companies actualizada`);
    }

    const employeesRegex = /inMemoryEmployeeService\.employees/g;
    if (employeesRegex.test(content)) {
      content = content.replace(employeesRegex, 'await organizedDatabaseService.getEmployees()');
      changes++;
      console.log(`   ✅ Referencia a employees actualizada`);
    }

    // Reemplazar llamadas a métodos
    const methodCalls = [
      { old: 'inMemoryEmployeeService.getCompanies()', new: 'organizedDatabaseService.getCompanies()' },
      { old: 'inMemoryEmployeeService.getEmployees(', new: 'organizedDatabaseService.getEmployees(' },
      { old: 'inMemoryEmployeeService.getEmployeeById(', new: 'organizedDatabaseService.getEmployeeById(' },
      { old: 'inMemoryEmployeeService.getEmployeeCountByCompany(', new: 'organizedDatabaseService.getEmployeeCountByCompany(' },
      { old: 'await inMemoryEmployeeService.getCompanies()', new: 'await organizedDatabaseService.getCompanies()' },
      { old: 'await inMemoryEmployeeService.getEmployees(', new: 'await organizedDatabaseService.getEmployees(' },
      { old: 'await inMemoryEmployeeService.getEmployeeById(', new: 'await organizedDatabaseService.getEmployeeById(' },
      { old: 'await inMemoryEmployeeService.getEmployeeCountByCompany(', new: 'await organizedDatabaseService.getEmployeeCountByCompany(' }
    ];

    methodCalls.forEach(({ old, new: newCall }) => {
      if (content.includes(old)) {
        content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCall);
        changes++;
        console.log(`   ✅ Método ${old} actualizado`);
      }
    });

    // Guardar cambios si hubo modificaciones
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   🎉 ${filePath} actualizado (${changes} cambios)\n`);
      return true;
    } else {
      console.log(`   ℹ️  No se encontraron cambios necesarios en ${filePath}\n`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Procesar todos los archivos
let totalFilesUpdated = 0;
let totalChanges = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    if (updateFile(fullPath)) {
      totalFilesUpdated++;
    }
  } else {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
  }
});

// Verificar que no queden referencias
console.log('🔍 Verificando referencias restantes...');
const grepCommand = `find . -name "*.js" -not -path "./node_modules/*" -not -path "./backup_redundant_files/*" -exec grep -l "inMemoryEmployeeService" {} \\;`;

try {
  const { execSync } = await import('child_process');
  const remainingFiles = execSync(grepCommand, { encoding: 'utf8' }).trim();

  if (remainingFiles) {
    console.log('⚠️  Referencias restantes encontradas en:');
    console.log(remainingFiles);
  } else {
    console.log('✅ No se encontraron referencias restantes de inMemoryEmployeeService');
  }
} catch (error) {
  console.log('ℹ️  No se pudo verificar referencias restantes (grep no disponible)');
}

console.log(`\n🎯 Migración completada:`);
console.log(`   📊 Archivos procesados: ${filesToUpdate.length}`);
console.log(`   ✅ Archivos actualizados: ${totalFilesUpdated}`);
console.log(`   📝 Total de cambios: ${totalChanges}`);

console.log(`\n📋 PRÓXIMOS PASOS:`);
console.log(`   1. Probar que el sistema funciona correctamente`);
console.log(`   2. Eliminar el archivo inMemoryEmployeeService.js`);
console.log(`   3. Actualizar documentación`);
console.log(`   4. Ejecutar pruebas de integración`);

console.log(`\n✨ Migración completada exitosamente!`);