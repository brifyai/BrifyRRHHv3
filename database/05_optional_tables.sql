-- ========================================
-- TABLAS OPCIONALES PARA STAFFHUB
-- Features adicionales (Gamification, Analytics, Google Drive)
-- ========================================

-- ========================================
-- GAMIFICATION SYSTEM
-- ========================================

-- 1. GAMIFICATION_LEVELS (Niveles)
CREATE TABLE IF NOT EXISTS gamification_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_number INTEGER NOT NULL UNIQUE,
    level_name TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    benefits JSONB DEFAULT '{}'::jsonb,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gamification_levels_number ON gamification_levels(level_number);

-- 2. ACHIEVEMENTS (Logros)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    points_reward INTEGER DEFAULT 0,
    badge_icon_url TEXT,
    criteria JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active);

-- 3. EMPLOYEE_GAMIFICATION (Gamificación por empleado)
CREATE TABLE IF NOT EXISTS employee_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    achievements_unlocked UUID[] DEFAULT ARRAY[]::UUID[],
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_gamification_employee ON employee_gamification(employee_id);
CREATE INDEX idx_employee_gamification_points ON employee_gamification(total_points DESC);
CREATE INDEX idx_employee_gamification_level ON employee_gamification(current_level);

-- 4. LEADERBOARDS (Tablas de clasificación)
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    leaderboard_type VARCHAR(50) CHECK (leaderboard_type IN ('points', 'achievements', 'streak', 'custom')),
    period VARCHAR(50) CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_type ON leaderboards(leaderboard_type);
CREATE INDEX idx_leaderboards_company ON leaderboards(company_id);
CREATE INDEX idx_leaderboards_active ON leaderboards(is_active);

-- 5. REWARDS (Recompensas)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    reward_type VARCHAR(50) CHECK (reward_type IN ('badge', 'points', 'physical', 'discount', 'other')),
    points_cost INTEGER,
    quantity_available INTEGER,
    quantity_claimed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rewards_company ON rewards(company_id);
CREATE INDEX idx_rewards_type ON rewards(reward_type);
CREATE INDEX idx_rewards_active ON rewards(is_active);

-- ========================================
-- ANALYTICS SYSTEM
-- ========================================

-- 6. MESSAGE_ANALYSIS (Análisis de mensajes)
CREATE TABLE IF NOT EXISTS message_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_message TEXT NOT NULL,
    analyzed_message TEXT,
    sentiment VARCHAR(50),
    topics TEXT[],
    keywords TEXT[],
    language VARCHAR(10),
    confidence_score DECIMAL(5,2),
    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_analysis_sentiment ON message_analysis(sentiment);
CREATE INDEX idx_message_analysis_created ON message_analysis(created_at DESC);

-- 7. ANALYTICS_TEST_REPORTS (Reportes de pruebas)
CREATE TABLE IF NOT EXISTS analytics_test_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_data JSONB NOT NULL,
    report_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_test_reports_type ON analytics_test_reports(report_type);
CREATE INDEX idx_analytics_test_reports_created ON analytics_test_reports(created_at DESC);

-- 8. COMPANY_METRICS (Métricas de empresas)
CREATE TABLE IF NOT EXISTS company_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_unit VARCHAR(50),
    period_start DATE,
    period_end DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_metrics_company ON company_metrics(company_id);
CREATE INDEX idx_company_metrics_name ON company_metrics(metric_name);
CREATE INDEX idx_company_metrics_period ON company_metrics(period_start, period_end);

-- ========================================
-- GOOGLE DRIVE INTEGRATION
-- ========================================

-- 9. USER_GOOGLE_DRIVE_CREDENTIALS (Credenciales de Drive)
CREATE TABLE IF NOT EXISTS user_google_drive_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_google_drive_user ON user_google_drive_credentials(user_id);
CREATE INDEX idx_user_google_drive_company ON user_google_drive_credentials(company_id);
CREATE INDEX idx_user_google_drive_active ON user_google_drive_credentials(is_active);

-- 10. GOOGLE_DRIVE_TOKENS (Tokens de Drive)
CREATE TABLE IF NOT EXISTS google_drive_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_drive_tokens_user ON google_drive_tokens(user_id);
CREATE INDEX idx_google_drive_tokens_expires ON google_drive_tokens(expires_at);

