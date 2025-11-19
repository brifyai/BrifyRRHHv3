import React from 'react';
import {
  LightBulbIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const InsightsPanel = ({ companyInsights, selectedCompany }) => {
  if (!companyInsights || companyInsights.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 mb-8">
        <div className="flex items-center mb-4">
          <LightBulbIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h4 className="text-lg font-semibold text-gray-900">Insights Clave</h4>
        </div>
        <p className="text-gray-600 text-sm">No hay insights disponibles para esta empresa.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 mb-8">
      <div className="flex items-center mb-6">
        <LightBulbIcon className="h-6 w-6 text-purple-600 mr-3" />
        <h4 className="text-lg font-semibold text-gray-900">Insights Clave</h4>
        <span className="ml-auto text-xs text-gray-500">
          {selectedCompany === 'all' ? 'Todas las empresas' : 'Empresa seleccionada'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companyInsights.map((insight, index) => (
          <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-lg mr-3 mt-1">
                {insight.type === 'engagement' && <ChartBarIcon className="h-5 w-5 text-purple-600" />}
                {insight.type === 'retention' && <UserGroupIcon className="h-5 w-5 text-purple-600" />}
                {insight.type === 'timing' && <ClockIcon className="h-5 w-5 text-purple-600" />}
                {insight.type === 'trend' && <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />}
                {insight.type === 'communication' && <BellIcon className="h-5 w-5 text-purple-600" />}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">{insight.title}</h5>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{insight.metric}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    insight.impact === 'high' 
                      ? 'bg-red-100 text-red-600' 
                      : insight.impact === 'medium'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {insight.impact === 'high' ? 'Alto impacto' : insight.impact === 'medium' ? 'Medio impacto' : 'Bajo impacto'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;