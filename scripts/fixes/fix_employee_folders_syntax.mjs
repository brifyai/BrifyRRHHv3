import fs from 'fs';

console.log('🔧 Analizando sintaxis del archivo EmployeeFolders.js...\n');

const filePath = 'src/components/communication/EmployeeFolders.js';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`📄 Archivo: ${filePath}`);
console.log(`📊 Total de líneas: ${lines.length}\n`);

// Contadores para balanceo
let parentheses = 0;
let braces = 0;
let brackets = 0;
let quotes = 0;
let backticks = 0;
let inString = false;
let stringChar = '';
let inJSX = false;
let jsxDepth = 0;

const issues = [];
const functionStack = [];

// Analizar línea por línea
for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
  const line = lines[lineNum - 1];
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    // Manejo de strings
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
    } else if (char === '`' && !inString) {
      backticks++;
    } else if (char === '`' && !inString) {
      backticks--;
    }
    
    // Solo analizar caracteres fuera de strings
    if (!inString) {
      // Paréntesis
      if (char === '(') parentheses++;
      if (char === ')') parentheses--;
      
      // Llaves
      if (char === '{') braces++;
      if (char === '}') braces--;
      
      // Corchetes
      if (char === '[') brackets++;
      if (char === ']') brackets--;
      
      // JSX
      if (char === '<') jsxDepth++;
      if (char === '>') jsxDepth--;
      
      // Detectar funciones arrow
      if (char === '=' && nextChar === '>' && !inString) {
        // Buscar el nombre de la función antes del =>
        const beforeEquals = line.substring(0, i).trim();
        const funcMatch = beforeEquals.match(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>/);
        if (funcMatch) {
          functionStack.push({
            name: funcMatch[1],
            line: lineNum,
            parentheses: parentheses,
            braces: braces
          });
        }
      }
    }
  }
  
  // Verificar balance en cada línea
  if (parentheses < 0) {
    issues.push(`Línea ${lineNum}: Paréntesis de cierre sin apertura`);
    parentheses = 0;
  }
  if (braces < 0) {
    issues.push(`Línea ${lineNum}: Llave de cierre sin apertura`);
    braces = 0;
  }
  if (brackets < 0) {
    issues.push(`Línea ${lineNum}: Corchete de cierre sin apertura`);
    brackets = 0;
  }
}

console.log('📊 ESTADO FINAL DE BALANCEO:');
console.log(`Paréntesis: ${parentheses} ${parentheses === 0 ? '✅' : '❌'}`);
console.log(`Llaves: ${braces} ${braces === 0 ? '✅' : '❌'}`);
console.log(`Corchetes: ${brackets} ${brackets === 0 ? '✅' : '❌'}`);
console.log(`Backticks: ${backticks} ${backticks === 0 ? '✅' : '❌'}`);
console.log(`JSX Depth: ${jsxDepth} ${jsxDepth === 0 ? '✅' : '❌'}\n`);

if (issues.length > 0) {
  console.log('🚨 PROBLEMAS DETECTADOS:');
  issues.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

// Mostrar funciones detectadas
console.log('🔍 FUNCIONES DETECTADAS:');
functionStack.forEach(func => {
  console.log(`  ${func.name} - Línea ${func.line} (Paréntesis: ${func.parentheses}, Llaves: ${func.braces})`);
});
console.log();

// Verificar las últimas líneas del archivo
console.log('📋 ÚLTIMAS 10 LÍNEAS DEL ARCHIVO:');
for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Intentar identificar el problema específico
console.log('\n🔍 DIAGNÓSTICO ESPECÍFICO:');

// Buscar la función EmployeeFolders
const employeeFoldersStart = lines.findIndex(line => line.includes('const EmployeeFolders = () => {'));
if (employeeFoldersStart !== -1) {
  console.log(`✅ Función EmployeeFolders encontrada en línea ${employeeFoldersStart + 1}`);
  
  // Verificar si hay algún problema cerca del final
  const lastLines = lines.slice(employeeFoldersStart);
  let localParens = 0;
  let localBraces = 0;
  
  for (let i = 0; i < lastLines.length; i++) {
    const line = lastLines[i];
    for (const char of line) {
      if (char === '(') localParens++;
      if (char === ')') localParens--;
      if (char === '{') localBraces++;
      if (char === '}') localBraces--;
    }
    
    // Si encontramos un problema en las últimas líneas
    if (i > lastLines.length - 20 && (localParens < 0 || localBraces < 0)) {
      console.log(`❌ Problema detectado en línea ${employeeFoldersStart + i + 1}: ${line.trim()}`);
      console.log(`   Paréntesis locales: ${localParens}, Llaves locales: ${localBraces}`);
    }
  }
}

// Solución propuesta
console.log('\n🛠️ SOLUCIÓN PROPUESTA:');
if (parentheses !== 0 || braces !== 0) {
  console.log('1. Balancear paréntesis y llaves');
  if (parentheses > 0) console.log(`   - Agregar ${parentheses} paréntesis de cierre ')'`);
  if (parentheses < 0) console.log(`   - Eliminar ${Math.abs(parentheses)} paréntesis de cierre ')'`);
  if (braces > 0) console.log(`   - Agregar ${braces} llaves de cierre '}'`);
  if (braces < 0) console.log(`   - Eliminar ${Math.abs(braces)} llaves de cierre '}'`);
} else {
  console.log('✅ El balanceo parece correcto. El problema puede estar en la estructura JSX.');
}

// Verificar si el archivo termina correctamente
const lastNonEmptyLine = lines.slice().reverse().find(line => line.trim() !== '');
if (lastNonEmptyLine && !lastNonEmptyLine.includes('export default EmployeeFolders')) {
  console.log('⚠️ El archivo no termina con "export default EmployeeFolders"');
}

console.log('\n✅ Análisis completado.');