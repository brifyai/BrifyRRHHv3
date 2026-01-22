#!/usr/bin/env node

/**
 * VERIFICACIÓN DE CONSULTAS ESPECÍFICAS QUE ESTÁN FALLANDO
 * 
 * Analiza las consultas exactas que están generando errores
 */

import fs from 'fs';

console.log('🔍 VERIFICACIÓN: Consultas Específicas que Fallan');
console.log('=' .repeat(60));

function checkSpecificQueries() {
  console.log('\n📋 CONSULTA PROBLEMÁTICA IDENTIFICADA:');
  console.log('   GET /rest/v1/company_credentials?select=*&company_id=eq.3d71dd17-bbf0-4c17-b93a-f08126b56978&integration_type=eq.google_drive&google_drive_connected=eq.true');
  console.log('   ERROR: column company_credentials.google_drive_connected does not exist');
  
  console.log('\n🔍 ANALIZANDO CÓDIGO QUE GENERA ESTA CONSULTA...');
  
  // Buscar en los archivos la consulta exacta
  const files = [
    'src/lib/googleDriveAuthServiceDynamic_v2.js',
    'src/lib/googleDriveAuthServiceDynamic.js',
    'src/lib/googleDriveTokenBridge.js'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Buscar la consulta problemática
      if (content.includes('google_drive_connected')) {
        console.log(`\n📍 ${file}:`);
        
        // Extraer líneas que contienen google_drive_connected
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('google_drive_connected')) {
            console.log(`   Línea ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
  
  console.log('\n🎯 DIAGNÓSTICO:');
  console.log('   El código está consultando google_drive_connected en company_credentials');
  console.log('   Pero este campo NO EXISTE en la tabla real de Supabase');
  console.log('   Necesitamos saber cuál es el campo REAL que existe');
  
  console.log('\n📋 CONSULTAS SQL PARA VERIFICAR EN SUPABASE:');
  console.log('');
  console.log('1. Ver estructura de company_credentials:');
  console.log('   SELECT column_name, data_type FROM information_schema.columns');
  console.log('   WHERE table_name = \'company_credentials\' ORDER BY ordinal_position;');
  console.log('');
  console.log('2. Ver datos de ejemplo:');
  console.log('   SELECT * FROM company_credentials WHERE integration_type = \'google_drive\' LIMIT 3;');
  console.log('');
  console.log('3. Ver todas las tablas con "credential":');
  console.log('   SELECT table_name FROM information_schema.tables');
  console.log('   WHERE table_schema = \'public\' AND table_name LIKE \'%credential%\';');
  
  console.log('\n🔧 POSIBLES CORRECCIONES SEGÚN ESTRUCTURA REAL:');
  console.log('');
  console.log('Si el campo se llama diferente:');
  console.log('   .eq(\'google_drive_connected\', true) → .eq(\'campo_real\', true)');
  console.log('');
  console.log('Si usa status en lugar de boolean:');
  console.log('   .eq(\'google_drive_connected\', true) → .eq(\'status\', \'active\')');
  console.log('');
  console.log('Si no hay campo de estado:');
  console.log('   .eq(\'google_drive_connected\', true) → .eq(\'integration_type\', \'google_drive\')');
  console.log('');
  console.log('Si la tabla tiene nombre diferente:');
  console.log('   .from(\'company_credentials\') → .from(\'tabla_real\')');
  
  console.log('\n📝 ACCIÓN REQUERIDA:');
  console.log('   1. Ejecutar las consultas SQL arriba en Supabase');
  console.log('   2. Identificar la estructura REAL de company_credentials');
  console.log('   3. Corregir el código JavaScript según la estructura real');
  console.log('   4. Probar la corrección');
}

// Ejecutar verificación
checkSpecificQueries();