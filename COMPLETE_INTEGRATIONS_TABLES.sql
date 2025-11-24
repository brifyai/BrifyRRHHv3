-- =====================================================
-- SCRIPT COMPLETO: TODAS LAS TABLAS PARA INTEGRACIONES
-- =====================================================
-- Este script crea todas las tablas necesarias para el
-- sistema completo de integraciones (OAuth + Company Integrations)

-- =====================================================
-- 1. TABLA OAUTH_STATES
-- =====================================================
-- Tabla para almacenar temporalmente los estados de OAuth
-- durante el proceso de autorización con servicios externos

CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN (
        'googleDrive',
        'googleMeet', 
        'slack',
        'teams',
        'hubspot',
        'brevo',
        'whatsappBusiness',
        'whatsappOfficial',
        'whatsappWAHA',
        'telegram',
        'zoom',
        'discord',
        'notion',
        'airtable',
        'salesforce',
        'pipedrive',
        'zapier',
        'make',
        'n8n'
    )),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA COMPANY_INTEGRATIONS
-- =====================================================
-- Tabla para almacenar las integraciones conectadas por empresa

CREATE TABLE IF NOT EXISTS company_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN (
        'googleDrive',
        'googleMeet', 
        'slack',
        'teams',
        'hubspot',
        'brevo',
        'whatsappBusiness',
        'whatsappOfficial',
        'whatsappWAHA',
        'telegram',
        'zoom',
        'discord',
        'notion',
        'airtable',
        'salesforce',
        'pipedrive',
        'zapier',
        'make',
        'n8n'
    )),
    credentials JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'testing')),
    connected_at TIMESTAMPTZ,
    last_tested TIMESTAMPTZ,
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Uniqueness constraint to prevent duplicate integrations per company
    UNIQUE(company_id, integration_type)
);

-- =====================================================
-- 3. TABLA INTEGRATION_LOGS
-- =====================================================
-- Tabla para logs de actividad de integraciones

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'connect', 'disconnect', 'sync', 'error', 'test', 'refresh_token', 'webhook'
    )),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'info')),
    message TEXT,
    details JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA INTEGRATION_SETTINGS
-- =====================================================
-- Tabla para configuraciones específicas de cada integración

CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, integration_type, setting_key)
);

-- =====================================================
-- 5. TABLA WEBHOOK_ENDPOINTS
-- =====================================================
-- Tabla para almacenar endpoints de webhooks de integraciones

CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_key TEXT,
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para oauth_states
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_company_id ON oauth_states(company_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_integration_type ON oauth_states(integration_type);

-- Índices para company_integrations
CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_type ON company_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_company_integrations_status ON company_integrations(status);
CREATE INDEX IF NOT EXISTS idx_company_integrations_updated_at ON company_integrations(updated_at);

-- Índices para integration_logs
CREATE INDEX IF NOT EXISTS idx_integration_logs_company_id ON integration_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_action ON integration_logs(action);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);

-- Índices para integration_settings
CREATE INDEX IF NOT EXISTS idx_integration_settings_company_id ON integration_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_type ON integration_settings(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_settings_key ON integration_settings(setting_key);

-- Índices para webhook_endpoints
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_company_id ON webhook_endpoints(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_type ON webhook_endpoints(integration_type);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(is_active);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para company_integrations
DROP TRIGGER IF EXISTS update_company_integrations_updated_at ON company_integrations;
CREATE TRIGGER update_company_integrations_updated_at 
    BEFORE UPDATE ON company_integrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para integration_settings
DROP TRIGGER IF EXISTS update_integration_settings_updated_at ON integration_settings;
CREATE TRIGGER update_integration_settings_updated_at 
    BEFORE UPDATE ON integration_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para webhook_endpoints
DROP TRIGGER IF EXISTS update_webhook_endpoints_updated_at ON webhook_endpoints;
CREATE TRIGGER update_webhook_endpoints_updated_at 
    BEFORE UPDATE ON webhook_endpoints 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Función helper para obtener companies del usuario
CREATE OR REPLACE FUNCTION get_user_companies()
RETURNS TABLE(company_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA OAUTH_STATES
-- =====================================================

CREATE POLICY "Users can view oauth states" ON oauth_states
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can insert oauth states" ON oauth_states
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can update oauth states" ON oauth_states
    FOR UPDATE USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can delete oauth states" ON oauth_states
    FOR DELETE USING (company_id IN (SELECT company_id FROM get_user_companies()));

-- =====================================================
-- POLÍTICAS PARA COMPANY_INTEGRATIONS
-- =====================================================

CREATE POLICY "Users can view company integrations" ON company_integrations
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can insert company integrations" ON company_integrations
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can update company integrations" ON company_integrations
    FOR UPDATE USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can delete company integrations" ON company_integrations
    FOR DELETE USING (company_id IN (SELECT company_id FROM get_user_companies()));

-- =====================================================
-- POLÍTICAS PARA INTEGRATION_LOGS
-- =====================================================

CREATE POLICY "Users can view integration logs" ON integration_logs
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can insert integration logs" ON integration_logs
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM get_user_companies()));

-- =====================================================
-- POLÍTICAS PARA INTEGRATION_SETTINGS
-- =====================================================

CREATE POLICY "Users can view integration settings" ON integration_settings
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can insert integration settings" ON integration_settings
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can update integration settings" ON integration_settings
    FOR UPDATE USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can delete integration settings" ON integration_settings
    FOR DELETE USING (company_id IN (SELECT company_id FROM get_user_companies()));

-- =====================================================
-- POLÍTICAS PARA WEBHOOK_ENDPOINTS
-- =====================================================

CREATE POLICY "Users can view webhook endpoints" ON webhook_endpoints
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can insert webhook endpoints" ON webhook_endpoints
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can update webhook endpoints" ON webhook_endpoints
    FOR UPDATE USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can delete webhook endpoints" ON webhook_endpoints
    FOR DELETE USING (company_id IN (SELECT company_id FROM get_user_companies()));

-- =====================================================
-- FUNCIONES DE LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Función para limpiar estados OAuth expirados
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_integration_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM integration_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- LIMPIEZA AUTOMÁTICA (OPCIONAL)
-- =====================================================

-- Habilitar pg_cron si no está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar limpieza automática
SELECT cron.schedule(
    'cleanup-oauth-states', 
    '0 * * * *', 
    'SELECT cleanup_expired_oauth_states();'
);

SELECT cron.schedule(
    'cleanup-integration-logs', 
    '0 2 * * *', 
    'SELECT cleanup_old_integration_logs();'
);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'oauth_states', 
    'company_integrations', 
    'integration_logs', 
    'integration_settings', 
    'webhook_endpoints'
)
AND schemaname = 'public'
ORDER BY tablename;