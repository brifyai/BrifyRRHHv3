#!/usr/bin/env node

/**
 * SCRIPT DE DIAGNÓSTICO: Verificar Estado de Carpetas de Empleados en Supabase
 * 
 * Este script verifica:
 * 1. Cuántos empleados existen en la tabla employees
 * 2. Cuántas carpetas existen en la tabla employee_folders  
 * 3. Si hay correspondencia entre empleados y carpetas
 * 4. Estado de las relaciones y datos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.log('Necesitas configurar REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstadoCarpetas() {
  console.log('🔍 DIAGNÓSTICO DE CARPETAS DE EMPLEADOS EN SUPABASE');
  console.log('=' .repeat(60));
  
  try {
    // 1. VERIFICAR ESTRUCTURA DE TABLA EMPLOYEES
    console.log('\n📊 1. VERIFICANDO TABLA EMPLOYEES...');
    
    // Primero verificar qué columnas existen
    const { data: employeesSample, error: sampleError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accediendo a tabla employees:', sampleError);
      console.log('🔍 Verificando si la tabla existe...');
      
      // Intentar listar tablas
      const { data: tables, error: tablesError } = await supabase
        .rpc('list_tables'); // Esto podría no funcionar en todos los casos
      
      if (tablesError) {
        console.log('⚠️ No se pueden listar las tablas. Intentando consulta genérica...');
      } else {
        console.log('📋 Tablas disponibles:', tables);
      }
      return;
    }

    console.log('✅ Tabla employees accesible');
    console.log('📋 Columnas disponibles en employees:', employeesSample ? Object.keys(employeesSample[0] || {}) : 'No se pudieron obtener');
    
    // Ahora hacer consulta con columnas que probablemente existen
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email, name, company_id, created_at')
      .order('created_at', { ascending: false });

    if (employeesError) {
      console.warn('⚠️ Error con columnas específicas, intentando consulta genérica...');
      
      // Intentar con solo las columnas básicas
      const { data: employeesBasic, error: basicError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (basicError) {
        console.error('❌ Error consultando employees:', basicError);
        return;
      }
      
      console.log(`✅ Total de empleados encontrados: ${employeesBasic?.length || 0}`);
      
      if (employeesBasic && employeesBasic.length > 0) {
        console.log('📋 Muestra de empleados (primeros 5):');
        employeesBasic.slice(0, 5).forEach((emp, index) => {
          const name = emp.name || emp.employee_name || emp.full_name || 'Sin nombre';
          const email = emp.email || 'Sin email';
          const company = emp.company_id || emp.company_name || 'Sin empresa';
          console.log(`   ${index + 1}. ${name} (${email}) - Empresa: ${company}`);
        });
        
        // Estadísticas por empresa
        const employeesPorEmpresa = employeesBasic.reduce((acc, emp) => {
          const companyKey = emp.company_id || emp.company_name || 'Sin empresa';
          acc[companyKey] = (acc[companyKey] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📈 Empleados por empresa:');
        Object.entries(employeesPorEmpresa).forEach(([empresa, cantidad]) => {
          console.log(`   ${empresa}: ${cantidad} empleados`);
        });
      }
    } else {
      console.log(`✅ Total de empleados encontrados: ${employees?.length || 0}`);
      
      if (employees && employees.length > 0) {
        console.log('📋 Muestra de empleados (primeros 5):');
        employees.slice(0, 5).forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.name} (${emp.email}) - Empresa: ${emp.company_id}`);
        });
        
        // Estadísticas por empresa
        const employeesPorEmpresa = employees.reduce((acc, emp) => {
          acc[emp.company_id] = (acc[emp.company_id] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📈 Empleados por empresa:');
        Object.entries(employeesPorEmpresa).forEach(([empresa, cantidad]) => {
          console.log(`   Empresa ${empresa}: ${cantidad} empleados`);
        });
      }
    }

    // 2. VERIFICAR CARPETAS DE EMPLEADOS
    console.log('\n📁 2. VERIFICANDO TABLA EMPLOYEE_FOLDERS...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('id, employee_email, employee_name, company_name, created_at, drive_folder_id, drive_folder_url')
      .order('created_at', { ascending: false });

    if (foldersError) {
      console.error('❌ Error consultando employee_folders:', foldersError);
      return;
    }

    console.log(`✅ Total de carpetas encontradas: ${folders?.length || 0}`);
    
    if (folders && folders.length > 0) {
      console.log('📋 Muestra de carpetas (primeras 5):');
      folders.slice(0, 5).forEach((folder, index) => {
        console.log(`   ${index + 1}. ${folder.employee_name} (${folder.employee_email})`);
        console.log(`      Empresa: ${folder.company_name}`);
        console.log(`      Drive ID: ${folder.drive_folder_id || 'No configurado'}`);
        console.log(`      URL: ${folder.drive_folder_url || 'No configurada'}`);
      });
      
      // Estadísticas por empresa
      const foldersPorEmpresa = folders.reduce((acc, folder) => {
        acc[folder.company_name] = (acc[folder.company_name] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Carpetas por empresa:');
      Object.entries(foldersPorEmpresa).forEach(([empresa, cantidad]) => {
        console.log(`   ${empresa}: ${cantidad} carpetas`);
      });
      
      // Carpetas con Drive configurado
      const carpetasConDrive = folders.filter(f => f.drive_folder_id).length;
      console.log(`\n🔗 Carpetas con Google Drive configurado: ${carpetasConDrive}/${folders.length}`);
    }

    // 3. ANÁLISIS DE CORRESPONDENCIA
    console.log('\n🔍 3. ANÁLISIS DE CORRESPONDENCIA EMPLEADOS-CARPETAS...');
    
    if (employees && folders) {
      const emailsEmpleados = new Set(employees.map(emp => emp.email));
      const emailsCarpetas = new Set(folders.map(folder => folder.employee_email));
      
      // Empleados SIN carpeta
      const empleadosSinCarpeta = employees.filter(emp => !emailsCarpetas.has(emp.email));
      console.log(`❌ Empleados SIN carpeta: ${empleadosSinCarpeta.length}`);
      
      if (empleadosSinCarpeta.length > 0 && empleadosSinCarpeta.length <= 10) {
        console.log('📋 Empleados sin carpeta:');
        empleadosSinCarpeta.slice(0, 5).forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.employee_name} (${emp.email})`);
        });
      }
      
      // Carpetas SIN empleado correspondiente
      const carpetasSinEmpleado = folders.filter(folder => !emailsEmpleados.has(folder.employee_email));
      console.log(`⚠️ Carpetas SIN empleado correspondiente: ${carpetasSinEmpleado.length}`);
      
      if (carpetasSinEmpleado.length > 0 && carpetasSinEmpleado.length <= 10) {
        console.log('📋 Carpetas sin empleado:');
        carpetasSinEmpleado.slice(0, 5).forEach((folder, index) => {
          console.log(`   ${index + 1}. ${folder.employee_email}`);
        });
      }
      
      // CORRESPONDENCIA PERFECTA
      const correspondenciaPerfecta = employees.filter(emp => emailsCarpetas.has(emp.email)).length;
      console.log(`✅ Empleados CON carpeta correspondiente: ${correspondenciaPerfecta}`);
      
      // RESUMEN FINAL
      console.log('\n📊 RESUMEN FINAL:');
      console.log(`   👥 Total empleados: ${employees.length}`);
      console.log(`   📁 Total carpetas: ${folders.length}`);
      console.log(`   ✅ Correspondencia perfecta: ${correspondenciaPerfecta}`);
      console.log(`   ❌ Empleados sin carpeta: ${empleadosSinCarpeta.length}`);
      console.log(`   ⚠️ Carpetas sin empleado: ${carpetasSinEmpleado.length}`);
      
      if (correspondenciaPerfecta === employees.length && empleadosSinCarpeta.length === 0) {
        console.log('\n🎉 ¡PERFECTO! Todos los empleados tienen su carpeta correspondiente');
      } else if (correspondenciaPerfecta > 0) {
        console.log('\n⚠️ PARCIAL: Algunos empleados tienen carpetas, pero hay inconsistencias');
      } else {
        console.log('\n❌ CRÍTICO: No hay correspondencia entre empleados y carpetas');
      }
    }

    // 4. VERIFICAR RELACIONES
    console.log('\n🔗 4. VERIFICANDO RELACIONES...');
    
    // Verificar employee_documents
    const { count: documentsCount } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📄 Total de documentos de empleados: ${documentsCount || 0}`);
    
    // Verificar employee_faqs
    const { count: faqsCount } = await supabase
      .from('employee_faqs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`❓ Total de FAQs de empleados: ${faqsCount || 0}`);

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
verificarEstadoCarpetas().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});