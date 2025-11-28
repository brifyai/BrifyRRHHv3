
-- Crear tabla principal de carpetas de empleados
CREATE TABLE IF NOT EXISTS employee_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_email TEXT NOT NULL,
    employee_id TEXT,
    employee_name TEXT,
    employee_position TEXT,
    employee_department TEXT,
    employee_phone TEXT,
    employee_region TEXT,
    employee_level TEXT,
    employee_work_mode TEXT,
    employee_contract_type TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT,
    drive_folder_id TEXT,
    drive_folder_url TEXT,
    local_folder_path TEXT,
    folder_status TEXT DEFAULT 'active' CHECK (folder_status IN ('active', 'inactive', 'syncing', 'error')),
    settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_employee_email UNIQUE (employee_email)
);

-- Crear tabla para documentos de empleados
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES employee_folders(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT,
    file_size BIGINT DEFAULT 0,
    google_file_id TEXT,
    local_file_path TEXT,
    file_url TEXT,
    description TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'error', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para FAQs de empleados
CREATE TABLE IF NOT EXISTS employee_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES employee_folders(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT,
    category TEXT,
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para historial de conversaciones
CREATE TABLE IF NOT EXISTS employee_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES employee_folders(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
    message_content TEXT NOT NULL,
    channel TEXT DEFAULT 'chat' CHECK (channel IN ('chat', 'whatsapp', 'telegram', 'email')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de notificaciones por empleado
CREATE TABLE IF NOT EXISTS employee_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES employee_folders(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT true,
    telegram_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    response_language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Santiago',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_folder_notification UNIQUE (folder_id)
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_ef_employee_email ON employee_folders(employee_email);
CREATE INDEX IF NOT EXISTS idx_ef_company_id ON employee_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_ef_drive_folder_id ON employee_folders(drive_folder_id);
CREATE INDEX IF NOT EXISTS idx_ef_folder_status ON employee_folders(folder_status);
CREATE INDEX IF NOT EXISTS idx_ef_created_at ON employee_folders(created_at);

CREATE INDEX IF NOT EXISTS idx_ed_folder_id ON employee_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_ed_google_file_id ON employee_documents(google_file_id);
CREATE INDEX IF NOT EXISTS idx_ed_document_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_ed_status ON employee_documents(status);
CREATE INDEX IF NOT EXISTS idx_ed_tags ON employee_documents USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_efaq_folder_id ON employee_faqs(folder_id);
CREATE INDEX IF NOT EXISTS idx_efaq_status ON employee_faqs(status);
CREATE INDEX IF NOT EXISTS idx_efaq_category ON employee_faqs(category);
CREATE INDEX IF NOT EXISTS idx_efaq_priority ON employee_faqs(priority);

CREATE INDEX IF NOT EXISTS idx_ec_folder_id ON employee_conversations(folder_id);
CREATE INDEX IF NOT EXISTS idx_ec_message_type ON employee_conversations(message_type);
CREATE INDEX IF NOT EXISTS idx_ec_channel ON employee_conversations(channel);
CREATE INDEX IF NOT EXISTS idx_ec_created_at ON employee_conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_ens_folder_id ON employee_notification_settings(folder_id);
