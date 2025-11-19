import React, { useState } from 'react';
import { CheckCircle, Circle, AlertCircle, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react';

const GoogleDriveSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showSecret, setShowSecret] = useState(false);
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      id: 'project',
      title: 'Crear Proyecto Google Cloud',
      description: 'Crea un nuevo proyecto en Google Cloud Console',
      estimatedTime: '2 minutos',
      action: {
        type: 'external_link',
        url: 'https://console.cloud.google.com/projectcreate',
        text: 'Crear Proyecto Nuevo'
      },
      verification: 'Proyecto creado correctamente'
    },
    {
      id: 'api',
      title: 'Habilitar Google Drive API',
      description: 'Activa la API de Google Drive para tu proyecto',
      estimatedTime: '1 minuto',
      action: {
        type: 'external_link',
        url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        text: 'Habilitar Google Drive API'
      },
      verification: 'API habilitada correctamente'
    },
    {
      id: 'consent',
      title: 'Configurar Pantalla de Consentimiento',
      description: 'Configura la pantalla de autorización OAuth',
      estimatedTime: '1 minuto',
      action: {
        type: 'external_link',
        url: 'https://console.cloud.google.com/apis/credentials/consent',
        text: 'Configurar Consentimiento OAuth'
      },
      verification: 'Pantalla de consentimiento configurada'
    },
    {
      id: 'credentials',
      title: 'Crear Credenciales OAuth',
      description: 'Genera ID de cliente y secreto para la aplicación',
      estimatedTime: '1 minuto',
      action: {
        type: 'external_link',
        url: 'https://console.cloud.google.com/apis/credentials/create',
        text: 'Crear Credenciales OAuth'
      },
      verification: 'Credenciales creadas correctamente'
    },
    {
      id: 'configure',
      title: 'Configurar en BrifyRRHH',
      description: 'Ingresa tus credenciales en la aplicación',
      estimatedTime: '30 segundos',
      action: {
        type: 'form',
        text: 'Configurar Credenciales'
      },
      verification: 'Credenciales guardadas en la aplicación'
    },
    {
      id: 'connect',
      title: 'Conectar con Google',
      description: 'Autoriza la aplicación para acceder a Google Drive',
      estimatedTime: '30 segundos',
      action: {
        type: 'button',
        text: 'Conectar con Google Drive'
      },
      verification: 'Google Drive conectado exitosamente'
    }
  ];

  const handleStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    // Mostrar notificación de copiado
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = `${field} copiado al portapapeles`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    if (credentials.clientId && credentials.clientSecret) {
      handleStepComplete('configure');
    }
  };

  const handleGoogleConnect = async () => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica de conexión con Google
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación
      setIsConnected(true);
      handleStepComplete('connect');
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (steps[currentStep].id === stepId) {
      return <Circle className="w-6 h-6 text-blue-500 fill-current" />;
    }
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  const getStepStatus = (stepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (steps[currentStep].id === stepId) return 'active';
    return 'pending';
  };

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 Configuración Rápida de Google Drive
        </h1>
        <p className="text-gray-600">
          Configura Google Drive en 5 minutos con nuestra guía paso a paso
        </p>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {          const stepStatus = getStepStatus(step.id);
          const isActive = stepStatus === 'active';
          const isCompleted = stepStatus === 'completed';

          return (
            <div
              key={step.id}
              className={`border rounded-lg p-6 transition-all duration-200 ${
                isActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step.id)}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Paso {index + 1}: {step.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ⏱️ {step.estimatedTime}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{step.description}</p>

                  {/* Step Action */}
                  {isActive && (
                    <div className="mt-4">
                      {step.action.type === 'external_link' && (
                        <div className="flex items-center space-x-4">
                          <a
                            href={step.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {step.action.text}
                          </a>
                          <button
                            onClick={() => handleStepComplete(step.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Completar Paso
                          </button>
                        </div>
                      )}

                      {step.action.type === 'form' && (
                        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ID de Cliente
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={credentials.clientId}
                                onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Pega el ID de cliente aquí"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => handleCopyToClipboard(credentials.clientId, 'ID de Cliente')}
                                className="p-2 text-gray-500 hover:text-gray-700"
                              >
                                <Copy className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cliente Secreto
                            </label>
                            <div className="flex space-x-2">
                              <div className="flex-1 relative">
                                <input
                                  type={showSecret ? 'text' : 'password'}
                                  value={credentials.clientSecret}
                                  onChange={(e) => setCredentials({...credentials, clientSecret: e.target.value})}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Pega el cliente secreto aquí"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSecret(!showSecret)}
                                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                                >
                                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyToClipboard(credentials.clientSecret, 'Cliente Secreto')}
                                className="p-2 text-gray-500 hover:text-gray-700"
                              >
                                <Copy className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Guardar Credenciales
                          </button>
                        </form>
                      )}

                      {step.action.type === 'button' && (
                        <button
                          onClick={handleGoogleConnect}
                          disabled={isLoading || isConnected}
                          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            isConnected
                              ? 'bg-green-500 text-white'
                              : isLoading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle className="w-5 h-5 inline mr-2" />
                              Google Drive Conectado
                            </>
                          ) : isLoading ? (
                            'Conectando...'
                          ) : (
                            <>
                              <ExternalLink className="w-5 h-5 inline mr-2" />
                              {step.action.text}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Verification */}
                  {isCompleted && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <div className="flex items-center text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">{step.verification}</span>
                      </div>
                    </div>
                  )}

                  {/* Help Tips */}
                  {isActive && step.id === 'credentials' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start text-yellow-800">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">💡 Tip:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Asegúrate de que el URI de redireccionamiento sea: <code className="bg-yellow-100 px-1 rounded">http://localhost:3000/auth/google/callback</code></li>
                            <li>Copia las credenciales directamente desde Google Cloud Console</li>
                            <li>Guarda las credenciales en un lugar seguro</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedSteps.length === steps.length && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            🎉 ¡Configuración Completada!
          </h2>
          <p className="text-green-700 mb-4">
            Google Drive está ahora conectado y listo para usar con BrifyRRHH v2
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Enlaces Rápidos:</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Google Cloud Console
          </a>
          <a
            href="https://console.cloud.google.com/apis/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            APIs Habilitadas
          </a>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Credenciales
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveSetupWizard;