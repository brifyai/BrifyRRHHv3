import React, { useState, useEffect, useCallback } from 'react'
import './GoogleDriveURIChecker.css'

const GoogleDriveURIChecker = () => {
  const [diagnosis, setDiagnosis] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState({})

  const checkEnvironmentVariables = () => {
    const vars = {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
      environment: process.env.REACT_APP_ENVIRONMENT,
      netlifyUrl: process.env.REACT_APP_NETLIFY_URL
    }

    const status = {
      clientId: !!vars.clientId,
      clientSecret: !!vars.clientSecret,
      apiKey: !!vars.apiKey,
      environment: !!vars.environment,
      netlifyUrl: !!vars.netlifyUrl
    }

    const allPresent = Object.values(status).every(Boolean)
    
    return {
      vars,
      status,
      allPresent,
      summary: allPresent ? '✅ Todas las variables configuradas' : '❌ Faltan variables críticas'
    }
  }

  const getCurrentConfiguration = () => {
    const isProduction = process.env.REACT_APP_ENVIRONMENT === 'production'
    const netlifyUrl = process.env.REACT_APP_NETLIFY_URL || 'https://brifyrrhhv2.netlify.app'
    
    return {
      environment: process.env.REACT_APP_ENVIRONMENT || 'undefined',
      netlifyUrl: netlifyUrl,
      currentRedirectUri: isProduction
        ? `${netlifyUrl}/auth/google/callback`
        : 'http://localhost:3000/auth/google/callback',
      isProduction
    }
  }

  const generateCorrectURIs = () => {
    const productionURIs = [
      'https://brifyrrhhv2.netlify.app/auth/google/callback',
      'https://brifyrrhhv2.netlify.app'
    ]
    
    const developmentURIs = [
      'http://localhost:3000/auth/google/callback',
      'http://localhost:3000'
    ]

    const javascriptOrigins = [
      'https://brifyrrhhv2.netlify.app',
      'http://localhost:3000'
    ]

    return {
      production: {
        redirectURIs: productionURIs,
        javascriptOrigins: javascriptOrigins
      },
      development: {
        redirectURIs: developmentURIs,
        javascriptOrigins: javascriptOrigins
      },
      all: {
        redirectURIs: [...productionURIs, ...developmentURIs],
        javascriptOrigins: javascriptOrigins
      }
    }
  }

  const performDiagnosis = useCallback(async () => {
    setLoading(true)
    const results = {}

    // 1. Verificar variables de entorno
    results.environment = checkEnvironmentVariables()
    
    // 2. Verificar configuración actual
    results.currentConfig = getCurrentConfiguration()
    
    // 3. Generar URIs correctos
    results.correctURIs = generateCorrectURIs()
    
    // 4. Verificar consistencia (función inline para evitar dependencias)
    const checkConsistency = (env, uris) => {
      const isProduction = env.vars.environment === 'production'
      const expectedUri = isProduction
        ? uris.production.redirectURIs[0]
        : uris.development.redirectURIs[0]
      
      const currentUri = getCurrentConfiguration().currentRedirectUri
      
      return {
        isProduction,
        expectedUri,
        currentUri,
        isConsistent: expectedUri === currentUri,
        netlifyUrl: env.vars.netlifyUrl
      }
    }
    
    results.consistency = checkConsistency(results.environment, results.correctURIs)
    
    // 5. Generar solución
    results.solution = generateSolution(results)

    setDiagnosis(results)
    setCurrentConfig(results.currentConfig)
    setLoading(false)
  }, [])

  useEffect(() => {
    performDiagnosis()
  }, [performDiagnosis])

  const generateSolution = (results) => {
    const { environment, consistency } = results
    
    if (!environment.allPresent) {
      return {
        type: 'environment',
        severity: 'high',
        title: 'Configurar Variables de Entorno',
        description: 'Faltan variables críticas en Netlify',
        steps: [
          'Ve a Netlify → Site settings → Environment',
          'Agrega las variables faltantes',
          'Redespliega el sitio'
        ]
      }
    }

    if (!consistency.isConsistent) {
      return {
        type: 'uri_mismatch',
        severity: 'critical',
        title: 'CORREGIR redirect_uri_mismatch',
        description: 'El URI de redirección no coincide con Google Cloud Console',
        steps: [
          'Ve a Google Cloud Console → APIs & Services → Credentials',
          'Edita tu OAuth 2.0 Client ID',
          `Agrega este URI en Authorized redirect URIs: ${consistency.expectedUri}`,
          'Agrega estos JavaScript Origins: https://brifyrrhhv2.netlify.app, http://localhost:3000',
          'Guarda y espera 5 minutos',
          'Limpia cache del navegador y prueba nuevamente'
        ]
      }
    }

    return {
      type: 'success',
      severity: 'low',
      title: 'Configuración Correcta',
      description: 'Todo parece estar configurado correctamente',
      steps: [
        'Si aún tienes problemas, limpia la cache del navegador',
        'Usa modo incógnito para probar',
        'Espera 5 minutos si hiciste cambios recientes'
      ]
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('¡Copiado al portapapeles!')
  }

  const openGoogleCloudConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank')
  }

  const openNetlifyEnvironment = () => {
    window.open('https://app.netlify.com/sites/brifyrrhhv2/settings/deploys/environment', '_blank')
  }

  if (loading) {
    return (
      <div className="uri-checker">
        <div className="loading">
          <div className="spinner"></div>
          <p>Analizando configuración de Google Drive...</p>
        </div>
      </div>
    )
  }

  const solution = diagnosis.solution

  return (
    <div className="uri-checker">
      <div className="header">
        <h1>🔍 Diagnóstico de Error Google Drive</h1>
        <p>Herramienta especializada para resolver "Acceso bloqueado: La solicitud de BrifyRRHH no es válida"</p>
      </div>

      {/* Resultado Principal */}
      <div className={`solution-card ${solution.type}`}>
        <div className="solution-header">
          <h2>{solution.title}</h2>
          <span className={`severity ${solution.severity}`}>
            {solution.severity === 'critical' ? '🚨 CRÍTICO' : 
             solution.severity === 'high' ? '⚠️ ALTO' : 
             solution.severity === 'medium' ? '📡 MEDIO' : '✅ OK'}
          </span>
        </div>
        <p>{solution.description}</p>
        
        <div className="steps">
          <h3>Pasos para Solucionar:</h3>
          <ol>
            {solution.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="actions">
          {solution.type === 'uri_mismatch' && (
            <>
              <button onClick={openGoogleCloudConsole} className="btn btn-primary">
                🌐 Abrir Google Cloud Console
              </button>
              <button onClick={() => copyToClipboard(diagnosis.consistency.expectedUri)} className="btn btn-secondary">
                📋 Copiar URI Correcto
              </button>
            </>
          )}
          {solution.type === 'environment' && (
            <button onClick={openNetlifyEnvironment} className="btn btn-primary">
                🔧 Abrir Variables de Entorno Netlify
            </button>
          )}
        </div>
      </div>

      {/* Diagnóstico Detallado */}
      <div className="diagnosis-details">
        <h2>📋 Diagnóstico Detallado</h2>
        
        {/* Variables de Entorno */}
        <div className="section">
          <h3>Variables de Entorno</h3>
          <div className="status-grid">
            <div className={`status-item ${diagnosis.environment?.status?.clientId ? 'success' : 'error'}`}>
              <span>Client ID:</span>
              <span>{diagnosis.environment?.status?.clientId ? '✅ Configurado' : '❌ Faltante'}</span>
            </div>
            <div className={`status-item ${diagnosis.environment?.status?.clientSecret ? 'success' : 'error'}`}>
              <span>Client Secret:</span>
              <span>{diagnosis.environment?.status?.clientSecret ? '✅ Configurado' : '❌ Faltante'}</span>
            </div>
            <div className={`status-item ${diagnosis.environment?.status?.apiKey ? 'success' : 'error'}`}>
              <span>API Key:</span>
              <span>{diagnosis.environment?.status?.apiKey ? '✅ Configurado' : '❌ Faltante'}</span>
            </div>
            <div className={`status-item ${diagnosis.environment?.status?.environment ? 'success' : 'error'}`}>
              <span>Environment:</span>
              <span>{diagnosis.environment?.vars?.environment || '❌ Undefined'}</span>
            </div>
            <div className={`status-item ${diagnosis.environment?.status?.netlifyUrl ? 'success' : 'error'}`}>
              <span>Netlify URL:</span>
              <span>{diagnosis.environment?.vars?.netlifyUrl || '❌ Undefined'}</span>
            </div>
          </div>
        </div>

        {/* Configuración Actual */}
        <div className="section">
          <h3>Configuración Actual</h3>
          <div className="config-info">
            <div className="info-item">
              <span>Entorno:</span>
              <span>{currentConfig.environment}</span>
            </div>
            <div className="info-item">
              <span>Netlify URL:</span>
              <span>{currentConfig.netlifyUrl}</span>
            </div>
            <div className="info-item">
              <span>URI Actual:</span>
              <code>{currentConfig.currentRedirectUri}</code>
            </div>
            <div className="info-item">
              <span>Es Producción:</span>
              <span>{currentConfig.isProduction ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* URIs Correctos */}
        <div className="section">
          <h3>URIs que Deben Estar Configurados en Google Cloud Console</h3>
          <div className="uri-list">
            <div className="uri-group">
              <h4>🔒 Authorized redirect URIs:</h4>
              <ul>
                {diagnosis.correctURIs?.all?.redirectURIs?.map((uri, index) => (
                  <li key={index}>
                    <code>{uri}</code>
                    <button onClick={() => copyToClipboard(uri)} className="copy-btn">📋</button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="uri-group">
              <h4>🌐 Authorized JavaScript origins:</h4>
              <ul>
                {diagnosis.correctURIs?.all?.javascriptOrigins?.map((origin, index) => (
                  <li key={index}>
                    <code>{origin}</code>
                    <button onClick={() => copyToClipboard(origin)} className="copy-btn">📋</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Verificación de Consistencia */}
        <div className="section">
          <h3>Verificación de Consistencia</h3>
          <div className="consistency-check">
            <div className={`check-item ${diagnosis.consistency?.isConsistent ? 'success' : 'error'}`}>
              <span>Consistencia URI:</span>
              <span>{diagnosis.consistency?.isConsistent ? '✅ Correcto' : '❌ Incorreto'}</span>
            </div>
            <div className="check-item">
              <span>URI Esperado:</span>
              <code>{diagnosis.consistency?.expectedUri}</code>
            </div>
            <div className="check-item">
              <span>URI Actual:</span>
              <code>{diagnosis.consistency?.currentUri}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Herramientas Adicionales */}
      <div className="tools">
        <h2>🛠️ Herramientas Adicionales</h2>
        <div className="tool-grid">
          <button onClick={performDiagnosis} className="tool-btn">
            🔄 Re-ejecutar Diagnóstico
          </button>
          <button onClick={() => window.open('/test-google-drive-local', '_blank')} className="tool-btn">
            🧪 Probar Google Drive Local
          </button>
          <button onClick={() => window.open('/google-drive-production-diagnosis', '_blank')} className="tool-btn">
            🔍 Diagnóstico Completo de Producción
          </button>
          <button onClick={() => window.open('/integrations/my-google-drive', '_blank')} className="tool-btn">
            📁 Ir a Conexión Google Drive
          </button>
        </div>
      </div>

      {/* Información de Soporte */}
      <div className="support">
        <h2>📞 Si el Problema Persiste</h2>
        <div className="support-steps">
          <div className="support-step">
            <h3>1. Captura de Pantalla</h3>
            <p>Toma captura de esta página de diagnóstico y del error en Google Cloud Console</p>
          </div>
          <div className="support-step">
            <h3>2. Limpia Cache</h3>
            <p>Usa modo incógnito o limpia completamente la cache y cookies del navegador</p>
          </div>
          <div className="support-step">
            <h3>3. Espera Propagación</h3>
            <p>Después de hacer cambios en Google Cloud Console, espera 5-10 minutos</p>
          </div>
          <div className="support-step">
            <h3>4. Prueba en Desarrollo</h3>
            <p>Si falla producción, prueba en http://localhost:3000/integrations/my-google-drive</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleDriveURIChecker