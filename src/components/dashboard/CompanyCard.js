import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  PaperAirplaneIcon, 
  EyeIcon, 
  FaceSmileIcon, 
  FaceFrownIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ChartBarIcon,
  CalendarIcon,
  PencilIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CogIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Memoizar el componente para evitar re-renders innecesarios
const CompanyCard = React.memo(({ company, isFlipped, onToggleFlip }) => {
  
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState('overview');
  
  // Logging solo en desarrollo y solo una vez por empresa
  if (process.env.NODE_ENV === 'development' && !company._logged) {
    console.log(`🎯 CompanyCard: Renderizando tarjeta para ${company.name}`)
    console.log(`   - ID: ${company.id}`)
    console.log(`   - Empleados: ${company.employeeCount}`)
    console.log(`   - Mensajes enviados: ${company.sentMessages}`)
    console.log(`   - Mensajes leídos: ${company.readMessages}`)
    console.log(`   - Sentimiento: ${company.sentimentScore}`)
    console.log(`   - Engagement: ${company.engagementRate}%`)
    
    // Marcar como loggeado para evitar logs repetitivos
    company._logged = true
  }
  
  // Verificar datos inválidos solo una vez
  if (process.env.NODE_ENV === 'development' && !company._validated) {
    if (company.sentimentScore && (company.sentimentScore > 1 || company.sentimentScore < -1)) {
      console.warn(`⚠️ CompanyCard: DATO MOCK DETECTADO - Sentimiento inválido (${company.sentimentScore}) para ${company.name}`)
    }
    
    if (company.employeeCount && (company.employeeCount < 0 || company.employeeCount > 1000)) {
      console.warn(`⚠️ CompanyCard: DATO MOCK DETECTADO - Número de empleados inválido (${company.employeeCount}) para ${company.name}`)
    }
    
    company._validated = true
  }

  // Datos adicionales para información completa
  const additionalData = {
    scheduledMessages: company.scheduledMessages || 0,
    draftMessages: company.draftMessages || 0,
    nextScheduledDate: company.nextScheduledDate || 'No programado',
    lastActivity: company.lastActivity || 'Hace 2 horas',
    responseRate: company.responseRate || 85,
    avgResponseTime: company.avgResponseTime || '15 min'
  };

  const getSentimentIcon = (score) => {
    if (score > 0) return <FaceSmileIcon className="h-4 w-4 text-green-500" />;
    if (score < 0) return <FaceFrownIcon className="h-4 w-4 text-red-500" />;
    return <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />;
  };

  const getSentimentColor = (score) => {
    if (score > 0) return 'from-green-50 to-emerald-50 border-green-200';
    if (score < 0) return 'from-red-50 to-pink-50 border-red-200';
    return 'from-gray-50 to-slate-50 border-gray-200';
  };

  const getEngagementColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Definir las pestañas disponibles
  const tabs = [
    { id: 'overview', name: 'Resumen', icon: InformationCircleIcon },
    { id: 'messages', name: 'Mensajes', icon: ChatBubbleLeftRightIcon },
    { id: 'analytics', name: 'Analítica', icon: ChartBarIcon },
    { id: 'schedule', name: 'Programación', icon: CalendarIcon },
    { id: 'settings', name: 'Configuración', icon: CogIcon }
  ];

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-3">
            {/* Métricas principales en grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded p-3 border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <PaperAirplaneIcon className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-700">Enviados</span>
                </div>
                <div className="text-sm font-bold text-blue-800">
                  {company.sentMessages?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded p-3 border border-emerald-100">
                <div className="flex items-center space-x-2 mb-2">
                  <EyeIcon className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">Leídos</span>
                </div>
                <div className="text-sm font-bold text-emerald-800">
                  {company.readMessages?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded p-3 border border-purple-100">
                <div className="flex items-center space-x-2 mb-2">
                  <UsersIcon className="h-3 w-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-700">Empleados</span>
                </div>
                <div className="text-sm font-bold text-purple-800">
                  {company.employeeCount || 0}
                </div>
              </div>

              <div className={`bg-gradient-to-br ${getSentimentColor(company.sentimentScore)} rounded p-3 border`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getSentimentIcon(company.sentimentScore)}
                  <span className="text-xs font-medium text-gray-700">Sentimiento</span>
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {company.sentimentScore ?
                    (company.sentimentScore > 0 ? '+' : '') + company.sentimentScore.toFixed(2)
                    : '0.00'
                  }
                </div>
              </div>
            </div>

            {/* Engagement y estado */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded p-3 border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-orange-700">Engagement</span>
                </div>
                <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getEngagementColor(company.engagementRate || 0)}`}>
                  {Math.round(company.engagementRate || 0)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded p-2 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <PaperAirplaneIcon className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700">Total Enviados</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-800">
                  {company.sentMessages?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {company.readMessages && company.sentMessages ?
                    `${Math.round((company.readMessages / company.sentMessages) * 100)}% tasa de lectura`
                    : 'Sin datos de lectura'
                  }
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded p-2 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700">Total Leídos</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-800">
                  {company.readMessages?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {additionalData.responseRate}% tasa de respuesta
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded p-2 border border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <PencilIcon className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-700">Borradores</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-amber-800">
                  {additionalData.draftMessages}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  Listos para enviar
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className={`bg-gradient-to-br ${getSentimentColor(company.sentimentScore)} rounded p-2 border`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    {getSentimentIcon(company.sentimentScore)}
                    <span className="text-xs font-medium text-gray-700">Sentimiento</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {company.sentimentScore ?
                    (company.sentimentScore > 0 ? '+' : '') + company.sentimentScore.toFixed(2)
                    : '0.00'
                  }
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {company.sentimentScore > 0 ? 'Positivo' : company.sentimentScore < 0 ? 'Negativo' : 'Neutral'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded p-2 border border-orange-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <ChartBarIcon className="h-3 w-3 text-orange-500" />
                    <span className="text-xs font-medium text-orange-700">Engagement</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-orange-800">
                  {company.engagementRate || 0}%
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  {company.engagementRate >= 80 ? 'Excelente' :
                   company.engagementRate >= 60 ? 'Bueno' : 'Necesita mejora'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded p-2 border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <ArrowTrendingUpIcon className="h-3 w-3 text-indigo-500" />
                    <span className="text-xs font-medium text-indigo-700">Tasa de Respuesta</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-indigo-800">
                  {additionalData.responseRate}%
                </div>
                <div className="text-xs text-indigo-600 mt-1">
                  Tiempo promedio: {additionalData.avgResponseTime}
                </div>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded p-2 border border-purple-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-3 w-3 text-purple-500" />
                    <span className="text-xs font-medium text-purple-700">Programados</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-purple-800">
                  {additionalData.scheduledMessages}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {additionalData.scheduledMessages > 0 ? 'Activo' : 'Sin programaciones'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded p-2 border border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <PencilIcon className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-700">Borradores</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-amber-800">
                  {additionalData.draftMessages}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  Listos para programar
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded p-2 border border-pink-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3 text-pink-500" />
                    <span className="text-xs font-medium text-pink-700">Última Actividad</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-pink-800">
                  {additionalData.lastActivity}
                </div>
                <div className="text-xs text-pink-600 mt-1">
                  {additionalData.nextScheduledDate}
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded p-2 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <BuildingOfficeIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">Empresa</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {company.name}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Sistema activo
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded p-2 border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Estado</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-green-800 mt-[16px]">
                  Activo
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded p-2 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700">Configuración</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-800">
                  Activa
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Sincronización habilitada
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  
  return (
    <div className="group relative">
      {/* Efecto de brillo de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
      
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-[420px]">
        
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BuildingOfficeIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium truncate max-w-[120px]">{company.name}</h4>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{company.employeeCount}</div>
              <div className="text-xs text-violet-100 flex items-center">
                <UsersIcon className="h-3 w-3 mr-1" />
                Empleados
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex justify-center overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center space-x-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  title={tab.name}
                >
                  <IconComponent className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="p-3 h-[240px]">
          {renderTabContent()}
        </div>

        {/* Footer con indicador de estado */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span></span>
            <div className="flex items-center space-x-1 mt-[24px]">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Activo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Configurar displayName para debugging
CompanyCard.displayName = 'CompanyCard';

export default CompanyCard;