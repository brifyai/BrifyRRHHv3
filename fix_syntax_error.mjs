import fs from 'fs';

// Leer el archivo
const filePath = 'src/components/communication/EmployeeFolders.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Corrigiendo error de sintaxis específico...');

// Buscar y corregir el bloque duplicado/malformado
content = content.replace(
  /Swal\.fire\(\{[\s\S]*?\}\);\s*title: 'Acción no válida',[\s\S]*?\}\);\s*\}/,
  `Swal.fire({
          title: 'Acción no válida',
          text: 'La acción solicitada no es válida.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
    }`
);

// Escribir el archivo corregido
fs.writeFileSync(filePath, content);
console.log('✅ Error de sintaxis corregido exitosamente');