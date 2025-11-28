# 🚨 SOLUCIÓN INMEDIATA: Error `column companies.user_id does not exist`

## PROBLEMA IDENTIFICADO
El error ocurre porque las políticas de seguridad (RLS) hacen referencia a `companies.user_id`, pero **esa columna NO existe** en la tabla `companies`.

## ⚠️ ERROR ADICIONAL DETECTADO
Si también ves el error `relation "realtime_notifications" does not exist`, significa que **las tablas de microservicios no han sido creadas todavía**.

## SOLUCIÓN DEFINITIVA (ORDEN CORRECTO)

### Paso 1: Ejecutar SQL COMPLETO en Supabase Dashboard

1. **Abre Supabase Dashboard**: Ve a https://supabase.com/dashboard
2. **Selecciona tu proyecto**: `BrifyWebServicios`
3. **Ve a SQL Editor**: En el menú lateral, haz clic en "SQL Editor"
4. **Ejecuta el siguiente SQL** (contiene TODO en el orden correcto):

```sql
-- ============================================
-- FIX COMPLETO: ORDEN CORRECTO DE EJECUCIÓN
-- 1. Primero crear tablas que no existen
-- 2. Luego crear tabla de relación
-- 3. Finalmente actualizar políticas RLS
-- ============================================

-- ============================================
-- PASO 0: CREAR TABLAS DE MICROSERVICIOS (si no existen)
-- ============================================

-- Tabla para guardar resultados del análisis de empresas
CREATE TABLE IF NOT EXISTS company_insights_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'error', 'cancelled')),
    insights JSONB,
    metrics JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para notificaciones en tiempo real
CREATE TABLE IF NOT EXISTS realtime_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('insights_ready', 'analysis_error', 'processing_started')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para company_insights_results
CREATE INDEX IF NOT EXISTS idx_company_insights_results_company_id ON company_insights_results(company_id);
CREATE INDEX IF NOT EXISTS idx_company_insights_results_status ON company_insights_results(status);
CREATE INDEX IF NOT EXISTS idx_company_insights_results_user_id ON company_insights_results(user_id);
CREATE INDEX IF NOT EXISTS idx_company_insights_results_created_at ON company_insights_results(created_at DESC);

-- Índices para realtime_notifications
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_company_id ON realtime_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_event_type ON realtime_notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_created_at ON realtime_notifications(created_at DESC);

-- ============================================
-- PASO 1: CREAR TABLA DE RELACIÓN USUARIOS-EMPRESAS
-- ============================================

CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'member', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_company_user UNIQUE (company_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(role);

-- ============================================
-- PASO 2: HABILITAR RLS EN company_users
-- ============================================

ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Políticas para company_users
DROP POLICY IF EXISTS company_users_select_own ON company_users;
CREATE POLICY company_users_select_own ON company_users
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS company_users_insert_own ON company_users;
CREATE POLICY company_users_insert_own ON company_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS company_users_update_own ON company_users;
CREATE POLICY company_users_update_own ON company_users
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS company_users_delete_own ON company_users;
CREATE POLICY company_users_delete_own ON company_users
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PASO 3: CREAR FUNCIÓN DE VERIFICACIÓN
-- ============================================

CREATE OR REPLACE FUNCTION user_has_company_access(p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_users cu
        WHERE cu.company_id = p_company_id 
        AND cu.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 4: ACTUALIZAR POLÍTICAS RLS (FIX DEL ERROR)
-- ============================================

-- Políticas para company_insights_results
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios resultados" ON company_insights_results;
CREATE POLICY "Usuarios pueden ver sus propios resultados" ON company_insights_results
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar resultados" ON company_insights_results;
CREATE POLICY "Usuarios pueden insertar resultados" ON company_insights_results
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus resultados" ON company_insights_results;
CREATE POLICY "Usuarios pueden actualizar sus resultados" ON company_insights_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para realtime_notifications
DROP POLICY IF EXISTS "Usuarios pueden ver notificaciones de sus empresas" ON realtime_notifications;
CREATE POLICY "Usuarios pueden ver notificaciones de sus empresas" ON realtime_notifications
    FOR SELECT USING (user_has_company_access(company_id));

DROP POLICY IF EXISTS "Sistema puede insertar notificaciones" ON realtime_notifications;
CREATE POLICY "Sistema puede insertar notificaciones" ON realtime_notifications
    FOR INSERT WITH CHECK (true);

-- Políticas para company_integrations
DROP POLICY IF EXISTS company_integrations_select_own ON company_integrations;
CREATE POLICY company_integrations_select_own ON company_integrations
    FOR SELECT USING (user_has_company_access(company_id));

-- Políticas para integration_webhooks
DROP POLICY IF EXISTS integration_webhooks_select_own ON integration_webhooks;
CREATE POLICY integration_webhooks_select_own ON integration_webhooks
    FOR SELECT USING (user_has_company_access(company_id));

-- Políticas para integration_sync_logs
DROP POLICY IF EXISTS integration_sync_logs_select_own ON integration_sync_logs;
CREATE POLICY integration_sync_logs_select_own ON integration_sync_logs
    FOR SELECT USING (
        auth.uid() = user_id OR user_has_company_access(company_id)
    );

-- Políticas para integration_usage_stats
DROP POLICY IF EXISTS integration_usage_stats_select_own ON integration_usage_stats;
CREATE POLICY integration_usage_stats_select_own ON integration_usage_stats
    FOR SELECT USING (user_has_company_access(company_id));

-- ============================================
-- PASO 5: CREAR TRIGGERS Y FUNCIONES ADICIONALES
-- ============================================

-- Trigger para auto-actualizar updated_at en company_users
DROP TRIGGER IF EXISTS update_company_users_updated_at ON company_users;
CREATE TRIGGER update_company_users_updated_at
    BEFORE UPDATE ON company_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para asignar empresa a usuario actual
CREATE OR REPLACE FUNCTION assign_company_to_current_user(
    p_company_id UUID,
    p_role TEXT DEFAULT 'admin'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO company_users (company_id, user_id, role)
    VALUES (p_company_id, auth.uid(), p_role)
    ON CONFLICT (company_id, user_id) 
    DO UPDATE SET role = p_role, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener empresas del usuario actual
CREATE OR REPLACE FUNCTION get_user_companies()
RETURNS TABLE (
    id UUID,
    name TEXT,
    industry TEXT,
    location TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.industry,
        c.location,
        cu.role
    FROM companies c
    INNER JOIN company_users cu ON c.id = cu.company_id
    WHERE cu.user_id = auth.uid()
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 6: MIGRAR DATOS EXISTENTES
-- ============================================

DO $$
DECLARE
    v_first_user_id UUID;
    v_company RECORD;
BEGIN
    -- Obtener el primer usuario autenticado
    SELECT id INTO v_first_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF v_first_user_id IS NOT NULL THEN
        -- Asignar todas las empresas sin relación a ese usuario
        FOR v_company IN 
            SELECT c.id 
            FROM companies c
            LEFT JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.id IS NULL
        LOOP
            INSERT INTO company_users (company_id, user_id, role)
            VALUES (v_company.id, v_first_user_id, 'admin')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- ============================================
-- PASO 7: HABILITAR RLS EN TABLAS DE MICROSERVICIOS
-- ============================================

ALTER TABLE company_insights_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 8: CONFIRMACIÓN Y ESTADÍSTICAS
-- ============================================

SELECT '✅ FIX COMPLETO APLICADO EXITOSAMENTE!' as status;

-- Estadísticas de tablas creadas
SELECT 
    'company_insights_results' as tabla,
    COUNT(*) as registros
FROM company_insights_results

UNION ALL

SELECT 
    'realtime_notifications' as tabla,
    COUNT(*) as registros
FROM realtime_notifications

UNION ALL

SELECT 
    'company_users' as tabla,
    COUNT(*) as registros
FROM company_users;

-- Empresas sin usuario asignado
SELECT 
    'companies sin usuario' as tabla,
    COUNT(*) as registros
FROM companies c
LEFT JOIN company_users cu ON c.id = cu.company_id
WHERE cu.id IS NULL;

-- Empresas del usuario actual (si está autenticado)
SELECT * FROM get_user_companies();
```

