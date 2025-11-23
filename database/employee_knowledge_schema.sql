-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA BASES DE CONOCIMIENTO POR EMPLEADO
-- =====================================================

-- 1. Tabla principal de bases de conocimiento por empleado
CREATE TABLE employee_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email VARCHAR(255) UNIQUE NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  drive_folder_id VARCHAR(255) NOT NULL,
  drive_folder_url TEXT,
  knowledge_status VARCHAR(50) DEFAULT 'active' CHECK (knowledge_status IN ('active', 'syncing', 'error', 'inactive')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  embedding_model VARCHAR(100) DEFAULT 'groq',
  sync_errors JSONB DEFAULT '[]',
  total_documents INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de documentos de conocimiento por empleado
CREATE TABLE employee_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_knowledge_base_id UUID REFERENCES employee_knowledge_bases(id) ON DELETE CASCADE,
  google_file_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  embedding VECTOR(1536), -- Para embeddings de Groq
  file_type VARCHAR(100),
  file_size BIGINT,
  chunk_index INTEGER,
  chunk_content TEXT,
  chunk_embedding VECTOR(1536),
  similarity_score FLOAT DEFAULT 0,
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de conversaciones de WhatsApp con conocimiento
CREATE TABLE whatsapp_conversations_with_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id),
  whatsapp_number VARCHAR(50),
  user_message TEXT NOT NULL,
  ai_response TEXT,
  knowledge_sources JSONB, -- Documentos usados como fuente
  confidence_score FLOAT,
  processing_time_ms INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de configuración de empleados para WhatsApp
CREATE TABLE employee_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email VARCHAR(255) UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id),
  whatsapp_number VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  auto_response_enabled BOOLEAN DEFAULT true,
  knowledge_base_enabled BOOLEAN DEFAULT true,
  response_language VARCHAR(10) DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de métricas de conocimiento por empleado
CREATE TABLE employee_knowledge_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_email VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id),
  date DATE DEFAULT CURRENT_DATE,
  total_questions INTEGER DEFAULT 0,
  successful_responses INTEGER DEFAULT 0,
  average_confidence FLOAT DEFAULT 0,
  average_response_time_ms INTEGER DEFAULT 0,
  documents_accessed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_email, date)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para employee_knowledge_bases
CREATE INDEX idx_employee_knowledge_bases_email ON employee_knowledge_bases(employee_email);
CREATE INDEX idx_employee_knowledge_bases_company ON employee_knowledge_bases(company_id);
CREATE INDEX idx_employee_knowledge_bases_status ON employee_knowledge_bases(knowledge_status);

-- Índices para employee_knowledge_documents
CREATE INDEX idx_employee_knowledge_documents_base_id ON employee_knowledge_documents(employee_knowledge_base_id);
CREATE INDEX idx_employee_knowledge_documents_google_file ON employee_knowledge_documents(google_file_id);
CREATE INDEX idx_employee_knowledge_documents_embedding ON employee_knowledge_documents USING ivfflat (embedding vector_cosine_ops);

-- Índices para whatsapp_conversations
CREATE INDEX idx_whatsapp_conversations_email ON whatsapp_conversations_with_knowledge(employee_email);
CREATE INDEX idx_whatsapp_conversations_company ON whatsapp_conversations_with_knowledge(company_id);
CREATE INDEX idx_whatsapp_conversations_date ON whatsapp_conversations_with_knowledge(created_at);

-- Índices para employee_whatsapp_config
CREATE INDEX idx_employee_whatsapp_config_email ON employee_whatsapp_config(employee_email);
CREATE INDEX idx_employee_whatsapp_config_whatsapp ON employee_whatsapp_config(whatsapp_number);
CREATE INDEX idx_employee_whatsapp_config_company ON employee_whatsapp_config(company_id);

-- =====================================================
-- FUNCIONES SQL PARA BÚSQUEDA SEMÁNTICA
-- =====================================================

