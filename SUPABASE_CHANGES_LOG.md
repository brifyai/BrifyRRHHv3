# 📋 REGISTRO DE CAMBIOS EN SUPABASE

## Última Actualización: 25-11-2025

Este documento registra todos los cambios manuales realizados en el dashboard de Supabase que afectan la base de datos del proyecto BrifyRRHHv3.

---

## 🚨 CAMBIOS CRÍTICOS - system_configurations

### **Problema Identificado**
Error 400 al guardar configuraciones: `new row violates row-level security policy for table "system_configurations"`

### **Solución Aplicada**

#### **PASO 1: Habilitar RLS y Crear Políticas**

**Fecha**: 25-11-2025  
**Ubicación**: Supabase > SQL Editor  
**SQL Ejecutado**:

```sql
-- ======================================================
-- POLÍTICAS RLS PARA system_configurations
-- ======================================================

-- Asegurar que RLS está habilitado
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- ✅ PERMITIR SELECT (lectura)
DROP POLICY IF EXISTS "Permitir lectura de configuraciones" ON system_configurations;
CREATE POLICY "Permitir lectura de configuraciones" ON system_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- ✅ PERMITIR INSERT (creación)
DROP POLICY IF EXISTS "Permitir creación de configuraciones" ON system_configurations;
CREATE POLICY "Permitir creación de configuraciones" ON system_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ✅ PERMITIR UPDATE (actualización)
DROP POLICY IF EXISTS "Permitir actualización de configuraciones" ON system_configurations;
CREATE POLICY "Permitir actualización de configuraciones" ON system_configurations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ✅ PERMITIR DELETE (eliminación)
DROP POLICY IF EXISTS "Permitir eliminación de configuraciones" ON system_configurations;
CREATE POLICY "Permitir eliminación de configuraciones" ON system_configurations
  FOR DELETE
  TO authenticated
  USING (true);

-- Verificar políticas creadas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'system_configurations'
ORDER BY policyname;
```

**Resultado**: ✅ Políticas creadas exitosamente  
**Verificado con**: `node verify_rls_fix.mjs`

---

#### **PASO 2: (Opcional) Recreación de Tabla si Persiste el Error**

**Solo ejecutar si el error 42501 persiste después del Paso 1**

```sql
-- ======================================================
-- RECREAR TABLA system_configurations (EMERGENCY FIX)
-- ======================================================
-- ⚠️  ESTO BORRARÁ TODOS LOS DATOS EXISTENTES
-- ======================================================

-- Paso 1: Deshabilitar RLS temporalmente
ALTER TABLE system_configurations DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar tabla existente
DROP TABLE IF EXISTS system_configurations CASCADE;

-- Paso 3: Crear tabla desde cero
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scope TEXT NOT NULL DEFAULT 'global',
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, scope, company_id, category, config_key)
);

-- Paso 4: Crear índices
CREATE INDEX idx_system_config_user ON system_configurations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_system_config_company ON system_configurations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_system_config_category ON system_configurations(category, config_key);
CREATE INDEX idx_system_config_active ON system_configurations(is_active) WHERE is_active = true;

-- Paso 5: Habilitar RLS
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Paso 6: Políticas básicas
CREATE POLICY "Permitir todo a authenticated" ON system_configurations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Bypass RLS para service_role" ON system_configurations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Paso 7: Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Paso 8: Verificar
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'system_configurations') as policy_count
FROM pg_tables 
WHERE tablename = 'system_configurations';
```

---

## 📊 ESTADO DE LA BASE DE DATOS

### **Tablas Críticas Verificadas**

| Tabla | RLS Habilitado | Políticas | Estado |
|-------|---------------|-----------|--------|
| `system_configurations` | ✅ Sí | 4 políticas | ✅ Operativa |
| `company_credentials` | ✅ Sí | 3 políticas | ✅ Operativa |
| `employee_folders` | ✅ Sí | 2 políticas | ✅ Operativa |

---

## 🔐 PERMISOS Y POLÍTICAS

### **Roles de Supabase**
- `authenticated`: Usuarios logueados (aplicación)
- `service_role`: Backend/API (bypass total RLS)

### **Políticas por Tabla**

#### **system_configurations**
1. ✅ `Permitir lectura de configuraciones` (SELECT)
2. ✅ `Permitir creación de configuraciones` (INSERT)
3. ✅ `Permitir actualización de configuraciones` (UPDATE)
4. ✅ `Permitir eliminación de configuraciones` (DELETE)

---

## 📝 INSTRUCCIONES PARA FUTUROS CAMBIOS

### **Si necesitas modificar políticas RLS:**

1. **NO modifiques directamente** en Supabase sin documentar
2. **Crea un archivo SQL** en `database/` con los cambios
3. **Ejecuta** en Supabase > SQL Editor
4. **Actualiza este archivo** con el registro
5. **Commit a Git** el archivo SQL

### **Ejemplo de flujo de trabajo:**

```bash
# 1. Crear archivo con cambios
code database/fix_nueva_politica.sql

# 2. Ejecutar en Supabase Dashboard

# 3. Actualizar este log
code SUPABASE_CHANGES_LOG.md

# 4. Commit y push
git add database/fix_nueva_politica.sql SUPABASE_CHANGES_LOG.md
git commit -m "Add: Nueva política RLS para X tabla"
git push origin main
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

1. **Los cambios en Supabase NO se sincronizan automáticamente con Git**
2. **Este archivo es la única fuente de verdad** de configuraciones manuales
3. **Siempre verifica** con `node verify_rls_fix.mjs` después de aplicar cambios
4. **Backup antes de DROP TABLE** - los datos se pierden irreversiblemente

---

## 📞 CONTACTO Y SOPORTE

Para problemas con Supabase:
- Dashboard: https://supabase.com/dashboard
- Documentación: https://supabase.com/docs
- Email: soporte@brify.ai

**Última persona que modificó**: [Tu nombre]  
**Fecha de última modificación**: 25-11-2025