/**
 * Servicio de Creación Automática de Bases de Conocimiento Empresariales
 * 
 * Este servicio implementa el flujo completo:
 * 1. Creación automática de carpeta en Google Drive cuando se registra una empresa
 * 2. Vectorización de documentos con IA (Groq/Gemini)
 * 3. Sincronización con Supabase para búsqueda semántica
 * 4. Configuración de estructura de conocimiento por empresa
 * 
 * Características principales:
 * - Creación automática de estructura de carpetas en Google Drive
 * - Vectorización de documentos usando embeddings
 * - Indexación semántica en Supabase
 * - Sincronización bidireccional
 * - Gestión de permisos por empresa
 * - Soporte para múltiples formatos de documento
 */

import { supabase } from '../lib/supabase.js';
import googleDriveService from '../lib/googleDrive.js';
import embeddingService from './embeddingService.js';
import fileContentExtractor from './fileContentExtractor.js';

class CompanyKnowledgeService {
  constructor() {
    this.knowledgeCache = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Crear base de conocimiento completa para una empresa nueva
   * @param {Object} companyData - Datos de la empresa
   * @param {string} userId - ID del usuario que crea la empresa
   * @returns {Promise<Object>} Resultado de la creación
   */
  async createCompanyKnowledgeBase(companyData, userId) {
    try {
      console.log(`🚀 Creando base de conocimiento para empresa: ${companyData.name}`);
      
      const companyId = companyData.id;
      
      // 1. Verificar que Google Drive esté configurado para el usuario
      const userProfile = await this.getUserGoogleProfile(userId);
      if (!userProfile || !userProfile.google_refresh_token) {
        throw new Error('El usuario debe tener Google Drive configurado para crear una base de conocimiento');
      }

      // 2. Autenticar con Google Drive
      await googleDriveService.setTokens({
        refresh_token: userProfile.google_refresh_token
      });

      // 3. Crear estructura de carpetas en Google Drive
      const driveStructure = await this.createDriveFolderStructure(companyData, userId);
      
      // 4. Crear registros en la base de datos
      const knowledgeBase = await this.createKnowledgeBaseRecords(companyId, driveStructure);
      
      // 5. Inicializar categorías por defecto
      await this.initializeDefaultCategories(companyId);
      
      // 6. Crear FAQs iniciales basadas en el tipo de empresa
      await this.createInitialFAQs(companyData, companyId);
      
      // 7. Configurar permisos y acceso
      await this.setupKnowledgePermissions(companyId, userId);

      const result = {
        success: true,
        companyId,
        driveStructure,
        knowledgeBase,
        message: `Base de conocimiento creada exitosamente para ${companyData.name}`
      };

      console.log('✅ Base de conocimiento creada:', result);
      return result;

    } catch (error) {
      console.error('❌ Error creando base de conocimiento:', error);
      throw new Error(`Error al crear base de conocimiento: ${error.message}`);
    }
  }

  /**
   * Obtener perfil de Google del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Perfil del usuario con tokens de Google
   */
  async getUserGoogleProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('google_refresh_token, google_access_token, email')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo perfil de Google:', error);
      return null;
    }
  }

  /**
   * Crear estructura completa de carpetas en Google Drive
   * @param {Object} companyData - Datos de la empresa
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estructura de carpetas creadas
   */
  async createDriveFolderStructure(companyData, userId) {
    try {
      const companyName = companyData.name.replace(/[^a-zA-Z0-9s]/g, '').trim();      // 1. Carpeta principal de la empresa
      const mainFolder = await googleDriveService.createFolder(
        `${companyName} - Base de Conocimiento`
      );

      // 2. Subcarpetas organizadas por tipo de contenido
      const subfolders = await Promise.all([
        // Documentos empresariales
        googleDriveService.createFolder('01_Documentos_Empresariales', mainFolder.id),
        // Políticas y procedimientos
        googleDriveService.createFolder('02_Politicas_Procedimientos', mainFolder.id),
        // FAQs y guías
        googleDriveService.createFolder('03_FAQs_Guias', mainFolder.id),
        // Capacitación
        googleDriveService.createFolder('04_Capacitacion', mainFolder.id),
        // Formatos y plantillas
        googleDriveService.createFolder('05_Formatos_Plantillas', mainFolder.id),
        // Multimedia
        googleDriveService.createFolder('06_Multimedia', mainFolder.id)
      ]);

      // 3. Compartir carpeta principal con el usuario
      const userProfile = await this.getUserGoogleProfile(userId);
      if (userProfile?.email) {
        await googleDriveService.shareFolder(mainFolder.id, userProfile.email, 'writer');
      }

      const structure = {
        mainFolder: {
          id: mainFolder.id,
          name: mainFolder.name,
          url: `https://drive.google.com/drive/folders/${mainFolder.id}`
        },
        subfolders: {
          documents: {
            id: subfolders[0].id,
            name: subfolders[0].name,
            type: 'documents'
          },
          policies: {
            id: subfolders[1].id,
            name: subfolders[1].name,
            type: 'policies'
          },
          faqs: {
            id: subfolders[2].id,
            name: subfolders[2].name,
            type: 'faqs'
          },
          training: {
            id: subfolders[3].id,
            name: subfolders[3].name,
            type: 'training'
          },
          templates: {
            id: subfolders[4].id,
            name: subfolders[4].name,
            type: 'templates'
          },
          multimedia: {
            id: subfolders[5].id,
            name: subfolders[5].name,
            type: 'multimedia'
          }
        },
        createdAt: new Date().toISOString(),
        createdBy: userId
      };

      console.log('📁 Estructura de carpetas creada:', structure);
      return structure;

    } catch (error) {
      console.error('Error creando estructura de carpetas:', error);
      throw error;
    }
  }

  /**
   * Crear registros en la base de datos para la base de conocimiento
   * @param {string} companyId - ID de la empresa
   * @param {Object} driveStructure - Estructura de carpetas de Google Drive
   * @returns {Promise<Object>} Registros creados
   */
  async createKnowledgeBaseRecords(companyId, driveStructure) {
    try {
      // 1. Crear registro principal de la base de conocimiento
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('company_knowledge_bases')
        .insert({
          company_id: companyId,
          drive_folder_id: driveStructure.mainFolder.id,
          drive_folder_url: driveStructure.mainFolder.url,
          status: 'active',
          settings: {
            auto_vectorize: true,
            auto_sync: true,
            supported_formats: ['pdf', 'doc', 'docx', 'txt', 'md'],
            max_file_size: 50 * 1024 * 1024, // 50MB
            embedding_model: 'groq'
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (kbError) throw kbError;

      // 2. Crear registros para las subcarpetas
      const folderRecords = Object.entries(driveStructure.subfolders).map(([key, folder]) => ({
        company_id: companyId,
        knowledge_base_id: knowledgeBase.id,
        folder_type: folder.type,
        drive_folder_id: folder.id,
        drive_folder_name: folder.name,
        created_at: new Date().toISOString()
      }));

      const { data: folders, error: foldersError } = await supabase
        .from('knowledge_folders')
        .insert(folderRecords)
        .select();

      if (foldersError) throw foldersError;

      const result = {
        knowledgeBase,
        folders: folders || []
      };

      console.log('💾 Registros de base de conocimiento creados:', result);
      return result;

    } catch (error) {
      console.error('Error creando registros en base de datos:', error);
      throw error;
    }
  }

  /**
   * Inicializar categorías por defecto para la empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Array>} Categorías creadas
   */
  async initializeDefaultCategories(companyId) {
    try {
      const defaultCategories = [
        {
          name: 'Información Corporativa',
          description: 'Información general sobre la empresa, misión, visión y valores',
          color: '#3B82F6',
          icon: 'building'
        },
        {
          name: 'Políticas Internas',
          description: 'Políticas de RRHH, seguridad, y procedimientos internos',
          color: '#EF4444',
          icon: 'shield'
        },
        {
          name: 'Productos y Servicios',
          description: 'Información detallada sobre productos y servicios ofrecidos',
          color: '#10B981',
          icon: 'package'
        },
        {
          name: 'Soporte Técnico',
          description: 'Guías de resolución de problemas y soporte técnico',
          color: '#F59E0B',
          icon: 'wrench'
        },
        {
          name: 'Capacitación',
          description: 'Material de capacitación y desarrollo profesional',
          color: '#8B5CF6',
          icon: 'academic-cap'
        },
        {
          name: 'Clientes',
          description: 'Información sobre clientes y casos de éxito',
          color: '#EC4899',
          icon: 'users'
        }
      ];

      const categoriesToInsert = defaultCategories.map(category => ({
        company_id: companyId,
        ...category,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert(categoriesToInsert)
        .select();

      if (error) throw error;

      console.log('📂 Categorías por defecto creadas:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('Error creando categorías por defecto:', error);
      throw error;
    }
  }

  /**
   * Crear FAQs iniciales basadas en el tipo de empresa
   * @param {Object} companyData - Datos de la empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Array>} FAQs creadas
   */
  async createInitialFAQs(companyData, companyId) {
    try {
      // Obtener categorías para asignar las FAQs
      const { data: categories, error: catError } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .eq('company_id', companyId);

      if (catError) throw catError;

      const categoryMap = {};
      categories?.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // FAQs generales aplicables a toda empresa
      const initialFAQs = [
        {
          question: '¿Cuál es la misión de la empresa?',
          answer: `La misión de ${companyData.name} es proporcionar excelentes servicios y productos que satisfagan las necesidades de nuestros clientes, manteniendo los más altos estándares de calidad y compromiso.`,
          keywords: 'misión, empresa, propósito, objetivos',
          category_id: categoryMap['Información Corporativa'] || null,
          priority: 1
        },
        {
          question: '¿Cuáles son los valores de la empresa?',
          answer: 'Nuestros valores se basan en la integridad, excelencia, innovación, trabajo en equipo y compromiso con el cliente.',
          keywords: 'valores, principios, cultura, ética',
          category_id: categoryMap['Información Corporativa'] || null,
          priority: 1
        },
        {
          question: '¿Cómo puedo solicitar soporte técnico?',
          answer: 'Para solicitar soporte técnico, puedes contactar al equipo de soporte a través del canal oficial de WhatsApp, enviar un email a soporte@empresa.com o utilizar el portal de autoservicio.',
          keywords: 'soporte, técnico, ayuda, asistencia',
          category_id: categoryMap['Soporte Técnico'] || null,
          priority: 1
        },
        {
          question: '¿Cuáles son los horarios de atención?',
          answer: 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM. Para emergencias, tenemos un canal disponible 24/7.',
          keywords: 'horario, atención, schedule, disponibilidad',
          category_id: categoryMap['Información Corporativa'] || null,
          priority: 2
        },
        {
          question: '¿Dónde puedo encontrar las políticas internas?',
          answer: 'Las políticas internas están disponibles en la carpeta "02_Politicas_Procedimientos" de Google Drive o través del portal de conocimiento interno.',
          keywords: 'políticas, internas, documentos, procedimientos',
          category_id: categoryMap['Políticas Internas'] || null,
          priority: 2
        }
      ];

      const faqsToInsert = initialFAQs.map(faq => ({
        company_id: companyId,
        ...faq,
        status: 'active',
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('faq_entries')
        .insert(faqsToInsert)
        .select();

      if (error) throw error;

      console.log('❓ FAQs iniciales creadas:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('Error creando FAQs iniciales:', error);
      throw error;
    }
  }

  /**
   * Configurar permisos y acceso a la base de conocimiento
   * @param {string} companyId - ID de la empresa
   * @param {string} userId - ID del usuario creador
   * @returns {Promise<Object>} Permisos configurados
   */
  async setupKnowledgePermissions(companyId, userId) {
    try {
      // 1. Dar acceso completo al creador
      const { error: permError } = await supabase
        .from('knowledge_permissions')
        .insert({
          company_id: companyId,
          user_id: userId,
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'manage'],
          created_at: new Date().toISOString()
        });

      if (permError) throw permError;

      console.log('🔐 Permisos configurados para el usuario:', userId);
      return { success: true, userId, role: 'admin' };

    } catch (error) {
      console.error('Error configurando permisos:', error);
      throw error;
    }
  }

  /**
   * Sincronizar documentos desde Google Drive y vectorizarlos
   * @param {string} companyId - ID de la empresa
   * @param {string} userId - ID del usuario para autenticación
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async syncAndVectorizeDocuments(companyId, userId) {
    try {
      console.log(`🔄 Iniciando sincronización y vectorización para empresa ${companyId}`);

      // 1. Obtener perfil de Google y autenticar
      const userProfile = await this.getUserGoogleProfile(userId);
      if (!userProfile?.google_refresh_token) {
        throw new Error('Usuario no tiene Google Drive configurado');
      }

      await googleDriveService.setTokens({
        refresh_token: userProfile.google_refresh_token
      });

      // 2. Obtener estructura de carpetas de la empresa
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('company_knowledge_bases')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (kbError || !knowledgeBase) {
        throw new Error('Base de conocimiento no encontrada');
      }

      // 3. Listar archivos en las carpetas
      const { data: folders, error: foldersError } = await supabase
        .from('knowledge_folders')
        .select('*')
        .eq('company_id', companyId);

      if (foldersError) throw foldersError;

      let totalProcessed = 0;
      let totalVectorized = 0;

      // 4. Procesar cada carpeta
      for (const folder of folders || []) {
        try {
          const files = await googleDriveService.listFiles(folder.drive_folder_id);
          
          for (const file of files) {
            // Ignorar carpetas
            if (file.mimeType === 'application/vnd.google-apps.folder') {
              continue;
            }

            totalProcessed++;

            // Verificar si ya está procesado
            const { data: existingDoc } = await supabase
              .from('knowledge_documents')
              .select('id')
              .eq('company_id', companyId)
              .eq('google_file_id', file.id)
              .single();

            if (existingDoc) {
              console.log(`⏭️  Archivo ya procesado: ${file.name}`);
              continue;
            }

            // Descargar y procesar el archivo
            const processed = await this.processAndVectorizeFile(
              file, 
              folder, 
              companyId, 
              userId
            );

            if (processed.success) {
              totalVectorized++;
              console.log(`✅ Archivo procesado: ${file.name}`);
            } else {
              console.error(`❌ Error procesando ${file.name}:`, processed.error);
            }
          }
        } catch (folderError) {
          console.error(`Error procesando carpeta ${folder.drive_folder_name}:`, folderError);
        }
      }

      const result = {
        success: true,
        companyId,
        totalProcessed,
        totalVectorized,
        message: `Sincronización completada: ${totalVectorized}/${totalProcessed} archivos vectorizados`
      };

      console.log('🎉 Sincronización completada:', result);
      return result;

    } catch (error) {
      console.error('Error en sincronización y vectorización:', error);
      throw error;
    }
  }

  /**
   * Procesar y vectorizar un archivo individual
   * @param {Object} file - Información del archivo de Google Drive
   * @param {Object} folder - Información de la carpeta
   * @param {string} companyId - ID de la empresa
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processAndVectorizeFile(file, folder, companyId, userId) {
    try {
      // 1. Descargar contenido del archivo
      const fileContent = await this.downloadFileContent(file);
      
      // 2. Extraer texto del contenido
      const extractedText = await fileContentExtractor.extractText(fileContent, file.mimeType);
      
      if (!extractedText || extractedText.trim().length === 0) {
        return { success: false, error: 'No se pudo extraer texto del archivo' };
      }

      // 3. Generar embeddings
      const embedding = await embeddingService.generateEmbedding(extractedText);

      // 4. Guardar en base de datos
      const { data: docData, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          company_id: companyId,
          folder_id: folder.id,
          google_file_id: file.id,
          title: file.name,
          content: extractedText,
          embedding: embedding,
          file_size: file.size || 0,
          file_type: file.mimeType,
          folder_type: folder.folder_type,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (docError) throw docError;

      // 5. Crear chunks para mejor búsqueda
      await this.createDocumentChunks(docData, extractedText, companyId);

      return { 
        success: true, 
        documentId: docData.id,
        title: file.name,
        chunksCreated: Math.ceil(extractedText.length / 8000)
      };

    } catch (error) {
      console.error(`Error procesando archivo ${file.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Descargar contenido de un archivo desde Google Drive
   * @param {Object} file - Información del archivo
   * @returns {Promise<ArrayBuffer>} Contenido del archivo
   */
  async downloadFileContent(file) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${googleDriveService.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error descargando archivo: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error descargando contenido del archivo:', error);
      throw error;
    }
  }

  /**
   * Crear chunks de documento para mejor búsqueda semántica
   * @param {Object} document - Documento guardado
   * @param {string} content - Contenido completo
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<number>} Número de chunks creados
   */
  async createDocumentChunks(document, content, companyId) {
    try {
      const CHUNK_SIZE = 8000; // Caracteres por chunk
      const OVERLAP = 200; // Solapamiento entre chunks
      
      const chunks = [];
      for (let i = 0; i < content.length; i += CHUNK_SIZE - OVERLAP) {
        const chunkContent = content.substring(i, i + CHUNK_SIZE);
        if (chunkContent.trim().length > 100) { // Mínimo 100 caracteres
          chunks.push({
            document_id: document.id,
            company_id: companyId,
            chunk_index: Math.floor(i / (CHUNK_SIZE - OVERLAP)),
            content: chunkContent,
            created_at: new Date().toISOString()
          });
        }
      }

      if (chunks.length === 0) return 0;

      // Generar embeddings para cada chunk
      for (const chunk of chunks) {
        const embedding = await embeddingService.generateEmbedding(chunk.content);
        chunk.embedding = embedding;
      }

      // Guardar chunks en base de datos
      const { error } = await supabase
        .from('knowledge_chunks')
        .insert(chunks);

      if (error) throw error;

      console.log(`📄 Created ${chunks.length} chunks for document ${document.title}`);
      return chunks.length;

    } catch (error) {
      console.error('Error creating document chunks:', error);
      return 0;
    }
  }

  /**
   * Buscar en la base de conocimiento de una empresa
   * @param {string} companyId - ID de la empresa
   * @param {string} query - Consulta de búsqueda
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Array>} Resultados de la búsqueda
   */
  async searchKnowledge(companyId, query, options = {}) {
    try {
      const {
        limit = 10,
        threshold = 0.7,
        includeFAQs = true,
        includeDocuments = true
      } = options;

      // Generar embedding de la consulta
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      let results = [];

      // Buscar en documentos
      if (includeDocuments) {
        const { data: docResults, error: docError } = await supabase
          .rpc('search_knowledge_documents', {
            p_company_id: companyId,
            p_query_embedding: queryEmbedding,
            p_similarity_threshold: threshold,
            p_limit: limit
          });

        if (!docError && docResults) {
          results = results.concat(docResults.map(doc => ({
            ...doc,
            type: 'document',
            relevance: doc.similarity
          })));
        }
      }

      // Buscar en FAQs
      if (includeFAQs) {
        const { data: faqResults, error: faqError } = await supabase
          .from('faq_entries')
          .select('*')
          .eq('company_id', companyId)
          .eq('status', 'active')
          .or(`question.ilike.%${query}%,answer.ilike.%${query}%,keywords.ilike.%${query}%`)
          .limit(limit);

        if (!faqError && faqResults) {
          results = results.concat(faqResults.map(faq => ({
            ...faq,
            type: 'faq',
            relevance: this.calculateTextRelevance(query, faq.question + ' ' + faq.answer)
          })));
        }
      }

      // Ordenar por relevancia y limitar resultados
      results.sort((a, b) => b.relevance - a.relevance);
      return results.slice(0, limit);

    } catch (error) {
      console.error('Error buscando en base de conocimiento:', error);
      return [];
    }
  }

  /**
   * Calcular relevancia de texto simple (similitud de palabras)
   * @param {string} query - Consulta
   * @param {string} text - Texto a comparar
   * @returns {number} Puntuación de relevancia (0-1)
   */
  calculateTextRelevance(query, text) {
    const queryWords = query.toLowerCase().split(/s+/);
    const textWords = text.toLowerCase().split(/s+/);
    
    const matches = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    );
    
    return matches.length / queryWords.length;
  }

  /**
   * Obtener estadísticas de la base de conocimiento
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<Object>} Estadísticas
   */
  async getKnowledgeStats(companyId) {
    try {
      const [
        docsCount,
        faqsCount,
        categoriesCount,
        chunksCount
      ] = await Promise.all([
        supabase.from('knowledge_documents').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('faq_entries').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('knowledge_categories').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('knowledge_chunks').select('id', { count: 'exact' }).eq('company_id', companyId)
      ]);

      return {
        documents: docsCount.count || 0,
        faqs: faqsCount.count || 0,
        categories: categoriesCount.count || 0,
        chunks: chunksCount.count || 0,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        documents: 0,
        faqs: 0,
        categories: 0,
        chunks: 0,
        lastUpdated: null
      };
    }
  }
}

// Crear y exportar instancia única
const companyKnowledgeService = new CompanyKnowledgeService();
export default companyKnowledgeService;