-- ========================================
-- TABLAS DE INTEGRACIONES
-- ========================================

-- 1. TABLA OAUTH_STATES
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    redirect_uri TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA COMPANY_INTEGRATIONS
CREATE TABLE IF NOT EXISTS company_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN (
        'googleDrive', 'googleMeet', 'googleCalendar',
        'slack', 'teams', 'zoom', 'discord',
        'hubspot', 'salesforce', 'pipedrive',
        'brevo', 'sendgrid', 'twilio',
        'whatsappBusiness', 'whatsappOfficial', 'whatsappWAHA',
        'telegram', 'notion', 'airtable',
        'zapier', 'make', 'n8n'
    )),
    credentials JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'testing')),
    connected_at TIMESTAMPTZ,
    last_tested TIMESTAMPTZ,
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, integration_type)
);

-- 3. TABLA INTEGRATION_LOGS
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
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA USER_GOOGLE_DRIVE_CREDENTIALS
CREATE TABLE IF NOT EXISTS user_google_drive_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    scope TEXT[],
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_company_display_name UNIQUE (user_id, company_id, display_name)
);

-- 5. TABLA SYSTEM_CONFIGURATIONS
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_company_config_key UNIQUE (user_id, company_id, config_key)
);

-- 6. TABLA OPERATION_LOCKS
CREATE TABLE IF NOT EXISTS operation_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lock_key TEXT NOT NULL UNIQUE,
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_company_id ON oauth_states(company_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_type ON company_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_company_integrations_status ON company_integrations(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_company_id ON integration_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_creds_user_id ON user_google_drive_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_creds_company_id ON user_google_drive_credentials(company_id);
CREATE INDEX IF NOT EXISTS idx_system_configurations_user_id ON system_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_system_configurations_company_id ON system_configurations(company_id);
CREATE INDEX IF NOT EXISTS idx_operation_locks_lock_key ON operation_locks(lock_key);
CREATE INDEX IF NOT EXISTS idx_operation_locks_expires_at ON operation_locks(expires_at);
