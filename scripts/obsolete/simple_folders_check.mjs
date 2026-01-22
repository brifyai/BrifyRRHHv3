#!/usr/bin/env node

/**
 * DIAGNÓSTICO SIMPLE: Verificar estado de carpetas de empleados
 */

import { createClient } from '@supabase/supabase-js';

// Configuración directa
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseKey = 'sb_publishable_VA7jn9YjiV0YiiLS3cPSvw_ESWO_SP0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DIAGNÓSTICO: Carpetas de Empleados');
console.log('=' .repeat(70));

async function checkEmployeeFolders() {
  try {
    console.log('\n📊 1. Verificando tablas...');

    // Verificar employee_folders
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(5);

    if (foldersError) {
      console.log('❌ Error en employee_folders:', foldersError.message);
    } else {
      console.log('✅ employee_folders accesible');
      console.log(`📁 Carpetas encontradas: ${folders?.length || 0}`);
      if (folders && folders.length > 0) {
        folders.forEach((folder, i) => {
          console.log(`   ${i+1}. ${folder.name} (empleado: ${folder.employee_id})`);
        });
      }
    }

    // Verificar employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);

    if (employeesError) {
      console.log('❌ Error en employees:', employeesError.message);
    } else {
      console.log('✅ employees accesible');
      console.log(`👥 Empleados encontrados: ${employees?.length || 0}`);
      if (employees && employees.length > 0) {
        employees.forEach((emp, i) => {
          console.log(`   ${i+1}. ${emp.first_name} ${emp.last_name} (${emp.email})`);
        });
      }
    }

    console.log('\n🔢 2. Contando totales...');

    // Contar carpetas
    const { count: foldersCount } = await supabase
      .from('employee_folders')
      .select('*', { count: 'exact', head: true });

    console.log(`📁 Total carpetas: ${foldersCount || 0}`);

    // Contar empleados
    const { count: employeesCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    console.log(`👥 Total empleados: ${employeesCount || 0}`);

    console.log('\n🎯 3. DIAGNÓSTICO:');

    if (!foldersCount || foldersCount === 0) {
      console.log('🔴 PROBLEMA: No hay carpetas en la base de datos');
      console.log('   ➤ Las carpetas deben crearse para cada empleado');
      console.log('   ➤ Ejecutar script de creación de carpetas');
    } else {
      console.log('🟢 Hay carpetas en la base de datos');
    }

    if (!employeesCount || employeesCount === 0) {
      console.log('🔴 PROBLEMA: No hay empleados en la base de datos');
    } else {
      console.log('🟢 Hay empleados en la base de datos');
    }

    if (foldersCount > 0 && employeesCount > 0) {
      console.log('🟡 DATOS EXISTEN: El problema podría ser:');
      console.log('   ➤ Políticas RLS muy restrictivas');
      console.log('   ➤ Error en el componente React');
      console.log('   ➤ Usuario no autenticado');
      console.log('   ➤ Error en el hook useEmployeeFolders');
    }

    console.log('\n📋 RECOMENDACIONES:');
    console.log('1. Verificar consola del navegador (F12)');
    console.log('2. Verificar que el usuario está logueado');
    console.log('3. Revisar rutas en App.js');
    console.log('4. Verificar políticas RLS en Supabase');

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEmployeeFolders();