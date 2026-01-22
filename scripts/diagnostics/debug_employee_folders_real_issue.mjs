#!/usr/bin/env node

/**
 * DIAGNÓSTICO PROFUNDO: Por qué EmployeeFolders no muestra las carpetas
 * Este script simula exactamente lo que hace el componente React
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔍 DIAGNÓSTICO PROFUNDO: EmployeeFolders - Por qué no muestra carpetas');
console.log('======================================================================');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseEmployeeFolders() {
  try {
    console.log('📋 1. Verificando estructura de datos...');
    
    // Verificar empleados
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email, first_name, last_name, company_id')
      .limit(10);
    
    if (employeesError) {
      console.error('❌ Error consultando empleados:', employeesError);
      return;
    }
    
    console.log(`✅ Empleados encontrados: ${employees?.length || 0}`);
    if (employees && employees.length > 0) {
      console.log('📝 Muestra de empleados:', employees.slice(0, 3));
    }
    
    // Verificar carpetas
    console.log('\n📁 2. Verificando carpetas...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(10);
    
    if (foldersError) {
      console.error('❌ Error consultando carpetas:', foldersError);
      return;
    }
    
    console.log(`✅ Carpetas encontradas: ${folders?.length || 0}`);
    if (folders && folders.length > 0) {
      console.log('📝 Muestra de carpetas:', folders.slice(0, 3));
    }
    
    // Verificar relación empleados-carpetas
    console.log('\n🔗 3. Verificando relación empleados-carpetas...');
    const { data: employeeFolders, error: relationError } = await supabase
      .from('employee_folders')
      .select(`
        *,
        employees!inner(
          id,
          email,
          first_name,
          last_name,
          company_id
        )
      `)
      .limit(10);
    
    if (relationError) {
      console.error('❌ Error en relación empleados-carpetas:', relationError);
      console.log('💡 Intentando consulta alternativa...');
      
      // Consulta alternativa sin join
      const { data: altFolders, error: altError } = await supabase
        .from('employee_folders')
        .select('employee_email, employee_name')
        .limit(10);
      
      if (!altError && altFolders) {
        console.log('📝 Carpetas con emails:', altFolders);
      }
    } else {
      console.log(`✅ Relaciones encontradas: ${employeeFolders?.length || 0}`);
      if (employeeFolders && employeeFolders.length > 0) {
        console.log('📝 Muestra de relaciones:', employeeFolders.slice(0, 3));
      }
    }
    
    // Simular lógica del componente EmployeeFolders
    console.log('\n🎭 4. Simulando lógica del componente EmployeeFolders...');
    
    // Paso 1: Cargar empleados (como lo hace loadEmployeesOnly)
    console.log('   📊 Paso 1: Cargando empleados...');
    
    // El componente usa organizedDatabaseService.getEmployees()
    // Vamos a simular esa llamada
    const { data: allEmployees, error: allEmployeesError } = await supabase
      .from('employees')
      .select(`
        *,
        companies(
          id,
          name
        )
      `)
      .limit(50);
    
    if (allEmployeesError) {
      console.error('❌ Error cargando empleados con companies:', allEmployeesError);
    } else {
      console.log(`✅ Empleados con companies: ${allEmployees?.length || 0}`);
      if (allEmployees && allEmployees.length > 0) {
        console.log('📝 Primer empleado:', {
          id: allEmployees[0].id,
          email: allEmployees[0].email,
          name: `${allEmployees[0].first_name} ${allEmployees[0].last_name}`,
          company: allEmployees[0].companies?.name
        });
      }
    }
    
    // Paso 2: Cargar carpetas (como lo hace loadFoldersForCurrentPage)
    console.log('   📁 Paso 2: Cargando carpetas reales...');
    
    const { data: realFolders, error: realFoldersError } = await supabase
      .from('employee_folders')
      .select(`
        *,
        employee_documents(id, document_name, document_type, description, status),
        employee_faqs(id, question, answer, category, status)
      `)
      .order('created_at', { ascending: false });
    
    if (realFoldersError) {
      console.error('❌ Error cargando carpetas reales:', realFoldersError);
    } else {
      console.log(`✅ Carpetas reales encontradas: ${realFolders?.length || 0}`);
      if (realFolders && realFolders.length > 0) {
        console.log('📝 Primera carpeta real:', {
          id: realFolders[0].id,
          email: realFolders[0].employee_email,
          name: realFolders[0].employee_name,
          documents: realFolders[0].employee_documents?.length || 0,
          faqs: realFolders[0].employee_faqs?.length || 0
        });
      }
    }
    
    // Paso 3: Aplicar filtros (como lo hace el componente)
    console.log('   🔍 Paso 3: Aplicando filtros...');
    
    let filteredFolders = realFolders || [];
    console.log(`   📊 Carpetas antes de filtros: ${filteredFolders.length}`);
    
    // Sin filtros aplicados (como debería ser inicialmente)
    console.log(`   ✅ Carpetas después de filtros: ${filteredFolders.length}`);
    
    // Verificar si hay algún problema de autenticación
    console.log('\n🔐 5. Verificando autenticación...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Usuario no autenticado:', authError.message);
    } else if (user) {
      console.log('✅ Usuario autenticado:', user.email);
      
      // Verificar políticas RLS
      console.log('   🛡️ Verificando acceso a datos...');
      
      // Intentar acceder a employee_folders como lo haría el componente
      const { data: accessibleFolders, error: accessError } = await supabase
        .from('employee_folders')
        .select('*')
        .limit(5);
      
      if (accessError) {
        console.error('❌ Error de acceso a carpetas (posible problema RLS):', accessError);
      } else {
        console.log(`✅ Acceso a carpetas: ${accessibleFolders?.length || 0} registros`);
      }
    }
    
    // DIAGNÓSTICO FINAL
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('======================================================================');
    
    const issues = [];
    
    if (!employees || employees.length === 0) {
      issues.push('❌ No hay empleados en la base de datos');
    }
    
    if (!folders || folders.length === 0) {
      issues.push('❌ No hay carpetas en la base de datos');
    }
    
    if (realFolders && realFolders.length > 0 && filteredFolders.length === 0) {
      issues.push('⚠️ Las carpetas existen pero los filtros las están ocultando');
    }
    
    if (!user) {
      issues.push('🔐 Usuario no autenticado - puede haber problemas de RLS');
    }
    
    if (issues.length === 0) {
      console.log('✅ No se encontraron problemas obvios en los datos');
      console.log('💡 El problema puede estar en:');
      console.log('   - Lógica del componente React');
      console.log('   - Errores JavaScript en la consola');
      console.log('   - Problemas de timing en useEffect');
      console.log('   - Variables de entorno incorrectas');
    } else {
      console.log('🚨 PROBLEMAS ENCONTRADOS:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log('\n📋 RECOMENDACIONES:');
    console.log('1. Verificar consola del navegador (F12) para errores JavaScript');
    console.log('2. Verificar que el usuario esté autenticado');
    console.log('3. Revisar las políticas RLS en Supabase');
    console.log('4. Verificar variables de entorno REACT_APP_SUPABASE_*');
    console.log('5. Comprobar que organizedDatabaseService.getEmployees() funciona');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar diagnóstico
diagnoseEmployeeFolders();