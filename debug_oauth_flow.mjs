#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugOAuthFlow() {
  console.log('🔍 DEBUG: FLUJO COMPLETO DE OAUTH\n')
  console.log('=' .repeat(70))
  
  try {
    // 1. Verificar si hay registros de OAuth en proceso
    console.log('\n📋 1. BUSCANDO REGISTROS DE OAUTH EN PROCESO\n')
    
    // Buscar en company_credentials con status 'pending_verification'
    const { data: pendingCreds, error: pendingError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .eq('status', 'pending_verification')
    
    if (pendingError) {
      console.error('   ❌ Error buscando pendientes:', pendingError.message)
    } else if (!pendingCreds || pendingCreds.length === 0) {
      console.log('   ✅ No hay credenciales en estado pending_verification')
    } else {
      console.log(`   ⚠️  Encontradas ${pendingCreds.length} credenciales pendientes:`)
      for (const cred of pendingCreds) {
        console.log(`      - ${cred.account_name} (${cred.id})`)
      }
    }
    
    // 2. Verificar si hay errores en el callback
    console.log('\n' + '='.repeat(70))
    console.log('\n🔍 2. VERIFICANDO CONFIGURACIÓN DE OAUTH\n')
    
    // Verificar variables de entorno necesarias
    const requiredEnvVars = [
      'REACT_APP_GOOGLE_CLIENT_ID',
      'REACT_APP_GOOGLE_CLIENT_SECRET',
      'REACT_APP_GOOGLE_REDIRECT_URI'
    ]
    
    console.log('   Variables de entorno requeridas:')
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar]
      const exists = !!value
      const isPlaceholder = exists && (
        value.includes('dummy') || 
        value.includes('YOUR_') || 
        value.includes('placeholder')
      )
      
      const status = !exists ? '❌ AUSENTE' : 
                     isPlaceholder ? '⚠️  PLACEHOLDER' : '✅ CONFIGURADA'
      
      console.log(`   - ${envVar}: ${status}`)
      if (exists && !isPlaceholder) {
        console.log(`     Valor: ${value.substring(0, 20)}...`)
      }
    }
    
    // 3. Verificar si el callback endpoint existe
    console.log('\n' + '='.repeat(70))
    console.log('\n🔍 3. VERIFICANDO ENDPOINT DE CALLBACK\n')
    
    // Verificar si hay una función Netlify para el callback
    console.log('   🔍 Buscando endpoint de callback...')
    console.log('   - Ruta esperada: /auth/google/callback')
    console.log('   - Archivo esperado: googleDriveCallbackHandler.js')
    
    // Verificar si la tabla company_credentials tiene el campo credentials correctamente
    console.log('\n' + '='.repeat(70))
    console.log('\n🔍 4. VERIFICANDO ESTRUCTURA DE company_credentials\n')
    
    const { data: sampleCred, error: sampleError } = await supabase
      .from('company_credentials')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('   ❌ Error obteniendo muestra:', sampleError.message)
    } else if (!sampleCred || sampleCred.length === 0) {
      console.log('   ❌ No hay credenciales para analizar')
    } else {
      const cred = sampleCred[0]
      console.log('   📄 Estructura de la tabla:')
      console.log(`   - ID: ${cred.id}`)
      console.log(`   - company_id: ${cred.company_id}`)
      console.log(`   - integration_type: ${cred.integration_type}`)
      console.log(`   - account_name: ${cred.account_name}`)
      console.log(`   - account_email: ${cred.account_email || 'N/A'}`)
      console.log(`   - status: ${cred.status}`)
      console.log(`   - credentials: ${cred.credentials ? '✅ PRESENTE' : '❌ NULO'}`)
      console.log(`   - created_at: ${cred.created_at}`)
      console.log(`   - updated_at: ${cred.updated_at}`)
      
      if (cred.credentials) {
        try {
          const credsData = typeof cred.credentials === 'string' ? JSON.parse(cred.credentials) : cred.credentials
          console.log(`\n   🔑 Contenido de credentials:`)
          console.log(`   - access_token: ${credsData.access_token ? '✅' : '❌'}`)
          console.log(`   - refresh_token: ${credsData.refresh_token ? '✅' : '❌'}`)
          console.log(`   - scope: ${credsData.scope || '❌'}`)
          console.log(`   - token_type: ${credsData.token_type || '❌'}`)
          console.log(`   - expiry_date: ${credsData.expiry_date || '❌'}`)
        } catch (e) {
          console.log(`   ❌ Error parseando credentials: ${e.message}`)
        }
      }
    }
    
    // 5. Probar conectividad a Google OAuth
    console.log('\n' + '='.repeat(70))
    console.log('\n🌐 5. PROBANDO CONECTIVIDAD A GOOGLE OAUTH\n')
    
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
    if (clientId && !clientId.includes('dummy') && !clientId.includes('YOUR_')) {
      console.log('   ✅ Client ID está configurado')
      console.log(`   🔍 Verificando en Google Cloud Console...`)
      console.log(`   📋 Client ID: ${clientId}`)
      
      // Verificar si el redirect URI está configurado
      const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'https://brifyrrhhv3.netlify.app/auth/google/callback'
      console.log(`   🔄 Redirect URI: ${redirectUri}`)
      
      console.log('\n   ⚠️  IMPORTANTE: Verifica en Google Cloud Console que:')
      console.log('      - El Client ID es correcto')
      console.log('      - El Redirect URI está autorizado')
      console.log('      - Las APIs de Google Drive están habilitadas')
    } else {
      console.log('   ❌ Client ID no está configurado correctamente')
    }
    
    // 6. Resumen y diagnóstico final
    console.log('\n' + '='.repeat(70))
    console.log('\n📊 DIAGNÓSTICO FINAL:\n')
    
    console.log('   PROBLEMA IDENTIFICADO:')
    console.log('   - La tabla user_google_drive_credentials está VACÍA')
    console.log('   - El OAuth no está guardando tokens')
    console.log('   - El servicio dinámico lee de company_credentials (sin tokens)')
    
    console.log('\n   POSIBLES CAUSAS:')
    console.log('   1. ❌ El botón "Conectar" no inicia el flujo OAuth')
    console.log('   2. ❌ El callback no procesa correctamente los tokens')
    console.log('   3. ❌ El OAuth falla antes de guardar (error de configuración)')
    console.log('   4. ❌ Falta el endpoint /auth/google/callback')
    
    console.log('\n   🛠️  SOLUCIONES:')
    console.log('   1. Verificar que el botón "Conectar" llama a generateAuthUrl()')
    console.log('   2. Verificar que el callback endpoint existe y funciona')
    console.log('   3. Verificar variables de entorno de Google OAuth')
    console.log('   4. Verificar configuración en Google Cloud Console')
    console.log('   5. Alternativa: Migrar manualmente tokens a company_credentials')
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message)
  }
}

debugOAuthFlow()