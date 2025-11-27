// Script para obtener URL de OAuth con state
import { supabase } from './src/lib/supabaseClient.js'

async function getOAuthUrlWithState() {
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
  const credentialId = '088177a0-4231-4979-ade5-e3c892b05cea'
  const userId = 'ba796511-4271-4e68-b4c1-a3ec03f701e5'
  
  const { data, error } = await supabase
    .from('company_credentials')
    .select('credentials')
    .eq('id', credentialId)
    .single()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const clientId = data.credentials.clientId
  const state = encodeURIComponent(JSON.stringify({
    companyId: companyId,
    credentialId: credentialId,
    userId: userId,
    timestamp: Date.now()
  }))
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=http://localhost:3000/auth/google/callback&` +
    `scope=https://www.googleapis.com/auth/drive.file&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`
  
  console.log('🔐 URL DE AUTORIZACIÓN CON STATE:')
  console.log(url)
  console.log('\n📋 INSTRUCCIONES:')
  console.log('1. Copia la URL completa de arriba')
  console.log('2. Pégala en tu navegador')
  console.log('3. Inicia sesión con Google')
  console.log('4. Acepta los permisos')
  console.log('5. Verifica que te redirige correctamente')
}

getOAuthUrlWithState()