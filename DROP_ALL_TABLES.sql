-- ========================================
-- ⚠️ PELIGRO: ELIMINAR TODAS LAS TABLAS
-- Este script BORRA TODA LA BASE DE DATOS
-- ========================================
-- 
-- IMPORTANTE: 
-- - Esto eliminará TODOS los datos
-- - No se puede deshacer
-- - Ejecutar solo si estás seguro
--
-- ========================================

-- Deshabilitar triggers temporalmente
SET session_replication_role = 'replica';

-- ========================================
-- 1. ELIMINAR POLÍTICAS RLS
-- ========================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view ' || r.tablename || '" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert ' || r.tablename || '" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update ' || r.tablename || '" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete ' || r.tablename || '" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their companies" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view company ' || r.tablename || '" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can manage company ' || r.tablename || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- ========================================
-- 2. ELIMINAR TODAS LAS TABLAS
-- ========================================

DROP TABLE IF EXISTS brevo_webhook_events CASCADE;
DROP TABLE IF EXISTS brevo_webhooks CASCADE;
DROP TABLE IF EXISTS brevo_user_config CASCADE;
DROP TABLE IF EXISTS brevo_statistics CASCADE;
DROP TABLE IF EXISTS brevo_templates CASCADE;
DROP TABLE IF EXISTS brevo_campaign_recipients CASCADE;
DROP TABLE IF EXISTS brevo_campaigns CASCADE;

DROP TABLE IF EXISTS integration_webhook_events CASCADE;
DROP TABLE IF EXISTS integration_webhooks CASCADE;
DROP TABLE IF EXISTS integration_usage_stats CASCADE;
DROP TABLE IF EXISTS integration_sync_logs CASCADE;
DROP TABLE IF EXISTS user_integration_credentials CASCADE;
DROP TABLE IF EXISTS company_integrations CASCADE;
DROP TABLE IF EXISTS integration_settings CASCADE;
DROP TABLE IF EXISTS integration_logs CASCADE;
DROP TABLE IF EXISTS webhook_endpoints CASCADE;

DROP TABLE IF EXISTS employee_notification_settings CASCADE;
DROP TABLE IF EXISTS employee_conversations CASCADE;
DROP TABLE IF EXISTS employee_faqs CASCADE;
DROP TABLE IF EXISTS employee_documents CASCADE;
DROP TABLE IF EXISTS employee_folders CASCADE;

DROP TABLE IF EXISTS knowledge_permissions CASCADE;
DROP TABLE IF EXISTS knowledge_ai_config CASCADE;
DROP TABLE IF EXISTS faq_entries CASCADE;
DROP TABLE IF EXISTS knowledge_documents CASCADE;
DROP TABLE IF EXISTS knowledge_categories CASCADE;
DROP TABLE IF EXISTS knowledge_folders CASCADE;
DROP TABLE IF EXISTS company_knowledge_bases CASCADE;

DROP TABLE IF EXISTS user_google_drive_credentials CASCADE;
DROP TABLE IF EXISTS system_configurations CASCADE;
DROP TABLE IF EXISTS operation_locks CASCADE;
DROP TABLE IF EXISTS oauth_states CASCADE;

DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS user_companies CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

DROP TABLE IF EXISTS company_insights CASCADE;
DROP TABLE IF EXISTS message_analysis CASCADE;
DROP TABLE IF EXISTS analytics_test_reports CASCADE;

-- ========================================
-- 3. ELIMINAR FUNCIONES
-- ========================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_companies() CASCADE;
DROP FUNCTION IF EXISTS get_brevo_campaign_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_oauth_states() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_integration_logs() CASCADE;

-- ========================================
-- 4. ELIMINAR EXTENSIONES (OPCIONAL)
-- ========================================

-- Descomentar si quieres eliminar las extensiones también
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
-- DROP EXTENSION IF EXISTS "pg_cron" CASCADE;

-- Rehabilitar triggers
SET session_replication_role = 'origin';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver tablas restantes (debería estar vacío o solo tablas del sistema)
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Contar tablas
SELECT 
    COUNT(*) as tablas_restantes,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas las tablas eliminadas'
        ELSE '⚠️ Aún quedan ' || COUNT(*) || ' tablas'
    END as estado
FROM pg_tables 
WHERE schemaname = 'public';

-- ========================================
-- RESULTADO
-- ========================================

SELECT '🗑️ Base de datos limpiada completamente' as status;
SELECT '✅ Listo para crear tablas nuevas desde cero' as next_step;
