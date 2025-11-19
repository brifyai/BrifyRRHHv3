import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

/**
 * Componente atómico para controles de paginación
 * Extraído del componente EmployeeFolders monolítico
 */
const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemsInfo,
  className = ''
}) => {
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange?.(page);
  };

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pageNumbers = [];
    
    let startPage = Math.max(1, Math.min(currentPage - 2, totalPages - maxVisiblePages + 1));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar si estamos cerca del inicio
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Calcular información de items
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`pagination-controls ${className}`}>
      {/* Información de paginación */}
      {(itemsInfo || totalItems > 0) && (
        <div className="pagination-info text-sm text-gray-700 mb-4">
          {itemsInfo || (
            <>
              Mostrando {startItem} a {endItem} de {totalItems} resultados
              {totalPages > 1 && (
                <span className="ml-2">
                  (página {currentPage} de {totalPages})
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Botón Anterior */}
            <button
              onClick={handlePreviousPage}
              disabled={!hasPrevious}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                hasPrevious
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Anterior
            </button>

            {/* Números de página */}
            <div className="flex items-center space-x-1">
              {/* Primera página con elipsis si es necesario */}
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => handlePageClick(1)}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                </>
              )}

              {/* Páginas numeradas */}
              {pageNumbers.map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageClick(pageNumber)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label={`Página ${pageNumber}`}
                  aria-current={currentPage === pageNumber ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              ))}

              {/* Última página con elipsis si es necesario */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageClick(totalPages)}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={handleNextPage}
              disabled={!hasNext}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                hasNext
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Página siguiente"
            >
              Siguiente
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Selector de página (opcional) */}
          {totalPages > 5 && (
            <div className="flex items-center space-x-2">
              <label htmlFor="page-select" className="text-sm text-gray-700">
                Ir a la página:
              </label>
              <select
                id="page-select"
                value={currentPage}
                onChange={(e) => handlePageClick(Number(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Versión simplificada para navegación básica
 */
export  const hasNext = currentPage < totalPages;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={!hasPrevious}
          className={`flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
            !hasPrevious ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Anterior
        </button>

        <span className="px-3 py-1 text-sm text-gray-700">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={!hasNext}
          className={`flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
            !hasNext ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Siguiente
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;