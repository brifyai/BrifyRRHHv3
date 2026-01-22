import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔍 DEBUG: Problema de conteo de empleados');
console.log('==========================================\n');

async function debugEmployeeCount() {
  try {
    // 1. Verificar empresas con empleados
    console.log('1. 📊 EMPRESAS Y SUS EMPLEADOS EN BD:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (companiesError) throw companiesError;
    
    for (const company of companies) {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', company.id);
      
      if (employeesError) {
        console.log(`   ❌ Error en ${company.name}:`, employeesError.message);
      } else {
        console.log(`   ✅ ${company.name}: ${employees.length} empleados (ID: ${company.id})`);
        if (employees.length > 0) {
          console.log(`      Ejemplo: ${employees[0].first_name} ${employees[0].last_name}`);
        }
      }
    }
    
    // 2. Probar el método exacto que usa trendsAnalysisService
    console.log('\n2. 🔍 PROBANDO MÉTODO getEmployeeData:');
    
    // Probar con Falabella (que sabemos que tiene empleados)
    const falabellaId = 'e2bb6325-b623-44f8-87a6-dc65f5347bd8';
    console.log(`   Probando con Falabella ID: ${falabellaId} (tipo: ${typeof falabellaId})`);
    
    const { data: employeesFalabella, error: errorFalabella } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', falabellaId);
    
    if (errorFalabella) {
      console.log(`   ❌ Error obteniendo empleados de Falabella:`, errorFalabella);
    } else {
      console.log(`   ✅ Empleados encontrados: ${employeesFalabella?.length || 0}`);
      console.log(`   📋 Datos del primer empleado:`, employeesFalabella?.[0]);
    }
    
    // 3. Verificar tipos de datos en la tabla employees
    console.log('\n3. 🔍 VERIFICANDO TIPOS DE DATOS EN employees:');
    const { data: sampleEmployees, error: sampleError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, company_id')
      .limit(3);
    
    if (sampleError) {
      console.log(`   ❌ Error:`, sampleError);
    } else {
      sampleEmployees.forEach((emp, index) => {
        console.log(`   Empleado ${index + 1}:`);
        console.log(`      - ID: ${emp.id} (tipo: ${typeof emp.id})`);
        console.log(`      - Nombre: ${emp.first_name} ${emp.last_name}`);
        console.log(`      - Company ID: ${emp.company_id} (tipo: ${typeof emp.company_id})`);
      });
    }
    
    // 4. Probar con diferentes formatos de ID
    console.log('\n4. 🔍 PROBANDO DIFERENTES FORMATOS DE ID:');
    
    // Formato string exacto
    const { data: test1, error: err1 } = await supabase
      .from('employees')
      .select('id')
      .eq('company_id', 'e2bb6325-b623-44f8-87a6-dc65f5347bd8');
    console.log(`   String exacto: ${test1?.length || 0} resultados`);
    
    // Verificar si hay problema de case sensitivity
    const { data: test2, error: err2 } = await supabase
      .from('employees')
      .select('id')
      .ilike('company_id', 'e2bb6325-b623-44f8-87a6-dc65f5347bd8');
    console.log(`   ILIKE: ${test2?.length || 0} resultados`);
    
    // 5. Verificar si el problema está en el método generateCompanyInsights
    console.log('\n5. 🔍 PROBANDO trendsAnalysisService.generateCompanyInsights:');
    
    // Simular la llamada exacta que hace el dashboard
    const companyId = 'e2bb6325-b623-44f8-87a6-dc65f5347bd8';
    console.log(`   Llamando con companyId: ${companyId}, isId=true`);
    
    // Obtener datos de la empresa
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();
    
    if (companyError || !companyData) {
      console.log(`   ❌ Error obteniendo empresa:`, companyError || 'No encontrada');
    } else {
      console.log(`   ✅ Empresa encontrada: ${companyData.name}`);
      
      // Obtener métricas de comunicación
      const { data: commLogs, error: commError } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', companyId);
      
      console.log(`   📨 Mensajes encontrados: ${commLogs?.length || 0}`);
      
      // Obtener empleados (ESTA ES LA LLAMADA CRÍTICA)
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId);
      
      console.log(`   👥 Empleados encontrados: ${employeesData?.length || 0}`);
      
      if (empError) {
        console.log(`   ❌ Error en getEmployeeData:`, empError);
      } else {
        console.log(`   ✅ Éxito! EmployeeData:`, {
          totalEmployees: employeesData?.length || 0,
          primerEmpleado: employeesData?.[0]
        });
      }
    }
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

debugEmployeeCount();