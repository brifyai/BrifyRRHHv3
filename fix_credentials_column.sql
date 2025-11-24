-- CORRECCIÓN RÁPIDA: Agregar columna credentials faltante
ALTER TABLE company_integrations ADD COLUMN IF NOT EXISTS credentials JSONB;