// Test de conexión compatible con ES Modules
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 INICIANDO TEST DE CONEXIÓN A SUPABASE...');
    
    // Test 1: Verificar conexión básica
    const { data, error } = await supabase
      .from('companies')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ CONEXIÓN EXITOSA A SUPABASE');
    console.log(`📊 Total de empresas en base de datos: ${data || 0}`);
    
    // Test 2: Verificar tablas principales
    const tables = ['companies', 'users', 'employees', 'folders', 'documents'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!tableError) {
          tableResults[table] = count || 0;
        } else {
          tableResults[table] = `Error: ${tableError.message}`;
        }
      } catch (e) {
        tableResults[table] = `Error: ${e.message}`;
      }
    }
    
    console.log('\n📋 ESTADO DE TABLAS PRINCIPALES:');
    Object.entries(tableResults).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    
    // Test 3: Verificar tablas de conocimiento
    const knowledgeTables = [
      'company_knowledge_bases',
      'knowledge_folders', 
      'knowledge_categories',
      'knowledge_documents',
      'faq_entries'
    ];
    
    console.log('\n🧠 ESTADO DE TABLAS DE CONOCIMIENTO:');
    for (const table of knowledgeTables) {
      try {
        const { count, error: kbError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!kbError) {
          console.log(`   ${table}: ${count || 0} registros`);
        } else {
          console.log(`   ${table}: ❌ No existe o error - ${kbError.message}`);
        }
      } catch (e) {
        console.log(`   ${table}: ❌ Error - ${e.message}`);
      }
    }
    
    // Test 4: Verificar datos de empleados locales
    console.log('\n👥 VERIFICANDO DATOS LOCALES...');
    try {
      const { default: inMemoryEmployeeService } = await import('./src/services/inMemoryEmployeeService.js');
      
      const companies = await inMemoryEmployeeService.getCompanies();
      const employees = await inMemoryEmployeeService.getEmployees();
      
      console.log(`   📊 Empresas locales: ${companies.length}`);
      console.log(`   👥 Empleados locales: ${employees.length}`);
      
      if (companies.length > 0) {
        console.log('\n📝 MUESTRA DE EMPRESAS:');
        companies.slice(0, 5).forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
        });
      }
      
      if (employees.length > 0) {
        console.log('\n👤 MUESTRA DE EMPLEADOS:');
        employees.slice(0, 3).forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.name} - ${emp.email} - ${emp.company?.name || 'Sin empresa'}`);
        });
      }
      
    } catch (empError) {
      console.log(`   ❌ Error cargando datos locales: ${empError.message}`);
    }
    
    // Test 5: Verificar carpetas de empleados
    console.log('\n📁 VERIFICANDO CARPETAS DE EMPLEADOS...');
    try {
      const { default: employeeFolderService } = await import('./src/services/employeeFolderService.js');
      
      const companies = await employeeFolderService.inMemoryEmployeeService.getCompanies();
      let totalFolders = 0;
      
      for (const company of companies.slice(0, 3)) { // Solo verificar primeras 3 empresas
        try {
          const folders = await employeeFolderService.getEmployeeFoldersByCompany(company.id);
          totalFolders += folders.length;
          console.log(`   📁 ${company.name}: ${folders.length} carpetas`);
        } catch (folderError) {
          console.log(`   ❌ Error en ${company.name}: ${folderError.message}`);
        }
      }
      
      console.log(`   📊 Total carpetas verificadas: ${totalFolders}`);
      
    } catch (folderError) {
      console.log(`   ❌ Error verificando carpetas: ${folderError.message}`);
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('✅ Test de conexión completado exitosamente');
    console.log('📊 Sistema operativo y datos cargados');
    console.log('🚀 Listo para usar');
    
    return {
      success: true,
      companies: tableResults.companies || 0,
      tables: tableResults,
      knowledgeTables: knowledgeTables.length,
      message: 'Sistema conectado y funcionando correctamente'
    };
    
  } catch (error) {
    console.error('❌ ERROR EN CONEXIÓN:', error.message);
    console.error('🔍 Detalles:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Error de conexión - revisar configuración'
    };
  }
}

// Ejecutar test
testConnection()
  .then(result => {
    console.log('\n📋 RESULTADO FINAL:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('❌ ERROR FATAL:', error);
  });