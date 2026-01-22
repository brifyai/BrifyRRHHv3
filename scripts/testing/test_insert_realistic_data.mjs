#!/usr/bin/env node

// Script para insertar datos de prueba realistas en communication_logs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🎯 INSERTANDO DATOS REALISTAS DE PRUEBA')
console.log('=======================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Datos realistas de prueba
const companiesData = [
  { name: 'Aguas Andinas', id: '3d71dd17-bbf0-4c17-b93a-f08126b56978' },
  { name: 'Banco de Chile', id: '612c63cf-b859-499c-a34a-f1fcb455dc6d' },
  { name: 'Cencosud', id: 'f06e97ac-2a16-4606-a7cc-b7a6541df697' },
  { name: 'Entel', id: '908d5999-ed49-42b0-8d30-2231204dd0f2' }
]

const messageTemplates = [
  { type: 'whatsapp', content: 'Recordatorio: Reunión de equipo mañana a las 10:00 AM' },
  { type: 'email', content: 'Actualización importante sobre políticas de la empresa' },
  { type: 'whatsapp', content: 'Feliz cumpleaños! 🎉 Que tengas un gran día' },
  { type: 'sms', content: 'Código de verificación: 123456' },
  { type: 'email', content: 'Reporte mensual de performance disponible' }
]

const statuses = ['sent', 'delivered', 'read', 'failed']

async function insertRealisticData() {
  try {
    console.log('📋 OBTENIENDO EMPRESAS PARA INSERTAR DATOS...\n')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .in('name', companiesData.map(c => c.name))

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError)
      return
    }

    if (!companies || companies.length === 0) {
      console.error('❌ No se encontraron empresas')
      return
    }

    console.log(`✅ Empresas encontradas: ${companies.length}\n`)

    // Generar logs para cada empresa
    const logsToInsert = []
    const now = new Date()

    companies.forEach((company, companyIndex) => {
      console.log(`📝 Generando datos para ${company.name}...`)
      
      // Generar 10-15 mensajes por empresa
      const messageCount = 10 + Math.floor(Math.random() * 6)
      
      for (let i = 0; i < messageCount; i++) {
        const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const hoursAgo = Math.floor(Math.random() * 168) // Últimos 7 días
        
        const log = {
          company_id: company.id,
          employee_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
          type: template.type,
          status: status,
          content: template.content,
          created_at: new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Añadir timestamps según status
        if (status === 'delivered') {
          log.delivered_at = new Date(now.getTime() - ((hoursAgo - 1) * 60 * 60 * 1000)).toISOString()
        } else if (status === 'read') {
          log.delivered_at = new Date(now.getTime() - ((hoursAgo - 1) * 60 * 60 * 1000)).toISOString()
          log.read_at = new Date(now.getTime() - ((hoursAgo - 0.5) * 60 * 60 * 1000)).toISOString()
        }
        
        logsToInsert.push(log)
      }
    })

    console.log(`\n📊 Total de mensajes a insertar: ${logsToInsert.length}\n`)

    // Insertar en batches de 50
    const batchSize = 50
    for (let i = 0; i < logsToInsert.length; i += batchSize) {
      const batch = logsToInsert.slice(i, i + batchSize)
      
      const { data: inserted, error: insertError } = await supabase
        .from('communication_logs')
        .insert(batch)
        .select('id, company_id, status, type')

      if (insertError) {
        console.error(`❌ Error insertando batch ${i / batchSize + 1}:`, insertError.message)
      } else {
        console.log(`✅ Batch ${i / batchSize + 1}: ${inserted.length} mensajes insertados`)
      }
    }

    // Verificar inserción
    console.log('\n🔍 VERIFICANDO DATOS INSERTADOS...')
    
    for (const company of companies) {
      const { data: companyLogs, error: verifyError } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', company.id)

      if (verifyError) {
        console.error(`❌ Error verificando ${company.name}:`, verifyError.message)
      } else {
        const metrics = {
          total: companyLogs.length,
          sent: companyLogs.filter(log => log.status === 'sent').length,
          delivered: companyLogs.filter(log => log.status === 'delivered').length,
          read: companyLogs.filter(log => log.status === 'read').length,
          failed: companyLogs.filter(log => log.status === 'failed').length
        }

        console.log(`\n📈 ${company.name}:`)
        console.log(`   - Total: ${metrics.total} mensajes`)
        console.log(`   - Enviados: ${metrics.sent}`)
        console.log(`   - Entregados: ${metrics.delivered}`)
        console.log(`   - Leídos: ${metrics.read}`)
        console.log(`   - Fallidos: ${metrics.failed}`)
        
        if (metrics.total > 0) {
          const readRate = ((metrics.read / metrics.total) * 100).toFixed(1)
          const engagementRate = (((metrics.sent + metrics.read + metrics.delivered) / metrics.total) * 100).toFixed(1)
          console.log(`   - Tasa de lectura: ${readRate}%`)
          console.log(`   - Engagement: ${engagementRate}%`)
        }
      }
    }

    console.log('\n🎉 PROCESO COMPLETADO')
    console.log('======================')
    console.log('\n💡 INSTRUCCIONES:')
    console.log('1. Refresca el navegador en http://localhost:3001/base-de-datos')
    console.log('2. Selecciona cualquiera de las empresas:')
    companies.forEach(c => console.log(`   - ${c.name}`))
    console.log('3. Los datos ahora aparecerán con métricas reales')
    console.log('\n📊 Qué deberías ver:')
    console.log('- Engagement Rate: Porcentaje basado en mensajes leídos/entregados')
    console.log('- Tasa de Lectura: Mensajes leídos vs total')
    console.log('- Mensajes Enviados: Número total de comunicaciones')
    console.log('- Empleados: Total de empleados de la empresa')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

insertRealisticData()