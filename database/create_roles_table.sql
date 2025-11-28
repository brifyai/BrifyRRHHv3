-- ============================================
-- CREAR TABLA ROLES Y RELACIÓN CON USERS
-- ============================================

-- Crear tabla roles si no existe
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_es TEXT,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO roles (name, name_es, description, hierarchy_level, permissions) VALUES
('admin', 'Administrador', 'Acceso total al sistema', 100, '{"*": true}'::jsonb),
('manager', 'Gerente', 'Acceso a gestión de equipos', 80, '{"read": true, "write": true, "delete": false}'::jsonb),
('employee', 'Empleado', 'Acceso básico', 50, '{"read": true, "write": false, "delete": false}'::jsonb),
('viewer', 'Observador', 'Solo lectura', 20, '{"read": true, "write": false, "delete": false}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy ON roles(hierarchy_level);

-- ============================================
-- ACTUALIZAR TABLA USERS CON REFERENCIA A ROLES
-- ============================================

-- Añadir columna role_id a users si no existe
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Crear índice para role_id
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- ============================================
-- HABILITAR RLS EN ROLES
-- ============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Políticas para roles (todos pueden ver roles)
DROP POLICY IF EXISTS roles_select_all ON roles;
CREATE POLICY roles_select_all ON roles
    FOR SELECT USING (true);

-- Solo admins pueden modificar roles
DROP POLICY IF EXISTS roles_insert_admin ON roles;
CREATE POLICY roles_insert_admin ON roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role_id IN (SELECT id FROM roles WHERE name = 'admin')
        )
    );

DROP POLICY IF EXISTS roles_update_admin ON roles;
CREATE POLICY roles_update_admin ON roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role_id IN (SELECT id FROM roles WHERE name = 'admin')
        )
    );

-- ============================================
-- ACTUALIZAR USUARIOS EXISTENTES CON ROL POR DEFECTO
-- ============================================

DO $$
DECLARE
    v_admin_role_id UUID;
    v_employee_role_id UUID;
BEGIN
    -- Obtener ID del rol admin
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
    
    -- Obtener ID del rol employee
    SELECT id INTO v_employee_role_id FROM roles WHERE name = 'employee' LIMIT 1;
    
    -- Asignar rol admin al primer usuario (probablemente el creador)
    IF v_admin_role_id IS NOT NULL THEN
        UPDATE users 
        SET role_id = v_admin_role_id 
        WHERE role_id IS NULL 
        AND id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
    END IF;
    
    -- Asignar rol employee al resto de usuarios
    IF v_employee_role_id IS NOT NULL THEN
        UPDATE users 
        SET role_id = v_employee_role_id 
        WHERE role_id IS NULL;
    END IF;
END $$;

-- ============================================
-- CREAR FUNCIÓN PARA OBTENER ROL DEL USUARIO ACTUAL
-- ============================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TABLE (
    role_id UUID,
    role_name TEXT,
    role_name_es TEXT,
    hierarchy_level INTEGER,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.name_es,
        r.hierarchy_level,
        r.permissions
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CONFIRMACIÓN
-- ============================================

SELECT '✅ TABLA ROLES CREADA EXITOSAMENTE' as status;

-- Verificar datos
SELECT 
    'Total roles' as metric,
    COUNT(*) as count
FROM roles

UNION ALL

SELECT 
    'Usuarios con rol asignado',
    COUNT(*)
FROM users
WHERE role_id IS NOT NULL;

-- Mostrar roles creados
SELECT * FROM roles ORDER BY hierarchy_level DESC;