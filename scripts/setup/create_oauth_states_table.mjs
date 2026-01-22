/**
 * Script para crear la tabla oauth_states faltante
 * 
 * Este script ejecuta el SQL necesario para crear la tabla oauth_states
 * que es requerida para el funcionamiento de OAuth con Google Drive.
 */

import { supabase } from './src/lib/supabaseClient.js'
import fs from 'fs'
import path from 'path'

console.log('🔧 CREANDO TABLA OAUTH_STATES FALTANTE')
console.log('=' .repeat(50))

async function createOAuthStatesTable() {
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(process.cwd(), 'database', 'oauth_states.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 SQL file loaded successfully')
    
    // Dividir el SQL en comandos individuales
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📋 Found ${sqlCommands.length} SQL commands to execute`)
    
    // Ejecutar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      
      if (command.length === 0) continue
      
      try {
        console.log(`⚡ Executing command ${i + 1}/${sqlCommands.length}...`)
        
        // Usar RPC para ejecutar SQL personalizado
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command + ';'
        })
        
        if (error) {
          // Si RPC no existe, intentar con query directa
          console.log(`⚠️ RPC failed, trying direct query...`)
          
          // Para comandos CREATE TABLE, usar query raw
          if (command.toLowerCase().includes('create table')) {
            const { error: createError } = await supabase
              .from('oauth_states')
              .select('*')
              .limit(1)
            
            if (createError && createError.message.includes('does not exist')) {
              console.log('❌ Table does not exist, need manual creation')
            }
          }
          
          console.log(`⚠️ Command ${i + 1} warning: ${error.message}`)
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`)
        }
        
      } catch (cmdError) {
        console.log(`❌ Command ${i + 1} error: ${cmdError.message}`)
      }
    }
    
    // Verificar si la tabla existe
    console.log('\n🔍 Verificando si la tabla oauth_states existe...')
    const { data, error } = await supabase
      .from('oauth_states')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Table oauth_states still does not exist')
      console.log('Error:', error.message)
      
      // Intentar crear la tabla manualmente con SQL básico
      console.log('\n🛠️ Attempting manual table creation...')
      await createTableManually()
      
    } else {
      console.log('✅ Table oauth_states exists and is accessible!')
    }
    
  } catch (error) {
    console.error('❌ Error creating oauth_states table:', error.message)
  }
}

async function createTableManually() {
  try {
    console.log('📝 Creating oauth_states table manually...')
    
    // SQL básico para crear la tabla
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS oauth_states (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        state TEXT NOT NULL UNIQUE,
        company_id UUID,
        integration_type TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    // Intentar ejecutar con RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    })
    
    if (error) {
      console.log('❌ Manual creation failed:', error.message)
      console.log('💡 Please execute the SQL manually in Supabase dashboard')
    } else {
      console.log('✅ Table created successfully via RPC')
    }
    
  } catch (error) {
    console.error('❌ Manual creation error:', error.message)
  }
}

async function testOAuthStates() {
  try {
    console.log('\n🧪 Testing oauth_states functionality...')
    
    // Intentar insertar un estado de prueba
    const testState = {
      state: 'test_state_' + Date.now(),
      company_id: null,
      integration_type: 'googleDrive',
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hora
    }
    
    const { data, error } = await supabase
      .from('oauth_states')
      .insert([testState])
      .select()
    
    if (error) {
      console.log('❌ Insert test failed:', error.message)
    } else {
      console.log('✅ Insert test successful:', data[0]?.id)
      
      // Limpiar el registro de prueba
      await supabase
        .from('oauth_states')
        .delete()
        .eq('id', data[0]?.id)
      
      console.log('🧹 Test record cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Ejecutar el script
async function main() {
  console.log('🚀 Starting oauth_states table creation...')
  
  await createOAuthStatesTable()
  await testOAuthStates()
  
  console.log('\n🏁 Script completed')
  console.log('\n💡 If table creation failed, please:')
  console.log('   1. Go to Supabase Dashboard')
  console.log('   2. Navigate to SQL Editor')
  console.log('   3. Execute the contents of database/oauth_states.sql')
}

main().catch(console.error)