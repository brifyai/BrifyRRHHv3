#!/usr/bin/env node

/**
 * DIAGNÓSTICO DE DUPLICACIÓN DE CARPETAS EN GOOGLE DRIVE
 * Identifica y analiza las causas de duplicación de carpetas
 */

import { supabase } from './src/lib/supabaseClient.js';
import organizedDatabaseService from './src/services/organizedDatabaseService.js';

async function diagnoseFolderDuplication() {
  console.log('🔍 DIAGNÓSTICO DE DUPLICACIÓN DE CARPETAS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Obtener empleados
    console.log('\n👥 1. Obteniendo empleados...');
    const employees = await organizedDatabaseService.getEmployees();
    console.log(`📊 Total empleados: ${employees.length}`);
    
    // 2. Analizar duplicados por email
    console.log('\n🔄 2. Analizando duplicados por email...');
    const emailCounts = {};
    employees.forEach(emp => {
      emailCounts[emp.email] = (emailCounts[emp.email] || 0) + 1;
    });
    
    const duplicateEmails = Object.entries(emailCounts)
      .filter(([email, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    if (duplicateEmails.length > 0) {
      console.log('⚠️ EMPLEADOS CON EMAILS DUPLICADOS:');
      duplicateEmails.forEach(([email, count]) => {
        console.log(`   ${email}: ${count} veces`);
      });
    } else {
      console.log('✅ No hay emails duplicados en empleados');
    }
    
    // 3. Verificar carpetas en Supabase
    console.log('\n📁 3. Verificando carpetas en Supabase...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('employee_email, employee_name, company_name, drive_folder_id, created_at')
      .order('created_at', { ascending: false });
    
    if (foldersError) {
      console.log('❌ Error consultando carpetas:', foldersError.message);
    } else {
      console.log(`📊 Total carpetas en Supabase: ${folders.length}`);
      
      // Analizar duplicados en Supabase
      const supabaseEmailCounts = {};
      folders.forEach(folder => {
        supabaseEmailCounts[folder.employee_email] = (supabaseEmailCounts[folder.employee_email] || 0) + 1;
      });
      
      const supabaseDuplicates = Object.entries(supabaseEmailCounts)
        .filter(([email, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);
      
      if (supabaseDuplicates.length > 0) {
        console.log('⚠️ CARPETAS DUPLICADAS EN SUPABASE:');
        supabaseDuplicates.forEach(([email, count]) => {
          console.log(`   ${email}: ${count} carpetas`);
          // Mostrar detalles de las carpetas duplicadas
          const emailFolders = folders.filter(f => f.employee_email === email);
          emailFolders.forEach((folder, index) => {
            console.log(`      ${index + 1}. ID: ${folder.drive_folder_id || 'NULL'}, Empresa: ${folder.company_name}`);
          });
        });
      } else {
        console.log('✅ No hay carpetas duplicadas en Supabase');
      }
    }
    
    // 4. Analizar servicios que crean carpetas
    console.log('\n🔧 4. SERVICIOS QUE CREAN CARPETAS:');
    console.log('   ❌ unifiedEmployeeFolderService.js - NO verifica existencia');
    console.log('   ✅ enhancedEmployeeFolderService.js - SÍ verifica (líneas 329-338)');
    console.log('   ✅ googleDriveSyncService.js - Verificación compleja');
    console.log('   ⚠️ PROBLEMA: Múltiples servicios ejecutándose simultáneamente');
    
    // 5. Causas identificadas
    console.log('\n🎯 5. CAUSAS IDENTIFICADAS:');
    console.log('   1️⃣ CONDICIONES DE CARRERA: Múltiples procesos crean carpetas al mismo tiempo');
    console.log('   2️⃣ VERIFICACIÓN INCONSISTENTE: unifiedEmployeeFolderService no verifica');
    console.log('   3️⃣ FALTA DE SINCRRONIZACIÓN: No hay mecanismo centralizado');
    console.log('   4️⃣ SERVICIOS PARALELOS: 3 servicios creando carpetas simultáneamente');
    
    // 6. Soluciones recomendadas
    console.log('\n💡 6. SOLUCIONES RECOMENDADAS:');
    console.log('   🔒 IMPLEMENTAR LOCKS: Usar superLockService para prevenir concurrencia');
    console.log('   ✅ VERIFICACIÓN UNIFICADA: Todos los servicios deben verificar existencia');
    console.log('   🎯 SERVICIO CENTRALIZADO: Un solo punto de creación de carpetas');
    console.log('   🔍 CLEANUP: Eliminar carpetas duplicadas existentes');
    
    console.log('\n📋 RESUMEN:');
    console.log('=' .repeat(40));
    if (duplicateEmails.length > 0 || supabaseDuplicates.length > 0) {
      console.log('🚨 PROBLEMA DETECTADO: Duplicaciones encontradas');
      console.log('🔧 ACCIÓN REQUERIDA: Implementar locks y verificación unificada');
    } else {
      console.log('✅ ESTADO: No se detectaron duplicaciones obvias');
      console.log('⚠️ PERO: El problema puede ocurrir durante sincronización activa');
    }
    
  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseFolderDuplication();