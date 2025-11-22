#!/usr/bin/env node

import fs from 'fs';

const filePath = 'src/components/communication/EmployeeFolders.js';

console.log('🔧 Reconstruyendo completamente la función EmployeeFolders...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`📊 Total de líneas: ${lines.length}`);
  
  // Encontrar donde empieza la función EmployeeFolders
  let functionStartIndex = -1;
  let functionEndIndex = -1;
  let braceCount = 0;
  let parenCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('const EmployeeFolders = () => {')) {
      functionStartIndex = i;
      console.log(`🔧 Función EmployeeFolders encontrada en línea ${i + 1}`);
      
      // Contar desde el inicio de la función
      for (let j = i; j < lines.length; j++) {
        const currentLine = lines[j];
        
        const openBraces = (currentLine.match(/\{/g) || []).length;
        const closeBraces = (currentLine.match(/\}/g) || []).length;
        const openParens = (currentLine.match(/\(/g) || []).length;
        const closeParens = (currentLine.match(/\)/g) || []).length;
        
        braceCount += openBraces - closeBraces;
        parenCount += openParens - closeParens;
        
        // Si llegamos al final y hay llaves sin cerrar, cerrarlas
        if (j === lines.length - 1 && braceCount > 0) {
          console.log(`🔧 Cerrando ${braceCount} llaves restantes`);
          for (let k = 0; k < braceCount; k++) {
            lines.splice(j + 1 + k, 0, '  }');
          }
          functionEndIndex = j + braceCount;
          break;
        }
      }
      break;
    }
  }
  
  // Asegurar que el export esté presente
  const hasExport = lines.some(line => line.includes('export default EmployeeFolders'));
  if (!hasExport) {
    lines.push('');
    lines.push('export default EmployeeFolders;');
    console.log('🔧 Agregado export default EmployeeFolders');
  }
  
  // Escribir el archivo corregido
  const correctedContent = lines.join('\n');
  fs.writeFileSync(filePath, correctedContent, 'utf8');
  
  console.log('✅ Archivo EmployeeFolders.js reconstruido exitosamente');
  console.log(`📊 Líneas procesadas: ${lines.length}`);
  
  console.log('\n📄 ÚLTIMAS LÍNEAS DEL ARCHIVO:');
  const lastLines = lines.slice(-5);
  lastLines.forEach((line, index) => {
    console.log(`  ${lines.length - 5 + index + 1}: ${line}`);
  });
  
  // Verificación final
  const finalLines = correctedContent.split('\n');
  let totalOpenParens = 0;
  let totalCloseParens = 0;
  let totalOpenBraces = 0;
  let totalCloseBraces = 0;
  
  for (const line of finalLines) {
    totalOpenParens += (line.match(/\(/g) || []).length;
    totalCloseParens += (line.match(/\)/g) || []).length;
    totalOpenBraces += (line.match(/\{/g) || []).length;
    totalCloseBraces += (line.match(/\}/g) || []).length;
  }
  
  console.log('\n📋 VERIFICACIÓN FINAL:');
  console.log(`Paréntesis: ${totalOpenParens} abiertos, ${totalCloseParens} cerrados`);
  console.log(`Llaves: ${totalOpenBraces} abiertas, ${totalCloseBraces} cerradas`);
  
  if (totalOpenParens === totalCloseParens && totalOpenBraces === totalCloseBraces) {
    console.log('🎉 ¡Estructura de sintaxis corregida!');
  } else {
    console.log('⚠️  Aún pueden quedar problemas de sintaxis');
  }
  
} catch (error) {
  console.error('❌ Error al corregir el archivo:', error.message);
}