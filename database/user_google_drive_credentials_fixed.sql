-- User Google Drive Credentials Table
CREATE TABLE IF NOT EXISTS user_google_drive_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google account information
  google_user_id VARCHAR(255) NOT NULL,
  google_email VARCHAR(255) NOT NULL,
  google_name VARCHAR(255),
  google_avatar_url TEXT,
  
  -- OAuth 2.0 credentials
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  
  -- Connection status
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending',
  
  -- User-specific configuration
  default_folder_id VARCHAR(255),
  sync_enabled BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 30,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraints
  UNIQUE(user_id),
  UNIQUE(google_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_google_drive_user_id ON user_google_drive_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_google_user_id ON user_google_drive_credentials(google_user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_is_active ON user_google_drive_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_sync_status ON user_google_drive_credentials(sync_status);

-- Create function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_user_google_drive_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_user_google_drive_credentials_updated_at_trigger ON user_google_drive_credentials;
CREATE TRIGGER update_user_google_drive_credentials_updated_at_trigger
  BEFORE UPDATE ON user_google_drive_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_user_google_drive_credentials_updated_at();

-- Create function to check if token has expired
CREATE OR REPLACE FUNCTION is_google_token_expired(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT token_expires_at INTO expires_at
  FROM user_google_drive_credentials
  WHERE user_id = user_id_param AND is_active = true;
  
  RETURN expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get active credentials for a user
CREATE OR REPLACE FUNCTION get_user_google_credentials(user_id_param UUID)
RETURNS TABLE (
  google_user_id VARCHAR(255),
  google_email VARCHAR(255),
  google_name VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  default_folder_id VARCHAR(255),
  is_connected BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    udc.google_user_id,
    udc.google_email,
    udc.google_name,
    udc.access_token,
    udc.refresh_token,
    udc.token_expires_at,
    udc.scope,
    udc.default_folder_id,
    udc.is_connected
  FROM user_google_drive_credentials udc
  WHERE udc.user_id = user_id_param 
    AND udc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to update sync status
CREATE OR REPLACE FUNCTION update_google_drive_sync_status(
  user_id_param UUID,
  status_param VARCHAR(50),
  error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_google_drive_credentials
  SET 
    sync_status = status_param,
    last_sync_at = NOW(),
    is_connected = (status_param = 'success')
  WHERE user_id = user_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_google_drive_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own Google Drive credentials" ON user_google_drive_credentials;
CREATE POLICY "Users can view their own Google Drive credentials"
  ON user_google_drive_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own Google Drive credentials" ON user_google_drive_credentials;
CREATE POLICY "Users can insert their own Google Drive credentials"
  ON user_google_drive_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own Google Drive credentials" ON user_google_drive_credentials;
CREATE POLICY "Users can update their own Google Drive credentials"
  ON user_google_drive_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own Google Drive credentials" ON user_google_drive_credentials;
CREATE POLICY "Users can delete their own Google Drive credentials"
  ON user_google_drive_credentials
  FOR DELETE
  USING (auth.uid() = user_id);