import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase desde el código fuente
const SUPABASE_URL = 'https://supabase.staffhub.cl';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugCredentialsContent() {
  console.log('🔍 DEBUG: Analizando contenido del campo credentials...\n');
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978';
  
  try {
    // Obtener la credencial pendiente
    const { data: credential, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .eq('status', 'pending_verification')
      .single();
    
    if (error) {
      console.error('❌ Error obteniendo credencial:', error);
      return;
    }
    
    if (!credential) {
      console.log('❌ No se encontró credencial pendiente');
      return;
    }
    
    console.log('📄 Información de la credencial:');
    console.log('ID:', credential.id);
    console.log('Status:', credential.status);
    console.log('Account Name:', credential.account_name);
    console.log('Account Email:', credential.account_email);
    
    // Analizar el campo credentials
    console.log('\n🔑 Analizando campo credentials:');
    console.log('Tipo de credentials:', typeof credential.credentials);
    console.log('Credentials es null:', credential.credentials === null);
    console.log('Credentials es undefined:', credential.credentials === undefined);
    
    if (credential.credentials) {
      try {
        const parsedCredentials = typeof credential.credentials === 'string' 
          ? JSON.parse(credential.credentials) 
          : credential.credentials;
        
        console.log('\n✅ Credentials parseadas:');
        console.log('- Client ID:', parsedCredentials.client_id ? '✅' : '❌');
        console.log('- Client Secret:', parsedCredentials.client_secret ? '✅' : '❌');
        console.log('- Redirect URI:', parsedCredentials.redirect_uri || '❌');
        console.log('- Access Token:', parsedCredentials.access_token ? '✅' : '❌');
        console.log('- Refresh Token:', parsedCredentials.refresh_token ? '✅' : '❌');
        console.log('- Token Expires At:', parsedCredentials.token_expires_at || '❌');
        
        if (parsedCredentials.access_token) {
          console.log('\n🎯 ¡TIENE ACCESS TOKEN!');
          console.log('Token length:', parsedCredentials.access_token.length);
          console.log('Token starts with:', parsedCredentials.access_token.substring(0, 20) + '...');
          
          // Verificar si el token está expirado
          if (parsedCredentials.token_expires_at) {
            const expiryDate = new Date(parsedCredentials.token_expires_at);
            const now = new Date();
            const isExpired = expiryDate < now;
            
            console.log('Token expiry date:', expiryDate.toISOString());
            console.log('Current time:', now.toISOString());
            console.log('Token expired:', isExpired ? '❌ YES' : '✅ NO');
          }
        } else {
          console.log('\n❌ NO TIENE ACCESS TOKEN - Este es el problema');
        }
        
        // Mostrar estructura completa (sin datos sensibles)
        console.log('\n📋 Estructura completa de credentials:');
        const safeCredentials = { ...parsedCredentials };
        if (safeCredentials.client_secret) {
          safeCredentials.client_secret = '[HIDDEN]';
        }
        if (safeCredentials.access_token) {
          safeCredentials.access_token = safeCredentials.access_token.substring(0, 20) + '...';
        }
        if (safeCredentials.refresh_token) {
          safeCredentials.refresh_token = safeCredentials.refresh_token.substring(0, 20) + '...';
        }
        console.log(JSON.stringify(safeCredentials, null, 2));
        
      } catch (parseError) {
        console.error('❌ Error parseando credentials:', parseError);
        console.log('Credentials raw:', credential.credentials);
      }
    } else {
      console.log('\n❌ El campo credentials está vacío o es null');
      console.log('Este es el problema principal: No hay credenciales OAuth almacenadas');
    }
    
    // Analizar el campo settings
    console.log('\n⚙️  Analizando campo settings:');
    console.log('Tipo de settings:', typeof credential.settings);
    
    if (credential.settings) {
      try {
        const parsedSettings = typeof credential.settings === 'string' 
          ? JSON.parse(credential.settings) 
          : credential.settings;
        
        console.log('✅ Settings parseados:');
        console.log(JSON.stringify(parsedSettings, null, 2));
      } catch (settingsError) {
        console.error('❌ Error parseando settings:', settingsError);
        console.log('Settings raw:', credential.settings);
      }
    }
    
    // Verificar otros campos importantes
    console.log('\n📅 Fechas importantes:');
    console.log('Created At:', credential.created_at);
    console.log('Updated At:', credential.updated_at);
    console.log('Last Used At:', credential.last_used_at || 'Nunca');
    console.log('Expires At:', credential.expires_at || 'No definida');
    
    // Calcular antigüedad
    const createdDate = new Date(credential.created_at);
    const now = new Date();
    const hoursOld = (now - createdDate) / (1000 * 60 * 60);
    console.log('Antigüedad:', hoursOld.toFixed(2), 'horas');
    
    if (hoursOld > 24) {
      console.log('⚠️  La credencial es muy antigua (>24h), probablemente expiró');
    }
    
  } catch (error) {
    console.error('❌ Error general en el debug:', error);
  }
}

// Ejecutar el debug
debugCredentialsContent().then(() => {
  console.log('\n🎯 DEBUG DE CONTENIDO COMPLETADO');
  process.exit(0);
}).catch(error => {
  console.error('❌ ERROR EN DEBUG:', error);
  process.exit(1);
});