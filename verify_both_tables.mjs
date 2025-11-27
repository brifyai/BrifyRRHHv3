#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyBothTables() {
  console.log('🔍 VERIFICANDO AMBAS TABLAS DE CREDENCIALES\n')
  console.log('=' .repeat(70))
  
  try {
    // 1. Verificar company_credentials (donde el servicio dinámico busca)
    console.log('\n📋 1. TABLA: company_credentials')
    console.log('   (Donde GoogleDriveAuthServiceDynamic busca)\n')
    
    const { data: companyCreds, error: companyError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .eq('status', 'active')
    
    if (companyError) {
      console.error('   ❌ Error:', companyError.message)
    } else if (!companyCreds || companyCreds.length === 0) {
      console.log('   ❌ No hay credenciales activas')
    } else {
      console.log(`   ✅ Encontradas ${companyCreds.length} credenciales`)
      for (const cred of companyCreds) {
        console.log(`\n   📄 ID: ${cred.id}`)
        console.log(`      Empresa: ${cred.company_id}`)
        console.log(`      Nombre: ${cred.account_name}`)
        console.log(`      Status: ${cred.status}`)
        
        // Verificar tokens
        let hasTokens = false
        if (cred.credentials) {
          try {
            const credsData = typeof cred.credentials === 'string' ? JSON.parse(cred.credentials) : cred.credentials
            hasTokens = !!(credsData.access_token || credsData.refresh_token)
          } catch {}
        }
        console.log(`      Tokens: ${hasTokens ? '✅ SÍ' : '❌ NO'}`)
      }
    }
    
    // 2. Verificar user_google_drive_credentials (donde OAuth guarda)
    console.log('\n' + '='.repeat(70))
    console.log('\n👤 2. TABLA: user_google_drive_credentials')
    console.log('   (Donde el OAuth guarda los tokens)\n')
    
    const { data: userCreds, error: userError } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
    
    if (userError) {
      console.error('   ❌ Error:', userError.message)
    } else if (!userCreds || userCreds.length === 0) {
      console.log('   ❌ No hay credenciales de usuario')
    } else {
      console.log(`   ✅ Encontradas ${userCreds.length} credenciales de usuario`)
      for (const cred of userCreds) {
        console.log(`\n   📄 User ID: ${cred.user_id}`)
        console.log(`      Email: ${cred.google_email || 'N/A'}`)
        console.log(`      Conectado: ${cred.is_connected ? '✅ SÍ' : '❌ NO'}`)
        console.log(`      Activo: ${cred.is_active ? '✅ SÍ' : '❌ NO'}`)
        console.log(`      Expira: ${cred.token_expires_at || 'N/A'}`)
        
        // Verificar tokens
        const hasAccessToken = !!cred.access_token
        const hasRefreshToken = !!cred.refresh_token
        console.log(`      Access Token: ${hasAccessToken ? '✅ SÍ' : '❌ NO'}`)
        console.log(`      Refresh Token: ${hasRefreshToken ? '✅ SÍ' : '❌ NO'}`)
      }
    }
    
    // 3. Comparar y encontrar discrepancias
    console.log('\n' + '='.repeat(70))
    console.log('\n🔍 3. ANÁLISIS DE CONSISTENCIA\n')
    
    if (companyCreds && companyCreds.length > 0 && userCreds && userCreds.length > 0) {
      console.log('   ✅ Ambas tablas tienen datos')
      console.log(`   📊 company_credentials: ${companyCreds.length}`)
      console.log(`   📊 user_google_drive_credentials: ${userCreds.length}`)
      
      // Buscar si hay tokens en user_google_drive_credentials que no están en company_credentials
      const companyIds = companyCreds.map(c => c.id)
      const userIds = userCreds.map(c => c.user_id)
      
      console.log(`\n   📋 IDs en company_credentials: ${companyIds.join(', ')}`)
      console.log(`   📋 IDs en user_google_drive_credentials: ${userIds.join(', ')}`)
      
    } else if (userCreds && userCreds.length > 0 && (!companyCreds || companyCreds.length === 0)) {
      console.log('   ⚠️  SOLO user_google_drive_credentials tiene datos')
      console.log('   📝 El OAuth está funcionando pero guarda en la tabla incorrecta')
      console.log('\n   💡 SOLUCIÓN: Migrar datos o cambiar el servicio dinámico')
      
    } else if (companyCreds && companyCreds.length > 0 && (!userCreds || userCreds.length === 0)) {
      console.log('   ⚠️  SOLO company_credentials tiene datos')
      console.log('   📝 El OAuth NO está guardando tokens')
      
    } else {
      console.log('   ❌ Ambas tablas están vacías')
    }
    
    // 4. Recomendación
    console.log('\n' + '='.repeat(70))
    console.log('\n💡 RECOMENDACIÓN:\n')
    
    if (userCreds && userCreds.length > 0 && (!companyCreds || companyCreds.length === 0)) {
      console.log('   El problema es de ARQUITECTURA:')
      console.log('   - OAuth guarda en: user_google_drive_credentials')
      console.log('   - Servicio dinámico lee de: company_credentials')
      console.log('\n   🛠️  SOLUCIONES:')
      console.log('   1. Migrar datos de user → company (SQL)')
      console.log('   2. Modificar servicio dinámico para que lea de user_google_drive_credentials')
      console.log('   3. Crear un puente que sincronice ambas tablas')
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message)
  }
}

verifyBothTables()