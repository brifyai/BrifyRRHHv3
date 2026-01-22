#!/usr/bin/env node

// Script para insertar datos de prueba y verificar estructura
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🔧 INSERTANDO DATOS DE PRUEBA')
console.log('==============================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertSampleData() {
  try {
    // 1. Verificar estructura de employees
    console.log('1. VERIFICANDO ESTRUCTURA DE EMPLOYEES...')
    const { data: employeeSample, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .limit(1)

    if (employeeError) {
      console.log('❌ Error obteniendo employees:', employeeError.message)
      // Intentar con otra estructura
      const { data: altEmployees } = await supabase
        .from('employees')
        .select('id, full_name, company_id, email')
        .limit(1)
      
      if (altEmployees && altEmployees.length > 0) {
        console.log('✅ Estructura alternativa encontrada:', Object.keys(altEmployees[0]))
      }
    } else if (employeeSample && employeeSample.length > 0) {
      console.log('✅ Estructura de employees:', Object.keys(employeeSample[0]))
    } else {
      console.log('⚠️ Tabla employees vacía')
    }

    // 2. Obtener una empresa para asociar datos
    console.log('\n2. OBTENIENDO EMPRESA DE PRUEBA...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ No se encontraron empresas')
      return
    }

    const testCompany = companies[0]
    console.log(`✅ Usando empresa: ${testCompany.name} (ID: ${testCompany.id})`)

    // 3. Insertar datos de prueba en communication_logs
    console.log('\n3. INSERTANDO DATOS DE PRUEBA EN COMMUNICATION_LOGS...')
    
    const sampleLogs = [
      {
        company_id: testCompany.id,
        employee_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
        channel_id: 'whatsapp',
        message_content: 'Mensaje de prueba 1',
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        company_id: testCompany.id,
        employee_id: '00000000-0000-0000-0000-000000000000',
        channel_id: 'whatsapp',
        message_content: 'Mensaje de prueba 2',
        status: 'read',
        created_at: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
        updated_at: new Date().toISOString(),
        read_at: new Date().toISOString()
      },
      {
        company_id: testCompany.id,
        employee_id: '00000000-0000-0000-0000-000000000000',
        channel_id: 'email',
        message_content: 'Mensaje de prueba 3',
        status: 'delivered',
        created_at: new Date(Date.now() - 7200000).toISOString(), // Hace 2 horas
        updated_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      }
    ]

    const { data: insertedLogs, error: insertError } = await supabase
      .from('communication_logs')
      .insert(sampleLogs)
      .select()

    if (insertError) {
      console.error('❌ Error insertando logs:', insertError)
      console.log('   Detalles:', insertError.details)
      console.log('   Mensaje:', insertError.message)
    } else {
      console.log(`✅ ${insertedLogs.length} logs de prueba insertados`)
      insertedLogs.forEach(log => {
        console.log(`   - ID: ${log.id} | Status: ${log.status} | Canal: ${log.channel_id}`)
      })
    }

    // 4. Verificar los datos insertados
    console.log('\n4. VERIFICANDO DATOS INSERTADOS...')
    const { data: verification, error: verifyError } = await supabase
      .from('communication_logs')
      .select('*')
      .eq('company_id', testCompany.id)

    if (verifyError) {
      console.error('❌ Error verificando:', verifyError)
    } else {
      console.log(`✅ Total de logs para ${testCompany.name}: ${verification.length}`)
      
      // Calcular métricas
      const metrics = {
        total: verification.length,
        sent: verification.filter(log => log.status === 'sent').length,
        read: verification.filter(log => log.status === 'read').length,
        delivered: verification.filter(log => log.status === 'delivered').length
      }
      
      console.log('   Métricas:')
      console.log(`   - Total: ${metrics.total}`)
      console.log(`   - Enviados: ${metrics.sent}`)
      console.log(`   - Leídos: ${metrics.read}`)
      console.log(`   - Entregados: ${metrics.delivered}`)
      
      if (metrics.total > 0) {
        const readRate = ((metrics.read / metrics.total) * 100).toFixed(1)
        console.log(`   - Tasa de lectura: ${readRate}%`)
      }
    }

    console.log('\n✅ PROCESO COMPLETADO')
    console.log('======================')
    console.log('\n💡 INSTRUCCIONES:')
    console.log('1. Refresca el navegador en http://localhost:3001/base-de-datos')
    console.log('2. Selecciona la empresa:', testCompany.name)
    console.log('3. Los datos ahora deberían aparecer con valores reales')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

insertSampleData()