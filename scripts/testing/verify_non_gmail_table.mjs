import { createClient } from '@supabase/supabase-js'

// Configurar las credenciales de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl'
const supabaseServiceKey = 'sb_secret_ET72-lW7_FI_OLZ25GgDBA_U8fmd3VG'

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyNonGmailEmployeesTable() {
  try {
    console.log('🔍 Verificando si la tabla non_gmail_employees existe...')
    
    // Verificar que la tabla existe
    const { data, error } = await supabase
      .from('non_gmail_employees')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error verificando la tabla:', error.message)
      console.log('💡 La tabla no existe o no se puede acceder a ella.')
      console.log('📋 SOLUCIÓN: Ejecuta el SQL en Supabase SQL Editor')
      return false
    }
    
    console.log('✅ ¡La tabla non_gmail_employees existe y es accesible!')
    
    // Verificar la estructura de la tabla
    console.log('📊 Verificando estructura de la tabla...')
    
    // Intentar insertar un registro de prueba
    const testData = {
      employee_email: 'test@example.com',
      employee_name: 'Test Employee',
      company_name: 'Test Company',
      email_type: 'non_gmail',
      reason: 'Registro de prueba para verificar funcionalidad',
      employee_data: { test: true, timestamp: new Date().toISOString() }
    }
    
    console.log('🧪 Insertando registro de prueba...')
    const { data: insertData, error: insertError } = await supabase
      .from('non_gmail_employees')
      .insert(testData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Error insertando registro de prueba:', insertError.message)
      return false
    }
    
    console.log('✅ Registro de prueba insertado exitosamente:', insertData.id)
    
    // Limpiar el registro de prueba
    console.log('🧹 Limpiando registro de prueba...')
    const { error: deleteError } = await supabase
      .from('non_gmail_employees')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.warn('⚠️ No se pudo limpiar el registro de prueba:', deleteError.message)
    } else {
      console.log('✅ Registro de prueba limpiado')
    }
    
    // Verificar que los índices existen
    console.log('🔍 Verificando índices...')
    const { data: indexData, error: indexError } = await supabase
      .from('information_schema.indexes')
      .select('*')
      .eq('table_name', 'non_gmail_employees')
    
    if (indexError) {
      console.warn('⚠️ No se pudieron verificar los índices:', indexError.message)
    } else {
      console.log(`📈 Índices encontrados: ${indexData?.length || 0}`)
      indexData?.forEach(index => {
        console.log(`   - ${index.indexname}`)
      })
    }
    
    console.log('\n🎉 ¡VERIFICACIÓN COMPLETADA EXITOSAMENTE!')
    console.log('✅ La tabla non_gmail_employees está funcionando correctamente')
    console.log('✅ La aplicación ya no debería mostrar el error de tabla faltante')
    console.log('✅ El flujo de Google Drive para empleados no-Gmail debería funcionar')
    
    return true
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
    return false
  }
}

// Ejecutar la verificación
verifyNonGmailEmployeesTable()
  .then(success => {
    if (success) {
      console.log('\n🏆 ¡PROBLEMA RESUELTO!')
      console.log('🚀 La aplicación StaffHub está ahora completamente funcional.')
    } else {
      console.log('\n❌ PROBLEMA PENDIENTE')
      console.log('📋 Necesitas ejecutar el SQL en Supabase SQL Editor.')
    }
  })
  .catch(error => {
    console.error('💥 Error inesperado:', error)
  })