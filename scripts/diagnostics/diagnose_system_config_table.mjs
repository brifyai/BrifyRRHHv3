#!/usr/bin/env node

/**
 * SCRIPT DE DIAGNÓSTICO: Verificar estructura de system_configurations
 * 
 * Este script verifica:
 * 1. Si la tabla system_configurations existe
 * 2. La estructura exacta de columnas y tipos de datos
 * 3. Las constraints y políticas RLS
 * 4. Intenta una inserción de prueba para replicar el error 400
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: No se encontraron variables de entorno de Supabase')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseSystemConfigTable() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE system_configurations\n')
  
  try {
    // 1. Verificar si la tabla existe y obtener su estructura
    console.log('📋 1. Verificando estructura de la tabla...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('system_configurations')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error accediendo a la tabla:', tableError.message)
      console.error('Código:', tableError.code)
      console.error('Detalles:', tableError.details)
      console.error('Sugerencia:', tableError.hint)
    } else {
      console.log('✅ Tabla accesible')
      if (tableInfo && tableInfo.length > 0) {
        console.log('📄 Ejemplo de registro:', JSON.stringify(tableInfo[0], null, 2))
      } else {
        console.log('⚠️  La tabla está vacía')
      }
    }
    
    // 2. Obtener información del esquema usando RPC
    console.log('\n🔧 2. Consultando información del esquema...')
    try {
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'system_configurations' })
      
      if (columnsError) {
        console.warn('⚠️  No se pudo obtener info de columnas via RPC:', columnsError.message)
      } else {
        console.log('📊 Columnas de la tabla:')
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable ? 'NULL' : 'NOT NULL'}`)
        })
      }
    } catch (rpcError) {
      console.warn('⚠️  Error en RPC get_table_columns:', rpcError.message)
    }
    
    // 3. Intentar una inserción de prueba para replicar el error
    console.log('\n🧪 3. Intentando inserción de prueba...')
    
    // Obtener usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.warn('⚠️  No se pudo obtener usuario:', authError.message)
    } else {
      console.log('👤 Usuario actual:', user?.id || 'anon')
    }
    
    // Datos de prueba exactamente como se envían desde SettingsDynamic.js
    const testData = {
      user_id: user?.id || null,
      scope: 'global',
      company_id: null,
      category: 'system',
      config_key: 'hierarchy_mode_test',
      config_value: 'company_first', // Valor simple string
      description: 'Prueba de diagnóstico - Modo de jerarquía',
      is_active: true,
      updated_at: new Date().toISOString()
    }
    
    console.log('📤 Datos a insertar:', JSON.stringify(testData, null, 2))
    
    const { data: insertResult, error: insertError } = await supabase
      .from('system_configurations')
      .upsert(testData, {
        onConflict: 'user_id,scope,company_id,category,config_key'
      })
      .select()
    
    if (insertError) {
      console.error('❌ ERROR EN INSERCIÓN:', insertError.message)
      console.error('Código:', insertError.code)
      console.error('Detalles:', insertError.details)
      console.error('Sugerencia:', insertError.hint)
      console.error('Mensaje completo:', JSON.stringify(insertError, null, 2))
    } else {
      console.log('✅ Inserción exitosa:', JSON.stringify(insertResult, null, 2))
      
      // Limpiar el registro de prueba
      console.log('🧹 Limpiando registro de prueba...')
      const { error: deleteError } = await supabase
        .from('system_configurations')
        .delete()
        .eq('config_key', 'hierarchy_mode_test')
      
      if (deleteError) {
        console.warn('⚠️  No se pudo limpiar el registro de prueba:', deleteError.message)
      } else {
        console.log('✅ Registro de prueba eliminado')
      }
    }
    
    // 4. Verificar políticas RLS
    console.log('\n🔐 4. Verificando políticas RLS...')
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'system_configurations' })
      
      if (policiesError) {
        console.warn('⚠️  No se pudo obtener políticas via RPC:', policiesError.message)
      } else {
        console.log('🛡️  Políticas encontradas:', policies.length)
        policies.forEach((policy, i) => {
          console.log(`   ${i + 1}. ${policy.policyname}: ${policy.permissive} ${policy.cmd}`)
          console.log(`      → ${policy.qual}`)
        })
      }
    } catch (rlsError) {
      console.warn('⚠️  Error consultando políticas RLS:', rlsError.message)
    }
    
    // 5. Intentar con config_value como JSON válido
    console.log('\n🧪 5. Intentando inserción con config_value como objeto JSON...')
    
    const testDataJson = {
      ...testData,
      config_key: 'hierarchy_mode_test_json',
      config_value: { mode: 'company_first' } // Objeto JSON en lugar de string
    }
    
    console.log('📤 Datos a insertar (JSON):', JSON.stringify(testDataJson, null, 2))
    
    const { data: insertResultJson, error: insertErrorJson } = await supabase
      .from('system_configurations')
      .upsert(testDataJson, {
        onConflict: 'user_id,scope,company_id,category,config_key'
      })
      .select()
    
    if (insertErrorJson) {
      console.error('❌ ERROR EN INSERCIÓN JSON:', insertErrorJson.message)
      console.error('Código:', insertErrorJson.code)
      console.error('Detalles:', insertErrorJson.details)
    } else {
      console.log('✅ Inserción JSON exitosa')
      
      // Limpiar
      await supabase
        .from('system_configurations')
        .delete()
        .eq('config_key', 'hierarchy_mode_test_json')
    }
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO')
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar diagnóstico
diagnoseSystemConfigTable().catch(console.error)