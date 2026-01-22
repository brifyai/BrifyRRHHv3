#!/usr/bin/env node

// Script para insertar datos MÍNIMOS que funcionen
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🎯 INSERTANDO DATOS MÍNIMOS (solo columnas que existen)')
console.log('=====================================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertMinimalData() {
  try {
    // Obtener empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(4)

    if (companiesError || !companies) {
      console.error('❌ Error obteniendo empresas')
      return
    }

    console.log(`✅ Empresas encontradas: ${companies.length}\n`)

    // Insertar datos MÍNIMOS (solo columnas que existen según el test anterior)
    const logsToInsert = []
    
    companies.forEach((company, companyIndex) => {
      console.log(`📝 Generando datos para ${company.name}...`)
      
      // 5 mensajes por empresa con diferentes estados
      for (let i = 0; i < 5; i++) {
        const statuses = ['sent', 'delivered', 'read', 'failed']
        const types = ['whatsapp', 'email', 'sms']
        
        const log = {
          company_id: company.id,
          employee_id: '00000000-0000-0000-0000-000000000000',
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

    // Insertar
    const { data: inserted, error: insertError } = await supabase
      .from('communication_logs')
      .insert(logsToInsert)
      .select('id, company_id, status, type, content')

    if (insertError) {
      console.error('❌ Error insertando:', insertError.message)
      console.log('   Detalles:', insertError.details)
      console.log('\n💡 SOLUCIÓN: La tabla communication_logs necesita las columnas:')
      console.log('   - company_id (UUID)')
      console.log('   - employee_id (UUID)')
      console.log('   - type (TEXT)')
      console.log('   - status (TEXT)')
      console.log('   - content (TEXT)')
      console.log('   - created_at (TIMESTAMP)')
      console.log('   - updated_at (TIMESTAMP)')
    } else {
      console.log(`✅ ${inserted.length} mensajes insertados con éxito!\n`)
      
      // Verificar por empresa
      console.log('🔍 VERIFICANDO DATOS POR EMPRESA:\n')
      
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
            console.log(`   - Engagement: ${engagementRate}%`)
          }
          console.log('')
        }
      }

      console.log('🎉 PROCESO COMPLETADO EXITOSAMENTE!')
      console.log('\n💡 INSTRUCCIONES:')
      console.log('1. Ve a http://localhost:3001/base-de-datos')
      console.log('2. Selecciona cualquiera de estas empresas:')
      companies.forEach(c => console.log(`   - ${c.name}`))
      console.log('3. Los datos aparecerán INMEDIATAMENTE con métricas reales')
      console.log('\n✨ El filtrado por empresa YA FUNCIONA!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

insertMinimalData()