/**
 * Servicio de Colas para WhatsApp Business API
 *
 * Gestiona el envío masivo de mensajes respetando los límites de rate limiting
 * de WhatsApp Business API para evitar bloqueos y optimizar la entrega.
 */

class WhatsAppQueueService {
  constructor() {
    this.queues = new Map(); // companyId -> queue
    this.processing = new Map(); // companyId -> boolean
    this.batchSize = 10; // mensajes por lote
    this.delayBetweenBatches = 1000; // 1 segundo entre lotes
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos entre reintentos
  }

  /**
   * Agrega mensajes a la cola de una empresa
   * @param {string} companyId - ID de la empresa
   * @param {Array} messages - Array de mensajes a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado de la operación
   */
  async addToQueue(companyId, messages, options = {}) {
    try {
      if (!this.queues.has(companyId)) {
        this.queues.set(companyId, []);
      }

      const queue = this.queues.get(companyId);
      const messageBatch = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        messages: messages,
        options: {
          priority: options.priority || 'normal', // high, normal, low
          scheduledTime: options.scheduledTime || null,
          campaignId: options.campaignId || null,
          ...options
        },
        status: 'queued',
        createdAt: new Date(),
        retries: 0,
        results: []
      };

      queue.push(messageBatch);

      // Inicia el procesamiento si no está corriendo
      if (!this.processing.get(companyId)) {
        this.processQueue(companyId);
      }

      return {
        success: true,
        batchId: messageBatch.id,
        queueLength: queue.length,
        message: `Agregado lote de ${messages.length} mensajes a la cola`
      };

    } catch (error) {
      console.error('Error agregando a cola:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesa la cola de mensajes de una empresa
   * @param {string} companyId - ID de la empresa
   */
  async processQueue(companyId) {
    if (this.processing.get(companyId)) {
      return; // Ya está procesando
    }

    this.processing.set(companyId, true);

    try {
      const queue = this.queues.get(companyId) || [];

      while (queue.length > 0) {
        const batch = queue[0]; // Procesar el primer lote

        // Verificar si es hora programada
        if (batch.options.scheduledTime && new Date() < new Date(batch.options.scheduledTime)) {
          break; // Salir del loop, esperar al tiempo programado
        }

        try {
          await this.processBatch(companyId, batch);
          queue.shift(); // Remover el lote procesado exitosamente
        } catch (error) {
          console.error(`Error procesando lote ${batch.id}:`, error);

          batch.retries++;
          batch.lastError = error.message;

          if (batch.retries >= this.maxRetries) {
            console.error(`Máximo de reintentos alcanzado para lote ${batch.id}`);
            batch.status = 'failed';
            queue.shift(); // Remover después de máximo reintentos
          } else {
            // Reintentar después de delay
            await this.delay(this.retryDelay * batch.retries);
            continue;
          }
        }

        // Delay entre lotes para respetar rate limits
        await this.delay(this.delayBetweenBatches);
      }

    } catch (error) {
      console.error('Error procesando cola:', error);
    } finally {
      this.processing.set(companyId, false);
    }
  }

  /**
   * Procesa un lote de mensajes
   * @param {string} companyId - ID de la empresa
   * @param {Object} batch - Lote de mensajes
   */
  async processBatch(companyId, batch) {
    const { messages, options } = batch;

    // Obtener configuración de WhatsApp para la empresa
    const config = await this.getWhatsAppConfig(companyId);
    if (!config) {
      throw new Error(`No se encontró configuración de WhatsApp para empresa ${companyId}`);
    }

    // Verificar límites de uso
    await this.checkRateLimits(config);

    // Procesar mensajes en lotes más pequeños
    const results = [];
    for (let i = 0; i < messages.length; i += this.batchSize) {
      const messageBatch = messages.slice(i, i + this.batchSize);

      try {
        const batchResults = await this.sendMessageBatch(config, messageBatch, options);
        results.push(...batchResults);

        // Actualizar estadísticas
        await this.updateStats(config.id, batchResults);

        // Pequeño delay entre sub-lotes
        if (i + this.batchSize < messages.length) {
          await this.delay(500);
        }

      } catch (error) {
        console.error('Error enviando lote de mensajes:', error);
        throw error;
      }
    }

    batch.status = 'completed';
    batch.results = results;
    batch.completedAt = new Date();

    return results;
  }

  /**
   * Envía un lote de mensajes
   * @param {Object} config - Configuración de WhatsApp
   * @param {Array} messages - Mensajes a enviar
   * @param {Object} options - Opciones del envío
   * @returns {Promise<Array>} Resultados del envío
   */
  async sendMessageBatch(config, messages, options) {
    const results = [];

    for (const message of messages) {
      try {
        const result = await this.sendSingleMessage(config, message, options);
        results.push({
          messageId: message.id,
          success: true,
          whatsappMessageId: result.id,
          status: 'sent',
          timestamp: new Date()
        });

      } catch (error) {
        console.error(`Error enviando mensaje ${message.id}:`, error);
        results.push({
          messageId: message.id,
          success: false,
          error: error.message,
          status: 'failed',
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Envía un mensaje individual
   * @param {Object} config - Configuración de WhatsApp
   * @param {Object} message - Mensaje a enviar
   * @param {Object} options - Opciones del envío
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendSingleMessage(config, message, options) {
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.to,
        type: message.type || 'text',
        text: message.type === 'text' ? { body: message.body } : undefined,
        image: message.type === 'image' ? { link: message.mediaUrl } : undefined,
        document: message.type === 'document' ? {
          link: message.mediaUrl,
          filename: message.filename
        } : undefined,
        ...message.additionalData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Verifica límites de rate limiting
   * @param {Object} config - Configuración de WhatsApp
   */
  async checkRateLimits(config) {
    const now = new Date();    // Verificar límites diarios
    if (config.messages_sent_today >= config.daily_limit) {
      throw new Error(`Límite diario alcanzado (${config.daily_limit} mensajes)`);
    }

    // Verificar límites mensuales
    if (config.messages_sent_month >= config.monthly_limit) {
      throw new Error(`Límite mensual alcanzado (${config.monthly_limit} mensajes)`);
    }

    // Verificar velocidad de envío (no más de X mensajes por minuto)
    const recentMessages = await this.getRecentMessageCount(config.id, 60); // últimos 60 segundos
    if (recentMessages >= 20) { // máximo 20 mensajes por minuto
      throw new Error('Límite de velocidad alcanzado. Espera antes de enviar más mensajes.');
    }
  }

  /**
   * Obtiene configuración de WhatsApp para una empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Configuración
   */
  async getWhatsAppConfig(companyId) {
    try {
      const { supabase } = await import('../lib/supabaseClient.js');

      const { data, error } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      return null;
    }
  }

  /**
   * Obtiene cantidad de mensajes recientes
   * @param {string} configId - ID de configuración
   * @param {number} seconds - Segundos hacia atrás
   * @returns {Promise<number>} Cantidad de mensajes
   */
  async getRecentMessageCount(configId, seconds) {
    try {
      const { supabase } = await import('../lib/supabaseClient.js');

      const since = new Date(Date.now() - seconds * 1000).toISOString();

      const { count, error } = await supabase
        .from('whatsapp_logs')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_config_id', configId)
        .eq('direction', 'outbound')
        .gte('created_at', since);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de mensajes recientes:', error);
      return 0;
    }
  }

  /**
   * Actualiza estadísticas
   * @param {string} configId - ID de configuración
   * @param {Array} results - Resultados del envío
   */
  async updateStats(configId, results) {
    try {
      const { supabase } = await import('../lib/supabaseClient.js');

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      // Actualizar contadores
      await supabase.rpc('increment_whatsapp_stats', {
        config_id: configId,
        sent_count: successful,
        failed_count: failed
      });

    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }

  /**
   * Obtiene estado de la cola
   * @param {string} companyId - ID de la empresa
   * @returns {Object} Estado de la cola
   */
  getQueueStatus(companyId) {
    const queue = this.queues.get(companyId) || [];
    const isProcessing = this.processing.get(companyId) || false;

    return {
      queueLength: queue.length,
      isProcessing,
      nextBatch: queue.length > 0 ? queue[0] : null,
      totalMessages: queue.reduce((sum, batch) => sum + batch.messages.length, 0)
    };
  }

  /**
   * Cancela un lote específico
   * @param {string} companyId - ID de la empresa
   * @param {string} batchId - ID del lote
   * @returns {boolean} True si se canceló exitosamente
   */
  cancelBatch(companyId, batchId) {
    const queue = this.queues.get(companyId) || [];
    const index = queue.findIndex(batch => batch.id === batchId);

    if (index !== -1) {
      queue.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Pausa el procesamiento de una cola
   * @param {string} companyId - ID de la empresa
   */
  pauseQueue(companyId) {
    this.processing.set(companyId, false);
  }

  /**
   * Reanuda el procesamiento de una cola
   * @param {string} companyId - ID de la empresa
   */
  resumeQueue(companyId) {
    if (!this.processing.get(companyId)) {
      this.processQueue(companyId);
    }
  }

  /**
   * Utilidad para delays
   * @param {number} ms - Milisegundos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpia colas antiguas (opcional para mantenimiento)
   */
  cleanup() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas

    for (const [companyId, queue] of this.queues.entries()) {
      const filteredQueue = queue.filter(batch =>
        batch.createdAt.getTime() > cutoffTime ||
        batch.status === 'processing'
      );

      if (filteredQueue.length !== queue.length) {
        this.queues.set(companyId, filteredQueue);
      }
    }
  }
}

// Exportar instancia única
const whatsappQueueService = new WhatsAppQueueService();
export default whatsappQueueService;