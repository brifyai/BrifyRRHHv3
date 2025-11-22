#!/usr/bin/env node

import fs from 'fs';

const filePath = 'src/components/communication/EmployeeFolders.js';

console.log('🔧 Reconstruyendo el final de la función EmployeeFolders...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Encontrar el final de la función y reconstruirla correctamente
  let newLines = [];
  let inEmployeeFolders = false;
  let braceCount = 0;
  let parenCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
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
      
      braceCount += openBraces - closeBraces;
      parenCount += openParens - closeParens;
      
      // Si llegamos al final del archivo, reconstruir correctamente
      if (i === lines.length - 1) {
        console.log(`🔧 Reconstruyendo final de función - Llaves abiertas: ${braceCount}, Paréntesis abiertos: ${parenCount}`);
        
        // Cerrar paréntesis de la función arrow
        if (parenCount > 0) {
          for (let j = 0; j < parenCount; j++) {
            newLines.push('  )');
          }
        }
        
        // Cerrar llaves de la función
        if (braceCount > 0) {
          for (let j = 0; j < braceCount; j++) {
            newLines.push('}');
          }
        }
        
        // Agregar el export
        newLines.push('');
        newLines.push('export default EmployeeFolders;');
        
        break;
      }
    }
    
    // Agregar todas las líneas hasta llegar al final
    if (!inEmployeeFolders || i < lines.length - 1) {
      newLines.push(line);
    }
  }
  
  // Escribir el archivo corregido
  const correctedContent = newLines.join('\n');
  fs.writeFileSync(filePath, correctedContent, 'utf8');
  
  console.log('✅ Archivo EmployeeFolders.js reconstruido exitosamente');
  console.log('🔍 Verificando sintaxis final...');
  
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
  
  console.log('\n📄 ÚLTIMAS LÍNEAS DEL ARCHIVO:');
  const lastLines = finalLines.slice(-5);
  lastLines.forEach((line, index) => {
    console.log(`  ${finalLines.length - 5 + index + 1}: ${line}`);
  });
  
} catch (error) {
  console.error('❌ Error al corregir el archivo:', error.message);
}