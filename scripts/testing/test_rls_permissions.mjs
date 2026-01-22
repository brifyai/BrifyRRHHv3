#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPermissions() {
  console.log('🔍 TESTING RLS PERMISSIONS PARA employee_folders');
  console.log('================================================');
  
  try {
    // 1. Test con usuario anónimo (como en el frontend)
    console.log('\n📊 1. Testing con usuario anónimo (como frontend)...');
    const { data: anonFolders, error: anonError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(3);
    
    if (anonError) {
      console.error('❌ Error con usuario anónimo:', anonError.message);
      console.log('   → Esto explica por qué no se ven las carpetas en el frontend');
    } else {
      console.log(`✅ Usuario anónimo puede ver ${anonFolders?.length || 0} carpetas`);
    }
    
    // 2. Verificar estructura de una carpeta específica
    if (anonFolders && anonFolders.length > 0) {
      console.log('\n📋 2. Estructura de carpeta de ejemplo:');
      const sampleFolder = anonFolders[0];
      console.log(JSON.stringify(sampleFolder, null, 2));
    }
    
    // 3. Test de consulta más específica
    console.log('\n📊 3. Testing consulta específica...');
    const { data: specificFolders, error: specificError } = await supabase
      .from('employee_folders')
      .select('id, employee_name, employee_email, company_name')
      .limit(3);
    
    if (specificError) {
      console.error('❌ Error en consulta específica:', specificError.message);
    } else {
      console.log(`✅ Consulta específica exitosa: ${specificFolders?.length || 0} resultados`);
    }
    
    // 4. Verificar si el problema está en el JOIN con employees
    console.log('\n📊 4. Testing JOIN con employees...');
    const { data: joinedData, error: joinError } = await supabase
      .from('employee_folders')
      .select(`
        *,
        employees!inner (
          email,
          first_name,
          last_name
        )
      `)
      .limit(3);
    
    if (joinError) {
      console.error('❌ Error en JOIN con employees:', joinError.message);
      console.log('   → Esto puede ser la causa del problema');
    } else {
      console.log(`✅ JOIN exitoso: ${joinedData?.length || 0} resultados`);
    }
    
    // 5. Test directo de employees
    console.log('\n📊 5. Testing tabla employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(3);
    
    if (employeesError) {
      console.error('❌ Error accediendo a employees:', employeesError.message);
    } else {
      console.log(`✅ Employees accesible: ${employees?.length || 0} resultados`);
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testRLSPermissions().then(() => {
  console.log('\n🏁 Test de RLS completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});