-- 11. GOOGLE_DRIVE_PERMISSIONS (Permisos de Drive)
CREATE TABLE IF NOT EXISTS google_drive_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    folder_id TEXT NOT NULL,
    permission_id TEXT,
    permission_type VARCHAR(50) CHECK (permission_type IN ('reader', 'writer', 'commenter', 'owner')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_drive_permissions_company ON google_drive_permissions(company_id);
CREATE INDEX idx_google_drive_permissions_employee ON google_drive_permissions(employee_id);
CREATE INDEX idx_google_drive_permissions_folder ON google_drive_permissions(folder_id);
CREATE INDEX idx_google_drive_permissions_active ON google_drive_permissions(is_active);

-- 12. NON_GMAIL_EMPLOYEES (Empleados sin Gmail)
CREATE TABLE IF NOT EXISTS non_gmail_employees (
    id SERIAL PRIMARY KEY,
    employee_email VARCHAR(255) NOT NULL UNIQUE,
    employee_name VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_non_gmail_employees_email ON non_gmail_employees(employee_email);
CREATE INDEX idx_non_gmail_employees_company ON non_gmail_employees(company_id);

-- 13. DRIVE_SYNC_LOG (Log de sincronización)
CREATE TABLE IF NOT EXISTS drive_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_email TEXT NOT NULL,
    folder_id TEXT,
    action VARCHAR(50) CHECK (action IN ('created', 'updated', 'deleted', 'permission_granted', 'permission_revoked')),
    status VARCHAR(50) CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drive_sync_log_email ON drive_sync_log(employee_email);
CREATE INDEX idx_drive_sync_log_action ON drive_sync_log(action);
CREATE INDEX idx_drive_sync_log_status ON drive_sync_log(status);
CREATE INDEX idx_drive_sync_log_created ON drive_sync_log(created_at DESC);

-- 14. DRIVE_SYNC_TOKENS (Tokens de sincronización)
CREATE TABLE IF NOT EXISTS drive_sync_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_page_token TEXT,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. DRIVE_WEBHOOK_CHANNELS (Canales de webhook)
CREATE TABLE IF NOT EXISTS drive_webhook_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT NOT NULL UNIQUE,
    resource_id TEXT NOT NULL,
    resource_uri TEXT,
    expiration TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drive_webhook_channels_channel ON drive_webhook_channels(channel_id);
CREATE INDEX idx_drive_webhook_channels_active ON drive_webhook_channels(is_active);

-- ========================================
-- GENERAL TABLES
-- ========================================

-- 16. FOLDERS (Carpetas generales)
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    folder_type VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folders_company ON folders(company_id);
CREATE INDEX idx_folders_parent ON folders(parent_folder_id);
CREATE INDEX idx_folders_type ON folders(folder_type);

-- 17. DOCUMENTS (Documentos generales)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    file_url TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_type ON documents(file_type);

-- 18. KNOWLEDGE_CHUNKS (Chunks para vectorización)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_company ON knowledge_chunks(company_id);

-- 19. USER_CREDENTIALS (Credenciales de usuario)
CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_name)
);

CREATE INDEX idx_user_credentials_user ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_service ON user_credentials(service_name);
CREATE INDEX idx_user_credentials_active ON user_credentials(is_active);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Gamification (visible para todos en la empresa)
ALTER TABLE gamification_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gamification levels" ON gamification_levels FOR SELECT USING (true);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE employee_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gamification in their companies"
    ON employee_gamification FOR SELECT
    USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN user_companies uc ON e.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Google Drive (solo el usuario propietario)
ALTER TABLE user_google_drive_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own drive credentials"
    ON user_google_drive_credentials FOR ALL
    USING (user_id = auth.uid());

ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own drive tokens"
    ON google_drive_tokens FOR ALL
    USING (user_id = auth.uid());

-- Folders y Documents
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view folders in their companies"
    ON folders FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view documents in their companies"
    ON documents FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- User Credentials (solo el usuario propietario)
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own credentials"
    ON user_credentials FOR ALL
    USING (user_id = auth.uid());

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_employee_gamification_updated_at
    BEFORE UPDATE ON employee_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_google_drive_credentials_updated_at
    BEFORE UPDATE ON user_google_drive_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_drive_tokens_updated_at
    BEFORE UPDATE ON google_drive_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT '✅ Tablas opcionales creadas exitosamente' as status;
