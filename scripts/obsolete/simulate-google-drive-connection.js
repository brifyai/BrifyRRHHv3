const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function simulateGoogleDriveConnection() {
  try {
    console.log('🔗 Simulando conexión de Google Drive...')
    
    // 1. Obtener el usuario
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
    
    if (userError) {
      console.error('❌ Error obteniendo usuario:', userError)
      return
    }
    
    if (!users || users.length === 0) {
      console.error('❌ No se encontraron usuarios')
      return
    }
    
    const user = users[0]
    console.log(`👤 Usuario encontrado: ${user.email} (${user.id})`)
    
    // 2. Insertar credenciales de Google Drive simuladas
    const mockCredentials = {
      user_id: user.id,
      telegram_chat_id: null,
      google_refresh_token: 'mock_refresh_token_' + Date.now(),
      google_access_token: 'mock_access_token_' + Date.now(),
      updated_at: new Date().toISOString()
    }
    
    console.log('💾 Insertando credenciales simuladas...')
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .upsert(mockCredentials)
      .select()
    
    if (credError) {
      console.error('❌ Error insertando credenciales:', credError)
      return
    }
    
    console.log('✅ Credenciales insertadas exitosamente:')
    console.log('   - Refresh Token:', mockCredentials.google_refresh_token)
    console.log('   - Access Token:', mockCredentials.google_access_token)
    console.log('   - Usuario:', user.email)
    
    // 3. Verificar que las credenciales se guardaron
    console.log('\n🔍 Verificando credenciales guardadas...')
    const { data: verifyCredentials, error: verifyError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', user.id)
    
    if (verifyError) {
      console.error('❌ Error verificando credenciales:', verifyError)
      return
    }
    
    if (verifyCredentials && verifyCredentials.length > 0) {
      const cred = verifyCredentials[0]
      console.log('✅ Credenciales verificadas:')
      console.log(`   - ID: ${cred.id}`)
      console.log(`   - Google Refresh Token: ${cred.google_refresh_token ? 'Presente' : 'Ausente'}`)
      console.log(`   - Google Access Token: ${cred.google_access_token ? 'Presente' : 'Ausente'}`)
      console.log(`   - Creado: ${cred.created_at}`)
      console.log(`   - Actualizado: ${cred.updated_at}`)
    }
    
    console.log('\n🎉 Simulación completada exitosamente!')
    console.log('📝 Ahora puedes:')
    console.log('   1. Recargar la página de configuración')
    console.log('   2. Ir a la sección de Integraciones')
    console.log('   3. Verificar que Google Drive aparezca como "Conectado"')
    console.log('   4. El dashboard debería mostrar el estado correcto')
    
    console.log('\n⚠️  Nota: Estas son credenciales simuladas para demostración.')
    console.log('   Para conectar Google Drive realmente, usa el botón "Configurar Google Drive"')
    
  } catch (error) {
    console.error('❌ Error en la simulación:', error)
  }
}

// Función para limpiar las credenciales simuladas
async function cleanSimulatedCredentials() {
  try {
    console.log('🧹 Limpiando credenciales simuladas...')
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      console.error('❌ No se encontraron usuarios')
      return
    }
    
    const user = users[0]
    
    const { error: deleteError } = await supabase
      .from('user_credentials')
      .delete()
      .eq('user_id', user.id)
      .like('google_refresh_token', 'mock_refresh_token_%')
    
    if (deleteError) {
      console.error('❌ Error limpiando credenciales:', deleteError)
    } else {
      console.log('✅ Credenciales simuladas eliminadas')
    }
    
  } catch (error) {
    console.error('❌ Error limpiando credenciales:', error)
  }
}

// Ejecutar según el argumento de línea de comandos
const command = process.argv[2]

if (command === 'clean') {
  cleanSimulatedCredentials()
} else {
  simulateGoogleDriveConnection()
}