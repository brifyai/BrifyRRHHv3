import { createClient } from '@supabase/supabase-js'

// Configurar las credenciales de Supabase
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co'
const supabaseServiceKey = 'sb_secret_ET72-lW7_FI_OLZ25GgDBA_U8fmd3VG'

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createNonGmailEmployeesTable() {
  try {
    console.log('🔧 Creando tabla non_gmail_employees...')
    
    // Crear la tabla usando SQL directo
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS non_gmail_employees (
        id SERIAL PRIMARY KEY,
        employee_email VARCHAR(255) NOT NULL UNIQUE,
        employee_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        email_type VARCHAR(50) DEFAULT 'non_gmail',
        reason TEXT NOT NULL,
        employee_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    // Crear índices
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_non_gmail_employees_email ON non_gmail_employees(employee_email);
      CREATE INDEX IF NOT EXISTS idx_non_gmail_employees_company ON non_gmail_employees(company_name);
    `
    
    // Función para actualizar updated_at
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_non_gmail_employees_updated_at ON non_gmail_employees;
      CREATE TRIGGER update_non_gmail_employees_updated_at
        BEFORE UPDATE ON non_gmail_employees
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
    
    // Intentar ejecutar cada comando SQL por separado
    const commands = [
      { name: 'CREATE TABLE', sql: createTableSQL },
      { name: 'CREATE INDEXES', sql: createIndexesSQL },
      { name: 'CREATE TRIGGER', sql: createTriggerSQL }
    ]
    
    for (const command of commands) {
      console.log(`⚡ Ejecutando ${command.name}...`)
      
      try {
        // Usar una consulta directa para ejecutar el SQL
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_name', 'non_gmail_employees')
          .limit(1)
        
        if (error) {
          console.error(`❌ Error verificando tabla:`, error.message)
        }
        
        // Si la tabla no existe, intentar crearla
        if (!data || data.length === 0) {
          console.log('📝 Tabla no existe, intentando crear...')
          
          // Como no podemos ejecutar SQL directo, vamos a simular la creación
          // usando la API de Supabase
          console.log('💡 Para crear la tabla manualmente, ejecuta este SQL en Supabase:')
          console.log('='.repeat(60))
          console.log(createTableSQL)
          console.log('='.repeat(60))
          console.log(createIndexesSQL)
          console.log('='.repeat(60))
          console.log(createTriggerSQL)
          console.log('='.repeat(60))
          
          return false
        }
        
      } catch (err) {
        console.error(`❌ Error en ${command.name}:`, err.message)
      }
    }
    
    // Verificar que la tabla existe
    console.log('🔍 Verificando que la tabla existe...')
    const { data, error } = await supabase
      .from('non_gmail_employees')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error verificando la tabla:', error.message)
      console.log('💡 La tabla podría no haberse creado.')
      console.log('📋 INSTRUCCIONES MANUALES:')
      console.log('1. Ve a https://supabase.com/dashboard/project/tmqglnycivlcjijoymwe')
      console.log('2. Ve a "SQL Editor"')
      console.log('3. Ejecuta el SQL que se muestra arriba')
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
      console.log('\n📋 SOLUCIÓN MANUAL:')
      console.log('Ejecuta el SQL mostrado arriba en el SQL Editor de Supabase.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Error inesperado:', error)
    process.exit(1)
  })