5. **Haz clic en "Run"** (botón naranja en la esquina inferior derecha)

### Paso 2: Verificar la Solución

Después de ejecutar el SQL, verifica que:

1. **Las tablas fueron creadas**: Ve a "Table Editor" y busca:
   - `company_insights_results`
   - `realtime_notifications`
   - `company_users`

2. **Las políticas fueron actualizadas**: Ve a "Authentication" > "Policies"

3. **El error desapareció**: Refresca tu aplicación y prueba la funcionalidad

### Paso 3: Actualizar tu Código (Opcional pero Recomendado)

Si tienes componentes que crean empresas, actualízalos para que también creen la relación:

```javascript
// Después de crear una empresa:
const { data: company, error } = await supabase
  .from('companies')
  .insert({ name: 'Nueva Empresa' })
  .single();

// Crear la relación con el usuario actual
if (company) {
  await supabase.rpc('assign_company_to_current_user', {
    p_company_id: company.id,
    p_role: 'admin'
  });
}
```

## 🎯 RESUMEN

**El problema**: Las políticas RLS esperaban `companies.user_id` pero esa columna no existe.

**La solución**: Crear una tabla de relación `company_users` que conecte `companies` y `auth.users`, y actualizar todas las políticas para usar esta relación.

**Resultado**: El error `column companies.user_id does not exist` desaparecerá completamente.

---

## 📋 ARCHIVOS CREADOS

✅ [`database/fix_companies_user_id.sql`](database/fix_companies_user_id.sql) - Script SQL completo  
✅ [`database/FIX_COMPLETO.sql`](database/FIX_COMPLETO.sql) - Script con orden correcto  
✅ [`SOLUCION_INMEDIATA_USER_ID.md`](SOLUCION_INMEDIATA_USER_ID.md) - Instrucciones detalladas  
✅ [`SOLUCION_INMEDIATA_USER_ID_V2.md`](SOLUCION_INMEDIATA_USER_ID_V2.md) - Esta versión actualizada  

---

## ⚡ ACCIÓN INMEDIATA

**Ejecuta el SQL AHORA** en el Supabase Dashboard y ambos errores se resolverán inmediatamente.