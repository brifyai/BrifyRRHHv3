#!/usr/bin/env node

import fs from 'fs';

const filePath = 'src/components/communication/EmployeeFolders.js';

console.log('🔧 Eliminando llave extra al final del archivo...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`📊 Total de líneas: ${lines.length}`);
  
  // Eliminar la última línea si es una llave suelta
  if (lines[lines.length - 1].trim() === '}') {
    console.log('🔧 Eliminando llave extra en la última línea');
    lines.pop();
  }
  
  // Escribir el archivo corregido
  const correctedContent = lines.join('\n');
  fs.writeFileSync(filePath, correctedContent, 'utf8');
  
  console.log('✅ Archivo EmployeeFolders.js limpiado exitosamente');
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
    console.log('🎉 ¡Estructura de sintaxis completamente corregida!');
  } else {
    console.log('⚠️  Aún pueden quedar problemas de sintaxis');
  }
  
} catch (error) {
  console.error('❌ Error al corregir el archivo:', error.message);
}