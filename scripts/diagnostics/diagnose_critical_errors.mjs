#!/usr/bin/env node

/**
 * Diagnóstico de errores críticos en Google Drive OAuth
 * 
 * Analiza los errores de los logs para identificar la causa raíz
 */

console.log('🚨 DIAGNÓSTICO: Errores Críticos Google Drive OAuth');
console.log('=' .repeat(60));

function analyzeCriticalErrors() {
  console.log('\n📋 ERROR 1: Status 400 en user_google_drive_credentials');
  console.log('   URL: /rest/v1/user_google_drive_credentials');
  console.log('   Query: user_id=eq.ba796511-4271-4e68-b4c1-a3ec03f701e5&status=in.(pending_verification,active)');
  console.log('');
  console.log('   POSIBLES CAUSAS:');
  console.log('   ❌ Tabla user_google_drive_credentials no existe');
  console.log('   ❌ Problemas de RLS (Row Level Security)');
  console.log('   ❌ Columna status no existe en la tabla');
  console.log('   ❌ Sintaxis de query incorrecta');
  console.log('   ❌ Usuario sin permisos para acceder a la tabla');
  
  console.log('\n📋 ERROR 2: Object is not iterable');
  console.log('   Mensaje: object is not iterable (cannot read property Symbol(Symbol.iterator))');
  console.log('');
  console.log('   POSIBLES CAUSAS:');
  console.log('   ❌ Supabase retorna error en lugar de array');
  console.log('   ❌ Respuesta null/undefined en lugar de array');
  console.log('   ❌ Error 400 causa que data no sea iterable');
  console.log('   ❌ Problema en destructuring de respuesta');
  
  console.log('\n📋 ERROR 3: Múltiples fetch failures');
  console.log('   - system_configurations queries fallando');
  console.log('   - companies queries duplicadas');
  console.log('   - Resource recovery service ejecutándose constantemente');
  console.log('');
  console.log('   POSIBLES CAUSAS:');
  console.log('   ❌ Problemas de conectividad con Supabase');
  console.log('   ❌ Rate limiting o throttling');
  console.log('   ❌ Configuración incorrecta de Supabase');
  console.log('   ❌ Variables de entorno faltantes');
  
  console.log('\n🎯 DIAGNÓSTICO PRINCIPAL:');
  console.log('   El problema NO es el código de OAuth, sino que:');
  console.log('   1. La tabla user_google_drive_credentials NO EXISTE o tiene problemas');
  console.log('   2. Los permisos/RLS no están configurados correctamente');
  console.log('   3. La estructura de la tabla no coincide con el query');
  
  console.log('\n🔧 SOLUCIONES NECESARIAS:');
  console.log('   1. VERIFICAR: ¿Existe la tabla user_google_drive_credentials?');
  console.log('   2. VERIFICAR: ¿Tiene las columnas correctas (user_id, status, etc.)?');
  console.log('   3. VERIFICAR: ¿Los permisos RLS permiten acceso?');
  console.log('   4. VERIFICAR: ¿Las variables de entorno de Supabase son correctas?');
  console.log('   5. CREAR: Tabla si no existe con estructura correcta');
  console.log('   6. CONFIGURAR: RLS policies para acceso correcto');
  
  console.log('\n⚠️  IMPACTO:');
  console.log('   - OAuth de Google Drive NO puede funcionar sin esta tabla');
  console.log('   - AuthContext falla al cargar credenciales');
  console.log('   - Sistema completo puede estar afectado');
  console.log('   - Diferencias local vs Netlify pueden deberse a esto');
  
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('   1. Verificar estructura de BD en Supabase');
  console.log('   2. Crear/corregir tabla user_google_drive_credentials');
  console.log('   3. Configurar RLS policies correctamente');
  console.log('   4. Verificar variables de entorno');
  console.log('   5. Probar queries manualmente');
}

// Ejecutar diagnóstico
analyzeCriticalErrors();