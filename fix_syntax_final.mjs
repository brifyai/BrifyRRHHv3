import fs from 'fs';

console.log('🔧 Corrigiendo sintaxis de EmployeeFolders.js...\n');

const filePath = 'src/components/communication/EmployeeFolders.js';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`📄 Archivo: ${filePath}`);
console.log(`📊 Total de líneas: ${lines.length}\n`);

// Encontrar la línea donde está el }; de cierre
const closingBraceLineIndex = lines.findIndex(line => line.trim() === '};');
if (closingBraceLineIndex === -1) {
  console.log('❌ No se encontró la línea de cierre };');
  process.exit(1);
}

console.log(`✅ Línea de cierre encontrada en: ${closingBraceLineIndex + 1}`);

// Insertar los caracteres de cierre faltantes antes del };
lines[closingBraceLineIndex] = '  )' + '\n' + '}' + '\n' + '};';

// Escribir el archivo corregido
fs.writeFileSync(filePath, lines.join('\n'));

console.log('✅ Sintaxis corregida exitosamente!');
console.log('🔧 Agregados: 1 paréntesis de cierre y 1 llave de cierre');

// Verificar la corrección
const updatedContent = fs.readFileSync(filePath, 'utf-8');
const updatedLines = updatedContent.split('\n');

console.log('\n📋 ÚLTIMAS 5 LÍNEAS DESPUÉS DE LA CORRECCIÓN:');
for (let i = Math.max(0, updatedLines.length - 5); i < updatedLines.length; i++) {
  console.log(`${i + 1}: ${updatedLines[i]}`);
}

// Verificar balanceo nuevamente
let parentheses = 0;
let braces = 0;

for (const line of updatedLines) {
  for (const char of line) {
    if (char === '(') parentheses++;
    if (char === ')') parentheses--;
    if (char === '{') braces++;
    if (char === '}') braces--;
  }
}

console.log('\n📊 VERIFICACIÓN FINAL:');
console.log(`Paréntesis: ${parentheses} ${parentheses === 0 ? '✅' : '❌'}`);
console.log(`Llaves: ${braces} ${braces === 0 ? '✅' : '❌'}`);

if (parentheses === 0 && braces === 0) {
  console.log('\n🎉 ¡Sintaxis corregida completamente!');
} else {
  console.log('\n⚠️ Aún pueden quedar problemas de sintaxis');
}

console.log('\n✅ Corrección completada.');