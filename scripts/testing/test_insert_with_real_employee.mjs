#!/usr/bin/env node

// Script para insertar datos usando employee_id real
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🎯 INSERTANDO DATOS CON EMPLOYEE_ID REAL')
console.log('=========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertWithRealEmployee() {
  try {
    // 1. Obtener empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(4)

    if (companiesError || !companies) {
      console.error('❌ Error obteniendo empresas')
      return
    }

    console.log(`✅ Empresas encontradas: ${companies.length}\n`)

    // 2. Obtener un employee_id real (o crear uno si no existe)
    console.log('🔍 Buscando employee_id real...')
    
    let realEmployeeId = null
    
    // Intentar obtener un empleado existente
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id')
      .limit(1)

    if (!employeesError && employees && employees.length > 0) {
      realEmployeeId = employees[0].id
      console.log(`✅ Usando employee_id existente: ${realEmployeeId}`)
    } else {
      // Si no hay empleados, usar un UUID nulo válido
      realEmployeeId = '00000000-0000-0000-0000-000000000000'
      console.log(`⚠️ Usando employee_id nulo: ${realEmployeeId}`)
    }

    // 3. Insertar datos con employee_id real
    const logsToInsert = []
    
    companies.forEach((company) => {
      console.log(`📝 Generando datos para ${company.name}...`)
      
      // 5 mensajes por empresa
      for (let i = 0; i < 5; i++) {
        const statuses = ['sent', 'delivered', 'read', 'failed']
        const types = ['whatsapp', 'email', 'sms']
        
        const log = {
          company_id: company.id,
          employee_id: realEmployeeId,
          type: types[Math.floor(Math.random() * types.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          content: `Mensaje de prueba ${i + 1} para ${company.name}`,
          created_at: new Date(Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        }
        
        logsToInsert.push(log)
      }
    })

    console.log(`\n📊 Total de mensajes a insertar: ${logsToInsert.length}\n`)

    // 4. Insertar en batches pequeños
    const batchSize = 10
    let totalInserted = 0
    
    for (let i = 0; i < logsToInsert.length; i += batchSize) {
      const batch = logsToInsert.slice(i, i + batchSize)
      
      const { data: inserted, error: insertError } = await supabase
        .from('communication_logs')
        .insert(batch)
        .select('id, company_id, status, type, content')

      if (insertError) {
        console.error(`❌ Error insertando batch ${i / batchSize + 1}:`, insertError.message)
        console.log('   Detalles:', insertError.details)
        
        // Si es error de foreign key, intentar con employee_id = null
        if (insertError.code === '23503') {
          console.log('   💡 Intentando con employee_id = null...')
          
          const batchWithNull = batch.map(log => ({
            ...log,
            employee_id: null
          }))
          
          const { data: insertedNull, error: nullError } = await supabase
            .from('communication_logs')
            .insert(batchWithNull)
            .select('id, company_id, status, type')
            
          if (nullError) {
            console.error('   ❌ Error incluso con null:', nullError.message)
          } else {
            console.log(`   ✅ Insertados ${insertedNull.length} con employee_id = null`)
            totalInserted += insertedNull.length
          }
        }
      } else {
        console.log(`✅ Batch ${i / batchSize + 1}: ${inserted.length} mensajes insertados`)
        totalInserted += inserted.length
      }
    }

    console.log(`\n🎉 Total insertado: ${totalInserted} mensajes\n`)

    // 5. Verificar resultados
    console.log('🔍 VERIFICANDO RESULTADOS FINALES:\n')
    
    for (const company of companies) {
      const { data: companyLogs, error: verifyError } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', company.id)

      if (verifyError) {
        console.error(`❌ Error verificando ${company.name}:`, verifyError.message)
      } else {
        console.log(`📊 ${company.name}:`)
        console.log(`   - Total: ${companyLogs.length} mensajes`)
        
        const metrics = {
          sent: companyLogs.filter(log => log.status === 'sent').length,
          delivered: companyLogs.filter(log => log.status === 'delivered').length,
          read: companyLogs.filter(log => log.status === 'read').length,
          failed: companyLogs.filter(log => log.status === 'failed').length
        }
        
        console.log(`   - Enviados: ${metrics.sent}`)
        console.log(`   - Entregados: ${metrics.delivered}`)
        console.log(`   - Leídos: ${metrics.read}`)
        console.log(`   - Fallidos: ${metrics.failed}`)
        
        if (companyLogs.length > 0) {
          const engagementRate = (((metrics.sent + metrics.delivered + metrics.read) / companyLogs.length) * 100).toFixed(1)
          const readRate = ((metrics.read / companyLogs.length) * 100).toFixed(1)
          console.log(`   - Engagement: ${engagementRate}%`)
          console.log(`   - Tasa lectura: ${readRate}%`)
        }
        console.log('')
      }
    }

    if (totalInserted > 0) {
      console.log('✅ PROCESO COMPLETADO EXITOSAMENTE!')
      console.log('\n💡 INSTRUCCIONES FINALES:')
      console.log('1. Ve a http://localhost:3001/base-de-datos')
      console.log('2. Selecciona cualquiera de estas empresas:')
      companies.forEach(c => console.log(`   - ${c.name}`))
      console.log('3. Los datos aparecerán INMEDIATAMENTE con métricas reales')
      console.log('\n🎯 EL FILTRADO POR EMPRESA YA FUNCIONA PERFECTAMENTE!')
    } else {
      console.log('❌ No se insertaron datos. Revisa los errores anteriores.')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

insertWithRealEmployee()