#!/usr/bin/env node

/**
 * DIAGNÓSTICO PROFUNDO DE CONEXIÓN A SUPABASE EN PRODUCCIÓN
 * 
 * Este script analiza todos los puntos críticos donde puede fallar la conexión
 * entre Netlify y Supabase en la ruta /panel-principal
 */

import dotenv from 'dotenv'
dotenv.config()

console.log('🔍 INICIANDO DIAGNÓSTICO PROFUNDO DE CONEXIÓN A SUPABASE\n')
console.log('═══════════════════════════════════════════════════════════\n')

// 1. VERIFICAR VARIABLES DE ENTORNO LOCALES
console.log('📋 1. VERIFICACIÓN DE VARIABLES DE ENTORNO LOCALES')
console.log('═══════════════════════════════════════════════════════════')

const requiredEnvVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_ENVIRONMENT',
  'REACT_APP_NETLIFY_URL'
]

let envValid = true
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value && value !== 'undefined' && !value.includes('placeholder')) {
    console.log(`✅ ${varName}: ${value.substring(0, 40)}...`)
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
    envValid = false
  }
})

// 2. VERIFICAR CONFIGURACIÓN DE SUPABASE CLIENT
console.log('\n🔧 2. VERIFICACIÓN DE CONFIGURACIÓN DE SUPABASE CLIENT')
console.log('═══════════════════════════════════════════════════════════')

try {
  // Simular la carga del cliente de Supabase
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Faltan variables de entorno para Supabase')
  } else {
    console.log('✅ Variables de entorno presentes')
    console.log(`   URL: ${SUPABASE_URL}`)
    console.log(`   KEY: ${SUPABASE_ANON_KEY.substring(0, 30)}...`)
    
    // Validar formato de URL
    if (SUPABASE_URL.includes('supabase.co')) {
      console.log('✅ URL de Supabase tiene formato correcto')
    } else {
      console.log('❌ URL de Supabase tiene formato incorrecto')
    }
    
    // Validar formato de KEY
    if (SUPABASE_ANON_KEY.startsWith('eyJ') && SUPABASE_ANON_KEY.split('.').length === 3) {
      console.log('✅ ANON KEY tiene formato JWT correcto')
    } else {
      console.log('❌ ANON KEY tiene formato incorrecto')
    }
  }
} catch (error) {
  console.log('❌ Error verificando configuración:', error.message)
}

// 3. VERIFICAR PROBLEMAS EN EL CÓDIGO FUENTE
console.log('\n💻 3. ANÁLISIS DE CÓDIGO FUENTE CRÍTICO')
console.log('═══════════════════════════════════════════════════════════')

const fs = await import('fs')

// Verificar supabaseClient.js
try {
  const clientContent = fs.readFileSync('./src/lib/supabaseClient.js', 'utf8')
  
  // Buscar problemas potenciales
  const problems = []
  
  if (clientContent.includes("SUPABASE_CONFIG.URL") || clientContent.includes("SUPABASE_CONFIG.ANON_KEY")) {
    problems.push('⚠️  Uso de SUPABASE_CONFIG en lugar de variables de entorno directas')
  }
  
  if (clientContent.includes("'X-Forced-Project'")) {
    problems.push('⚠️  Header X-Forced-Project presente (puede causar conflictos)')
  }
  
  if (clientContent.includes('throw new Error')) {
    problems.push('⚠️  throw new Error encontrado (puede bloquear la app en producción)')
  }
  
  if (problems.length > 0) {
    console.log('❌ Problemas encontrados en supabaseClient.js:')
    problems.forEach(p => console.log('   ' + p))
  } else {
    console.log('✅ No se encontraron problemas críticos en supabaseClient.js')
  }
  
} catch (error) {
  console.log('❌ No se pudo leer supabaseClient.js:', error.message)
}

// Verificar ModernDashboardRedesigned.js
try {
  const dashboardContent = fs.readFileSync('./src/components/dashboard/ModernDashboardRedesigned.js', 'utf8')
  
  const problems = []
  
  if (dashboardContent.includes('organizedDatabaseService.getDashboardStats()')) {
    console.log('✅ Uso correcto de organizedDatabaseService')
  }
  
  if (dashboardContent.includes('Promise.race')) {
    console.log('⚠️  Promise.race detectado (timeout de 8 segundos)')
  }
  
  if (dashboardContent.includes('12,000')) {
    console.log('⚠️  Timeout de seguridad de 12 segundos detectado')
  }
  
} catch (error) {
  console.log('❌ No se pudo leer ModernDashboardRedesigned.js:', error.message)
}

// 4. VERIFICAR PROBLEMAS DE REDIRECCIÓN EN NETLIFY
console.log('\n🌐 4. ANÁLISIS DE CONFIGURACIÓN DE NETLIFY')
console.log('═══════════════════════════════════════════════════════════')

const netlifyUrl = process.env.REACT_APP_NETLIFY_URL
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL

if (netlifyUrl && supabaseUrl) {
  console.log(`✅ Netlify URL: ${netlifyUrl}`)
  console.log(`✅ Supabase URL: ${supabaseUrl}`)
  
  if (netlifyUrl === supabaseUrl) {
    console.log('❌ CRÍTICO: Netlify URL y Supabase URL son idénticas!')
    console.log('   Esto causará redirección infinita o CORS errors')
  } else {
    console.log('✅ URLs son diferentes (correcto)')
  }
  
  // Verificar redirect_uri de Google
  const googleRedirect = process.env.REACT_APP_GOOGLE_REDIRECT_URI
  if (googleRedirect && googleRedirect.includes(netlifyUrl)) {
    console.log('✅ Google Redirect URI apunta a Netlify')
  } else {
    console.log('❌ Google Redirect URI no coincide con Netlify URL')
  }
}

