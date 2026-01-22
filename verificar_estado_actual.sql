-- ========================================
-- VERIFICAR ESTADO ACTUAL DE LA BASE DE DATOS
-- ========================================

-- 1. Ver todas las tablas que YA EXISTEN
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Contar total
SELECT 
    COUNT(*) as total_tablas_existentes,
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ Base de datos completa'
        WHEN COUNT(*) >= 15 THEN '⚠️ Base de datos parcial - faltan algunas tablas'
        WHEN COUNT(*) > 0 THEN '⚠️ Solo algunas tablas creadas'
        ELSE '❌ No hay tablas creadas'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- 3. Verificar tablas críticas
SELECT 
    'companies' as tabla,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END as estado
UNION ALL
SELECT 'users', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END
UNION ALL
SELECT 'employees', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END
UNION ALL
SELECT 'oauth_states', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oauth_states' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END
UNION ALL
SELECT 'company_integrations', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_integrations' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END
UNION ALL
SELECT 'employee_folders', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_folders' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END
UNION ALL
SELECT 'company_knowledge_bases', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_knowledge_bases' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END
UNION ALL
SELECT 'brevo_campaigns', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brevo_campaigns' AND table_schema = 'public')
    THEN '✅ Existe' ELSE '❌ No existe' END;

-- 4. Ver políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
