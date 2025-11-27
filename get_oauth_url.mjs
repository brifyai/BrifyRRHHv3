// Script para obtener la URL de OAuth
import { supabase } from './src/lib/supabaseClient.js'

async function getOAuthUrl() {
  const { data, error } = await supabase
    .from('company_credentials')
    .select('credentials')
    .eq('id', '088177a0-4231-4979-ade5-e3c892b05cea')
    .single()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const clientId = data.credentials.clientId
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=http://localhost:3000/auth/google/callback&scope=https://www.googleapis.com/auth/drive.file&response_type=code&access_type=offline&prompt=consent`
  
  console.log('🔐 URL DE AUTORIZACIÓN:')
  console.log(url)
}

getOAuthUrl()