/**
 * Script de verificación final para la tabla oauth_states
 * 
 * Este script verifica si la tabla oauth_states se creó correctamente
 * y prueba la funcionalidad OAuth de Google Drive.
 */

import { supabase } from './src/lib/supabaseClient.js'

console.log('🧪 VERIFICACIÓN FINAL: TABLA OAUTH_STATES')
console.log('=' .repeat(50))

async function verifyOAuthStatesTable() {
  try {
    console.log('🔍 Verificando existencia de la tabla oauth_states...')
    
    // Test 1: Verificar si la tabla existe
    const { data, error } = await supabase
      .from('oauth_states')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ TABLA NO EXISTE:', error.message)
      console.log('\n💡 SOLUCIÓN:')
      console.log('   1. Ir a Supabase Dashboard')
      console.log('   2. SQL Editor → New query')
      console.log('   3. Ejecutar el contenido de OAUTH_STATES_TABLE_CREATION.sql')
      return false
    }
    
    console.log('✅ Tabla oauth_states existe y es accesible')
    
    // Test 2: Verificar estructura de la tabla
    console.log('\n📋 Verificando estructura de la tabla...')
    const { data: structure, error: structureError } = await supabase
      .from('oauth_states')
      .select('*')
      .limit(1)
    
    if (structureError) {
      console.log('⚠️ Error obteniendo estructura:', structureError.message)
    } else {
      console.log('✅ Estructura de tabla accesible')
    }
    
    // Test 3: Probar inserción de datos
    console.log('\n🧪 Probando inserción de datos...')
    const testState = {
      state: 'test_verification_' + Date.now(),
      integration_type: 'googleDrive',
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('oauth_states')
      .insert([testState])
      .select()
    
    if (insertError) {
      console.log('❌ Error en inserción:', insertError.message)
      return false
    }
    
    console.log('✅ Inserción exitosa:', insertData[0]?.id)
    
    // Test 4: Probar consulta
    console.log('\n🔍 Probando consulta de datos...')
    const { data: queryData, error: queryError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('id', insertData[0].id)
      .single()
    
    if (queryError) {
      console.log('❌ Error en consulta:', queryError.message)
    } else {
      console.log('✅ Consulta exitosa')
    }
    
    // Test 5: Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    const { error: deleteError } = await supabase
      .from('oauth_states')
      .delete()
      .eq('id', insertData[0].id)
    
    if (deleteError) {
      console.log('⚠️ Error limpiando datos:', deleteError.message)
    } else {
      console.log('✅ Datos de prueba eliminados')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message)
    return false
  }
}

async function testOAuthFunctionality() {
  try {
    console.log('\n🚀 Probando funcionalidad OAuth...')
    
    // Simular flujo OAuth
    const oauthState = {
      state: 'oauth_test_' + Date.now(),
      integration_type: 'googleDrive',
      expires_at: new Date(Date.now() + 1800000).toISOString() // 30 minutos
    }
    
    const { data, error } = await supabase
      .from('oauth_states')
      .insert([oauthState])
      .select()
    
    if (error) {
      console.log('❌ Error en flujo OAuth:', error.message)
      return false
    }
    
    console.log('✅ Estado OAuth creado exitosamente')
    console.log('🗑️ Limpiando estado de prueba...')
    
    await supabase
      .from('oauth_states')
      .delete()
      .eq('id', data[0].id)
    
    console.log('✅ Limpieza completada')
    return true
    
  } catch (error) {
    console.error('❌ Error en funcionalidad OAuth:', error.message)
    return false
  }
}

async function provideNextSteps(success) {
  if (success) {
    console.log('\n🎉 ¡VERIFICACIÓN EXITOSA!')
    console.log('=' .repeat(40))
    console.log('✅ Tabla oauth_states creada correctamente')
    console.log('✅ Funcionalidad OAuth operativa')
    console.log('✅ Google Drive debería funcionar ahora')
    
    console.log('\n📋 PRÓXIMOS PASOS:')
    console.log('1. 🔄 Recargar la aplicación')
    console.log('2. 🧪 Probar conexión Google Drive')
    console.log('3. ✅ Verificar que no aparezca el error')
    
    console.log('\n💡 Si el problema persiste:')
    console.log('- Verificar credenciales Google Drive')
    console.log('- Revisar configuración OAuth en Google Cloud')
    console.log('- Comprobar URLs de redirección')
    
  } else {
    console.log('\n❌ VERIFICACIÓN FALLIDA')
    console.log('=' .repeat(40))
    console.log('⚠️ La tabla oauth_states no se creó correctamente')
    
    console.log('\n🛠️ ACCIONES REQUERIDAS:')
    console.log('1. 📊 Ir a Supabase Dashboard')
    console.log('2. 📝 SQL Editor → New query')
    console.log('3. 📋 Copiar contenido de OAUTH_STATES_TABLE_CREATION.sql')
    console.log('4. ▶️ Ejecutar el SQL')
    console.log('5. 🔄 Ejecutar este script nuevamente')
    
    console.log('\n📞 SOPORTE:')
    console.log('- Revisar SOLUCION_OAUTH_STATES_TABLA_FALTANTE.md')
    console.log('- Verificar permisos en Supabase')
    console.log('- Comprobar que el proyecto esté activo')
  }
}

// Ejecutar verificación
async function main() {
  console.log('🚀 Iniciando verificación completa...')
  
  const tableSuccess = await verifyOAuthStatesTable()
  const oauthSuccess = await testOAuthFunctionality()
  
  const overallSuccess = tableSuccess && oauthSuccess
  
  await provideNextSteps(overallSuccess)
  
  console.log('\n🏁 Verificación completada')
  process.exit(overallSuccess ? 0 : 1)
}

main().catch(console.error)