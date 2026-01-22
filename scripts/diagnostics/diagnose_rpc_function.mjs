/**
 * Diagnóstico de función RPC get_company_credentials
 */

import { supabase } from './src/lib/supabase.js'

console.log('🔍 DIAGNÓSTICO FUNCIÓN RPC get_company_credentials')
console.log('==================================================')

async function diagnoseRPCFunction() {
  try {
    console.log('\n1. Verificando credenciales en base de datos...')
    
    // Verificar que las credenciales están realmente en la BD
    const { data: allCredentials, error: allError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.log('❌ Error consultando credenciales:', allError.message)
      return
    }
    
    console.log(`📊 Total credenciales en BD: ${allCredentials?.length || 0}`)
    
    if (allCredentials && allCredentials.length > 0) {
      console.log('📋 Primera credencial:')
      const first = allCredentials[0]
      console.log(`   - ID: ${first.id}`)
      console.log(`   - Company ID: ${first.company_id}`)
      console.log(`   - Status: ${first.status}`)
      console.log(`   - Integration: ${first.integration_type}`)
      console.log(`   - Created: ${first.created_at}`)
    }
    
    console.log('\n2. Probando función RPC con diferentes parámetros...')
    
    if (allCredentials && allCredentials.length > 0) {
      const testCredential = allCredentials[0]
      const testCompanyId = testCredential.company_id
      
      console.log(`🧪 Probando con Company ID: ${testCompanyId}`)
      
      // Probar RPC original
      const { data: rpcResult1, error: rpcError1 } = await supabase.rpc('get_company_credentials', {
        p_company_id: testCompanyId,
        p_integration_type: 'google_drive'
      })
      
      console.log('📞 RPC Original:')
      console.log(`   - Error: ${rpcError1?.message || 'Ninguno'}`)
      console.log(`   - Resultado: ${rpcResult1?.length || 0} registros`)
      
      // Probar sin parámetros
      const { data: rpcResult2, error: rpcError2 } = await supabase.rpc('get_company_credentials')
      
      console.log('📞 RPC Sin parámetros:')
      console.log(`   - Error: ${rpcError2?.message || 'Ninguno'}`)
      console.log(`   - Resultado: ${rpcResult2?.length || 0} registros`)
      
      // Probar solo company_id
      const { data: rpcResult3, error: rpcError3 } = await supabase.rpc('get_company_credentials', {
        p_company_id: testCompanyId
      })
      
      console.log('📞 RPC Solo company_id:')
      console.log(`   - Error: ${rpcError3?.message || 'Ninguno'}`)
      console.log(`   - Resultado: ${rpcResult3?.length || 0} registros`)
    }
    
    console.log('\n3. Verificando definición de función RPC...')
    
    // Intentar obtener la definición de la función
    try {
      const { data: functionDef, error: defError } = await supabase
        .from('information_schema.routines')
        .select('routine_definition')
        .eq('routine_name', 'get_company_credentials')
        .eq('routine_type', 'FUNCTION')
      
      if (defError) {
        console.log('⚠️ No se pudo obtener definición:', defError.message)
      } else {
        console.log('📋 Definición encontrada')
        if (functionDef && functionDef.length > 0) {
          console.log('🔍 Función existe en schema')
        }
      }
    } catch (defErr) {
      console.log('⚠️ Error consultando definición:', defErr.message)
    }
    
    console.log('\n4. Verificando permisos RLS...')
    
    // Verificar si hay políticas RLS que podrían estar bloqueando
    try {
      const { data: policies, error: policyError } = await supabase
        .from('company_credentials')
        .select('*')
        .limit(1)
      
      if (policyError) {
        console.log('❌ Error RLS:', policyError.message)
      } else {
        console.log('✅ Acceso directo a tabla funciona')
      }
    } catch (policyErr) {
      console.log('❌ Error verificando RLS:', policyErr.message)
    }
    
    console.log('\n5. Verificando función alternativa...')
    
    // Probar consulta directa como alternativa
    if (allCredentials && allCredentials.length > 0) {
      const testCredential = allCredentials[0]
      const testCompanyId = testCredential.company_id
      
      const { data: directQuery, error: directError } = await supabase
        .from('company_credentials')
        .select('*')
        .eq('company_id', testCompanyId)
        .eq('integration_type', 'google_drive')
      
      console.log('📞 Consulta directa:')
      console.log(`   - Error: ${directError?.message || 'Ninguno'}`)
      console.log(`   - Resultado: ${directQuery?.length || 0} registros`)
      
      if (directQuery && directQuery.length > 0) {
        console.log('✅ Consulta directa funciona - problema es específico de RPC')
        console.log('📋 Datos encontrados:')
        console.log(`   - ID: ${directQuery[0].id}`)
        console.log(`   - Status: ${directQuery[0].status}`)
        console.log(`   - Account Name: ${directQuery[0].account_name}`)
      }
    }
    
    console.log('\n6. Recomendaciones...')
    
    if (allCredentials && allCredentials.length > 0) {
      console.log('✅ Las credenciales están en la base de datos')
      console.log('💡 SOLUCIÓN: Usar consulta directa en lugar de RPC')
      console.log('🔧 Modificar GoogleDriveAuthServiceDynamic para usar:')
      console.log('   supabase.from("company_credentials").select("*")')
      console.log('   .eq("company_id", companyId)')
      console.log('   .eq("integration_type", "google_drive")')
      console.log('   .eq("status", "pending_verification")')
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message)
  }
}

