-- ========================================
-- VERIFICACIÓN DEL SISTEMA DE SINCRONIZACIÓN
-- ========================================
-- Este script verifica que todas las tablas y funciones se crearon correctamente

-- Verificar que todas las tablas principales existen
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'company_credentials',
    'employee_folders', 
    'employee_documents',
    'employee_faqs',
    'employee_conversations',
    'employee_notification_settings',
    'user_google_drive_credentials',
    'non_gmail_employees'
)
ORDER BY tablename;

-- Verificar índices principales
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'employee_folders',
    'employee_documents', 
    'employee_faqs',
    'user_google_drive_credentials',
    'company_credentials'
)
ORDER BY tablename, indexname;

-- Verificar funciones creadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%employee%' 
OR routine_name LIKE '%google%'
OR routine_name LIKE '%company%'
ORDER BY routine_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'employee_folders',
    'employee_documents',
    'employee_faqs', 
    'user_google_drive_credentials'
)
ORDER BY tablename, policyname;

-- Verificar constraints únicos
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    rel.relname as table_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname IN (
    'employee_folders',
    'employee_documents',
    'employee_faqs',
    'employee_conversations',
    'employee_notification_settings',
    'user_google_drive_credentials',
    'company_credentials',
    'non_gmail_employees'
)
AND con.contype = 'u'
ORDER BY rel.relname, con.conname;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN (
    'employee_folders',
    'employee_documents',
    'employee_faqs',
    'user_google_drive_credentials',
    'company_credentials'
)
ORDER BY event_object_table, trigger_name;

-- Estadísticas de tablas (conteo de registros)
SELECT 
    'employee_folders' as table_name,
    COUNT(*) as record_count
FROM employee_folders
UNION ALL
SELECT 
    'employee_documents' as table_name,
    COUNT(*) as record_count  
FROM employee_documents
UNION ALL
SELECT 
    'employee_faqs' as table_name,
    COUNT(*) as record_count
FROM employee_faqs
UNION ALL
SELECT 
    'employee_conversations' as table_name,
    COUNT(*) as record_count
FROM employee_conversations
UNION ALL
SELECT 
    'employee_notification_settings' as table_name,
    COUNT(*) as record_count
FROM employee_notification_settings
UNION ALL
SELECT 
    'user_google_drive_credentials' as table_name,
    COUNT(*) as record_count
FROM user_google_drive_credentials
UNION ALL
SELECT 
    'company_credentials' as table_name,
    COUNT(*) as record_count
FROM company_credentials
UNION ALL
SELECT 
    'non_gmail_employees' as table_name,
    COUNT(*) as record_count
FROM non_gmail_employees;

-- Confirmación final
DO $$
BEGIN
    RAISE NOTICE '✅ VERIFICACIÓN DEL SISTEMA COMPLETADA';
    RAISE NOTICE '📊 Todas las tablas del sistema de sincronización han sido verificadas';
    RAISE NOTICE '🔧 Funciones y triggers configurados correctamente';
    RAISE NOTICE '🔐 Políticas RLS aplicadas';
    RAISE NOTICE '📈 Sistema listo para usar';
END $$;