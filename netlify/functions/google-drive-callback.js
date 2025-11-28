/**
 * Netlify Function: google-drive-callback
 * Procesa el callback completo de OAuth y guarda tokens en Supabase
 * Endpoint: POST /.netlify/functions/google-drive-callback
 */

const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');

// Inicializar Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { code, company_id, user_id, redirect_uri } = JSON.parse(event.body);
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Authorization code is required' })
      };
    }

    if (!company_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Company ID is required' })
      };
    }

    console.log(`Procesando callback para company: ${company_id}, user: ${user_id}`);

    // Configurar OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.REACT_APP_GOOGLE_CLIENT_ID,
      process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      redirect_uri || process.env.REACT_APP_GOOGLE_REDIRECT_URI
    );

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Obtener información del usuario de Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Calcular fecha de expiración
    const expiresAt = tokens.expiry_date ? 
      new Date(tokens.expiry_date).toISOString() : 
      new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // Guardar en Supabase (company_credentials)
    const updateData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      status: 'active',
      email: userInfo.data.email,
      account_email: userInfo.data.email,
      account_display_name: userInfo.data.name,
      settings: {
        scope: tokens.scope,
        token_type: tokens.token_type
      },
      updated_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('company_credentials')
      .update(updateData)
      .eq('company_id', company_id)
      .eq('integration_type', 'google_drive')
      .select()
      .single();

    if (error) {
      console.error('Error updating credentials:', error);
      throw new Error(`Failed to save tokens: ${error.message}`);
    }

    console.log('✅ Tokens guardados exitosamente en company_credentials');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        data: {
          company_id,
          email: userInfo.data.email,
          name: userInfo.data.name,
          tokens_saved: true,
          credential_id: data.id
        }
      })
    };

  } catch (error) {
    console.error('Error in google-drive-callback function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process OAuth callback',
        details: error.message 
      })
    };
  }
};