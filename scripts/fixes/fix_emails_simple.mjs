#!/usr/bin/env node

/**
 * Script SIMPLE y DIRECTO para normalizar emails con caracteres especiales del español
 * Versión optimizada que procesa en lotes para evitar timeouts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase');
  process.exit(1);
}

console.log('✅ Conexión a Supabase configurada');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para normalizar emails
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  
  return email
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/ñ/g, 'n') // ñ → n
    .replace(/Ñ/g, 'N'); // Ñ → N
}

// Función para detectar caracteres especiales
function hasSpecialChars(email) {
  if (!email || typeof email !== 'string') return false;
  const specialChars = /[ñÑáéíóúÁÉÍÓÚüÜ]/;
  return specialChars.test(email);
}

async function fixEmails() {
  console.log('\n🚀 INICIANDO CORRECCIÓN DE EMAILS');
  console.log('==========================================\n');
  
  try {
    // 1. Obtener empleados con caracteres especiales
    console.log('📊 Obteniendo empleados con caracteres especiales...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, email')
      .not('email', 'is', null);
    
    if (empError) throw empError;
    
    const problematicEmployees = employees.filter(emp => hasSpecialChars(emp.email));
    console.log(`   Encontrados: ${problematicEmployees.length} empleados problemáticos`);
    
    // 2. Obtener carpetas con caracteres especiales
    console.log('📁 Obteniendo carpetas con caracteres especiales...');
    const { data: folders, error: folError } = await supabase
      .from('employee_folders')
      .select('id, employee_email')
      .not('employee_email', 'is', null);
    
    if (folError) throw folError;
    
    const problematicFolders = folders.filter(folder => hasSpecialChars(folder.employee_email));
    console.log(`   Encontradas: ${problematicFolders.length} carpetas problemáticas`);
    
    // 3. Corregir empleados en lotes de 50
    console.log('\n🔧 Corrigiendo empleados...');
    let empSuccess = 0;
    let empErrors = 0;
    
    for (let i = 0; i < problematicEmployees.length; i += 50) {
      const batch = problematicEmployees.slice(i, i + 50);
      console.log(`   Procesando lote ${Math.floor(i/50) + 1} (${batch.length} empleados)...`);
      
      for (const emp of batch) {
        try {
          const normalizedEmail = normalizeEmail(emp.email);
          
          if (normalizedEmail === emp.email) continue;
          
          // Verificar duplicados
          const { data: existing } = await supabase
            .from('employees')
            .select('id')
            .eq('email', normalizedEmail)
            .single();
          
          if (existing) {
            console.log(`   ⚠️  Email duplicado: ${normalizedEmail}`);
            continue;
          }
          
          // Actualizar
          const { error } = await supabase
            .from('employees')
            .update({ email: normalizedEmail })
            .eq('id', emp.id);
          
          if (error) throw error;
          
          empSuccess++;
          
        } catch (error) {
          empErrors++;
          console.error(`   ❌ Error empleado ${emp.id}:`, error.message);
        }
      }
    }
    
    console.log(`   ✅ Empleados corregidos: ${empSuccess}`);
    console.log(`   ❌ Errores empleados: ${empErrors}`);
    
    // 4. Corregir carpetas en lotes de 50
    console.log('\n🔧 Corrigiendo carpetas...');
    let folSuccess = 0;
    let folErrors = 0;
    
    for (let i = 0; i < problematicFolders.length; i += 50) {
      const batch = problematicFolders.slice(i, i + 50);
      console.log(`   Procesando lote ${Math.floor(i/50) + 1} (${batch.length} carpetas)...`);
      
      for (const folder of batch) {
        try {
          const normalizedEmail = normalizeEmail(folder.employee_email);
          
          if (normalizedEmail === folder.employee_email) continue;
          
          // Actualizar
          const { error } = await supabase
            .from('employee_folders')
            .update({ employee_email: normalizedEmail })
            .eq('id', folder.id);
          
          if (error) throw error;
          
          folSuccess++;
          
        } catch (error) {
          folErrors++;
          console.error(`   ❌ Error carpeta ${folder.id}:`, error.message);
        }
      }
    }
    
    console.log(`   ✅ Carpetas corregidas: ${folSuccess}`);
    console.log(`   ❌ Errores carpetas: ${folErrors}`);
    
    // 5. Verificación final
    console.log('\n🔍 Verificando resultados...');
    
    const { data: finalEmployees } = await supabase
      .from('employees')
      .select('id, email')
      .not('email', 'is', null);
    
    const { data: finalFolders } = await supabase
      .from('employee_folders')
      .select('id, employee_email')
      .not('employee_email', 'is', null);
    
    const remainingEmp = finalEmployees.filter(emp => hasSpecialChars(emp.email)).length;
    const remainingFol = finalFolders.filter(folder => hasSpecialChars(folder.employee_email)).length;
    
    // 6. Resumen final
    console.log('\n🏁 RESUMEN FINAL:');
    console.log('==========================================');
    console.log(`👥 EMPLEADOS:`);
    console.log(`   ✅ Corregidos: ${empSuccess}`);
    console.log(`   ❌ Errores: ${empErrors}`);
    console.log(`   ⚠️  Restantes: ${remainingEmp}`);
    
    console.log(`\n📁 CARPETAS:`);
    console.log(`   ✅ Corregidas: ${folSuccess}`);
    console.log(`   ❌ Errores: ${folErrors}`);
    console.log(`   ⚠️  Restantes: ${remainingFol}`);
    
    const totalSuccess = empSuccess + folSuccess;
    const totalErrors = empErrors + folErrors;
    const totalRemaining = remainingEmp + remainingFol;
    
    console.log(`\n🎯 TOTAL:`);
    console.log(`   ✅ Emails normalizados: ${totalSuccess}`);
    console.log(`   ❌ Total errores: ${totalErrors}`);
    console.log(`   ⚠️  Emails restantes con problemas: ${totalRemaining}`);
    
    if (totalRemaining === 0) {
      console.log('\n🎉 ¡CORRECCIÓN COMPLETADA EXITOSAMENTE!');
      console.log('Todos los emails han sido normalizados.');
    } else {
      console.log('\n⚠️  CORRECCIÓN PARCIALMENTE COMPLETADA');
      console.log('Algunos emails podrían necesitar revisión manual.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  }
}

// Ejecutar
fixEmails();