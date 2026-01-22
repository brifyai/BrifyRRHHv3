-- ========================================
-- TABLAS CRÍTICAS PARA STAFFHUB
-- Estas tablas son NECESARIAS para el funcionamiento básico
-- ========================================

-- 1. COMMUNICATION_LOGS (CRÍTICA)
-- ========================================
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    recipient_ids UUID[] NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
    channel_id TEXT,
    message_type VARCHAR(50) DEFAULT 'direct',
    subject TEXT,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_logs_company ON communication_logs(company_id);
CREATE INDEX idx_communication_logs_sender ON communication_logs(sender_id);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX idx_communication_logs_created ON communication_logs(created_at DESC);

-- 2. MESSAGES (Almacenamiento de mensajes)
-- ========================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('employee', 'system', 'ai')),
    content TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push', 'internal')),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_employee ON messages(employee_id);
CREATE INDEX idx_messages_company ON messages(company_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- 3. COMPANY_INSIGHTS (Dashboard)
-- ========================================
CREATE TABLE IF NOT EXISTS company_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    total_employees INTEGER DEFAULT 0,
    active_employees INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    satisfaction_score DECIMAL(5,2) DEFAULT 0.00,
    insights_data JSONB DEFAULT '{}'::jsonb,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_insights_company ON company_insights(company_id);
CREATE INDEX idx_company_insights_period ON company_insights(period_start, period_end);

-- 4. SYSTEM_CONFIGURATIONS (Configuración global)
-- ========================================
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_configurations_key ON system_configurations(key);
CREATE INDEX idx_system_configurations_active ON system_configurations(is_active);

-- 5. OPERATION_LOCKS (Prevenir operaciones concurrentes)
-- ========================================
CREATE TABLE IF NOT EXISTS operation_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    locked_by UUID REFERENCES users(id) ON DELETE CASCADE,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(operation_type, resource_id)
);

CREATE INDEX idx_operation_locks_resource ON operation_locks(operation_type, resource_id);
CREATE INDEX idx_operation_locks_expires ON operation_locks(expires_at);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Communication Logs
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company communication logs"
    ON communication_logs FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert communication logs"
    ON communication_logs FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company messages"
    ON messages FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Company Insights
ALTER TABLE company_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company insights"
    ON company_insights FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- System Configurations (solo lectura para usuarios normales)
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system configurations"
    ON system_configurations FOR SELECT
    USING (is_active = true);

-- Operation Locks
ALTER TABLE operation_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own locks"
    ON operation_locks FOR ALL
    USING (locked_by = auth.uid());

-- ========================================
-- TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communication_logs_updated_at
    BEFORE UPDATE ON communication_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_insights_updated_at
    BEFORE UPDATE ON company_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configurations_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT '✅ Tablas críticas creadas exitosamente' as status;
