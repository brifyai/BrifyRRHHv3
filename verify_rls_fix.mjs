#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICACIÓN: Confirmar que el fix de RLS funcionó
 * 
 * INSTRUCCIONES:
 * 1. Primero ejecuta el SQL en Supabase Dashboard
 * 2. Luego corre este script para verificar
 * 3. Deberías ver "✅ Inserción exitosa" si todo funciona
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyRLSFix() {
  console.log('🔍 VERIFICANDO FIX DE RLS\n')
  
  try {
    // Intentar una inserción de prueba
    console.log('🧪 Intentando insertar registro de prueba...')
    
    const testData = {
      user_id: null,
      scope: 'global',
      company_id: null,
      category: 'system',
      config_key: 'hierarchy_mode_verification_test',
      config_value: 'company_first',
      description: 'Verificación de fix RLS',
      is_active: true,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('system_configurations')
      .upsert(testData, {
        onConflict: 'user_id,scope,company_id,category,config_key'
      })
      .select()
    
    if (error) {
      console.error('❌ ERROR: El fix no funcionó')
      console.error('Mensaje:', error.message)
      console.error('Código:', error.code)
      console.error('\n💡 SOLUCIÓN: Asegúrate de haber ejecutado el SQL en Supabase Dashboard')
      console.error('   Ve a: https://supabase.com/dashboard → SQL Editor → Pega y ejecuta el SQL')
      process.exit(1)
    } else {
      console.log('✅ ÉXITO: Inserción funcionó correctamente')
      console.log('📄 Registro creado:', JSON.stringify(data, null, 2))
      
      // Limpiar
      console.log('\n🧹 Limpiando registro de prueba...')
      await supabase
        .from('system_configurations')
        .delete()
        .eq('config_key', 'hierarchy_mode_verification_test')
      
      console.log('✅ Verificación completada - El fix está funcionando')
      console.log('\n🎉 AHORA PUEDES:')
      console.log('   1. Ir a la aplicación')
      console.log('   2. Cambiar el modo de jerarquía en Configuración')
      console.log('   3. El error 400 debería estar resuelto')
    }
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
    process.exit(1)
  }
}

verifyRLSFix().catch(console.error)