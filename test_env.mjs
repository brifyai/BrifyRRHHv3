#!/usr/bin/env node

// Script de prueba para verificar variables de entorno
import dotenv from 'dotenv'

// Cargar .env manualmente
dotenv.config()

console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO\n')
console.log('═══════════════════════════════════════════════════════════')

const envVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_GOOGLE_CLIENT_ID',
  'REACT_APP_ENVIRONMENT',
  'REACT_APP_NETLIFY_URL',
  'REACT_APP_DRIVE_MODE'
]

let allConfigured = true

envVars.forEach(varName => {
  const value = process.env[varName]
  if (value && value !== 'undefined' && !value.includes('placeholder')) {
    console.log(`✅ ${varName}: Configurada (${value.substring(0, 30)}...)`)
  } else {
    console.log(`❌ ${varName}: No configurada o inválida`)
    allConfigured = false
  }
})

console.log('\n═══════════════════════════════════════════════════════════')
if (allConfigured) {
  console.log('✅ TODAS LAS VARIABLES ESTÁN CONFIGURADAS')
  console.log('   Puedes ejecutar: node seed_companies_server.mjs')
} else {
  console.log('❌ FALTAN VARIABLES POR CONFIGURAR')
}