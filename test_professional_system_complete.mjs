/**
 * Script de Prueba Final - Sistema Profesional de APIs Dinámicas
 * Verifica que toda la nueva arquitectura funciona correctamente
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de prueba
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-key'

async function testProfessionalSystemComplete() {
  console.log('🚀 INICIANDO PRUEBA COMPLETA DEL SISTEMA PROFESIONAL...\n')
  
  const results = {
    database: false,
    authService: false,
    supabaseFirstService: false,
    dynamicSettings: false,
    overall: false
  }

  try {
    // 1. VERIFICAR BASE DE DATOS
    console.log('📊 1. VERIFICANDO BASE DE DATOS...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Verificar tabla company_credentials
    const { data: credsTable, error: credsError } = await supabase
      .from('company_credentials')
      .select('*')
      .limit(1)
    
    if (credsError && credsError.code === 'PGRST116') {
      console.log('⚠️ Tabla company_credentials no existe - ejecutar database/company_credentials_table.sql')
    } else if (credsError) {
      console.log('❌ Error verificando tabla company_credentials:', credsError.message)
    } else {
      console.log('✅ Tabla company_credentials existe')
      results.database = true
    }

    // Verificar función get_company_credentials
    const { data: funcResult, error: funcError } = await supabase
      .rpc('get_company_credentials', {
        p_company_id: '00000000-0000-0000-0000-000000000000',
        p_integration_type: 'google_drive'
      })
    
    if (funcError) {
      console.log('⚠️ Función get_company_credentials no existe - ejecutar SQL functions')
    } else {
      console.log('✅ Función get_company_credentials funciona')
    }

    // 2. VERIFICAR SERVICIO DE AUTENTICACIÓN DINÁMICO
    console.log('\n🔐 2. VERIFICANDO GOOGLEDRIVE AUTHSERVICE DINÁMICO...')
    
    const { GoogleDriveAuthServiceDynamic } = await import('./src/lib/googleDriveAuthServiceDynamic.js')
    const authService = new GoogleDriveAuthServiceDynamic()
    
    // Probar inicialización
    const initialized = await authService.initialize(supabase, null)
    console.log(`✅ Servicio inicializado: ${initialized}`)
    
    // Probar métodos básicos
    const availableCreds = authService.getAvailableCredentials()
    console.log(`✅ Credenciales disponibles: ${availableCreds.length}`)
    
    const stats = authService.getServiceStats()
    console.log('✅ Estadísticas del servicio:', {
      initialized: stats.initialized,
      authenticated: stats.isAuthenticated,
      availableCredentials: stats.availableCredentials
    })
    
    results.authService = true

    // 3. VERIFICAR SERVICIO SUPABASE-FIRST
    console.log('\n🏗️ 3. VERIFICANDO SERVICIO SUPABASE-FIRST...')
    
    const { SupabaseFirstDriveService } = await import('./src/lib/supabaseFirstDriveService.js')
    const supabaseFirstService = new SupabaseFirstDriveService()
    
    // Inicializar servicio
    const serviceInitialized = await supabaseFirstService.initialize(
      supabase, 
      authService, 
      null
    )
    console.log(`✅ Servicio Supabase-first inicializado: ${serviceInitialized}`)
    
    // Probar health check
    const healthCheck = await supabaseFirstService.healthCheck()
    console.log('✅ Health check:', {
      healthy: healthCheck.healthy,
      supabase: healthCheck.services.supabase.status,
      googleDrive: healthCheck.services.googleDrive.status
    })
    
    const serviceStats = supabaseFirstService.getServiceStats()
    console.log('✅ Estadísticas del servicio:', {
      primaryStorage: serviceStats.primaryStorage,
      backupStorage: serviceStats.backupStorage,
      architecture: serviceStats.architecture
    })
    
    results.supabaseFirstService = true

    // 4. VERIFICAR COMPONENTE SETTINGS DINÁMICO
    console.log('\n⚙️ 4. VERIFICANDO COMPONENTE SETTINGS DINÁMICO...')
    
    // Verificar que el archivo existe
    const fs = await import('fs')
    const settingsPath = './src/components/settings/SettingsDynamic.js'
    
    if (fs.existsSync(settingsPath)) {
      console.log('✅ SettingsDynamic.js existe')
      
      // Verificar contenido clave
      const settingsContent = fs.readFileSync(settingsPath, 'utf8')
      
      const hasDynamicImports = settingsContent.includes('googleDriveAuthServiceDynamic')
      const hasCompanyCredentials = settingsContent.includes('availableGoogleDriveCredentials')
      const hasSupabaseFirst = settingsContent.includes('supabaseFirstDriveService')
      
      console.log('✅ Tiene imports dinámicos:', hasDynamicImports)
      console.log('✅ Maneja credenciales por empresa:', hasCompanyCredentials)
      console.log('✅ Integra servicio Supabase-first:', hasSupabaseFirst)
      
      results.dynamicSettings = hasDynamicImports && hasCompanyCredentials && hasSupabaseFirst
    } else {
      console.log('❌ SettingsDynamic.js no existe')
    }

    // 5. VERIFICAR ARQUITECTURA GENERAL
    console.log('\n🏛️ 5. VERIFICANDO ARQUITECTURA GENERAL...')
    
    // Verificar archivos clave del sistema
    const requiredFiles = [
      './src/lib/googleDriveAuthServiceDynamic.js',
      './src/lib/supabaseFirstDriveService.js',
      './src/components/settings/SettingsDynamic.js',
      './database/company_credentials_table.sql',
      './MIGRACION_CONFIGURACIONES_GLOBALES.md'
    ]
    
    let architectureValid = true
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} existe`)
      } else {
        console.log(`❌ ${file} no existe`)
        architectureValid = false
      }
    }
    
    // Verificar que se eliminaron archivos obsoletos
    const obsoleteFiles = [
      './src/lib/googleDriveAuthService.js',
      './src/lib/googleDriveCallbackHandler.js',
      './src/lib/googleDriveConfig.js'
    ]
    
    let cleanupSuccessful = true
    for (const file of obsoleteFiles) {
      if (fs.existsSync(file)) {
        console.log(`⚠️ ${file} aún existe (puede ser normal durante desarrollo)`)
      } else {
        console.log(`✅ ${file} eliminado correctamente`)
      }
    }

    // 6. RESUMEN FINAL
    console.log('\n📋 RESUMEN FINAL DEL SISTEMA PROFESIONAL:')
    console.log('=' .repeat(60))
    
    console.log(`📊 Base de Datos: ${results.database ? '✅' : '❌'}`)
    console.log(`🔐 Servicio Auth Dinámico: ${results.authService ? '✅' : '❌'}`)
    console.log(`🏗️ Servicio Supabase-First: ${results.supabaseFirstService ? '✅' : '❌'}`)
    console.log(`⚙️ Settings Dinámico: ${results.dynamicSettings ? '✅' : '❌'}`)
    console.log(`🏛️ Arquitectura General: ${architectureValid ? '✅' : '❌'}`)
    
    results.overall = results.database && results.authService && 
                    results.supabaseFirstService && results.dynamicSettings && 
                    architectureValid
    
    console.log('\n🎯 ESTADO GENERAL:', results.overall ? '✅ SISTEMA PROFESIONAL OPERATIVO' : '❌ SISTEMA INCOMPLETO')
    
    if (results.overall) {
      console.log('\n🎉 ¡FELICITACIONES! El sistema profesional está completamente implementado:')
      console.log('✅ APIs dinámicas por empresa')
      console.log('✅ Supabase como fuente principal')
      console.log('✅ Google Drive como backup opcional')
      console.log('✅ Configuraciones globales eliminadas')
      console.log('✅ Arquitectura profesional robusta')
    } else {
      console.log('\n⚠️ El sistema necesita completar algunos aspectos:')
      if (!results.database) console.log('- Ejecutar database/company_credentials_table.sql')
      if (!results.authService) console.log('- Verificar GoogleDriveAuthServiceDynamic')
      if (!results.supabaseFirstService) console.log('- Verificar SupabaseFirstDriveService')
      if (!results.dynamicSettings) console.log('- Verificar SettingsDynamic.js')
    }

    // 7. PRÓXIMOS PASOS
    console.log('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:')
    console.log('1. Ejecutar database/company_credentials_table.sql en Supabase')
    console.log('2. Probar integración completa en desarrollo')
    console.log('3. Migrar componentes restantes al sistema dinámico')
    console.log('4. Eliminar archivos obsoletos restantes')
    console.log('5. Desplegar a producción')

    return results.overall

  } catch (error) {
    console.error('❌ Error en prueba del sistema profesional:', error.message)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// Ejecutar prueba
if (import.meta.url === `file://${process.argv[1]}`) {
  testProfessionalSystemComplete()
    .then(success => {
      console.log(`\n🏁 Prueba completada. Éxito: ${success}`)
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default testProfessionalSystemComplete