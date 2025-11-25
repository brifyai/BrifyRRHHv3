#!/usr/bin/env node

/**
 * DIAGNÓSTICO PROFUNDO: Verificar estado real de RLS en Supabase
 * 
 * Este script usa service_role para bypass RLS y verificar:
 * 1. Si las políticas realmente existen
 * 2. Si RLS está habilitado
 * 3. Qué políticas están activas
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  console.error('❌ ERROR: REACT_APP_SUPABASE_URL no encontrada')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('⚠️  ADVERTENCIA: SERVICE_KEY no encontrada, usando ANON_KEY (puede fallar)')
  console.error('   Necesitas: REACT_APP_SUPABASE_SERVICE_KEY desde Supabase > Settings > API')
}

// Usar service_role para bypass RLS y ver el estado real
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || process.env.REACT_APP_SUPABASE_ANON_KEY)

async function diagnoseRLSStatus() {
  console.log('🔍 DIAGNÓSTICO PROFUNDO DE RLS\n')
  
  try {
    // 1. Verificar si RLS está habilitado en la tabla
    console.log('📊 1. Verificando estado de RLS en system_configurations...')
    const { data: rlsInfo, error: rlsError } = await supabaseAdmin
      .rpc('get_rls_status', { table_name: 'system_configurations' })
    
    if (rlsError) {
      console.log('ℹ️  No se pudo obtener status via RPC, intentando consulta directa...')
      
      // Consulta directa a pg_tables
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'system_configurations')
      
      if (tableError) {
        console.error('❌ Error consultando pg_tables:', tableError.message)
      } else {
        console.log('📋 Resultado de pg_tables:')
        console.log(JSON.stringify(tableData, null, 2))
        
        if (tableData.length > 0) {
          const rlsEnabled = tableData[0].rowsecurity
          console.log(`\n🔐 RLS Habilitado: ${rlsEnabled ? '✅ SÍ' : '❌ NO'}`)
          
          if (!rlsEnabled) {
            console.log('\n💡 SOLUCIÓN: RLS no está habilitado. Ejecuta:')
            console.log('ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;')
          }
        }
      }
    } else {
      console.log('✅ Estado RLS obtenido:', rlsInfo)
    }
    
    // 2. Listar todas las políticas existentes
    console.log('\n🛡️  2. Verificando políticas existentes...')
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual, with_check')
      .eq('tablename', 'system_configurations')
      .order('policyname')
    
    if (policiesError) {
      console.error('❌ Error consultando políticas:', policiesError.message)
    } else {
      console.log(`📋 Se encontraron ${policies.length} políticas:`)
      
      if (policies.length === 0) {
        console.log('   ❌ NINGUNA - Esto explica el error 42501')
        console.log('\n💡 SOLUCIÓN: Las políticas no se crearon. Re-ejecuta el SQL:')
        console.log('   1. Abre database/apply_rls_fix.sql')
        console.log('   2. Copia TODO el contenido')
        console.log('   3. Pégalo en Supabase > SQL Editor > RUN')
      } else {
        policies.forEach((policy, i) => {
          console.log(`\n   ${i + 1}. ${policy.policyname}`)
          console.log(`      Comando: ${policy.cmd}`)
          console.log(`      Roles: ${policy.roles}`)
          console.log(`      Tipo: ${policy.permissive}`)
        })
      }
    }
    
    // 3. Intentar insertar con service_role (debe funcionar)
    console.log('\n🧪 3. Probando inserción con service_role...')
    const testData = {
      user_id: null,
      scope: 'global',
      company_id: null,
      category: 'system',
      config_key: 'rls_diagnostic_test',
      config_value: 'test_value',
      description: 'Prueba de diagnóstico RLS',
      is_active: true,
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('system_configurations')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('❌ ERROR incluso con service_role:', insertError.message)
      console.error('   Esto indica un problema más grave en la tabla')
    } else {
      console.log('✅ Inserción con service_role: EXITOSA')
      
      // Limpiar
      await supabaseAdmin
        .from('system_configurations')
        .delete()
        .eq('config_key', 'rls_diagnostic_test')
    }
    
    // 4. Intentar con cliente normal (debe fallar si no hay políticas)
    console.log('\n🧪 4. Probando inserción con cliente normal...')
    const supabaseNormal = createClient(supabaseUrl, process.env.REACT_APP_SUPABASE_ANON_KEY)
    
    const { error: normalError } = await supabaseNormal
      .from('system_configurations')
      .insert({
        ...testData,
        config_key: 'rls_normal_test'
      })
    
    if (normalError) {
      console.log('❌ Inserción con cliente normal: FALLIDA (esperado sin políticas)')
      console.log('   Error:', normalError.message)
    } else {
      console.log('✅ Inserción con cliente normal: EXITOSA (las políticas funcionan)')
      // Limpiar
      await supabaseNormal
        .from('system_configurations')
        .delete()
        .eq('config_key', 'rls_normal_test')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DEL DIAGNÓSTICO')
    console.log('='.repeat(60))
    
    if (policies.length === 0) {
      console.log('\n❌ PROBLEMA CONFIRMADO: No hay políticas RLS creadas')
      console.log('\n🔧 SOLUCIÓN INMEDIATA:')
      console.log('   1. Abre el archivo: database/apply_rls_fix.sql')
      console.log('   2. Selecciona TODO el contenido (Ctrl+A)')
      console.log('   3. Copia (Ctrl+C)')
      console.log('   4. Ve a Supabase > SQL Editor')
      console.log('   5. PEGA (Ctrl+V) en el editor')
      console.log('   6. Haz clic en RUN (botón verde)')
      console.log('   7. Verifica que aparezca "Success"')
    } else {
      console.log('\n✅ POLÍTICAS ENCONTRADAS: Las políticas están creadas')
      console.log('\n🔍 PROBLEMA POSIBLE:')
      console.log('   - Las políticas no son permisivas suficiente')
      console.log('   - El usuario no está autenticado correctamente')
      console.log('\n💡 PRÓXIMO PASO: Ejecuta el SQL simplificado abajo')
    }
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
    console.error(error.stack)
  }
}

diagnoseRLSStatus().catch(console.error)