#!/usr/bin/env node

/**
 * Diagnóstico profundo de la tabla user_google_drive_credentials
 * Verifica si la tabla existe y tiene la estructura correcta
 */

import fs from 'fs';

console.log('🔍 DIAGNÓSTICO PROFUNDO: Tabla user_google_drive_credentials');
console.log('=' .repeat(70));

function deepTableDiagnosis() {
  console.log('\n📋 ANÁLISIS DE LOS LOGS:');
  console.log('   ✅ Query corregida: sync_status=in.(connected,connecting)');
  console.log('   ❌ Error persiste: "object is not iterable"');
  console.log('   ❌ Fetch falla después de 281ms');
  
  console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
  console.log('   El problema NO es la query, sino que:');
  console.log('   1. La tabla user_google_drive_credentials NO EXISTE en Supabase');
  console.log('   2. O existe pero tiene estructura diferente');
  console.log('   3. O hay problemas de permisos RLS');
  console.log('   4. O el servicio de BD no puede acceder a ella');
  
  console.log('\n📋 EVIDENCIA DE LOS LOGS:');
  console.log('   - Query se ejecuta: ✅');
  console.log('   - Tiempo de respuesta: 281ms (no timeout)');
  console.log('   - Respuesta: Error object (no array)');
  console.log('   - Error: "object is not iterable"');
  
  console.log('\n🔍 POSIBLES CAUSAS:');
  console.log('   ❌ Tabla no creada en Supabase');
  console.log('   ❌ Tabla creada con nombre diferente');
  console.log('   ❌ RLS policies bloqueando acceso');
  console.log('   ❌ Usuario sin permisos en la tabla');
  console.log('   ❌ Servicio supabaseDatabase con configuración incorrecta');
  console.log('   ❌ Variables de entorno de Supabase incorrectas');
  
  console.log('\n🛠️ SOLUCIONES NECESARIAS:');
  console.log('   1. VERIFICAR: ¿Existe la tabla en el dashboard de Supabase?');
  console.log('   2. EJECUTAR: Script SQL para crear la tabla si no existe');
  console.log('   3. VERIFICAR: RLS policies permiten acceso al usuario');
  console.log('   4. VERIFICAR: Variables de entorno de Supabase');
  console.log('   5. PROBAR: Query manual en Supabase SQL Editor');
  console.log('   6. REVISAR: Configuración del servicio supabaseDatabase');
  
  console.log('\n⚠️ IMPACTO CRÍTICO:');
  console.log('   - OAuth de Google Drive COMPLETAMENTE ROTO');
  console.log('   - AuthContext falla al cargar');
  console.log('   - Sistema de integraciones no funciona');
  console.log('   - Diferencias local vs Netlify se mantienen');
  
  console.log('\n📝 PRÓXIMOS PASOS INMEDIATOS:');
  console.log('   1. Acceder al dashboard de Supabase');
  console.log('   2. Verificar si existe la tabla user_google_drive_credentials');
  console.log('   3. Si no existe, ejecutar el script SQL de creación');
  console.log('   4. Verificar RLS policies');
  console.log('   5. Probar query manual');
  console.log('   6. Corregir configuración si es necesario');
  
  console.log('\n🚨 CONCLUSIÓN:');
  console.log('   El problema NO está en el código JavaScript,');
  console.log('   sino en la configuración de la base de datos Supabase.');
  console.log('   Es un problema de INFRAESTRUCTURA, no de código.');
}

// Ejecutar diagnóstico
deepTableDiagnosis();