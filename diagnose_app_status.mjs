#!/usr/bin/env node

/**
 * Diagnóstico completo del estado de la aplicación StaffHub
 * Ejecutar: node diagnose_app_status.mjs
 */

import { supabaseServer } from './src/lib/supabaseServer.js'
import { execSync } from 'child_process'
import fs from 'fs'

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE LA APLICACIÓN STAFFHUB\n')

async function diagnose() {
  const results = {
    git: {},
    database: {},
    environment: {},
    build: {},
    issues: []
  }

  try {
    // 1. DIAGNÓSTICO DE GIT
    console.log('📋 1. DIAGNÓSTICO DE GIT')
    console.log('═══════════════════════════════════════════════════════════')
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
      results.git.status = gitStatus || 'Limpio'
      console.log(`✅ Estado de Git: ${gitStatus || 'Limpio (no hay cambios pendientes)'}`)
      
      const lastCommit = execSync('git log --oneline -1', { encoding: 'utf8' }).trim()
      results.git.lastCommit = lastCommit
      console.log(`✅ Último commit: ${lastCommit}`)
      
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      results.git.branch = branch
      console.log(`✅ Rama actual: ${branch}`)
      
      const remote = execSync('git remote -v', { encoding: 'utf8' }).trim().split('\n')[0]
      results.git.remote = remote
      console.log(`✅ Remoto: ${remote}`)
      
    } catch (error) {
      console.log('❌ Error en diagnóstico de Git:', error.message)
      results.issues.push(`Git: ${error.message}`)
    }

    // 2. DIAGNÓSTICO DE BASE DE DATOS
    console.log('\n🗄️  2. DIAGNÓSTICO DE BASE DE DATOS')
    console.log('═══════════════════════════════════════════════════════════')
    try {
      // Verificar tablas principales
      const tables = ['companies', 'employees', 'folders', 'documents', 'communication_logs', 'users']
      for (const table of tables) {
        try {
          const { count, error } = await supabaseServer
            .from(table)
            .select('*', { count: 'exact', head: true })
          
          if (error) {
            console.log(`❌ Tabla ${table}: Error - ${error.message}`)
            results.issues.push(`DB ${table}: ${error.message}`)
          } else {
            console.log(`✅ Tabla ${table}: ${count || 0} registros`)
            results.database[table] = count || 0
          }
        } catch (error) {
          console.log(`❌ Tabla ${table}: Error de conexión - ${error.message}`)
          results.issues.push(`DB ${table}: ${error.message}`)
        }
      }

      // Verificar empresas específicamente
      const { data: companies, error: companiesError } = await supabaseServer
        .from('companies')
        .select('id, name, industry, status, created_at')
        .order('created_at', { ascending: false })
      
      if (companiesError) {
        console.log(`❌ Error obteniendo empresas: ${companiesError.message}`)
        results.issues.push(`Companies: ${companiesError.message}`)
      } else {
        console.log(`\n📊 EMPRESAS ENCONTRADAS: ${companies.length}`)
        if (companies.length > 0) {
          companies.slice(0, 5).forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} (${company.industry}) - ${company.status}`)
          })
          if (companies.length > 5) {
            console.log(`   ... y ${companies.length - 5} más`)
          }
        } else {
          console.log('⚠️  NO HAY EMPRESAS EN LA BASE DE DATOS')
          console.log('   💡 Solución: Ejecuta node seed_companies_server.mjs para crear empresas de ejemplo')
        }
        results.database.companiesList = companies
      }

    } catch (error) {
      console.log('❌ Error en diagnóstico de base de datos:', error.message)
      results.issues.push(`Database: ${error.message}`)
    }

    // 3. DIAGNÓSTICO DE VARIABLES DE ENTORNO
    console.log('\n🔧 3. DIAGNÓSTICO DE VARIABLES DE ENTORNO')
    console.log('═══════════════════════════════════════════════════════════')
    const envVars = [
      'REACT_APP_SUPABASE_URL',
      'REACT_APP_SUPABASE_ANON_KEY',
      'REACT_APP_GOOGLE_CLIENT_ID',
      'REACT_APP_ENVIRONMENT',
      'REACT_APP_NETLIFY_URL'
    ]
    
    envVars.forEach(varName => {
      const value = process.env[varName]
      if (value && value !== 'undefined' && !value.includes('placeholder')) {
        console.log(`✅ ${varName}: Configurada (${value.substring(0, 20)}...)`)
        results.environment[varName] = 'Configured'
      } else {
        console.log(`❌ ${varName}: No configurada o inválida`)
        results.environment[varName] = 'Missing/Invalid'
        results.issues.push(`Env ${varName}: Not configured`)
      }
    })

    // 4. DIAGNÓSTICO DE BUILD
    console.log('\n🏗️  4. DIAGNÓSTICO DE BUILD')
    console.log('═══════════════════════════════════════════════════════════')
    try {
      // Verificar si existe build
      const buildExists = fs.existsSync('./build')
      console.log(`✅ Directorio build: ${buildExists ? 'Existe' : 'No existe'}`)
      results.build.directoryExists = buildExists

      if (buildExists) {
        const buildSize = execSync('du -sh build 2>/dev/null || dir /s build | find "bytes"', { encoding: 'utf8' }).trim()
        console.log(`✅ Tamaño del build: ${buildSize}`)
        results.build.size = buildSize
      }

      // Verificar package.json
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
      console.log(`✅ Versión de la app: ${packageJson.version || 'No especificada'}`)
      console.log(`✅ Scripts disponibles: ${Object.keys(packageJson.scripts).join(', ')}`)
      results.build.version = packageJson.version
      results.build.scripts = Object.keys(packageJson.scripts)

    } catch (error) {
      console.log('❌ Error en diagnóstico de build:', error.message)
      results.issues.push(`Build: ${error.message}`)
    }

    // 5. RESUMEN DE PROBLEMAS CRÍTICOS
    console.log('\n🚨 5. RESUMEN DE PROBLEMAS CRÍTICOS')
    console.log('═══════════════════════════════════════════════════════════')
    
    if (results.issues.length === 0) {
      console.log('✅ NO SE ENCONTRARON PROBLEMAS CRÍTICOS')
      console.log('   La aplicación está lista para ejecutarse')
    } else {
      console.log(`❌ SE ENCONTRARON ${results.issues.length} PROBLEMAS:`)
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
    }

    // 6. RECOMENDACIONES ESPECÍFICAS
    console.log('\n💡 6. RECOMENDACIONES ESPECÍFICAS')
    console.log('═══════════════════════════════════════════════════════════')
    
    if (results.database.companies === 0) {
      console.log('🌱 RECOMENDACIÓN CRÍTICA:')
      console.log('   La base de datos no tiene empresas. Ejecuta:')
      console.log('   node seed_companies_server.mjs')
      console.log('   Para crear 5 empresas de ejemplo con configuraciones completas')
    }

    if (results.environment.REACT_APP_SUPABASE_URL === 'Missing/Invalid') {
      console.log('🔧 RECOMENDACIÓN CRÍTICA:')
      console.log('   Configura las variables de entorno de Supabase en el archivo .env')
    }

    if (results.git.status !== 'Limpio') {
      console.log('📋 RECOMENDACIÓN:')
      console.log('   Hay cambios pendientes en Git. Considera hacer commit:')
      console.log('   git add . && git commit -m "feat: tus cambios" && git push')
    }

    // 7. ESTADO GENERAL DE LA APLICACIÓN
    console.log('\n📊 7. ESTADO GENERAL DE LA APLICACIÓN')
    console.log('═══════════════════════════════════════════════════════════')
    
    const healthScore = calculateHealthScore(results)
    console.log(`🏥 Puntuación de salud: ${healthScore}/100`)
    
    if (healthScore >= 90) {
      console.log('🟢 ESTADO: EXCELENTE')
      console.log('   La aplicación está completamente funcional')
    } else if (healthScore >= 70) {
      console.log('🟡 ESTADO: BUENO')
      console.log('   La aplicación funciona con algunos problemas menores')
    } else if (healthScore >= 50) {
      console.log('🟠 ESTADO: REGULAR')
      console.log('   La aplicación tiene problemas significativos')
    } else {
      console.log('🔴 ESTADO: CRÍTICO')
      console.log('   La aplicación necesita atención inmediata')
    }

    console.log('\n📋 RESUMEN RÁPIDO:')
    console.log(`   - Git: ${results.git.branch || 'N/A'} - ${results.git.lastCommit || 'N/A'}`)
    console.log(`   - Empresas: ${results.database.companies || 0}`)
    console.log(`   - Empleados: ${results.database.employees || 0}`)
    console.log(`   - Problemas: ${results.issues.length}`)
    console.log(`   - Build: ${results.build.directoryExists ? 'Existe' : 'No existe'}`)

    // Guardar reporte
    fs.writeFileSync('./app_diagnosis_report.json', JSON.stringify(results, null, 2))
    console.log('\n💾 Reporte guardado en: app_diagnosis_report.json')

  } catch (error) {
    console.error('❌ Error fatal en el diagnóstico:', error)
  }
}

function calculateHealthScore(results) {
  let score = 100
  
  // Penalizaciones
  if (results.database.companies === 0) score -= 30
  if (results.issues.length > 0) score -= (results.issues.length * 5)
  if (!results.build.directoryExists) score -= 10
  if (results.git.status !== 'Limpio') score -= 5
  
  return Math.max(0, Math.min(100, score))
}

// Ejecutar diagnóstico
diagnose().catch(console.error)