import React, { useState, useEffect, useCallback } from 'react';
import googleDriveConsolidatedService from '../../lib/googleDriveConsolidated.js';

const GoogleDriveProductionDiagnosis = () => {
  const [diagnosis, setDiagnosis] = useState({
    environment: '',
    hostname: '',
    redirectUri: '',
    clientId: '',
    hasValidCredentials: false,
    serviceInfo: null,
    error: null
  });

  const performDiagnosis = useCallback(() => {
    try {
      const hostname = window.location.hostname;
      const isProduction = hostname.includes('netlify.app');
      const origin = window.location.origin;
      
      // Detectar entorno
      const environment = isProduction ? 'Producción (Netlify)' : 'Desarrollo (Local)';
      
      // Calcular redirect URI
      const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${origin}/auth/google/callback`;
      
      // Verificar credenciales
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const hasValidCredentials = clientId &&
                                !clientId.includes('tu_google_client_id') &&
                                !clientId.includes('your-google-client-id') &&
                                clientId !== 'your-google-client-id';

      setDiagnosis({
        environment,
        hostname,
        redirectUri,
        clientId: clientId || 'No configurado',
        hasValidCredentials,
        serviceInfo: null,
        error: null
      });

      // Intentar inicializar el servicio
      initializeAndDiagnoseService();
    } catch (error) {
      setDiagnosis(prev => ({
        ...prev,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    performDiagnosis();
  }, [performDiagnosis]);

  const initializeAndDiagnoseService = async () => {
    try {
      console.log('🔍 Iniciando diagnóstico del servicio de Google Drive...');
      
      const userId = 'test-user-id'; // Placeholder
      const initialized = await googleDriveConsolidatedService.initialize(userId);
      
      if (initialized) {
        const connectionStatus = await googleDriveConsolidatedService.getConnectionStatus();
        
        setDiagnosis(prev => ({
          ...prev,
          serviceInfo: {
            service: 'GoogleDriveConsolidated',
            connected: connectionStatus.connected,
            email: connectionStatus.email,
            ...connectionStatus
          }
        }));
      }
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setDiagnosis(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  const generateGoogleAuthUrl = () => {
    if (!diagnosis.hasValidCredentials) {
      alert('❌ No hay credenciales válidas configuradas. Consulta la guía de configuración.');
      return;
    }

    const params = new URLSearchParams({
      client_id: diagnosis.clientId,
      redirect_uri: diagnosis.redirectUri,
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    // Abrir en una nueva ventana para diagnóstico
    window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Copiado al portapapeles');
    });
  };

  const getRecommendation = () => {
    if (diagnosis.error) {
      return {
        type: 'error',
        title: '❌ Error Crítico',
        message: diagnosis.error,
        solution: 'Revisa la configuración y vuelve a intentar.'
      };
    }

    if (!diagnosis.hasValidCredentials) {
      return {
        type: 'warning',
        title: '⚠️ Credenciales No Válidas',
        message: 'Las credenciales de Google OAuth no están configuradas correctamente.',
        solution: 'La aplicación funcionará en modo local. Para Google Drive real, configura las credenciales.'
      };
    }

    if (diagnosis.environment === 'Producción (Netlify)') {
      const expectedUri = 'https://brifyrrhhv2.netlify.app/auth/google/callback';
      if (diagnosis.redirectUri !== expectedUri) {
        return {
          type: 'error',
          title: '🚨 Error de Configuración en Producción',
          message: `El redirect_uri no coincide. Esperado: ${expectedUri}`,
          solution: 'Configura el URI correcto en Google Cloud Console.'
        };
      }
    }

    if (diagnosis.serviceInfo && !diagnosis.serviceInfo.isReal) {
      return {
        type: 'info',
        title: 'ℹ️ Modo Local Activo',
        message: 'La aplicación está funcionando en modo local sin conexión a Google Drive real.',
        solution: 'Esto es normal si no hay credenciales válidas. Todas las funcionalidades están disponibles.'
      };
    }

    return {
      type: 'success',
      title: '✅ Configuración Correcta',
      message: 'Todo está configurado correctamente.',
      solution: 'La aplicación debería funcionar con Google Drive real.'
    };
  };

  const recommendation = getRecommendation();

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Google Drive (Producción)</h1>
        
        {/* Información del Entorno */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Información del Entorno</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Entorno:</span> {diagnosis.environment}
            </div>
            <div>
              <span className="font-medium">Hostname:</span> {diagnosis.hostname}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Redirect URI:</span>
              <div className="mt-1 p-2 bg-white rounded border">
                <code className="text-xs break-all">{diagnosis.redirectUri}</code>
                <button
                  onClick={() => copyToClipboard(diagnosis.redirectUri)}
                  className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copiar
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Client ID:</span>
              <div className="mt-1 p-2 bg-white rounded border">
                <code className="text-xs break-all">{diagnosis.clientId}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendación */}
        <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(recommendation.type)}`}>
          <h3 className="text-lg font-semibold mb-2">{recommendation.title}</h3>
          <p className="text-sm mb-2">{recommendation.message}</p>
          <p className="text-sm font-medium">{recommendation.solution}</p>
        </div>

        {/* Información del Servicio */}
        {diagnosis.serviceInfo && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Estado del Servicio</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Servicio:</span> {diagnosis.serviceInfo.service}
              </div>
              <div>
                <span className="font-medium">Es Real:</span> {diagnosis.serviceInfo.isReal ? 'Sí' : 'No'}
              </div>
              <div>
                <span className="font-medium">Archivos:</span> {diagnosis.serviceInfo.files || 0}
              </div>
              <div>
                <span className="font-medium">Carpetas:</span> {diagnosis.serviceInfo.folders || 0}
              </div>
              {diagnosis.serviceInfo.totalSizeFormatted && (
                <div className="col-span-2">
                  <span className="font-medium">Tamaño Total:</span> {diagnosis.serviceInfo.totalSizeFormatted}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Acciones de Diagnóstico</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={performDiagnosis}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Re-diagnosticar
            </button>
            
            {diagnosis.hasValidCredentials && (
              <button
                onClick={generateGoogleAuthUrl}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                🔐 Probar Autenticación Google
              </button>
            )}
          </div>
        </div>

        {/* Guía de Configuración */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">📋 Guía de Configuración Rápida</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">1. Configurar Google Cloud Console:</h3>
            <ol className="text-sm list-decimal list-inside space-y-1 ml-4">
              <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
              <li>Selecciona tu proyecto</li>
              <li>Ve a "APIs & Services" → "Credentials"</li>
              <li>Edita tu "OAuth 2.0 Client ID"</li>
              <li>Agrega este URI: <code className="bg-white px-2 py-1 rounded">{diagnosis.redirectUri}</code></li>
            </ol>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">2. Configurar Netlify:</h3>
            <ol className="text-sm list-decimal list-inside space-y-1 ml-4">
              <li>Ve a <a href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Netlify Dashboard</a></li>
              <li>Selecciona tu sitio "brifyrrhhv2"</li>
              <li>Ve a "Site settings" → "Build & deploy" → "Environment"</li>
              <li>Agrega las variables de entorno de Google OAuth</li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium mb-2">3. Variables de Entorno Requeridas:</h3>
            <div className="text-sm bg-white p-3 rounded border font-mono">
              REACT_APP_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com<br/>
              REACT_APP_GOOGLE_CLIENT_SECRET=tu_client_secret<br/>
              REACT_APP_GOOGLE_REDIRECT_URI={diagnosis.redirectUri}
            </div>
          </div>
        </div>

        {/* Solución Alternativa */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">💡 Solución Alternativa: Modo Local</h2>
          <p className="text-sm mb-3">
            Mientras configuras las credenciales de Google, la aplicación funciona perfectamente en modo local con todas las funcionalidades disponibles.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1 ml-4">
            <li>✅ Crear y gestionar carpetas</li>
            <li>✅ Subir y descargar archivos</li>
            <li>✅ Buscar archivos</li>
            <li>✅ Almacenamiento persistente en el navegador</li>
            <li>✅ Sin necesidad de configuración de Google</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveProductionDiagnosis;