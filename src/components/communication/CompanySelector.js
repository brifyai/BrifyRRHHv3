import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const CompanySelector = ({ 
  companies, 
  selectedCompany, 
  onCompanyChange, 
  loadingCompanies,
  companyMetrics 
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-4 h-4 text-purple-600" />
          <label className="text-sm font-medium text-gray-700">
            Empresa:
          </label>
        </div>
        <div className="flex-1 max-w-xs">
          {loadingCompanies ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Cargando empresas...</span>
            </div>
          ) : (
            <select
              value={selectedCompany}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="all">Todas las empresas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {companyMetrics && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Empleados:</span>
              <span className="font-semibold text-purple-600">{companyMetrics.employeeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Engagement:</span>
              <span className="font-semibold text-green-600">{companyMetrics.engagementRate}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySelector;