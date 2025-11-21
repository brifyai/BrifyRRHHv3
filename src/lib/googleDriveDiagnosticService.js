/**
 * Google Drive Diagnostic Service
 * Diagnóstico completo para identificar por qué no se crean carpetas
 */

import googleDriveAuthService from './googleDriveAuthService.js'
import googleDriveConsolidatedService from './googleDriveConsolidated.js'
import { supabase } from './supabaseClient.js'
import logger from './logger.js'

class GoogleDriveDiagnosticService {
  constructor() {
    this.diagnostics = []
    this.currentUserId = null
  }

  /**
   * Ejecuta diagnóstico completo
   */
  async runFullDiagnostic(userId) {
    this.currentUserId = userId
    this.diagnostics = []

    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE GOOGLE DRIVE')
    console.log('=' * 60)

    try {
      // 1. Verificar variables de entorno
      await this.checkEnvironmentVariables()
      
      // 2. Verificar autenticación
      await this.checkAuthentication()
      
      // 3. Verificar servicio consolidado
      await this.checkConsolidatedService()
      
      // 4. Verificar Supabase
      await this.checkSupabaseConnection()
      
      // 5. Verificar tokens
      await this.checkTokens()
      
      // 6. Probar creación de carpeta
      await this.testFolderCreation()
      
      // 7. Generar reporte
      return this.generateReport()
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error)
      this.addDiagnostic('ERROR', 'Diagnóstico falló', error.message)
      return this.generateReport()
    }
  }

  /**
   * Verifica variables de entorno
   */
  async checkEnvironmentVariables() {
    console.log('\n📋 1. Verificando variables de entorno...')
    
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
    const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI

    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      this.addDiagnostic('ERROR', 'Google Client ID no configurado', 'REACT_APP_GOOGLE_CLIENT_ID no está configurado correctamente')
    } else {
      this.addDiagnostic('OK', 'Google Client ID configurado', `Client ID: ${clientId.substring(0, 20)}...`)
    }

    if (!clientSecret || clientSecret.includes('YOUR_GOOGLE_CLIENT_SECRET')) {
      this.addDiagnostic('ERROR', 'Google Client Secret no configurado', 'REACT_APP_GOOGLE_CLIENT_SECRET no está configurado correctamente')
    } else {
      this.addDiagnostic('OK', 'Google Client Secret configurado', 'Client Secret configurado')
    }

    if (!redirectUri) {
      this.addDiagnostic('WARN', 'Redirect URI no configurado', 'Usando redirect URI auto-detectado')
    } else {
      this.addDiagnostic('OK', 'Redirect URI configurado', redirectUri)
    }
  }

  /**
   * Verifica autenticación
   */
  async checkAuthentication() {
    console.log('\n🔐 2. Verificando autenticación...')
    
    try {
      // Verificar auth service
      const isAuth = googleDriveAuthService.isAuthenticated()
      if (isAuth) {
        this.addDiagnostic('OK', 'Google Drive autenticado', 'Token válido encontrado')
      } else {
        this.addDiagnostic('ERROR', 'Google Drive no autenticado', 'No hay token válido')
      }

      // Verificar tokens en localStorage
      const storedTokens = localStorage.getItem('google_drive_auth')
      if (storedTokens) {
        try {
          const tokens = JSON.parse(storedTokens)
          this.addDiagnostic('OK', 'Tokens en localStorage', `Access token: ${!!tokens.access_token}, Refresh token: ${!!tokens.refresh_token}`)
        } catch (error) {
          this.addDiagnostic('ERROR', 'Tokens corruptos en localStorage', error.message)
        }
      } else {
        this.addDiagnostic('WARN', 'No hay tokens en localStorage', 'Usuario no ha conectado Google Drive')
      }

    } catch (error) {
      this.addDiagnostic('ERROR', 'Error verificando autenticación', error.message)
    }
  }

  /**
   * Verifica servicio consolidado
   */
  async checkConsolidatedService() {
    console.log('\n🔧 3. Verificando servicio consolidado...')
    
    try {
      // Verificar si el servicio está inicializado
      if (this.currentUserId) {
        const initialized = await googleDriveConsolidatedService.initialize(this.currentUserId)
        if (initialized) {
          this.addDiagnostic('OK', 'Servicio consolidado inicializado', 'Servicio listo para usar')
        } else {
          this.addDiagnostic('WARN', 'Servicio consolidado inicializado sin credenciales', 'Usuario no conectado')
        }
      } else {
        this.addDiagnostic('ERROR', 'No hay userId', 'userId es requerido para inicializar el servicio')
      }

      // Verificar métodos del servicio
      const hasCreateFolder = typeof googleDriveConsolidatedService.createFolder === 'function'
      const hasListFiles = typeof googleDriveConsolidatedService.listFiles === 'function'
      const hasShareFolder = typeof googleDriveConsolidatedService.shareFolder === 'function'

      this.addDiagnostic(hasCreateFolder ? 'OK' : 'ERROR', 'Método createFolder', hasCreateFolder ? 'Disponible' : 'No disponible')
      this.addDiagnostic(hasListFiles ? 'OK' : 'ERROR', 'Método listFiles', hasListFiles ? 'Disponible' : 'No disponible')
      this.addDiagnostic(hasShareFolder ? 'OK' : 'ERROR', 'Método shareFolder', hasShareFolder ? 'Disponible' : 'No disponible')

    } catch (error) {
      this.addDiagnostic('ERROR', 'Error verificando servicio consolidado', error.message)
    }
  }

  /**
   * Verifica conexión a Supabase
   */
  async checkSupabaseConnection() {
    console.log('\n🗄️ 4. Verificando Supabase...')
    
    try {
      // Verificar conexión básica
      const { data, error } = await supabase.from('users').select('id').limit(1)
      
      if (error) {
        this.addDiagnostic('ERROR', 'Error conectando a Supabase', error.message)
        return
      }

      this.addDiagnostic('OK', 'Conexión a Supabase', 'Conexión exitosa')

      // Verificar tabla de credenciales
      const { data: credentials, error: credError } = await supabase
        .from('user_google_drive_credentials')
        .select('*')
        .eq('user_id', this.currentUserId)
        .maybeSingle()

      if (credError) {
        this.addDiagnostic('ERROR', 'Error consultando credenciales', credError.message)
      } else if (credentials) {
        this.addDiagnostic('OK', 'Credenciales en Supabase', `Conectado: ${credentials.is_connected}, Activo: ${credentials.is_active}`)
      } else {
        this.addDiagnostic('WARN', 'No hay credenciales en Supabase', 'Usuario no ha guardado credenciales')
      }

    } catch (error) {
      this.addDiagnostic('ERROR', 'Error verificando Supabase', error.message)
    }
  }

  /**
   * Verifica tokens
   */
  async checkTokens() {
    console.log('\n🔑 5. Verificando tokens...')
    
    try {
      const accessToken = googleDriveAuthService.getAccessToken()
      
      // Probar token con Google API
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken)
      
      if (response.ok) {
        const tokenInfo = await response.json()
        this.addDiagnostic('OK', 'Token válido', `Scopes: ${tokenInfo.scope}, Expires: ${tokenInfo.expires_in}s`)
      } else {
        this.addDiagnostic('ERROR', 'Token inválido', `HTTP ${response.status}`)
      }

    } catch (error) {
      this.addDiagnostic('ERROR', 'Error verificando token', error.message)
    }
  }

  /**
   * Prueba creación de carpeta
   */
  async testFolderCreation() {
    console.log('\n📁 6. Probando creación de carpeta...')
    
    try {
      if (!googleDriveAuthService.isAuthenticated()) {
        this.addDiagnostic('ERROR', 'No se puede probar creación', 'Usuario no autenticado')
        return
      }

      const testFolderName = `Test-${Date.now()}`
      
      try {
        const folder = await googleDriveConsolidatedService.createFolder(testFolderName)
        this.addDiagnostic('OK', 'Creación de carpeta exitosa', `Carpeta creada: ${folder.id}`)
        
        // Limpiar carpeta de prueba
        try {
          await googleDriveConsolidatedService.deleteFile(folder.id)
          this.addDiagnostic('OK', 'Carpeta de prueba eliminada', 'Limpieza exitosa')
        } catch (cleanupError) {
          this.addDiagnostic('WARN', 'Error limpiando carpeta de prueba', cleanupError.message)
        }
        
      } catch (createError) {
        this.addDiagnostic('ERROR', 'Error creando carpeta', createError.message)
      }

    } catch (error) {
      this.addDiagnostic('ERROR', 'Error en prueba de creación', error.message)
    }
  }

  /**
   * Agrega resultado de diagnóstico
   */
  addDiagnostic(type, title, description) {
    const diagnostic = {
      type,
      title,
      description,
      timestamp: new Date().toISOString()
    }
    
    this.diagnostics.push(diagnostic)
    
    // Log a consola
    const emoji = type === 'OK' ? '✅' : type === 'WARN' ? '⚠️' : '❌'
    console.log(`${emoji} ${title}: ${description}`)
  }

  /**
   * Genera reporte final
   */
  generateReport() {
    console.log('\n📊 REPORTE FINAL')
    console.log('=' * 60)
    
    const okCount = this.diagnostics.filter(d => d.type === 'OK').length
    const warnCount = this.diagnostics.filter(d => d.type === 'WARN').length
    const errorCount = this.diagnostics.filter(d => d.type === 'ERROR').length
    
    console.log(`✅ OK: ${okCount}`)
    console.log(`⚠️ WARN: ${warnCount}`)
    console.log(`❌ ERROR: ${errorCount}`)
    
    if (errorCount > 0) {
      console.log('\n❌ PROBLEMAS CRÍTICOS ENCONTRADOS:')
      this.diagnostics
        .filter(d => d.type === 'ERROR')
        .forEach(d => console.log(`   • ${d.title}: ${d.description}`))
    }
    
    if (warnCount > 0) {
      console.log('\n⚠️ ADVERTENCIAS:')
      this.diagnostics
        .filter(d => d.type === 'WARN')
        .forEach(d => console.log(`   • ${d.title}: ${d.description}`))
    }
    
    const report = {
      summary: {
        total: this.diagnostics.length,
        ok: okCount,
        warnings: warnCount,
        errors: errorCount,
        status: errorCount === 0 ? 'HEALTHY' : 'HAS_ISSUES'
      },
      diagnostics: this.diagnostics,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    }
    
    console.log('\n🎯 RECOMENDACIONES:')
    report.recommendations.forEach(rec => console.log(`   • ${rec}`))
    
    return report
  }

  /**
   * Genera recomendaciones basadas en los problemas encontrados
   */
  generateRecommendations() {
    const recommendations = []
    
    const hasAuthError = this.diagnostics.some(d => d.type === 'ERROR' && d.title.includes('autenticado'))
    const hasTokenError = this.diagnostics.some(d => d.type === 'ERROR' && d.title.includes('Token'))
    const hasSupabaseError = this.diagnostics.some(d => d.type === 'ERROR' && d.title.includes('Supabase'))
    const hasEnvError = this.diagnostics.some(d => d.type === 'ERROR' && d.title.includes('configurado'))
    
    if (hasAuthError) {
      recommendations.push('Conecta tu cuenta de Google Drive desde la configuración')
      recommendations.push('Verifica que el redirect URI esté configurado correctamente en Google Cloud Console')
    }
    
    if (hasTokenError) {
      recommendations.push('Los tokens pueden estar expirados, intenta reconectar Google Drive')
      recommendations.push('Verifica que el refresh token esté disponible')
    }
    
    if (hasSupabaseError) {
      recommendations.push('Verifica la conexión a Supabase y las credenciales')
      recommendations.push('Asegúrate de que la tabla user_google_drive_credentials existe')
    }
    
    if (hasEnvError) {
      recommendations.push('Configura las variables de entorno REACT_APP_GOOGLE_CLIENT_ID y REACT_APP_GOOGLE_CLIENT_SECRET')
      recommendations.push('Verifica que el redirect URI esté configurado en Google Cloud Console')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('El sistema parece estar funcionando correctamente')
      recommendations.push('Si sigues teniendo problemas, contacta al soporte técnico')
    }
    
    return recommendations
  }
}

const googleDriveDiagnosticService = new GoogleDriveDiagnosticService()
export default googleDriveDiagnosticService