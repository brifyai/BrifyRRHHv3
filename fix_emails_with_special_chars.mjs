#!/usr/bin/env node

/**
 * Script para normalizar emails con caracteres especiales del español en Supabase
 * Convierte ñ → n, tildes y acentos → caracteres sin diacríticos
 * 
 * Uso: node fix_emails_with_special_chars.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase en las variables de entorno');
  console.log('Necesitas configurar:');
  console.log('  VITE_SUPABASE_URL o REACT_APP_SUPABASE_URL o SUPABASE_URL');
  console.log('  VITE_SUPABASE_ANON_KEY o REACT_APP_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY');
  console.log('Variables encontradas:', {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✓' : '✗',
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? '✓' : '✗',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗',
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✓' : '✗',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓' : '✗'
  });
  process.exit(1);
}

console.log('✅ Conexión a Supabase configurada correctamente');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para normalizar emails (misma lógica que en el frontend)
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  return email
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes, acentos)
    .replace(/ñ/g, 'n') // ñ → n
    .replace(/Ñ/g, 'N'); // Ñ → N
}

// Función para detectar si un email tiene caracteres especiales
function hasSpecialChars(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Buscar caracteres especiales del español
  const specialChars = /[ñÑáéíóúÁÉÍÓÚüÜ]/;
  return specialChars.test(email);
}

// Función para obtener estadísticas de emails problemáticos
async function getEmailStats() {
  console.log('📊 Analizando emails en la base de datos...');
  
  try {
    // Obtener todos los emails de la tabla employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email, name')
      .not('email', 'is', null);
    
    if (employeesError) throw employeesError;
    
    // Obtener todos los emails de la tabla employee_folders
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('id, employee_email, employee_name')
      .not('employee_email', 'is', null);
    
    if (foldersError) throw foldersError;
    
    // Analizar empleados
    const problematicEmployees = employees.filter(emp => hasSpecialChars(emp.email));
    const totalEmployees = employees.length;
    
    // Analizar carpetas
    const problematicFolders = folders.filter(folder => hasSpecialChars(folder.employee_email));
    const totalFolders = folders.length;
    
    console.log('\n📈 ESTADÍSTICAS ACTUALES:');
    console.log('============================================================');
    console.log(`👥 EMPLEADOS:`);
    console.log(`   Total: ${totalEmployees}`);
    console.log(`   Con caracteres especiales: ${problematicEmployees.length}`);
    console.log(`   Porcentaje problemático: ${((problematicEmployees.length / totalEmployees) * 100).toFixed(1)}%`);
    
    console.log(`\n📁 CARPETAS:`);
    console.log(`   Total: ${totalFolders}`);
    console.log(`   Con caracteres especiales: ${problematicFolders.length}`);
    console.log(`   Porcentaje problemático: ${((problematicFolders.length / totalFolders) * 100).toFixed(1)}%`);
    
    // Mostrar ejemplos de emails problemáticos
    if (problematicEmployees.length > 0) {
      console.log('\n🔍 EJEMPLOS DE EMAILS PROBLEMÁTICOS (EMPLEADOS):');
      problematicEmployees.slice(0, 5).forEach(emp => {
        const normalized = normalizeEmail(emp.email);
        console.log(`   "${emp.email}" → "${normalized}"`);
      });
      if (problematicEmployees.length > 5) {
        console.log(`   ... y ${problematicEmployees.length - 5} más`);
      }
    }
    
    if (problematicFolders.length > 0) {
      console.log('\n🔍 EJEMPLOS DE EMAILS PROBLEMÁTICOS (CARPETAS):');
      problematicFolders.slice(0, 5).forEach(folder => {
        const normalized = normalizeEmail(folder.employee_email);
        console.log(`   "${folder.employee_email}" → "${normalized}"`);
      });
      if (problematicFolders.length > 5) {
        console.log(`   ... y ${problematicFolders.length - 5} más`);
      }
    }
    
    return {
      employees: { total: totalEmployees, problematic: problematicEmployees.length, data: problematicEmployees },
      folders: { total: totalFolders, problematic: problematicFolders.length, data: problematicFolders }
    };
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
}

// Función para normalizar emails en la tabla employees
async function fixEmployeeEmails(problematicEmployees) {
  console.log('\n🔧 Corrigiendo emails de empleados...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const employee of problematicEmployees) {
    try {
      const normalizedEmail = normalizeEmail(employee.email);
      
      // Verificar que el email normalizado es diferente
      if (normalizedEmail === employee.email) {
        console.log(`   ⚠️  Saltando ${employee.email} (ya está normalizado)`);
        continue;
      }
      
      // Verificar que el email normalizado no existe ya
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('email', normalizedEmail)
        .single();
      
      if (existing) {
        console.log(`   ⚠️  Email normalizado "${normalizedEmail}" ya existe, saltando empleado ${employee.id}`);
        continue;
      }
      
      // Actualizar el email
      const { error } = await supabase
        .from('employees')
        .update({ email: normalizedEmail })
        .eq('id', employee.id);
      
      if (error) throw error;
      
      console.log(`   ✅ ${employee.email} → ${normalizedEmail}`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error con empleado ${employee.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 RESULTADOS EMPLEADOS:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  
  return { success: successCount, errors: errorCount };
}

// Función para normalizar emails en la tabla employee_folders
async function fixFolderEmails(problematicFolders) {
  console.log('\n🔧 Corrigiendo emails de carpetas...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const folder of problematicFolders) {
    try {
      const normalizedEmail = normalizeEmail(folder.employee_email);
      
      // Verificar que el email normalizado es diferente
      if (normalizedEmail === folder.employee_email) {
        console.log(`   ⚠️  Saltando ${folder.employee_email} (ya está normalizado)`);
        continue;
      }
      
      // Actualizar el email
      const { error } = await supabase
        .from('employee_folders')
        .update({ employee_email: normalizedEmail })
        .eq('id', folder.id);
      
      if (error) throw error;
      
      console.log(`   ✅ ${folder.employee_email} → ${normalizedEmail}`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error con carpeta ${folder.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 RESULTADOS CARPETAS:`);
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  
  return { success: successCount, errors: errorCount };
}

// Función para verificar que las correcciones funcionaron
async function verifyFix() {
  console.log('\n🔍 Verificando correcciones...');
  
  try {
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email')
      .not('email', 'is', null);
    
    if (employeesError) throw employeesError;
    
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('id, employee_email')
      .not('employee_email', 'is', null);
    
    if (foldersError) throw foldersError;
    
    const remainingEmployeeIssues = employees.filter(emp => hasSpecialChars(emp.email));
    const remainingFolderIssues = folders.filter(folder => hasSpecialChars(folder.employee_email));
    
    console.log('\n📈 VERIFICACIÓN FINAL:');
    console.log('============================================================');
    console.log(`👥 EMPLEADOS con caracteres especiales restantes: ${remainingEmployeeIssues.length}`);
    console.log(`📁 CARPETAS con caracteres especiales restantes: ${remainingFolderIssues.length}`);
    
    if (remainingEmployeeIssues.length === 0 && remainingFolderIssues.length === 0) {
      console.log('🎉 ¡Todos los emails han sido normalizados correctamente!');
      return true;
    } else {
      console.log('⚠️  Aún quedan emails con caracteres especiales por corregir');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 INICIANDO NORMALIZACIÓN DE EMAILS');
  console.log('============================================================');
  console.log('Este script normalizará todos los emails con caracteres especiales del español');
  console.log('Convirtiendo: ñ→n, tildes→sin tildes, acentos→sin acentos');
  console.log('============================================================\n');
  
  try {
    // 1. Obtener estadísticas actuales
    const stats = await getEmailStats();
    
    // Si no hay emails problemáticos, terminar
    if (stats.employees.problematic === 0 && stats.folders.problematic === 0) {
      console.log('\n🎉 ¡No hay emails con caracteres especiales para corregir!');
      console.log('Todos los emails ya están normalizados.');
      return;
    }
    
    // 2. Confirmar con el usuario
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('\n❓ ¿Quieres proceder con la normalización? (s/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 'sí') {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }
    
    // 3. Corregir emails de empleados
    const employeeResults = await fixEmployeeEmails(stats.employees.data);
    
    // 4. Corregir emails de carpetas
    const folderResults = await fixFolderEmails(stats.folders.data);
    
    // 5. Verificar resultados
    const verificationPassed = await verifyFix();
    
    // 6. Resumen final
    console.log('\n🏁 RESUMEN FINAL:');
    console.log('============================================================');
    console.log(`👥 EMPLEADOS procesados:`);
    console.log(`   ✅ Normalizados: ${employeeResults.success}`);
    console.log(`   ❌ Errores: ${employeeResults.errors}`);
    
    console.log(`\n📁 CARPETAS procesadas:`);
    console.log(`   ✅ Normalizados: ${folderResults.success}`);
    console.log(`   ❌ Errores: ${folderResults.errors}`);
    
    const totalSuccess = employeeResults.success + folderResults.success;
    const totalErrors = employeeResults.errors + folderResults.errors;
    
    console.log(`\n🎯 TOTAL:`);
    console.log(`   ✅ Emails normalizados: ${totalSuccess}`);
    console.log(`   ❌ Total errores: ${totalErrors}`);
    
    if (verificationPassed) {
      console.log('\n🎉 ¡NORMALIZACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('Todos los emails con caracteres especiales han sido corregidos.');
    } else {
      console.log('\n⚠️  NORMALIZACIÓN PARCIALMENTE COMPLETADA');
      console.log('Algunos emails podrían necesitar revisión manual.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { normalizeEmail, hasSpecialChars };