#!/usr/bin/env node

/**
 * Crear tabla user_google_drive_credentials en Supabase
 * Ejecuta el script SQL para crear la tabla con estructura correcta
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurado');
  console.log('   Configurar en .env.local o variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 CREANDO TABLA: user_google_drive_credentials');
console.log('=' .repeat(60));

async function createGoogleDriveTable() {
  try {
    console.log('\n📋 PASO 1: Verificando si la tabla ya existe...');
    
    // Intentar consultar la tabla para ver si existe
    const { data, error } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ La tabla user_google_drive_credentials ya existe');
      return;
    }
    
    console.log('❌ La tabla no existe, procediendo a crearla...');
    
    console.log('\n📋 PASO 2: Creando tabla user_google_drive_credentials...');
    
    const createTableSQL = `
      -- Crear tabla para credenciales de Google Drive
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
          sync_status TEXT DEFAULT 'disconnected', -- 'disconnected', 'connecting', 'connected', 'error'
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

      -- Crear índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_user_google_drive_user_id ON user_google_drive_credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_google_drive_google_user_id ON user_google_drive_credentials(google_user_id);
      CREATE INDEX IF NOT EXISTS idx_user_google_drive_is_connected ON user_google_drive_credentials(is_connected);
      CREATE INDEX IF NOT EXISTS idx_user_google_drive_sync_status ON user_google_drive_credentials(sync_status);

      -- Función para actualizar updated_at automáticamente
      CREATE OR REPLACE FUNCTION update_user_google_drive_credentials_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Crear trigger para actualizar updated_at
      DROP TRIGGER IF EXISTS update_user_google_drive_credentials_updated_at_trigger ON user_google_drive_credentials;
      CREATE TRIGGER update_user_google_drive_credentials_updated_at_trigger
          BEFORE UPDATE ON user_google_drive_credentials
          FOR EACH ROW
          EXECUTE FUNCTION update_user_google_drive_credentials_updated_at();

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE user_google_drive_credentials ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS para user_google_drive_credentials
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
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete their own Google Drive credentials" ON user_google_drive_credentials;
      CREATE POLICY "Users can delete their own Google Drive credentials"
          ON user_google_drive_credentials
          FOR DELETE
          USING (auth.uid() = user_id);

      -- Otorgar permisos necesarios
      GRANT SELECT, INSERT, UPDATE, DELETE ON user_google_drive_credentials TO authenticated;
      GRANT USAGE ON SCHEMA public TO authenticated;
    `;
    
    // Ejecutar el SQL usando el cliente de Supabase
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createTableSQL
    });
    
    if (createError) {
      // Si rpc no funciona, intentar con el método directo
      console.log('🔄 Intentando método alternativo...');
      
      // Como rpc puede no estar disponible, crear la tabla usando el método directo
      // Esto es un workaround - en producción se debería usar el SQL Editor de Supabase
      console.log('⚠️  Para crear la tabla, ejecutar manualmente en Supabase SQL Editor:');
      console.log('\n' + createTableSQL + '\n');
      
      throw new Error('No se pudo crear la tabla automáticamente. Ejecutar SQL manualmente.');
    }
    
    console.log('✅ Tabla user_google_drive_credentials creada exitosamente');
    
    console.log('\n📋 PASO 3: Verificando estructura...');
    
    // Verificar que la tabla se creó correctamente
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_google_drive_credentials')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.log('❌ Error verificando la tabla:', verifyError.message);
    } else {
      console.log('✅ Tabla verificada correctamente');
    }
    
    console.log('\n🎯 RESULTADO:');
    console.log('   ✅ Tabla user_google_drive_credentials creada');
    console.log('   ✅ RLS policies configuradas');
    console.log('   ✅ Índices creados');
    console.log('   ✅ Triggers configurados');
    
    console.log('\n🔍 PRÓXIMO PASO:');
    console.log('   Probar OAuth de Google Drive nuevamente.');
    console.log('   Los errores 400 y "object is not iterable" deberían desaparecer.');
    
  } catch (error) {
    console.error('❌ Error creando la tabla:', error.message);
    console.log('\n🛠️ SOLUCIÓN MANUAL:');
    console.log('   1. Ir al dashboard de Supabase');
    console.log('   2. Abrir SQL Editor');
    console.log('   3. Ejecutar el script SQL proporcionado arriba');
    console.log('   4. Verificar que la tabla se crea sin errores');
  }
}

// Ejecutar creación
createGoogleDriveTable();