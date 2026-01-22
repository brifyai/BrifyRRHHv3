-- ========================================
-- TABLAS PRINCIPALES (CORE)
-- ========================================

-- 1. TABLA COMPANIES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('small', 'medium', 'large', 'enterprise')),
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Chile',
    timezone TEXT DEFAULT 'America/Santiago',
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_company_name UNIQUE (name)
);

-- 2. TABLA USERS (extendida de auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'user')),
    department TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA USER_COMPANIES (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
    is_primary BOOLEAN DEFAULT false,
    permissions TEXT[] DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_company UNIQUE (user_id, company_id)
);

-- 4. TABLA EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    region TEXT,
    level TEXT,
    work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
    contract_type TEXT CHECK (contract_type IN ('full_time', 'part_time', 'contractor', 'intern')),
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Chile',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    salary DECIMAL(12,2),
    currency TEXT DEFAULT 'CLP',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_company_employee_email UNIQUE (company_id, email)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);


-- ========================================
-- FUNCIONES Y TRIGGERS BÁSICOS
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para employees
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener companies del usuario
CREATE OR REPLACE FUNCTION get_user_companies()
RETURNS TABLE(company_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para companies
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
CREATE POLICY "Users can view their companies" ON companies
    FOR SELECT USING (id IN (SELECT company_id FROM get_user_companies()));

DROP POLICY IF EXISTS "Users can update their companies" ON companies;
CREATE POLICY "Users can update their companies" ON companies
    FOR UPDATE USING (id IN (SELECT company_id FROM get_user_companies()));

-- Políticas para users
DROP POLICY IF EXISTS "Users can view themselves" ON users;
CREATE POLICY "Users can view themselves" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update themselves" ON users;
CREATE POLICY "Users can update themselves" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para employees
DROP POLICY IF EXISTS "Users can view company employees" ON employees;
CREATE POLICY "Users can view company employees" ON employees
    FOR SELECT USING (company_id IN (SELECT company_id FROM get_user_companies()));

DROP POLICY IF EXISTS "Users can manage company employees" ON employees;
CREATE POLICY "Users can manage company employees" ON employees
    FOR ALL USING (company_id IN (SELECT company_id FROM get_user_companies()));

-- ========================================
-- CONFIRMACIÓN
-- ========================================

SELECT '✅ Tablas CORE creadas exitosamente!' as status;
SELECT 'Total de tablas:' as info, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'users', 'user_companies', 'employees');
