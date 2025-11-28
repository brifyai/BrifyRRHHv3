// Netlify Function: Google OAuth Callback
// Archivo: /netlify/functions/google-auth-callback.js

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    console.log('🔍 CALLBACK RECIBIDO:', event.queryStringParameters);

    const { code, state, error } = event.queryStringParameters || {};

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Parsear state para obtener company_id
    let companyId = null;
    let accountName = 'Google Drive Account';
    
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        companyId = stateData.companyId;
        accountName = stateData.accountName || accountName;
        console.log('📊 State parseado:', { companyId, accountName });
      } catch (e) {
        console.warn('⚠️ State no es JSON, usando como string:', state);
      }
    }

    // Configurar Supabase
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Intercambiar código por tokens
    console.log('🔄 Intercambiando código por tokens...');
    
    const tokenResponse = await exchangeCodeForTokens(code);
    
    if (!tokenResponse.access_token) {
      throw new Error('No access token received from Google');
    }

    console.log('✅ Tokens recibidos:', {
      hasAccessToken: !!tokenResponse.access_token,
      hasRefreshToken: !!tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in
    });

    // Obtener información del usuario
    const userInfo = await getUserInfo(tokenResponse.access_token);
    console.log('👤 User info:', userInfo);

    // Preparar credenciales
    const credentials = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      scope: tokenResponse.scope,
      token_type: tokenResponse.token_type,
      expiry_date: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
      email: userInfo.email,
      name: userInfo.name
    };

    // Guardar en company_credentials
    console.log('💾 Guardando en company_credentials...');
    
    const { error: saveError } = await supabase
      .from('company_credentials')
      .upsert({
        id: crypto.randomUUID(),
        company_id: companyId,
        integration_type: 'google_drive',
        service_name: 'google_drive',
        account_name: accountName,
        account_email: userInfo.email,
        status: 'active',
        credentials: credentials,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['company_id', 'integration_type']
      });

    if (saveError) {
      throw new Error(`Error guardando credenciales: ${saveError.message}`);
    }

    console.log('✅ Credenciales guardadas exitosamente');

    // Redirigir con éxito
    const redirectUrl = `${process.env.REACT_APP_FRONTEND_URL || 'https://brifyrrhhv3.netlify.app'}/configuracion?google_auth=success`;
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': redirectUrl
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('❌ ERROR EN CALLBACK:', error);
    
    const redirectUrl = `${process.env.REACT_APP_FRONTEND_URL || 'https://brifyrrhhv3.netlify.app'}/configuracion?google_auth=error&message=${encodeURIComponent(error.message)}`;
    
    return {
      statusCode: 302,
      headers: { 'Location': redirectUrl },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

// Función para intercambiar código por tokens
async function exchangeCodeForTokens(code) {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan credenciales de Google OAuth en variables de entorno');
  }

  console.log('📡 Enviando request a Google OAuth...');
  console.log('   client_id:', clientId.substring(0, 20) + '...');
  console.log('   redirect_uri:', redirectUri);

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
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Google OAuth error: ${response.status} - ${errorData}`);
  }

  const tokens = await response.json();
  console.log('✅ Tokens recibidos de Google:', {
    access_token: tokens.access_token ? '✅' : '❌',
    refresh_token: tokens.refresh_token ? '✅' : '❌',
    token_type: tokens.token_type,
    expires_in: tokens.expires_in
  });

  return tokens;
}

// Función para obtener información del usuario
async function getUserInfo(accessToken) {
  console.log('📡 Obteniendo user info...');
  
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`User info error: ${response.status}`);
  }

  const userInfo = await response.json();
  console.log('✅ User info recibido:', userInfo.email);
  
  return userInfo;
}