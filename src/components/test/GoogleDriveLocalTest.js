import React, { useState, useEffect, useCallback } from 'react';
import googleDriveConsolidatedService from '../../lib/googleDriveConsolidated.js';

const GoogleDriveLocalTest = () => {
  const [status, setStatus] = useState('No inicializado');
  const [serviceInfo, setServiceInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializeService = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('Inicializando...');
      
      // Obtener userId del usuario autenticado (simulado para prueba)
      // En un componente real, esto vendría de useAuth o similar
      const userId = 'test-user-id'; // Placeholder para prueba
      
      const initialized = await googleDriveConsolidatedService.initialize(userId);
      
      if (initialized) {
        setStatus('✅ Inicializado correctamente');
        
        // Obtener estadísticas del servicio
        const connectionStatus = await googleDriveConsolidatedService.getConnectionStatus();
        
        setServiceInfo({
          service: 'GoogleDriveConsolidated',
          connected: connectionStatus.connected,
          email: connectionStatus.email,
          ...connectionStatus
        });
        
        // Cargar archivos iniciales
        await loadFiles();
      } else {
        setStatus('❌ Error al inicializar');
      }
    } catch (error) {
      console.error('Error en prueba:', error);
      setError(error.message);
      setStatus('❌ Error en inicialización');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeService();
  }, [initializeService]);

  const loadFiles = async () => {
    try {
      const fileList = await googleDriveConsolidatedService.listFiles();
      setFiles(fileList);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      setError(error.message);
    }
  };

  const createTestFolder = async () => {
    try {
      setLoading(true);
      const folderName = `Carpeta Prueba ${new Date().toLocaleTimeString()}`;
      const folder = await googleDriveConsolidatedService.createFolder(folderName);
      console.log('Carpeta creada:', folder);
      await loadFiles();
    } catch (error) {
      console.error('Error creando carpeta:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const testFileUpload = async () => {
    try {
      setLoading(true);
      // Crear un archivo de prueba
      const testFile = new File(['Contenido de prueba'], 'archivo_prueba.txt', {
        type: 'text/plain'
      });
      
      const uploadedFile = await googleDriveConsolidatedService.uploadFile(testFile);
      console.log('Archivo subido:', uploadedFile);
      await loadFiles();
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    // El servicio consolidado no tiene clearLocalStorage
    // Limpiamos los archivos y reinicializamos
    setFiles([]);
    initializeService();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🧪 Prueba de Google Drive Local</h1>
        
        {/* Estado del servicio */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Estado del Servicio</h2>
          <p className="text-sm text-gray-600 mb-2">{status}</p>
          
          {serviceInfo && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="font-medium">Servicio:</span> {serviceInfo.service}
              </div>
              <div>
                <span className="font-medium">Conectado:</span> {serviceInfo.connected ? 'Sí' : 'No'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {serviceInfo.email || 'No conectado'}
              </div>
              <div>
                <span className="font-medium">Última Sincronización:</span> {serviceInfo.lastSync ? new Date(serviceInfo.lastSync).toLocaleString() : 'Nunca'}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-1">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Botones de prueba */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={createTestFolder}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            📁 Crear Carpeta de Prueba
          </button>
          
          <button
            onClick={testFileUpload}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            📄 Subir Archivo de Prueba
          </button>
          
          <button
            onClick={loadFiles}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            🔄 Recargar Lista
          </button>
          
          <button
            onClick={clearStorage}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            🗑️ Limpiar Almacenamiento
          </button>
        </div>

        {/* Lista de archivos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Archivos y Carpetas ({files.length})</h2>
          
          {files.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay archivos ni carpetas</p>
              <p className="text-sm text-gray-400 mt-2">Crea una carpeta o sube un archivo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <span className="mr-3">
                      {file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄'}
                    </span>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {file.mimeType === 'application/vnd.google-apps.folder' 
                          ? 'Carpeta' 
                          : `Archivo • ${file.size || '0'} bytes`
                        }
                        {file.isLocal && ' • Local'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    {new Date(file.createdTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveLocalTest;