import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://supabase.staffhub.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function diagnoseEmployeeFolders() {
  console.log('🔍 DIAGNÓSTICO DE CARPETAS DE EMPLEADOS');
  console.log('=' .repeat(60));

  try {
    // 1. Contar empleados totales
    console.log('\n📊 CONTANDO EMPLEADOS...');
    const { count: totalEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    if (employeesError) throw employeesError;
    console.log(`✅ Total de empleados: ${totalEmployees}`);

    // 2. Contar carpetas existentes
    console.log('\n📁 CONTANDO CARPETAS...');
    const { count: totalFolders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*', { count: 'exact', head: true });

    if (foldersError) throw foldersError;
    console.log(`✅ Total de carpetas: ${totalFolders}`);

    // 3. Calcular diferencia
    const missingFolders = totalEmployees - totalFolders;
    console.log(`\n📈 ANÁLISIS:`);
    console.log(`   - Empleados: ${totalEmployees}`);
    console.log(`   - Carpetas: ${totalFolders}`);
    console.log(`   - Faltantes: ${missingFolders}`);

    if (missingFolders > 0) {
      console.log(`\n❌ PROBLEMA DETECTADO: Faltan ${missingFolders} carpetas`);
      
      // 4. Obtener muestra de empleados sin carpeta
      console.log('\n🔍 OBTENIENDO MUESTRA DE EMPLEADOS SIN CARPETA...');
      
      // Obtener empleados
      const { data: employees, error: employeesDataError } = await supabase
        .from('employees')
        .select('id, email, name')
        .limit(10);

      if (employeesDataError) throw employeesDataError;

      // Obtener carpetas
      const { data: folders, error: foldersDataError } = await supabase
        .from('employee_folders')
        .select('employee_email')
        .limit(1000);

      if (foldersDataError) throw foldersDataError;

      // Crear set de emails con carpeta
      const emailsWithFolder = new Set(folders.map(f => f.employee_email?.toLowerCase()));
      
      // Encontrar empleados sin carpeta
      const employeesWithoutFolder = employees.filter(emp => 
        !emailsWithFolder.has(emp.email?.toLowerCase())
      );

      console.log(`\n📋 MUESTRA DE EMPLEADOS SIN CARPETA (${employeesWithoutFolder.length} de 10):`);
      employeesWithoutFolder.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.name} (${emp.email})`);
      });

      return {
        totalEmployees,
        totalFolders,
        missingFolders,
        employeesWithoutFolder: employeesWithoutFolder.slice(0, 5)
      };
    } else {
      console.log('\n✅ No hay carpetas faltantes');
      return { totalEmployees, totalFolders, missingFolders: 0 };
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    throw error;
  }
}

// Ejecutar diagnóstico
diagnoseEmployeeFolders()
  .then(result => {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`   Empleados totales: ${result.totalEmployees}`);
    console.log(`   Carpetas existentes: ${result.totalFolders}`);
    console.log(`   Carpetas faltantes: ${result.missingFolders}`);
    
    if (result.missingFolders > 0) {
      console.log('\n🚀 ACCIÓN REQUERIDA: Crear carpetas faltantes masivamente');
    } else {
      console.log('\n✅ Estado: Todas las carpetas están creadas');
    }
  })
  .catch(console.error);