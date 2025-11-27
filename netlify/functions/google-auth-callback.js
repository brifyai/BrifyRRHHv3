// Netlify Function para manejar el callback de OAuth de Google
// Archivo: /netlify/functions/google-auth-callback.js

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Manejar preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  try {
    console.log('🔍 Google Auth Callback recibido')
    console.log('📍 Query params:', event.queryStringParameters)

    const { code, state, error } = event.queryStringParameters || {}

    if (error) {
      console.error('❌ Error de OAuth:', error)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `OAuth error: ${error}`
        })
      }
    }

    if (!code) {
      console.error('❌ No se recibió código de autorización')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No authorization code received'
        })
      }
    }

    // Parsear state para obtener company_id
    let companyId = null
    let accountName = 'Google Drive Account'
    
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state))
        companyId = stateData.companyId
        accountName = stateData.accountName || accountName
        console.log('📊 Datos del state:', { companyId, accountName })
      } catch (e) {
        console.warn('⚠️ No se pudo parsear state:', e.message)
      }
    }

    // Configurar Supabase
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Intercambiar código por tokens
    console.log('🔄 Intercambiando código por tokens...')
    
    const tokenResponse = await exchangeCodeForTokens(code)
    
    if (!tokenResponse.access_token) {
      throw new Error('No se obtuvo access token')
    }

    console.log('✅ Tokens obtenidos exitosamente')

    // Guardar tokens en company_credentials
    console.log('💾 Guardando tokens en company_credentials...')
    
    const credentials = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      scope: tokenResponse.scope,
      token_type: tokenResponse.token_type,
      expiry_date: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString()
    }

    // Obtener información del usuario
    let userEmail = 'unknown@domain.com'
    let userName = 'Unknown User'
    
    try {
      const userInfo = await getUserInfo(tokenResponse.access_token)
      if (userInfo) {
        userEmail = userInfo.email
        userName = userInfo.name
        console.log('👤 Información del usuario:', { userEmail, userName })
      }
    } catch (e) {
      console.warn('⚠️ No se pudo obtener información del usuario:', e.message)
    }

    // Actualizar o crear credencial
    if (companyId) {
      // Buscar credencial existente
      const { data: existingCred, error: findError } = await supabase
        .from('company_credentials')
        .select('*')
        .eq('company_id', companyId)
        .eq('integration_type', 'google_drive')
        .single()

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error buscando credencial:', findError)
        throw findError
      }

      if (existingCred) {
        // Actualizar credencial existente
        console.log('📝 Actualizando credencial existente...')
        
        const { error: updateError } = await supabase
          .from('company_credentials')
          .update({
            status: 'active',
            account_email: userEmail,
            account_name: accountName,
            credentials: credentials,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCred.id)

        if (updateError) {
          console.error('❌ Error actualizando credencial:', updateError)
          throw updateError
        }

        console.log('✅ Credencial actualizada exitosamente')
      } else {
        // Crear nueva credencial
        console.log('📝 Creando nueva credencial...')
        
        const { error: insertError } = await supabase
          .from('company_credentials')
          .insert({
            id: crypto.randomUUID(),
            company_id: companyId,
            integration_type: 'google_drive',
            service_name: 'google_drive',
            account_name: accountName,
            account_email: userEmail,
            status: 'active',
            credentials: credentials,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('❌ Error creando credencial:', insertError)
          throw insertError
        }

        console.log('✅ Credencial creada exitosamente')
      }
    }

    // Redirigir a la página de configuración con éxito
    const redirectUrl = `${process.env.REACT_APP_FRONTEND_URL || 'https://brifyrrhhv3.netlify.app'}/configuracion?google_auth=success`
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': redirectUrl
      },
      body: JSON.stringify({
        success: true,
        message: 'Google Drive conectado exitosamente'
      })
    }

  } catch (error) {
    console.error('❌ Error en callback:', error)
    
    const redirectUrl = `${process.env.REACT_APP_FRONTEND_URL || 'https://brifyrrhhv3.netlify.app'}/configuracion?google_auth=error&message=${encodeURIComponent(error.message)}`
    
    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// Función para intercambiar código por tokens
async function exchangeCodeForTokens(code) {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
  const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret) {
    throw new Error('Faltan credenciales de Google OAuth')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Token exchange failed: ${response.status} - ${errorData}`)
  }

  return await response.json()
}

// Función para obtener información del usuario
async function getUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`)
  }

  return await response.json()
}