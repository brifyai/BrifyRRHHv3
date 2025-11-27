// Script de diagnóstico para verificar credenciales de Google Drive en tiempo real
import { supabase } from './src/lib/supabaseClient.js'

async function diagnoseGoogleDriveCredentials() {
  console.log('🔍 DIAGNÓSTICO DE CREDENCIALES GOOGLE DRIVE\n')
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
  
  try {
    // 1. Ver todas las credenciales de Google Drive para esta empresa
    console.log('1. Buscando credenciales en company_credentials...')
    const { data: credentials, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error consultando credenciales:', error)
      return
    }
    
    console.log(`✅ Encontradas ${credentials.length} credenciales\n`)
    
    // 2. Analizar cada credencial
    for (const cred of credentials) {
      console.log(`\n📄 Credencial ID: ${cred.id}`)
      console.log(`   Cuenta: ${cred.account_email}`)
      console.log(`   Estado: ${cred.status}`)
      console.log(`   Creada: ${cred.created_at}`)
      
      // 3. Verificar contenido de credentials
      const credsData = typeof cred.credentials === 'string' 
        ? JSON.parse(cred.credentials) 
        : cred.credentials
        
      console.log(`   Tiene clientId: ${!!credsData.clientId}`)
      console.log(`   Tiene clientSecret: ${!!credsData.clientSecret}`)
      console.log(`   Tiene access_token: ${!!credsData.access_token}`)
      console.log(`   Tiene refresh_token: ${!!credsData.refresh_token}`)
      
      // 4. Validar tokens
      if (credsData.access_token) {
        console.log(`   ✓ Access token presente`)
      } else {
        console.log(`   ✗ Access token FALTANTE`)
      }
      
      if (credsData.refresh_token) {
        console.log(`   ✓ Refresh token presente`)
      } else {
        console.log(`   ✗ Refresh token FALTANTE`)
      }
      
      // 5. Verificar fecha de expiración
      if (credsData.expiry_date) {
        const expiry = new Date(credsData.expiry_date)
        const now = new Date()
        const isExpired = expiry < now
        console.log(`   Expiración: ${expiry.toLocaleString()} ${isExpired ? '⚠️ EXPIRADO' : '✓ Válido'}`)
      } else {
        console.log(`   Expiración: No especificada`)
      }
    }
    
    // 6. Resumen
    console.log('\n📊 RESUMEN:')
    const activeCreds = credentials.filter(c => c.status === 'active')
    const pendingCreds = credentials.filter(c => c.status === 'pending_verification')
    
    console.log(`   - Activas: ${activeCreds.length}`)
    console.log(`   - Pendientes: ${pendingCreds.length}`)
    console.log(`   - Total: ${credentials.length}`)
    
    if (activeCreds.length === 0) {
      console.log('\n❌ NO HAY CREDENCIALES ACTIVAS')
      console.log('   → Necesitas activar las credenciales pendientes')
    } else {
      console.log('\n✅ CREDENCIALES ACTIVAS ENCONTRADAS')
      console.log('   → El problema está en el formato de los tokens')
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
  }
}

// Ejecutar
diagnoseGoogleDriveCredentials()