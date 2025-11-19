import React from 'react';
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const RecommendationsPanel = ({ recommendations, onApplyRecommendation, loading }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 mb-8">
        <div className="flex items-center mb-4">
          <SparklesIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h4 className="text-lg font-semibold text-gray-900">Recomendaciones IA</h4>
        </div>
        <p className="text-gray-600 text-sm">No hay recomendaciones disponibles en este momento.</p>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'low':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 mb-8">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-6 w-6 text-blue-600 mr-3" />
        <h4 className="text-lg font-semibold text-gray-900">Recomendaciones IA</h4>
        <span className="ml-auto text-xs text-gray-500">Generado por IA</span>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div 
            key={index} 
            className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {getIcon(recommendation.type)}
                  <h5 className="font-medium text-gray-900 ml-2">{recommendation.title}</h5>
                  <span className={`ml-3 text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority === 'high' ? 'Alta prioridad' : 
                     recommendation.priority === 'medium' ? 'Media prioridad' : 'Baja prioridad'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span>Impacto esperado: </span>
                    <span className="font-medium text-gray-700">{recommendation.expectedImpact}</span>
                  </div>
                  {onApplyRecommendation && (
                    <button
                      onClick={() => onApplyRecommendation(recommendation)}
                      disabled={loading}
                      className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Aplicar recomendación
                      <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;