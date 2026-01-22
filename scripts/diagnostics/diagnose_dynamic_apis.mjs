#!/usr/bin/env node

/**
 * DIAGNÓSTICO ESPECÍFICO: APIs Dinámicas de Google Drive
 * 
 * Este script verifica:
 * 1. Estado de company_credentials en Supabase
 * 2. Validez de credenciales OAuth almacenadas
 * 3. Conectividad con Google Drive API
 * 4. Errores específicos en la generación de URLs dinámicas
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseDynamicAPIs() {
  console.log('🔍 DIAGNÓSTICO DE APIS DINÁMICAS DE GOOGLE DRIVE\n')
  
  try {
    // 1. Verificar tabla company_credentials
    console.log('📋 1. Verificando tabla company_credentials...')
    const { data: credentials, error: credError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
    
    if (credError) {
      console.error('❌ Error consultando credenciales:', credError.message)
      return
    }
    
    console.log(`✅ Se encontraron ${credentials.length} credenciales de Google Drive`)
    
    credentials.forEach((cred, i) => {
      console.log(`\n   ${i + 1}. ID: ${cred.id}`)
      console.log(`      Empresa: ${cred.company_id}`)
      console.log(`      Estado: ${cred.status}`)
      console.log(`      Tiene credentials: ${!!cred.credentials}`)
      
      if (cred.credentials) {
        try {
          const parsed = typeof cred.credentials === 'string' 
            ? JSON.parse(cred.credentials) 
            : cred.credentials
          console.log(`      Client ID: ${parsed.clientId || 'N/A'}`)
          console.log(`      Tiene refresh_token: ${!!parsed.refresh_token}`)
          console.log(`      Tiene access_token: ${!!parsed.access_token}`)
        } catch (e) {
          console.log(`      ❌ Error parseando credentials: ${e.message}`)
        }
      }
    })
    
    // 2. Probar generación de URL dinámica
    console.log('\n🧪 2. Probando generación de URL de autorización...')
    
    if (credentials.length > 0) {
      const testCred = credentials[0]
      console.log(`   Usando credencial: ${testCred.id}`)
      
      try {
        const credentialsData = typeof testCred.credentials === 'string'
          ? JSON.parse(testCred.credentials)
          : testCred.credentials
        
        if (!credentialsData.clientId || !credentialsData.clientSecret) {
          console.log('   ❌ Faltan clientId o clientSecret en credentials')
        } else {
          console.log('   ✅ Credenciales completas')
          console.log(`   Client ID: ${credentialsData.clientId.substring(0, 20)}...`)
          
          // Simular generación de URL
          const redirectUri = 'http://localhost:3000/auth/google/callback'
          const scope = 'https://www.googleapis.com/auth/drive.file'
          const state = encodeURIComponent(JSON.stringify({
            companyId: testCred.company_id,
            credentialId: testCred.id
          }))
          
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${credentialsData.clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${state}`
          
          console.log(`   ✅ URL generada exitosamente: ${authUrl.substring(0, 100)}...`)
        }
      } catch (e) {
        console.log(`   ❌ Error en credenciales: ${e.message}`)
      }
    } else {
      console.log('   ⚠️  No hay credenciales de Google Drive configuradas')
    }
    
    // 3. Verificar tabla oauth_states
    console.log('\n🔐 3. Verificando tabla oauth_states...')
    const { data: oauthStates, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (oauthError) {
      console.error('   ❌ Error consultando oauth_states:', oauthError.message)
    } else {
      console.log(`   ✅ Se encontraron ${oauthStates.length} estados OAuth recientes`)
      oauthStates.forEach((state, i) => {
        console.log(`   ${i + 1}. ${state.id} - ${state.company_id} - ${state.status}`)
      })
    }
    
    // 4. Verificar conectividad con Google
    console.log('\n🌐 4. Probando conectividad con Google OAuth...')
    try {
      const response = await fetch('https://accounts.google.com/.well-known/openid-configuration')
      if (response.ok) {
        console.log('   ✅ Conectividad con Google OAuth: OK')
      } else {
        console.log(`   ❌ Error: ${response.status}`)
      }
    } catch (e) {
      console.log(`   ❌ Error de conexión: ${e.message}`)
    }
    
    // 5. Resumen de problemas comunes
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DE POSIBLES PROBLEMAS')
    console.log('='.repeat(60))
    
    console.log('\n1. ❌ "Failed to load resource: the server responded with a status of 400"')
    console.log('   → Causa: RLS no configurado en system_configurations')
    console.log('   → Solución: Ejecutar SQL en database/apply_rls_fix.sql')
    
    console.log('\n2. ❌ "Cannot read properties of null (reading \'rpc\')"')
    console.log('   → Causa: this.supabase no inicializado')
    console.log('   → Solución: Ya aplicado en googleDriveAuthServiceDynamic.js')
    
    console.log('\n3. ❌ "setTokens is not a function"')
    console.log('   → Causa: Métodos faltantes en googleDriveAuthService')
    console.log('   → Solución: Ya aplicado con métodos de compatibilidad')
    
    console.log('\n4. ❌ "No credentials found" o "Invalid credentials"')
    console.log('   → Causa: Credenciales incompletas o mal formateadas')
    console.log('   → Solución: Verificar formato JSON en company_credentials.credentials')
    
    console.log('\n5. ❌ "redirect_uri_mismatch" en Google OAuth')
    console.log('   → Causa: Redirect URI no registrado en Google Cloud Console')
    console.log('   → Solución: Agregar https://brifyrrhhv3.netlify.app/auth/google/callback')
    
    console.log('\n6. ❌ "access_denied" o consentimiento rechazado')
    console.log('   → Causa: Usuario no aceptó permisos de Google Drive')
    console.log('   → Solución: Reintentar flujo OAuth y aceptar permisos')
    
    console.log('\n💡 ¿Qué error exacto estás viendo en la consola del navegador?')
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
    console.error(error.stack)
  }
}

diagnoseDynamicAPIs().catch(console.error)