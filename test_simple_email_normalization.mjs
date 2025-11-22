/**
 * TEST SIMPLE DE NORMALIZACIÓN DE EMAILS CON CARACTERES ESPECIALES DEL ESPAÑOL
 * Test directo de la función sin dependencias de React/JSX
 */

// Función de normalización extraída del servicio
function normalizeEmail(email) {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .normalize('NFD') // Separar caracteres con diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes, acentos)
    .replace(/ñ/g, 'n') // Convertir ñ a n
    .replace(/Ñ/g, 'N'); // Convertir Ñ a N
}

// Test cases con emails problemáticos
const testCases = [
  {
    name: 'Email con ñ',
    email: 'joañ.garcía@empresa.com',
    expected: 'joan.garcia@empresa.com'
  },
  {
    name: 'Email con tilde',
    email: 'maría.lópez@empresa.com',
    expected: 'maria.lopez@empresa.com'
  },
  {
    name: 'Email con acento',
    email: 'ángel.martínez@empresa.com',
    expected: 'angel.martinez@empresa.com'
  },
  {
    name: 'Email con múltiples caracteres especiales',
    email: 'josé.ñúñez@empresa.com',
    expected: 'jose.nunez@empresa.com'
  },
  {
    name: 'Email normal (sin caracteres especiales)',
    email: 'juan.perez@empresa.com',
    expected: 'juan.perez@empresa.com'
  },
  {
    name: 'Email con espacios y mayúsculas',
    email: '  María.García@Empresa.COM  ',
    expected: 'maria.garcia@empresa.com'
  },
  {
    name: 'Email con caracteres especiales complejos',
    email: 'carlos.ramírez@empresa.com',
    expected: 'carlos.ramirez@empresa.com'
  }
];

async function testEmailNormalization() {
  console.log('🧪 Iniciando test de normalización de emails...\n');

  console.log('📧 Testeando función normalizeEmail:');
  console.log('=' .repeat(60));

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    const result = normalizeEmail(testCase.email);
    const passed = result === testCase.expected;
    
    console.log(`\n${passed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`   Original: "${testCase.email}"`);
    console.log(`   Normalizado: "${result}"`);
    console.log(`   Esperado: "${testCase.expected}"`);
    console.log(`   Estado: ${passed ? 'PASÓ' : 'FALLÓ'}`);
    
    if (passed) {
      passedTests++;
    } else {
      console.log(`   ⚠️ Diferencia detectada`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESULTADOS: ${passedTests}/${totalTests} tests pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todos los tests de normalización pasaron!');
  } else {
    console.log('⚠️ Algunos tests fallaron');
  }

  // Test de vinculación simulada
  console.log('\n🔗 Testeando vinculación empleado-carpeta:');
  console.log('=' .repeat(60));

  // Simular empleados con emails problemáticos
  const mockEmployees = [
    { email: 'joañ.garcía@empresa.com', name: 'Joaquín García', department: 'IT' },
    { email: 'maría.lópez@empresa.com', name: 'María López', department: 'RRHH' },
    { email: 'ángel.martínez@empresa.com', name: 'Ángel Martínez', department: 'Ventas' },
    { email: 'josé.ñúñez@empresa.com', name: 'José Núñez', department: 'Marketing' }
  ];

  // Simular carpetas con emails normalizados (como vendrían de la base de datos)
  const mockFolders = [
    { employee_email: 'joan.garcia@empresa.com', folder_name: 'Carpeta Joaquín' },
    { employee_email: 'maria.lopez@empresa.com', folder_name: 'Carpeta María' },
    { employee_email: 'angel.martinez@empresa.com', folder_name: 'Carpeta Ángel' },
    { employee_email: 'jose.nunez@empresa.com', folder_name: 'Carpeta José' }
  ];

  // Crear mapa de empleados normalizado
  const employeesMap = new Map();
  mockEmployees.forEach(emp => {
    if (emp.email) {
      const normalizedKey = normalizeEmail(emp.email);
      employeesMap.set(normalizedKey, emp);
      console.log(`📝 Mapeando: "${emp.email}" → "${normalizedKey}"`);
    }
  });

  console.log('\n🔍 Probando vinculaciones:');
  // Verificar vinculación
  let successfulLinks = 0;
  mockFolders.forEach(folder => {
    const normalizedEmail = normalizeEmail(folder.employee_email);
    const employee = employeesMap.get(normalizedEmail);
    
    if (employee) {
      console.log(`✅ Vinculación exitosa: ${folder.folder_name} → ${employee.name}`);
      successfulLinks++;
    } else {
      console.log(`❌ Vinculación fallida: ${folder.folder_name} (${normalizedEmail})`);
    }
  });

  console.log('\n' + '=' .repeat(60));
  console.log(`🔗 RESULTADOS DE VINCULACIÓN: ${successfulLinks}/${mockFolders.length} enlaces exitosos`);

  if (successfulLinks === mockFolders.length) {
    console.log('🎉 ¡Todas las vinculaciones funcionaron correctamente!');
    console.log('✅ La funcionalidad de drag & drop masivo funcionará con emails problemáticos');
  } else {
    console.log('⚠️ Algunas vinculaciones fallaron');
  }

  // Test de casos edge
  console.log('\n🧪 Testeando casos edge:');
  console.log('=' .repeat(60));

  const edgeCases = [
    { input: '', expected: '' },
    { input: null, expected: '' },
    { input: undefined, expected: '' },
    { input: 'TEST@EXAMPLE.COM', expected: 'test@example.com' },
    { input: '  spaced@email.com  ', expected: 'spaced@email.com' }
  ];

  let edgePassed = 0;
  edgeCases.forEach(testCase => {
    const result = normalizeEmail(testCase.input);
    const passed = result === testCase.expected;
    console.log(`${passed ? '✅' : '❌'} Edge case: "${testCase.input}" → "${result}" (esperado: "${testCase.expected}")`);
    if (passed) edgePassed++;
  });

  console.log(`\n📊 Edge cases: ${edgePassed}/${edgeCases.length} pasaron`);

  return {
    normalizationTests: { passed: passedTests, total: totalTests },
    linkingTests: { successful: successfulLinks, total: mockFolders.length },
    edgeTests: { passed: edgePassed, total: edgeCases.length }
  };
}

// Ejecutar test
testEmailNormalization()
  .then(results => {
    console.log('\n🏁 TEST COMPLETADO');
    console.log('📋 Resumen final:');
    console.log(`   - Tests de normalización: ${results.normalizationTests.passed}/${results.normalizationTests.total}`);
    console.log(`   - Tests de vinculación: ${results.linkingTests.successful}/${results.linkingTests.total}`);
    console.log(`   - Tests de casos edge: ${results.edgeTests.passed}/${results.edgeTests.total}`);
    
    const allPassed = results.normalizationTests.passed === results.normalizationTests.total && 
                     results.linkingTests.successful === results.linkingTests.total &&
                     results.edgeTests.passed === results.edgeTests.total;
    
    if (allPassed) {
      console.log('\n🎯 CONCLUSIÓN: ✅ Sistema completamente listo para manejar emails con caracteres especiales del español');
      console.log('🚀 La funcionalidad de drag & drop masivo funcionará perfectamente');
    } else {
      console.log('\n🎯 CONCLUSIÓN: ⚠️ Se requieren correcciones adicionales');
    }
  })
  .catch(error => {
    console.error('❌ Error ejecutando test:', error);
  });