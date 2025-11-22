import React, { useState, useCallback } from 'react';
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

// Iconos temporales para diagnosticar el problema
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
  const [folders, setFolders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Función de paginación simple para testing
  const getTotalPages = useCallback(() => {
    const totalItems = folders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('📊 [PAGINATION DEBUG] getTotalPages:', {
      totalItems,
      itemsPerPage,
      totalPages,
      timestamp: new Date().toISOString()
    });
    return totalPages;
  }, [folders.length, itemsPerPage]);

  const getFilteredFolders = useCallback(() => {
    let filtered = [...folders];
    
    console.log('🔍 [PAGINATION DEBUG] getFilteredFolders:', {
      totalFolders: folders.length,
      filteredCount: filtered.length,
      timestamp: new Date().toISOString()
    });
    
    return filtered;
  }, [folders]);

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
    
    // Permitir páginas desde 0 para testing (temporal)
    if (newPage >= 0 && newPage <= Math.max(getTotalPages(), 1)) {
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

  // Test básico del componente
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carpetas de Empleados</h1>
        <p className="text-gray-600">Gestiona las carpetas de empleados</p>
      </div>

      {/* Test de iconos */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🧪 Test de Iconos:</h2>
        <div className="flex space-x-4">
          <FolderIcon className="h-8 w-8 text-blue-600" />
          <UserIcon className="h-8 w-8 text-green-600" />
          <DocumentIcon className="h-8 w-8 text-purple-600" />
          <ChevronLeftIcon className="h-8 w-8 text-red-600" />
          <ChevronRightIcon className="h-8 w-8 text-orange-600" />
        </div>
      </div>

      {/* Test de paginación */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🧪 Test de Paginación:</h2>
        <p>Total páginas: {getTotalPages()}</p>
        <p>Página actual: {currentPage}</p>
        <p>Carpetas totales: {folders.length}</p>
        <p>Carpetas filtradas: {getFilteredFolders().length}</p>
        <p>Carpetas a mostrar: {foldersToShow().length}</p>
        
        <div className="mt-4">
          <button
            onClick={() => {
              console.log('🖱️ [PAGINATION DEBUG] "Anterior" button clicked!', {
                currentPage,
                targetPage: currentPage - 1,
                timestamp: new Date().toISOString()
              });
              handlePageChange(currentPage - 1);
            }}
            disabled={false} // Deshabilitado temporalmente para testing
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-4 w-4 inline mr-1" />
            Anterior
          </button>
          
          <button
            onClick={() => {
              console.log('🖱️ [PAGINATION DEBUG] "Siguiente" button clicked!', {
                currentPage,
                targetPage: currentPage + 1,
                timestamp: new Date().toISOString()
              });
              handlePageChange(currentPage + 1);
            }}
            disabled={false} // Deshabilitado temporalmente para testing
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 ml-2"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 inline ml-1" />
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      )}

      {/* Lista de carpetas */}
      {!loading && foldersToShow().length > 0 && (
        <div className="space-y-4">
          {foldersToShow().map((folder, index) => (
            <div key={folder.id || index} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <FolderIcon className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold">{folder.employeeName || 'Empleado sin nombre'}</h3>
                  <p className="text-sm text-gray-600">{folder.department || 'Sin departamento'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && foldersToShow().length === 0 && (
        <div className="text-center py-8">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay carpetas para mostrar</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeFolders;