-- Tabla para almacenar temporalmente los estados de OAuth durante el proceso de autorización
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para optimizar consultas
    INDEX idx_oauth_states_state ON oauth_states(state),
    INDEX idx_oauth_states_company_id ON oauth_states(company_id),
    INDEX idx_oauth_states_expires_at ON oauth_states(expires_at)
);

-- Función para limpiar estados expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar estados expirados automáticamente cada hora
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_expired_oauth_states();');

-- Habilitar RLS (Row Level Security)
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver/editar estados de OAuth de su empresa
CREATE POLICY "Users can view oauth states" ON oauth_states
    FOR SELECT USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert oauth states" ON oauth_states
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update oauth states" ON oauth_states
    FOR UPDATE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete oauth states" ON oauth_states
    FOR DELETE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE oauth_states IS 'Almacena temporalmente los estados de OAuth durante el proceso de autorización';
COMMENT ON COLUMN oauth_states.state IS 'Estado único generado para seguridad';
COMMENT ON COLUMN oauth_states.company_id IS 'ID de la empresa que está autorizando';
COMMENT ON COLUMN oauth_states.integration_type IS 'Tipo de integración que se está autorizando';
COMMENT ON COLUMN oauth_states.expires_at IS 'Fecha y hora de expiración del estado (máximo 10 minutos)';
COMMENT ON COLUMN oauth_states.created_at IS 'Fecha y hora de creación del estado';