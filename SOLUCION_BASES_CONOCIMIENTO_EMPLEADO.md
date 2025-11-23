# Solución Completa: Bases de Conocimiento por Empleado

## 🎯 OBJETIVO

Crear un sistema de **bases de conocimiento por empleado** que permita a una IA responder mensajes de WhatsApp basándose en el contenido específico de las carpetas de cada usuario, corrigiendo los problemas actuales y mejorando la arquitectura.

## 📋 PROBLEMAS ACTUALES A CORREGIR

### 1. **Gestión de Tokens Inconsistente**
```
❌ Actual:
- googleDrive.js: `google_drive_tokens` (JSON) - Sin validación/refresh
- hybridGoogleDrive.js: `google_drive_token` (string) - Con validación, sin refresh

✅ Solución:
- Unificar en GoogleDriveAuthService
- Refresh automático de tokens
- Validación centralizada
```

### 2. **Arquitectura Híbrida Confusa (4 capas → 2 capas)**
```
❌ Actual (1,329 líneas):
- googleDrive.js (413 líneas)
- localGoogleDrive.js (318 líneas) 
- hybridGoogleDrive.js (218 líneas)
- googleDriveSyncService.js (380 líneas)

✅ Solución (~600 líneas):
- GoogleDriveAuthService (nueva)
- GoogleDriveService (refactorizado)
- GoogleDriveSyncService (refactorizado)
```

### 3. **Falta de Escalabilidad**
```
❌ Actual:
- Cache en memoria puede saturarse
- Sin rate limiting por empresa
- Sin circuit breakers

✅ Solución:
- Redis para cache distribuido
- Rate limiting por empresa
- Circuit breakers configurados
```

## 🏗️ ARQUITECTURA PROPUESTA

### **Flujo Principal:**
```
WhatsApp → n8n → Supabase → Employee Knowledge Base → IA Response
    ↓           ↓         ↓              ↓              ↓
Empresa X → Employee Y → Google Drive → Embeddings → Groq AI
```

### **Componentes Principales:**

#### 1. **GoogleDriveAuthService** (NUEVO)
```javascript
class GoogleDriveAuthService {
  // Gestión centralizada de tokens
  // Refresh automático
  // Validación en cada operación
  // Logging detallado
}
```

#### 2. **EmployeeKnowledgeService** (NUEVO)
```javascript
class EmployeeKnowledgeService {
  // Crear base de conocimiento por empleado
  // Sincronizar documentos de carpeta personal
  // Generar embeddings por empleado
  // Buscar en conocimiento específico del empleado
}
```

#### 3. **WhatsAppAIWithEmployeeKnowledge** (NUEVO)
```javascript
class WhatsAppAIWithEmployeeKnowledge {
  // Recibir mensaje de WhatsApp
  // Identificar empleado/empresa
  // Buscar en base de conocimiento específica
  // Generar respuesta con contexto del empleado
  // Enviar respuesta vía n8n
}
```

## 📊 ESQUEMA DE BASE DE DATOS

### **Tablas Nuevas/Requeridas:**

#### 1. **employee_knowledge_bases**
```sql
CREATE TABLE employee_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email VARCHAR(255) UNIQUE NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id),
  drive_folder_id VARCHAR(255) NOT NULL,
  drive_folder_url TEXT,
  knowledge_status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  embedding_model VARCHAR(100) DEFAULT 'groq',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **employee_knowledge_documents**
```sql
CREATE TABLE employee_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_knowledge_base_id UUID REFERENCES employee_knowledge_bases(id),
  google_file_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  embedding VECTOR(1536), -- Para embeddings de Groq
  file_type VARCHAR(100),
  file_size BIGINT,
  chunk_index INTEGER,
  chunk_content TEXT,
  chunk_embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **whatsapp_conversations_with_knowledge**
