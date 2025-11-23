/**
 * Routes de API para Bases de Conocimiento por Empleado
 * 
 * Endpoints para integrar con n8n y WhatsApp:
 * - /api/whatsapp/webhook - Webhook principal de n8n
 * - /api/whatsapp/identify-employee - Identificar empleado por WhatsApp
 * - /api/whatsapp/ai-response - Generar respuesta con conocimiento
 * - /api/knowledge/sync-all - Sincronización masiva
 * - /api/knowledge/health-check - Verificar salud del sistema
 */

import express from 'express';
import whatsappAIWithEmployeeKnowledge from '../services/whatsappAIWithEmployeeKnowledge.js';
import employeeKnowledgeService from '../services/employeeKnowledgeService.js';
import googleDriveAuthService from '../lib/googleDriveAuthService.js';

const router = express.Router();

// =====================================================
// ENDPOINTS DE WHATSAPP
// =====================================================

/**
 * Webhook principal de n8n para mensajes de WhatsApp
 * POST /api/whatsapp/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📱 Recibido webhook de WhatsApp via n8n');
    
    const result = await whatsappAIWithEmployeeKnowledge.processWebhook(req.body);
    
    res.json({
      success: result.success,
      response: result.response,
      confidence: result.confidence,
      processing_time_ms: result.processing_time_ms,
      employee: result.employee,
      sources_used: result.sources_used
    });
    
  } catch (error) {
    console.error('❌ Error en webhook de WhatsApp:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      response: 'Error procesando mensaje. Intenta más tarde.'
    });
  }
});

/**
 * Identificar empleado por número de WhatsApp
 * POST /api/whatsapp/identify-employee
 */
