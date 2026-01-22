#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseEmployeeFolders() {
  console.log('🔍 DIAGNÓSTICO DE TABLA employee_folders');
  console.log('==========================================');
  
  try {
    // 1. Verificar si la tabla existe y tiene datos
    console.log('\n📊 1. Verificando tabla employee_folders...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(10);
    
    if (foldersError) {
      console.error('❌ Error accediendo a employee_folders:', foldersError.message);
      return;
    }
    
    console.log(`✅ Total de carpetas en employee_folders: ${folders?.length || 0}`);
    
    if (folders && folders.length > 0) {
      console.log('\n📋 Muestra de carpetas:');
      folders.slice(0, 5).forEach((folder, index) => {
        console.log(`  ${index + 1}. ${folder.employee_name} (${folder.employee_email}) - ${folder.company_name}`);
      });
    } else {
      console.log('⚠️ La tabla employee_folders está VACÍA');
    }
    
    // 2. Verificar tablas relacionadas
    console.log('\n📊 2. Verificando tablas relacionadas...');
    
    // employee_documents
    const { data: documents, error: documentsError } = await supabase
      .from('employee_documents')
      .select('*')
      .limit(5);
    
    if (documentsError) {
      console.error('❌ Error accediendo a employee_documents:', documentsError.message);
    } else {
      console.log(`✅ Total de documentos: ${documents?.length || 0}`);
    }
    
    // employee_faqs
    const { data: faqs, error: faqsError } = await supabase
      .from('employee_faqs')
      .select('*')
      .limit(5);
    
    if (faqsError) {
      console.error('❌ Error accediendo a employee_faqs:', faqsError.message);
    } else {
      console.log(`✅ Total de FAQs: ${faqs?.length || 0}`);
    }
    
    // 3. Verificar empleados para generar carpetas virtuales
    console.log('\n📊 3. Verificando empleados para carpetas virtuales...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);
    
    if (employeesError) {
      console.error('❌ Error accediendo a employees:', employeesError.message);
    } else {
      console.log(`✅ Total de empleados: ${employees?.length || 0}`);
      if (employees && employees.length > 0) {
        console.log('\n👥 Muestra de empleados:');
        employees.slice(0, 3).forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.first_name} ${emp.last_name} (${emp.email}) - ${emp.company_name}`);
        });
      }
    }
    
    // 4. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('====================');
    
    const hasFolders = folders && folders.length > 0;
    const hasEmployees = employees && employees.length > 0;
    
    if (hasFolders) {
      console.log('✅ Las carpetas reales están disponibles');
      console.log('   → El problema puede estar en el frontend o en la visualización');
    } else if (hasEmployees) {
      console.log('⚠️ No hay carpetas reales, pero hay empleados');
      console.log('   → El componente debería generar carpetas virtuales');
      console.log('   → El problema puede estar en la lógica de generación virtual');
    } else {
      console.log('❌ No hay carpetas ni empleados');
      console.log('   → Necesita datos en la base de datos');
    }
    
    // 5. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('==================');
    
    if (!hasFolders && hasEmployees) {
      console.log('1. Las carpetas virtuales deberían generarse automáticamente');
      console.log('2. Verificar que el componente EmployeeFolders esté funcionando');
      console.log('3. Revisar la consola del navegador para errores');
    } else if (!hasFolders && !hasEmployees) {
      console.log('1. Insertar datos de empleados en la tabla employees');
      console.log('2. O insertar datos de carpetas directamente en employee_folders');
    }
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseEmployeeFolders().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});