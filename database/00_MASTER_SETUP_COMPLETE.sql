-- ========================================
-- MASTER SETUP COMPLETO - STAFFHUB
-- Este script crea TODAS las tablas necesarias
-- ========================================
-- 
-- ORDEN DE EJECUCIÓN:
-- 1. Core tables (companies, users, employees)
-- 2. Integrations (OAuth, webhooks)
-- 3. Critical tables (communication_logs, messages)
-- 4. Important tables (skills, projects, compliance)
-- 5. Knowledge base (documents, FAQs)
-- 6. Brevo/Communication (campaigns, templates)
-- 7. Employee folders (folders, documents, FAQs)
-- 8. Optional tables (gamification, analytics, Google Drive)
--
-- TOTAL: 63 tablas
--
-- ========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- PASO 1: CORE TABLES
-- ========================================
\echo '📦 Creando tablas principales...'
\i 01_core_tables.sql

-- ========================================
-- PASO 2: INTEGRATIONS
-- ========================================
\echo '🔌 Creando tablas de integraciones...'
\i ../COMPLETE_INTEGRATIONS_TABLES.sql

-- ========================================
-- PASO 3: CRITICAL TABLES
-- ========================================
\echo '⚡ Creando tablas críticas...'
\i 03_critical_tables.sql

-- ========================================
-- PASO 4: IMPORTANT TABLES
-- ========================================
\echo '📊 Creando tablas importantes...'
\i 04_important_tables.sql

-- ========================================
-- PASO 5: KNOWLEDGE BASE
-- ========================================
\echo '📚 Creando sistema de base de conocimiento...'
\i ../supabase_knowledge_simple.sql

-- ========================================
-- PASO 6: BREVO & EMPLOYEE FOLDERS
-- ========================================
\echo '📧 Creando tablas de Brevo y carpetas de empleados...'
\i complete_database_setup.sql

-- ========================================
-- PASO 7: OPTIONAL TABLES
-- ========================================
\echo '🎮 Creando tablas opcionales (gamificación, analytics, Google Drive)...'
\i 05_optional_tables.sql

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

\echo '✅ Verificando tablas creadas...'

SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 
    COUNT(*) as total_tablas,
    CASE 
        WHEN COUNT(*) >= 60 THEN '✅ Todas las tablas creadas correctamente'
        ELSE '⚠️ Faltan tablas por crear'
    END as estado
FROM pg_tables 
WHERE schemaname = 'public';

\echo '🎉 Setup completo finalizado!'
