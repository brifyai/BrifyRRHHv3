import React from 'react';
import { BuildingOfficeIcon, UsersIcon, PaperAirplaneIcon, EyeIcon, FaceSmileIcon, FaceFrownIcon, ExclamationTriangleIcon, ClockIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Memoizar el componente para evitar re-renders innecesarios
const CompanyCard = React.memo(({ company, isFlipped, onToggleFlip }) => {
  
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
  
  // Usar los datos que ya vienen del componente padre
  const scheduledMessages = company.scheduledMessages || 0;
  const draftMessages = company.draftMessages || 0;
  const nextSendDate = company.nextScheduledDate;
  
  return (
    <div
      className="group relative"
      style={{
        animationDelay: `${Math.random() * 100}ms`,
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <div
        className="relative cursor-pointer transition-all duration-700"
        style={{
          height: '400px',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
        onClick={(e) => {
          // Verificar si el clic fue en el botón de tendencias
          if (e.target.closest('button')) {
            return; // No hacer nada si el clic fue en un botón
          }
          onToggleFlip(company.id);
        }}
      >
        {/* Lado frontal de la tarjeta */}
        <div className="absolute inset-0 bg-white rounded-3xl shadow-xl p-6 border border-gray-100" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  {company.name}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {company.employeeCount}
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <UsersIcon className="h-3 w-3 mr-1" />
                Empleados
              </div>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Enviados</div>
                    <div className="text-lg font-bold text-blue-600">
                      {company.sentMessages?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Leídos</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {company.readMessages?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <EyeIcon className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Sentimiento */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Sentimiento</div>
                  <div className="text-lg font-bold text-purple-600">
                    {company.sentimentScore ? 
                      (company.sentimentScore > 0 ? '+' : '') + company.sentimentScore.toFixed(2) 
                      : '0.00'
                    }
                  </div>
                </div>
                {company.sentimentScore > 0 ? (
                  <FaceSmileIcon className="h-5 w-5 text-green-500" />
                ) : company.sentimentScore < 0 ? (
                  <FaceFrownIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Engagement</div>
                  <div className="text-lg font-bold text-orange-600">
                    {company.engagementRate || 0}%
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {Math.round(company.engagementRate || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de tendencias */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Aquí iría la lógica para mostrar tendencias
                console.log(`📈 Mostrando tendencias para ${company.name}`);
              }}
              className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-105"
              title="Ver tendencias"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Lado trasero de la tarjeta */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl shadow-xl p-6 border border-gray-100" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', WebkitTransform: 'rotateY(180deg)' }}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">
                {company.name}
              </h4>
              <div className="text-sm text-gray-500">
                Vista Detallada
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Programados */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Mensajes Programados</div>
                    <div className="text-xl font-bold text-indigo-600">
                      {scheduledMessages}
                    </div>
                    {nextSendDate && (
                      <div className="text-xs text-gray-400 mt-1">
                        Próximo: {new Date(nextSendDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <ClockIcon className="h-6 w-6 text-indigo-500" />
                </div>
              </div>

              {/* Borradores */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Borradores</div>
                    <div className="text-xl font-bold text-amber-600">
                      {draftMessages}
                    </div>
                  </div>
                  <DocumentTextIcon className="h-6 w-6 text-amber-500" />
                </div>
              </div>

              {/* Estadísticas adicionales */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 mb-2">Estadísticas Adicionales</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Tasa de lectura:</span>
                    <span className="font-medium">
                      {company.sentMessages > 0 ? 
                        Math.round((company.readMessages / company.sentMessages) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última actividad:</span>
                    <span className="font-medium">Hoy</span>
                  </div>
                </div>
              </div>
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