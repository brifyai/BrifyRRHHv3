#!/usr/bin/env node

/**
 * DEBUG: Estado Actual Completo del Sistema
 * 
 * Este script verifica todo el flujo de OAuth paso a paso
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugCurrentState() {
  console.log('🔍 DEBUG: ESTADO COMPLETO DEL SISTEMA\n')
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
  
  try {
    // 1. Verificar credenciales de la empresa específica
    console.log('📋 1. Credenciales para empresa:', companyId)
    const { data: credentials, error: credError } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
    
    if (credError) {
      console.error('❌ Error:', credError.message)
      return
    }
    
    if (credentials.length === 0) {
      console.log('   ❌ No hay credenciales para esta empresa')
    } else {
      credentials.forEach(cred => {
        console.log(`\n   ID: ${cred.id}`)
        console.log(`   Estado: ${cred.status}`)
        console.log(`   Cuenta: ${cred.account_name || 'N/A'}`)
        console.log(`   Email: ${cred.account_email || 'N/A'}`)
        
        if (cred.credentials) {
          try {
            const parsed = typeof cred.credentials === 'string' 
              ? JSON.parse(cred.credentials) 
              : cred.credentials
            console.log(`   Client ID: ${parsed.clientId || '❌ FALTANTE'}`)
            console.log(`   Client Secret: ${parsed.clientSecret ? '✅ Presente' : '❌ FALTANTE'}`)
            console.log(`   Refresh Token: ${parsed.refresh_token ? '✅ Presente' : '❌ FALTANTE'}`)
            console.log(`   Access Token: ${parsed.access_token ? '✅ Presente' : '❌ FALTANTE'}`)
          } catch (e) {
            console.log(`   ❌ Error parseando credentials: ${e.message}`)
          }
        } else {
          console.log('   ❌ Sin credentials')
        }
      })
    }
    
    // 2. Verificar tabla oauth_states
    console.log('\n🔐 2. Estados OAuth recientes:')
    const { data: oauthStates, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (oauthError) {
      console.error('❌ Error oauth_states:', oauthError.message)
    } else if (oauthStates.length === 0) {
      console.log('   ❌ No hay estados OAuth para esta empresa')
    } else {
      oauthStates.forEach(state => {
        console.log(`\n   ID: ${state.id}`)
        console.log(`   Estado: ${state.status || 'undefined'}`)
        console.log(`   Creado: ${state.created_at}`)
        if (state.error_message) {
          console.log(`   Error: ${state.error_message}`)
        }
      })
    }
    
    // 3. Verificar configuración de Supabase
    console.log('\n⚙️  3. Configuración de Supabase:')
    console.log(`   URL: ${supabaseUrl ? '✅' : '❌'}`)
    console.log(`   ANON KEY: ${supabaseAnonKey ? '✅' : '❌'}`)
    
    // 4. Probar inserción simple
    console.log('\n🧪 4. Prueba de inserción en system_configurations:')
    const testData = {
      category: 'test',
      config_key: 'test_debug',
      config_value: { test: true },
      is_active: true
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('system_configurations')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.log(`   ❌ Error: ${insertError.message}`)
      console.log(`   Código: ${insertError.code}`)
    } else {
      console.log('   ✅ Inserción exitosa')
      
      // Limpiar
      await supabase
        .from('system_configurations')
        .delete()
        .eq('config_key', 'test_debug')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DE DIAGNÓSTICO')
    console.log('='.repeat(60))
    
    if (credentials.length === 0) {
      console.log('\n❌ PROBLEMA: No hay credenciales para esta empresa')
      console.log('\n🔧 SOLUCIÓN:')
      console.log('   1. Ve a Configuración > Empresas')
      console.log('   2. Selecciona la empresa')
      console.log('   3. Haz clic en "Conectar Google Drive"')
      console.log('   4. Ingresa clientId y clientSecret')
      console.log('   5. Completa el flujo OAuth')
    } else if (credentials[0].status === 'pending_verification') {
      console.log('\n⚠️  CREDENCIALES INCOMPLETAS')
      console.log('\n🔧 SOLUCIÓN:')
      console.log('   Las credenciales están creadas pero sin tokens OAuth')
      console.log('   Debes completar el flujo de autorización con Google')
    } else if (credentials[0].status === 'active') {
      console.log('\n✅ CREDENCIALES ACTIVAS')
      console.log('\n🔍 Si aún así no funciona, verifica:')
      console.log('   - Tokens no han expirado')
      console.log('   - Permisos de Google Drive están concedidos')
    }
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
  }
}

debugCurrentState().catch(console.error)