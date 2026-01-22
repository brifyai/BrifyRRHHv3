#!/usr/bin/env node

// Script de diagnóstico para verificar filtrado por empresa
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🔍 DIAGNÓSTICO DE FILTRADO POR EMPRESA')
console.log('========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseCompanyFilter() {
  try {
    // 1. Verificar empresas en la base de datos
    console.log('1. VERIFICANDO EMPRESAS EN BASE DE DATOS...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError)
      return
    }

    console.log(`✅ Empresas encontradas: ${companies.length}`)
    companies.forEach(company => {
      console.log(`   - ID: ${company.id} | Nombre: ${company.name}`)
    })
    console.log('')

    // 2. Verificar registros de comunicación
    console.log('2. VERIFICANDO REGISTROS DE COMUNICACIÓN...')
    const { data: logs, error: logsError } = await supabase
      .from('communication_logs')
      .select('*')
      .limit(100)

    if (logsError) {
      console.error('❌ Error obteniendo communication_logs:', logsError)
      console.log('   Mensaje:', logsError.message)
      console.log('   Código:', logsError.code)
      console.log('   Detalles:', logsError.details)
      return
    }

    console.log(`✅ Total de logs encontrados: ${logs.length}`)
    
    // 3. Verificar distribución por empresa
    console.log('\n3. DISTRIBUCIÓN POR EMPRESA:')
    const distribution = {}
    logs.forEach(log => {
      const companyId = log.company_id || 'sin_empresa'
      distribution[companyId] = (distribution[companyId] || 0) + 1
    })

    for (const [companyId, count] of Object.entries(distribution)) {
      if (companyId === 'sin_empresa') {
        console.log(`   - Sin empresa asignada: ${count} logs`)
      } else {
        const company = companies.find(c => c.id === companyId)
        const companyName = company ? company.name : 'Empresa no encontrada'
        console.log(`   - ${companyName} (ID: ${companyId}): ${count} logs`)
      }
    }

    // 4. Verificar estructura de logs
    if (logs.length > 0) {
      console.log('\n4. ESTRUCTURA DE UN LOG DE EJEMPLO:')
      const sampleLog = logs[0]
      console.log('   Campos disponibles:', Object.keys(sampleLog))
      console.log('   company_id:', sampleLog.company_id)
      console.log('   status:', sampleLog.status)
      console.log('   channel_id:', sampleLog.channel_id)
      console.log('   created_at:', sampleLog.created_at)
    }

    // 5. Probar filtrado por una empresa específica
    if (companies.length > 0) {
      const testCompany = companies[0]
      console.log(`\n5. PROBANDO FILTRADO POR EMPRESA: ${testCompany.name}`)
      
      const { data: filteredLogs, error: filteredError } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('company_id', testCompany.id)

      if (filteredError) {
        console.error('❌ Error en filtrado:', filteredError)
      } else {
        console.log(`✅ Logs filtrados para ${testCompany.name}: ${filteredLogs.length}`)
        
        if (filteredLogs.length > 0) {
          const metrics = {
            total: filteredLogs.length,
            sent: filteredLogs.filter(log => log.status === 'sent').length,
            read: filteredLogs.filter(log => log.status === 'read').length,
            delivered: filteredLogs.filter(log => log.status === 'delivered').length,
            failed: filteredLogs.filter(log => log.status === 'failed').length
          }
          
          console.log('   Métricas calculadas:')
          console.log(`   - Total: ${metrics.total}`)
          console.log(`   - Enviados: ${metrics.sent}`)
          console.log(`   - Leídos: ${metrics.read}`)
          console.log(`   - Entregados: ${metrics.delivered}`)
          console.log(`   - Fallidos: ${metrics.failed}`)
          
          if (metrics.total > 0) {
            const readRate = ((metrics.read / metrics.total) * 100).toFixed(1)
            const engagementRate = (((metrics.sent + metrics.read) / metrics.total) * 100).toFixed(1)
            console.log(`   - Tasa de lectura: ${readRate}%`)
            console.log(`   - Engagement: ${engagementRate}%`)
          }
        }
      }
    }

    // 6. Verificar empleados por empresa
    console.log('\n6. VERIFICANDO EMPLEADOS POR EMPRESA:')
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, company_id')
      .limit(50)

    if (employeesError) {
      console.error('❌ Error obteniendo empleados:', employeesError)
    } else {
      const employeeDistribution = {}
      employees.forEach(emp => {
        const companyId = emp.company_id || 'sin_empresa'
        employeeDistribution[companyId] = (employeeDistribution[companyId] || 0) + 1
      })

      for (const [companyId, count] of Object.entries(employeeDistribution)) {
        if (companyId === 'sin_empresa') {
          console.log(`   - Sin empresa asignada: ${count} empleados`)
        } else {
          const company = companies.find(c => c.id === companyId)
          const companyName = company ? company.name : 'Empresa no encontrada'
          console.log(`   - ${companyName}: ${count} empleados`)
        }
      }
    }

    console.log('\n✅ DIAGNÓSTICO COMPLETADO')
    console.log('==========================')

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
  }
}

diagnoseCompanyFilter()