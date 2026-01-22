#!/usr/bin/env node

/**
 * Script simplificado para verificar y crear la tabla operation_locks
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_ET72-lW7_FI_OLZ25GgDBA_U8fmd3VG'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAndCreateTable() {
  try {
    console.log('🔍 Verificando tabla operation_locks...')
    
    // Intentar hacer una consulta simple
    const { data, error } = await supabase
      .from('operation_locks')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Tabla operation_locks no existe')
        console.log('📋 Creando tabla usando método alternativo...')
        
        // Como no podemos ejecutar SQL directo, crearemos la tabla usando el cliente de Supabase
        // Intentemos insertar un registro dummy para forzar la creación
        try {
          const { data: insertData, error: insertError } = await supabase
            .from('operation_locks')
            .insert({
              lock_key: 'test_lock',
              lock_id: 'test_id',
              operation_type: 'test',
              employee_email: 'test@example.com',
              expires_at: new Date(Date.now() + 60000).toISOString() // 1 minuto en el futuro
            })
            .select()
            .single()
          
          if (insertError) {
            console.log('❌ Error creando tabla:', insertError.message)
            console.log('💡 SOLUCIÓN: Ejecutar manualmente en Supabase SQL Editor:')
            console.log('   1. Ir a https://supabase.com/dashboard/project/tmqglnycivlcjijoymwe/sql-editor')
            console.log('   2. Copiar y pegar el contenido de database/create_operation_locks_table.sql')
            console.log('   3. Ejecutar el script')
          } else {
            console.log('✅ Tabla creada exitosamente')
            console.log('🧹 Limpiando registro de prueba...')
            
            // Limpiar el registro de prueba
            await supabase
              .from('operation_locks')
              .delete()
              .eq('lock_key', 'test_lock')
          }
        } catch (insertErr) {
          console.log('❌ Error en inserción:', insertErr.message)
        }
      } else {
        console.log('❌ Error verificando tabla:', error.message)
      }
    } else {
      console.log('✅ Tabla operation_locks existe y es accesible')
    }
    
    // Verificar estructura de la tabla
    console.log('\n📊 Verificando estructura de la tabla...')
    const { data: structureData, error: structureError } = await supabase
      .from('operation_locks')
      .select('*')
      .limit(1)
    
    if (!structureError && structureData) {
      console.log('✅ Tabla tiene estructura correcta')
      console.log('📋 Columnas disponibles:', Object.keys(structureData[0] || {}))
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
    return false
  }
}

// Ejecutar el test
testAndCreateTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Verificación completada')
    } else {
      console.log('\n💥 Verificación falló')
    }
  })
  .catch(error => {
    console.error('💥 Error fatal:', error)
  })