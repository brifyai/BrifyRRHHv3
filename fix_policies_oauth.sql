-- ========================================
-- FIX: Eliminar y recrear políticas de oauth_states
-- Ejecutar si obtienes error de políticas duplicadas
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view oauth states" ON oauth_states;
DROP POLICY IF EXISTS "Users can insert oauth states" ON oauth_states;
DROP POLICY IF EXISTS "Users can update oauth states" ON oauth_states;
DROP POLICY IF EXISTS "Users can delete oauth states" ON oauth_states;

-- Recrear políticas
CREATE POLICY "Users can view oauth states" ON oauth_states
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can insert oauth states" ON oauth_states
    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can update oauth states" ON oauth_states
    FOR UPDATE USING (company_id IN (SELECT company_id FROM get_user_companies()));

CREATE POLICY "Users can delete oauth states" ON oauth_states
    FOR DELETE USING (company_id IN (SELECT company_id FROM get_user_companies()));

SELECT '✅ Políticas de oauth_states recreadas exitosamente' as status;
