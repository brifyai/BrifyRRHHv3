#!/usr/bin/env node

/**
 * EMERGENCY FIX: Verificar y recrear tabla system_configurations
 * 
 * PROBLEMA: La tabla está corrupta o mal definida
 * SOLUCIÓN: Verificar estructura y recrear si es necesario
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Necesitas REACT_APP_SUPABASE_SERVICE_KEY')
  console.error('   Obténla de: Supabase > Settings > API > service_role key')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function emergencyFix() {
  console.log('🚨 EMERGENCY FIX: Verificando tabla system_configurations\n')
  
  try {
    // 1. Intentar describir la tabla con SELECT simple
    console.log('📋 1. Intentando SELECT simple con service_role...')
    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('system_configurations')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('❌ ERROR en SELECT:', selectError.message)
      console.error('   Código:', selectError.code)
      console.error('\n💡 Esto confirma que la tabla tiene problemas estructurales')
    } else {
      console.log('✅ SELECT funcionó')
      if (selectData && selectData.length > 0) {
        console.log('📄 Datos encontrados:', JSON.stringify(selectData[0], null, 2))
      } else {
        console.log('📄 Tabla vacía (pero accesible)')
      }
    }
    
    // 2. Intentar INSERT más simple posible
    console.log('\n🧪 2. Intentando INSERT ultra-simple...')
    const simpleData = {
      category: 'test',
      config_key: 'test_key',
      config_value: '"test_value"',
      is_active: true
    }
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('system_configurations')
      .insert([simpleData])
      .select()
    
    if (insertError) {
      console.error('❌ ERROR en INSERT simple:', insertError.message)
      console.error('   Detalles:', insertError.details)
      console.error('   Sugerencia:', insertError.hint)
      console.error('\n🔍 ANALISIS:')
      
      if (insertError.message.includes('violates not-null')) {
        console.log('   → Falta una columna NOT NULL')
        console.log('   → Necesitamos ver el esquema completo')
      } else if (insertError.message.includes('violates foreign key')) {
        console.log('   → Hay una foreign key constraint fallando')
      } else if (insertError.message.includes('invalid input syntax')) {
        console.log('   → Tipo de dato incorrecto en alguna columna')
      } else if (insertError.code === '42501') {
        console.log('   → RLS está habilitado pero service_role debería bypass')
        console.log('   → Esto es un bug de Supabase o la tabla está corrupta')
      }
    } else {
      console.log('✅ INSERT simple funcionó')
      console.log('📄 Registro creado:', JSON.stringify(insertData, null, 2))
      
      // Limpiar
      await supabaseAdmin
        .from('system_configurations')
        .delete()
        .eq('config_key', 'test_key')
    }
    
    // 3. Si todo falla, proporcionar SQL de recreación
    console.log('\n' + '='.repeat(60))
    console.log('🔧 SOLUCIÓN FINAL: SQL de Recreación')
    console.log('='.repeat(60))
    
    console.log(`
-- ======================================================
-- RECREAR TABLA system_configurations (EMERGENCY FIX)
-- ======================================================
-- ⚠️  ESTO BORRARÁ TODOS LOS DATOS EXISTENTES
-- ======================================================

-- Paso 1: Deshabilitar RLS temporalmente
ALTER TABLE system_configurations DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar tabla existente (si está corrupta)
DROP TABLE IF EXISTS system_configurations CASCADE;

-- Paso 3: Crear tabla desde cero con estructura correcta
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scope TEXT NOT NULL DEFAULT 'global',
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint única para evitar duplicados
    UNIQUE(user_id, scope, company_id, category, config_key)
);

-- Paso 4: Crear índices para mejorar rendimiento
CREATE INDEX idx_system_config_user ON system_configurations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_system_config_company ON system_configurations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_system_config_category ON system_configurations(category, config_key);
CREATE INDEX idx_system_config_active ON system_configurations(is_active) WHERE is_active = true;

-- Paso 5: Habilitar RLS
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Paso 6: Crear políticas básicas (permitir todo a authenticated)
CREATE POLICY "Permitir todo a authenticated" ON system_configurations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Paso 7: Crear política para service_role (bypass total)
CREATE POLICY "Bypass RLS para service_role" ON system_configurations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Paso 8: Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 9: Trigger para updated_at
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Paso 10: Verificar creación
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'system_configurations') as policy_count
FROM pg_tables 
WHERE tablename = 'system_configurations';

-- ======================================================
-- FIN DE RECREACIÓN
-- ======================================================
    `)
    
    console.log('\n⚠️  IMPORTANTE:')
    console.log('   - Esto BORRARÁ todos los datos existentes')
    console.log('   - Copia el SQL de arriba')
    console.log('   - Pégalo en Supabase > SQL Editor > RUN')
    console.log('   - Después, todo funcionará')
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
    console.error(error.stack)
  }
}

emergencyFix().catch(console.error)