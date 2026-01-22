#!/usr/bin/env node

/**
 * Script directo para verificar y eliminar empleado test
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔍 Verificando empleado test@example.com...')
  
  try {
    // Buscar empleado
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', 'test@example.com')

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No se encontró empleado con email test@example.com')
      return
    }

    console.log(`✅ Encontrado: ${data[0].full_name} (${data[0].email})`)
    
    // Eliminar empleado
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('email', 'test@example.com')

    if (deleteError) {
      console.error('❌ Error eliminando:', deleteError.message)
    } else {
      console.log('✅ Empleado eliminado exitosamente')
    }

  } catch (err) {
    console.error('❌ Error general:', err.message)
  }
}

main()