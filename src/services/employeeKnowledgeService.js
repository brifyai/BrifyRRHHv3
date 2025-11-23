/**
 * EmployeeKnowledgeService - Servicio de Bases de Conocimiento por Empleado
 * 
 * Este servicio implementa:
 * - Creación de bases de conocimiento individuales por empleado
 * - Sincronización y vectorización de documentos de Google Drive
 * - Búsqueda semántica en el conocimiento específico del empleado
 * - Integración con IA para respuestas contextualizadas
 */

import { supabase } from '../lib/supabase.js';
import googleDriveAuthService from '../lib/googleDriveAuthService.js';
import groqService from './groqService.js';
import fileContentExtractor from './fileContentExtractor.js';

class EmployeeKnowledgeService {
  constructor() {
    this.chunkSize = 8000;
    this.chunkOverlap = 200;
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Crear base de conocimiento para un empleado
   * @param {Object} employeeData - Datos del empleado
   * @returns {Promise<Object>} Base de conocimiento creada
   */
  async createEmployeeKnowledgeBase(employeeData) {
    try {
      console.log(`🧠 EmployeeKnowledgeService: Creando base de conocimiento para ${employeeData.email}`);
      
      const { email, name, companyId, driveFolderId, driveFolderUrl } = employeeData;

      // 1. Verificar si ya existe una base de conocimiento
      const existing = await this.getEmployeeKnowledgeBase(email);
      if (existing) {
        console.log(`⚠️ Base de conocimiento ya existe para ${email}`);
        return existing;
      }

      // 2. Crear registro en employee_knowledge_bases
      const { data: knowledgeBase, error } = await supabase
        .from('employee_knowledge_bases')
        .insert({
          employee_email: email,
          employee_name: name,
          company_id: companyId,
          drive_folder_id: driveFolderId,
          drive_folder_url: driveFolderUrl,
          knowledge_status: 'active',
          embedding_model: 'groq'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Base de conocimiento creada para ${email}:`, knowledgeBase.id);

      // 3. Iniciar sincronización asíncrona de documentos
      this.syncEmployeeDocuments(knowledgeBase.id).catch(error => {
        console.error(`❌ Error en sincronización para ${email}:`, error);
      });

      return knowledgeBase;

    } catch (error) {
      console.error('Error creando base de conocimiento del empleado:', error);
      throw error;
    }
  }

  /**
   * Obtener base de conocimiento de un empleado
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<Object>} Base de conocimiento
   */
  async getEmployeeKnowledgeBase(employeeEmail) {
    try {
      const { data, error } = await supabase
        .from('employee_knowledge_bases')
        .select('*')
        .eq('employee_email', employeeEmail)
        .eq('knowledge_status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error obteniendo base de conocimiento:', error);
      return null;
    }
  }

  /**
   * Sincronizar documentos de la carpeta del empleado
   * @param {string} knowledgeBaseId - ID de la base de conocimiento
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async syncEmployeeDocuments(knowledgeBaseId) {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        console.log(`🔄 EmployeeKnowledgeService: Sincronizando documentos para base ${knowledgeBaseId}`);
        
        // 1. Obtener información de la base de conocimiento
        const knowledgeBase = await this.getKnowledgeBaseById(knowledgeBaseId);
        if (!knowledgeBase) {
          throw new Error('Base de conocimiento no encontrada');
        }

        // 2. Obtener usuario autenticado (necesario para Google Drive)
        const userId = await this.getUserIdByEmployeeEmail(knowledgeBase.employee_email);
        if (!userId) {
          throw new Error('Usuario no encontrado para el empleado');
        }

        // 3. Obtener token válido de Google Drive
        const accessToken = await googleDriveAuthService.getValidToken(userId);

        // 4. Listar archivos en la carpeta del empleado
        const files = await this.listFilesInFolder(knowledgeBase.drive_folder_id, accessToken);
        
        let processedCount = 0;
        let errorCount = 0;

        // 5. Procesar cada archivo
        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            continue; // Skip folders
          }

          try {
            const result = await this.processFile(file, knowledgeBaseId, accessToken);
            if (result.success) {
              processedCount++;
            } else {
              errorCount++;
              console.warn(`⚠️ Error procesando archivo ${file.name}:`, result.error);
            }
          } catch (fileError) {
            errorCount++;
            console.error(`❌ Error procesando archivo ${file.name}:`, fileError);
          }
        }

        // 6. Actualizar estadísticas en la base de conocimiento
        await this.updateKnowledgeBaseStats(knowledgeBaseId, processedCount, errorCount);

        // 7. Marcar sincronización como completada
        await supabase
          .from('employee_knowledge_bases')
          .update({
            last_sync_at: new Date().toISOString(),
            knowledge_status: 'active'
          })
          .eq('id', knowledgeBaseId);

        const result = {
          success: true,
          knowledgeBaseId,
          totalFiles: files.length,
          processedCount,
          errorCount,
          message: `Sincronización completada: ${processedCount}/${files.length} archivos procesados`
        };

        console.log('✅ EmployeeKnowledgeService: Sincronización completada:', result);
        return result;

      } catch (error) {
        attempts++;
        console.error(`❌ EmployeeKnowledgeService: Intento ${attempts} falló:`, error);
        
        if (attempts >= this.maxRetries) {
          // Marcar como error
          await supabase
            .from('employee_knowledge_bases')
            .update({
              knowledge_status: 'error',
              sync_errors: [error.message]
            })
            .eq('id', knowledgeBaseId);
          
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await this.delay(this.retryDelay * attempts);
      }
    }
  }

  /**
   * Obtener base de conocimiento por ID
   * @param {string} knowledgeBaseId - ID de la base
   * @returns {Promise<Object>} Base de conocimiento
   */
  async getKnowledgeBaseById(knowledgeBaseId) {
    const { data, error } = await supabase
      .from('employee_knowledge_bases')
      .select('*')
      .eq('id', knowledgeBaseId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtener ID de usuario por email del empleado
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<string>} ID del usuario
   */
  async getUserIdByEmployeeEmail(employeeEmail) {
    // Esta lógica puede variar según tu estructura de datos
    // Por ahora, asumimos que el email del empleado corresponde a un usuario
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', employeeEmail)
      .single();

    if (error) return null;
    return data?.id;
  }

  /**
   * Listar archivos en una carpeta de Google Drive
   * @param {string} folderId - ID de la carpeta
   * @param {string} accessToken - Access token
   * @returns {Promise<Array>} Lista de archivos
   */
  async listFilesInFolder(folderId, accessToken) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,modifiedTime)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error listando archivos: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Procesar un archivo individual
   * @param {Object} file - Información del archivo
   * @param {string} knowledgeBaseId - ID de la base de conocimiento
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processFile(file, knowledgeBaseId, accessToken) {
    try {
      // 1. Verificar si ya está procesado
      const existing = await this.getExistingDocument(file.id, knowledgeBaseId);
      if (existing) {
        return { success: true, message: 'Archivo ya procesado', documentId: existing.id };
      }

      // 2. Descargar contenido del archivo
      const fileContent = await this.downloadFileContent(file, accessToken);
      
      // 3. Extraer texto del contenido
      const extractedText = await fileContentExtractor.extractText(fileContent, file.mimeType);
      
      if (!extractedText || extractedText.trim().length < 100) {
        return { success: false, error: 'Texto insuficiente para procesar' };
      }

      // 4. Crear chunks del documento
      const chunks = this.createTextChunks(extractedText);
      
      let chunksCreated = 0;
      
      // 5. Procesar cada chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // 6. Generar embedding para el chunk
          const embedding = await groqService.generateEmbedding(chunk);
          
          // 7. Guardar chunk en la base de datos
          const { error } = await supabase
            .from('employee_knowledge_documents')
            .insert({
              employee_knowledge_base_id: knowledgeBaseId,
              google_file_id: file.id,
              title: file.name,
              content: extractedText,
              embedding: embedding,
              chunk_index: i,
              chunk_content: chunk,
              chunk_embedding: embedding,
              file_type: file.mimeType,
              file_size: parseInt(file.size) || 0,
              processing_status: 'completed'
            });

          if (error) throw error;
          chunksCreated++;

        } catch (chunkError) {
          console.error(`Error procesando chunk ${i} del archivo ${file.name}:`, chunkError);
        }
      }

      return {
        success: true,
        message: `Archivo procesado: ${chunksCreated}/${chunks.length} chunks creados`,
        chunksCreated
      };

    } catch (error) {
      console.error(`Error procesando archivo ${file.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Descargar contenido de un archivo desde Google Drive
   * @param {Object} file - Información del archivo
   * @param {string} accessToken - Access token
   * @returns {Promise<ArrayBuffer>} Contenido del archivo
   */
  async downloadFileContent(file, accessToken) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error descargando archivo: ${response.status}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Crear chunks de texto para mejor búsqueda
   * @param {string} text - Texto a dividir
   * @returns {Array<string>} Array de chunks
   */
  createTextChunks(text) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // Si una oración es muy larga, dividirla por palabras
          const words = sentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if ((wordChunk + ' ' + word).length > this.chunkSize) {
              if (wordChunk) {
                chunks.push(wordChunk.trim());
                wordChunk = word;
              } else {
                chunks.push(word);
              }
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word;
            }
          }
          
          if (wordChunk) {
            currentChunk = wordChunk;
          }
        }
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 100);
  }

  /**
   * Verificar si un archivo ya está procesado
   * @param {string} googleFileId - ID del archivo en Google Drive
   * @param {string} knowledgeBaseId - ID de la base de conocimiento
   * @returns {Promise<Object>} Documento existente
   */
  async getExistingDocument(googleFileId, knowledgeBaseId) {
    const { data, error } = await supabase
      .from('employee_knowledge_documents')
      .select('id')
      .eq('google_file_id', googleFileId)
      .eq('employee_knowledge_base_id', knowledgeBaseId)
      .eq('processing_status', 'completed')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Actualizar estadísticas de la base de conocimiento
   * @param {string} knowledgeBaseId - ID de la base
   * @param {number} processedCount - Documentos procesados
   * @param {number} errorCount - Documentos con error
   */
  async updateKnowledgeBaseStats(knowledgeBaseId, processedCount, errorCount) {
    // Obtener conteos actuales
    const { count: totalDocuments } = await supabase
      .from('employee_knowledge_documents')
      .select('id', { count: 'exact' })
      .eq('employee_knowledge_base_id', knowledgeBaseId)
      .eq('processing_status', 'completed');

    const { count: totalChunks } = await supabase
      .from('employee_knowledge_documents')
      .select('id', { count: 'exact' })
      .eq('employee_knowledge_base_id', knowledgeBaseId)
      .eq('processing_status', 'completed')
      .not('chunk_content', 'is', null);

    await supabase
      .from('employee_knowledge_bases')
      .update({
        total_documents: totalDocuments || 0,
        total_chunks: totalChunks || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledgeBaseId);
  }

  /**
   * Buscar en la base de conocimiento del empleado
   * @param {string} employeeEmail - Email del empleado
   * @param {string} query - Consulta de búsqueda
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Array>} Resultados de la búsqueda
   */
  async searchEmployeeKnowledge(employeeEmail, query, options = {}) {
    try {
      const {
        limit = 5,
        threshold = 0.7,
        includeMetadata = true
      } = options;

      // 1. Generar embedding de la consulta
      const queryEmbedding = await groqService.generateEmbedding(query);

      // 2. Buscar usando la función SQL
      const { data: results, error } = await supabase
        .rpc('search_employee_knowledge', {
          p_employee_email: employeeEmail,
          p_query_embedding: queryEmbedding,
          p_similarity_threshold: threshold,
          p_limit: limit
        });

      if (error) throw error;

      // 3. Formatear resultados
      const formattedResults = (results || []).map(result => ({
        ...result,
        relevance_score: result.similarity,
        source_type: 'employee_knowledge',
        employee_email: employeeEmail
      }));

      console.log(`🔍 Búsqueda en conocimiento de ${employeeEmail}: ${formattedResults.length} resultados`);
      return formattedResults;

    } catch (error) {
      console.error('Error buscando en conocimiento del empleado:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de la base de conocimiento
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<Object>} Estadísticas
   */
  async getEmployeeKnowledgeStats(employeeEmail) {
    try {
      const { data, error } = await supabase
        .rpc('get_employee_knowledge_stats', {
          p_employee_email: employeeEmail
        });

      if (error) throw error;

      return data || {
        total_documents: 0,
        total_chunks: 0,
        last_sync: null,
        knowledge_status: 'inactive',
        total_conversations: 0
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total_documents: 0,
        total_chunks: 0,
        last_sync: null,
        knowledge_status: 'error',
        total_conversations: 0
      };
    }
  }

  /**
   * Eliminar base de conocimiento de un empleado
   * @param {string} employeeEmail - Email del empleado
   * @returns {Promise<boolean>} Éxito de la eliminación
   */
  async deleteEmployeeKnowledgeBase(employeeEmail) {
    try {
      // Marcar como inactiva en lugar de eliminar físicamente
      const { error } = await supabase
        .from('employee_knowledge_bases')
        .update({
          knowledge_status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('employee_email', employeeEmail);

      if (error) throw error;

      console.log(`🗑️ Base de conocimiento desactivada para ${employeeEmail}`);
      return true;

    } catch (error) {
      console.error('Error eliminando base de conocimiento:', error);
      return false;
    }
  }

  /**
   * Delay helper para reintentos
   * @param {number} ms - Milisegundos a esperar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener todas las bases de conocimiento de una empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Array>} Bases de conocimiento
   */
  async getCompanyEmployeeKnowledgeBases(companyId) {
    try {
      const { data, error } = await supabase
        .from('employee_knowledge_bases')
        .select('*')
        .eq('company_id', companyId)
        .eq('knowledge_status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error obteniendo bases de conocimiento de la empresa:', error);
      return [];
    }
  }
}

// Crear y exportar instancia única
const employeeKnowledgeService = new EmployeeKnowledgeService();
export default employeeKnowledgeService;