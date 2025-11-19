/**
 * Asistente de Configuración de WhatsApp Business
 * 
 * Este componente proporciona una interfaz paso a paso para que los usuarios
 * sin conocimientos técnicos puedan conectar su WhatsApp Business fácilmente.
 */

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PhoneIcon,
  CogIcon,
  KeyIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import communicationService from '../../services/communicationService.js';
import whatsappConnectionService from '../../services/whatsappConnectionService.js';

const WhatsAppSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [setupData, setSetupData] = useState({
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    testMode: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);

  const totalSteps = 5;

  // Cargar empresas al montar
  React.useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const loadCompanies = async () => {
    try {
      const result = await communicationService.getCompanies();
      if (result) {
        setCompanies(result);
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Usar el servicio real de conexión para verificar credenciales
      const result = await whatsappConnectionService.verifyCredentials(
        setupData.accessToken,
        setupData.phoneNumberId
      );
      
      if (result.success) {
        // Si las credenciales son válidas, enviar un mensaje de prueba
        const testResult = await whatsappConnectionService.sendTestMessage(
          setupData.accessToken,
          setupData.phoneNumberId
        );
        
        setConnectionTest({
          success: testResult.success,
          message: testResult.success
            ? '¡Conexión exitosa! Mensaje de prueba enviado correctamente.'
            : `Credenciales válidas pero error enviando mensaje: ${testResult.message}`,
          data: {
            ...result.data,
            testMessage: testResult.data
          }
        });
      } else {
        setConnectionTest(result);
      }
    } catch (error) {
      setConnectionTest({
        success: false,
        message: `Error de conexión: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      const result = await communicationService.configureWhatsAppForCompany(
        selectedCompany,
        setupData
      );
      
      if (result.success) {
        alert('¡WhatsApp configurado exitosamente!');
        // Redirigir al gestor multi-WhatsApp
        window.location.href = '/whatsapp/multi-manager';
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep > index + 1
                ? 'bg-green-600 text-white'
                : currentStep === index + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {currentStep > index + 1 ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < totalSteps - 1 && (
              <div className={`flex-1 h-1 mx-4 ${
                currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Seleccionar Empresa</span>
        <span>Meta Developers</span>
        <span>Obtener Credenciales</span>
        <span>Probar Conexión</span>
        <span>Finalizar</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <PhoneIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona tu Empresa
        </h2>
        <p className="text-gray-600">
          Elige la empresa que estará asociada a este número de WhatsApp
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Empresa
        </label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Selecciona una empresa...</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div className="text-sm text-blue-800">
            <strong>¿No ves tu empresa?</strong> Asegúrate de que tienes permisos de administrador
            para configurar WhatsApp Business.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <GlobeAltIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configura Meta Developers
        </h2>
        <p className="text-gray-600">
          Sigue estos pasos para obtener tus credenciales de WhatsApp Business API
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg mb-4">Pasos para configurar:</h3>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              1
            </div>
            <div>
              <h4 className="font-medium">Ve a Meta Developers</h4>
              <p className="text-sm text-gray-600 mt-1">
                Visita{' '}
                <a 
                  href="https://developers.facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  developers.facebook.com
                </a>{' '}
                e inicia sesión con tu cuenta de Facebook.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              2
            </div>
            <div>
              <h4 className="font-medium">Crea una nueva aplicación</h4>
              <p className="text-sm text-gray-600 mt-1">
                Haz clic en "Mis Aplicaciones" → "Crear Aplicación" → "Negocio".
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              3
            </div>
            <div>
              <h4 className="font-medium">Agrega WhatsApp</h4>
              <p className="text-sm text-gray-600 mt-1">
                En el panel de la aplicación, busca "WhatsApp" y haz clic en "Configurar".
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              4
            </div>
            <div>
              <h4 className="font-medium">Selecciona o crea una cuenta de WhatsApp Business</h4>
              <p className="text-sm text-gray-600 mt-1">
                Conecta tu número de teléfono existente o crea uno nuevo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
          <div className="text-sm text-yellow-800">
            <strong>Importante:</strong> Necesitarás una cuenta de WhatsApp Business verificada
            para continuar con la configuración.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <KeyIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Obten tus Credenciales
        </h2>
        <p className="text-gray-600">
          Copia y pega las credenciales desde tu panel de Meta Developers
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Token (Token de Acceso Permanente)
          </label>
          <input
            type="text"
            value={setupData.accessToken}
            onChange={(e) => setSetupData({...setupData, accessToken: e.target.value})}
            placeholder="EAAZA..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Encuéntralo en WhatsApp → Configuración → Token de acceso permanente
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number ID
          </label>
          <input
            type="text"
            value={setupData.phoneNumberId}
            onChange={(e) => setSetupData({...setupData, phoneNumberId: e.target.value})}
            placeholder="1234567890123456..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Encuéntralo en WhatsApp → Configuración → Número de teléfono
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook Verify Token (Opcional)
          </label>
          <input
            type="text"
            value={setupData.webhookVerifyToken}
            onChange={(e) => setSetupData({...setupData, webhookVerifyToken: e.target.value})}
            placeholder="token_secreto_personalizado"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Crea un token único para verificar webhooks. Puedes usar el generador de abajo.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">Generador de Webhook Token:</h4>
          <button
            onClick={() => {
              const token = 'whatsapp_' + Math.random().toString(36).substr(2, 16);
              setSetupData({...setupData, webhookVerifyToken: token});
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Generar Token Automático
          </button>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="testMode"
            checked={setupData.testMode}
            onChange={(e) => setSetupData({...setupData, testMode: e.target.checked})}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <label htmlFor="testMode" className="ml-2 text-sm text-gray-700">
            Iniciar en modo prueba (sin costos de mensajes)
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ShieldCheckIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Prueba tu Conexión
        </h2>
        <p className="text-gray-600">
          Verificaremos que tus credenciales funcionen correctamente
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {!connectionTest ? (
          <div className="text-center">
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Probando...' : 'Probar Conexión'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Esto puede tardar unos segundos
            </p>
          </div>
        ) : (
          <div className={`rounded-lg p-6 ${
            connectionTest.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {connectionTest.success ? (
                <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div>
                <h3 className={`font-semibold ${
                  connectionTest.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {connectionTest.success ? '¡Conexión Exitosa!' : 'Error de Conexión'}
                </h3>
                <p className={`text-sm mt-1 ${
                  connectionTest.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {connectionTest.message}
                </p>
              </div>
            </div>
            
            {!connectionTest.success && (
              <button
                onClick={testConnection}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Reintentar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">¿Qué estamos verificando?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Validación del Access Token</li>
          <li>• Conexión con la API de Meta</li>
          <li>• Estado del número de teléfono</li>
          <li>• Permisos necesarios</li>
        </ul>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Todo Listo!
        </h2>
        <p className="text-gray-600">
          Revisa tu configuración antes de finalizar
        </p>
      </div>

      <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Resumen de Configuración:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Empresa:</span>
            <span className="font-medium">
              {companies.find(c => c.id === selectedCompany)?.name || 'Seleccionada'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone Number ID:</span>
            <span className="font-medium">{setupData.phoneNumberId || 'Configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Modo:</span>
            <span className="font-medium">
              {setupData.testMode ? 'Prueba' : 'Producción'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado:</span>
            <span className="font-medium text-green-600">
              {connectionTest?.success ? 'Conectado' : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={saveConfiguration}
          disabled={isLoading}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-medium"
        >
          {isLoading ? 'Guardando...' : 'Finalizar Configuración'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Tu WhatsApp Business quedará conectado y listo para usar
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedCompany !== '';
      case 2: return true;
      case 3: return setupData.accessToken && setupData.phoneNumberId;
      case 4: return connectionTest?.success;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStepIndicator()}
          
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Anterior
            </button>

            <button
              onClick={nextStep}
              disabled={!canProceed() || currentStep === totalSteps}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {currentStep === totalSteps ? 'Finalizar' : 'Siguiente'}
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetupWizard;