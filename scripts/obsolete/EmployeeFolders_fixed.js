import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import unifiedEmployeeFolderService from '../../services/unifiedEmployeeFolderService.js';
import googleDriveSyncService from '../../services/googleDriveSyncService.js';
// eslint-disable-next-line no-unused-vars
import googleDriveTokenBridge from '../../lib/googleDriveTokenBridge.js';
// eslint-disable-next-line no-unused-vars
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../../styles/responsive-tables.css';

// Iconos SVG simples (reemplazo temporal para Heroicons)
const FolderIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UserIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DocumentIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MagnifyingGlassIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloudArrowUpIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FunnelIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
  </svg>
);

const CheckCircleIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeftIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MySwal = withReactContent(Swal);

const EmployeeFolders = () => {
  // eslint-disable-next-line no-unused-vars
  const { companyId } = useParams();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [folders, setFolders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    companyId: '',
    department: '',
    level: '',
    workMode: '',
    contractType: ''
  });
  const [selectedFolders, setSelectedFolders] = useState(new Set());
  const [companies, setCompanies] = useState([]);
  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Función de filtrado - PRIMERA función (sin dependencias de otras funciones)
  const getFilteredFolders = useCallback(() => {
    let filtered = [...folders];
    
    if (searchTerm) {
      filtered = filtered.filter(folder => 
        folder.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        folder.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        folder.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.companyId) {
      filtered = filtered.filter(folder => folder.companyId === filters.companyId);
    }
    if (filters.department) {
      filtered = filtered.filter(folder => folder.department === filters.department);
    }
    if (filters.level) {
      filtered = filtered.filter(folder => folder.level === filters.level);
    }
    if (filters.workMode) {
      filtered = filtered.filter(folder => folder.workMode === filters.workMode);
    }
    if (filters.contractType) {
      filtered = filtered.filter(folder => folder.contractType === filters.contractType);
    }
    
    console.log('🔍 [PAGINATION DEBUG] getFilteredFolders:', {
      totalFolders: folders.length,
      filteredCount: filtered.length,
      searchTerm,
      filters,
      timestamp: new Date().toISOString()
    });
    
    return filtered;
  }, [folders, searchTerm, filters]);

  // Función de paginación - SEGUNDA función (usa getFilteredFolders)
  const getTotalPages = useCallback(() => {
    const totalItems = getFilteredFolders().length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('📊 [PAGINATION DEBUG] getTotalPages:', {
      totalItems,
      itemsPerPage,
      totalPages,
      timestamp: new Date().toISOString()
    });
    return totalPages;
  }, [getFilteredFolders, itemsPerPage]);

  const foldersToShow = useCallback(() => {
    const filtered = getFilteredFolders();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const result = filtered.slice(startIndex, endIndex);
    
    console.log('📋 [PAGINATION DEBUG] foldersToShow:', {
      currentPage,
      startIndex,
      endIndex,
      filteredCount: filtered.length,
      showingCount: result.length,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [getFilteredFolders, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((newPage) => {
    console.log('🔄 [PAGINATION DEBUG] handlePageChange called:', {
      currentPage,
      newPage,
      totalPages: getTotalPages(),
      timestamp: new Date().toISOString()
    });
    
    // CORRECCIÓN: Validación más permisiva para evitar problemas
    if (newPage >= 1 && newPage <= Math.max(getTotalPages(), 1)) {
      console.log('✅ [PAGINATION DEBUG] Setting new page:', newPage);
      setCurrentPage(newPage);
      
      // Log después del setState
      setTimeout(() => {
        console.log('📍 [PAGINATION DEBUG] Page state after setState:', {
          currentPage: newPage,
          timestamp: new Date().toISOString()
        });
      }, 0);
    } else {
      console.log('❌ [PAGINATION DEBUG] Invalid page:', newPage);
    }
  }, [currentPage, getTotalPages]);

  // Funciones de carga de datos (restauradas del original)
  const loadEmployeesOnly = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 [EMPLOYEES] Cargando empleados...');
      
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setEmployees(employeesData || []);
      console.log('✅ [EMPLOYEES] Empleados cargados:', employeesData?.length || 0);
      
      // Actualizar filtros únicos
      const departments = [...new Set(employeesData?.map(emp => emp.department).filter(Boolean) || [])];
      setUniqueDepartments(departments);
      
    } catch (error) {
      console.error('❌ [EMPLOYEES] Error:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Error al cargar empleados: ' + error.message,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-gray-200',
          closeButton: 'text-gray-400 hover:text-gray-600 transition-colors'
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      console.log('🔄 [FOLDERS] Cargando carpetas...');
      
      const foldersData = await unifiedEmployeeFolderService.getAllFolders();
      console.log('📦 [FOLDERS] Carpetas obtenidas del servicio:', foldersData?.length || 0);
      
      if (foldersData && foldersData.length > 0) {
        setFolders(foldersData);
        console.log('✅ [FOLDERS] Estado actualizado con', foldersData.length, 'carpetas');
      } else {
        console.log('⚠️ [FOLDERS] No se recibieron carpetas del servicio');
        setFolders([]);
      }
      
    } catch (error) {
      console.error('❌ [FOLDERS] Error:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Error al cargar carpetas: ' + error.message,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-gray-200',
          closeButton: 'text-gray-400 hover:text-gray-600 transition-colors'
        }
      });
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const createAllEmployeeFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      console.log('🔄 [CREATE] Iniciando creación de carpetas...');
      
      const result = await unifiedEmployeeFolderService.createFoldersForAllEmployees();
      console.log('✅ [CREATE] Resultado:', result);
      
      // Recargar carpetas después de crear
      await loadFolders();
      
      MySwal.fire({
        title: 'Éxito',
        text: 'Carpetas creadas exitosamente',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-gray-200',
          closeButton: 'text-gray-400 hover:text-gray-600 transition-colors'
        }
      });
      
    } catch (error) {
      console.error('❌ [CREATE] Error:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Error al crear carpetas: ' + error.message,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-gray-200',
          closeButton: 'text-gray-400 hover:text-gray-600 transition-colors'
        }
      });
    } finally {
      setLoadingFolders(false);
    }
  }, [loadFolders]);

  // Efectos
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 [INIT] Inicializando datos...');
      await loadEmployeesOnly();
      await loadFolders();
      console.log('✅ [INIT] Inicialización completada');
    };
    
    initializeData();
  }, [loadEmployeesOnly, loadFolders]);

  // Renderizado principal
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carpetas de Empleados</h1>
        <p className="text-gray-600">Gestiona las carpetas de empleados</p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, departamento o posición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los departamentos</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <select
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los niveles</option>
                <option value="Junior">Junior</option>
                <option value="Semi Senior">Semi Senior</option>
                <option value="Senior">Senior</option>
              </select>
              
              <select
                value={filters.workMode}
                onChange={(e) => setFilters({...filters, workMode: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los modos</option>
                <option value="Presencial">Presencial</option>
                <option value="Remoto">Remoto</option>
                <option value="Híbrido">Híbrido</option>
              </select>
              
              <select
                value={filters.contractType}
                onChange={(e) => setFilters({...filters, contractType: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los contratos</option>
                <option value="Indefinido">Indefinido</option>
                <option value="Plazo Fijo">Plazo Fijo</option>
                <option value="Honorarios">Honorarios</option>
              </select>
              
              <button
                onClick={() => setFilters({
                  companyId: '',
                  department: '',
                  level: '',
                  workMode: '',
                  contractType: ''
                })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      {getTotalPages() > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="pagination-controls">
            <div className="pagination-info text-sm text-gray-700">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredFolders().length)} a {Math.min(currentPage * itemsPerPage, getFilteredFolders().length)} de {getFilteredFolders().length} carpetas
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('🖱️ [PAGINATION DEBUG] "Anterior" button clicked!', {
                    currentPage,
                    targetPage: currentPage - 1,
                    timestamp: new Date().toISOString()
                  });
                  handlePageChange(currentPage - 1);
                }}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Anterior
              </button>
              
              {/* Números de página */}
              {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                let pageNum;
                if (getTotalPages() <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= getTotalPages() - 2) {
                  pageNum = getTotalPages() - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      console.log('🖱️ [PAGINATION DEBUG] Page number clicked:', pageNum);
                      handlePageChange(pageNum);
                    }}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => {
                  console.log('🖱️ [PAGINATION DEBUG] "Siguiente" button clicked!', {
                    currentPage,
                    targetPage: currentPage + 1,
                    timestamp: new Date().toISOString()
                  });
                  handlePageChange(currentPage + 1);
                }}
                disabled={currentPage === getTotalPages()}
                className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de carpetas */}
      <div className="space-y-4">
        {foldersToShow().map((folder, index) => (
          <div key={folder.id || index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl mr-4">
                  <FolderIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{folder.employeeName || 'Empleado sin nombre'}</h3>
                  <p className="text-gray-600">{folder.department || 'Sin departamento'} • {folder.position || 'Sin posición'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  folder.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {folder.status || 'unknown'}
                </span>
                <button
                  onClick={() => setSelectedFolder(folder)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estado vacío */}
      {getFilteredFolders().length === 0 && !loading && !loadingFolders && (
        <div className="empty-state">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron carpetas</h3>
          <p className="text-gray-500">
            {searchTerm || Object.values(filters).some(Boolean)
              ? 'No hay carpetas que coincidan con los filtros aplicados'
              : loading
                ? 'Cargando carpetas...'
                : employees.length === 0
                  ? 'No hay empleados disponibles para generar carpetas'
                  : 'No hay carpetas de empleados disponibles'}
          </p>
          {!searchTerm && !Object.values(filters).some(Boolean) && !loading && employees.length > 0 && (
            <div className="mt-6">
              <button
                onClick={createAllEmployeeFolders}
                disabled={loadingFolders}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingFolders ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creando carpetas...
                  </>
                ) : (
                  <>
                    <FolderIcon className="h-5 w-5 mr-3" />
                    Crear Carpetas para Todos los Empleados
                  </>
                )}
              </button>
            </div>
          )}
          {!loading && employees.length === 0 && (
            <div className="mt-6">
              <button
                onClick={loadEmployeesOnly}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Cargando empleados...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recargar Empleados
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalles de carpeta */}
      {selectedFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl mr-4">
                    <FolderIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedFolder.employeeName}</h2>
                    <p className="text-gray-600 text-lg">{selectedFolder.department} • {selectedFolder.position}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información de la carpeta */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Información de la Carpeta</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Estado:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedFolder.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedFolder.status || 'unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Creada:</span>
                          <span className="ml-2 text-gray-600">{new Date(selectedFolder.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Última actualización:</span>
                          <span className="ml-2 text-gray-600">{new Date(selectedFolder.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ID:</span>
                          <span className="ml-2 text-gray-600 font-mono text-xs">{selectedFolder.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Base de conocimiento */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Base de Conocimiento</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">FAQs</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">{selectedFolder.knowledgeBase?.faqs?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Documentos</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{selectedFolder.knowledgeBase?.documents?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Políticas</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{selectedFolder.knowledgeBase?.policies?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Procedimientos</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">{selectedFolder.knowledgeBase?.procedures?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cerrar Carpeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeFolders;