import React from 'react';
import { 
  ChartBarIcon, 
  BellIcon, 
  LightBulbIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

const MetricsGrid = ({ companyMetrics, employees, selectedCompany }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Engagement Rate */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all duration-300 hover:scale-102">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <ChartBarIcon className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {companyMetrics?.engagementRate > 0 ? `+${companyMetrics.engagementRate}%` : 'Sin datos'}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {companyMetrics?.engagementRate ?? 0}%
        </p>
        <p className="text-sm text-gray-600">
          {selectedCompany !== 'all' ? 'Engagement Real' : 'Engagement Promedio Real'}
        </p>
      </div>

      {/* Read Rate */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300 hover:scale-102">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <BellIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {companyMetrics?.messageStats?.total > 0 ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {companyMetrics?.messageStats?.total > 0
            ? Math.round((companyMetrics.messageStats.read / companyMetrics.messageStats.total) * 100)
            : 0}%
        </p>
        <p className="text-sm text-gray-600">Tasa de Lectura Real</p>
      </div>

      {/* Messages Sent */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-100 hover:shadow-md transition-all duration-300 hover:scale-102">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-cyan-100 p-2 rounded-lg">
            <LightBulbIcon className="h-5 w-5 text-cyan-600" />
          </div>
          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
            {companyMetrics?.messageStats?.total > 0 ? 'Con datos' : 'Sin datos'}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {companyMetrics?.messageStats?.total ?? 0}
        </p>
        <p className="text-sm text-gray-600">Mensajes Enviados Reales</p>
      </div>

      {/* Employee Count */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rose-100 hover:shadow-md transition-all duration-300 hover:scale-102">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-rose-100 p-2 rounded-lg">
            <SparklesIcon className="h-5 w-5 text-rose-600" />
          </div>
          <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded-full">Real</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {companyMetrics?.employeeCount ?? employees.length}
        </p>
        <p className="text-sm text-gray-600">
          {selectedCompany !== 'all' ? 'Empleados Reales' : 'Total Empleados Reales'}
        </p>
      </div>
    </div>
  );
};

export default MetricsGrid;