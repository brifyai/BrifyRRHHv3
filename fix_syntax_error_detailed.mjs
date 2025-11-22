#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const filePath = 'src/components/communication/EmployeeFolders.js';

console.log('🔍 Analizando sintaxis del archivo EmployeeFolders.js...');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`📊 Total de líneas: ${lines.length}`);
  
  // Buscar problemas de sintaxis comunes
  let issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    
    // Verificar paréntesis no balanceados
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    // Verificar llaves no balanceadas
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    // Verificar corchetes no balanceados
    const openBrackets = (line.match(/\[/g) || []).length;
    const closeBrackets = (line.match(/\]/g) || []).length;
    
    if (openParens !== closeParens) {
      issues.push(`Línea ${lineNum}: Paréntesis no balanceados - Abiertos: ${openParens}, Cerrados: ${closeParens}`);
    }
    
    if (openBraces !== closeBraces) {
      issues.push(`Línea ${lineNum}: Llaves no balanceadas - Abiertas: ${openBraces}, Cerradas: ${closeBraces}`);
    }
    
    if (openBrackets !== closeBrackets) {
      issues.push(`Línea ${lineNum}: Corchetes no balanceados - Abiertos: ${openBrackets}, Cerrados: ${closeBrackets}`);
    }
    
    // Buscar fragmentos React mal cerrados
    if (line.includes('<>') && !line.includes('</>')) {
      issues.push(`Línea ${lineNum}: Fragmento React abierto sin cerrar`);
    }
    
    // Buscar problemas con useCallback
    if (line.includes('useCallback(') && !line.includes('), [')) {
      issues.push(`Línea ${lineNum}: useCallback sin dependencias`);
    }
  }
  
  // Verificar balanceo general del archivo
  let totalOpenParens = 0;
  let totalCloseParens = 0;
  let totalOpenBraces = 0;
  let totalCloseBraces = 0;
  let totalOpenBrackets = 0;
  let totalCloseBrackets = 0;
  let totalFragments = 0;
  
  for (const line of lines) {
    totalOpenParens += (line.match(/\(/g) || []).length;
    totalCloseParens += (line.match(/\)/g) || []).length;
    totalOpenBraces += (line.match(/\{/g) || []).length;
    totalCloseBraces += (line.match(/\}/g) || []).length;
    totalOpenBrackets += (line.match(/\[/g) || []).length;
    totalCloseBrackets += (line.match(/\]/g) || []).length;
    totalFragments += (line.match(/<>/g) || []).length;
    totalFragments -= (line.match(/<\/>/g) || []).length;
  }
  
  console.log('\n📋 RESUMEN DE BALANCEO:');
  console.log(`Paréntesis: ${totalOpenParens} abiertos, ${totalCloseParens} cerrados`);
  console.log(`Llaves: ${totalOpenBraces} abiertas, ${totalCloseBraces} cerradas`);
  console.log(`Corchetes: ${totalOpenBrackets} abiertos, ${totalCloseBrackets} cerrados`);
  console.log(`Fragmentos React: ${totalFragments} sin cerrar`);
  
  if (issues.length > 0) {
    console.log('\n❌ PROBLEMAS ENCONTRADOS:');
    issues.forEach(issue => console.log(`  ${issue}`));
  } else {
    console.log('\n✅ No se encontraron problemas de sintaxis obvios');
  }
  
  // Verificar estructura de funciones
  console.log('\n🔍 VERIFICANDO ESTRUCTURA DE FUNCIONES:');
  let functionCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('const ') && line.includes('= (') || line.includes('function ')) {
      functionCount++;
      console.log(`  Función ${functionCount} en línea ${i + 1}: ${line.trim()}`);
    }
  }
  
  // Verificar el final del archivo
  console.log('\n📄 ÚLTIMAS 10 LÍNEAS:');
  const lastLines = lines.slice(-10);
  lastLines.forEach((line, index) => {
    console.log(`  ${lines.length - 10 + index + 1}: ${line}`);
  });
  
} catch (error) {
  console.error('❌ Error al analizar el archivo:', error.message);
}