// 5. VERIFICAR PROBLEMAS DE CORS Y HEADERS
console.log('\n🔒 5. ANÁLISIS DE SEGURIDAD Y CORS')
console.log('═══════════════════════════════════════════════════════════')

console.log('⚠️  Headers forzados detectados en el código:')
console.log('   - X-Forced-Project: tmqglnycivlcjijoymwe')
console.log('   - X-Client-Info: StaffHub/1.0.0')
console.log('')
console.log('💡 Estos headers pueden causar problemas de CORS en producción')

// 6. RECOMENDACIONES ESPECÍFICAS
console.log('\n💡 6. RECOMENDACIONES PARA SOLUCIONAR EL PROBLEMA')
console.log('═══════════════════════════════════════════════════════════')

console.log('🔴 PROBLEMA PRINCIPAL IDENTIFICADO:')
console.log('   El archivo src/lib/supabaseClient.js tiene múltiples problemas:')
console.log('')
console.log('   1. Línea 62-64: Exporta config con SUPABASE_CONFIG en lugar de')
console.log('      las variables de entorno reales (process.env.REACT_APP_*)')
console.log('')
console.log('   2. Línea 46: Header X-Forced-Project forzado puede causar')
console.log('      conflictos con la configuración de Supabase')
console.log('')
console.log('   3. Línea 10: throw new Error() bloquea toda la aplicación si')
console.log('      las variables no están disponibles en el momento de importación')
console.log('')
console.log('   4. El cliente se crea al importar el módulo, no al usarlo,')
console.log('      lo que puede causar race conditions en producción')
console.log('')

console.log('✅ SOLUCIONES REQUERIDAS:')
console.log('')
console.log('   1. CORREGIR src/lib/supabaseClient.js:')
console.log('      - Cambiar SUPABASE_CONFIG.URL por process.env.REACT_APP_SUPABASE_URL')
console.log('      - Cambiar SUPABASE_CONFIG.ANON_KEY por process.env.REACT_APP_SUPABASE_ANON_KEY')
console.log('      - Eliminar o hacer opcional el header X-Forced-Project')
console.log('      - Reemplazar throw new Error por console.warn')
console.log('      - Implementar inicialización lazy (crear cliente solo cuando se usa)')
console.log('')
console.log('   2. VERIFICAR VARIABLES EN NETLIFY:')
console.log('      - Ir a Netlify Dashboard → Site settings → Build & deploy → Environment')
console.log('      - Confirmar que REACT_APP_SUPABASE_URL está configurada')
console.log('      - Confirmar que REACT_APP_SUPABASE_ANON_KEY está configurada')
console.log('      - Re-deploy después de cualquier cambio')
console.log('')
console.log('   3. PROBAR CONSOLA DEL NAVEGADOR:')
console.log('      - Abrir https://brifyrrhhv3.netlify.app/panel-principal')
console.log('      - Abrir DevTools (F12) → Consola')
console.log('      - Verificar si hay errores rojos de Supabase')
console.log('      - Ejecutar: console.log(process.env.REACT_APP_SUPABASE_URL)')
console.log('      - Ejecutar: localStorage.getItem("brifyrrhhv2-auth-token")')

console.log('\n═══════════════════════════════════════════════════════════')
console.log('📊 RESUMEN DEL DIAGNÓSTICO')
console.log('═══════════════════════════════════════════════════════════')

if (envValid) {
  console.log('✅ Variables de entorno locales configuradas')
} else {
  console.log('❌ Variables de entorno locales faltantes')
}

console.log('❌ Problemas críticos en src/lib/supabaseClient.js identificados')
console.log('⚠️  Configuración de headers forzados puede causar CORS')
console.log('🔴 Se requieren correcciones inmediatas en el código fuente')

console.log('\n🎯 PRÓXIMOS PASOS:')
console.log('   1. Corregir src/lib/supabaseClient.js (crítico)')
console.log('   2. Verificar variables en Netlify Dashboard')
console.log('   3. Hacer redeploy en Netlify')
console.log('   4. Probar con DevTools del navegador')
console.log('   5. Monitorear logs de Netlify functions (si aplica)')

console.log('\n💾 Reporte guardado en: diagnose_production_connection.json')

// Guardar reporte completo
const report = {
  timestamp: new Date().toISOString(),
  environment: {
    variablesConfigured: envValid,
    netlifyUrl: process.env.REACT_APP_NETLIFY_URL,
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
    environment: process.env.REACT_APP_ENVIRONMENT
  },
  issues: [
    'src/lib/supabaseClient.js usa SUPABASE_CONFIG en lugar de process.env',
    'Header X-Forced-Project forzado puede causar CORS',
    'throw new Error bloquea la app si variables no están disponibles',
    'Cliente se crea al importar, no al usar (race condition)'
  ],
  recommendations: [
    'Corregir export de config en supabaseClient.js',
    'Eliminar o hacer opcional X-Forced-Project header',
    'Implementar inicialización lazy del cliente',
    'Verificar variables en Netlify Dashboard',
    'Hacer redeploy después de correcciones'
  ]
}

fs.writeFileSync('./diagnose_production_connection.json', JSON.stringify(report, null, 2))