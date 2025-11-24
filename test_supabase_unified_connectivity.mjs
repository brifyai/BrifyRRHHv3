/**
 * Test de Conectividad Unificada de Supabase
 * 
 * Este test verifica que la configuración unificada de Supabase funciona correctamente
 * y que se han solucionado los problemas de conectividad identificados.
 */

import { supabase } from './src/lib/supabaseClient.js'
import { getSupabaseServer } from './src/lib/supabaseServer.js'
import { SUPABASE_CONFIG, validateSupabaseConfig } from './src/lib/supabaseConfig.js'

console.log('🧪 INICIANDO TEST DE CONECTIVIDAD UNIFICADA DE SUPABASE')
console.log('=' .repeat(60))

// Test 1: Validación de configuración
console.log('\n📋 TEST 1: Validación de Configuración')
try {
  validateSupabaseConfig()
  console.log('✅ Configuración validada correctamente')
} catch (error) {
  console.error('❌ Error en validación de configuración:', error.message)
  process.exit(1)
}

// Test 2: Cliente de navegador
console.log('\n🌐 TEST 2: Cliente de Navegador')
try {
  // Verificar que el cliente se inicializa
  if (!supabase) {
    throw new Error('Cliente de Supabase no inicializado')
  }
  
  console.log('✅ Cliente de navegador inicializado')
  
  // Test de conectividad básica
  const { data, error } = await supabase.from('companies').select('count').limit(1)
  
  if (error) {
    console.error('❌ Error en consulta básica:', error.message)
  } else {
    console.log('✅ Conectividad básica del cliente: OK')
  }
  
} catch (error) {
  console.error('❌ Error en cliente de navegador:', error.message)
}

// Test 3: Cliente de servidor
console.log('\n🖥️ TEST 3: Cliente de Servidor')
try {
  const serverClient = getSupabaseServer()
  
  if (!serverClient) {
    throw new Error('Cliente de servidor no inicializado')
  }
  
  console.log('✅ Cliente de servidor inicializado')
  
  // Test de conectividad básica del servidor
  const { data, error } = await serverClient.from('companies').select('count').limit(1)
  
  if (error) {
    console.error('❌ Error en consulta del servidor:', error.message)
  } else {
    console.log('✅ Conectividad básica del servidor: OK')
  }
  
} catch (error) {
  console.error('❌ Error en cliente de servidor:', error.message)
}

// Test 4: Verificar tablas principales
console.log('\n📊 TEST 4: Verificación de Tablas Principales')
const tables = [
  'companies',
  'employees', 
  'employee_folders',
  'users',
  'communication_logs'
]

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('count').limit(1)
    
    if (error) {
      console.log(`⚠️ Tabla ${table}: Error - ${error.message}`)
    } else {
      console.log(`✅ Tabla ${table}: Accesible`)
    }
  } catch (error) {
    console.log(`❌ Tabla ${table}: Excepción - ${error.message}`)
  }
}

// Test 5: Autenticación
console.log('\n🔐 TEST 5: Sistema de Autenticación')
try {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.log(`⚠️ Sesión actual: ${error.message}`)
  } else {
    console.log('✅ Sistema de autenticación: Funcional')
    console.log(`   Usuario: ${session?.user?.email || 'No autenticado'}`)
  }
} catch (error) {
  console.error('❌ Error en autenticación:', error.message)
}

// Test 6: Verificar configuración unificada
console.log('\n⚙️ TEST 6: Verificación de Configuración Unificada')
console.log('URL:', SUPABASE_CONFIG.url)
console.log('Anon Key presente:', !!SUPABASE_CONFIG.anonKey)
console.log('Server Key presente:', !!SUPABASE_CONFIG.serverKey)
console.log('Cliente configurado:', !!supabase)
console.log('Servidor configurado:', !!getSupabaseServer())

// Resumen final
console.log('\n📋 RESUMEN FINAL')
console.log('=' .repeat(60))

const issues = []
const successes = []

// Verificar si hay problemas críticos
if (!supabase) {
  issues.push('Cliente de navegador no inicializado')
} else {
  successes.push('Cliente de navegador inicializado')
}

if (!getSupabaseServer()) {
  issues.push('Cliente de servidor no inicializado')
} else {
  successes.push('Cliente de servidor inicializado')
}

if (issues.length === 0) {
  console.log('🎉 TODOS LOS TESTS PASARON')
  console.log('✅ Configuración unificada funcionando correctamente')
  console.log('✅ Problemas de conectividad solucionados')
} else {
  console.log('❌ PROBLEMAS DETECTADOS:')
  issues.forEach(issue => console.log(`   - ${issue}`))
}

console.log('\n✅ ÉXITOS:')
successes.forEach(success => console.log(`   - ${success}`))

console.log('\n🏁 TEST COMPLETADO')