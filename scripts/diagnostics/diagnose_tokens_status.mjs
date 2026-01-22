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

async function diagnoseTokens() {
  console.log('🔍 DIAGNÓSTICO DE TOKENS DE GOOGLE DRIVE\n')
  
  try {
    // Obtener todas las credenciales de Google Drive
    const { data: credentials, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('integration_type', 'google_drive')
      .eq('status', 'active')
    
    if (error) {
      console.error('❌ Error obteniendo credenciales:', error.message)
      return
    }
    
    if (!credentials || credentials.length === 0) {
      console.log('⚠️ No hay credenciales de Google Drive activas')
      return
    }
    
    console.log(`✅ Encontradas ${credentials.length} credenciales activas\n`)
    
    // Analizar cada credencial
    for (const cred of credentials) {
      console.log(`\n📋 CREDENCIAL ID: ${cred.id}`)
      console.log(`   Empresa ID: ${cred.company_id}`)
      console.log(`   Nombre: ${cred.account_name}`)
      console.log(`   Email: ${cred.account_email || 'No especificado'}`)
      
      // Parsear credentials JSON
      let credsData = null
      try {
        credsData = typeof cred.credentials === 'string' 
          ? JSON.parse(cred.credentials) 
          : cred.credentials
      } catch (e) {
        console.log(`   ❌ Error parseando credentials: ${e.message}`)
        continue
      }
      
      if (!credsData) {
        console.log(`   ❌ No hay datos de credentials`)
        continue
      }
      
      // Verificar tokens
      console.log(`\n   🔑 TOKENS:`)
      console.log(`   - Access Token: ${credsData.access_token ? '✅ PRESENTE' : '❌ AUSENTE'}`)
      console.log(`   - Refresh Token: ${credsData.refresh_token ? '✅ PRESENTE' : '❌ AUSENTE'}`)
      console.log(`   - Token Type: ${credsData.token_type || '❌ No especificado'}`)
      console.log(`   - Expiry Date: ${credsData.expiry_date || '❌ No especificado'}`)
      
      // Verificar si el token está expirado
      if (credsData.expiry_date) {
        const expiryDate = new Date(credsData.expiry_date)
        const now = new Date()
        const isExpired = expiryDate < now
        
        console.log(`   - Estado: ${isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'}`)
        
        if (isExpired) {
          const hoursAgo = Math.floor((now - expiryDate) / (1000 * 60 * 60))
          console.log(`   - Expiró hace: ${hoursAgo} horas`)
        }
      }
      
      // Verificar estructura completa
      console.log(`\n   📦 ESTRUCTURA COMPLETA:`)
      const requiredFields = ['access_token', 'refresh_token', 'scope', 'token_type', 'expiry_date']
      for (const field of requiredFields) {
        const status = credsData[field] ? '✅' : '❌'
        console.log(`   ${status} ${field}: ${credsData[field] ? 'Presente' : 'Ausente'}`)
      }
      
      console.log(`\n${'='.repeat(60)}`)
    }
    
    // Resumen
    const totalCreds = credentials.length
    const withAccessToken = credentials.filter(c => {
      try {
        const data = typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials
        return data?.access_token
      } catch {
        return false
      }
    }).length
    
    const withRefreshToken = credentials.filter(c => {
      try {
        const data = typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials
        return data?.refresh_token
      } catch {
        return false
      }
    }).length
    
    console.log(`\n📊 RESUMEN:`)
    console.log(`   Total credenciales: ${totalCreds}`)
    console.log(`   Con access token: ${withAccessToken}`)
    console.log(`   Con refresh token: ${withRefreshToken}`)
    console.log(`   Tokens válidos: ${withAccessToken}/${totalCreds}`)
    
    if (withAccessToken === 0) {
      console.log(`\n❌ PROBLEMA IDENTIFICADO: Ninguna credencial tiene tokens válidos`)
      console.log(`📝 SOLUCIÓN: Es necesario reconectar las cuentas de Google Drive`)
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message)
  }
}

diagnoseTokens()