#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO EN TIEMPO REAL: OAuth Google Drive Guardado
 * 
 * Este script monitorea en tiempo real lo que ocurre durante el OAuth
 * para identificar exactamente por qué las credenciales no se guardan.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_PUBLIC || process.env.REACT_APP_SUPABASE_ANON_PUBLIC || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 DIAGNÓSTICO EN TIEMPO REAL: OAuth Google Drive');
console.log('=====================================================\n');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Variables de entorno no configuradas');
  console.log('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.log('   VITE_SUPABASE_ANON_PUBLIC:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Datos de prueba simulando un OAuth real
const testUserId = 'ba796511-4271-4e68-b4c1-a3ec03f701e5'; // ID del usuario de los logs
const testCompanyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'; // ID de la empresa de los logs

const testCredentialData = {
  company_id: testCompanyId,
  integration_type: 'google_drive',
  credentials: {
    access_token: 'ya29.a0AfH6SMBLAHBLAHBLAH', // Token simulado
    refresh_token: '1//0gBLAHBLAHBLAH', // Refresh token simulado
    account_email: 'test@example.com',
    account_name: 'Test User',
    user_id: testUserId,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
  },
  status: 'active',
  account_email: 'test@example.com',
  account_name: 'Test User',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function diagnoseOAuthSave() {
  console.log('📋 Paso 1: Verificando conectividad a Supabase...\n');
  
  // Test 1: Conectividad básica
  try {
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) {
      console.error('❌ Error de conectividad:', error.message);
      console.error('   Detalles:', error);
    } else {
      console.log('✅ Conectividad a Supabase: OK');
      console.log('   Respuesta:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Error crítico de conectividad:', err.message);
  }

  console.log('\n📋 Paso 2: Verificando estructura de tabla company_credentials...\n');
  
  // Test 2: Verificar estructura de tabla
  try {
    const { data, error } = await supabase
      .from('company_credentials')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error consultando tabla:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalles:', error);
    } else {
      console.log('✅ Tabla company_credentials accesible');
      if (data && data.length > 0) {
        console.log('   Estructura de registro existente:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('   ✅ Tabla existe pero está vacía (esto es normal)');
      }
    }
  } catch (err) {
    console.error('❌ Error crítico:', err.message);
  }

  console.log('\n📋 Paso 3: Intentando guardar credenciales de prueba...\n');
  
  // Test 3: Intentar guardar credenciales
  console.log('🔍 Datos que se intentarán guardar:');
  console.log(JSON.stringify(testCredentialData, null, 2));
  console.log('');
  
  try {
    const { data, error } = await supabase
      .from('company_credentials')
      .upsert(testCredentialData);
    
    if (error) {
      console.error('❌ ERROR GUARDANDO CREDENCIALES:');
      console.error('   Mensaje:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalles completos:', error);
      
      // Análisis específico de errores comunes
      if (error.message.includes('foreign key')) {
        console.log('\n💡 DIAGNÓSTICO: Error de clave foránea');
        console.log('   - Verifica que company_id exista en tabla companies');
        console.log('   - Verifica que user_id exista en tabla users');
      } else if (error.message.includes('null value')) {
        console.log('\n💡 DIAGNÓSTICO: Campo requerido nulo');
        console.log('   - Revisa campos NOT NULL en la tabla');
      } else if (error.message.includes('JSON')) {
        console.log('\n💡 DIAGNÓSTICO: Error en formato JSON');
        console.log('   - Revisa la estructura del campo credentials');
      } else if (error.message.includes('permission') || error.message.includes('RLS')) {
        console.log('\n💡 DIAGNÓSTICO: Error de permisos/RLS');
        console.log('   - Revisa las policies de Row Level Security');
      }
    } else {
      console.log('✅ CREDENCIALES GUARDADAS EXITOSAMENTE');
      console.log('   Datos guardados:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Error crítico guardando:', err.message);
    console.error('   Stack:', err.stack);
  }

  console.log('\n📋 Paso 4: Verificando si las credenciales se pueden consultar...\n');
  
  // Test 4: Verificar que se pueden consultar
  try {
    const { data, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .eq('status', 'active')
      .contains('credentials', { user_id: testUserId });
    
    if (error) {
      console.error('❌ Error consultando credenciales:', error.message);
    } else {
      console.log('✅ Consulta de credenciales exitosa');
      console.log('   Número de credenciales encontradas:', data ? data.length : 0);
      if (data && data.length > 0) {
        console.log('   Primera credencial:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Error crítico consultando:', err.message);
  }

  console.log('\n📋 Paso 5: Verificando RLS (Row Level Security)...\n');
  
  // Test 5: Verificar policies
  try {
    // Intentar sin RLS primero
    const { data, error } = await supabase
      .from('company_credentials')
      .select('count');
    
    if (error && error.message.includes('permission')) {
      console.log('⚠️ RLS está activo - esto puede causar problemas');
      console.log('   Mensaje:', error.message);
    } else {
      console.log('✅ RLS verificado (puede estar activo pero funcional)');
    }
  } catch (err) {
    console.log('⚠️ No se pudo verificar RLS:', err.message);
  }

  console.log('\n=====================================================');
  console.log('🔍 DIAGNÓSTICO COMPLETADO');
  console.log('=====================================================\n');
  
  console.log('📋 RESUMEN DE PROBLEMAS COMUNES:\n');
  console.log('1. ❌ "null value in column" → Campo requerido está nulo');
  console.log('2. ❌ "foreign key violation" → company_id o user_id no existen');
  console.log('3. ❌ "new row violates row-level security policy" → RLS bloqueando');
  console.log('4. ❌ "invalid input syntax for type json" → Formato JSON inválido');
  console.log('5. ✅ Si no hay error → El problema es en el código de la app\n');
  
  console.log('💡 SOLUCIONES RÁPIDAS:\n');
  console.log('• Para error #1: Revisa campos NOT NULL en la tabla');
  console.log('• Para error #2: Verifica que company_id y user_id existan');
  console.log('• Para error #3: Desactiva temporalmente RLS o ajusta policies');
  console.log('• Para error #4: Valida el formato JSON del campo credentials');
  console.log('• Para error #5: Revisa googleDriveCallbackHandler.js línea 63\n');
}

// Ejecutar diagnóstico
diagnoseOAuthSave().catch(err => {
  console.error('❌ Error fatal en diagnóstico:', err);
  process.exit(1);
});