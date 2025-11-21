#!/usr/bin/env node

/**
 * Script automatizado para corregir warnings comunes de ESLint
 * Enfocado en: imports no utilizados, variables no utilizadas, etc.
 */

const fs = require('fs');
const path = require('path');

// Configuración de directorios a procesar
const DIRECTORIES_TO_PROCESS = [
  'src/components',
  'src/services', 
  'src/hooks',
  'src/utils',
  'src/lib'
];

// Patrones de archivos a procesar
const FILE_PATTERNS = ['*.js', '*.jsx'];

// Función para leer archivos
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error.message);
    return null;
  }
}

// Función para escribir archivos
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error escribiendo archivo ${filePath}:`, error.message);
    return false;
  }
}

// Función para encontrar archivos
function findFiles(dir, patterns) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, patterns));
    } else if (stat.isFile()) {
      for (const pattern of patterns) {
        if (item.match(pattern.replace('*', '.*'))) {
          files.push(fullPath);
          break;
        }
      }
    }
  }
  
  return files;
}

// Función para corregir imports no utilizados
function fixUnusedImports(content) {
  // Esta es una implementación simplificada
  // En un caso real, usaríamos un parser AST
  
  const lines = content.split('\n');
  const imports = [];
  const usedImports = new Set();
  
  // Encontrar todos los imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Import statements
    if (line.startsWith('import ')) {
      imports.push({ line: i, content: line });
    }
    
    // Buscar uso de imports en el código
    for (const importItem of imports) {
      const importName = extractImportName(importItem.content);
      if (importName && line.includes(importName)) {
        usedImports.add(importName);
      }
    }
  }
  
  return content; // Por ahora retornamos el contenido original
}

// Función para extraer nombre del import
function extractImportName(importLine) {
  // Simplificado: extrae el primer nombre después de 'import'
  const match = importLine.match(/import\s+(\w+)/);
  return match ? match[1] : null;
}

// Función principal
function main() {
  console.log('🔧 Iniciando corrección automática de warnings ESLint...\n');
  
  let processedFiles = 0;
  let fixedFiles = 0;
  
  for (const dir of DIRECTORIES_TO_PROCESS) {
    console.log(`📁 Procesando directorio: ${dir}`);
    
    const files = findFiles(dir, FILE_PATTERNS);
    
    for (const file of files) {
      processedFiles++;
      
      const content = readFile(file);
      if (!content) continue;
      
      const originalContent = content;
      const fixedContent = fixUnusedImports(content);
      
      if (fixedContent !== originalContent) {
        if (writeFile(file, fixedContent)) {
          fixedFiles++;
          console.log(`✅ Corregido: ${file}`);
        }
      }
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${processedFiles}`);
  console.log(`   Archivos corregidos: ${fixedFiles}`);
  console.log(`\n🎯 Ejecuta 'npx eslint src/ --ext .js,.jsx' para verificar los cambios`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { findFiles, fixUnusedImports };