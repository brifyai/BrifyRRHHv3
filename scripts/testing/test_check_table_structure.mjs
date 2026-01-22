#!/usr/bin/env node

// Script para verificar la estructura real de las tablas
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🔍 VERIFICANDO ESTRUCTURA DE TABLAS')
console.log('====================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  try {
    // 1. Verificar estructura de communication_logs
    console.log('1. ESTRUCTURA DE COMMUNICATION_LOGS:')
    const { data: logsSample, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .limit(1)

    if (logsError) {
      console.log('❌ Error:', logsError.message)
    } else if (logsSample && logsSample.length > 0) {
      console.log('✅ Columnas encontradas:', Object.keys(logsSample[0]))
    } else {
      console.log('⚠️ Tabla vacía, verificando con RPC...')
      // Intentar obtener estructura con RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_columns', {
        table_name: 'communication_logs'
      })
      
      if (rpcError) {
        console.log('❌ Error RPC:', rpcError.message)
      } else {
        console.log('✅ Columnas (via RPC):', rpcData)
      }
    }

    // 2. Verificar estructura de employees
    console.log('\n2. ESTRUCTURA DE EMPLOYEES:')
    const { data: employeesSample, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(1)

    if (employeesError) {
      console.log('❌ Error:', employeesError.message)
    } else if (employeesSample && employeesSample.length > 0) {
      console.log('✅ Columnas encontradas:', Object.keys(employeesSample[0]))
    }

    // 3. Intentar insertar con columnas mínimas
    console.log('\n3. PROBANDO INSERT CON COLUMNAS MÍNIMAS...')
    
    // Obtener una empresa
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    if (companies && companies.length > 0) {
      const companyId = companies[0].id
      
      // Intentar insertar solo con columnas básicas
      const minimalLog = {
        company_id: companyId,
        status: 'sent',
        created_at: new Date().toISOString()
      }

      const { data: inserted, error: insertError } = await supabase
        .from('communication_logs')
        .insert([minimalLog])
        .select()

      if (insertError) {
        console.log('❌ Error insertando:', insertError.message)
        console.log('   Detalles:', insertError.details)
        
        // Verificar qué columnas son requeridas
        console.log('\n4. COLUMNAS REQUERIDAS:')
        console.log('   Intentando obtener esquema...')
        
        // Query para ver información de la tabla
        const { data: tableInfo, error: infoError } = await supabase.rpc('get_table_info', {
          table_name: 'communication_logs'
        })
        
        if (infoError) {
          console.log('   ❌ No se pudo obtener info de tabla')
        } else {
          console.log('   ✅ Info de tabla:', tableInfo)
        }
        
      } else {
        console.log('✅ Insertado con éxito:', inserted[0])
        
        // Limpiar
        await supabase
          .from('communication_logs')
          .delete()
          .eq('id', inserted[0].id)
      }
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA')
    console.log('==========================')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTableStructure()