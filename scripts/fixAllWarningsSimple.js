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
    let changes = 0
    
    // 1. Eliminar imports de Heroicons no usados
    const iconImportRegex = /import\s+{\s*([^}]+)\s*}\s+from\s+['"]@heroicons\/react[^'"]*['"];?\n/gm
    
    let match
    while ((match = iconImportRegex.exec(originalContent)) !== null) {
      const fullImport = match[0]
      const importedIcons = match[1].split(',').map(icon => icon.trim())
      
      // Verificar si cada icono se usa en el archivo
      const contentWithoutImport = content.replace(fullImport, '')
      const usedIcons = importedIcons.filter(icon => {
        const iconUsageRegex = new RegExp(`\\b${icon}\\b`, 'g')
        return iconUsageRegex.test(contentWithoutImport)
      })
      
      // Si ningún icono se usa, eliminar el import completo
      if (usedIcons.length === 0) {
        content = content.replace(fullImport, '')
        changes++
        console.log(`   - Eliminado import de Heroicons: ${importedIcons.join(', ')}`)
      }
    }
    
    // 2. Eliminar variables con eslint-disable-line
    const unusedVarRegex = /^\s*(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*eslint-disable-next-line\s+no-unused-vars\n/gm
    
    while ((match = unusedVarRegex.exec(content)) !== null) {
      const fullLine = match[0]
      const varName = match[2]
      
      // Verificar si la variable se usa realmente
      const contentWithoutLine = content.replace(fullLine, '')
      const varUsageRegex = new RegExp(`\\b${varName}\\b(?!\\s*=)`, 'g')
      
      if (!varUsageRegex.test(contentWithoutLine)) {
        content = content.replace(fullLine, '')
        changes++
        console.log(`   - Eliminada variable no usada: ${varName}`)
      }
    }
    
    // 3. Añadir dependencias faltantes simples
    // Buscar useEffect con loadUserProfile, loadCompanies, etc.
    const simpleHookRegex = /(useEffect|useMemo|useCallback)\s*\(\s*\(\)\s*=>\s*{[^}]*}\s*,\s*\[\s*\]\s*\)/g
    
    while ((match = simpleHookRegex.exec(content)) !== null) {
      const fullHook = match[0]
      const hookType = match[1]
      
      // Buscar funciones comunes que deberían estar en dependencias
      const commonFunctions = ['loadUserProfile', 'loadCompanies', 'loadEmployees', 'loadFolders', 'loadFiles', 'applyFilters', 'extractUniqueFilters']
      const foundFunctions = commonFunctions.filter(func => {
        const funcRegex = new RegExp(`\\b${func}\\b`, 'g')
        return funcRegex.test(fullHook)
      })
      
      if (foundFunctions.length > 0) {
        const newHook = fullHook.replace(/\[\s*\]/, `[${foundFunctions.join(', ')}]`)
        content = content.replace(fullHook, newHook)
        changes++
        console.log(`   - Añadidas dependencias a ${hookType}: ${foundFunctions.join(', ')}`)
      }
    }
    
    // Si hubo cambios, guardar el archivo
    if (content !== originalContent && changes > 0) {
      writeFileSync(filePath, content, 'utf8')
      console.log(`✅ ${filePath}`)
      return { file: filePath, changes }
    }
    
    return { file: filePath, changes: 0 }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message)
    return { file: filePath, changes: 0, error: error.message }
  }
}

function main() {
  console.log('🔧 Iniciando corrección automática de warnings...\n')
  
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
  }
}

main()