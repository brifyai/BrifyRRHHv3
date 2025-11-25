-- ======================================================
-- FIX: Actualizar Client Secret (CORREGIDO)
-- ======================================================
-- IMPORTANTE: El client secret DEBE estar entre comillas dobles
-- ======================================================

-- PASO 1: Actualizar client secret (CORREGIDO - con comillas dobles)
UPDATE company_credentials
SET 
  credentials = jsonb_set(
    credentials::jsonb,
    '{clientSecret}',
    -- IMPORTANTE: Las comillas dobles son obligatorias para JSON
    '"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"'::jsonb
  ),
  updated_at = NOW()
WHERE id = '9f5cd0c5-31b1-442b-b175-7c484655f63e';

-- PASO 2: Verificar la actualización
SELECT 
    id,
    account_name,
    status,
    credentials->>'clientId' as client_id,
    -- Verificar que clientSecret está presente (no mostrar el valor por seguridad)
    CASE WHEN credentials ? 'clientSecret' THEN '✅ Presente' ELSE '❌ Faltante' END as client_secret_status
FROM company_credentials 
WHERE id = '9f5cd0c5-31b1-442b-b175-7c484655f63e';

-- PASO 3: Verificar que credentials es JSON válido
SELECT 
    id,
    pg_typeof(credentials) as data_type,
    jsonb_typeof(credentials::jsonb) as json_type
FROM company_credentials 
WHERE id = '9f5cd0c5-31b1-442b-b175-7c484655f63e';