```sql
CREATE TABLE whatsapp_conversations_with_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id),
  user_message TEXT NOT NULL,
  ai_response TEXT,
  knowledge_sources JSONB, -- Documentos usados como fuente
  confidence_score FLOAT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 FLUJO DE TRABAJO COMPLETO

### **1. Creación de Base de Conocimiento por Empleado**

```javascript
async createEmployeeKnowledgeBase(employeeEmail, employeeName, companyId) {
  try {
    // 1. Verificar que existe carpeta en Google Drive
    const folder = await googleDriveService.getEmployeeFolder(employeeEmail);
    
    // 2. Crear registro en employee_knowledge_bases
    const knowledgeBase = await supabase
      .from('employee_knowledge_bases')
      .insert({
        employee_email: employeeEmail,
        employee_name: employeeName,
        company_id: companyId,
        drive_folder_id: folder.id,
        drive_folder_url: folder.url
      })
      .select()
      .single();
    
    // 3. Sincronizar y vectorizar documentos
    await syncEmployeeDocuments(knowledgeBase.id);
    
    return knowledgeBase;
  } catch (error) {
    console.error('Error creating employee knowledge base:', error);
    throw error;
  }
}
```

### **2. Sincronización de Documentos por Empleado**

```javascript
async syncEmployeeDocuments(knowledgeBaseId) {
  const knowledgeBase = await getKnowledgeBaseById(knowledgeBaseId);
  
  // 1. Listar archivos en la carpeta del empleado
  const files = await googleDriveService.listFiles(knowledgeBase.drive_folder_id);
  
  for (const file of files) {
    if (file.mimeType !== 'application/vnd.google-apps.folder') {
      // 2. Descargar y procesar archivo
      const content = await downloadFileContent(file);
      const extractedText = await extractText(content, file.mimeType);
      
      // 3. Crear chunks y embeddings
      const chunks = splitIntoChunks(extractedText);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await groqService.generateEmbedding(chunk);
        
        // 4. Guardar en employee_knowledge_documents
        await supabase
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
            file_size: file.size
          });
      }
    }
  }
  
  // 5. Actualizar timestamp de sincronización
  await supabase
    .from('employee_knowledge_bases')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', knowledgeBaseId);
}
```

### **3. IA con Conocimiento del Empleado**

```javascript
async generateResponseWithEmployeeKnowledge(userMessage, employeeEmail) {
  try {
    // 1. Obtener base de conocimiento del empleado
    const knowledgeBase = await getEmployeeKnowledgeBase(employeeEmail);
    
    if (!knowledgeBase) {
      return generateGenericResponse(userMessage);
    }
    
    // 2. Generar embedding de la consulta
    const queryEmbedding = await groqService.generateEmbedding(userMessage);
    
    // 3. Buscar documentos relevantes del empleado
    const relevantDocs = await supabase
      .rpc('search_employee_knowledge', {
        p_employee_email: employeeEmail,
        p_query_embedding: queryEmbedding,
        p_similarity_threshold: 0.7,
        p_limit: 5
      });
    
    // 4. Construir contexto con documentos del empleado
    const context = relevantDocs.map(doc => doc.chunk_content).join('\n\n');
    
    // 5. Generar respuesta con IA
    const prompt = buildPromptWithEmployeeContext(userMessage, context, knowledgeBase);
    const aiResponse = await groqService.generateResponse(prompt);
    
    // 6. Registrar conversación
    await supabase
      .from('whatsapp_conversations_with_knowledge')
      .insert({
        employee_email: employeeEmail,
        company_id: knowledgeBase.company_id,
        user_message: userMessage,
        ai_response: aiResponse,
        knowledge_sources: relevantDocs.map(doc => ({
          title: doc.title,
          similarity: doc.similarity,
          chunk_index: doc.chunk_index
        })),
        confidence_score: calculateConfidence(relevantDocs)
      });
    
    return aiResponse;
    
  } catch (error) {
    console.error('Error generating response with employee knowledge:', error);
    return generateFallbackResponse(userMessage);
  }
}
```

## 🔗 INTEGRACIÓN CON N8N

### **Webhook de n8n para WhatsApp**

```javascript
// n8n Webhook Endpoint
app.post('/webhook/n8n/whatsapp', async (req, res) => {
  try {
    const { message, from, company_id } = req.body;
    
    // 1. Identificar empleado por número de WhatsApp
    const employee = await identifyEmployeeByWhatsApp(from, company_id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    
    // 2. Generar respuesta con conocimiento del empleado
    const response = await generateResponseWithEmployeeKnowledge(
      message, 
      employee.email
    );
    
    // 3. Enviar respuesta vía n8n
    await sendWhatsAppMessage(from, response);
    
    res.json({ success: true, response });
    
  } catch (error) {
    console.error('Error in n8n webhook:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### **Configuración de n8n Workflow**

```json
{
  "name": "WhatsApp AI con Conocimiento de Empleado",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp-message",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Identificar Empleado",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tu-app.com/api/identify-employee",
        "method": "POST",
        "body": {
          "whatsapp_number": "{{$json.from}}",
          "company_id": "{{$json.company_id}}"
        }
      }
    },
    {
      "name": "Generar IA Response",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tu-app.com/api/ai/employee-knowledge",
        "method": "POST",
        "body": {
          "message": "{{$json.message}}",
          "employee_email": "{{$node['Identificar Empleado'].json.email}}"
        }
      }
    },
    {
      "name": "Enviar WhatsApp",
      "type": "n8n-nodes-base.whatsApp",
      "parameters": {
        "to": "{{$json.from}}",
        "message": "{{$node['Generar IA Response'].json.response}}"
      }
    }
  ]
}
```

## 🛠️ IMPLEMENTACIÓN POR FASES

### **Fase 1: Corrección de Google Drive (Semana 1-2)**

#### 1.1 Crear GoogleDriveAuthService
```javascript
// src/lib/googleDriveAuthService.js
class GoogleDriveAuthService {
  constructor() {
    this.tokenKey = 'google_drive_tokens_unified';
    this.refreshThreshold = 5 * 60 * 1000; // 5 minutos antes de expirar
  }
  
  async getValidToken() {
    const tokens = this.getStoredTokens();
    
    if (!tokens) {
      throw new Error('No hay tokens de Google Drive configurados');
    }
    
    // Verificar si necesita refresh
    if (this.needsRefresh(tokens)) {
      const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);
      this.storeTokens(refreshedTokens);
      return refreshedTokens.access_token;
    }
    
    return tokens.access_token;
  }
  
  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const data = await response.json();
    return {
      ...data,
      refresh_token: refreshToken, // Mantener el refresh token original
      expires_at: Date.now() + (data.expires_in * 1000)
    };
  }
}
```

#### 1.2 Refactorizar GoogleDriveService
```javascript
// src/lib/googleDriveService.js
class GoogleDriveService {
  constructor() {
    this.authService = new GoogleDriveAuthService();
  }
  
  async createFolder(name, parentId = null) {
    const accessToken = await this.authService.getValidToken();
    
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    if (parentId) {
      fileMetadata.parents = [parentId];
    }
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });
    
    return await response.json();
  }
}
```

### **Fase 2: Sistema de Conocimiento por Empleado (Semana 3-4)**

#### 2.1 Crear EmployeeKnowledgeService
```javascript
// src/services/employeeKnowledgeService.js
class EmployeeKnowledgeService {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.googleDriveService = new GoogleDriveService();
  }
  
  async createEmployeeKnowledgeBase(employeeData) {
    // Implementar lógica completa
  }
  
  async syncEmployeeDocuments(knowledgeBaseId) {
    // Implementar sincronización
  }
  
  async searchEmployeeKnowledge(employeeEmail, query, limit = 5) {
    // Implementar búsqueda semántica
  }
}
```

#### 2.2 Crear funciones SQL para búsqueda
```sql
-- Función para buscar en conocimiento del empleado
CREATE OR REPLACE FUNCTION search_employee_knowledge(
  p_employee_email VARCHAR,
  p_query_embedding VECTOR,
  p_similarity_threshold FLOAT DEFAULT 0.7,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  title TEXT,
  chunk_content TEXT,
  similarity FLOAT,
  chunk_index INTEGER
)
LANGUAGE SQL
AS $$
  SELECT 
    ekd.title,
    ekd.chunk_content,
    1 - (ekd.chunk_embedding <=> p_query_embedding) as similarity,
    ekd.chunk_index
  FROM employee_knowledge_documents ekd
  JOIN employee_knowledge_bases ekb ON ekd.employee_knowledge_base_id = ekb.id
  WHERE ekb.employee_email = p_employee_email
    AND ekb.knowledge_status = 'active'
  ORDER BY ekd.chunk_embedding <=> p_query_embedding
  LIMIT p_limit;
$$;
```

### **Fase 3: Integración con WhatsApp y n8n (Semana 5-6)**

#### 3.1 Crear WhatsAppAIWithEmployeeKnowledge
```javascript
// src/services/whatsappAIWithEmployeeKnowledge.js
class WhatsAppAIWithEmployeeKnowledge {
  constructor() {
    this.employeeKnowledgeService = new EmployeeKnowledgeService();
    this.groqService = new GroqService();
  }
  
  async processWhatsAppMessage(messageData) {
    // Implementar flujo completo
  }
}
```

#### 3.2 Configurar webhooks y endpoints
```javascript
// src/routes/whatsappRoutes.js
import express from 'express';
import { WhatsAppAIWithEmployeeKnowledge } from '../services/';

const router = express.Router();
const whatsappAI = new WhatsAppAIWithEmployeeKnowledge();

router.post('/webhook/n8n', whatsappAI.processWebhook.bind(whatsappAI));
router.post('/identify-employee', whatsappAI.identifyEmployee.bind(whatsappAI));
router.post('/ai/employee-knowledge', whatsappAI.generateResponse.bind(whatsappAI));

export default router;
```

### **Fase 4: Optimización y Escalabilidad (Semana 7-8)**

#### 4.1 Implementar Redis para cache
```javascript
// src/lib/redisCache.js
import Redis from 'ioredis';

class RedisCache {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value, ttl = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

#### 4.2 Implementar rate limiting
```javascript
// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

const createEmployeeRateLimiter = (companyId) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    keyGenerator: (req) => `${companyId}_${req.ip}`,
    message: 'Demasiadas solicitudes para esta empresa'
  });
};
```

## 📊 MÉTRICAS Y MONITOREO

### **Dashboard de Conocimiento por Empleado**

```javascript
// Métricas a trackear
const metrics = {
  employeeKnowledgeBases: 'Total de bases de conocimiento por empleado',
  documentsPerEmployee: 'Documentos procesados por empleado',
  aiResponsesWithKnowledge: 'Respuestas de IA usando conocimiento del empleado',
  knowledgeAccuracy: 'Precisión de las respuestas (feedback del usuario)',
  syncSuccess: 'Tasa de éxito de sincronización',
  responseTime: 'Tiempo de generación de respuesta'
};
```

### **Alertas Automáticas**

```javascript
// Alertas críticas
const alerts = {
  syncFailure: 'Fallo en sincronización de documentos',
  lowKnowledgeAccuracy: 'Precisión de respuestas < 70%',
  highResponseTime: 'Tiempo de respuesta > 5 segundos',
  tokenExpiration: 'Tokens de Google Drive próximos a expirar'
};
```

## 🎯 BENEFICIOS ESPERADOS

### **Para la Empresa:**
1. **Respuestas más precisas** - IA conoce el contexto específico de cada empleado
2. **Reducción de tiempo de respuesta** - Automatización inteligente
3. **Mejor experiencia del empleado** - Respuestas personalizadas
4. **Escalabilidad** - Sistema robusto para 500 empresas y 30,000 empleados

### **Para los Empleados:**
1. **Respuestas relevantes** - Basadas en sus documentos específicos
2. **Disponibilidad 24/7** - IA siempre disponible
3. **Contexto preservado** - La IA recuerda el contenido de su carpeta
4. **Mejora continua** - El sistema aprende de cada interacción

## 🚀 PRÓXIMOS PASOS

1. **Implementar Fase 1** - Corrección de Google Drive
2. **Crear esquema de base de datos** - Tablas para conocimiento por empleado
3. **Desarrollar EmployeeKnowledgeService** - Lógica de sincronización
4. **Integrar con n8n** - Workflows de WhatsApp
5. **Probar con empleados piloto** - Validar funcionalidad
6. **Escalar a todas las empresas** - Rollout gradual

Esta solución te permitirá tener un sistema de IA que realmente conoce el contexto de cada empleado y puede dar respuestas precisas basadas en sus documentos específicos, mientras corrige todos los problemas actuales de arquitectura.