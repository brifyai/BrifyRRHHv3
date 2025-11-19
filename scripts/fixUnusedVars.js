#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

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

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8')
    const originalContent = content
    let changes = []
    
    // 1. Eliminar imports de Heroicons no usados
    // Pattern: import { Icon1, Icon2 } from '@heroicons/react/24/outline';
    const heroiconsRegex = /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@heroicons\/react[^'"]*['"];?\n/g
    
    let match
    while ((match = heroiconsRegex.exec(originalContent)) !== null) {
      const fullImport = match[0]
      const importedItems = match[1].split(',').map(item => item.trim()).filter(item => item)
      
      // Verificar si cada item se usa en el archivo (excluyendo el import)
      const contentWithoutImport = content.replace(fullImport, '')
      const usedItems = importedItems.filter(item => {
        // Para iconos, buscar uso exacto del nombre
        const itemUsageRegex = new RegExp(`\\b${item}\\b`, 'g')
        return itemUsageRegex.test(contentWithoutImport)
      })
      
      // Si ningún item se usa, eliminar el import completo
      if (usedItems.length === 0) {
        content = content.replace(fullImport, '')
        changes.push(`Eliminado import de Heroicons: ${importedItems.join(', ')}`)
      }
      // Si solo algunos se usan, actualizar el import
      else if (usedItems.length < importedItems.length) {
        const unusedItems = importedItems.filter(item => !usedItems.includes(item))
        const newImport = `import { ${usedItems.join(', ')} } from '@heroicons/react/24/outline';`
        content = content.replace(fullImport, newImport)
        changes.push(`Actualizado import de Heroicons: eliminados ${unusedItems.join(', ')}`)
      }
    }
    
    // 2. Eliminar imports individuales no usados
    // Pattern: import Something from 'module';
    const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\n/g
    
    while ((match = defaultImportRegex.exec(originalContent)) !== null) {
      const fullImport = match[0]
      const importName = match[1]
      const modulePath = match[2]
      
      // No procesar React, useEffect, useState, etc. (hooks y React)
      const reactImports = ['React', 'useEffect', 'useState', 'useCallback', 'useMemo', 'useRef', 'useContext']
      if (reactImports.includes(importName)) continue
      
      // No procesar imports de estilos CSS
      if (modulePath.includes('.css')) continue
      
      // Verificar si se usa en el archivo
      const contentWithoutImport = content.replace(fullImport, '')
      const usageRegex = new RegExp(`\\b${importName}\\b`, 'g')
      
      if (!usageRegex.test(contentWithoutImport)) {
        content = content.replace(fullImport, '')
        changes.push(`Eliminado import no usado: ${importName} from ${modulePath}`)
      }
    }
    
    // 3. Eliminar variables declaradas pero no usadas
    // Pattern: const variable = value; (sin usar)
    const varRegex = /\b(const|let|var)\s+(\w+)\s*=\s*[^;]+;/g
    
    // Encontrar todas las variables declaradas
    const declaredVars = []
    while ((match = varRegex.exec(originalContent)) !== null) {
      const varName = match[2]
      // Excluir nombres comunes que pueden ser usados implícitamente
      const commonVars = ['props', 'state', 'error', 'data', 'result', 'response', 'user', 'company']
      if (!commonVars.includes(varName)) {
        declaredVars.push(varName)
      }
    }
    
    // Verificar cada variable
    declaredVars.forEach(varName => {
      // Buscar uso real de la variable (excluyendo la declaración)
      const varDeclRegex = new RegExp(`\\b(const|let|var)\\s+${varName}\\s*=`, 'g')
      const contentWithoutDecl = content.replace(varDeclRegex, '')
      const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*=)`, 'g')
      
      if (!usageRegex.test(contentWithoutDecl)) {
        // Encontrar y eliminar la línea completa
        const lineRegex = new RegExp(`\\s*(const|let|var)\\s+${varName}\\s*=\\s*[^;]+;\\s*\\n`, 'g')
        content = content.replace(lineRegex, '')
        changes.push(`Eliminada variable no usada: ${varName}`)
      }
    })
    
    // 4. Añadir eslint-disable para parámetros no usados en funciones
    // Pattern: function(param1, param2) { // param1 no usado
    const functionRegex = /(function\s+\w+|\(\s*([^)]*)\s*\)\s*=>\s*{)[^}]*}/g
    
    // Si hubo cambios, guardar el archivo
    if (content !== originalContent && changes.length > 0) {
      writeFileSync(filePath, content, 'utf8')
      console.log(`✅ ${filePath}`)
      changes.forEach(change => console.log(`   - ${change}`))
      return { file: filePath, changes: changes.length }
    }
    
    return { file: filePath, changes: 0 }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message)
    return { file: filePath, changes: 0, error: error.message }
  }
}

function main() {
  console.log('🔧 Iniciando eliminación de variables e imports no usados...\n')
  
  const srcDir = './src'
  const jsFiles = findJSFiles(srcDir)
  
  console.log(`📁 Encontrados ${jsFiles.length} archivos JavaScript para procesar\n`)
  
  let totalChanges = 0
  let filesModified = 0
  
  jsFiles.forEach(file => {
    const result = processFile(file)
    if (result.changes > 0) {
      totalChanges += result.changes
      filesModified++
    }
  })
  
  console.log(`\n📊 Resumen de correcciones:`)
  console.log(`✅ Archivos modificados: ${filesModified}`)
  console.log(`📝 Cambios totales aplicados: ${totalChanges}`)
  console.log(`📁 Archivos procesados: ${jsFiles.length}`)
  
  if (filesModified > 0) {
    console.log(`\n⚠️  IMPORTANTE: Revisa los cambios antes de hacer commit`)
    console.log(`   Algunas correcciones pueden necesitar ajustes manuales`)
    console.log(`   Ejecuta: npm run dev:win para verificar que todo funciona`)
  }
}

main()