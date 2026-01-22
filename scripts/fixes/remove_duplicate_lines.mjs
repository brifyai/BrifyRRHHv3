#!/usr/bin/env node

import fs from 'fs';

const filePath = 'src/components/communication/EmployeeFolders.js';

console.log('🔧 Eliminando líneas duplicadas al final del archivo...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`📊 Total de líneas: ${lines.length}`);
  
  // Buscar el patrón duplicado y eliminarlo
  let newLines = [];
  let foundDuplicate = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detectar el patrón duplicado
    if (line.trim() === '' && 
        i + 1 < lines.length && lines[i + 1].trim() === ')' &&
        i + 2 < lines.length && lines[i + 2].trim() === '}' &&
        i + 3 < lines.length && lines[i + 3].trim() === '' &&
        i + 4 < lines.length && lines[i + 4].trim() === 'export default EmployeeFolders;') {
      
      console.log(`🔧 Encontrado patrón duplicado en líneas ${i + 2} a ${i + 5}`);
      console.log(`🔧 Saltando líneas duplicadas...`);
      
      // Saltar las líneas duplicadas
      i += 4;
      foundDuplicate = true;
      continue;
    }
    
    newLines.push(line);
  }
  
  // Escribir el archivo corregido
  const correctedContent = newLines.join('\n');
  fs.writeFileSync(filePath, correctedContent, 'utf8');
  
  console.log('✅ Archivo EmployeeFolders.js corregido exitosamente');
  console.log(`📊 Líneas procesadas: ${lines.length} → ${newLines.length}`);
  
  if (foundDuplicate) {
    console.log('🎉 ¡Líneas duplicadas eliminadas!');
  } else {
    console.log('ℹ️  No se encontraron líneas duplicadas');
  }
  
  console.log('\n📄 ÚLTIMAS LÍNEAS DEL ARCHIVO:');
  const lastLines = newLines.slice(-5);
  lastLines.forEach((line, index) => {
    console.log(`  ${newLines.length - 5 + index + 1}: ${line}`);
  });
  
} catch (error) {
  console.error('❌ Error al corregir el archivo:', error.message);
}