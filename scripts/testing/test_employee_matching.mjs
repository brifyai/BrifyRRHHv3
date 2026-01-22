#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmployeeFoldersMatching() {
  console.log('🔍 TESTING EMPLOYEE-FOLDERS MATCHING LOGIC');
  console.log('==========================================');
  
  try {
    // 1. Cargar carpetas como lo hace el componente
    console.log('\n📁 1. Cargando carpetas (como EmployeeFolders component)...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (foldersError) {
      console.error('❌ Error cargando carpetas:', foldersError.message);
      return;
    }
    
    console.log(`✅ Carpetas cargadas: ${folders?.length || 0}`);
    
    // 2. Cargar empleados como lo hace el componente
    console.log('\n👥 2. Cargando empleados (como organizedDatabaseService.getEmployees())...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*');
    
    if (employeesError) {
      console.error('❌ Error cargando empleados:', employeesError.message);
      return;
    }
    
    console.log(`✅ Empleados cargados: ${employees?.length || 0}`);
    
    // 3. Simular la lógica del componente
    console.log('\n🔄 3. Simulando lógica de matching del componente...');
    
    if (folders && folders.length > 0 && employees && employees.length > 0) {
      console.log('\n📊 Probando matches por email:');
      
      let successfulMatches = 0;
      let failedMatches = 0;
      
      folders.slice(0, 5).forEach((folder, index) => {
        const employee = employees.find(emp => emp.email === folder.employee_email);
        
        if (employee) {
          successfulMatches++;
          console.log(`  ✅ ${index + 1}. ${folder.employee_name} → ${employee.first_name} ${employee.last_name}`);
        } else {
          failedMatches++;
          console.log(`  ❌ ${index + 1}. ${folder.employee_name} (${folder.employee_email}) → NO ENCONTRADO`);
        }
      });
      
      console.log(`\n📈 RESUMEN DE MATCHES:`);
      console.log(`   ✅ Exitosos: ${successfulMatches}`);
      console.log(`   ❌ Fallidos: ${failedMatches}`);
      console.log(`   📊 Tasa de éxito: ${((successfulMatches / (successfulMatches + failedMatches)) * 100).toFixed(1)}%`);
      
      if (failedMatches > 0) {
        console.log('\n🔍 ANÁLISIS DE FALLOS:');
        console.log('=====================');
        
        // Verificar emails únicos en carpetas vs empleados
        const folderEmails = [...new Set(folders.map(f => f.employee_email))];
        const employeeEmails = [...new Set(employees.map(e => e.email))];
        
        console.log(`📧 Emails únicos en carpetas: ${folderEmails.length}`);
        console.log(`📧 Emails únicos en empleados: ${employeeEmails.length}`);
        
        const commonEmails = folderEmails.filter(email => employeeEmails.includes(email));
        console.log(`📧 Emails en común: ${commonEmails.length}`);
        
        if (commonEmails.length === 0) {
          console.log('\n❌ PROBLEMA IDENTIFICADO:');
          console.log('   No hay emails en común entre carpetas y empleados');
          console.log('   Esto explica por qué no se muestran las carpetas');
          
          console.log('\n📋 Emails en carpetas (primeros 3):');
          folderEmails.slice(0, 3).forEach(email => console.log(`   - ${email}`));
          
          console.log('\n📋 Emails en empleados (primeros 3):');
          employeeEmails.slice(0, 3).forEach(email => console.log(`   - ${email}`));
        }
      }
      
    } else {
      console.log('\n❌ No hay datos suficientes para hacer el matching');
    }
    
    // 4. Test de la consulta que usa el componente
    console.log('\n🔍 4. Testing consulta específica que usa el componente...');
    const { data: specificEmployees, error: specificError } = await supabase
      .from('employees')
      .select('email, first_name, last_name, company_name')
      .limit(5);
    
    if (specificError) {
      console.error('❌ Error en consulta específica:', specificError.message);
    } else {
      console.log('✅ Consulta específica exitosa:');
      specificEmployees?.forEach(emp => {
        console.log(`   - ${emp.email} (${emp.first_name} ${emp.last_name}) - ${emp.company_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testEmployeeFoldersMatching().then(() => {
  console.log('\n🏁 Test de matching completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});