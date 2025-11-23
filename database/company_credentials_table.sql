-- ========================================
-- TABLA DE CREDENCIALES POR EMPRESA
-- ========================================
-- Esta tabla permite que cada empresa tenga múltiples cuentas de Google Drive
-- y otras integraciones, eliminando la dependencia de configuraciones globales

-- Crear tabla de credenciales por empresa
CREATE TABLE IF NOT EXISTS company_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Tipo de integración
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN (
        'google_drive', 
        'whatsapp', 
        'email', 
        'calendar',
        'slack',
        'teams'
    )),
    
    -- Nombre descriptivo de la cuenta
    account_name VARCHAR(255) NOT NULL,
    
    -- Estado de la integración
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 
        'inactive', 
        'error', 
        'expired',
        'pending_verification'
    )),
    
    -- Credenciales específicas por tipo
    credentials JSONB NOT NULL,
    
    -- Configuraciones adicionales
    settings JSONB DEFAULT '{}',
    
    -- Metadatos de la cuenta
    account_email VARCHAR(255),
    account_display_name VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Auditoría
    created_by UUID,
    updated_by UUID
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_company_credentials_company_id 
ON company_credentials(company_id);

CREATE INDEX IF NOT EXISTS idx_company_credentials_type 
ON company_credentials(integration_type);

CREATE INDEX IF NOT EXISTS idx_company_credentials_status 
ON company_credentials(status);

CREATE INDEX IF NOT EXISTS idx_company_credentials_account_email 
ON company_credentials(account_email);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_company_credentials_company_type 
ON company_credentials(company_id, integration_type);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_company_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_credentials_updated_at ON company_credentials;
CREATE TRIGGER update_company_credentials_updated_at
    BEFORE UPDATE ON company_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_company_credentials_updated_at();

-- Función para obtener credenciales activas por empresa y tipo
CREATE OR REPLACE FUNCTION get_company_credentials(
    p_company_id UUID,
    p_integration_type VARCHAR(50)
)
RETURNS TABLE(
    id UUID,
    account_name VARCHAR(255),
    status VARCHAR(20),
    credentials JSONB,
    settings JSONB,
    account_email VARCHAR(255),
    account_display_name VARCHAR(255),
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.account_name,
        cc.status,
        cc.credentials,
        cc.settings,
        cc.account_email,
        cc.account_display_name,
        cc.expires_at
    FROM company_credentials cc
    WHERE cc.company_id = p_company_id 
    AND cc.integration_type = p_integration_type
    AND cc.status = 'active'
    ORDER BY cc.last_used_at DESC NULLS LAST, cc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar último uso
CREATE OR REPLACE FUNCTION update_last_used(p_credential_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE company_credentials
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE id = p_credential_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para desactivar credenciales expiradas
CREATE OR REPLACE FUNCTION deactivate_expired_credentials()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE company_credentials
    SET status = 'expired'
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para credenciales activas por empresa
CREATE OR REPLACE VIEW active_company_credentials AS
SELECT 
    cc.id,
    cc.company_id,
    c.name as company_name,
    cc.integration_type,
    cc.account_name,
    cc.status,
    cc.credentials,
    cc.settings,
    cc.account_email,
    cc.account_display_name,
    cc.last_used_at,
    cc.expires_at,
    cc.created_at,
    cc.updated_at
FROM company_credentials cc
JOIN companies c ON cc.company_id = c.id
WHERE cc.status = 'active';

-- Vista para estadísticas de credenciales
CREATE OR REPLACE VIEW credentials_statistics AS
SELECT 
    cc.integration_type,
    cc.status,
    COUNT(*) as count,
    COUNT(DISTINCT cc.company_id) as companies_count
FROM company_credentials cc
GROUP BY cc.integration_type, cc.status
ORDER BY cc.integration_type, cc.status;

-- Comentarios para documentación
COMMENT ON TABLE company_credentials IS 'Credenciales de integraciones por empresa - permite múltiples cuentas por empresa';
COMMENT ON COLUMN company_credentials.integration_type IS 'Tipo de integración: google_drive, whatsapp, email, calendar, slack, teams';
COMMENT ON COLUMN company_credentials.credentials IS 'JSON con credenciales específicas del tipo de integración';
COMMENT ON COLUMN company_credentials.settings IS 'JSON con configuraciones adicionales específicas';
COMMENT ON COLUMN company_credentials.account_email IS 'Email de la cuenta asociada (si aplica)';
COMMENT ON COLUMN company_credentials.expires_at IS 'Fecha de expiración de las credenciales (si aplica)';

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla company_credentials creada exitosamente';
    RAISE NOTICE '📊 Índices creados para optimización';
    RAISE NOTICE '🔧 Funciones de utilidad creadas';
    RAISE NOTICE '📋 Vistas para consulta rápida creadas';
    RAISE NOTICE '🎯 Sistema listo para múltiples credenciales por empresa';
END $$;