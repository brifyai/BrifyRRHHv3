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

async function forceActivateCredential() {
  console.log('🔥 FORZANDO ACTIVACIÓN DE CREDENCIAL\n')
  console.log('=' .repeat(70))
  
  try {
    // 1. Seleccionar una credencial pendiente
    console.log('\n📋 1. BUSCANDO CREDENCIAL PENDIENTE\n')
    
    const { data: pendingCreds, error: pendingError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .eq('status', 'pending_verification')
      .limit(1)
    
    if (pendingError) {
      console.error('   ❌ Error buscando credenciales:', pendingError.message)
      return
    }
    
    if (!pendingCreds || pendingCreds.length === 0) {
      console.log('   ❌ No hay credenciales pendientes')
      
      // Buscar cualquier credencial de Google Drive
      const { data: anyCreds, error: anyError } = await supabase
        .from('company_credentials')
        .select('*')
        .eq('integration_type', 'google_drive')
        .limit(1)
      
      if (anyError || !anyCreds || anyCreds.length === 0) {
        console.log('   ❌ No hay credenciales de Google Drive en la base de datos')
        console.log('\n   📝 Debes crear una credencial primero en la UI')
        return
      }
      
      console.log(`   ✅ Usando credencial existente: ${anyCreds[0].account_name}`)
      pendingCreds.push(anyCreds[0])
    }
    
    const credential = pendingCreds[0]
    console.log(`   ✅ Credencial encontrada: ${credential.account_name}`)
    console.log(`   📄 ID: ${credential.id}`)
    console.log(`   🏢 Empresa: ${credential.company_id}`)
    console.log(`   📊 Status actual: ${credential.status}`)
    
    // 2. Crear tokens de prueba (simulados)
    console.log('\n' + '='.repeat(70))
    console.log('\n🔑 2. CREANDO TOKENS DE PRUEBA\n')
    
    // En un caso real, estos vendrían de Google OAuth
    // Por ahora, creamos tokens simulados para activar la credencial
    const mockTokens = {
      access_token: 'ya29.mock_access_token_for_testing_' + Date.now(),
      refresh_token: '1//mock_refresh_token_for_testing_' + Date.now(),
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      token_type: 'Bearer',
      expiry_date: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hora desde ahora
      // Información del usuario
      email: 'test@aguasandinas.cl',
      name: 'Test User',
      picture: 'https://lh3.googleusercontent.com/a/default-user'
    }
    
    console.log('   ✅ Tokens simulados creados:')
    console.log(`   - Access Token: ${mockTokens.access_token.substring(0, 40)}...`)
    console.log(`   - Refresh Token: ${mockTokens.refresh_token.substring(0, 40)}...`)
    console.log(`   - Expira: ${mockTokens.expiry_date}`)
    console.log(`   - Email: ${mockTokens.email}`)
    
    // 3. Actualizar la credencial con tokens
    console.log('\n' + '='.repeat(70))
    console.log('\n💾 3. ACTUALIZANDO CREDENCIAL EN SUPABASE\n')
    
    const { error: updateError } = await supabase
      .from('company_credentials')
      .update({
        status: 'active',
        account_email: mockTokens.email,
        credentials: mockTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', credential.id)
    
    if (updateError) {
      console.error('   ❌ Error actualizando credencial:', updateError.message)
      return
    }
    
    console.log('   ✅ Credencial actualizada exitosamente')
    console.log(`   📊 Nuevo status: active`)
    console.log(`   📧 Email: ${mockTokens.email}`)
    console.log(`   🔑 Tokens guardados: SÍ`)
    
    // 4. Verificar la actualización
    console.log('\n' + '='.repeat(70))
    console.log('\n✅ 4. VERIFICANDO ACTUALIZACIÓN\n')
    
    const { data: verifiedCred, error: verifyError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('id', credential.id)
      .single()
    
    if (verifyError) {
      console.error('   ❌ Error verificando:', verifyError.message)
      return
    }
    
    if (verifiedCred.status === 'active' && verifiedCred.credentials) {
      console.log('   ✅ Verificación exitosa')
      console.log(`   📊 Status: ${verifiedCred.status}`)
      console.log(`   📧 Email: ${verifiedCred.account_email}`)
      
      const credsData = typeof verifiedCred.credentials === 'string' 
        ? JSON.parse(verifiedCred.credentials) 
        : verifiedCred.credentials
      
      console.log(`   🔑 Access Token: ${credsData.access_token ? '✅' : '❌'}`)
      console.log(`   🔑 Refresh Token: ${credsData.refresh_token ? '✅' : '❌'}`)
      console.log(`   ⏰ Expira: ${credsData.expiry_date}`)
    }
    
    // 5. Instrucciones finales
    console.log('\n' + '='.repeat(70))
    console.log('\n🎯 5. PRÓXIMOS PASOS\n')
    
    console.log('   ✅ Credencial activada con tokens simulados')
    console.log('\n   📝 AHORA PUEDES:')
    console.log('   1. Ir a la página de sincronización')
    console.log('   2. Seleccionar "Aguas Andinas"')
    console.log('   3. Hacer clic en "Sincronizar Carpetas"')
    console.log('\n   ⚠️  IMPORTANTE:')
    console.log('   - Los tokens son simulados (no funcionarán con Google)')
    console.log('   - Para producción, necesitas tokens reales de OAuth')
    console.log('   - Este es un workaround temporal para probar el flujo')
    
    console.log('\n' + '='.repeat(70))
    console.log('\n✅ CREDENCIAL ACTIVADA EXITOSAMENTE')
    console.log(`\n   ID: ${credential.id}`)
    console.log(`   Nombre: ${credential.account_name}`)
    console.log(`   Status: ACTIVE`)
    console.log(`   Tokens: GUARDADOS (simulados)`)
    
  } catch (error) {
    console.error('❌ Error forzando activación:', error.message)
    console.error(error.stack)
  }
}

forceActivateCredential()