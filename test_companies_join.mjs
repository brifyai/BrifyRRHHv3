#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompaniesJoin() {
  console.log('🔍 TESTING COMPANIES JOIN EN ORGANIZED DATABASE SERVICE');
  console.log('=======================================================');
  
  try {
    // 1. Test del JOIN exacto que usa organizedDatabaseService
    console.log('\n📊 1. Testing JOIN con companies (como organizedDatabaseService)...');
    const { data: employeesWithCompanies, error: joinError } = await supabase
      .from('employees')
      .select(`
        *,
        companies (
          id,
          name,
          industry
        )
      `)
      .limit(5);
    
    if (joinError) {
      console.error('❌ Error en JOIN con companies:', joinError.message);
      console.log('   → Este es el problema que impide cargar empleados');
      console.log('   → Sin empleados, las carpetas no se pueden mostrar');
      return;
    } else {
      console.log(`✅ JOIN exitoso: ${employeesWithCompanies?.length || 0} empleados con company data`);
    }
    
    // 2. Verificar estructura de datos
    if (employeesWithCompanies && employeesWithCompanies.length > 0) {
      console.log('\n📋 2. Estructura de empleado con company:');
      const sampleEmployee = employeesWithCompanies[0];
      console.log(JSON.stringify({
        id: sampleEmployee.id,
        email: sampleEmployee.email,
        first_name: sampleEmployee.first_name,
        last_name: sampleEmployee.last_name,
        company: sampleEmployee.companies ? {
          id: sampleEmployee.companies.id,
          name: sampleEmployee.companies.name,
          industry: sampleEmployee.companies.industry
        } : 'NO COMPANY DATA'
      }, null, 2));
    }
    
    // 3. Test sin JOIN (como fallback)
    console.log('\n📊 3. Testing consulta sin JOIN (fallback)...');
    const { data: employeesOnly, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);
    
    if (employeesError) {
      console.error('❌ Error cargando empleados sin JOIN:', employeesError.message);
    } else {
      console.log(`✅ Empleados sin JOIN: ${employeesOnly?.length || 0}`);
    }
    
    // 4. Verificar foreign key relationships
    console.log('\n🔗 4. Verificando foreign key relationships...');
    
    // Verificar si employees tiene company_id
    const { data: employeeStructure, error: structureError } = await supabase
      .from('employees')
      .select('company_id')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Error verificando estructura de employees:', structureError.message);
    } else {
      console.log('✅ employees.company_id existe y es accesible');
    }
    
    // Verificar si companies existe
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(3);
    
    if (companiesError) {
      console.error('❌ Error accediendo a companies:', companiesError.message);
    } else {
      console.log(`✅ companies accesible: ${companies?.length || 0} companies`);
    }
    
    // 5. Test manual del JOIN
    console.log('\n🔄 5. Testing JOIN manual...');
    
    if (employeesOnly && employeesOnly.length > 0 && companies && companies.length > 0) {
      const sampleEmployee = employeesOnly[0];
      const matchingCompany = companies.find(c => c.id === sampleEmployee.company_id);
      
      console.log(`📋 Empleado: ${sampleEmployee.first_name} ${sampleEmployee.last_name}`);
      console.log(`📋 Company ID en employee: ${sampleEmployee.company_id}`);
      console.log(`📋 Company encontrado: ${matchingCompany ? matchingCompany.name : 'NO ENCONTRADO'}`);
      
      if (!matchingCompany) {
        console.log('\n❌ PROBLEMA IDENTIFICADO:');
        console.log('   El company_id en employees no coincide con ningún company en companies');
        console.log('   Esto rompe el JOIN automático de Supabase');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testCompaniesJoin().then(() => {
  console.log('\n🏁 Test de JOIN con companies completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});