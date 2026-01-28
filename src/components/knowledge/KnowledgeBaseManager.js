import React, { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  FolderIcon,
  SearchIcon,
  UploadIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Gestor de Base de Conocimiento para WhatsApp Business
 * 
 * Este componente permite:
 * - Crear y gestionar FAQs
 * - Subir documentos de conocimiento
 * - Organizar información por categorías
 * - Integrar con WhatsApp de forma cumplida
 * - Buscar y consultar conocimiento
 */

const KnowledgeBaseManager = ({ companyId }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Estados para FAQs
  const [faqs, setFaqs] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showFaqForm, setShowFaqForm] = useState(false);
  
  // Estados para documentos
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Estados para categorías
  const [categories, setCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Estadísticas
  const [stats, setStats] = useState({
    totalFaqs: 0,
    totalDocuments: 0,
    totalCategories: 0,
    lastUpdated: null
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (companyId) {
      loadKnowledgeBaseData();
    }
  }, [companyId]);

  const loadKnowledgeBaseData = async () => {
    try {
      setLoading(true);
      
      const [
        faqsData,
        documentsData,
        categoriesData,
        statsData
      ] = await Promise.all([
        loadFAQs(),
        loadDocuments(),
        loadCategories(),
        loadStats()
      ]);

      setFaqs(faqsData);
      setDocuments(documentsData);
      setCategories(categoriesData);
      setStats(statsData);

    } catch (error) {
      console.error('Error cargando base de conocimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_entries')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error cargando FAQs:', error);
      return [];
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error cargando documentos:', error);
      return [];
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error cargando categorías:', error);
      return [];
    }
  };

  const loadStats = async () => {
    try {
      const [faqsCount, documentsCount, categoriesCount] = await Promise.all([
        supabase.from('faq_entries').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('knowledge_documents').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('knowledge_categories').select('id', { count: 'exact' }).eq('company_id', companyId)
      ]);

      const lastUpdated = new Date().toISOString();

      return {
        totalFaqs: faqsCount.count || 0,
        totalDocuments: documentsCount.count || 0,
        totalCategories: categoriesCount.count || 0,
        lastUpdated
      };
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      return {
        totalFaqs: 0,
        totalDocuments: 0,
        totalCategories: 0,
        lastUpdated: null
      };
    }
  };

  const handleSaveFAQ = async (faqData) => {
    try {
      const faqToSave = {
        ...faqData,
        company_id: companyId,
        status: 'active',
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingFaq) {
        // Actualizar FAQ existente
        const { data, error } = await supabase
          .from('faq_entries')
          .update(faqToSave)
          .eq('id', editingFaq.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Crear nueva FAQ
        const { data, error } = await supabase
          .from('faq_entries')
          .insert({ ...faqToSave, created_at: new Date().toISOString() })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Recargar datos
      await loadKnowledgeBaseData();
      
      // Resetear formulario
      setEditingFaq(null);
      setShowFaqForm(false);

      return { success: true, data: result };

    } catch (error) {
      console.error('Error guardando FAQ:', error);
      return { success: false, error: error.message };
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta FAQ? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('faq_entries')
        .delete()
        .eq('id', faqId);

      if (error) throw error;

      // Recargar datos
      await loadKnowledgeBaseData();

    } catch (error) {
      console.error('Error eliminando FAQ:', error);
    }
  };

  const handleDocumentUpload = async (file, categoryId, description) => {
    try {
      setUploading(true);

      // 1. Subir archivo a storage
      const fileName = `${companyId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('knowledge-documents')
        .getPublicUrl(fileName);

      // 3. Guardar metadata en base de datos
      const { data: docData, error: dbError } = await supabase
        .from('knowledge_documents')
        .insert({
          company_id: companyId,
          title: file.name,
          description: description || '',
          file_name: file.name,
          file_path: fileName,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          category_id: categoryId,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Recargar datos
      await loadKnowledgeBaseData();

      return { success: true, data: docData };

    } catch (error) {
      console.error('Error subiendo documento:', error);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este documento? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      // Obtener información del documento
      const { data: doc, error: fetchError } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (fetchError) throw fetchError;

      // Eliminar archivo del storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Eliminar registro de la base de datos
      const { error: dbError } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      // Recargar datos
      await loadKnowledgeBaseData();

    } catch (error) {
      console.error('Error eliminando documento:', error);
    }
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      const categoryToSave = {
        ...categoryData,
        company_id: companyId,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingCategory) {
        // Actualizar categoría existente
        const { data, error } = await supabase
          .from('knowledge_categories')
          .update(categoryToSave)
          .eq('id', editingCategory.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Crear nueva categoría
        const { data, error } = await supabase
          .from('knowledge_categories')
          .insert({ ...categoryToSave, created_at: new Date().toISOString() })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Recargar datos
      await loadKnowledgeBaseData();
      
      // Resetear formulario
      setEditingCategory(null);
      setShowCategoryForm(false);

      return { success: true, data: result };

    } catch (error) {
      console.error('Error guardando categoría:', error);
      return { success: false, error: error.message };
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta categoría? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      // Recargar datos
      await loadKnowledgeBaseData();

    } catch (error) {
      console.error('Error eliminando categoría:', error);
    }
  };

  // Filtrar FAQs según búsqueda y categoría
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = !searchTerm || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.keywords?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Filtrar documentos según búsqueda y categoría
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || doc.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
              <p className="text-gray-600">Gestiona FAQs y documentos para WhatsApp Business</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{stats.totalFaqs}</span> FAQs • 
              <span className="font-medium ml-1">{stats.totalDocuments}</span> Docs
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total FAQs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalFaqs}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documentos</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalDocuments}</p>
            </div>
            <FolderIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalCategories}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <p className="text-lg font-bold text-green-600">Activo</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar FAQs y documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Categoría:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'faq', name: 'FAQs', icon: DocumentTextIcon },
              { id: 'documents', name: 'Documentos', icon: FolderIcon },
              { id: 'categories', name: 'Categorías', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Preguntas Frecuentes</h3>
                <button
                  onClick={() => setShowFaqForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Nueva FAQ</span>
                </button>
              </div>

              {showFaqForm && (
                <FAQForm
                  faq={editingFaq}
                  categories={categories}
                  onSave={handleSaveFAQ}
                  onCancel={() => {
                    setShowFaqForm(false);
                    setEditingFaq(null);
                  }}
                />
              )}

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'No hay FAQs que coincidan con los filtros' 
                    : 'No hay FAQs registradas'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{faq.question}</h4>
                          <p className="mt-2 text-gray-600">{faq.answer}</p>
                          {faq.keywords && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {faq.keywords.split(',').map((keyword, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {keyword.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Categoría: {categories.find(c => c.id === faq.category_id)?.name || 'Sin categoría'}</span>
                            <span>Prioridad: {faq.priority}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingFaq(faq);
                              setShowFaqForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
                <DocumentUpload
                  onUpload={handleDocumentUpload}
                  categories={categories}
                  uploading={uploading}
                />
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'No hay documentos que coincidan con los filtros' 
                    : 'No hay documentos registrados'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                          {doc.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            <div>Tamaño: {(doc.file_size / 1024).toFixed(1)} KB</div>
                            <div>Tipo: {doc.file_type}</div>
                            <div>Categoría: {categories.find(c => c.id === doc.category_id)?.name || 'Sin categoría'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Ver documento"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar documento"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Categorías</h3>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Nueva Categoría</span>
                </button>
              </div>

              {showCategoryForm && (
                <CategoryForm
                  category={editingCategory}
                  onSave={handleSaveCategory}
                  onCancel={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                />
              )}

              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay categorías registradas
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          {category.description && (
                            <p className="mt-1 text-sm text-gray-600">{category.description}</p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            <div>Color: {category.color}</div>
                            <div>FAQs: {faqs.filter(f => f.category_id === category.id).length}</div>
                            <div>Documentos: {documents.filter(d => d.category_id === category.id).length}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryForm(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para formulario de FAQ
const FAQForm = ({ faq, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    keywords: faq?.keywords || '',
    category_id: faq?.category_id || '',
    priority: faq?.priority || 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        {faq ? 'Editar FAQ' : 'Nueva FAQ'}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pregunta
          </label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Respuesta
          </label>
          <textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Palabras clave (separadas por comas)
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="palabra1, palabra2, palabra3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Alta</option>
              <option value={2}>Media</option>
              <option value={3}>Baja</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {faq ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Componente para subir documentos
const DocumentUpload = ({ onUpload, categories, uploading }) => {
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && categoryId) {
      onUpload(file, categoryId, description);
      // Resetear formulario
      setFile(null);
      setCategoryId('');
      setDescription('');
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="hidden"
        id="document-upload"
        accept=".pdf,.doc,.docx,.txt,.md"
      />
      <label
        htmlFor="document-upload"
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
      >
        <UploadIcon className="h-5 w-5" />
        <span>Subir Documento</span>
      </label>

      {file && (
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Categoría</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </button>

          <button
            type="button"
            onClick={() => setFile(null)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
};

// Componente para formulario de categorías
const CategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#3B82F6'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        {category ? 'Editar Categoría' : 'Nueva Categoría'}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {category ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KnowledgeBaseManager;