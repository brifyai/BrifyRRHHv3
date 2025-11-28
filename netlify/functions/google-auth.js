/**
 * Netlify Function: google-auth
 * Intercambia código de autorización por tokens de acceso (OAuth)
 * Endpoint: POST /.netlify/functions/google-auth
 */

const { google } = require('googleapis');

exports.handler = async (event, context) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { code, redirect_uri } = JSON.parse(event.body);
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Authorization code is required' })
      };
    }

    // Configurar OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.REACT_APP_GOOGLE_CLIENT_ID,
      process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      redirect_uri || process.env.REACT_APP_GOOGLE_REDIRECT_URI
    );

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        token_type: 'Bearer',
        scope: tokens.scope
      })
    };

  } catch (error) {
    console.error('Error in google-auth function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to exchange code for tokens',
        details: error.message 
      })
    };
  }
};