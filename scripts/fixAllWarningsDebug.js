/**
 * Script de depuración para verificar qué archivos se procesarán
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

// Archivos a excluir
const EXCLUDE_FILES = [
  '*.backup',
  '*.test.js',
  '*.spec.js',
  'node_modules/**',
  'build/**',
  'backup_redundant_files/**'
]

function findJSFiles(dir, files = []) {
  const items = readdirSync(dir)
  
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    
    // Excluir directorios no deseados
    if (fullPath.includes('node_modules') || 
        fullPath.includes('build') || 
        fullPath.includes('backup_redundant_files') ||
        fullPath.includes('__tests__')) {
      continue
    }
    
    if (stat.isDirectory()) {
      findJSFiles(fullPath, files)
    } else if (stat.isFile() && extname(fullPath) === '.js' && !fullPath.includes('.backup')) {
      files.push(fullPath)
    }
  }
  
  return files
}

function main() {
  console.log('🔍 Iniciando modo DEBUG...\n')
  
  const srcDir = './src'
  const jsFiles = findJSFiles(srcDir)
  
  console.log(`📁 Encontrados ${jsFiles.length} archivos JavaScript:\n`)
  
  // Mostrar primeros 10 archivos
  jsFiles.slice(0, 10).forEach(file => {
    console.log(`   - ${file}`)
  })
  
  if (jsFiles.length > 10) {
    console.log(`   ... y ${jsFiles.length - 10} más`)
  }
  
  console.log('\n✅ Script de depuración completado')
}

main()