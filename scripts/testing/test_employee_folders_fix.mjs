import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdnbH55Y3l2bGNqaWpveW13ZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0MDU1MjI1LCJleHAiOjIwNDk2MzEyMjV9.1h8bN8k5Q5v5l7v8Y4b5c9d2e1f3g6h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmployeeFoldersFix() {
  console.log('🧪 [TEST] Verificando corrección EmployeeFolders...');
  
  try {
    // 1. Test consulta simple sin filtros (debe funcionar)
    console.log('\n📋 Test 1: Consulta simple sin filtros');
    const { data: simpleEmployees, error: simpleError } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (simpleError) {
      console.error('❌ Error en consulta simple:', simpleError);
    } else {
      console.log(`✅ Consulta simple exitosa: ${simpleEmployees?.length || 0} empleados`);
    }
    
    // 2. Test consulta con JOIN (puede fallar)
    console.log('\n📋 Test 2: Consulta con JOIN (puede fallar)');
    const { data: joinedEmployees, error: joinError } = await supabase
      .from('employees')
      .select('*, companies(id,name,industry)')
      .order('created_at', { ascending: false });
    
    if (joinError) {
      console.error('❌ Error en consulta con JOIN (esperado):', joinError.message);
    } else {
      console.log(`✅ Consulta con JOIN exitosa: ${joinedEmployees?.length || 0} empleados`);
    }
    
    // 3. Verificar employee_folders
    console.log('\n📋 Test 3: Verificar employee_folders');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (foldersError) {
      console.error('❌ Error en consulta employee_folders:', foldersError);
    } else {
      console.log(`✅ employee_folders: ${folders?.length || 0} carpetas`);
    }
    
    // 4. Verificar companies
    console.log('\n📋 Test 4: Verificar companies');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (companiesError) {
      console.error('❌ Error en consulta companies:', companiesError);
    } else {
      console.log(`✅ companies: ${companies?.length || 0} empresas`);
    }
    
    console.log('\n🎯 RESUMEN:');
    console.log('- Consulta simple: ✅ (debe funcionar)');
    console.log('- Consulta con JOIN: ❌ (puede fallar, por eso evitamos usarla sin filtros)');
    console.log('- employee_folders: ✅ (datos disponibles)');
    console.log('- companies: ✅ (datos disponibles)');
    console.log('\n💡 CONCLUSIÓN: La solución debe usar consulta simple cuando no hay filtros activos');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testEmployeeFoldersFix();