/**
 * WhatsApp Business Onboarding Unificado
 *
 * Sistema integral que guía al usuario desde cero hasta tener WhatsApp funcionando.
 * Experiencia completamente guiada para usuarios no técnicos.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  PlayIcon,
  GlobeAltIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import communicationService from '../../services/communicationService.js';
import whatsappConnectionService from '../../services/whatsappConnectionService.js';

const WhatsAppOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [setupData, setSetupData] = useState({
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    testMode: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Pasos del onboarding
  const steps = [
    {
      id: 'welcome',
      title: '¡Bienvenido a WhatsApp Business!',
      description: 'Vamos a configurar WhatsApp para tu empresa paso a paso',
      icon: SparklesIcon,
      component: WelcomeStep
    },
    {
      id: 'check_existing',
      title: 'Verificando configuraciones',
      description: 'Comprobando si ya tienes WhatsApp configurado',
      icon: CogIcon,
      component: CheckExistingStep
    },
    {
      id: 'select_company',
      title: 'Selecciona tu empresa',
      description: 'Elige la empresa que estará asociada a WhatsApp',
      icon: UserGroupIcon,
      component: SelectCompanyStep
    },
    {
      id: 'meta_setup',
      title: 'Configura Meta Developers',
      description: 'Te guiamos paso a paso para obtener tus credenciales',
      icon: GlobeAltIcon,
      component: MetaSetupStep
    },
    {
      id: 'credentials',
      title: 'Ingresa tus credenciales',
      description: 'Copia y pega la información de Meta Developers',
      icon: KeyIcon,
      component: CredentialsStep
    },
    {
      id: 'test_connection',
      title: 'Probamos tu conexión',
      description: 'Verificamos que todo funcione correctamente',
      icon: ShieldCheckIcon,
      component: TestConnectionStep
    },
    {
      id: 'success',
      title: '¡Listo! WhatsApp configurado',
      description: 'Tu WhatsApp Business está funcionando',
      icon: CheckCircleIcon,
      component: SuccessStep
    }
  ];

  useEffect(() => {
    const initializeOnboarding = async () => {
      setIsLoading(true);
      try {
        // Cargar perfil del usuario
        const profile = await communicationService.getCurrentUser();
        setUserProfile(profile);

        // Cargar empresas
        const companiesResult = await communicationService.getCompanies();
        if (companiesResult) {
          setCompanies(companiesResult);
        }

        // Cargar configuraciones existentes
        const configsResult = await communicationService.getAllWhatsAppConfigurations();
        if (configsResult.success) {
          setConfigurations(configsResult.configurations);
        }

        // Determinar paso inicial
        if (configsResult.configurations && configsResult.configurations.length > 0) {
          // Usuario ya tiene configuraciones, ir directo al dashboard
          setCurrentStep(6); // Último paso (success) - steps.length - 1
        } else {
          setCurrentStep(0); // Comenzar desde el inicio
        }

      } catch (error) {
        console.error('Error inicializando onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOnboarding();
  }, []);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const handleCompanySelect = (companyId) => {
    setSelectedCompany(companyId);
    nextStep();
  };

  const handleCredentialsSubmit = async (credentials) => {
    setSetupData(credentials);
    await testConnection(credentials);
  };

  const testConnection = async (credentials) => {
    setIsLoading(true);
    try {
      const result = await whatsappConnectionService.verifyCredentials(
        credentials.accessToken,
        credentials.phoneNumberId
      );

      setConnectionTest(result);

      if (result.success) {
        // Guardar configuración automáticamente
        await saveConfiguration(credentials, result.data);
        nextStep();
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

  const saveConfiguration = async (credentials, connectionData) => {
    try {
      const configData = {
        companyId: selectedCompany,
        accessToken: credentials.accessToken,
        phoneNumberId: credentials.phoneNumberId,
        webhookVerifyToken: credentials.webhookVerifyToken,
        testMode: credentials.testMode,
        isDefault: true,
        dailyLimit: 1000,
        monthlyLimit: 30000
      };

      const result = await communicationService.configureWhatsAppForCompany(
        selectedCompany,
        configData
      );

      if (result.success) {
        // Recargar configuraciones
        const configsResult = await communicationService.getAllWhatsAppConfigurations();
        if (configsResult.success) {
          setConfigurations(configsResult.configurations);
        }
      }

      return result;
    } catch (error) {
      console.error('Error guardando configuración:', error);
      throw error;
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.has(index);
          const isCurrent = currentStep === index;
          const isAccessible = index <= currentStep || isCompleted;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isAccessible && goToStep(index)}
                disabled={!isAccessible}
                className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isCompleted
                    ? 'bg-green-600 text-white'
                    : isAccessible
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  {step.title.split(' ')[0]}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    const StepComponent = steps[currentStep].component;
    return (
      <StepComponent
        userProfile={userProfile}
        companies={companies}
        configurations={configurations}
        selectedCompany={selectedCompany}
        setupData={setupData}
        connectionTest={connectionTest}
        isLoading={isLoading}
        onCompanySelect={handleCompanySelect}
        onCredentialsSubmit={handleCredentialsSubmit}
        onNext={nextStep}
        onPrev={prevStep}
        onRetry={() => testConnection(setupData)}
      />
    );
  };

  if (isLoading && !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando tu experiencia de WhatsApp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StaffHub WhatsApp</h1>
                <p className="text-sm text-gray-600">Configuración guiada paso a paso</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              <span>Ayuda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">¿Necesitas ayuda?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>¿Qué necesito?</strong><br />
                    Una cuenta de WhatsApp Business y acceso a Meta Developers
                  </div>
                  <div>
                    <strong>¿Cuánto cuesta?</strong><br />
                    Solo los costos de WhatsApp Business (aprox. $0.005 por mensaje)
                  </div>
                  <div>
                    <strong>¿Cuánto tarda?</strong><br />
                    10-15 minutos para configurar completamente
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderStepIndicator()}

        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Anterior
          </button>

          {currentStep < steps.length - 1 && (
            <button
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Siguiente
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componentes de pasos individuales

const WelcomeStep = ({ onNext }) => (
  <div className="text-center space-y-6">
    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
      <ChatBubbleLeftRightIcon className="w-12 h-12 text-green-600" />
    </div>

    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        ¡Hola! Vamos a configurar WhatsApp Business
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        Te voy a guiar paso a paso para que tengas WhatsApp funcionando en menos de 15 minutos.
        No necesitas saber nada técnico, yo me encargo de todo.
      </p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <CheckCircleSolid className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-left">
          <h3 className="font-medium text-blue-900 mb-2">¿Qué vamos a hacer?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Configurar tu cuenta de Meta Developers</li>
            <li>• Obtener las credenciales de WhatsApp</li>
            <li>• Probar que todo funcione correctamente</li>
            <li>• ¡Listo! Podrás enviar mensajes desde StaffHub</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="flex justify-center">
      <button
        onClick={onNext}
        className="flex items-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-medium"
      >
        <PlayIcon className="w-5 h-5 mr-2" />
        ¡Comenzar configuración!
      </button>
    </div>
  </div>
);

const CheckExistingStep = ({ configurations, onNext }) => (
  <div className="text-center space-y-6">
    <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
      <CogIcon className="w-12 h-12 text-blue-600" />
    </div>

    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Verificando tu configuración actual
      </h2>
      <p className="text-gray-600">
        Déjame revisar si ya tienes WhatsApp configurado...
      </p>
    </div>

    {configurations && configurations.length > 0 ? (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CheckCircleSolid className="w-8 h-8 text-green-600" />
          <span className="text-lg font-medium text-green-800">
            ¡Ya tienes WhatsApp configurado!
          </span>
        </div>
        <p className="text-green-700 mb-4">
          Tienes {configurations.length} configuración(es) activa(s).
          Puedes gestionarlas desde el panel principal.
        </p>
        <button
          onClick={() => window.location.href = '/whatsapp/multi-manager'}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Ir al panel de gestión
        </button>
      </div>
    ) : (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
          <span className="text-lg font-medium text-yellow-800">
            No tienes WhatsApp configurado
          </span>
        </div>
        <p className="text-yellow-700 mb-4">
          No hay problema, te voy a guiar paso a paso para configurarlo.
        </p>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continuar con la configuración
        </button>
      </div>
    )}
  </div>
);

const SelectCompanyStep = ({ companies, onCompanySelect }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
        <UserGroupIcon className="w-12 h-12 text-purple-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Selecciona la empresa para WhatsApp
      </h2>
      <p className="text-gray-600">
        Elige la empresa que estará conectada a este número de WhatsApp
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {companies.map((company) => (
        <button
          key={company.id}
          onClick={() => onCompanySelect(company.id)}
          className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{company.name}</h3>
              <p className="text-sm text-gray-600">
                {company.description || 'Empresa configurada en StaffHub'}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>

    {companies.length === 0 && (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No tienes empresas configuradas
        </h3>
        <p className="text-gray-600 mb-4">
          Necesitas tener al menos una empresa para configurar WhatsApp.
        </p>
        <button
          onClick={() => window.location.href = '/configuracion/empresas'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Ir a configuración de empresas
        </button>
      </div>
    )}
  </div>
);

const MetaSetupStep = ({ onNext }) => {
  const [currentSubStep, setCurrentSubStep] = useState(0);

  const subSteps = [
    {
      title: 'Crear cuenta en Meta Developers',
      description: 'Ve a developers.facebook.com y crea una cuenta con tu perfil de Facebook Business',
      action: 'Ir a Meta Developers',
      url: 'https://developers.facebook.com',
      tips: [
        'Usa una cuenta de Facebook Business Manager',
        'Si no tienes, crea una cuenta gratuita',
        'Verifica tu identidad si es necesario'
      ]
    },
    {
      title: 'Crear nueva aplicación',
      description: 'Haz clic en "Mis Aplicaciones" → "Crear Aplicación" → "Negocio"',
      action: 'Ver instrucciones',
      tips: [
        'Selecciona "Negocio" como tipo de aplicación',
        'Pon un nombre descriptivo como "StaffHub WhatsApp"',
        'Asocia tu cuenta de Business Manager'
      ]
    },
    {
      title: 'Configurar WhatsApp',
      description: 'En el panel de la aplicación, busca "WhatsApp" y haz clic en "Configurar"',
      action: 'Ver pasos detallados',
      tips: [
        'Busca "WhatsApp" en la lista de productos',
        'Haz clic en "Configurar" o "Set up"',
        'Sigue el asistente de configuración'
      ]
    },
    {
      title: 'Obtener credenciales',
      description: 'Una vez configurado, obtén tu Access Token permanente y Phone Number ID',
      action: 'Continuar',
      tips: [
        'Ve a WhatsApp → Configuración',
        'Copia el "Access Token permanente"',
        'Anota el "Phone Number ID"'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <GlobeAltIcon className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Paso {currentSubStep + 1}: {subSteps[currentSubStep].title}
        </h2>
        <p className="text-gray-600">
          {subSteps[currentSubStep].description}
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-3">💡 Consejos para este paso:</h3>
        <ul className="space-y-2">
          {subSteps[currentSubStep].tips.map((tip, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckCircleSolid className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {subSteps[currentSubStep].url && (
        <div className="text-center">
          <a
            href={subSteps[currentSubStep].url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <GlobeAltIcon className="w-4 h-4 mr-2" />
            {subSteps[currentSubStep].action}
          </a>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentSubStep(Math.max(0, currentSubStep - 1))}
          disabled={currentSubStep === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>

        <div className="flex space-x-2">
          {subSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentSubStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            if (currentSubStep < subSteps.length - 1) {
              setCurrentSubStep(currentSubStep + 1);
            } else {
              onNext();
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {currentSubStep < subSteps.length - 1 ? 'Siguiente' : 'Listo, continuar'}
        </button>
      </div>
    </div>
  );
};

const CredentialsStep = ({ setupData, onCredentialsSubmit, isLoading }) => {
  const [formData, setFormData] = useState(setupData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCredentialsSubmit(formData);
  };

  const generateWebhookToken = () => {
    const token = 'whatsapp_' + Math.random().toString(36).substr(2, 16);
    setFormData({ ...formData, webhookVerifyToken: token });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <KeyIcon className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ingresa tus credenciales de WhatsApp
        </h2>
        <p className="text-gray-600">
          Copia y pega la información desde tu panel de Meta Developers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Token (Token de Acceso Permanente)
          </label>
          <input
            type="text"
            value={formData.accessToken}
            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
            placeholder="EAAZA..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Lo encuentras en WhatsApp → Configuración → Token de acceso permanente
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number ID
          </label>
          <input
            type="text"
            value={formData.phoneNumberId}
            onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
            placeholder="1234567890123456..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Lo encuentras en WhatsApp → Configuración → Número de teléfono
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook Verify Token (Opcional)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.webhookVerifyToken}
              onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
              placeholder="whatsapp_token_secreto_123"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={generateWebhookToken}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Generar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Token único para verificar webhooks. Puedes generar uno automáticamente.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="testMode"
            checked={formData.testMode}
            onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <label htmlFor="testMode" className="ml-2 text-sm text-gray-700">
            Iniciar en modo prueba (sin costos de mensajes)
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verificando credenciales...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              Verificar y guardar configuración
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const TestConnectionStep = ({ connectionTest, isLoading, onRetry }) => (
  <div className="text-center space-y-6">
    <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
      <ShieldCheckIcon className="w-12 h-12 text-blue-600" />
    </div>

    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Probando tu conexión con WhatsApp
      </h2>
      <p className="text-gray-600">
        Estamos verificando que todo funcione correctamente...
      </p>
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center space-x-3 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">Verificando conexión...</span>
      </div>
    ) : connectionTest ? (
      <div className={`rounded-lg p-6 ${
        connectionTest.success
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-center space-x-3 mb-4">
          {connectionTest.success ? (
            <CheckCircleSolid className="w-8 h-8 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          )}
          <h3 className={`text-lg font-semibold ${
            connectionTest.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {connectionTest.success ? '¡Conexión exitosa!' : 'Error de conexión'}
          </h3>
        </div>

        <p className={`text-sm mb-4 ${
          connectionTest.success ? 'text-green-700' : 'text-red-700'
        }`}>
          {connectionTest.message}
        </p>

        {connectionTest.success && connectionTest.data && (
          <div className="text-left bg-white rounded p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Información verificada:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Nombre verificado:</strong> {connectionTest.data.phoneNumber?.verified_name || 'N/A'}</div>
              <div><strong>Calidad:</strong> {connectionTest.data.phoneNumber?.quality_rating || 'N/A'}</div>
              <div><strong>Estado del webhook:</strong> {connectionTest.data.webhookStatus || 'No configurado'}</div>
            </div>
          </div>
        )}

        {!connectionTest.success && (
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              Revisa tus credenciales e intenta nuevamente.
            </p>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar verificación
            </button>
          </div>
        )}
      </div>
    ) : null}
  </div>
);

const SuccessStep = ({ configurations }) => (
  <div className="text-center space-y-6">
    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
      <CheckCircleSolid className="w-12 h-12 text-green-600" />
    </div>

    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        ¡Felicitaciones! WhatsApp está configurado
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        Tu WhatsApp Business está listo para usar. Ahora puedes enviar mensajes desde StaffHub.
      </p>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h3 className="font-medium text-green-900 mb-3">✅ ¿Qué puedes hacer ahora?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
        <div className="flex items-center space-x-2">
          <CheckCircleSolid className="w-4 h-4" />
          <span>Enviar mensajes individuales</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleSolid className="w-4 h-4" />
          <span>Campañas masivas con colas inteligentes</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleSolid className="w-4 h-4" />
          <span>Respuestas automáticas con IA</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleSolid className="w-4 h-4" />
          <span>Estadísticas y reportes detallados</span>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={() => window.location.href = '/communication'}
        className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
        Ir a enviar mensajes
      </button>

      <button
        onClick={() => window.location.href = '/whatsapp/multi-manager'}
        className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        <CogIcon className="w-4 h-4 mr-2" />
        Gestionar configuraciones
      </button>

      <button
        onClick={() => window.location.href = '/panel-principal'}
        className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        <ChartBarIcon className="w-4 h-4 mr-2" />
        Volver al panel principal
      </button>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-left text-sm text-blue-800">
          <strong>¿Necesitas ayuda?</strong><br />
          Si tienes problemas o preguntas, puedes contactar al soporte técnico.
          También puedes revisar la documentación completa en cualquier momento.
        </div>
      </div>
    </div>
  </div>
);

export default WhatsAppOnboarding;