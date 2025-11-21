import React, { useState, useEffect } from 'react';
import { 
  FolderIcon, 
  DocumentIcon, 
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import unifiedEmployeeFolderService from '../../services/unifiedEmployeeFolderService.js';
import enhancedEmployeeFolderService from '../../services/enhancedEmployeeFolderService.js';
import toast from 'react-hot-toast';

const EmployeeFolderManager = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, withDrive: 0 });
  const [creatingFolders, setCreatingFolders] = useState(false);

  // Cargar carpetas al montar el componente
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las carpetas
      const { data, error } = await unifiedEmployeeFolderService.supabase
        .from('employee_folders')
        .select('*')
        .order('employee_name', { ascending: true });

      if (error) throw error;

      setFolders(data || []);
      
      // Calcular estadísticas
      const total = data?.length || 0;
      const active = data?.filter(f => f.folder_status === 'active').length || 0;
      const withDrive = data?.filter(f => f.drive_folder_id).length || 0;
      
      setStats({ total, active, withDrive });
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      toast.error('Error al cargar las carpetas de empleados');
    } finally {
      setLoading(false);
    }
  };

  // Crear carpetas para todos los empleados
  const createAllFolders = async () => {
    try {
      setCreatingFolders(true);
      toast.loading('Creando carpetas para todos los empleados...');
      
      const result = await enhancedEmployeeFolderService.createFoldersForAllEmployees();
      
      toast.dismiss();
      
      if (result.createdCount > 0) {
        toast.success(`${result.createdCount} carpetas creadas exitosamente`);
      }
      
      if (result.updatedCount > 0) {
        toast.success(`${result.updatedCount} carpetas actualizadas`);
      }
      
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} carpetas con errores`);
      }
      
      // Recargar carpetas
      await loadFolders();
    } catch (error) {
      toast.dismiss();
      console.error('Error creando carpetas:', error);
      toast.error('Error al crear las carpetas');
    } finally {
      setCreatingFolders(false);
    }
  };

  // Obtener estadísticas de una carpeta
  const getFolderStats = async (employeeEmail) => {
    try {
      const stats = await enhancedEmployeeFolderService.getEmployeeFolderStats(employeeEmail);
      setSelectedFolder(stats);
      setShowDetails(true);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      toast.error('Error al obtener estadísticas de la carpeta');
    }
  };

  // Sincronizar carpeta con Google Drive
  const syncFolderWithDrive = async (employeeEmail) => {
    try {
      toast.loading('Sincronizando con Google Drive...');
      
      await enhancedEmployeeFolderService.syncFolderWithDrive(employeeEmail);
      
      toast.dismiss();
      toast.success('Carpeta sincronizada con Google Drive');
      
      // Recargar carpetas
      await loadFolders();
    } catch (error) {
      toast.dismiss();
      console.error('Error sincronizando carpeta:', error);
      toast.error('Error al sincronizar con Google Drive');
    }
  };

  // Filtrar carpetas por término de búsqueda
  const filteredFolders = folders.filter(folder => 
    folder.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.employee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.employee_position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Carpetas de Empleados
        </h1>
        <p className="text-gray-600">
          Administra las carpetas personales de cada empleado con vinculación a Supabase y Google Drive
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Carpetas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Carpetas Activas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CloudArrowUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Con Google Drive</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.withDrive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar por nombre, email, empresa o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
              onClick={createAllFolders}
              disabled={creatingFolders}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingFolders ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Todas las Carpetas
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Carpetas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredFolders.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              {searchTerm ? 'No se encontraron carpetas que coincidan con la búsqueda' : 'No hay carpetas registradas'}
            </li>
          ) : (
            filteredFolders.map((folder) => (
              <li key={folder.id} className="hover:bg-gray-50">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <FolderIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {folder.employee_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {folder.employee_email} • {folder.company_name}
                          </p>
                          <div className="flex items-center mt-1 space-x-4">
                            <span className="text-xs text-gray-500">
                              {folder.employee_position}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(folder.folder_status)}`}>
                              {folder.folder_status}
                            </span>
                            {folder.drive_folder_id && (
                              <span className="inline-flex items-center text-xs text-green-600">
                                <CloudArrowUpIcon className="h-3 w-3 mr-1" />
                                Google Drive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => getFolderStats(folder.employee_email)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {folder.drive_folder_id && (
                        <a
                          href={folder.drive_folder_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                          title="Abrir en Google Drive"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </a>
                      )}
                      
                      <button
                        onClick={() => syncFolderWithDrive(folder.employee_email)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Sincronizar con Google Drive"
                      >
                        <CloudArrowUpIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Creada: {formatDate(folder.created_at)} • 
                    Actualizada: {formatDate(folder.updated_at)}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modal de Detalles */}
      {showDetails && selectedFolder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles de Carpeta
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Empleado</p>
                  <p className="text-sm text-gray-900">{selectedFolder.folder?.employee_name}</p>
                  <p className="text-xs text-gray-500">{selectedFolder.folder?.employee_email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Empresa</p>
                  <p className="text-sm text-gray-900">{selectedFolder.folder?.company_name}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-blue-600">
                      {selectedFolder.stats?.documents || 0}
                    </p>
                    <p className="text-xs text-gray-500">Documentos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">
                      {selectedFolder.stats?.faqs || 0}
                    </p>
                    <p className="text-xs text-gray-500">FAQs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-purple-600">
                      {selectedFolder.stats?.conversations || 0}
                    </p>
                    <p className="text-xs text-gray-500">Conversaciones</p>
                  </div>
                </div>
                
                {selectedFolder.folder?.drive_folder_url && (
                  <div>
                    <a
                      href={selectedFolder.folder.drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Abrir en Google Drive
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeFolderManager;