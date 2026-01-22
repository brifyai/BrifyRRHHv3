#!/usr/bin/env node

/**
 * Script para eliminar empleado de prueba "Test User"
 * Email: test@example.com
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteTestEmployee() {
  console.log('🗑️ Eliminando empleado de prueba "Test User"...\n')

  try {
    // 1. Buscar el empleado por email
    console.log('1️⃣ Buscando empleado con email: test@example.com')
    const { data: employees, error: searchError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', 'test@example.com')
      .eq('full_name', 'Test User')

    if (searchError) {
      throw new Error(`Error buscando empleado: ${searchError.message}`)
    }

    if (!employees || employees.length === 0) {
      console.log('⚠️ No se encontró empleado con email test@example.com y nombre "Test User"')
      return
    }

    const employee = employees[0]
    console.log(`✅ Empleado encontrado:`)
    console.log(`   ID: ${employee.id}`)
    console.log(`   Nombre: ${employee.full_name}`)
    console.log(`   Email: ${employee.email}`)
    console.log(`   Posición: ${employee.position || 'Sin posición'}`)
    console.log(`   Estado: ${employee.status}`)

    // 2. Verificar si tiene registros relacionados
    console.log('\n2️⃣ Verificando registros relacionados...')

    // Verificar employee_folders
    const { data: folders } = await supabase
      .from('employee_folders')
      .select('id')
      .eq('employee_email', employee.email)

    // Verificar communication_logs
    const { data: commLogs } = await supabase
      .from('communication_logs')
      .select('id')
      .eq('employee_id', employee.id)

    console.log(`   Carpetas de empleado: ${folders?.length || 0}`)
    console.log(`   Logs de comunicación: ${commLogs?.length || 0}`)

    // 3. Eliminar registros relacionados primero
    if (folders && folders.length > 0) {
      console.log('\n3️⃣ Eliminando carpetas de empleado relacionadas...')
      const { error: folderError } = await supabase
        .from('employee_folders')
        .delete()
        .eq('employee_email', employee.email)

      if (folderError) {
        console.warn(`⚠️ Error eliminando carpetas: ${folderError.message}`)
      } else {
        console.log('✅ Carpetas de empleado eliminadas')
      }
    }

    if (commLogs && commLogs.length > 0) {
      console.log('\n4️⃣ Eliminando logs de comunicación relacionados...')
      const { error: commError } = await supabase
        .from('communication_logs')
        .delete()
        .eq('employee_id', employee.id)

      if (commError) {
        console.warn(`⚠️ Error eliminando logs: ${commError.message}`)
      } else {
        console.log('✅ Logs de comunicación eliminados')
      }
    }

    // 5. Eliminar el empleado
    console.log('\n5️⃣ Eliminando empleado...')
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', employee.id)

    if (deleteError) {
      throw new Error(`Error eliminando empleado: ${deleteError.message}`)
    }

    console.log('✅ Empleado "Test User" eliminado exitosamente')
    console.log('\n🎉 Eliminación completada')

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteTestEmployee()
}

export { deleteTestEmployee }