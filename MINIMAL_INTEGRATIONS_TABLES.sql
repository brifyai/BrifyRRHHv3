-- =====================================================
-- VERSIÓN ULTRA-SIMPLIFICADA: SOLO LO ESENCIAL
-- =====================================================
-- Esta versión evita cualquier sintaxis problemática

-- =====================================================
-- 1. TABLA OAUTH_STATES (CRÍTICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT NOT NULL UNIQUE,
    company_id UUID,
    integration_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA COMPANY_INTEGRATIONS (BÁSICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS company_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    integration_type TEXT NOT NULL,
    credentials JSONB NOT NULL,
    status TEXT DEFAULT 'disconnected',
    connected_at TIMESTAMPTZ,
    last_tested TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA INTEGRATION_LOGS (BÁSICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    integration_type TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    details JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA INTEGRATION_SETTINGS (BÁSICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    integration_type TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA WEBHOOK_ENDPOINTS (BÁSICA)
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID,
    integration_type TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_key TEXT,
    events TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES BÁSICOS SOLO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_company_id ON integration_logs(company_id);

-- =====================================================
-- RLS DESHABILITADO TEMPORALMENTE
-- =====================================================

-- NOTA: RLS se puede habilitar después si es necesario
-- ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'oauth_states', 
    'company_integrations', 
    'integration_logs', 
    'integration_settings', 
    'webhook_endpoints'
)
ORDER BY table_name;