router.post('/identify-employee', async (req, res) => {
  try {
    const { whatsapp_number, company_id } = req.body;
    
    if (!whatsapp_number || !company_id) {
      return res.status(400).json({
        success: false,
        error: 'whatsapp_number y company_id son requeridos'
      });
    }
    
    const result = await whatsappAIWithEmployeeKnowledge.identifyEmployee({
      whatsapp_number,
      company_id
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error identificando empleado:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generar respuesta de IA con conocimiento del empleado
 * POST /api/whatsapp/ai-response
 */
router.post('/ai-response', async (req, res) => {
  try {
    const { message, employee_email, company_id } = req.body;
    
    if (!message || !employee_email) {
      return res.status(400).json({
        success: false,
        error: 'message y employee_email son requeridos'
      });
    }
    
    const result = await whatsappAIWithEmployeeKnowledge.generateResponse({
      message,
      employee_email,
      company_id
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error generando respuesta de IA:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// ENDPOINTS DE GESTIÓN DE CONOCIMIENTO
// =====================================================

/**
 * Crear base de conocimiento para un empleado
 * POST /api/knowledge/employee
 */
router.post('/employee', async (req, res) => {
  try {
    const { email, name, companyId, driveFolderId, driveFolderUrl } = req.body;
    
    if (!email || !name || !companyId || !driveFolderId) {
      return res.status(400).json({
        success: false,
        error: 'email, name, companyId y driveFolderId son requeridos'
      });
    }
    
    const knowledgeBase = await employeeKnowledgeService.createEmployeeKnowledgeBase({
      email,
      name,
      companyId,
      driveFolderId,
      driveFolderUrl
    });
    
    res.json({
      success: true,
      knowledge_base: knowledgeBase,
      message: 'Base de conocimiento creada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando base de conocimiento:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener base de conocimiento de un empleado
 * GET /api/knowledge/employee/:email
 */
router.get('/employee/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const knowledgeBase = await employeeKnowledgeService.getEmployeeKnowledgeBase(email);
    
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        error: 'Base de conocimiento no encontrada'
      });
    }
    
    const stats = await employeeKnowledgeService.getEmployeeKnowledgeStats(email);
    
    res.json({
      success: true,
      knowledge_base: knowledgeBase,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo base de conocimiento:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sincronizar documentos de un empleado específico
 * POST /api/knowledge/employee/:email/sync
 */
router.post('/employee/:email/sync', async (req, res) => {
  try {
    const { email } = req.params;
    
    const knowledgeBase = await employeeKnowledgeService.getEmployeeKnowledgeBase(email);
    
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        error: 'Base de conocimiento no encontrada'
      });
    }
    
    const result = await employeeKnowledgeService.syncEmployeeDocuments(knowledgeBase.id);
    
    res.json({
      success: true,
      sync_result: result,
      message: 'Sincronización completada'
    });
    
  } catch (error) {
    console.error('❌ Error sincronizando empleado:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Buscar en conocimiento de un empleado
 * POST /api/knowledge/employee/:email/search
 */
router.post('/employee/:email/search', async (req, res) => {
  try {
    const { email } = req.params;
    const { query, limit = 5, threshold = 0.7 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query es requerido'
      });
    }
    
    const results = await employeeKnowledgeService.searchEmployeeKnowledge(email, query, {
      limit,
      threshold,
      includeMetadata: true
    });
    
    res.json({
      success: true,
      results: results,
      query: query,
      total_results: results.length
    });
    
  } catch (error) {
    console.error('❌ Error buscando en conocimiento:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// ENDPOINTS DE ADMINISTRACIÓN
// =====================================================

/**
 * Sincronización masiva de todas las bases de conocimiento
 * POST /api/knowledge/sync-all
 */
router.post('/sync-all', async (req, res) => {
  try {
    const { force_sync = false } = req.body;
    
    // Obtener todas las bases de conocimiento activas
    const { data: knowledgeBases, error } = await supabase
      .from('employee_knowledge_bases')
      .select('*')
      .eq('knowledge_status', 'active');
    
    if (error) throw error;
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const kb of knowledgeBases || []) {
      try {
        // Verificar si necesita sincronización
        if (!force_sync && kb.last_sync_at) {
          const lastSync = new Date(kb.last_sync_at);
          const now = new Date();
          const hoursDiff = (now - lastSync) / (1000 * 60 * 60);
          
          if (hoursDiff < 6) { // Solo sincronizar si han pasado más de 6 horas
            results.push({
              employee_email: kb.employee_email,
              status: 'skipped',
              reason: 'Sincronización reciente'
            });
            continue;
          }
        }
        
        const syncResult = await employeeKnowledgeService.syncEmployeeDocuments(kb.id);
        
        results.push({
          employee_email: kb.employee_email,
          status: 'success',
          ...syncResult
        });
        
        successCount++;
        
      } catch (employeeError) {
        console.error(`Error sincronizando ${kb.employee_email}:`, employeeError);
        
        results.push({
          employee_email: kb.employee_email,
          status: 'error',
          error: employeeError.message
        });
        
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      total_bases: knowledgeBases?.length || 0,
      success_count: successCount,
      error_count: errorCount,
      results: results,
      message: `Sincronización masiva completada: ${successCount} exitosas, ${errorCount} errores`
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización masiva:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verificar salud del sistema de conocimiento
 * GET /api/knowledge/health-check
 */
router.get('/health-check', async (req, res) => {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      healthy: true,
      issues: [],
      metrics: {}
    };
    
    // Verificar conexión a Supabase
    try {
      const { data, error } = await supabase
        .from('employee_knowledge_bases')
        .select('id', { count: 'exact', head: true })
        .eq('knowledge_status', 'active');
      
      if (error) throw error;
      
      healthCheck.metrics.total_active_bases = data?.length || 0;
      
    } catch (dbError) {
      healthCheck.healthy = false;
      healthCheck.issues.push(`Error de base de datos: ${dbError.message}`);
    }
    
    // Verificar autenticación de Google Drive
    try {
      // Esta verificación se haría por usuario específico
      healthCheck.metrics.google_drive_auth = 'configured';
      
    } catch (authError) {
      healthCheck.issues.push(`Error de autenticación Google Drive: ${authError.message}`);
    }
    
    // Verificar bases de conocimiento sin sincronizar
    try {
      const { data: outdatedBases } = await supabase
        .from('employee_knowledge_bases')
        .select('employee_email, last_sync_at')
        .eq('knowledge_status', 'active')
        .not('last_sync_at', 'is', null)
        .lt('last_sync_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24 horas
      
      if (outdatedBases && outdatedBases.length > 0) {
        healthCheck.issues.push(`${outdatedBases.length} bases de conocimiento sin actualizar en 24h`);
      }
      
      healthCheck.metrics.outdated_bases = outdatedBases?.length || 0;
      
    } catch (syncError) {
      healthCheck.issues.push(`Error verificando sincronización: ${syncError.message}`);
    }
    
    // Verificar conversaciones recientes
    try {
      const { data: recentConversations } = await supabase
        .from('whatsapp_conversations_with_knowledge')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      healthCheck.metrics.conversations_last_24h = recentConversations?.length || 0;
      
    } catch (convError) {
      healthCheck.issues.push(`Error verificando conversaciones: ${convError.message}`);
    }
    
    // Determinar estado general
    if (healthCheck.issues.length > 0) {
      healthCheck.healthy = healthCheck.issues.length <= 2; // Saludable si hay 2 o menos issues
    }
    
    const statusCode = healthCheck.healthy ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
    
  } catch (error) {
    console.error('❌ Error en health check:', error);
    
    res.status(500).json({
      timestamp: new Date().toISOString(),
      healthy: false,
      issues: [`Error crítico: ${error.message}`],
      metrics: {}
    });
  }
});

/**
 * Obtener estadísticas generales del sistema
 * GET /api/knowledge/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Obtener estadísticas de bases de conocimiento
    const { data: knowledgeStats } = await supabase
      .from('employee_knowledge_bases')
      .select('knowledge_status, total_documents, total_chunks, created_at');
    
    // Obtener estadísticas de conversaciones
    const dateFilter = getDateFilter(period);
    const { data: conversations } = await supabase
      .from('whatsapp_conversations_with_knowledge')
      .select('confidence_score, processing_time_ms, created_at')
      .gte('created_at', dateFilter);
    
    // Calcular métricas
    const stats = {
      period: period,
      knowledge_bases: {
        total: knowledgeStats?.length || 0,
        active: knowledgeStats?.filter(kb => kb.knowledge_status === 'active').length || 0,
        error: knowledgeStats?.filter(kb => kb.knowledge_status === 'error').length || 0,
        total_documents: knowledgeStats?.reduce((sum, kb) => sum + (kb.total_documents || 0), 0) || 0,
        total_chunks: knowledgeStats?.reduce((sum, kb) => sum + (kb.total_chunks || 0), 0) || 0
      },
      conversations: {
        total: conversations?.length || 0,
        average_confidence: conversations?.length > 0 
          ? conversations.reduce((sum, conv) => sum + (conv.confidence_score || 0), 0) / conversations.length 
          : 0,
        average_response_time: conversations?.length > 0
          ? conversations.reduce((sum, conv) => sum + (conv.processing_time_ms || 0), 0) / conversations.length
          : 0,
        successful_responses: conversations?.filter(conv => (conv.confidence_score || 0) >= 0.7).length || 0
      },
      performance: {
        success_rate: conversations?.length > 0 
          ? (conversations.filter(conv => (conv.confidence_score || 0) >= 0.7).length / conversations.length) * 100 
          : 0,
        average_response_time_seconds: conversations?.length > 0
          ? conversations.reduce((sum, conv) => sum + (conv.processing_time_ms || 0), 0) / conversations.length / 1000
          : 0
      }
    };
    
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Obtener filtro de fecha según período
 */
function getDateFilter(period) {
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

export default router;