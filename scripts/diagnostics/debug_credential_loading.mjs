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

async function debugCredentialLoading() {
  console.log('🔍 DEBUG: CÓMO EL SERVICIO CARGA CREDENCIALES\n')
  
  const companyId = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
  
  console.log(`📋 Empresa ID: ${companyId}`)
  console.log(`🔍 Buscando credenciales con los filtros exactos del servicio...\n`)
  
  try {
    // Replicar la consulta EXACTA que hace el servicio
    const { data: credentials, error } = await supabase
      .from('company_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('integration_type', 'google_drive')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error en la consulta:', error.message)
      console.error('🔍 Detalles:', error)
      return
    }
    
    console.log(`✅ Consulta ejecutada exitosamente`)
    console.log(`📊 Resultados encontrados: ${credentials ? credentials.length : 0}\n`)
    
    if (!credentials || credentials.length === 0) {
      console.log('❌ NO SE ENCONTRARON CREDENCIALES CON ESTOS FILTROS')
      console.log('\n🔍 VERIFICANDO QUÉ ESTÁ PASANDO...')
      
      // Consulta sin filtros para ver todo
      const { data: allCreds, error: allError } = await supabase
        .from('company_credentials')
        .select('*')
        .eq('company_id', companyId)
      
      if (allError) {
        console.error('❌ Error en consulta de todas las credenciales:', allError.message)
        return
      }
      
      console.log(`\n📊 TOTAL DE CREDENCIALES PARA ESTA EMPRESA: ${allCreds.length}`)
      
      for (const cred of allCreds) {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`ID: ${cred.id}`)
        console.log(`Tipo: ${cred.integration_type}`)
        console.log(`Status: ${cred.status}`)
        console.log(`Nombre: ${cred.account_name}`)
        console.log(`Email: ${cred.account_email || 'N/A'}`)
        console.log(`Creado: ${cred.created_at}`)
        console.log(`Actualizado: ${cred.updated_at}`)
        
        // Verificar si el status es exactamente 'active'
        const isActive = cred.status === 'active'
        const statusLength = cred.status ? cred.status.length : 0
        console.log(`✓ Status === 'active': ${isActive}`)
        console.log(`✓ Longitud del status: ${statusLength}`)
        
        if (!isActive && cred.status) {
          console.log(`⚠️  Status real: "${cred.status}" (código: ${cred.status.charCodeAt(0)})`)
        }
      }
      
      return
    }
    
    // Si encontró credenciales, mostrar detalles
    console.log(`✅ CREDENCIALES ENCONTRADAS: ${credentials.length}\n`)
    
    for (const cred of credentials) {
      console.log(`${'='.repeat(60)}`)
      console.log(`ID: ${cred.id}`)
      console.log(`Nombre: ${cred.account_name}`)
      console.log(`Email: ${cred.account_email || 'N/A'}`)
      console.log(`Status: ${cred.status}`)
      console.log(`Creado: ${cred.created_at}`)
      
      // Verificar el campo credentials (tokens)
      console.log(`\n🔑 TOKENS:`)
      if (cred.credentials) {
        try {
          const credsData = typeof cred.credentials === 'string' 
            ? JSON.parse(cred.credentials) 
            : cred.credentials
          
          console.log(`  - Access Token: ${credsData.access_token ? '✅' : '❌'}`)
          console.log(`  - Refresh Token: ${credsData.refresh_token ? '✅' : '❌'}`)
          console.log(`  - Expiry Date: ${credsData.expiry_date || '❌'}`)
        } catch (e) {
          console.log(`  ❌ Error parseando credentials: ${e.message}`)
        }
      } else {
        console.log(`  ❌ Sin credentials (campo vacío)`)
      }
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 RESUMEN:`)
    console.log(`  - Credenciales encontradas: ${credentials.length}`)
    
    const withTokens = credentials.filter(c => {
      try {
        const data = typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials
        return data?.access_token
      } catch {
        return false
      }
    }).length
    
    console.log(`  - Con tokens válidos: ${withTokens}`)
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message)
  }
}

debugCredentialLoading()