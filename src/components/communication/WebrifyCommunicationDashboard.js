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
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import EmployeeSelector from './EmployeeSelector.js';
import SendMessages from './SendMessages.js';
import EmployeeFolders from './EmployeeFolders.js';
import TemplatesDashboard from './TemplatesDashboard.js';
import ReportsDashboard from './ReportsDashboard.js';
import EmployeeBulkUpload from './EmployeeBulkUpload.js';
import DashboardHeader from './DashboardHeader.js';
import CompanySelector from './CompanySelector.js';
import MetricsGrid from './MetricsGrid.js';
import InsightsPanel from './InsightsPanel.js';
import RecommendationsPanel from './RecommendationsPanel.js';
import templateService from '../../services/templateService.js';
import databaseEmployeeService from '../../services/databaseEmployeeService.js';
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import trendsAnalysisService from '../../services/trendsAnalysisService.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const WebrifyCommunicationDashboard = ({ activeTab = 'dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Función para determinar la pestaña activa basada en la URL actual
  const getActiveTabFromUrl = useCallback(() => {
    const currentPath = location.pathname;
    
    // Mapeo de URLs a pestañas
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
  
  // Actualizar la pestaña activa cuando cambia la URL
  useEffect(() => {
    const newTab = getActiveTabFromUrl();
    if (newTab !== currentTab) {
      setCurrentTab(newTab);
    }
  }, [location.pathname, currentTab, getActiveTabFromUrl]);
  
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

  // ⚠️ ELIMINADO: Lista estática de empresas - ahora se usan solo datos de la BD
  // const companies = useMemo(() => [
  //   'Aguas Andinas', 'Andes Iron', 'Banco de Chile', 'Banco Santander', 'BHP',
  //   'Cencosud', 'Codelco', 'Colbún', 'Copec', 'Enel',
  //   'Entel', 'Falabella', 'Latam Airlines', 'Lider', 'Movistar'
  // ], []);

  // Función para cargar insights de IA para todas las compañías usando SOLO datos reales de BD
  const loadCompanyInsights = useCallback(async () => {
    try {
      console.log('🔍 DEBUG: loadCompanyInsights() - INICIO');
      console.log('🔍 DEBUG: companiesFromDB.length:', companiesFromDB.length);
      
      // ✅ CORRECCIÓN: Usar ÚNICAMENTE empresas de la base de datos
      if (companiesFromDB.length === 0) {
        console.log('🔍 DEBUG: No hay empresas en BD, no se generan insights');
        setCompanyInsights({});
        return;
      }
      
      const companiesForInsights = companiesFromDB.map(c => c.name);
      
      console.log('🔍 DEBUG: Empresas para insights (SOLO BD):', {
        cantidad: companiesForInsights.length,
        nombres: companiesForInsights,
        fuente: 'BD únicamente'
      });
      console.log('🔍 DEBUG: companiesFromDB actual:', {
        cantidad: companiesFromDB.length,
        datos: companiesFromDB.map(c => ({ id: c.id, name: c.name }))
      });
      
      // Verificar duplicaciones en insights (no debería haber, pero por seguridad)
      const uniqueInsights = [...new Set(companiesForInsights)];
      if (uniqueInsights.length !== companiesForInsights.length) {
        console.warn('⚠️ Se detectaron duplicados en companiesForInsights:', {
          original: companiesForInsights.length,
          unique: uniqueInsights.length,
          duplicados: companiesForInsights.length - uniqueInsights.length,
          originalList: companiesForInsights,
          uniqueList: uniqueInsights
        });
      }
      
      console.log('🔍 DEBUG: Generando insights para', uniqueInsights.length, 'empresas únicas de BD');
      
      const insightsPromises = uniqueInsights.map(async (companyName) => {
        try {
          // Usar el nuevo servicio de análisis de tendencias con datos reales
          const insights = await trendsAnalysisService.generateCompanyInsights(companyName);
          console.log(`✅ Insights cargados para ${companyName}:`, insights);
          return { companyName, insights };
        } catch (error) {
          console.warn(`Error loading insights for ${companyName}:`, error.message);
          // Retornar insights por defecto cuando hay error
          return {
            companyName,
            insights: {
              frontInsights: [
                {
                  title: 'Análisis en Progreso',
                  description: `Los datos de comunicación para ${companyName} están siendo procesados con IA. Los insights estarán disponibles pronto.`,
                  type: 'info'
                }
              ],
              backInsights: [
                {
                  title: 'Sistema Activo',
                  description: 'El sistema está analizando patrones de comunicación reales con Groq AI.',
                  type: 'info'
                }
              ]
            }
          };
        }
      });

      const results = await Promise.all(insightsPromises);
      const insightsMap = {};
      results.forEach(({ companyName, insights }) => {
        insightsMap[companyName] = insights;
      });

      setCompanyInsights(insightsMap);
      console.log('✅ Todos los insights cargados:', Object.keys(insightsMap));
    } catch (error) {
      console.error('❌ Error en loadCompanyInsights:', error);
    }
  }, [companiesFromDB]); // ✅ Depender SOLO de los datos reales de la BD

  // Función para cargar empresas y empleados desde la base de datos
  const loadCompaniesFromDB = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      console.log('🔍 DEBUG: loadCompaniesFromDB() - INICIO - Cargando empresas desde base de datos...');
      console.log('🔍 DEBUG: Estado actual de companiesFromDB antes de cargar:', companiesFromDB.length, 'empresas');
      
      // Limpiar estado anterior para evitar acumulación
      setCompaniesFromDB([]);
      setEmployees([]);
      
      // Esperar un tick para asegurar que el estado se limpie
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // ✅ OPTIMIZACIÓN: Cargar empresas y empleados en paralelo con Promise.all
      console.log('🔍 DEBUG: Llamando a organizedDatabaseService.getCompanies() y getEmployees() en paralelo...');
      const [companiesData, employeesData] = await Promise.all([
        organizedDatabaseService.getCompanies(),
        organizedDatabaseService.getEmployees()
      ]);
      
      console.log('🔍 DEBUG: Resultados de carga paralela:', {
        companies: companiesData?.length || 0,
        employees: employeesData?.length || 0
      });
      
      if (companiesData && companiesData.length > 0) {
        // Verificar si hay duplicados antes de establecer el estado
        const uniqueCompanies = companiesData.filter((company, index, self) =>
          index === self.findIndex((c) => c.id === company.id)
        );
        
        if (uniqueCompanies.length !== companiesData.length) {
          console.warn('⚠️ Se detectaron duplicados en companiesData:', {
            original: companiesData.length,
            unique: uniqueCompanies.length,
            duplicados: companiesData.length - uniqueCompanies.length
          });
        }
        
        console.log('🔍 DEBUG: Estableciendo companiesFromDB con', uniqueCompanies.length, 'empresas únicas');
        setCompaniesFromDB(uniqueCompanies);
        setEmployees(employeesData || []);
        
        console.log('✅ Empresas únicas cargadas desde BD:', uniqueCompanies.length);
        console.log('✅ Empleados cargados desde BD:', employeesData?.length || 0);
      } else {
        // ✅ CORRECCIÓN: Si no hay datos en la BD, no usar fallback que causa duplicación
        console.log('🔍 DEBUG: No hay empresas en BD, manteniendo lista vacía para evitar duplicaciones');
        setCompaniesFromDB([]);
        setEmployees([]);
        console.log('✅ Lista de empresas vacía - sin duplicaciones');
      }
    } catch (error) {
      console.error('❌ Error cargando datos desde BD:', error);
      // En caso de error, usar lista vacía para evitar duplicaciones
      setCompaniesFromDB([]);
      setEmployees([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [companiesFromDB.length]); // Añadir dependencia para tracking

  // Función para cargar métricas específicas de una empresa usando datos reales de Supabase
  const loadCompanyMetrics = useCallback(async (companyId) => {
    try {
      if (!companyId || companyId === 'all') {
        setCompanyMetrics(null);
        return;
      }

      // Obtener el nombre de la empresa desde companiesFromDB
      const company = companiesFromDB.find(c => c.id === companyId);
      if (!company) {
        console.warn(`No se encontró empresa con ID: ${companyId}`);
        setCompanyMetrics(null);
        return;
      }

      // Usar trendsAnalysisService para obtener datos reales de Supabase
      // ✅ CORRECCIÓN: Pasar el ID y el flag isId=true para buscar por ID
      const insights = await trendsAnalysisService.generateCompanyInsights(companyId, false, true);
      
      // Extraer métricas reales del servicio
      const communicationMetrics = insights.communicationMetrics || {};
      const employeeData = insights.employeeData || {};
      
      setCompanyMetrics({
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
      });
      
      console.log(`✅ Métricas reales cargadas para ${company.name}:`, {
        employeeCount: employeeData.totalEmployees,
        totalMessages: communicationMetrics.totalMessages,
        engagementRate: communicationMetrics.engagementRate
      });
    } catch (error) {
      console.error('Error cargando métricas de empresa:', error);
      // Fallback a métricas vacías en caso de error
      setCompanyMetrics({
        employeeCount: 0,
        messageStats: { total: 0, read: 0, sent: 0, scheduled: 0, failed: 0 },
        engagementRate: 0,
        deliveryRate: 0,
        readRate: 0
      });
    }
  }, [companiesFromDB]);

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('🔄 Inicializando dashboard de comunicación...');
        
        // ✅ OPTIMIZACIÓN: Cargar todas las fuentes de datos en paralelo
        // PASO 1: Cargar empresas y datos auxiliares simultáneamente
        const [companiesResult, templatesResult, dashboardStatsResult] = await Promise.all([
          // Cargar empresas (internamente ya carga empleados en paralelo)
          loadCompaniesFromDB(),
          // Cargar conteo de plantillas
          templateService.getTemplatesCount(),
          // Cargar estadísticas del dashboard
          databaseEmployeeService.getDashboardStats()
        ]);
        
        console.log('✅ Datos iniciales cargados en paralelo');
        
        // Establecer datos auxiliares
        setTemplatesCount(templatesResult);
        setSentMessages(dashboardStatsResult.sentMessages);
        setReadRate(dashboardStatsResult.readRate);
        
        // PASO 2: Una vez cargadas las empresas, cargar insights
        // Nota: companiesFromDB se actualizará después de loadCompaniesFromDB
        // Usamos setTimeout para esperar a que el estado se actualice
        setTimeout(() => {
          if (companiesFromDB.length > 0) {
            loadCompanyInsights();
          }
        }, 100);
        
        console.log('✅ Dashboard inicializado completamente');
      } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
        // Fallback para datos auxiliares en caso de error
        setTemplatesCount(0);
        setSentMessages(0);
        setReadRate(0);
      }
    };
    
    initializeDashboard();
  }, []); // Solo al montar el componente

  // Efecto para cargar métricas cuando cambia la empresa seleccionada
  // eslint-disable-next-line no-use-before-define, react-hooks/exhaustive-deps
// eslint-disable-next-line no-use-before-define, react-hooks/exhaustive-deps
useEffect(() => {
    loadCompanyMetrics(selectedCompany);
  }, [selectedCompany, loadCompanyMetrics]);

  // ✅ CORRECCIÓN: Efecto para manejar compañía seleccionada SIN lista estática
  useEffect(() => {
    // Verificar si hay una compañía seleccionada desde el estado de navegación
    console.log('🔍 DEBUG: Verificando estado de navegación...');
    console.log('🔍 DEBUG: location:', location);
    console.log('🔍 DEBUG: location.state:', location.state);

    if (location.state && location.state.selectedCompany) {
      const selectedCompanyFromNav = location.state.selectedCompany;
      console.log('🔍 DEBUG: Compañía seleccionada desde navegación:', selectedCompanyFromNav);
      
      // ✅ CORRECCIÓN: Usar empresas de la BD para comparación, no lista estática
      const companiesList = companiesFromDB.map(c => c.name);
      console.log('🔍 DEBUG: Compañías disponibles en BD:', companiesList);

      // Buscar la compañía que coincida exactamente en los datos de BD
      const matchingCompany = companiesList.find(company => company === selectedCompanyFromNav);
      console.log('🔍 DEBUG: Compañía encontrada en BD:', matchingCompany);

      if (matchingCompany) {
        // Encontrar el ID de la empresa coincidente
        const companyObject = companiesFromDB.find(c => c.name === matchingCompany);
        if (companyObject) {
          console.log('🔍 DEBUG: Estableciendo empresa seleccionada por ID:', companyObject.id);
          setSelectedCompany(companyObject.id);
        }
      } else {
        console.warn('⚠️ No se encontró coincidencia en BD para:', selectedCompanyFromNav);
        // Si no hay coincidencia, mantener 'all'
        setSelectedCompany('all');
      }
    } else {
      console.log('🔍 DEBUG: No hay compañía seleccionada en el estado');
    }
  }, [location, companiesFromDB]); // ✅ Depender de companiesFromDB, no de lista estática




  // Orden específico para los insights (incluyendo variaciones)
  const insightOrder = [
    "Éxito",
    "Exito",
    "Tendencia Positiva",
    "Tendencia positiva",
    "Oportunidad",
    "Insight",
    "Patrón Identificado",
    "Patrón identificado",
    "Tema Recurrente",
    "Tema recurrente",
    "Área de Mejora",
    "Área de mejora",
    "Tendencias negativas",
    "Tendencias Negativas",
    "Alerta"
  ];

  // Función para obtener el índice de orden basado en keywords
  const getOrderIndex = (title) => {
    for (let i = 0; i < insightOrder.length; i++) {
      if (title.toLowerCase().includes(insightOrder[i].toLowerCase())) {
        return i;
      }
    }
    return insightOrder.length; // Si no coincide, va al final
  };

  // Función para ordenar insights por título
  const sortInsights = (insights) => {
    return insights.sort((a, b) => getOrderIndex(a.title) - getOrderIndex(b.title));
  };

  // Función para renderizar insights dinámicos
  const renderCompanyInsights = (companyName, insights) => {
    if (!insights) return null;

    const sortedFrontInsights = sortInsights([...(insights.frontInsights || [])]);

    if (companyName === 'Corporación Chilena') {
      console.log('Corporación Chilena front insights titles:', insights.frontInsights?.map(i => i.title));
      console.log('Corporación Chilena sorted front insights titles:', sortedFrontInsights.map(i => i.title));
    }

    return (
      <div className="space-y-4">
        {sortedFrontInsights.map((insight, index) => (
          <div key={index} className="bg-white/70 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                insight.type === 'positive' ? 'bg-green-500' :
                insight.type === 'negative' ? 'bg-red-500' :
                insight.type === 'warning' ? 'bg-orange-500' :
                insight.type === 'info' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">{insight.title}</span>
            </div>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>
    );
  };

  // Función para renderizar insights del reverso
  const renderBackInsights = (companyName, insights) => {
    if (!insights) return null;

    const sortedBackInsights = sortInsights([...(insights.backInsights || [])]);

    if (companyName === 'Corporación Chilena') {
      console.log('Corporación Chilena back insights titles:', insights.backInsights?.map(i => i.title));
      console.log('Corporación Chilena sorted back insights titles:', sortedBackInsights.map(i => i.title));
    }

    return (
      <div className="space-y-4">
        {sortedBackInsights.map((insight, index) => (
          <div key={index} className="bg-white/70 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                insight.type === 'positive' ? 'bg-green-500' :
                insight.type === 'negative' ? 'bg-red-500' :
                insight.type === 'warning' ? 'bg-orange-500' :
                insight.type === 'info' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">{insight.title}</span>
            </div>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>
    );
  };



  const tabs = [
    { id: 'dashboard', name: 'Tendencias', icon: ChartBarIcon, url: '/base-de-datos' },
    { id: 'database', name: 'Datos', icon: BuildingOfficeIcon, url: '/base-de-datos/database' },
    { id: 'send', name: 'Enviar', icon: PaperAirplaneIcon, url: '/communication/send' },
    { id: 'folders', name: 'Carpetas', icon: FolderIcon, url: '/communication/folders' },
    { id: 'templates', name: 'Plantillas', icon: TemplateIcon, url: '/communication/templates' },
    { id: 'reports', name: 'Reportes', icon: DocumentReportIcon, url: '/communication/reports' },
    { id: 'bulk-upload', name: 'Importar', icon: ArrowUpTrayIcon, url: '/communication/bulk-upload' },
  ];

  // Función para navegar a una URL específica
  const handleNavigation = async (tab) => {
    try {
      console.log(`🚀 Navegando a: ${tab.url}`);
      navigate(tab.url);
    } catch (error) {
      console.error('❌ Error al navegar:', error);
      // En caso de error, mostrar alerta
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al navegar. Por favor, inténtelo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    }
  };

  const renderActiveTab = () => {
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
        return <EmployeeBulkUpload />; // Agregar la nueva pestaña
      default:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard de Comunicación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-sm opacity-80">Total Empleados</p>
                    <p className="text-2xl font-bold">{employees.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center">
                  <PaperAirplaneIcon className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-sm opacity-80">Mensajes Enviados</p>
                    <p className="text-2xl font-bold">{sentMessages.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center">
                  <TemplateIcon className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-sm opacity-80">Plantillas</p>
                    <p className="text-2xl font-bold">{templatesCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                <div className="flex items-center">
                  <DocumentReportIcon className="h-8 w-8" />
                  <div className="ml-4">
                    <p className="text-sm opacity-80">Tasa de Lectura</p>
                    <p className="text-2xl font-bold">{readRate}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              {/* Análisis Inteligente de Tendencias - Usando componentes modulares */}
              <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-gray-200 shadow-lg">
                <DashboardHeader />
                
                <CompanySelector
                  companies={companiesFromDB}
                  selectedCompany={selectedCompany}
                  onCompanyChange={setSelectedCompany}
                  loadingCompanies={loadingCompanies}
                  companyMetrics={companyMetrics}
                />
                
                <MetricsGrid
                  companyMetrics={companyMetrics}
                  employees={employees}
                  selectedCompany={selectedCompany}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InsightsPanel
                    companyInsights={
                      selectedCompany !== 'all' && companiesFromDB.find(c => c.id === selectedCompany)
                        ? companyInsights[companiesFromDB.find(c => c.id === selectedCompany).name]
                        : []
                    }
                    selectedCompany={selectedCompany}
                  />
                  
                  <RecommendationsPanel
                    recommendations={
                      selectedCompany !== 'all' && companiesFromDB.find(c => c.id === selectedCompany)
                        ? companyInsights[companiesFromDB.find(c => c.id === selectedCompany).name]?.backInsights || []
                        : []
                    }
                  />
                </div>

                {/* Footer */}
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-indigo-800">Análisis Actualizado</p>
                      <p className="text-xs text-indigo-600">Los insights se generan automáticamente cada 24 horas basados en patrones de comunicación y consultas a la base de conocimiento.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header simple sin menú */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Mobile menu button */}
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

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <nav className="px-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <div key={tab.id}>
                        <button
                          onClick={() => {
                            handleNavigation(tab);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 text-left ${
                            location.pathname === tab.url
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {tab.name}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Main content - Ahora ocupa todo el ancho disponible */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop horizontal menu - rediseño moderno */}
        <div className="mb-4">
          <nav className="flex items-center justify-center gap-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 shadow-lg border border-gray-200/50 backdrop-blur-sm overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.url;

              return (
                <div key={tab.id} className="relative group">
                  <button
                    onClick={() => handleNavigation(tab)}
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

                    {/* Active glow effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl blur opacity-30 animate-pulse"></div>
                    )}
                  </button>

                  {/* Decorative elements */}
                  {!isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="w-full">
          {renderActiveTab()}
        </div>

        {/* Production Database Debugger - Only show in production or when there's an issue */}
      </div>
    </div>
  );
};

export default WebrifyCommunicationDashboard;