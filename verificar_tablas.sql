-- ========================================
-- VERIFICAR TABLAS EN SUPABASE
-- Ejecutar este script para ver qué tablas existen
-- ========================================

-- 1. Contar total de tablas
SELECT 
    '📊 TOTAL DE TABLAS' as info,
    COUNT(*) as cantidad
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- 2. Listar todas las tablas con número de columnas
SELECT 
    '📋 LISTA DE TABLAS' as seccion,
    table_name as tabla,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Verificar tablas específicas que deberían existir
SELECT 
    '✅ VERIFICACIÓN DE TABLAS CORE' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public')
        THEN '✅ companies existe'
        ELSE '❌ companies NO existe'
    END as companies,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
        THEN '✅ users existe'
        ELSE '❌ users NO existe'
    END as users,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public')
        THEN '✅ employees existe'
        ELSE '❌ employees NO existe'
    END as employees;

-- 4. Verificar tablas de integraciones
SELECT 
    '✅ VERIFICACIÓN DE INTEGRACIONES' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oauth_states' AND table_schema = 'public')
        THEN '✅ oauth_states existe'
        ELSE '❌ oauth_states NO existe'
    END as oauth_states,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_integrations' AND table_schema = 'public')
        THEN '✅ company_integrations existe'
        ELSE '❌ company_integrations NO existe'
    END as company_integrations,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_logs' AND table_schema = 'public')
        THEN '✅ integration_logs existe'
        ELSE '❌ integration_logs NO existe'
    END as integration_logs;

-- 5. Verificar tablas de knowledge base
SELECT 
    '✅ VERIFICACIÓN DE KNOWLEDGE BASE' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_knowledge_bases' AND table_schema = 'public')
        THEN '✅ company_knowledge_bases existe'
        ELSE '❌ company_knowledge_bases NO existe'
    END as knowledge_bases,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_documents' AND table_schema = 'public')
        THEN '✅ knowledge_documents existe'
        ELSE '❌ knowledge_documents NO existe'
    END as knowledge_documents;

-- 6. Verificar tablas de employee folders
SELECT 
    '✅ VERIFICACIÓN DE EMPLOYEE FOLDERS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_folders' AND table_schema = 'public')
        THEN '✅ employee_folders existe'
        ELSE '❌ employee_folders NO existe'
    END as employee_folders,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_documents' AND table_schema = 'public')
        THEN '✅ employee_documents existe'
        ELSE '❌ employee_documents NO existe'
    END as employee_documents;

-- 7. Verificar tablas de Brevo
SELECT 
    '✅ VERIFICACIÓN DE BREVO CAMPAIGNS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brevo_campaigns' AND table_schema = 'public')
        THEN '✅ brevo_campaigns existe'
        ELSE '❌ brevo_campaigns NO existe'
    END as brevo_campaigns,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brevo_templates' AND table_schema = 'public')
        THEN '✅ brevo_templates existe'
        ELSE '❌ brevo_templates NO existe'
    END as brevo_templates;

-- 8. Resumen final
SELECT 
    '📊 RESUMEN FINAL' as seccion,
    COUNT(*) as total_tablas,
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ Base de datos completa'
        WHEN COUNT(*) >= 15 THEN '⚠️ Base de datos parcial'
        ELSE '❌ Faltan muchas tablas'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- ========================================
-- INTERPRETACIÓN DE RESULTADOS
-- ========================================
-- 
-- Si ves 30+ tablas: ✅ Todo está bien
-- Si ves 0-10 tablas: ❌ Necesitas ejecutar los scripts SQL
-- Si ves 10-29 tablas: ⚠️ Algunos scripts se ejecutaron, faltan otros
--
-- ========================================
