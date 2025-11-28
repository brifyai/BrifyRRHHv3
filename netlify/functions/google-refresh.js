/**
 * Netlify Function: google-refresh
 * Refresca access tokens usando refresh tokens
 * Endpoint: POST /.netlify/functions/google-refresh
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
    const { refresh_token } = JSON.parse(event.body);
    
    if (!refresh_token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Refresh token is required' })
      };
    }

    // Configurar OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.REACT_APP_GOOGLE_CLIENT_ID,
      process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      process.env.REACT_APP_GOOGLE_REDIRECT_URI
    );

    // Establecer refresh token
    oauth2Client.setCredentials({ refresh_token });

    // Refrescar access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        access_token: credentials.access_token,
        expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
        token_type: 'Bearer'
      })
    };

  } catch (error) {
    console.error('Error in google-refresh function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to refresh access token',
        details: error.message 
      })
    };
  }
};