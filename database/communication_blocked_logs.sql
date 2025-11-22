-- Tabla para registrar intentos de comunicación bloqueados por empresas inactivas
-- Esto permite auditar y monitorear qué comunicaciones se están bloqueando

CREATE TABLE IF NOT EXISTS communication_blocked_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('whatsapp', 'email', 'sms', 'telegram', 'slack', 'teams')),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_communication_blocked_logs_company_id ON communication_blocked_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_communication_blocked_logs_blocked_at ON communication_blocked_logs(blocked_at);
CREATE INDEX IF NOT EXISTS idx_communication_blocked_logs_type ON communication_blocked_logs(communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_blocked_logs_company_type ON communication_blocked_logs(company_id, communication_type);

-- RLS (Row Level Security) para la tabla
ALTER TABLE communication_blocked_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Allow read access to communication_blocked_logs" ON communication_blocked_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción a todos los usuarios autenticados
CREATE POLICY "Allow insert access to communication_blocked_logs" ON communication_blocked_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comentarios para documentación
COMMENT ON TABLE communication_blocked_logs IS 'Registro de intentos de comunicación bloqueados por empresas inactivas';
COMMENT ON COLUMN communication_blocked_logs.company_id IS 'ID de la empresa que intentó comunicarse';
COMMENT ON COLUMN communication_blocked_logs.communication_type IS 'Tipo de comunicación bloqueada (whatsapp, email, sms, telegram, etc.)';
COMMENT ON COLUMN communication_blocked_logs.blocked_at IS 'Timestamp de cuando se bloqueó la comunicación';
COMMENT ON COLUMN communication_blocked_logs.user_agent IS 'User agent del navegador/cliente que intentó la comunicación';
COMMENT ON COLUMN communication_blocked_logs.ip_address IS 'Dirección IP del cliente';
COMMENT ON COLUMN communication_blocked_logs.additional_data IS 'Datos adicionales en formato JSON (parámetros del mensaje, etc.)';