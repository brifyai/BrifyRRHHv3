import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  TagIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import brevoCampaignService from '../../services/brevoCampaignService.js'
import brevoService from '../../services/brevoService.js'

const BrevoTemplatesManager = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'sms',
    subject: '',
    content: '',
    variables: []
  })
  const [previewMode, setPreviewMode] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [testData, setTestData] = useState({
    to: '',
    message: '',
    subject: ''
  })

  // Cargar plantillas
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Verificar si Brevo está configurado
      const config = brevoService.loadConfiguration()
      if (!config.apiKey) {
        setError('Brevo no está configurado. Por favor, configura tu API key en Integraciones.')
        return
      }
      
      const templatesData = await brevoCampaignService.getTemplates(selectedType === 'all' ? null : selectedType)
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error cargando plantillas:', error)
      setError(error.message || 'Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }, [selectedType])

  // Crear plantilla
  const createTemplate = async () => {
    try {
      // Validar datos
      if (!formData.name.trim()) {
        setError('El nombre de la plantilla es requerido')
        return
      }
      
      if (!formData.content.trim()) {
        setError('El contenido de la plantilla es requerido')
        return
      }
      
      if (formData.type === 'email' && !formData.subject.trim()) {
        setError('El asunto es requerido para plantillas de email')
        return
      }
      
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        variables: extractVariables(formData.content)
      }
      
      await brevoCampaignService.createTemplate(templateData)
      
      // Resetear formulario y cerrar modal
      setFormData({
        name: '',
        description: '',
        type: 'sms',
        subject: '',
        content: '',
        variables: []
      })
      setShowCreateModal(false)
      
      // Recargar plantillas
      await loadTemplates()
      
    } catch (error) {
      console.error('Error creando plantilla:', error)
      setError(error.message || 'Error al crear plantilla')
    }
  }

  // Editar plantilla
  const editTemplate = async () => {
    try {
      // Validar datos
      if (!formData.name.trim()) {
        setError('El nombre de la plantilla es requerido')
        return
      }
      
      if (!formData.content.trim()) {
        setError('El contenido de la plantilla es requerido')
        return
      }
      
      if (formData.type === 'email' && !formData.subject.trim()) {
        setError('El asunto es requerido para plantillas de email')
        return
      }
      
      // Actualizar plantilla (simulado - necesitaríamos implementar el método updateTemplate en el servicio)
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        variables: extractVariables(formData.content)
      }
      
      // Aquí iría la lógica para actualizar la plantilla en la base de datos
      console.log('Actualizando plantilla:', templateData)
      
      // Resetear formulario y cerrar modal
      setFormData({
        name: '',
        description: '',
        type: 'sms',
        subject: '',
        content: '',
        variables: []
      })
      setShowEditModal(false)
      setSelectedTemplate(null)
      
      // Recargar plantillas
      await loadTemplates()
      
    } catch (error) {
      console.error('Error editando plantilla:', error)
      setError(error.message || 'Error al editar plantilla')
    }
  }

  // Eliminar plantilla
  const deleteTemplate = async (templateId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      return
    }
    
    try {
      // Aquí iría la lógica para eliminar la plantilla en la base de datos
      console.log('Eliminando plantilla:', templateId)
      
      // Recargar plantillas
      await loadTemplates()
      
    } catch (error) {
      console.error('Error eliminando plantilla:', error)
      setError(error.message || 'Error al eliminar plantilla')
    }
  }

  // Duplicar plantilla
  const duplicateTemplate = async (template) => {
    try {
      const duplicatedData = {
        name: `${template.name} (Copia)`,
        description: template.description ? `${template.description} (Copia)` : '',
        type: template.template_type,
        subject: template.subject,
        content: template.content,
        variables: template.variables
      }
      
      await brevoCampaignService.createTemplate(duplicatedData)
      await loadTemplates()
      
    } catch (error) {
      console.error('Error duplicando plantilla:', error)
      setError(error.message || 'Error al duplicar plantilla')
    }
  }

  // Extraer variables del contenido
  const extractVariables = (content) => {
    const variableRegex = /{{(w+)}}/g
    const variables = []
    let match
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }
    
    return variables
  }

  // Previsualizar plantilla
  const previewTemplate = (template) => {
    setSelectedTemplate(template)
    setPreviewMode(true)
  }

  // Probar envío
  const testSend = async () => {
    try {
      if (!testData.to.trim()) {
        setError('El destinatario es requerido para la prueba')
        return
      }
      
      if (selectedTemplate.type === 'email' && !testData.subject.trim()) {
        setError('El asunto es requerido para la prueba de email')
        return
      }
      
      const testDataSend = {
        type: selectedTemplate.type,
        to: testData.to.trim(),
        subject: selectedTemplate.type === 'email' ? testData.subject.trim() : undefined,
        message: selectedTemplate.content
      }
      
      await brevoCampaignService.testSend(testDataSend)
      
      alert('Prueba enviada exitosamente')
      setTestMode(false)
      setTestData({ to: '', message: '', subject: '' })
      
    } catch (error) {
      console.error('Error en prueba de envío:', error)
      setError(error.message || 'Error en la prueba de envío')
    }
  }

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || template.template_type === selectedType
    
    return matchesSearch && matchesType
  })

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Obtener icono para tipo
  const getTypeIcon = (type) => {
    return type === 'email' ? 
      <EnvelopeIcon className="w-5 h-5" /> : 
      <ChatBubbleLeftRightIcon className="w-5 h-5" />
  }

  // Obtener color para tipo
  const getTypeColor = (type) => {
    return type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  // eslint-disable-next-line no-use-before-define, react-hooks/exhaustive-deps
useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestor de Plantillas
          </h1>
          <p className="text-gray-600">
            Crea y gestiona plantillas reutilizables para tus campañas de SMS y Email
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              {/* Búsqueda */}
              <div className="relative flex-1 min-w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Filtro por tipo */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                <option value="sms">Solo SMS</option>
                <option value="email">Solo Email</option>
              </select>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Nueva Plantilla
              </button>
              <button
                onClick={loadTemplates}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de plantillas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadTemplates}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay plantillas</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'No se encontraron plantillas con los filtros aplicados' 
                : 'Aún no has creado ninguna plantilla'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Primera Plantilla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(template.template_type)}`}>
                      {getTypeIcon(template.template_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">
                        {template.template_type === 'email' ? 'Email' : 'SMS'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => previewTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Previsualizar"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setFormData({
                          name: template.name,
                          description: template.description || '',
                          type: template.template_type,
                          subject: template.subject || '',
                          content: template.content,
                          variables: template.variables || []
                        })
                        setShowEditModal(true)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Duplicar"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">Vista previa:</div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {template.template_type === 'email' && template.subject && (
                      <div className="font-medium mb-2">Asunto: {template.subject}</div>
                    )}
                    <div>{template.content.substring(0, 200)}{template.content.length > 200 ? '...' : ''}</div>
                  </div>
                </div>
                
                {template.variables && template.variables.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TagIcon className="w-4 h-4" />
                    <span>{template.variables.length} variables</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="w-3 h-3" />
                    <span>{template.usage_count || 0} usos</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Plantilla */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Nueva Plantilla</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Bienvenida a nuevos empleados"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Descripción opcional de la plantilla"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  
                  {formData.type === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asunto *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Asunto del email"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="6"
                      placeholder={`Escribe tu mensaje aquí. Usa variables como {{nombre}} para personalizar.${formData.type === 'sms' ? '\n\nEj: Hola {{nombre}}, tu turno es el {{fecha}}.' : '\n\nEj: Estimado/a {{nombre}},\n\nTe confirmamos que tu reunión está programada para el {{fecha}}.'}`}
                    />
                  </div>
                  
                  {extractVariables(formData.content).length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        <SparklesIcon className="w-4 h-4 inline mr-1" />
                        Variables detectadas:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extractVariables(formData.content).map((variable, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear Plantilla
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Plantilla */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Editar Plantilla</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                    />
                  </div>
                  
                  {formData.type === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asunto *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Previsualizar */}
      <AnimatePresence>
        {previewMode && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setPreviewMode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Previsualizar Plantilla
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTestMode(true)
                        setPreviewMode(false)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      Probar Envío
                    </button>
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedTemplate.name}</h3>
                    {selectedTemplate.description && (
                      <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
                    )}
                  </div>
                  
                  {selectedTemplate.template_type === 'email' && selectedTemplate.subject && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">Asunto:</div>
                      <div>{selectedTemplate.subject}</div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Contenido:</div>
                    <div className="whitespace-pre-wrap">{selectedTemplate.content}</div>
                  </div>
                  
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Variables disponibles:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {`{{${variable}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Probar Envío */}
      <AnimatePresence>
        {testMode && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setTestMode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Probar Envío
                  </h2>
                  <button
                    onClick={() => setTestMode(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinatario *
                    </label>
                    <input
                      type={selectedTemplate.template_type === 'email' ? 'email' : 'tel'}
                      value={testData.to}
                      onChange={(e) => setTestData({ ...testData, to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={selectedTemplate.template_type === 'email' ? 'email@ejemplo.com' : '+56912345678'}
                    />
                  </div>
                  
                  {selectedTemplate.template_type === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asunto
                      </label>
                      <input
                        type="text"
                        value={testData.subject}
                        onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Asunto de prueba"
                      />
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-700 mb-2">Mensaje:</div>
                    <div className="text-sm text-gray-900">{selectedTemplate.content}</div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setTestMode(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={testSend}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Enviar Prueba
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BrevoTemplatesManager