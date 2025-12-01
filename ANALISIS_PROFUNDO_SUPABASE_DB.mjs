#!/usr/bin/env node

/**
 * ANÁLISIS SUPER PROFUNDO DE LA ESTRUCTURA DE BASE DE DATOS EN SUPABASE
 * 
 * Este script analiza la estructura real de las tablas en Supabase
 * para identificar exactamente qué campos existen y cuáles faltan
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔍 ANÁLISIS SUPER PROFUNDO: Estructura Real de Base de Datos Supabase');
console.log('=' .repeat(80));

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY no está configurado');
  console.log('   Configurar en .env.local o variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDatabaseAnalysis() {
  try {
    console.log('\n📋 PASO 1: Verificando conexión a Supabase...');
    
    // Test básico de conexión
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Error de conexión:', testError.message);
      return;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    
    console.log('\n📋 PASO 2: Analizando tabla company_credentials...');
    
    // Método 1: Intentar consultar la tabla directamente
    try {
      const { data: companyCreds, error: companyError } = await supabase
        .from('company_credentials')
        .select('*')
        .limit(1);
      
      if (companyError) {
        console.log('❌ Error consultando company_credentials:', companyError.message);
        console.log('   Código de error:', companyError.code);
        console.log('   Detalles:', companyError.details);
      } else {
        console.log('✅ Tabla company_credentials existe');
        console.log('   Registros encontrados:', companyCreds?.length || 0);
        
        if (companyCreds && companyCreds.length > 0) {
          console.log('   Estructura del primer registro:');
          console.log('   ', JSON.stringify(companyCreds[0], null, 2));
        }
      }
    } catch (e) {
      console.log('❌ Excepción consultando company_credentials:', e.message);
    }
    
    console.log('\n📋 PASO 3: Analizando tabla user_google_drive_credentials...');
    
    try {
      const { data: userCreds, error: userError } = await supabase
        .from('user_google_drive_credentials')
        .select('*')
        .limit(1);
      
      if (userError) {
        console.log('❌ Error consultando user_google_drive_credentials:', userError.message);
        console.log('   Código de error:', userError.code);
        console.log('   Detalles:', userError.details);
      } else {
        console.log('✅ Tabla user_google_drive_credentials existe');
        console.log('   Registros encontrados:', userCreds?.length || 0);
        
        if (userCreds && userCreds.length > 0) {
          console.log('   Estructura del primer registro:');
          console.log('   ', JSON.stringify(userCreds[0], null, 2));
        }
      }
    } catch (e) {
      console.log('❌ Excepción consultando user_google_drive_credentials:', e.message);
    }
    
    console.log('\n📋 PASO 4: Consultando información_schema para estructura detallada...');
    
    // Método 2: Usar information_schema para obtener estructura exacta
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              table_name,
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns 
            WHERE table_name IN ('company_credentials', 'user_google_drive_credentials')
            ORDER BY table_name, ordinal_position;
          `
        });
      
      if (schemaError) {
        console.log('❌ Error consultando information_schema:', schemaError.message);
        console.log('   Intentando método alternativo...');
        
        // Método alternativo: consultar cada tabla individualmente
        await analyzeTableStructure('company_credentials');
        await analyzeTableStructure('user_google_drive_credentials');
        
      } else {
        console.log('✅ Estructura de tablas obtenida via information_schema:');
        console.log(schemaData);
      }
      
    } catch (e) {
      console.log('❌ Excepción consultando information_schema:', e.message);
      
      // Método alternativo
      await analyzeTableStructure('company_credentials');
      await analyzeTableStructure('user_google_drive_credentials');
    }
    
    console.log('\n📋 PASO 5: Verificando políticas RLS...');
    
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual
            FROM pg_policies 
            WHERE tablename IN ('company_credentials', 'user_google_drive_credentials')
            ORDER BY tablename, policyname;
          `
        });
      
      if (rlsError) {
        console.log('❌ Error consultando RLS policies:', rlsError.message);
      } else {
        console.log('✅ Políticas RLS encontradas:');
        console.log(rlsData);
      }
      
    } catch (e) {
      console.log('❌ Excepción consultando RLS policies:', e.message);
    }
    
    console.log('\n📋 PASO 6: Verificando índices...');
    
    try {
      const { data: indexData, error: indexError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              schemaname,
              tablename,
              indexname,
              indexdef
            FROM pg_indexes 
            WHERE tablename IN ('company_credentials', 'user_google_drive_credentials')
            ORDER BY tablename, indexname;
          `
        });
      
      if (indexError) {
        console.log('❌ Error consultando índices:', indexError.message);
      } else {
        console.log('✅ Índices encontrados:');
        console.log(indexData);
      }
      
    } catch (e) {
      console.log('❌ Excepción consultando índices:', e.message);
    }
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('   Basado en los resultados arriba, podemos determinar:');
    console.log('   1. ¿Existen las tablas?');
    console.log('   2. ¿Qué campos tienen realmente?');
    console.log('   3. ¿Cuáles son los nombres correctos de los campos?');
    console.log('   4. ¿Qué políticas RLS están configuradas?');
    console.log('   5. ¿Qué índices existen?');
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
  }
}

async function analyzeTableStructure(tableName) {
  console.log(`\n🔍 Analizando estructura de ${tableName}...`);
  
  try {
    // Intentar diferentes consultas para entender la estructura
    const queries = [
      `SELECT * FROM ${tableName} LIMIT 1`,
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`,
      `SELECT * FROM ${tableName} WHERE 1=0` // Solo estructura
    ];
    
    for (const query of queries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { query });
        
        if (!error) {
          console.log(`✅ Query exitosa para ${tableName}:`);
          console.log(data);
          break;
        } else {
          console.log(`❌ Error en query para ${tableName}:`, error.message);
        }
      } catch (e) {
        console.log(`❌ Excepción en query para ${tableName}:`, e.message);
      }
    }
    
  } catch (e) {
    console.log(`❌ Error analizando estructura de ${tableName}:`, e.message);
  }
}

// Ejecutar análisis
deepDatabaseAnalysis();