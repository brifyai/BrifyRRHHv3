# 🚨 SOLUCIÓN INMEDIATA: Error OAuth Google Drive - Tabla oauth_states Faltante

## 📋 **PROBLEMA IDENTIFICADO**

**Error:** `Could not find the table 'public.oauth_states' in the schema cache`  
**Causa:** La tabla `oauth_states` no existe en la base de datos de Supabase  
**Impacto:** No se puede conectar Google Drive ni iniciar procesos OAuth  

---

## 🔧 **SOLUCIÓN PASO A PASO**

### **PASO 1: Crear la Tabla en Supabase**

1. **🌐 Ir al Dashboard de Supabase:**
   ```
   https://supabase.com/dashboard
   ```

2. **🏢 Seleccionar el Proyecto:**
   - Buscar proyecto con URL: `tmqglnycivlcjijoymwe.supabase.co`

3. **📝 Abrir SQL Editor:**
   - En el menú lateral, hacer clic en "SQL Editor"

4. **🗂️ Crear Nueva Consulta:**
   - Hacer clic en "New query"

5. **📋 Copiar y Pegar el SQL:**
   
   ```sql
   -- =====================================================
   -- TABLA OAUTH_STATES PARA GOOGLE DRIVE INTEGRATION
   -- =====================================================
   
   -- Crear la tabla oauth_states
   CREATE TABLE IF NOT EXISTS oauth_states (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       state TEXT NOT NULL UNIQUE,
       company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
       integration_type TEXT NOT NULL CHECK (integration_type IN (
           'googleDrive',
           'googleMeet', 
           'slack',
           'teams',
           'hubspot',
           'brevo',
           'whatsappBusiness',
           'whatsappOfficial',
           'whatsappWAHA',
           'telegram'
       )),
       expires_at TIMESTAMPTZ NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- =====================================================
   -- ÍNDICES PARA OPTIMIZACIÓN
   -- =====================================================
   
   CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
   CREATE INDEX IF NOT EXISTS idx_oauth_states_company_id ON oauth_states(company_id);
   CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
   
   -- =====================================================
   -- ROW LEVEL SECURITY (RLS)
   -- =====================================================
   
   -- Habilitar RLS
   ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
   
   -- =====================================================
   -- POLÍTICAS DE SEGURIDAD
   -- =====================================================
   
   -- Política para SELECT
   CREATE POLICY "Users can view oauth states" ON oauth_states
       FOR SELECT USING (
           company_id IN (
               SELECT DISTINCT c.id 
               FROM companies c
               JOIN user_companies uc ON c.id = uc.company_id
               WHERE uc.user_id = auth.uid()
           )
       );
   
   -- Política para INSERT
   CREATE POLICY "Users can insert oauth states" ON oauth_states
       FOR INSERT WITH CHECK (
           company_id IN (
               SELECT DISTINCT c.id 
               FROM companies c
               JOIN user_companies uc ON c.id = uc.company_id
               WHERE uc.user_id = auth.uid()
           )
       );
   
   -- Política para UPDATE
   CREATE POLICY "Users can update oauth states" ON oauth_states
       FOR UPDATE USING (
           company_id IN (
               SELECT DISTINCT c.id 
               FROM companies c
               JOIN user_companies uc ON c.id = uc.company_id
               WHERE uc.user_id = auth.uid()
           )
       );
   
   -- Política para DELETE
   CREATE POLICY "Users can delete oauth states" ON oauth_states
       FOR DELETE USING (
           company_id IN (
               SELECT DISTINCT c.id 
               FROM companies c
               JOIN user_companies uc ON c.id = uc.company_id
               WHERE uc.user_id = auth.uid()
           )
       );
   
   -- =====================================================
   -- FUNCIÓN DE LIMPIEZA AUTOMÁTICA
   -- =====================================================
   
   -- Función para limpiar estados expirados
   CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
   RETURNS void AS $$
   BEGIN
       DELETE FROM oauth_states WHERE expires_at < NOW();
   END;
   $$ LANGUAGE plpgsql;
   
   -- =====================================================
   -- VERIFICACIÓN FINAL
   -- =====================================================
   
   -- Verificar que la tabla se creó correctamente
   SELECT 
       table_name,
       column_name,
       data_type,
       is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'oauth_states'
   ORDER BY ordinal_position;
   ```

6. **▶️ Ejecutar la Consulta:**
   - Hacer clic en "Run" (botón azul)

7. **✅ Verificar Creación:**
   - Ir a "Table Editor" en el menú lateral
   - Buscar la tabla "oauth_states" en la lista

### **PASO 2: Verificar en la Aplicación**

1. **🔄 Recargar la Aplicación:**
   - Actualizar la página o reiniciar el servidor de desarrollo

2. **🧪 Probar Google Drive:**
   - Ir a Configuración → Sincronización
   - Hacer clic en "Conectar" en Google Drive
   - Verificar que no aparezca el error

---

## 🛠️ **SOLUCIÓN ALTERNATIVA (Si el SQL falla)**

### **Crear Solo la Tabla Básica:**

Si el SQL completo falla, crear solo la tabla básica:

```sql
CREATE TABLE oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state TEXT NOT NULL UNIQUE,
    company_id UUID,
    integration_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Agregar RLS Después:**

```sql
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON oauth_states
    FOR ALL USING (true) WITH CHECK (true);
```

---

## 🧪 **SCRIPT DE VERIFICACIÓN**

Ejecutar este comando para verificar que la tabla existe:

```bash
node test_oauth_states_creation.mjs
```

---

## 📞 **SOPORTE ADICIONAL**

### **Si el Problema Persiste:**

1. **🔍 Verificar Permisos:**
   - Asegurarse de tener permisos de administrador en Supabase
   - Verificar que el proyecto esté activo

2. **📋 Revisar Logs:**
   - En Supabase Dashboard → Logs → Database
   - Buscar errores relacionados con oauth_states

3. **🔄 Reiniciar Conexión:**
   - Reiniciar el servidor de desarrollo
   - Limpiar cache del navegador

### **Archivos de Referencia:**

- `OAUTH_STATES_TABLE_CREATION.sql` - SQL completo optimizado
- `database/oauth_states.sql` - SQL original
- `fix_oauth_states_table.mjs` - Script de diagnóstico

---

## ✅ **RESULTADO ESPERADO**

Después de crear la tabla:

1. **✅ Error OAuth eliminado**
2. **✅ Google Drive conectable**
3. **✅ Integraciones funcionando**
4. **✅ Aplicación completamente operativa**

---

**📅 Fecha:** 2025-11-24  
**🔧 Estado:** Solución lista para implementar  
**⏱️ Tiempo estimado:** 5-10 minutos