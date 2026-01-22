import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';

console.log('=== INICIANDO VERIFICACIÓN DE CREDENCIALES ===');

// Leer clave ANON desde el archivo .env
let supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  try {
    const envContent = readFileSync('.env', 'utf8');
    const match = envContent.match(/REACT_APP_SUPABASE_ANON_KEY=(.+)/);
    if (match) {
      supabaseAnonKey = match[1].trim();
      console.log('✅ Clave ANON leída desde .env');
    }
  } catch (err) {
    console.log('❌ No se pudo leer .env:', err.message);
  }
}

if (!supabaseAnonKey) {
  console.error('❌ ERROR: No se encontró REACT_APP_SUPABASE_ANON_KEY');
  console.error('   Defínela como variable de entorno o en el archivo .env');
  process.exit(1);
}

const supabase = createClient(
  'https://supabase.staffhub.cl',
  supabaseAnonKey
);

async function checkCredentials() {
  console.log('Conectando a Supabase...');
  
  const { data: allCredentials, error } = await supabase
    .from('company_credentials')
    .select('*')
    .eq('integration_type', 'google_drive')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log('❌ Error al obtener credenciales:', error.message);
    const errorLog = `Error: ${error.message}\nCódigo: ${error.code}\nDetalles: ${JSON.stringify(error, null, 2)}`;
    writeFileSync('credential_results.txt', errorLog);
    return;
  }
  
  console.log('✅ Conexión exitosa!');
  console.log(`📊 Encontradas ${allCredentials.length} credenciales Google Drive`);
  
  // Generar reporte detallado
  let report = '=== REPORTE COMPLETO DE CREDENCIALES GOOGLE DRIVE ===\n\n';
  report += `Total de credenciales: ${allCredentials.length}\n\n`;
  
  // Contar por status
  const statusCounts = allCredentials.reduce((acc, cred) => {
    acc[cred.status] = (acc[cred.status] || 0) + 1;
    return acc;
  }, {});
  
  report += 'DISTRIBUCIÓN POR STATUS:\n';
  Object.entries(statusCounts).forEach(([status, count]) => {
    const icon = status === 'active' ? '✅' : status === 'inactive' ? '❌' : '⏳';
    report += `  ${icon} ${status}: ${count} credenciales\n`;
  });
  report += '\n';
  
  // Detalles de cada credencial
  allCredentials.forEach((cred, i) => {
    report += `${i + 1}. ${cred.company_name || 'Empresa sin nombre'}\n`;
    report += `   ID: ${cred.id}\n`;
    report += `   Status: ${cred.status}\n`;
    report += `   Email: ${cred.email || 'No registrado'}\n`;
    report += `   Access Token: ${!!cred.access_token ? 'Sí ✅' : 'No ❌'}\n`;
    report += `   Refresh Token: ${!!cred.refresh_token ? 'Sí ✅' : 'No ❌'}\n`;
    report += `   Token Expira: ${cred.token_expires_at || 'No establecido'}\n`;
    report += `   Creada: ${new Date(cred.created_at).toLocaleString()}\n`;
    report += `   Actualizada: ${cred.updated_at ? new Date(cred.updated_at).toLocaleString() : 'Nunca'}\n`;
    report += '\n';
  });
  
  // Resumen de tokens
  const withTokens = allCredentials.filter(c => c.access_token && c.refresh_token).length;
  const withoutTokens = allCredentials.filter(c => !c.access_token || !c.refresh_token).length;
  
  report += '=== RESUMEN DE TOKENS ===\n';
  report += `✅ Con tokens completos: ${withTokens}\n`;
  report += `❌ Sin tokens: ${withoutTokens}\n\n`;
  
  // Credenciales que necesitan reconectar
  const needReconnect = allCredentials.filter(c => 
    c.status === 'pending_verification' || !c.access_token || !c.refresh_token
  );
  
  if (needReconnect.length > 0) {
    report += '🔄 CREDENCIALES QUE NECESITAN RECONECTAR:\n';
    needReconnect.forEach(cred => {
      report += `   - ${cred.company_name} (ID: ${cred.id}) - Status: ${cred.status}\n`;
    });
  } else {
    report += '✅ Todas las credenciales tienen tokens válidos!\n';
  }
  
  // Guardar reporte
  writeFileSync('credential_results.txt', report);
  console.log('✅ Reporte guardado en credential_results.txt');
  
  // Mostrar resumen en consola
  console.log('\n=== RESUMEN EJECUTIVO ===');
  console.log(`Total credenciales: ${allCredentials.length}`);
  console.log(`Con tokens: ${withTokens}`);
  console.log(`Sin tokens: ${withoutTokens}`);
  console.log(`Necesitan reconectar: ${needReconnect.length}`);
}

checkCredentials().catch(err => {
  console.error('Error:', err.message);
  writeFileSync('credential_results.txt', `Error crítico: ${err.message}\n${err.stack}`);
});