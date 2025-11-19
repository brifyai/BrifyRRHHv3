// COPIA DEL COMPONENTE CON LOGS EXTREMOS EN CADA PASO
// Usar este archivo temporalmente para debuggear

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  DocumentTextIcon as TemplateIcon,
  DocumentChartBarIcon as DocumentReportIcon,
  FolderIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  BellIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import EmployeeSelector from './EmployeeSelector.js';
import SendMessages from './SendMessages.js';
import EmployeeFolders from './EmployeeFolders.js';
import TemplatesDashboard from './TemplatesDashboard.js';
import ReportsDashboard from './ReportsDashboard.js';
import EmployeeBulkUpload from './EmployeeBulkUpload.js';
import templateService from '../../services/templateService.js';
import databaseEmployeeService from '../../services/databaseEmployeeService.js';
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import trendsAnalysisService from '../../services/trendsAnalysisService.js';
import ProductionDatabaseDebugger from '../debug/ProductionDatabaseDebugger.js';
import ProductionEnvChecker from '../debug/ProductionEnvChecker.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';// LOG EXTREMO - Función para debuggear
const EXTREME_LOG = (label, data) => {
  console.log(`🔍 [EXTREME DEBUG] ${label}:`, JSON.parse(JSON.stringify(data)));
};

const WebrifyCommunicationDashboard_DEBUG = ({ activeTab = 'dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  EXTREME_LOG('Componente montado', { activeTab, location: location.pathname });

  const getActiveTabFromUrl = useCallback(() => {
    const currentPath = location.pathname;
    const urlToTabMap = {
      '/base-de-datos': 'dashboard',
      '/base-de-datos/database': 'database',
      '/communication/send': 'send',
      '/communication/folders': 'folders',
      '/communication/templates': 'templates',
      '/communication/reports': 'reports',
      '/communication/bulk-upload': 'bulk-upload'
    };
    return urlToTabMap[currentPath] || activeTab;
  }, [location.pathname, activeTab]);
  
  const [currentTab, setCurrentTab] = useState(getActiveTabFromUrl());
  const [templatesCount, setTemplatesCount] = useState(0);
  const [sentMessages, setSentMessages] = useState(0);
  const [readRate, setReadRate] = useState(0);
  const [companyInsights, setCompanyInsights] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    insights: true,
    recommendations: true
  });
  const [employees, setEmployees] = useState([]);

  // Estados para el selector de empresas
  const [companiesFromDB, setCompaniesFromDB] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [companyMetrics, setCompanyMetrics] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  EXTREME_LOG('Estado inicial', {
    companiesFromDB: [],
    selectedCompany: 'all',
    companyMetrics: null,
    loading: true
  });

  // Función para cargar insights de IA para todas las compañías usando SOLO datos reales de BD
  const loadCompanyInsights = useCallback(async () => {
    EXTREME_LOG('loadCompanyInsights() INICIO', { companiesFromDBLength: companiesFromDB.length });
    
    try {
      if (companiesFromDB.length === 0) {
        EXTREME_LOG('No hay empresas en BD', {});
        setCompanyInsights({});
        return;
      }
      
      const companiesForInsights = companiesFromDB.map(c => c.name);
      EXTREME_LOG('Empresas para insights', companiesForInsights);

      const uniqueInsights = [...new Set(companiesForInsights)];
      EXTREME_LOG('Empresas únicas para insights', uniqueInsights);

      const insightsPromises = uniqueInsights.map(async (companyName) => {
        try {
          EXTREME_LOG(`Generando insights para ${companyName}`, {});
          const insights = await trendsAnalysisService.generateCompanyInsights(companyName);
          EXTREME_LOG(`Insights generados para ${companyName}`, insights);
          return { companyName, insights };
        } catch (error) {
          EXTREME_LOG(`Error en insights para ${companyName}`, error.message);
          return {
            companyName,
            insights: {
              frontInsights: [{
                title: 'Análisis en Progreso',
                description: `Los datos de comunicación para ${companyName} están siendo procesados con IA.`,
                type: 'info'
              }],
              backInsights: [{
                title: 'Sistema Activo',
                description: 'El sistema está analizando patrones de comunicación reales con Groq AI.',
                type: 'info'
              }]
            }
          };
        }
      });

      const results = await Promise.all(insightsPromises);
      const insightsMap = {};
      results.forEach(({ companyName, insights }) => {
        insightsMap[companyName] = insights;
      });

      EXTREME_LOG('Insights map construido', Object.keys(insightsMap));
      setCompanyInsights(insightsMap);
    } catch (error) {
      EXTREME_LOG('Error en loadCompanyInsights', error.message);
    }
  }, [companiesFromDB]);

  // Función para cargar empresas y empleados desde la base de datos
  const loadCompaniesFromDB = useCallback(async () => {
    EXTREME_LOG('loadCompaniesFromDB() INICIO', {});
    setLoadingCompanies(true);
    
    try {
      EXTREME_LOG('Limpiando estado', {});
      setCompaniesFromDB([]);
      setEmployees([]);

      EXTREME_LOG('Llamando a organizedDatabaseService.getCompanies()', {});
      const companiesData = await organizedDatabaseService.getCompanies();
      EXTREME_LOG('organizedDatabaseService.getCompanies() resultado', {
        cantidad: companiesData?.length || 0,
        datos: companiesData?.slice(0, 2)
      });

      if (companiesData && companiesData.length > 0) {
        EXTREME_LOG('Cargando empleados', {});
        const employeesData = await organizedDatabaseService.getEmployees();
        EXTREME_LOG('organizedDatabaseService.getEmployees() resultado', employeesData?.length);

        const uniqueCompanies = companiesData.filter((company, index, self) =>
          index === self.findIndex((c) => c.id === company.id)
        );
        
        EXTREME_LOG('Empresas únicas', uniqueCompanies.length);
        EXTREME_LOG('Estableciendo companiesFromDB', uniqueCompanies.map(c => ({ id: c.id, name: c.name })));
        
        setCompaniesFromDB(uniqueCompanies);
        setEmployees(employeesData);

        EXTREME_LOG('Estado después de setCompaniesFromDB', {
          companiesFromDB: uniqueCompanies.length,
          employees: employeesData.length
        });
      } else {
        EXTREME_LOG('No hay empresas en BD', {});
        setCompaniesFromDB([]);
        setEmployees([]);
      }
    } catch (error) {
      EXTREME_LOG('Error en loadCompaniesFromDB', error.message);
      setCompaniesFromDB([]);
      setEmployees([]);
    } finally {
      setLoadingCompanies(false);
      EXTREME_LOG('loadCompaniesFromDB() FIN', { loading: false });
    }
  }, []);

  // Función para cargar métricas específicas de una empresa usando datos reales de Supabase
  const loadCompanyMetrics = useCallback(async (companyId) => {
    EXTREME_LOG('loadCompanyMetrics() INICIO', { companyId, selectedCompany });
    
    try {
      if (!companyId || companyId === 'all') {
        EXTREME_LOG('companyId es all o null', {});
        setCompanyMetrics(null);
        return;
      }

      EXTREME_LOG('Buscando empresa en companiesFromDB', {
        companyId,
        companiesCount: companiesFromDB.length,
        companies: companiesFromDB.map(c => ({ id: c.id, name: c.name }))
      });

      const company = companiesFromDB.find(c => c.id === companyId);
      
      if (!company) {
        EXTREME_LOG('Empresa no encontrada en companiesFromDB', { companyId });
        setCompanyMetrics(null);
        return;
      }

      EXTREME_LOG('Empresa encontrada', { name: company.name, id: company.id });

      EXTREME_LOG('Llamando a trendsAnalysisService.generateCompanyInsights', {
        companyId,
        forceRegenerate: false,
        isId: true
      });

      const insights = await trendsAnalysisService.generateCompanyInsights(companyId, false, true);
      
      EXTREME_LOG('Resultado de trendsAnalysisService', insights);

      const communicationMetrics = insights.communicationMetrics || {};
      const employeeData = insights.employeeData || {};
      
      EXTREME_LOG('communicationMetrics extraído', communicationMetrics);
      EXTREME_LOG('employeeData extraído', employeeData);

      const metrics = {
        employeeCount: employeeData.totalEmployees || 0,
        messageStats: {
          total: communicationMetrics.totalMessages || 0,
          read: communicationMetrics.readMessages || 0,
          sent: communicationMetrics.sentMessages || 0,
          scheduled: communicationMetrics.scheduledMessages || 0,
          failed: communicationMetrics.failedMessages || 0
        },
        engagementRate: communicationMetrics.engagementRate || 0,
        deliveryRate: communicationMetrics.deliveryRate || 0,
        readRate: communicationMetrics.readRate || 0
      };

      EXTREME_LOG('Metrics construido', metrics);
      setCompanyMetrics(metrics);
      
    } catch (error) {
      EXTREME_LOG('Error en loadCompanyMetrics', {
        message: error.message,
        stack: error.stack
      });
      
      setCompanyMetrics({
        employeeCount: 0,
        messageStats: { total: 0, read: 0, sent: 0, scheduled: 0, failed: 0 },
        engagementRate: 0,
        deliveryRate: 0,
        readRate: 0
      });
    }
    
    EXTREME_LOG('loadCompanyMetrics() FIN', {});
  }, [companiesFromDB]);

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    EXTREME_LOG('useEffect inicial [MONTAJE] INICIO', {});
    
    const initializeDashboard = async () => {
      try {
        EXTREME_LOG('Inicializando dashboard paso 1: loadCompaniesFromDB', {});
        await loadCompaniesFromDB();
        
        EXTREME_LOG('Después de loadCompaniesFromDB', {
          companiesFromDB: companiesFromDB.length
        });
        
        if (companiesFromDB.length > 0) {
          EXTREME_LOG('Inicializando dashboard paso 2: loadCompanyInsights', {});
          await loadCompanyInsights();
        }
        
        EXTREME_LOG('Inicializando dashboard paso 3: datos auxiliares', {});
        const [templatesCount, dashboardStats] = await Promise.all([
          templateService.getTemplatesCount(),
          databaseEmployeeService.getDashboardStats()
        ]);
        
        EXTREME_LOG('Datos auxiliares cargados', {
          templatesCount,
          sentMessages: dashboardStats.sentMessages,
          readRate: dashboardStats.readRate
        });
        
        setTemplatesCount(templatesCount);
        setSentMessages(dashboardStats.sentMessages);
        setReadRate(dashboardStats.readRate);
        
        EXTREME_LOG('Dashboard inicializado completamente', {});
      } catch (error) {
        EXTREME_LOG('Error inicializando dashboard', error.message);
      }
    };
    
    initializeDashboard();
    EXTREME_LOG('useEffect inicial [MONTAJE] FIN', {});
  }, []); // Solo al montar

  // Efecto para cargar métricas cuando cambia la empresa seleccionada
  useEffect(() => {
    EXTREME_LOG('useEffect selectedCompany INICIO', {
      selectedCompany,
      companiesFromDB: companiesFromDB.length
    });
    
    loadCompanyMetrics(selectedCompany);
    
    EXTREME_LOG('useEffect selectedCompany FIN', {});
  }, [selectedCompany, loadCompanyMetrics]);

  // Resto del componente...
  // (El renderizado es el mismo, solo con logs extremos en el estado)

  const renderActiveTab = () => {
    EXTREME_LOG('renderActiveTab() llamado', { currentTab });
    
    switch (currentTab) {
      case 'database':
        return <EmployeeSelector />;
      case 'send':
        return <SendMessages />;
      case 'folders':
        return <EmployeeFolders />;
      case 'templates':
        return <TemplatesDashboard />;
      case 'reports':
        return <ReportsDashboard />;
      case 'bulk-upload':
        return <EmployeeBulkUpload />;
      default:
        EXTREME_LOG('Renderizando dashboard default', {
          selectedCompany,
          companyMetrics,
          companiesFromDB: companiesFromDB.length
        });
        
        return (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard de Comunicación - DEBUG</h2>
            
            {/* DEBUG INFO */}
            <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-yellow-800">🔍 INFORMACIÓN DE DEBUG</h3>
              <pre className="text-sm text-yellow-700 mt-2">
{JSON.stringify({
  selectedCompany,
  companyMetrics,
  companiesCount: companiesFromDB.length,
  timestamp: new Date().toISOString()
}, null, 2)}
              </pre>
            </div>
            
            {/* Selector de Empresas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-medium text-gray-700">Empresa:</label>
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
                      onChange={(e) => {
                        EXTREME_LOG('onChange select empresa', { 
                          oldValue: selectedCompany, 
                          newValue: e.target.value 
                        });
                        setSelectedCompany(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="all">Todas las empresas</option>
                      {companiesFromDB.map((company) => {
                        EXTREME_LOG('Renderizando opción empresa', company);
                        return (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
                
                {/* MÉTRICAS REALES */}
                {companyMetrics && (
                  <div className="flex items-center gap-4 text-xs bg-green-100 p-2 rounded-lg">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-bold">Empleados:</span>
                      <span className="font-bold text-green-600 text-lg">{companyMetrics.employeeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-bold">Engagement:</span>
                      <span className="font-bold text-blue-600">{companyMetrics.engagementRate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-bold">Mensajes:</span>
                      <span className="font-bold text-purple-600">{companyMetrics.messageStats.total}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Tarjeta de Empleados */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {companyMetrics?.employeeCount > 0 ? 'Con datos' : 'Sin datos'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {companyMetrics?.employeeCount ?? 0}
                </p>
                <p className="text-sm text-gray-600">
                  Empleados {selectedCompany !== 'all' ? 'Reales' : 'Totales'}
                </p>
                {companyMetrics && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 p-1 rounded">
                    ✅ Datos cargados correctamente
                  </div>
                )}
              </div>

              {/* Tarjeta de Engagement */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {companyMetrics?.messageStats?.total > 0 ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {companyMetrics?.engagementRate ?? 0}%
                </p>
                <p className="text-sm text-gray-600">Engagement Real</p>
              </div>

              {/* Tarjeta de Mensajes */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-cyan-100 p-2 rounded-lg">
                    <BellIcon className="h-5 w-5 text-cyan-600" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    {companyMetrics?.messageStats?.total > 0 ? 'Con datos' : 'Sin datos'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {companyMetrics?.messageStats?.total ?? 0}
                </p>
                <p className="text-sm text-gray-600">Mensajes Enviados</p>
              </div>

              {/* Tarjeta de Tasa de Lectura */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rose-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-rose-100 p-2 rounded-lg">
                    <SparklesIcon className="h-5 w-5 text-rose-600" />
                  </div>
                  <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded-full">Real</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {companyMetrics?.readRate ?? 0}%
                </p>
                <p className="text-sm text-gray-600">Tasa de Lectura</p>
              </div>
            </div>

            {/* Mensaje de estado */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Modo Debug Activo:</strong> Revisa la consola del navegador (F12) para ver logs detallados.
              </p>
            </div>
          </div>
        );
    }
  };

  EXTREME_LOG('Render principal', { currentTab });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop horizontal menu */}
        <div className="mb-4">
          <nav className="flex items-center justify-center gap-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 shadow-lg border border-gray-200/50 backdrop-blur-sm overflow-x-auto">
            {[
              { id: 'dashboard', name: 'Tendencias', icon: ChartBarIcon, url: '/base-de-datos' },
              { id: 'database', name: 'Datos', icon: BuildingOfficeIcon, url: '/base-de-datos/database' },
              { id: 'send', name: 'Enviar', icon: PaperAirplaneIcon, url: '/communication/send' },
              { id: 'folders', name: 'Carpetas', icon: FolderIcon, url: '/communication/folders' },
              { id: 'templates', name: 'Plantillas', icon: TemplateIcon, url: '/communication/templates' },
              { id: 'reports', name: 'Reportes', icon: DocumentReportIcon, url: '/communication/reports' },
              { id: 'bulk-upload', name: 'Importar', icon: ArrowUpTrayIcon, url: '/communication/bulk-upload' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = window.location.pathname === tab.url;

              return (
                <div key={tab.id} className="relative group">
                  <button
                    onClick={() => {
                      EXTREME_LOG('Navegando a', tab.url);
                      navigate(tab.url);
                    }}
                    className={`relative flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl scale-105'
                        : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md hover:scale-102 border border-gray-200'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 transition-colors duration-300 ${
                      isActive ? 'text-blue-100' : 'text-blue-500 group-hover:text-blue-600'
                    }`} />
                    <span className="tracking-wide">{tab.name}</span>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="w-full">
          {renderActiveTab()}
        </div>

        {/* Debuggers */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <ProductionDatabaseDebugger />
            <ProductionEnvChecker />
          </>
        )}
      </div>
    </div>
  );
};

export default WebrifyCommunicationDashboard_DEBUG;