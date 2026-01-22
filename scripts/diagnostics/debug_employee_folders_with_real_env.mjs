#!/usr/bin/env node

/**
 * DIAGNÓSTICO ESPECÍFICO: EmployeeFolders - Usando credenciales reales
 * Este script usa las mismas credenciales que la app React
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO ESPECÍFICO: EmployeeFolders - Credenciales Reales');
console.log('======================================================================');
console.log('📡 URL Supabase:', supabaseUrl);
console.log('🔑 Key (primeros 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NO ENCONTRADA');

// Crear cliente Supabase con las credenciales reales
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseEmployeeFoldersReal() {
  try {
    console.log('\n📋 1. Verificando conexión básica...');
    
    // Test básico de conexión
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      return;
    }
    
    console.log('✅ Conexión exitosa');
    console.log('📊 Total companies (count):', testData?.length || 'N/A');
    
    console.log('\n👥 2. Verificando empleados...');
    
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email, first_name, last_name, company_id')
      .limit(5);
    
    if (employeesError) {
      console.error('❌ Error consultando empleados:', employeesError);
    } else {
      console.log(`✅ Empleados encontrados: ${employees?.length || 0}`);
      if (employees && employees.length > 0) {
        console.log('📝 Muestra:', employees);
      }
    }
    
    console.log('\n📁 3. Verificando carpetas...');
    
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(5);
    
    if (foldersError) {
      console.error('❌ Error consultando carpetas:', foldersError);
      
      // Verificar si la tabla existe
      console.log('🔍 Verificando si la tabla employee_folders existe...');
      const { data: tableCheck, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'employee_folders' })
        .select();
      
      if (tableError) {
        console.log('⚠️ No se pudo verificar la tabla via RPC, intentando consulta directa...');
        
        // Intentar consulta sin select para ver si la tabla existe
        try {
          const { error: directError } = await supabase
            .from('employee_folders')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.error('❌ La tabla employee_folders NO EXISTE o no es accesible:', directError);
          }
        } catch (e) {
          console.error('❌ Error intentando acceso directo:', e);
        }
      }
    } else {
      console.log(`✅ Carpetas encontradas: ${folders?.length || 0}`);
      if (folders && folders.length > 0) {
        console.log('📝 Muestra de carpetas:', folders);
      }
    }
    
    console.log('\n🔍 4. Simulando lógica exacta del componente EmployeeFolders...');
    
    // Paso 1: Como loadEmployeesOnly()
    console.log('   📊 Paso 1: Simulating loadEmployeesOnly()...');
    
    const { data: employeesWithCompanies, error: employeesWithCompaniesError } = await supabase
      .from('employees')
      .select(`
        *,
        companies(
          id,
          name
        )
      `)
      .limit(10);
    
    if (employeesWithCompaniesError) {
      console.error('❌ Error en empleados con companies:', employeesWithCompaniesError);
    } else {
      console.log(`✅ Empleados con companies: ${employeesWithCompanies?.length || 0}`);
      if (employeesWithCompanies && employeesWithCompanies.length > 0) {
        console.log('📝 Primer empleado:', {
          id: employeesWithCompanies[0].id,
          email: employeesWithCompanies[0].email,
          name: `${employeesWithCompanies[0].first_name} ${employeesWithCompanies[0].last_name}`,
          company: employeesWithCompanies[0].companies?.name
        });
      }
    }
    
    // Paso 2: Como loadFoldersForCurrentPage()
    console.log('   📁 Paso 2: Simulating loadFoldersForCurrentPage()...');
    
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
      
      // Intentar consulta más simple
      console.log('   🔄 Intentando consulta más simple...');
      const { data: simpleFolders, error: simpleError } = await supabase
        .from('employee_folders')
        .select('employee_email, employee_name')
        .limit(5);
      
      if (simpleError) {
        console.error('❌ Error en consulta simple:', simpleError);
      } else {
        console.log(`✅ Carpetas simples: ${simpleFolders?.length || 0}`);
        if (simpleFolders) {
          console.log('📝 Carpetas simples:', simpleFolders);
        }
      }
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
    
    // Verificar autenticación
    console.log('\n🔐 5. Verificando autenticación...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Usuario no autenticado:', authError.message);
      console.log('💡 Esto puede explicar por qué no se ven las carpetas (RLS)');
    } else if (user) {
      console.log('✅ Usuario autenticado:', user.email);
      
      // Verificar políticas RLS específicas
      console.log('   🛡️ Verificando acceso a employee_folders...');
      
      const { data: accessibleFolders, error: accessError } = await supabase
        .from('employee_folders')
        .select('*')
        .limit(3);
      
      if (accessError) {
        console.error('❌ Error de acceso (posible problema RLS):', accessError);
      } else {
        console.log(`✅ Acceso a carpetas: ${accessibleFolders?.length || 0} registros`);
      }
    }
    
    // DIAGNÓSTICO FINAL
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('======================================================================');
    
    const issues = [];
    
    if (!supabaseUrl || !supabaseKey) {
      issues.push('❌ Variables de entorno REACT_APP_SUPABASE_* no configuradas');
    }
    
    if (employeesError) {
      issues.push('❌ No se pueden consultar empleados');
    }
    
    if (foldersError) {
      issues.push('❌ No se pueden consultar carpetas - POSIBLE CAUSA RAÍZ');
      issues.push('   💡 La tabla employee_folders puede no existir o tener problemas de RLS');
    }
    
    if (realFoldersError) {
      issues.push('❌ Error en consulta compleja de carpetas (con relaciones)');
    }
    
    if (!user) {
      issues.push('🔐 Usuario no autenticado - las políticas RLS pueden estar bloqueando el acceso');
    }
    
    if (issues.length === 0) {
      console.log('✅ No se encontraron problemas obvios');
      console.log('💡 El problema puede estar en:');
      console.log('   - Lógica específica del componente React');
      console.log('   - Errores JavaScript en la consola del navegador');
      console.log('   - Problemas de timing en useEffect');
    } else {
      console.log('🚨 PROBLEMAS ENCONTRADOS:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log('\n📋 ACCIONES RECOMENDADAS:');
    console.log('1. Verificar que la tabla employee_folders existe en Supabase');
    console.log('2. Revisar las políticas RLS para employee_folders');
    console.log('3. Verificar consola del navegador (F12) para errores JavaScript');
    console.log('4. Confirmar que el usuario está autenticado');
    console.log('5. Verificar que organizedDatabaseService.getEmployees() funciona');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar diagnóstico
diagnoseEmployeeFoldersReal();