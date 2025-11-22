/**
 * TEST DE NORMALIZACIÓN DE EMAILS CON CARACTERES ESPECIALES DEL ESPAÑOL
 * Verifica que la vinculación empleado-carpeta funcione correctamente
 * con emails que contienen ñ, tildes y acentos
 */

import unifiedEmployeeFolderService from './src/services/unifiedEmployeeFolderService.js';

async function testEmailNormalization() {
  console.log('🧪 Iniciando test de normalización de emails...\n');

  // Inicializar servicio
  await unifiedEmployeeFolderService.initialize();
  
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
    }
  ];

  console.log('📧 Testeando función normalizeEmail:');
  console.log('=' .repeat(50));

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    const result = unifiedEmployeeFolderService.normalizeEmail(testCase.email);
    const passed = result === testCase.expected;
    
    console.log(`\n${passed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`   Original: ${testCase.email}`);
    console.log(`   Normalizado: ${result}`);
    console.log(`   Esperado: ${testCase.expected}`);
    console.log(`   Estado: ${passed ? 'PASÓ' : 'FALLÓ'}`);
    
    if (passed) {
      passedTests++;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`📊 RESULTADOS: ${passedTests}/${totalTests} tests pasaron`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todos los tests de normalización pasaron!');
  } else {
    console.log('⚠️ Algunos tests fallaron');
  }

  // Test de vinculación simulada
  console.log('\n🔗 Testeando vinculación empleado-carpeta:');
  console.log('=' .repeat(50));

  // Simular empleados con emails problemáticos
  const mockEmployees = [
    { email: 'joañ.garcía@empresa.com', name: 'Joaquín García', department: 'IT' },
    { email: 'maría.lópez@empresa.com', name: 'María López', department: 'RRHH' },
    { email: 'ángel.martínez@empresa.com', name: 'Ángel Martínez', department: 'Ventas' }
  ];

  // Simular carpetas con emails problemáticos
  const mockFolders = [
    { employee_email: 'joan.garcia@empresa.com', folder_name: 'Carpeta Joaquín' },
    { employee_email: 'maria.lopez@empresa.com', folder_name: 'Carpeta María' },
    { employee_email: 'angel.martinez@empresa.com', folder_name: 'Carpeta Ángel' }
  ];

  // Crear mapa de empleados normalizado
  const employeesMap = new Map();
  mockEmployees.forEach(emp => {
    if (emp.email) {
      employeesMap.set(unifiedEmployeeFolderService.normalizeEmail(emp.email), emp);
    }
  });

  // Verificar vinculación
  let successfulLinks = 0;
  mockFolders.forEach(folder => {
    const normalizedEmail = unifiedEmployeeFolderService.normalizeEmail(folder.employee_email);
    const employee = employeesMap.get(normalizedEmail);
    
    if (employee) {
      console.log(`✅ Vinculación exitosa: ${folder.folder_name} → ${employee.name}`);
      successfulLinks++;
    } else {
      console.log(`❌ Vinculación fallida: ${folder.folder_name} (${normalizedEmail})`);
    }
  });

  console.log('\n' + '=' .repeat(50));
  console.log(`🔗 RESULTADOS DE VINCULACIÓN: ${successfulLinks}/${mockFolders.length} enlaces exitosos`);

  if (successfulLinks === mockFolders.length) {
    console.log('🎉 ¡Todas las vinculaciones funcionaron correctamente!');
    console.log('✅ La funcionalidad de drag & drop masivo funcionará con emails problemáticos');
  } else {
    console.log('⚠️ Algunas vinculaciones fallaron');
  }

  return {
    normalizationTests: { passed: passedTests, total: totalTests },
    linkingTests: { successful: successfulLinks, total: mockFolders.length }
  };
}

// Ejecutar test
testEmailNormalization()
  .then(results => {
    console.log('\n🏁 TEST COMPLETADO');
    console.log('📋 Resumen final:');
    console.log(`   - Tests de normalización: ${results.normalizationTests.passed}/${results.normalizationTests.total}`);
    console.log(`   - Tests de vinculación: ${results.linkingTests.successful}/${results.linkingTests.total}`);
    
    if (results.normalizationTests.passed === results.normalizationTests.total && 
        results.linkingTests.successful === results.linkingTests.total) {
      console.log('\n🎯 CONCLUSIÓN: ✅ Sistema listo para manejar emails con caracteres especiales del español');
    } else {
      console.log('\n🎯 CONCLUSIÓN: ⚠️ Se requieren correcciones adicionales');
    }
  })
  .catch(error => {
    console.error('❌ Error ejecutando test:', error);
  });