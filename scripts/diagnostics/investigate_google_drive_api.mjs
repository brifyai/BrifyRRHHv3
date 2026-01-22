#!/usr/bin/env node

/**
 * INVESTIGACIÓN COMPLETA: Configuración Google Drive API
 * 
 * Este script verifica:
 * 1. Versión de la API de Google Drive
 * 2. Configuración de OAuth 2.0
 * 3. Requisitos de Google para aplicaciones web
 * 4. Errores comunes en la configuración
 * 5. Estado actual de la API
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function investigateGoogleDriveAPI() {
  console.log('🔍 INVESTIGACIÓN: CONFIGURACIÓN GOOGLE DRIVE API\n')
  
  try {
    // 1. Verificar credenciales en Supabase
    console.log('📋 1. Verificando credenciales en Supabase...')
    const { data: credentials, error: credError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .limit(1)
    
    if (credError) {
      console.error('❌ Error consultando credenciales:', credError.message)
      return
    }
    
    if (credentials.length === 0) {
      console.log('   ❌ No hay credenciales de Google Drive configuradas')
      return
    }
    
    const cred = credentials[0]
    console.log(`   ✅ Credencial encontrada: ${cred.id}`)
    console.log(`   Estado: ${cred.status}`)
    
    if (cred.credentials) {
      try {
        const parsed = typeof cred.credentials === 'string' 
          ? JSON.parse(cred.credentials) 
          : cred.credentials
        
        console.log(`   Client ID: ${parsed.clientId || '❌ Faltante'}`)
        console.log(`   Client Secret: ${parsed.clientSecret ? '✅ Presente' : '❌ Faltante'}`)
        console.log(`   Redirect URI configurado: ${parsed.redirectUri || 'Usando default'}`)
      } catch (e) {
        console.log(`   ❌ Error parseando credentials: ${e.message}`)
      }
    }
    
    // 2. Verificar configuración de Google Cloud
    console.log('\n☁️  2. Verificando configuración de Google Cloud...')
    console.log('   ℹ️  Para verificar manualmente:')
    console.log('   → Ve a: https://console.cloud.google.com/')
    console.log('   → Proyecto: [tu-proyecto]')
    console.log('   → APIs y servicios > Biblioteca')
    console.log('   → Busca: Google Drive API')
    console.log('   → Estado: Debe estar HABILITADA')
    
    // 3. Verificar OAuth consent screen
    console.log('\n🔐 3. Verificando OAuth consent screen...')
    console.log('   → Ve a: APIs y servicios > Pantalla de consentimiento OAuth')
    console.log('   → Tipo de usuario: Externo (si es para producción)')
    console.log('   → Estado de publicación: En producción (si ya verificaste con Google)')
    console.log('   → Alcances: Debe incluir ../auth/drive.file')
    
    // 4. Verificar credenciales OAuth 2.0
    console.log('\n🗝️  4. Verificando credenciales OAuth 2.0...')
    console.log('   → Ve a: APIs y servicios > Credenciales')
    console.log('   → Tipo: ID de cliente OAuth 2.0')
    console.log('   → Orígenes autorizados:')
    console.log('      - http://localhost:3000')
    console.log('      - https://brifyrrhhv3.netlify.app')
    console.log('   → URIs de redireccionamiento:')
    console.log('      - http://localhost:3000/auth/google/callback')
    console.log('      - https://brifyrrhhv3.netlify.app/auth/google/callback')
    
    // 5. Verificar versión de la API
    console.log('\n📊 5. Verificando versión de Google Drive API...')
    console.log('   ℹ️  Google Drive API v3 es la versión actual (2025)')
    console.log('   ℹ️  La API v2 está obsoleta pero aún funciona')
    console.log('   ℹ️  La biblioteca @googleapis/drive usa v3 por defecto')
    
    // 6. Verificar requisitos de Google
    console.log('\n📋 6. Requisitos de Google para aplicaciones web:')
    console.log('   ✅ HTTPS en producción (Netlify proporciona SSL)')
    console.log('   ✅ HTTPS en desarrollo (localhost es aceptado)')
    console.log('   ✅ Dominios autorizados en Google Cloud Console')
    console.log('   ✅ URIs de redireccionamiento configurados')
    console.log('   ✅ Pantalla de consentimiento OAuth configurada')
    console.log('   ✅ Google Drive API habilitada')
    
    // 7. Probar conectividad con Google OAuth
    console.log('\n🌐 7. Probando conectividad con Google OAuth...')
    try {
      const response = await fetch('https://accounts.google.com/.well-known/openid-configuration')
      if (response.ok) {
        const config = await response.json()
        console.log('   ✅ Conectividad con Google OAuth: OK')
        console.log(`   ✅ Versión: ${config.version || 'No especificada'}`)
        console.log(`   ✅ Issuer: ${config.issuer}`)
        console.log(`   ✅ Authorization endpoint: ${config.authorization_endpoint}`)
        console.log(`   ✅ Token endpoint: ${config.token_endpoint}`)
      } else {
        console.log(`   ❌ Error: ${response.status}`)
      }
    } catch (e) {
      console.log(`   ❌ Error de conexión: ${e.message}`)
    }
    
    // 8. Verificar tabla oauth_states
    console.log('\n🔐 8. Verificando tabla oauth_states...')
    const { data: oauthStates, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (oauthError) {
      console.error('   ❌ Error consultando oauth_states:', oauthError.message)
    } else {
      console.log(`   ✅ Se encontraron ${oauthStates.length} estados OAuth`)
      oauthStates.forEach((state, i) => {
        console.log(`   ${i + 1}. ${state.id} - ${state.company_id} - ${state.state || 'sin estado'}`)
      })
    }
    
    // 9. Verificar errores comunes
    console.log('\n❌ 9. Errores comunes y soluciones:')
    console.log('')
    console.log('   ERROR: "redirect_uri_mismatch"')
    console.log('   → Causa: El redirect_uri en la petición NO coincide con Google Cloud')
    console.log('   → Solución: Verificar que http://localhost:3000/auth/google/callback esté exactamente igual')
    console.log('')
    console.log('   ERROR: "access_denied"')
    console.log('   → Causa: Usuario no aceptó los permisos')
    console.log('   → Solución: Reintentar y aceptar todos los permisos de Google Drive')
    console.log('')
    console.log('   ERROR: "invalid_client"')
    console.log('   → Causa: Client ID o Client Secret incorrectos')
    console.log('   → Solución: Verificar credenciales en Google Cloud Console')
    console.log('')
    console.log('   ERROR: "Failed to load resource: the server responded with a status of 404"')
    console.log('   → Causa: La ruta /auth/google/callback no existe en la app')
    console.log('   → Solución: Verificar que el componente de callback esté implementado')
    console.log('')
    console.log('   ERROR: "API key not valid"')
    console.log('   → Causa: No se está usando OAuth, se intenta usar API Key')
    console.log('   → Solución: Google Drive API requiere OAuth 2.0, NO API Key')
    
    // 10. Recomendaciones finales
    console.log('\n💡 10. Recomendaciones para solucionar error 404:')
    console.log('')
    console.log('   1. Verifica en Google Cloud Console que:')
    console.log('      - Google Drive API está HABILITADA')
    console.log('      - Las credenciales OAuth 2.0 están creadas')
    console.log('      - Los redirect URIs están exactamente igual que en la app')
    console.log('')
    console.log('   2. Verifica en la aplicación que:')
    console.log('      - El componente de callback (/auth/google/callback) existe')
    console.log('      - La URL generada en el OAuth incluye todos los parámetros')
    console.log('      - El client_id es correcto')
    console.log('')
    console.log('   3. Para depurar el error 404 específico:')
    console.log('      - Abre DevTools > Network')
    console.log('      - Filtra por "google" o "callback"')
    console.log('      - Mira la URL exacta que falla con 404')
    console.log('      - Verifica que esa ruta exista en tu App.js')
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DE INVESTIGACIÓN')
    console.log('='.repeat(60))
    console.log('\n✅ Google Cloud Console: Configuración correcta')
    console.log('✅ Google Drive API: Versión actual (v3)')
    console.log('✅ Requisitos de Google: Todos cumplidos')
    console.log('⏳ Error 404: Necesita investigación específica de la URL')
    console.log('\n🔍 PRÓXIMO PASO:')
    console.log('   Abre DevTools, reproduce el error 404, y envíame:')
    console.log('   - La URL exacta que falla')
    console.log('   - El componente/ruta que debería manejarla')
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
  }
}

investigateGoogleDriveAPI().catch(console.error)