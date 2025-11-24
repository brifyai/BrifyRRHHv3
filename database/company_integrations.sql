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
        'telegram'
    )),
    credentials JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ,
    last_tested TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Uniqueness constraint to prevent duplicate integrations per company
    UNIQUE(company_id, integration_type)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_type ON company_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_company_integrations_status ON company_integrations(status);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_integrations_updated_at 
    BEFORE UPDATE ON company_integrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver/editar integraciones de su empresa
CREATE POLICY "Users can view company integrations" ON company_integrations
    FOR SELECT USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company integrations" ON company_integrations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company integrations" ON company_integrations
    FOR UPDATE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company integrations" ON company_integrations
    FOR DELETE USING (
        company_id IN (
            SELECT DISTINCT c.id 
            FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE company_integrations IS 'Almacena las credenciales y estado de las integraciones conectadas por empresa';
COMMENT ON COLUMN company_integrations.company_id IS 'ID de la empresa';
COMMENT ON COLUMN company_integrations.integration_type IS 'Tipo de integración (googleDrive, slack, etc.)';
COMMENT ON COLUMN company_integrations.credentials IS 'Credenciales encriptadas de la integración';
COMMENT ON COLUMN company_integrations.status IS 'Estado de la conexión (connected, disconnected, error)';
COMMENT ON COLUMN company_integrations.connected_at IS 'Fecha y hora de cuando se conectó';
COMMENT ON COLUMN company_integrations.last_tested IS 'Última vez que se probó la conexión';