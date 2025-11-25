import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase desde el código fuente
const SUPABASE_URL = 'https://tmqglnycivlcjijoymwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugGoogleDriveCredentials() {
  console.log('🔍 DEBUG: Analizando credenciales de Google Drive...\n');
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978';
  
  try {
    // 1. Verificar todas las credenciales de la empresa
    console.log('📋 1. Buscando TODAS las credenciales para la empresa:', companyId);
    const { data: allCredentials, error: allError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive');
    
    if (allError) {
      console.error('❌ Error consultando todas las credenciales:', allError);
      return;
    }
    
    console.log('✅ Credenciales encontradas:', allCredentials?.length || 0);
    
    if (allCredentials && allCredentials.length > 0) {
      allCredentials.forEach((cred, index) => {
        console.log(`\n📄 Credencial ${index + 1}:`);
        console.log('  ID:', cred.id);
        console.log('  Status:', cred.status);
        console.log('  Account Email:', cred.account_email);
        console.log('  Account Name:', cred.account_name);
        console.log('  Created At:', cred.created_at);
        console.log('  Updated At:', cred.updated_at);
        console.log('  Has Access Token:', !!cred.access_token);
        console.log('  Has Refresh Token:', !!cred.refresh_token);
        console.log('  Token Expires At:', cred.token_expires_at);
        console.log('  Client ID:', cred.client_id ? '✅' : '❌');
        console.log('  Client Secret:', cred.client_secret ? '✅' : '❌');
        console.log('  Redirect URI:', cred.redirect_uri);
        
        // Verificar si los tokens están expirados
        if (cred.token_expires_at) {
          const expiryDate = new Date(cred.token_expires_at);
          const now = new Date();
          const isExpired = expiryDate < now;
          console.log('  Token Status:', isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO');
          console.log('  Expiry Date:', expiryDate.toISOString());
          console.log('  Current Time:', now.toISOString());
        }
      });
    }
    
    // 2. Verificar específicamente las credenciales activas
    console.log('\n📋 2. Buscando credenciales ACTIVAS:');
    const { data: activeCredentials, error: activeError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .eq('status', 'active');
    
    if (activeError) {
      console.error('❌ Error consultando credenciales activas:', activeError);
    } else {
      console.log('✅ Credenciales activas encontradas:', activeCredentials?.length || 0);
    }
    
    // 3. Verificar credenciales pendientes de verificación
    console.log('\n📋 3. Buscando credenciales PENDIENTES:');
    const { data: pendingCredentials, error: pendingError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .eq('status', 'pending_verification');
    
    if (pendingError) {
      console.error('❌ Error consultando credenciales pendientes:', pendingError);
    } else {
      console.log('✅ Credenciales pendientes encontradas:', pendingCredentials?.length || 0);
      
      if (pendingCredentials && pendingCredentials.length > 0) {
        console.log('\n⚠️  CREDENCIALES PENDIENTES DETECTADAS:');
        pendingCredentials.forEach((cred, index) => {
          console.log(`\n🔄 Pendiente ${index + 1}:`);
          console.log('  ID:', cred.id);
          console.log('  Account Email:', cred.account_email);
          console.log('  Status:', cred.status);
          console.log('  Created At:', cred.created_at);
          
          // Verificar si tiene tokens pero está pendiente
          if (cred.access_token) {
            console.log('  ⚠️  TIENE ACCESS TOKEN pero está pendiente - Esto podría ser el problema');
          }
        });
      }
    }
    
    // 4. Verificar si hay tokens válidos para usar
    console.log('\n📋 4. Verificando tokens disponibles:');
    const { data: tokenCredentials, error: tokenError } = await supabase
      .from('company_credentials')
      .select('id, account_email, access_token, refresh_token, token_expires_at, status')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .not('access_token', 'is', null);
    
    if (tokenError) {
      console.error('❌ Error consultando tokens:', tokenError);
    } else {
      console.log('✅ Credenciales con tokens encontradas:', tokenCredentials?.length || 0);
      
      if (tokenCredentials && tokenCredentials.length > 0) {
        tokenCredentials.forEach((cred, index) => {
          const expiryDate = cred.token_expires_at ? new Date(cred.token_expires_at) : null;
          const now = new Date();
          const isExpired = expiryDate ? expiryDate < now : false;
          
          console.log(`\n🔑 Token ${index + 1}:`);
          console.log('  Account:', cred.account_email);
          console.log('  Status:', cred.status);
          console.log('  Has Access Token:', !!cred.access_token);
          console.log('  Has Refresh Token:', !!cred.refresh_token);
          console.log('  Token Valid:', !isExpired);
          
          if (isExpired) {
            console.log('  ⚠️  TOKEN EXPIRADO - Necesita refresh');
          }
        });
      }
    }
    
    // 5. Verificar la estructura de la tabla
    console.log('\n📋 5. Verificando estructura de la tabla company_credentials:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('company_credentials')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accediendo a la tabla:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Estructura de tabla válida');
      console.log('Columnas disponibles:', Object.keys(tableInfo[0]));
    } else {
      console.log('ℹ️  La tabla existe pero está vacía');
    }
    
  } catch (error) {
    console.error('❌ Error general en el debug:', error);
  }
}

// Ejecutar el debug
debugGoogleDriveCredentials().then(() => {
  console.log('\n🎯 DEBUG COMPLETADO');
  process.exit(0);
}).catch(error => {
  console.error('❌ ERROR EN DEBUG:', error);
  process.exit(1);
});