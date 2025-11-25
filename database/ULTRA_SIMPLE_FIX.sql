-- ======================================================
-- FIX ULTRA SIMPLE: Solo deshabilitar RLS temporalmente
-- ======================================================
-- Ejecuta esto para solucionar el error 42501 inmediatamente
-- ======================================================

-- Deshabilitar RLS completamente
ALTER TABLE system_configurations DISABLE ROW LEVEL SECURITY;

-- Verificar que está deshabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'system_configurations';

-- Mensaje de éxito
SELECT '✅ RLS deshabilitado temporalmente. El error 42501 debería desaparecer.' as status;