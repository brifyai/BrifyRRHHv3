import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.js'
import embeddingsService from '../../lib/embeddings.js'
import groqService from '../../services/groqService.js'
import organizedDatabaseService from '../../services/organizedDatabaseService.js'
import SubtleSpinner from '../common/SubtleSpinner.js'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentIcon,
  UserIcon,
  CpuChipIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const AIChat = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Estado para filtros avanzados
  const [showFilters, setShowFilters] = useState(false)
  const [companies, setCompanies] = useState([])
  const [filters, setFilters] = useState({
    company: '',
    file_type: '',
    date_from: '',
    date_to: '',
    user_email: '',
    file_name: '',
    min_file_size: '',
    max_file_size: '',
    keywords: '',
    min_relevance: '0.1'
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // eslint-disable-next-line no-use-before-define, react-hooks/exhaustive-deps
useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Cargar empresas al montar el componente
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companyData = await organizedDatabaseService.getCompanies()
        setCompanies(companyData)
      } catch (error) {
        console.error('Error loading companies:', error)
      }
    }

    loadCompanies()
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || loading) {
      return
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)
    setIsTyping(true)

    // Agregar mensaje del usuario
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Buscar contenido relevante usando embeddings con filtros aplicados
      const searchResults = await embeddingsService.searchSimilarContent(userMessage, user.id, 5, filters)
      
      // Preparar contexto de documentos
      const context = searchResults?.map(result => ({
        content: result.content,
        file_name: result.file_name,
        similarity: result.similarity
      })) || []

      // Preparar historial de chat (últimos 6 mensajes para contexto)
      const chatHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Generar respuesta con GROQ
      const groqResult = await groqService.generateChatResponse(
        userMessage,
        context,
        chatHistory,
        user.id // Pasar userId para tracking de tokens
      )

      // Agregar respuesta de la IA
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: groqResult.response,
        timestamp: new Date(),
        context: context.length > 0 ? context : null,
        searchResults: searchResults?.length || 0,
        tokensUsed: groqResult.tokensUsed
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      if (context.length > 0) {
        toast.success(`Respuesta generada usando ${context.length} documentos relevantes (${groqResult.tokensUsed} tokens)`)
      } else {
        toast.success(`Respuesta generada (${groqResult.tokensUsed} tokens utilizados)`)
      }
    } catch (error) {
      console.error('Error in AI chat:', error)
      toast.error('Error al generar respuesta: ' + error.message)
      
      // Agregar mensaje de error
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Chat limpiado')
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      company: '',
      file_type: '',
      date_from: '',
      date_to: '',
      user_email: '',
      file_name: '',
      min_file_size: '',
      max_file_size: '',
      keywords: '',
      min_relevance: '0.1'
    })
    toast.success('Filtros limpiados')
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chat IA</h1>
                <p className="text-gray-600">Conversa con tus documentos usando inteligencia artificial</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleFilters}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  showFilters
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filtros</span>
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Limpiar Chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros Avanzados</h3>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar todos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">Todas las empresas</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Archivo</label>
                <select
                  value={filters.file_type}
                  onChange={(e) => handleFilterChange('file_type', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">Todos los tipos</option>
                  <option value="application/pdf">PDF</option>
                  <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
                  <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel</option>
                  <option value="text/plain">Texto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  type="email"
                  value={filters.user_email}
                  onChange={(e) => handleFilterChange('user_email', e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Archivo</label>
                <input
                  type="text"
                  value={filters.file_name}
                  onChange={(e) => handleFilterChange('file_name', e.target.value)}
                  placeholder="Buscar en nombres..."
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Mín (KB)</label>
                <input
                  type="number"
                  value={filters.min_file_size}
                  onChange={(e) => handleFilterChange('min_file_size', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño Máx (KB)</label>
                <input
                  type="number"
                  value={filters.max_file_size}
                  onChange={(e) => handleFilterChange('max_file_size', e.target.value)}
                  placeholder="Sin límite"
                  min="0"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palabras Clave</label>
                <input
                  type="text"
                  value={filters.keywords}
                  onChange={(e) => handleFilterChange('keywords', e.target.value)}
                  placeholder="términos separados por coma"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relevancia Mín (%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.min_relevance}
                  onChange={(e) => handleFilterChange('min_relevance', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {(parseFloat(filters.min_relevance) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>💡 Los filtros se aplican automáticamente a las búsquedas de documentos para el contexto del chat.</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-blue-50 rounded-full mb-4">
                <SparklesIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Hola! Soy tu asistente IA
              </h3>
              <p className="text-gray-600 max-w-md">
                Puedes hacerme preguntas sobre tus documentos. Buscaré información relevante y te daré respuestas precisas.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Ejemplos de preguntas:</p>
                <ul className="mt-2 space-y-1">
                  <li>• "¿Qué dice el documento sobre...?"</li>
                  <li>• "Resume los puntos principales"</li>
                  <li>• "Busca información sobre..."</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <CpuChipIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {/* Context info for AI messages */}
                      {message.role === 'assistant' && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {message.context && message.context.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <DocumentIcon className="h-3 w-3" />
                              <span>Basado en {message.context.length} documento(s) relevante(s)</span>
                            </div>
                          )}
                          {message.tokensUsed && (
                            <div className="flex items-center space-x-1">
                              <CpuChipIcon className="h-3 w-3" />
                              <span>{message.tokensUsed} tokens utilizados</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-1 text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-600 rounded-full">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CpuChipIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu pregunta aquí..."
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <SubtleSpinner size="sm" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Cómo funciona el Chat IA?</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Busca automáticamente en tus documentos información relevante</li>
              <li>• Usa IA avanzada (GROQ GEMMA 2-9b-it) para generar respuestas precisas</li>
              <li>• Mantiene el contexto de la conversación para respuestas coherentes</li>
              <li>• Te indica qué documentos usó para generar cada respuesta</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChat