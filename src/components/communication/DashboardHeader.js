import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl mr-4 shadow-lg">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Análisis Inteligente de Tendencias
          </h3>
          <p className="text-gray-600 text-sm">Insights generados por IA sobre comunicación y engagement</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;