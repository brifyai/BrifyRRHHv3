-- ========================================
-- TABLAS IMPORTANTES PARA STAFFHUB
-- Funcionalidad avanzada (Skills, Projects, Compliance)
-- ========================================

-- 1. SKILLS (Catálogo de habilidades)
-- ========================================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);

-- 2. EMPLOYEE_SKILLS (Habilidades por empleado)
-- ========================================
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, skill_id)
);

CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);

-- 3. INTERESTS (Catálogo de intereses)
-- ========================================
CREATE TABLE IF NOT EXISTS interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interests_name ON interests(name);
CREATE INDEX idx_interests_category ON interests(category);

-- 4. EMPLOYEE_INTERESTS (Intereses por empleado)
-- ========================================
CREATE TABLE IF NOT EXISTS employee_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    interest_level VARCHAR(50) CHECK (interest_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, interest_id)
);

CREATE INDEX idx_employee_interests_employee ON employee_interests(employee_id);
CREATE INDEX idx_employee_interests_interest ON employee_interests(interest_id);

-- 5. PROJECTS (Proyectos)
-- ========================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(manager_id);

-- 6. PROJECT_ASSIGNMENTS (Asignaciones a proyectos)
-- ========================================
CREATE TABLE IF NOT EXISTS project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role TEXT,
    allocation_percentage INTEGER CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, employee_id)
);

CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_employee ON project_assignments(employee_id);
CREATE INDEX idx_project_assignments_active ON project_assignments(is_active);

-- 7. USER_CONSENT (Consentimientos - GDPR/Legal)
-- ========================================
CREATE TABLE IF NOT EXISTS user_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_consent_company ON user_consent(company_id);
CREATE INDEX idx_user_consent_employee ON user_consent(employee_id);
CREATE INDEX idx_user_consent_status ON user_consent(status);
CREATE INDEX idx_user_consent_type ON user_consent(consent_type);

-- 8. CONSENT_HISTORY (Historial de consentimientos)
-- ========================================
CREATE TABLE IF NOT EXISTS consent_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES user_consent(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('granted', 'revoked', 'renewed', 'expired')),
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_history_consent ON consent_history(consent_id);
CREATE INDEX idx_consent_history_action ON consent_history(action);
CREATE INDEX idx_consent_history_created ON consent_history(created_at DESC);

-- 9. WHATSAPP_LOGS (Logs de WhatsApp)
-- ========================================
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    message_type VARCHAR(50) CHECK (message_type IN ('text', 'image', 'document', 'template')),
    message_content TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    whatsapp_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_logs_company ON whatsapp_logs(company_id);
CREATE INDEX idx_whatsapp_logs_employee ON whatsapp_logs(employee_id);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX idx_whatsapp_logs_created ON whatsapp_logs(created_at DESC);

-- 10. COMPLIANCE_LOGS (Logs de cumplimiento)
-- ========================================
CREATE TABLE IF NOT EXISTS compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT,
    severity VARCHAR(50) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    affected_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    action_taken TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_logs_company ON compliance_logs(company_id);
CREATE INDEX idx_compliance_logs_event_type ON compliance_logs(event_type);
CREATE INDEX idx_compliance_logs_severity ON compliance_logs(severity);
CREATE INDEX idx_compliance_logs_created ON compliance_logs(created_at DESC);

-- 11. COMMUNICATION_BLOCKED_LOGS (Comunicaciones bloqueadas)
-- ========================================
CREATE TABLE IF NOT EXISTS communication_blocked_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    attempted_content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_blocked_company ON communication_blocked_logs(company_id);
CREATE INDEX idx_communication_blocked_employee ON communication_blocked_logs(employee_id);
CREATE INDEX idx_communication_blocked_created ON communication_blocked_logs(created_at DESC);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Skills (público para lectura)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);

-- Employee Skills
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view employee skills in their companies"
    ON employee_skills FOR SELECT
    USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN user_companies uc ON e.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Interests (público para lectura)
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view interests" ON interests FOR SELECT USING (true);

-- Employee Interests
ALTER TABLE employee_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view employee interests in their companies"
    ON employee_interests FOR SELECT
    USING (
        employee_id IN (
            SELECT e.id FROM employees e
            JOIN user_companies uc ON e.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their company projects"
    ON projects FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Project Assignments
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view project assignments in their companies"
    ON project_assignments FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN user_companies uc ON p.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- User Consent
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view consent in their companies"
    ON user_consent FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- WhatsApp Logs
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view whatsapp logs in their companies"
    ON whatsapp_logs FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Compliance Logs
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view compliance logs in their companies"
    ON compliance_logs FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Communication Blocked Logs
ALTER TABLE communication_blocked_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view blocked logs in their companies"
    ON communication_blocked_logs FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consent_updated_at
    BEFORE UPDATE ON user_consent
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT '✅ Tablas importantes creadas exitosamente' as status;
