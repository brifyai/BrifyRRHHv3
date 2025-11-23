/**
 * WhatsAppAIWithEmployeeKnowledge - Servicio de IA para WhatsApp con Conocimiento del Empleado
 * 
 * Este servicio implementa:
 * - Recepción de mensajes de WhatsApp vía n8n
 * - Identificación del empleado por número de WhatsApp
 * - Búsqueda en la base de conocimiento específica del empleado
 * - Generación de respuestas contextualizadas con IA
 * - Registro de conversaciones y métricas
 * - Envío de respuestas de vuelta vía n8n
 */

import { supabase } from '../lib/supabase.js';
import employeeKnowledgeService from './employeeKnowledgeService.js';
import groqService from './groqService.js';

class WhatsAppAIWithEmployeeKnowledge {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.defaultLanguage = 'es';
    this.fallbackResponse = 'Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?';
  }

  /**
   * Procesar webhook de n8n para mensajes de WhatsApp
   * @param {Object} webhookData - Datos del webhook de n8n
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processWebhook(webhookData) {
    const startTime = Date.now();
    
    try {
      console.log('📱 WhatsAppAIWithEmployeeKnowledge: Procesando webhook de n8n');
      
      const { message, from, company_id, message_id, timestamp } = webhookData;
      
      if (!message || !from) {
        throw new Error('Datos incompletos en el webhook');
      }

      // 1. Identificar empleado por número de WhatsApp
      const employee = await this.identifyEmployeeByWhatsApp(from, company_id);
      
      if (!employee) {
        console.log(`⚠️ Empleado no encontrado para número ${from}`);
        return {
          success: false,
          error: 'Empleado no encontrado',
          response: 'Número no registrado. Contacta a tu administrador.'
        };
      }

      // 2. Verificar si el empleado tiene base de conocimiento activa
      const knowledgeBase = await employeeKnowledgeService.getEmployeeKnowledgeBase(employee.email);
      
      if (!knowledgeBase) {
        console.log(`⚠️ Base de conocimiento no encontrada para ${employee.email}`);
        return await this.handleEmployeeWithoutKnowledge(employee, message, company_id);
      }

      // 3. Generar respuesta con conocimiento del empleado
      const aiResponse = await this.generateResponseWithEmployeeKnowledge(
        message,
        employee.email,
        company_id,
        knowledgeBase
      );

      // 4. Registrar conversación
      const processingTime = Date.now() - startTime;
      await this.recordConversation({
        employee_email: employee.email,
        company_id,
        whatsapp_number: from,
        user_message: message,
        ai_response: aiResponse.text,
        knowledge_sources: aiResponse.sources,
        confidence_score: aiResponse.confidence,
        processing_time_ms: processingTime
      });

      // 5. Actualizar métricas
      await this.updateEmployeeMetrics(employee.email, company_id, aiResponse, processingTime);

      const result = {
        success: true,
        response: aiResponse.text,
        confidence: aiResponse.confidence,
        sources_used: aiResponse.sources?.length || 0,
        processing_time_ms: processingTime,
        employee: {
          email: employee.email,
          name: employee.name
        }
      };

      console.log('✅ WhatsAppAIWithEmployeeKnowledge: Respuesta generada exitosamente');
      return result;

    } catch (error) {
      console.error('❌ Error procesando webhook de WhatsApp:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Registrar error en conversación
      await this.recordConversation({
        employee_email: webhookData.employee_email || 'unknown',
        company_id: webhookData.company_id,
        whatsapp_number: webhookData.from,
        user_message: webhookData.message,
        ai_response: this.fallbackResponse,
        knowledge_sources: [],
        confidence_score: 0,
        processing_time_ms: processingTime
      });

      return {
        success: false,
        error: error.message,
        response: this.fallbackResponse,
        processing_time_ms: processingTime
      };
    }
  }

  /**
   * Identificar empleado por número de WhatsApp
   * @param {string} whatsappNumber - Número de WhatsApp
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Empleado encontrado
   */
  async identifyEmployeeByWhatsApp(whatsappNumber, companyId) {
    try {
      // Normalizar número de WhatsApp
      const normalizedNumber = this.normalizeWhatsAppNumber(whatsappNumber);
      
      const { data, error } = await supabase
        .from('employee_whatsapp_config')
        .select(`
          *,
          employee_knowledge_bases!inner(
            id,
            employee_email,
            employee_name,
            knowledge_status
          )
        `)
        .eq('whatsapp_number', normalizedNumber)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        email: data.employee_knowledge_bases.employee_email,
        name: data.employee_knowledge_bases.employee_name,
        whatsapp_config: data,
        knowledge_base_id: data.employee_knowledge_bases.id
      };

    } catch (error) {
      console.error('Error identificando empleado por WhatsApp:', error);
      return null;
    }
  }

  /**
   * Generar respuesta usando conocimiento del empleado
   * @param {string} userMessage - Mensaje del usuario
   * @param {string} employeeEmail - Email del empleado
   * @param {string} companyId - ID de la empresa
   * @param {Object} knowledgeBase - Base de conocimiento del empleado
   * @returns {Promise<Object>} Respuesta generada
   */
  async generateResponseWithEmployeeKnowledge(userMessage, employeeEmail, companyId, knowledgeBase) {
    try {
      console.log(`🤖 Generando respuesta con conocimiento para ${employeeEmail}`);

      // 1. Buscar documentos relevantes en la base de conocimiento del empleado
      const relevantDocs = await employeeKnowledgeService.searchEmployeeKnowledge(
        employeeEmail,
        userMessage,
        {
          limit: 5,
          threshold: 0.6,
          includeMetadata: true
        }
      );

      // 2. Si no hay documentos relevantes, usar respuesta genérica
      if (!relevantDocs || relevantDocs.length === 0) {
        return await this.generateGenericResponse(userMessage, employeeEmail);
      }

      // 3. Construir contexto con los documentos encontrados
      const context = this.buildContextFromDocuments(relevantDocs);
      
      // 4. Generar prompt contextualizado
      const prompt = this.buildContextualPrompt(userMessage, context, employeeEmail, knowledgeBase);
      
      // 5. Generar respuesta con IA
      const aiResponse = await groqService.generateResponse(prompt, {
        model: 'llama3-8b-8192',
        temperature: 0.7,
        maxTokens: 500
      });

      // 6. Calcular confianza basada en la relevancia de los documentos
      const confidence = this.calculateResponseConfidence(relevantDocs, aiResponse);

      return {
        text: aiResponse,
        confidence: confidence,
        sources: relevantDocs.map(doc => ({
          title: doc.title,
          similarity: doc.similarity,
          chunk_index: doc.chunk_index
        }))
      };

    } catch (error) {
      console.error('Error generando respuesta con conocimiento:', error);
      return await this.generateGenericResponse(userMessage, employeeEmail);
    }
  }

  /**
   * Construir contexto a partir de documentos relevantes
   * @param {Array} documents - Documentos relevantes
   * @returns {string} Contexto formateado
   */
  buildContextFromDocuments(documents) {
    const contextParts = documents.map((doc, index) => {
      return `Documento ${index + 1}: ${doc.title}
Contenido relevante: ${doc.chunk_content}
Relevancia: ${(doc.similarity * 100).toFixed(1)}%`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Construir prompt contextualizado para la IA
   * @param {string} userMessage - Mensaje del usuario
   * @param {string} context - Contexto de documentos
   * @param {string} employeeEmail - Email del empleado
   * @param {Object} knowledgeBase - Base de conocimiento
   * @returns {string} Prompt para la IA
   */
  buildContextualPrompt(userMessage, context, employeeEmail, knowledgeBase) {
    return `Eres un asistente de IA especializado que conoce perfectamente el contexto y documentos específicos de ${employeeEmail}.

INFORMACIÓN DEL EMPLEADO:
- Nombre: ${knowledgeBase.employee_name}
- Email: ${employeeEmail}
- Empresa: ${knowledgeBase.company_id}

CONTEXTO ESPECÍFICO DEL EMPLEADO:
${context}

INSTRUCCIONES:
1. Usa ÚNICAMENTE la información proporcionada en el contexto específico del empleado
2. Si la información del contexto no es suficiente para responder, dilo claramente
3. Sé preciso y específico basándote en los documentos del empleado
4. Mantén un tono profesional y amigable
5. Si es necesario, sugiere consultar documentos adicionales

MENSAJE DEL EMPLEADO: "${userMessage}"

Responde basándote únicamente en el contexto proporcionado:`;
  }

  /**
   * Generar respuesta genérica cuando no hay conocimiento específico
   * @param {string} userMessage - Mensaje del usuario
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<Object>} Respuesta genérica
   */
  async generateGenericResponse(userMessage, employeeEmail) {
    try {
      const prompt = `Eres un asistente de IA. Un empleado (${employeeEmail}) te ha enviado el siguiente mensaje:

"${userMessage}"

No tengo acceso a su base de conocimiento específica en este momento. Proporciona una respuesta general útil y profesional, y sugiere que puede consultar sus documentos personales para información más específica.

Respuesta:`;

      const aiResponse = await groqService.generateResponse(prompt, {
        model: 'llama3-8b-8192',
        temperature: 0.7,
        maxTokens: 400
      });

      return {
        text: aiResponse,
        confidence: 0.3,
        sources: []
      };

    } catch (error) {
      console.error('Error generando respuesta genérica:', error);
      return {
        text: 'Lo siento, no pude procesar tu mensaje en este momento. ¿Podrías intentar más tarde?',
        confidence: 0.1,
        sources: []
      };
    }
  }

  /**
   * Manejar empleado sin base de conocimiento
   * @param {Object} employee - Datos del empleado
   * @param {string} message - Mensaje del usuario
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Respuesta para empleado sin conocimiento
   */
  async handleEmployeeWithoutKnowledge(employee, message, companyId) {
    try {
      // Verificar si el empleado tiene configuración de WhatsApp
      const { data: config } = await supabase
        .from('employee_whatsapp_config')
        .select('*')
        .eq('employee_email', employee.email)
        .eq('company_id', companyId)
        .single();

      if (!config || !config.auto_response_enabled) {
        return {
          success: false,
          error: 'Auto-respuesta deshabilitada',
          response: 'Tu mensaje ha sido recibido. Te contactaremos pronto.'
        };
      }

      // Generar respuesta genérica
      const genericResponse = await this.generateGenericResponse(message, employee.email);

      // Registrar conversación
      await this.recordConversation({
        employee_email: employee.email,
        company_id: companyId,
        whatsapp_number: config.whatsapp_number,
        user_message: message,
        ai_response: genericResponse.text,
        knowledge_sources: [],
        confidence_score: genericResponse.confidence,
        processing_time_ms: 0
      });

      return {
        success: true,
        response: genericResponse.text,
        confidence: genericResponse.confidence,
        sources_used: 0,
        note: 'Empleado sin base de conocimiento activa'
      };

    } catch (error) {
      console.error('Error manejando empleado sin conocimiento:', error);
      return {
        success: false,
        error: error.message,
        response: 'Error procesando mensaje. Contacta a tu administrador.'
      };
    }
  }

  /**
   * Registrar conversación en la base de datos
   * @param {Object} conversationData - Datos de la conversación
   */
  async recordConversation(conversationData) {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations_with_knowledge')
        .insert(conversationData);

      if (error) {
        console.error('Error registrando conversación:', error);
      }

    } catch (error) {
      console.error('Error registrando conversación:', error);
    }
  }

  /**
   * Actualizar métricas del empleado
   * @param {string} employeeEmail - Email del empleado
   * @param {string} companyId - ID de la empresa
   * @param {Object} aiResponse - Respuesta de la IA
   * @param {number} processingTime - Tiempo de procesamiento
   */
  async updateEmployeeMetrics(employeeEmail, companyId, aiResponse, processingTime) {
    try {
      await supabase
        .rpc('update_conversation_metrics', {
          p_employee_email: employeeEmail,
          p_company_id: companyId,
          p_confidence_score: aiResponse.confidence,
          p_processing_time_ms: processingTime,
          p_documents_accessed: aiResponse.sources?.length || 0
        });

    } catch (error) {
      console.error('Error actualizando métricas:', error);
    }
  }

  /**
   * Calcular confianza de la respuesta
   * @param {Array} documents - Documentos utilizados
   * @param {string} aiResponse - Respuesta de la IA
   * @returns {number} Puntuación de confianza (0-1)
   */
  calculateResponseConfidence(documents, aiResponse) {
    if (!documents || documents.length === 0) {
      return 0.3; // Confianza baja si no hay documentos
    }

    // Calcular confianza basada en:
    // 1. Relevancia promedio de los documentos
    // 2. Número de documentos encontrados
    // 3. Longitud de la respuesta (respuestas muy cortas pueden indicar incertidumbre)

    const avgRelevance = documents.reduce((sum, doc) => sum + doc.similarity, 0) / documents.length;
    const documentBonus = Math.min(documents.length * 0.1, 0.3); // Bonus por múltiples documentos
    const responseLength = aiResponse.length;
    const lengthBonus = responseLength > 50 ? 0.1 : 0; // Bonus por respuesta detallada

    const confidence = Math.min(avgRelevance + documentBonus + lengthBonus, 1.0);
    
    return Math.max(confidence, 0.1); // Mínimo 0.1 de confianza
  }

  /**
   * Normalizar número de WhatsApp
   * @param {string} number - Número a normalizar
   * @returns {string} Número normalizado
   */
  normalizeWhatsAppNumber(number) {
    // Remover caracteres no numéricos excepto +
    let normalized = number.replace(/[^\d+]/g, '');
    
    // Asegurar que comience con +
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Endpoint para identificar empleado (usado por n8n)
   * @param {Object} requestData - Datos de la solicitud
   * @returns {Promise<Object>} Empleado identificado
   */
  async identifyEmployee(requestData) {
    try {
      const { whatsapp_number, company_id } = requestData;
      
      if (!whatsapp_number || !company_id) {
        throw new Error('whatsapp_number y company_id son requeridos');
      }

      const employee = await this.identifyEmployeeByWhatsApp(whatsapp_number, company_id);
      
      if (!employee) {
        return {
          found: false,
          message: 'Empleado no encontrado'
        };
      }

      return {
        found: true,
        employee: {
          email: employee.email,
          name: employee.name,
          has_knowledge_base: !!employee.knowledge_base_id
        }
      };

    } catch (error) {
      console.error('Error identificando empleado:', error);
      return {
        found: false,
        error: error.message
      };
    }
  }

  /**
   * Endpoint para generar respuesta con conocimiento (usado por n8n)
   * @param {Object} requestData - Datos de la solicitud
   * @returns {Promise<Object>} Respuesta generada
   */
  async generateResponse(requestData) {
    try {
      const { message, employee_email, company_id } = requestData;
      
      if (!message || !employee_email) {
        throw new Error('message y employee_email son requeridos');
      }

      // Obtener base de conocimiento del empleado
      const knowledgeBase = await employeeKnowledgeService.getEmployeeKnowledgeBase(employee_email);
      
      if (!knowledgeBase) {
        const genericResponse = await this.generateGenericResponse(message, employee_email);
        return {
          success: true,
          response: genericResponse.text,
          confidence: genericResponse.confidence,
          sources_used: 0,
          note: 'Sin base de conocimiento activa'
        };
      }

      // Generar respuesta con conocimiento
      const aiResponse = await this.generateResponseWithEmployeeKnowledge(
        message,
        employee_email,
        company_id,
        knowledgeBase
      );

      return {
        success: true,
        response: aiResponse.text,
        confidence: aiResponse.confidence,
        sources_used: aiResponse.sources?.length || 0,
        sources: aiResponse.sources
      };

    } catch (error) {
      console.error('Error generando respuesta:', error);
      return {
        success: false,
        error: error.message,
        response: this.fallbackResponse
      };
    }
  }

  /**
   * Obtener estadísticas de conversaciones por empleado
   * @param {string} employeeEmail - Email del empleado
   * @param {string} companyId - ID de la empresa
   * @param {string} period - Período (day, week, month)
   * @returns {Promise<Object>} Estadísticas
   */
  async getEmployeeConversationStats(employeeEmail, companyId, period = 'week') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const { data, error } = await supabase
        .from('whatsapp_conversations_with_knowledge')
        .select('*')
        .eq('employee_email', employeeEmail)
        .eq('company_id', companyId)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversations = data || [];
      
      const stats = {
        total_conversations: conversations.length,
        average_confidence: conversations.length > 0 
          ? conversations.reduce((sum, conv) => sum + (conv.confidence_score || 0), 0) / conversations.length 
          : 0,
        average_response_time: conversations.length > 0
          ? conversations.reduce((sum, conv) => sum + (conv.processing_time_ms || 0), 0) / conversations.length
          : 0,
        successful_responses: conversations.filter(conv => (conv.confidence_score || 0) >= 0.7).length,
        period: period,
        date_range: dateFilter
      };

      return stats;

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total_conversations: 0,
        average_confidence: 0,
        average_response_time: 0,
        successful_responses: 0,
        period: period,
        error: error.message
      };
    }
  }

  /**
   * Obtener filtro de fecha según período
   * @param {string} period - Período (day, week, month)
   * @returns {string} Fecha en formato ISO
   */
  getDateFilter(period) {
    const now = new Date();
    let dateFilter;

    switch (period) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return dateFilter.toISOString();
  }
}

// Crear y exportar instancia única
const whatsappAIWithEmployeeKnowledge = new WhatsAppAIWithEmployeeKnowledge();
export default whatsappAIWithEmployeeKnowledge;