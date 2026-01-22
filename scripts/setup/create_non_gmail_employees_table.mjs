import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Leer las variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase en las variables de entorno')
  console.log('Necesitas configurar:')
  console.log('- REACT_APP_SUPABASE_URL')
  console.log('- SUPABASE_KEY')
  console.log('Variables disponibles:')
  console.log('- REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ Configurado' : '❌ Falta')
  console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Configurado' : '❌ Falta')
  process.exit(1)
}

// Crear cliente de Supabase con service role (permisos completos)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createNonGmailEmployeesTable() {
  try {
    console.log('🔧 Creando tabla non_gmail_employees...')
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), 'database', 'create_non_gmail_employees_table.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Dividir el SQL en comandos individuales (separados por ;)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
    
    console.log(`📝 Ejecutando ${sqlCommands.length} comandos SQL...`)
    
    // Ejecutar cada comando SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      if (command.length === 0) continue
      
      console.log(`⚡ Ejecutando comando ${i + 1}/${sqlCommands.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: command + ';' 
      })
      
      if (error) {
        // Si el RPC no existe, intentar con query directa
        console.log('🔄 RPC no disponible, intentando con query directa...')
        
        const { error: queryError } = await supabase
          .from('information_schema.tables')
          .select('*')
          .limit(1)
        
        if (queryError) {
          console.error(`❌ Error en comando ${i + 1}:`, error.message)
        }
      }
    }
    
    // Verificar que la tabla se creó correctamente
    console.log('🔍 Verificando que la tabla se creó correctamente...')
    const { data, error } = await supabase
      .from('non_gmail_employees')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error verificando la tabla:', error.message)
      console.log('💡 La tabla podría no haberse creado. Verifica los permisos de Supabase.')
      return false
    }
    
    console.log('✅ ¡Tabla non_gmail_employees creada exitosamente!')
    console.log('📊 Estructura de la tabla:')
    console.log('- id (SERIAL PRIMARY KEY)')
    console.log('- employee_email (VARCHAR, UNIQUE)')
    console.log('- employee_name (VARCHAR)')
    console.log('- company_name (VARCHAR)')
    console.log('- email_type (VARCHAR, default: non_gmail)')
    console.log('- reason (TEXT)')
    console.log('- employee_data (JSONB)')
    console.log('- created_at (TIMESTAMP)')
    console.log('- updated_at (TIMESTAMP)')
    
    return true
    
  } catch (error) {
    console.error('❌ Error creando la tabla:', error.message)
    return false
  }
}

// Ejecutar la función
createNonGmailEmployeesTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 ¡Proceso completado exitosamente!')
      console.log('🚀 La aplicación ya no debería mostrar el error de tabla faltante.')
    } else {
      console.log('\n❌ El proceso falló. Revisa los errores arriba.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Error inesperado:', error)
    process.exit(1)
  })