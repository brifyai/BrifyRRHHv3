/**
 * Script para crear la tabla oauth_states usando cliente de servidor
 * 
 * Este script usa el cliente de servidor de Supabase que tiene permisos
 * de service role para crear la tabla oauth_states directamente.
 */

import { getSupabaseServer } from './src/lib/supabaseServer.js'

console.log('🔧 CREANDO TABLA OAUTH_STATES CON CLIENTE SERVIDOR')
console.log('=' .repeat(55))

async function createOAuthStatesTableWithServer() {
  try {
    console.log('🔗 Getting server client...')
    const serverClient = getSupabaseServer()
    
    console.log('📝 Creating oauth_states table...')
    
    // SQL para crear la tabla oauth_states
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS oauth_states (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        state TEXT NOT NULL UNIQUE,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        integration_type TEXT NOT NULL CHECK (integration_type IN (
          'googleDrive',
          'googleMeet', 
          'slack',
          'teams',
          'hubspot',
          'brevo',
          'whatsappBusiness',
          'whatsappOfficial',
          'whatsappWAHA',
          'telegram'
        )),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    // Intentar crear la tabla usando una consulta directa
    // Como no podemos ejecutar SQL directo, vamos a intentar un enfoque diferente
    console.log('🧪 Testing table existence...')
    
    // Primero verificar si la tabla existe
    const { data, error } = await serverClient
      .from('oauth_states')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Table does not exist, creating...')
      
      // Intentar insertar para forzar la creación de la tabla
      // Esto fallará pero nos dará información sobre qué campos faltan
      try {
        await serverClient
          .from('oauth_states')
          .insert([{
            state: 'test_state',
            integration_type: 'googleDrive',
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }])
      } catch (insertError) {
        console.log('📋 Insert test result:', insertError.message)
      }
      
    } else {
      console.log('✅ Table oauth_states exists and is accessible!')
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('❌ Error with server client:', error.message)
    return false
  }
}

async function createTableWithDirectSQL() {
  try {
    console.log('\n🛠️ Attempting direct SQL execution...')
    
    // Leer el archivo SQL y ejecutar comandos básicos
    const fs = await import('fs')
    const sqlPath = './database/oauth_states.sql'
    
    if (!fs.existsSync(sqlPath)) {
      console.log('❌ SQL file not found:', sqlPath)
      return false
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log('📄 SQL file loaded')
    
    // Extraer solo el CREATE TABLE
    const createTableMatch = sqlContent.match(/CREATE TABLE[^;]+;/s)
    
    if (createTableMatch) {
      const createTableSQL = createTableMatch[0]
      console.log('📝 Extracted CREATE TABLE statement')
      
      // Aquí normalmente ejecutaríamos el SQL, pero como no tenemos
      // acceso directo, vamos a documentar qué necesita hacerse
      console.log('💡 SQL to execute manually:')
      console.log(createTableSQL)
      
      return false
    }
    
    return false
    
  } catch (error) {
    console.error('❌ Direct SQL error:', error.message)
    return false
  }
}

async function provideManualInstructions() {
  console.log('\n📋 INSTRUCCIONES MANUALES PARA CREAR LA TABLA')
  console.log('=' .repeat(55))
  
  console.log('\n🔗 PASOS PARA CREAR LA TABLA OAUTH_STATES:')
  console.log('\n1. 📊 Ir al Dashboard de Supabase:')
  console.log('   https://supabase.com/dashboard')
  
  console.log('\n2. 🏢 Seleccionar el proyecto:')
  console.log('   - Buscar proyecto con URL: tmqglnycivlcjijoymwe.supabase.co')
  
  console.log('\n3. 📝 Ir al SQL Editor:')
  console.log('   - En el menú lateral, hacer clic en "SQL Editor"')
  
  console.log('\n4. 🗂️ Crear nueva consulta:')
  console.log('   - Hacer clic en "New query"')
  
  console.log('\n5. 📋 Copiar y pegar el siguiente SQL:')
  console.log('\n' + '='.repeat(50))
  console.log(`-- Tabla para almacenar temporalmente los estados de OAuth
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN (
        'googleDrive',
        'googleMeet', 
        'slack',
        'teams',
        'hubspot',
        'brevo',
        'whatsappBusiness',
        'whatsappOfficial',
        'whatsappWAHA',
        'telegram'
    )),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_company_id ON oauth_states(company_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver/editar estados de OAuth de su empresa
CREATE POLICY "Users can view oauth states" ON oauth_states
    FOR SELECT USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert oauth states" ON oauth_states
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update oauth states" ON oauth_states
    FOR UPDATE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete oauth states" ON oauth_states
    FOR DELETE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );`)
  console.log('='.repeat(50))
  
  console.log('\n6. ▶️ Ejecutar la consulta:')
  console.log('   - Hacer clic en "Run"')
  
  console.log('\n7. ✅ Verificar creación:')
  console.log('   - Ir a "Table Editor" en el menú lateral')
  console.log('   - Buscar la tabla "oauth_states"')
  
  console.log('\n8. 🧪 Probar funcionalidad:')
  console.log('   - Regresar a la aplicación')
  console.log('   - Intentar conectar Google Drive nuevamente')
  
  console.log('\n💡 NOTA: Después de crear la tabla, el error de OAuth debería resolverse.')
}

async function testOAuthAfterCreation() {
  try {
    console.log('\n🧪 Testing OAuth functionality after table creation...')
    
    const { supabase } = await import('./src/lib/supabaseClient.js')
    
    // Intentar crear un estado de OAuth de prueba
    const testState = {
      state: 'test_oauth_state_' + Date.now(),
      integration_type: 'googleDrive',
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }
    
    const { data, error } = await supabase
      .from('oauth_states')
      .insert([testState])
      .select()
    
    if (error) {
      console.log('❌ OAuth test failed:', error.message)
      return false
    } else {
      console.log('✅ OAuth test successful!')
      console.log('🗑️ Cleaning up test record...')
      
      // Limpiar registro de prueba
      await supabase
        .from('oauth_states')
        .delete()
        .eq('id', data[0].id)
      
      return true
    }
    
  } catch (error) {
    console.error('❌ OAuth test error:', error.message)
    return false
  }
}

// Ejecutar el script
async function main() {
  console.log('🚀 Starting oauth_states table creation process...')
  
  // Intentar con cliente de servidor
  const serverSuccess = await createOAuthStatesTableWithServer()
  
  if (!serverSuccess) {
    // Intentar con SQL directo
    const directSuccess = await createTableWithDirectSQL()
    
    if (!directSuccess) {
      // Proporcionar instrucciones manuales
      await provideManualInstructions()
    }
  }
  
  // Probar funcionalidad OAuth
  await testOAuthAfterCreation()
  
  console.log('\n🏁 Process completed')
  console.log('\n📞 Si necesitas ayuda, contacta al desarrollador.')
}

main().catch(console.error)