-- Función para buscar en conocimiento del empleado
CREATE OR REPLACE FUNCTION search_employee_knowledge(
  p_employee_email VARCHAR,
  p_query_embedding VECTOR,
  p_similarity_threshold FLOAT DEFAULT 0.7,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  document_id UUID,
  title TEXT,
  chunk_content TEXT,
  similarity FLOAT,
  chunk_index INTEGER,
  file_type VARCHAR,
  google_file_id VARCHAR
)
LANGUAGE SQL
AS $$
  SELECT 
    ekd.id as document_id,
    ekd.title,
    ekd.chunk_content,
    1 - (ekd.chunk_embedding <=> p_query_embedding) as similarity,
    ekd.chunk_index,
    ekd.file_type,
    ekd.google_file_id
  FROM employee_knowledge_documents ekd
  JOIN employee_knowledge_bases ekb ON ekd.employee_knowledge_base_id = ekb.id
  WHERE ekb.employee_email = p_employee_email
    AND ekb.knowledge_status = 'active'
    AND ekd.processing_status = 'completed'
    AND (1 - (ekd.chunk_embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY ekd.chunk_embedding <=> p_query_embedding
  LIMIT p_limit;
$$;

-- Función para obtener estadísticas de conocimiento por empleado
CREATE OR REPLACE FUNCTION get_employee_knowledge_stats(p_employee_email VARCHAR)
RETURNS JSON
LANGUAGE SQL
AS $$
  SELECT json_build_object(
    'total_documents', (
      SELECT COUNT(*) 
      FROM employee_knowledge_documents ekd
      JOIN employee_knowledge_bases ekb ON ekd.employee_knowledge_base_id = ekb.id
      WHERE ekb.employee_email = p_employee_email
    ),
    'total_chunks', (
      SELECT COUNT(*) 
      FROM employee_knowledge_documents ekd
      JOIN employee_knowledge_bases ekb ON ekd.employee_knowledge_base_id = ekb.id
      WHERE ekb.employee_email = p_employee_email
      AND ekd.chunk_content IS NOT NULL
    ),
    'last_sync', (
      SELECT ekb.last_sync_at
      FROM employee_knowledge_bases ekb
      WHERE ekb.employee_email = p_employee_email
    ),
    'knowledge_status', (
      SELECT ekb.knowledge_status
      FROM employee_knowledge_bases ekb
      WHERE ekb.employee_email = p_employee_email
    ),
    'total_conversations', (
      SELECT COUNT(*)
      FROM whatsapp_conversations_with_knowledge
      WHERE employee_email = p_employee_email
    )
  );
$$;

-- Función para actualizar métricas de conversación
CREATE OR REPLACE FUNCTION update_conversation_metrics(
  p_employee_email VARCHAR,
  p_company_id UUID,
  p_confidence_score FLOAT,
  p_processing_time_ms INTEGER,
  p_documents_accessed INTEGER
)
RETURNS VOID
LANGUAGE SQL
AS $$
  INSERT INTO employee_knowledge_metrics (
    employee_email,
    company_id,
    date,
    total_questions,
    successful_responses,
    average_confidence,
    average_response_time_ms,
    documents_accessed
  )
  VALUES (
    p_employee_email,
    p_company_id,
    CURRENT_DATE,
    1,
    CASE WHEN p_confidence_score >= 0.7 THEN 1 ELSE 0 END,
    p_confidence_score,
    p_processing_time_ms,
    p_documents_accessed
  )
  ON CONFLICT (employee_email, date)
  DO UPDATE SET
    total_questions = employee_knowledge_metrics.total_questions + 1,
    successful_responses = employee_knowledge_metrics.successful_responses + 
      CASE WHEN p_confidence_score >= 0.7 THEN 1 ELSE 0 END,
    average_confidence = (
      (employee_knowledge_metrics.average_confidence * employee_knowledge_metrics.total_questions + p_confidence_score) /
      (employee_knowledge_metrics.total_questions + 1)
    ),
    average_response_time_ms = (
      (employee_knowledge_metrics.average_response_time_ms * employee_knowledge_metrics.total_questions + p_processing_time_ms) /
      (employee_knowledge_metrics.total_questions + 1)
    ),
    documents_accessed = employee_knowledge_metrics.documents_accessed + p_documents_accessed,
    updated_at = NOW();
$$;

-- =====================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER update_employee_knowledge_bases_updated_at 
  BEFORE UPDATE ON employee_knowledge_bases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_knowledge_documents_updated_at 
  BEFORE UPDATE ON employee_knowledge_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_whatsapp_config_updated_at 
  BEFORE UPDATE ON employee_whatsapp_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE employee_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations_with_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_knowledge_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para employee_knowledge_bases
CREATE POLICY "Users can view their company's employee knowledge bases" 
  ON employee_knowledge_bases FOR SELECT 
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's employee knowledge bases" 
  ON employee_knowledge_bases FOR ALL 
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Políticas similares para las demás tablas...
-- (Se pueden agregar más políticas según las necesidades específicas)

-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING
-- =====================================================

-- Insertar configuración de ejemplo para un empleado
INSERT INTO employee_whatsapp_config (
  employee_email,
  company_id,
  whatsapp_number,
  is_active,
  auto_response_enabled,
  knowledge_base_enabled
) VALUES (
  'juan.perez@empresa.com',
  (SELECT id FROM companies LIMIT 1),
  '+56912345678',
  true,
  true,
  true
);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE employee_knowledge_bases IS 'Bases de conocimiento individuales para cada empleado';
COMMENT ON TABLE employee_knowledge_documents IS 'Documentos y chunks vectorizados de cada empleado';
COMMENT ON TABLE whatsapp_conversations_with_knowledge IS 'Conversaciones de WhatsApp procesadas con IA y conocimiento del empleado';
COMMENT ON TABLE employee_whatsapp_config IS 'Configuración de WhatsApp por empleado';
COMMENT ON TABLE employee_knowledge_metrics IS 'Métricas diarias de uso de conocimiento por empleado';

COMMENT ON FUNCTION search_employee_knowledge IS 'Busca contenido relevante en la base de conocimiento de un empleado específico';
COMMENT ON FUNCTION get_employee_knowledge_stats IS 'Obtiene estadísticas completas de la base de conocimiento de un empleado';
COMMENT ON FUNCTION update_conversation_metrics IS 'Actualiza métricas de conversación de forma incremental';