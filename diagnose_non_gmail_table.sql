-- Diagnosticar la estructura real de la tabla non_gmail_employees

-- 1. Ver columnas existentes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'non_gmail_employees'
ORDER BY ordinal_position;

-- 2. Ver constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'non_gmail_employees'::regclass;

-- 3. Ver índices existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'non_gmail_employees';

-- 4. Ver datos de ejemplo
SELECT * FROM non_gmail_employees LIMIT 5;