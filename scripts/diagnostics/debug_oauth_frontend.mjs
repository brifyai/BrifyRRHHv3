// Script para depurar el flujo OAuth desde el frontend
import { supabase } from './src/lib/supabaseClient.js'

async function debugOAuthFrontend() {
  console.log('🔍 DEBUGGING FLUJO OAUTH - FRONTEND\n')
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
  
  try {
    // 1. Verificar configuración de Google Cloud
    console.log('1. Verificando configuración de Google Cloud...')
    const { data: config, error: configError } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('category', 'integrations')
      .eq('config_key', 'google_drive')
      .eq('scope', 'global')
      .eq('is_active', true)
      .single()
    
    if (configError) {
      console.log('ℹ️ No hay configuración global de Google Drive')
    } else {
      console.log('✅ Configuración encontrada:', config.config_value)
    }
    
    // 2. Verificar credenciales de la empresa
    console.log('\n2. Verificando credenciales de la empresa...')
    const { data: credentials, error: credsError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .eq('status', 'active')
    
    if (credsError) {
      console.error('❌ Error consultando credenciales:', credsError)
      return
    }
    
    if (credentials.length === 0) {
      console.log('❌ No hay credenciales activas para esta empresa')
      return
    }
    
    console.log(`✅ Encontradas ${credentials.length} credenciales activas`)
    
    for (const cred of credentials) {
      console.log(`\n   📄 Credencial: ${cred.id}`)
      console.log(`   Nombre: ${cred.account_name}`)
      console.log(`   Email: ${cred.account_email || 'No especificado'}`)
      
      const credsData = typeof cred.credentials === 'string' 
        ? JSON.parse(cred.credentials) 
        : cred.credentials
      
      console.log(`   Tiene clientId: ${!!credsData.clientId}`)
      console.log(`   Tiene clientSecret: ${!!credsData.clientSecret}`)
      
      // Verificar formato de clientId
      if (credsData.clientId && !credsData.clientId.includes('.apps.googleusercontent.com')) {
        console.log('   ⚠️  WARNING: clientId no tiene formato válido de Google')
      }
    }
    
    // 3. Verificar URIs de redireccionamiento
    console.log('\n3. Verificando URIs de redireccionamiento...')
    const redirectUris = [
      'http://localhost:3000/auth/google/callback',
      'https://brifyrrhhv3.netlify.app/auth/google/callback'
    ]
    
    for (const uri of redirectUris) {
      console.log(`   - ${uri}`)
    }
    
    // 4. Probar generación de URL de OAuth
    console.log('\n4. Probando generación de URL de OAuth...')
    const clientId = credentials[0].credentials.clientId
    
    if (!clientId) {
      console.log('❌ No hay clientId en las credenciales')
      return
    }
    
    const redirectUri = 'http://localhost:3000/auth/google/callback'
    const scope = 'https://www.googleapis.com/auth/drive.file'
    const state = encodeURIComponent(JSON.stringify({
      companyId: companyId,
      credentialId: credentials[0].id,
      userId: 'ba796511-4271-4e68-b4c1-a3ec03f701e5'
    }))
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`
    
    console.log(`\n✅ URL de autorización generada:`)
    console.log(`   ${authUrl.substring(0, 100)}...`)
    
    // 5. Instrucciones para el usuario
    console.log('\n📋 INSTRUCCIONES:')
    console.log('1. Abre la URL anterior en tu navegador')
    console.log('2. Inicia sesión con tu cuenta de Google')
    console.log('3. Acepta los permisos')
    console.log('4. Verifica que te redirige a localhost:3000')
    console.log('5. Si hay error, copia la URL completa del error aquí')
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
  }
}

// Ejecutar
debugOAuthFrontend()