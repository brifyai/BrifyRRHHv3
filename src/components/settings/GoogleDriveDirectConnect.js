import React, { useState } from 'react';
import logger from '../../lib/logger';
import googleDriveCallbackHandler from '../../lib/googleDriveCallbackHandler';

/**
 * GoogleDriveDirectConnect
 * Componente para conectar Google Drive usando flujo OAuth directo
 * No requiere ingresar credenciales manualmente
 */
const GoogleDriveDirectConnect = ({ companyId, companyName, onConnectionSuccess, onConnectionError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Inicia el flujo OAuth de Google
   */
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      logger.info('GoogleDriveDirectConnect', `🚀 Iniciando flujo OAuth para empresa: ${companyName} (${companyId})`);

      // Validar que tenemos client_id configurado
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'undefined') {
        throw new Error('REACT_APP_GOOGLE_CLIENT_ID no está configurado en las variables de entorno');
      }

      // Generar URL de autorización de Google
      const authUrl = googleDriveCallbackHandler.generateAuthorizationUrl({
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
      });

      logger.info('GoogleDriveDirectConnect', `📋 URL de autorización generada: ${authUrl.substring(0, 100)}...`);

      // Guardar companyId en sessionStorage para usarlo en el callback
      sessionStorage.setItem('google_oauth_company_id', companyId);
      logger.info('GoogleDriveDirectConnect', `💾 Company ID guardado en sessionStorage: ${companyId}`);

      // Abrir ventana de autorización de Google
      logger.info('GoogleDriveDirectConnect', '🔑 Abriendo ventana de autorización de Google...');
      window.location.href = authUrl;

    } catch (error) {
      logger.error('GoogleDriveDirectConnect', `❌ Error iniciando flujo OAuth: ${error.message}`);
      setError(error.message);
      setIsConnecting(false);
      
      if (onConnectionError) {
        onConnectionError(error);
      }
    }
  };

  /**
   * Manejar el callback de OAuth cuando regresa de Google
   */
  const handleOAuthCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`Error de OAuth: ${error}`);
      }

      if (!code) {
        logger.warn('GoogleDriveDirectConnect', '⚠️ No se encontró código de autorización en la URL');
        return;
      }

      // Obtener companyId de sessionStorage
      const companyId = sessionStorage.getItem('google_oauth_company_id');
      if (!companyId) {
        throw new Error('No se encontró company_id en sessionStorage');
      }

      logger.info('GoogleDriveDirectConnect', `📥 Procesando callback para company: ${companyId}`);

      // Procesar el código de autorización
      const result = await googleDriveCallbackHandler.handleAuthorizationCode(code, companyId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Error desconocido en el callback');
      }

      logger.info('GoogleDriveDirectConnect', `✅ Conexión exitosa para ${result.data.email}`);

      // Limpiar sessionStorage
      sessionStorage.removeItem('google_oauth_company_id');
      sessionStorage.removeItem('google_oauth_state');
      sessionStorage.removeItem('google_oauth_code_verifier');

      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);

      if (onConnectionSuccess) {
        onConnectionSuccess(result.data);
      }

    } catch (error) {
      logger.error('GoogleDriveDirectConnect', `❌ Error en callback: ${error.message}`);
      setError(error.message);
      
      if (onConnectionError) {
        onConnectionError(error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Verificar si estamos en la URL de callback
   */
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      logger.info('GoogleDriveDirectConnect', '🔄 Detectado callback de OAuth, procesando...');
      handleOAuthCallback();
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Conectar Google Drive
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {companyName} - Permisos directos desde Google
          </p>
        </div>
        <div className="flex-shrink-0">
          <img 
            src="/google-drive-icon.png" 
            alt="Google Drive" 
            className="h-8 w-8"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Flujo Directo:</strong> No necesitas ingresar credenciales manualmente. 
            Haz clic en "Conectar con Google" y autoriza la aplicación directamente.
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${isConnecting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Conectando...
            </>
          ) : (
            <>
              <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
              </svg>
              Conectar con Google
            </>
          )}
        </button>

        <div className="text-xs text-gray-500">
          <p>Se abrirá la ventana de autorización de Google donde podrás:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Seleccionar tu cuenta de Google</li>
            <li>Permitir acceso a Google Drive</li>
            <li>Autorizar la aplicación Brify RRHH</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveDirectConnect;