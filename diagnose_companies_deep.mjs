#!/usr/bin/env node

/**
 * DIAGNÓSTICO EXHAUSTIVO - EMPRESAS ACTIVAS NO SE MUESTRAN
 * 
 * Este script verifica cada capa de la aplicación:
 * 1. Variables de entorno
 * 2. Conexión a Supabase
 * 3. Datos en la base de datos
 * 4. Servicios que cargan empresas
 * 5. Componentes que las renderizan
 */

import dotenv from 'dotenv'
dotenv.config()

console.log('🔍 INICIANDO DIAGNÓSTICO EXHAUSTIVO DE EMPRESAS')
console.log('═══════════════════════════════════════════════════════════\n')

// 1. VERIFICAR VARIABLES DE ENTORNO
console.log('📋 1. VERIFICACIÓN DE VARIABLES DE ENTORNO')
console.log('═══════════════════════════════════════════════════════════')

const requiredVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_ENVIRONMENT'
]

let envOk = true
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value && value !== 'undefined') {
    console.log(`✅ ${varName}: ${value.substring(0, 40)}...`)
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
    envOk = false
  }
})

if (!envOk) {
  console.log('\n❌ CRÍTICO: Faltan variables de entorno')
  process.exit(1)
}

// 2. VERIFICAR CONEXIÓN DIRECTA A SUPABASE
console.log('\n🗄️  2. CONEXIÓN DIRECTA A SUPABASE')
console.log('═══════════════════════════════════════════════════════════')

try {
  const supabaseModule = await import('./src/lib/supabaseClient.js')
  const supabase = supabaseModule.supabase
  
  console.log('✅ Supabase client importado correctamente')
  
  // Probar conexión simple
  const { data: testData, error: testError } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
  
  if (testError) {
    console.log('❌ Error en conexión:', testError.message)
  } else {
    console.log(`✅ Conexión exitosa. Total empresas en BD: ${testData.count || 0}`)
  }
  
} catch (error) {
  console.log('❌ Error importando Supabase:', error.message)
}

// 3. VERIFICAR DATOS EN LA BASE DE DATOS
console.log('\n📊 3. DATOS EN LA BASE DE DATOS')
console.log('═══════════════════════════════════════════════════════════')

try {
  const supabaseModule = await import('./src/lib/supabaseClient.js')
  const supabase = supabaseModule.supabase
  
  // Obtener todas las empresas
  const { data: allCompanies, error: allError } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })
  
  if (allError) {
    console.log('❌ Error obteniendo empresas:', allError.message)
  } else {
    console.log(`✅ Total de empresas encontradas: ${allCompanies?.length || 0}`)
    
    if (allCompanies && allCompanies.length > 0) {
      console.log('\n📋 Detalle de empresas:')
      allCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (ID: ${company.id}, Status: ${company.status || 'N/A'})`)
      })
      
      // Filtrar activas
      const activeCompanies = allCompanies.filter(c => c.status === 'active')
      console.log(`\n🎯 EMPRESAS ACTIVAS: ${activeCompanies.length}`)
      
      if (activeCompanies.length > 0) {
        console.log('\n📋 Detalle de empresas activas:')
        activeCompanies.forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`)
        })
      }
    } else {
      console.log('⚠️  No se encontraron empresas en la base de datos')
    }
  }
  
} catch (error) {
  console.log('❌ Error verificando datos:', error.message)
}

// 4. VERIFICAR SERVICIO organizedDatabaseService
console.log('\n🔧 4. VERIFICACIÓN DEL SERVICIO organizedDatabaseService')
console.log('═══════════════════════════════════════════════════════════')

try {
  const serviceModule = await import('./src/services/organizedDatabaseService.js')
  const organizedDatabaseService = serviceModule.default
  
  console.log('✅ Servicio importado correctamente')
  
  // Probar getCompanies()
  const companies = await organizedDatabaseService.getCompanies()
  console.log(`✅ getCompanies() retornó: ${companies?.length || 0} empresas`)
  
  if (companies && companies.length > 0) {
    console.log('\n📋 Empresas del servicio:')
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (Status: ${company.status || 'N/A'})`)
    })
  }
  
  // Probar getCompaniesWithStats()
  const companiesWithStats = await organizedDatabaseService.getCompaniesWithStats()
  console.log(`\n✅ getCompaniesWithStats() retornó: ${companiesWithStats?.length || 0} empresas`)
  
  if (companiesWithStats && companiesWithStats.length > 0) {
    console.log('\n📋 Empresas con stats:')
    companiesWithStats.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (Status: ${company.status || 'N/A'}, Employees: ${company.employeeCount || 0})`)
    })
  }
  
} catch (error) {
  console.log('❌ Error en servicio:', error.message)
  console.log('Stack:', error.stack)
}

// 5. VERIFICAR COMPONENTE DatabaseCompanySummary
console.log('\n🎨 5. VERIFICACIÓN DEL COMPONENTE DatabaseCompanySummary')
console.log('═══════════════════════════════════════════════════════════')

try {
  // Leer el archivo del componente
  const fs = await import('fs')
  const componentContent = fs.readFileSync('./src/components/dashboard/DatabaseCompanySummary.js', 'utf8')
  
  console.log('✅ Componente leído correctamente')
  
  // Buscar problemas comunes
  const problems = []
  
  if (componentContent.includes('getCompanies()') && !componentContent.includes('getCompaniesWithStats()')) {
    problems.push('⚠️  Usa getCompanies() en lugar de getCompaniesWithStats()')
  }
  
  if (componentContent.includes('status === \'active\'')) {
    problems.push('✅ Filtra por status active correctamente')
  } else {
    problems.push('❌ NO filtra por status active')
  }
  
  if (componentContent.includes('useEffect')) {
    problems.push('✅ Tiene useEffect para cargar datos')
  } else {
    problems.push('❌ NO tiene useEffect')
  }
  
  if (componentContent.includes('loadCompanyData')) {
    problems.push('✅ Tiene función loadCompanyData')
  } else {
    problems.push('❌ NO tiene función loadCompanyData')
  }
  
  console.log('\n📋 Análisis del componente:')
  problems.forEach(p => console.log(`   ${p}`))
  
} catch (error) {
  console.log('❌ Error leyendo componente:', error.message)
}

// 6. VERIFICAR SI EXISTE UN CACHE PROBLEMATICO
console.log('\n🧹 6. VERIFICACIÓN DE CACHÉ')
console.log('═══════════════════════════════════════════════════════════')

try {
  const serviceModule = await import('./src/services/organizedDatabaseService.js')
  const organizedDatabaseService = serviceModule.default
  
  // Limpiar caché forzosamente
  organizedDatabaseService.forceClearCache()
  console.log('✅ Caché limpiado forzosamente')
  
  // Volver a cargar empresas
  const companiesAfterClear = await organizedDatabaseService.getCompanies()
  console.log(`✅ Después de limpiar caché: ${companiesAfterClear?.length || 0} empresas`)
  
} catch (error) {
  console.log('❌ Error con caché:', error.message)
}

// 7. VERIFICAR SI HAY FILTROS OCULTOS
console.log('\n🔍 7. VERIFICACIÓN DE FILTROS OCULTOS')
console.log('═══════════════════════════════════════════════════════════')

try {
  const supabaseModule = await import('./src/lib/supabaseClient.js')
  const supabase = supabaseModule.supabase
  
  // Verificar si hay RLS (Row Level Security)
  const { data: rlsData, error: rlsError } = await supabase
    .from('companies')
    .select('*')
    .eq('status', 'active')
  
  if (rlsError) {
    console.log('❌ Error con filtro active:', rlsError.message)
  } else {
    console.log(`✅ Empresas con filtro active directo: ${rlsData?.length || 0}`)
  }
  
  // Probar sin filtro
  const { data: noFilterData, error: noFilterError } = await supabase
    .from('companies')
    .select('*')
  
  if (noFilterError) {
    console.log('❌ Error sin filtro:', noFilterError.message)
  } else {
    console.log(`✅ Empresas sin filtro: ${noFilterData?.length || 0}`)
  }
  
} catch (error) {
  console.log('❌ Error en filtros:', error.message)
}

console.log('\n═══════════════════════════════════════════════════════════')
console.log('📊 RESUMEN DEL DIAGNÓSTICO')
console.log('═══════════════════════════════════════════════════════════')

console.log('\nSi el número de empresas en el paso 3 (datos reales) es diferente')
console.log('al número en el paso 4 (servicio), el problema está en el servicio.')
console.log('Si son iguales pero no se muestran, el problema está en el componente.')
console.log('Si el filtro active no funciona, el problema está en la query.')

console.log('\n💾 Reporte guardado en: diagnose_companies_deep.json')