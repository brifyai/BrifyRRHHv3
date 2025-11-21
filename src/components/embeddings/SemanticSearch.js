import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import embeddingsService from '../../lib/embeddings.js';
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import SubtleSpinner from '../common/SubtleSpinner.js';
import AIChat from './AIChat.js';
import {
  MagnifyingGlassIcon,
  DocumentIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const SemanticSearch = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search'); // 'search' o 'chat'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [expandedResults, setExpandedResults] = useState(new Set());

  const loadCompanies = useCallback(async () => {
    try {
      const companyData = await organizedDatabaseService.getCompanies();
      setCompanies(companyData);
      // Seleccionar la primera empresa por defecto
      if (companyData.length > 0 && !selectedCompany) {
        setSelectedCompany(companyData[0].name);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }, [selectedCompany]);

  // Cargar empresas al montar el componente
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const toggleExpansion = (resultId) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error('Por favor ingresa una consulta de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const searchResults = await embeddingsService.searchSimilarContent(query, user.id, 10, { company: selectedCompany });
      setResults(searchResults || []);

      if (searchResults && searchResults.length > 0) {
        toast.success(`Se encontraron ${searchResults.length} resultados`);
      } else {
        toast.info('No se encontraron resultados para tu búsqueda');
      }
    } catch (error) {
      console.error('Error in semantic search:', error);
      toast.error('Error al realizar la búsqueda semántica');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const words = query.toLowerCase().split(' ');
    let highlightedText = text;
    
    words.forEach(word => {
      if (word.length > 2) {
        const regex = new RegExp(`(${word})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
      }
    });
    
    return highlightedText;
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Pestañas */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Búsqueda Semántica
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Chat IA
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        {activeTab === 'search' ? (
          <div>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Búsqueda Semántica</h2>
              </div>
              <p className="text-gray-600">
                Busca contenido en tus archivos usando inteligencia artificial. 
                Encuentra información relevante incluso si no coinciden las palabras exactas.
              </p>
            </div>

            {/* Search Form */}
            <div className="p-6">
           <form onSubmit={handleSearch} className="space-y-4">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
               </div>
               <input
                 type="text"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Describe lo que estás buscando... (ej: 'Reglamento interno')"
                 className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                 disabled={loading}
               />
             </div>

             {/* Company Filter */}
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
               </div>
               <select
                 value={selectedCompany}
                 onChange={(e) => setSelectedCompany(e.target.value)}
                 className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                 disabled={loading}
               >
                 {companies
                   .sort((a, b) => a.name.localeCompare(b.name))
                   .map((company) => (
                     <option key={company.id} value={company.name}>
                       {company.name}
                     </option>
                   ))}
               </select>
             </div>
            
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <SubtleSpinner size="sm" />
                  <span className="ml-2">Buscando...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Buscar con IA
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="border-t border-gray-200">
            {loading ? (
              <div className="p-6 flex justify-center">
                <SubtleSpinner size="md" text="Analizando contenido..." />
              </div>
            ) : results.length > 0 ? (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Resultados encontrados ({results.length})
                </h3>
                
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={result.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white cursor-pointer" onClick={() => toggleExpansion(result.id || index)}>
                      <div className="flex items-start space-x-3">
                        <DocumentIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {result.metadata?.name || result.metadata?.file_name || `Documento ${result.id}`}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {result.metadata?.file_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    if (result.metadata.file_id) {
                                      window.open(`https://drive.google.com/file/d/${result.metadata.file_id}/view`, '_blank');
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Ver documento original"
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                </button>
                              )}
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Relevancia: {(result.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-700 mb-2">
                            <div
                              className="leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(expandedResults.has(result.id || index) ? (result.content || 'Contenido no disponible') : truncateText(result.content || 'Contenido no disponible'), query)
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="bg-gray-50 px-2 py-1 rounded">ID: {result.id}</span>
                              {result.created_at && (
                                <span className="flex items-center">
                                  📅 {new Date(result.created_at).toLocaleDateString('es-ES')}
                                </span>
                              )}
                              {result.metadata?.correo && (
                                <span className="flex items-center">
                                  👤 {result.metadata.correo}
                                </span>
                              )}
                            </div>
                            {result.metadata?.file_type && (
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                {result.metadata.file_type.split('/').pop().toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-600 mb-4">
                  No se encontró contenido relacionado con tu búsqueda.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Intenta con términos más generales</p>
                  <p>• Verifica que tengas archivos procesados</p>
                  <p>• Asegúrate de que los archivos contengan texto</p>
                </div>
              </div>
            )}
          </div>
        )}

            {/* Info */}
            {!hasSearched && (
              <div className="p-6 bg-blue-50 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">¿Cómo funciona la búsqueda semántica?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Utiliza IA para entender el significado de tu consulta</li>
                      <li>• Encuentra contenido relevante aunque no coincidan las palabras exactas</li>
                      <li>• Busca en todos tus archivos procesados automáticamente</li>
                      <li>• Ordena los resultados por relevancia semántica</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <AIChat />
        )}
      </div>
    </div>
  );
};

export default SemanticSearch;