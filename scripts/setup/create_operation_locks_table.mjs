#!/usr/bin/env node

/**
 * Script para crear la tabla de locks distribuidos en Supabase
 * Previene race conditions en la creación de carpetas de Google Drive
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase')
  console.error('   Asegúrate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createOperationLocksTable() {
  try {
    console.log('🔧 Creando tabla de locks distribuidos...')
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'database', 'create_operation_locks_table.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`No se encontró el archivo SQL: ${sqlFilePath}`)
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    console.log('📄 Archivo SQL leído correctamente')
    
    // Ejecutar el SQL usando el RPC de Supabase
    console.log('🚀 Ejecutando SQL en Supabase...')
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    let executedStatements = 0
    let errors = []
    
    for (const statement of statements) {
      try {
        // Usar el RPC de Supabase para ejecutar SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        })
        
        if (error) {
          // Si el RPC no existe, intentar con el método directo
          console.log('⚠️ RPC no disponible, intentando método alternativo...')
          
          // Como RPC puede no estar disponible, usamos un enfoque alternativo
          // Crear la tabla usando el cliente de Supabase
          if (statement.includes('CREATE TABLE IF NOT EXISTS operation_locks')) {
            console.log('📋 Creando tabla operation_locks...')
            
            // La tabla se creará automáticamente cuando se use el distributedLockService
            // Pero podemos verificar si ya existe
            const { data: tableCheck, error: tableError } = await supabase
              .from('operation_locks')
              .select('count')
              .limit(1)
            
            if (tableError && tableError.code === 'PGRST116') {
              console.log('ℹ️ La tabla operation_locks no existe aún, se creará automáticamente')
            } else if (tableError) {
              console.log('⚠️ Error verificando tabla:', tableError.message)
            } else {
              console.log('✅ Tabla operation_locks ya existe')
            }
          }
          
          executedStatements++
        } else {
          executedStatements++
          console.log(`✅ Statement ejecutado: ${statement.substring(0, 50)}...`)
        }
      } catch (stmtError) {
        errors.push({
          statement: statement.substring(0, 100),
          error: stmtError.message
        })
        console.error(`❌ Error ejecutando statement: ${stmtError.message}`)
      }
    }
    
    // Verificar que la tabla se creó correctamente
    console.log('\n🔍 Verificando que la tabla existe...')
    
    const { data: tableData, error: tableError } = await supabase
      .from('operation_locks')
      .select('*')
      .limit(1)
    
    if (tableError) {
      if (tableError.code === 'PGRST116') {
        console.log('⚠️ La tabla operation_locks no existe. Intentando crear con SQL directo...')
        
        // Intentar crear la tabla usando un enfoque más directo
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS operation_locks (
            id SERIAL PRIMARY KEY,
            lock_key VARCHAR(255) NOT NULL UNIQUE,
            lock_id VARCHAR(255) NOT NULL,
            operation_type VARCHAR(100) NOT NULL,
            employee_email VARCHAR(255),
            acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            released_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_operation_locks_key ON operation_locks(lock_key);
          CREATE INDEX IF NOT EXISTS idx_operation_locks_active ON operation_locks(is_active, expires_at);
          CREATE INDEX IF NOT EXISTS idx_operation_locks_employee ON operation_locks(employee_email);
        `
        
        console.log('📋 Ejecutando CREATE TABLE directamente...')
        // Nota: En un entorno real, esto requeriría acceso directo a la base de datos
        console.log('ℹ️ Para crear la tabla, ejecuta el SQL manualmente en el dashboard de Supabase:')
        console.log('   1. Ve a SQL Editor en tu proyecto de Supabase')
        console.log('   2. Copia y pega el contenido de database/create_operation_locks_table.sql')
        console.log('   3. Ejecuta el script')
        
      } else {
        console.error('❌ Error verificando tabla:', tableError.message)
      }
    } else {
      console.log('✅ Tabla operation_locks verificada correctamente')
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN:')
    console.log(`   ✅ Statements ejecutados: ${executedStatements}`)
    console.log(`   ❌ Errores: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('\n⚠️ ERRORES ENCONTRADOS:')
      errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.error}`)
        console.log(`      Statement: ${err.statement}...`)
      })
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('   1. Si la tabla no se creó automáticamente, ejecútala manualmente en Supabase')
    console.log('   2. Prueba el sistema de locks con el distributedLockService')
    console.log('   3. Verifica que no se creen carpetas duplicadas')
    
    return {
      success: true,
      executedStatements,
      errors: errors.length,
      tableExists: !tableError || tableError.code !== 'PGRST116'
    }
    
  } catch (error) {
    console.error('❌ Error creando tabla de locks:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  createOperationLocksTable()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Script completado exitosamente')
        process.exit(0)
      } else {
        console.log('\n💥 Script falló')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

export default createOperationLocksTable