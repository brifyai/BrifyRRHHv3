-- =====================================================
-- TABLA OAUTH_STATES PARA GOOGLE DRIVE INTEGRATION
-- =====================================================
-- Esta tabla almacena temporalmente los estados de OAuth
-- durante el proceso de autorización con servicios externos

-- Crear la tabla oauth_states
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
        'telegram'
    )),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_company_id ON oauth_states(company_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Política para SELECT: usuarios solo ven estados de su empresa
CREATE POLICY "Users can view oauth states" ON oauth_states
    FOR SELECT USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Política para INSERT: usuarios solo pueden crear estados para su empresa
CREATE POLICY "Users can insert oauth states" ON oauth_states
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Política para UPDATE: usuarios solo pueden actualizar estados de su empresa
CREATE POLICY "Users can update oauth states" ON oauth_states
    FOR UPDATE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Política para DELETE: usuarios solo pueden eliminar estados de su empresa
CREATE POLICY "Users can delete oauth states" ON oauth_states
    FOR DELETE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCIÓN DE LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Función para limpiar estados expirados
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- LIMPIEZA AUTOMÁTICA (OPCIONAL)
-- =====================================================

-- Habilitar pg_cron si no está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar limpieza automática cada hora
SELECT cron.schedule(
    'cleanup-oauth-states', 
    '0 * * * *', 
    'SELECT cleanup_expired_oauth_states();'
);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'oauth_states'
ORDER BY ordinal_position;