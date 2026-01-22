/**
 * Debug en vivo del flujo OAuth
 * Verifica variables de entorno y estado del sistema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('=== 🔍 DEBUG EN VIVO DE OAUTH ===\n');

// Configuración
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 
  (() => {
    try {
      const envContent = readFileSync('.env', 'utf8');
      const match = envContent.match(/REACT_APP_SUPABASE_ANON_KEY=(.+)/);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  })();

if (!supabaseAnonKey) {
  console.error('❌ No se encontró REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugOAuth() {
  console.log('📋 VERIFICANDO CONFIGURACIÓN ACTUAL...\n');

  // 1. Verificar variables de entorno
  console.log('1. VARIABLES DE ENTORNO:');
  const envVars = [
    'REACT_APP_GOOGLE_CLIENT_ID',
    'REACT_APP_GOOGLE_CLIENT_SECRET',
    'REACT_APP_GOOGLE_REDIRECT_URI',
    'REACT_APP_GOOGLE_API_KEY'
  ];

  envVars.forEach(varName => {
    const value = process.env[varName];
    const status = value && value !== 'undefined' && !value.includes('YOUR_') ? '✅' : '❌';
    const displayValue = value ? 
      (value.includes('secret') || value.length > 50 ? '***' + value.slice(-8) : value) : 
      'VACÍO/UNDEFINED';
    
    console.log(`   ${status} ${varName}: ${displayValue}`);
  });

  console.log('\n2. ESTADO DE CREDENCIALES EN BD:');
  
  // 2. Verificar credenciales Google Drive
  const { data: credentials, error } = await supabase
    .from('company_credentials')
    .select('*')
    .eq('integration_type', 'google_drive')
    .order('created_at', { ascending: false });

  if (error) {
    console.log(`   ❌ Error: ${error.message}`);
  } else {
    console.log(`   📊 Total de credenciales: ${credentials.length}`);
    
    credentials.forEach((cred, i) => {
      const hasTokens = !!cred.access_token && !!cred.refresh_token;
      console.log(`   ${i + 1}. ${cred.company_name || 'Empresa sin nombre'}`);
      console.log(`      Status: ${cred.status}`);
      console.log(`      Email: ${cred.email || 'N/A'}`);
      console.log(`      Tiene tokens: ${hasTokens ? '✅ SÍ' : '❌ NO'}`);
      if (hasTokens) {
        console.log(`      Token expira: ${cred.token_expires_at}`);
      }
    });
  }

  console.log('\n3. ANÁLISIS DE PROBLEMAS:');
  
  // 3. Identificar problemas
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;

  if (!clientId || clientId === 'undefined') {
    console.log('   ❌ CRÍTICO: REACT_APP_GOOGLE_CLIENT_ID no está cargado');
    console.log('      💡 Solución: Verifica que .env exista y contenga la variable');
  }

  if (!clientSecret || clientSecret === 'undefined') {
    console.log('   ❌ CRÍTICO: REACT_APP_GOOGLE_CLIENT_SECRET no está cargado');
    console.log('      💡 Solución: Verifica que .env contenga el client secret');
  }

  const credsWithTokens = credentials?.filter(c => c.access_token && c.refresh_token) || [];
  const credsWithoutTokens = credentials?.filter(c => !c.access_token || !c.refresh_token) || [];

  console.log(`\n   📈 Resumen:`);
  console.log(`      - Con tokens: ${credsWithTokens.length}`);
  console.log(`      - Sin tokens: ${credsWithoutTokens.length}`);

  if (credsWithoutTokens.length > 0) {
    console.log(`\n   🔄 CREDENCIALES QUE NECESITAN RECONECTAR:`);
    credsWithoutTokens.forEach(cred => {
      console.log(`      - ${cred.company_name} (ID: ${cred.id})`);
    });
    console.log(`\n      💡 Solución: Ve a Configuración → Integraciones → Google Drive`);
    console.log(`                  y haz clic en "Conectar con Google" para cada una`);
  }

  console.log('\n4. VERIFICACIÓN DE FLUJO OAUTH:');
  console.log('   Para probar el flujo completo:');
  console.log('   1. Ve a http://localhost:3000');
  console.log('   2. Inicia sesión');
  console.log('   3. Ve a Configuración → Integraciones → Google Drive');
  console.log('   4. Selecciona una empresa');
  console.log('   5. Haz clic en "Conectar con Google"');
  console.log('   6. Autoriza la aplicación');
  console.log('   7. Verifica en consola que aparece: "✅ Tokens guardados"');

  console.log('\n5. SI EL ERROR 400 PERSISTE:');
  console.log('   El error 400 significa que la petición a Google es inválida.');
  console.log('   Posibles causas:');
  console.log('   - Client ID o Client Secret incorrectos');
  console.log('   - Refresh token inválido o revocado');
  console.log('   - La app de Google Cloud no está configurada correctamente');
  console.log('\n   💡 Verifica en Google Cloud Console:');
  console.log('      - APIs habilitadas: Google Drive API');
  console.log('      - OAuth consent screen: configurado');
  console.log('      - Authorized redirect URIs: incluyen http://localhost:3000/auth/google/callback');
}

debugOAuth().catch(error => {
  console.error('❌ Error en debug:', error.message);
});