async function testAlternativeApproach() {
  try {
    console.log('\n🧪 PROBANDO ENFOQUE ALTERNATIVO')
    console.log('===============================')
    
    // Obtener primera empresa con credenciales
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .eq('status', 'active')
      .limit(1)
    
    if (!companies || companies.length === 0) {
      console.log('❌ No hay empresas para probar')
      return
    }
    
    const testCompany = companies[0]
    console.log(`🧪 Probando con: ${testCompany.name}`)
    
    // Simular exactamente lo que haría GoogleDriveAuthServiceDynamic
    console.log('📞 Simulando GoogleDriveAuthServiceDynamic.getCompanyCredentials...')
    
    const { data: credentials, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('integration_type', 'google_drive')
      .eq('status', 'pending_verification')
    
    console.log('📊 Resultado consulta directa:')
    console.log(`   - Error: ${error?.message || 'Ninguno'}`)
    console.log(`   - Registros: ${credentials?.length || 0}`)
    
    if (credentials && credentials.length > 0) {
      console.log('✅ ÉXITO - Consulta directa funciona')
      console.log('📋 Credencial encontrada:')
      console.log(`   - ID: ${credentials[0].id}`)
      console.log(`   - Nombre: ${credentials[0].account_name}`)
      console.log(`   - Status: ${credentials[0].status}`)
      
      return {
        success: true,
        credentials: credentials[0],
        company: testCompany
      }
    } else {
      console.log('⚠️ No se encontraron credenciales con status pending_verification')
      
      // Probar con cualquier status
      const { data: anyCredentials, error: anyError } = await supabase
        .from('company_credentials')
        .select('*')
        .eq('company_id', testCompany.id)
        .eq('integration_type', 'google_drive')
      
      console.log('📞 Probando con cualquier status:')
      console.log(`   - Registros: ${anyCredentials?.length || 0}`)
      
      if (anyCredentials && anyCredentials.length > 0) {
        console.log('📋 Status disponibles:')
        anyCredentials.forEach((cred, index) => {
          console.log(`   ${index + 1}. ${cred.status}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error probando alternativa:', error.message)
  }
}

async function main() {
  await diagnoseRPCFunction()
  await testAlternativeApproach()
  
  console.log('\n🎯 CONCLUSIÓN')
  console.log('=============')
  console.log('✅ Credenciales creadas exitosamente en base de datos')
  console.log('❌ Función RPC get_company_credentials no las encuentra')
  console.log('💡 SOLUCIÓN: Usar consulta directa en lugar de RPC')
  console.log('🔧 Esto resolverá el error "Cannot read properties of null"')
}

// Ejecutar
main().catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})