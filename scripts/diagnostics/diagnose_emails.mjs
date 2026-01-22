#!/usr/bin/env node

/**
 * Script de diagnóstico para detectar emails con caracteres especiales del español
 * Solo analiza, no hace cambios
 * 
 * Uso: node diagnose_emails.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase en las variables de entorno');
  process.exit(1);
}

console.log('✅ Conexión a Supabase configurada correctamente');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para detectar si un email tiene caracteres especiales
function hasSpecialChars(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Buscar caracteres especiales del español
  const specialChars = /[ñÑáéíóúÁÉÍÓÚüÜ]/;
  return specialChars.test(email);
}

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

// Función principal de diagnóstico
async function diagnoseEmails() {
  console.log('\n🔍 INICIANDO DIAGNÓSTICO DE EMAILS');
  console.log('============================================================\n');
  
  try {
    // 1. Verificar conexión básica
    console.log('🔌 Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('employees')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError.message);
      return;
    }
    
    console.log('✅ Conexión exitosa');
    
    // 2. Obtener todos los emails de employees
    console.log('\n📊 Analizando tabla employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, email, full_name')
      .not('email', 'is', null);
    
    if (employeesError) {
      console.error('❌ Error al obtener empleados:', employeesError.message);
      return;
    }
    
    // 3. Obtener todos los emails de employee_folders
    console.log('📁 Analizando tabla employee_folders...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('id, employee_email, employee_name')
      .not('employee_email', 'is', null);
    
    if (foldersError) {
      console.error('❌ Error al obtener carpetas:', foldersError.message);
      return;
    }
    
    // 4. Analizar resultados
    const problematicEmployees = employees.filter(emp => hasSpecialChars(emp.email));
    const problematicFolders = folders.filter(folder => hasSpecialChars(folder.employee_email));
    
    console.log('\n📈 RESULTADOS DEL DIAGNÓSTICO:');
    console.log('============================================================');
    console.log(`👥 EMPLEADOS:`);
    console.log(`   Total: ${employees.length}`);
    console.log(`   Con caracteres especiales: ${problematicEmployees.length}`);
    console.log(`   Porcentaje problemático: ${employees.length > 0 ? ((problematicEmployees.length / employees.length) * 100).toFixed(1) : 0}%`);
    
    console.log(`\n📁 CARPETAS:`);
    console.log(`   Total: ${folders.length}`);
    console.log(`   Con caracteres especiales: ${problematicFolders.length}`);
    console.log(`   Porcentaje problemático: ${folders.length > 0 ? ((problematicFolders.length / folders.length) * 100).toFixed(1) : 0}%`);
    
    // 5. Mostrar ejemplos
    if (problematicEmployees.length > 0) {
      console.log('\n🔍 EJEMPLOS DE EMAILS PROBLEMÁTICOS (EMPLEADOS):');
      problematicEmployees.slice(0, 10).forEach(emp => {
        const normalized = normalizeEmail(emp.email);
        console.log(`   "${emp.email}" → "${normalized}"`);
      });
      if (problematicEmployees.length > 10) {
        console.log(`   ... y ${problematicEmployees.length - 10} más`);
      }
    }
    
    if (problematicFolders.length > 0) {
      console.log('\n🔍 EJEMPLOS DE EMAILS PROBLEMÁTICOS (CARPETAS):');
      problematicFolders.slice(0, 10).forEach(folder => {
        const normalized = normalizeEmail(folder.employee_email);
        console.log(`   "${folder.employee_email}" → "${normalized}"`);
      });
      if (problematicFolders.length > 10) {
        console.log(`   ... y ${problematicFolders.length - 10} más`);
      }
    }
    
    // 6. Conclusión
    const totalProblematic = problematicEmployees.length + problematicFolders.length;
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('============================================================');
    
    if (totalProblematic === 0) {
      console.log('🎉 ¡No se encontraron emails con caracteres especiales!');
      console.log('Todos los emails ya están normalizados.');
    } else {
      console.log(`⚠️  Se encontraron ${totalProblematic} emails con caracteres especiales que necesitan corrección.`);
      console.log('\nPara corregir estos emails, ejecuta:');
      console.log('   node fix_emails_auto.mjs');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL DIAGNÓSTICO:', error);
  }
}

// Ejecutar el diagnóstico
diagnoseEmails();