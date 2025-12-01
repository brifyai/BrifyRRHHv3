-- =====================================================
-- CREAR TABLA user_google_drive_credentials
-- =====================================================
-- Esta tabla se mantiene para compatibilidad futura
-- pero actualmente el sistema usa solo company_credentials
-- =====================================================

-- Crear tabla user_google_drive_credentials
CREATE TABLE IF NOT EXISTS user_google_drive_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Tokens OAuth
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expires_at TIMESTAMPTZ,

    -- Información de Google
    google_user_id TEXT,
    google_email TEXT,
    google_name TEXT,
    google_avatar_url TEXT,

    -- Configuración
    google_scope TEXT DEFAULT 'https://www.googleapis.com/auth/drive',
    default_folder_id TEXT,

    -- Estado y sincronización
    is_connected BOOLEAN DEFAULT false,
    sync_status TEXT DEFAULT 'disconnected',
    last_sync_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadatos
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id),
    CHECK (sync_status IN ('disconnected', 'connecting', 'connected', 'error'))
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_google_drive_user_id ON user_google_drive_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_sync_status ON user_google_drive_credentials(sync_status);

-- Habilitar RLS
ALTER TABLE user_google_drive_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR DELETE
    USING (auth.uid() = user_id);

-- Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON user_google_drive_credentials TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Esta tabla se mantiene para compatibilidad futura.
-- Actualmente el sistema usa únicamente company_credentials
-- para las credenciales de Google Drive.
-- 
-- Si en el futuro se decide usar esta tabla, será necesario:
-- 1. Actualizar googleDriveCallbackHandler.js para guardar aquí
-- 2. Actualizar AuthContext.js para consultar aquí
-- 3. Eliminar la dependencia de company_credentials para Google Drive
-- =====================================================