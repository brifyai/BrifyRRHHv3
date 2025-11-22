#!/usr/bin/env node

import fs from 'fs';

const filePath = 'src/components/communication/EmployeeFolders.js';

console.log('🔧 Corrigiendo problemas de sintaxis en EmployeeFolders.js...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`📊 Analizando ${lines.length} líneas...`);
  
  // Problema 1: Fragmento React sin cerrar en línea 1072
  // Buscar y corregir el fragmento React mal balanceado
  let correctedLines = [];
  let fragmentCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Contar fragmentos en esta línea
    const openFragments = (line.match(/<>/g) || []).length;
    const closeFragments = (line.match(/<\/>/g) || []).length;
    fragmentCount += openFragments - closeFragments;
    
    // Si encontramos un fragmento sin cerrar y estamos cerca del final, cerrarlo
    if (i === 1071 && fragmentCount > 0) { // Línea 1072 (índice 1071)
      console.log(`🔧 Cerrando fragmento React en línea ${i + 1}`);
      line = line.replace(/<>\s*$/, '<>\n                  </>');
      fragmentCount = 0;
    }
    
    // Buscar otros fragmentos problemáticos y corregirlos
    if (line.includes('<>') && !line.includes('</>') && !line.trim().endsWith('<>')) {
      // Si la línea tiene un fragmento abierto pero no cerrado, y no termina con <>,
      // probablemente necesita cerrarse
      const indent = line.match(/^(\s*)/)?.[1] || '';
      line = line + '\n' + indent + '                  </>';
      console.log(`🔧 Cerrando fragmento React en línea ${i + 1}`);
      fragmentCount = Math.max(0, fragmentCount - 1);
    }
    
    correctedLines.push(line);
  }
  
  // Problema 2: Corregir paréntesis y llaves desbalanceados
  // Buscar la función EmployeeFolders y asegurar que esté bien cerrada
  let functionDepth = 0;
  let inEmployeeFolders = false;
  let fixedLines = [];
  
  for (let i = 0; i < correctedLines.length; i++) {
    let line = correctedLines[i];
    
    // Detectar inicio de la función EmployeeFolders
    if (line.includes('const EmployeeFolders = () => {')) {
      inEmployeeFolders = true;
      console.log(`🔧 Función EmployeeFolders detectada en línea ${i + 1}`);
    }
    
    if (inEmployeeFolders) {
      // Contar llaves y paréntesis
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      
      functionDepth += openBraces - closeBraces;
      
      // Si llegamos al final de la función y hay llaves sin cerrar
      if (i === correctedLines.length - 3 && functionDepth > 0) { // 3 líneas antes del final
        console.log(`🔧 Cerrando ${functionDepth} llaves restantes en función EmployeeFolders`);
        for (let j = 0; j < functionDepth; j++) {
          fixedLines.push('  }');
        }
        functionDepth = 0;
      }
    }
    
    fixedLines.push(line);
  }
  
  // Problema 3: Corregir el useCallback mal formado en línea 393
  for (let i = 0; i < fixedLines.length; i++) {
    if (i === 392 && fixedLines[i].includes('}, [loadFolders]);}, [selectedFolders, foldersToShow]);')) {
      console.log('🔧 Corrigiendo useCallback mal formado en línea 393');
      fixedLines[i] = '  }, [selectedFolders, foldersToShow]);';
    }
  }
  
  // Problema 4: Asegurar que no hay paréntesis extra al final
  if (fixedLines[fixedLines.length - 3]?.includes(');') && !fixedLines[fixedLines.length - 3].includes('();')) {
    // Ya está bien
  }
  
  // Escribir el archivo corregido
  const correctedContent = fixedLines.join('\n');
  fs.writeFileSync(filePath, correctedContent, 'utf8');
  
  console.log('✅ Archivo EmployeeFolders.js corregido exitosamente');
  console.log('🔍 Verificando balanceo final...');
  
  // Verificación final
  const finalLines = correctedContent.split('\n');
  let totalOpenParens = 0;
  let totalCloseParens = 0;
  let totalOpenBraces = 0;
  let totalCloseBraces = 0;
  let totalFragments = 0;
  
  for (const line of finalLines) {
    totalOpenParens += (line.match(/\(/g) || []).length;
    totalCloseParens += (line.match(/\)/g) || []).length;
    totalOpenBraces += (line.match(/\{/g) || []).length;
    totalCloseBraces += (line.match(/\}/g) || []).length;
    totalFragments += (line.match(/<>/g) || []).length;
    totalFragments -= (line.match(/<\/>/g) || []).length;
  }
  
  console.log('\n📋 VERIFICACIÓN FINAL:');
  console.log(`Paréntesis: ${totalOpenParens} abiertos, ${totalCloseParens} cerrados`);
  console.log(`Llaves: ${totalOpenBraces} abiertas, ${totalCloseBraces} cerradas`);
  console.log(`Fragmentos React: ${totalFragments} sin cerrar`);
  
  if (totalOpenParens === totalCloseParens && totalOpenBraces === totalCloseBraces && totalFragments === 0) {
    console.log('🎉 ¡Todos los problemas de sintaxis han sido corregidos!');
  } else {
    console.log('⚠️  Aún quedan algunos problemas por corregir manualmente');
  }
  
} catch (error) {
  console.error('❌ Error al corregir el archivo:', error.message);
}