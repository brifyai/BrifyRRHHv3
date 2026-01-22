import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://supabase.staffhub.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function debugEmployeeFoldersFilters() {
  console.log('🔍 DIAGNÓSTICO DE FILTROS EN CARPETAS DE EMPLEADOS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar distribución por empresa
    console.log('\n🏢 DISTRIBUCIÓN POR EMPRESA:');
    const { data: companyData } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (companyData) {
      console.log(`✅ Total de empresas: ${companyData.length}`);
      companyData.forEach(company => {
        console.log(`   - ${company.name} (${company.id})`);
      });
    }

    // 2. Verificar distribución de carpetas por empresa
    console.log('\n📁 DISTRIBUCIÓN DE CARPETAS POR EMPRESA:');
    const { data: foldersByCompany } = await supabase
      .from('employee_folders')
      .select('company_id, company_name')
      .order('company_name');

    if (foldersByCompany) {
      const companyCounts = foldersByCompany.reduce((acc, folder) => {
        const companyName = folder.company_name || 'Sin empresa';
        acc[companyName] = (acc[companyName] || 0) + 1;
        return acc;
      }, {});

      Object.entries(companyCounts).forEach(([company, count]) => {
        console.log(`   - ${company}: ${count} carpetas`);
      });
    }

    // 3. Verificar si hay filtros por defecto activos
    console.log('\n🔍 PROBANDO DIFERENTES CONSULTAS:');

    // Consulta sin filtros
    console.log('\n   📋 Consulta SIN filtros:');
    const { data: allFolders, error: allError } = await supabase
      .from('employee_folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) throw allError;
    console.log(`   ✅ Total sin filtros: ${allFolders?.length || 0}`);

    // Consulta con filtro de empresa específica (primera empresa)
    if (companyData && companyData.length > 0) {
      const firstCompany = companyData[0];
      console.log(`\n   📋 Consulta CON filtro de empresa "${firstCompany.name}":`);
      const { data: filteredByCompany, error: companyError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('company_id', firstCompany.id)
        .order('created_at', { ascending: false });

      if (companyError) throw companyError;
      console.log(`   ✅ Total con filtro de empresa: ${filteredByCompany?.length || 0}`);
    }

    // 4. Verificar si hay algún filtro de estado activo
    console.log('\n   📋 Verificando estados:');
    const { data: statusData } = await supabase
      .from('employee_folders')
      .select('folder_status')
      .order('created_at', { ascending: false });

    if (statusData) {
      const statusCounts = statusData.reduce((acc, item) => {
        acc[item.folder_status] = (acc[item.folder_status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} carpetas`);
      });
    }

    // 5. Verificar si hay algún problema con RLS
    console.log('\n🔒 VERIFICANDO RLS (Row Level Security):');
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .from('employee_folders')
        .select('id, employee_email')
        .limit(5);

      if (rlsError) {
        console.log(`   ❌ Error RLS: ${rlsError.message}`);
      } else {
        console.log(`   ✅ RLS permite lectura: ${rlsTest?.length || 0} registros`);
      }
    } catch (error) {
      console.log(`   ❌ Error verificando RLS: ${error.message}`);
    }

    // 6. Mostrar muestra de datos
    console.log('\n📊 MUESTRA DE DATOS (primeras 3 carpetas):');
    if (allFolders && allFolders.length > 0) {
      allFolders.slice(0, 3).forEach((folder, index) => {
        console.log(`   ${index + 1}. ${folder.employee_name} (${folder.employee_email})`);
        console.log(`      Empresa: ${folder.company_name || 'Sin empresa'}`);
        console.log(`      Estado: ${folder.folder_status}`);
        console.log(`      Actualizado: ${folder.updated_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    throw error;
  }
}

// Ejecutar diagnóstico
debugEmployeeFoldersFilters()
  .then(() => {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 DIAGNÓSTICO COMPLETADO');
    console.log('=' .repeat(60));
  })
  .catch(console.error);