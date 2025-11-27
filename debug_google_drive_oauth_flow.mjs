// Script para depurar el flujo OAuth de Google Drive
import { supabase } from './src/lib/supabaseClient.js'

async function debugOAuthFlow() {
  console.log('🔍 DEBUGGING FLUJO OAUTH GOOGLE DRIVE\n')
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
  
  try {
    // 1. Verificar si hay OAuth states pendientes
    console.log('1. Buscando OAuth states...')
    const { data: oauthStates, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('company_id', companyId)
      .eq('service', 'google_drive')
      .order('created_at', { ascending: false })
    
    if (oauthError) {
      console.error('❌ Error consultando OAuth states:', oauthError)
    } else if (oauthStates.length > 0) {
      console.log(`✅ Encontrados ${oauthStates.length} OAuth states`)
      for (const state of oauthStates) {
        console.log(`   - ID: ${state.id}`)
        console.log(`   - Estado: ${state.status}`)
        console.log(`   - Creado: ${new Date(state.created_at).toLocaleString()}`)
        console.log(`   - Callback URL: ${state.callback_url}`)
      }
    } else {
      console.log('ℹ️ No hay OAuth states registrados')
    }
    
    // 2. Verificar logs de autenticación recientes
    console.log('\n2. Buscando logs de autenticación...')
    const { data: logs, error: logsError } = await supabase
      .from('auth_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('service', 'google_drive')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (logsError) {
      console.error('❌ Error consultando logs:', logsError)
    } else if (logs.length > 0) {
      console.log(`✅ Encontrados ${logs.length} logs recientes`)
      for (const log of logs) {
        console.log(`   - ${log.created_at}: ${log.action} - ${log.status}`)
        if (log.error_message) {
          console.log(`     Error: ${log.error_message}`)
        }
      }
    } else {
      console.log('ℹ️ No hay logs de autenticación recientes')
    }
    
    // 3. Verificar credenciales con detalle
    console.log('\n3. Analizando credenciales en detalle...')
    const { data: credentials, error: credsError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
    
    if (credsError) {
      console.error('❌ Error consultando credenciales:', credsError)
    } else {
      for (const cred of credentials) {
        console.log(`\n   📄 Credencial: ${cred.id}`)
        console.log(`   Estado: ${cred.status}`)
        console.log(`   Cuenta: ${cred.account_email || 'No especificada'}`)
        
        const credsData = typeof cred.credentials === 'string' 
          ? JSON.parse(cred.credentials) 
          : cred.credentials
        
        console.log(`   Tiene clientId: ${!!credsData.clientId}`)
        console.log(`   Tiene clientSecret: ${!!credsData.clientSecret}`)
        console.log(`   Tiene access_token: ${!!credsData.access_token}`)
        console.log(`   Tiene refresh_token: ${!!credsData.refresh_token}`)
        
        if (credsData.access_token) {
          console.log(`   ✓ Access token: ${credsData.access_token.substring(0, 20)}...`)
        }
        if (credsData.refresh_token) {
          console.log(`   ✓ Refresh token: ${credsData.refresh_token.substring(0, 20)}...`)
        }
      }
    }
    
    // 4. Recomendaciones
    console.log('\n📋 RECOMENDACIONES:')
    console.log('1. En la UI, haz clic en [Test] o [Activar]')
    console.log('2. Verifica que la ventana de Google se abre')
    console.log('3. Inicia sesión con tu cuenta de Google')
    console.log('4. Acepta TODOS los permisos que solicita')
    console.log('5. Espera a que la ventana se cierre automáticamente')
    console.log('6. Ejecuta este script de nuevo para verificar')
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
  }
}

// Ejecutar
debugOAuthFlow()