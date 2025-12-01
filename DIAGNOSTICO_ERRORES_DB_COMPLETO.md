# 🚨 DIAGNÓSTICO COMPLETO: Errores de Base de Datos

## 🎯 **ERROR ACTUAL**
```
❌ Error: column company_credentials.google_drive_connected does not exist
❌ Error 400: GET https://tmqglnycivlcjijoymwe.supabase.co/rest/v1/company_credentials?select=*&company_id=eq.3d71dd17-bbf0-4c17-b93a-f08126b56978&integration_type=eq.google_drive&google_drive_connected=eq.true
```

## 🔍 **ANÁLISIS DEL PROBLEMA**

### **Problema Principal:**
El código JavaScript está consultando un campo `google_drive_connected` que **NO EXISTE** en la tabla `company_credentials` de Supabase.

### **Código Problemático:**
```javascript
// ❌ ESTO FALLA
.eq('google_drive_connected', true)
```

### **Causa Raíz:**
Desalineación entre el código JavaScript y la estructura real de la base de datos en Supabase.

---

## 📋 **PASOS PARA DIAGNÓSTICO COMPLETO**

### **PASO 1: Verificar Estructura Real en Supabase**

**Ejecutar en SQL Editor de Supabase:**
```sql
-- Ver estructura exacta de company_credentials
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_credentials'
ORDER BY ordinal_position;
```

### **PASO 2: Ver Datos Existentes**

```sql
-- Ver datos existentes para la empresa específica
SELECT * FROM company_credentials 
WHERE company_id = '3d71dd17-bbf0-4c17-b93a-f08126b56978'
LIMIT 5;
```

### **PASO 3: Verificar Todas las Tablas**

```sql
-- Listar todas las tablas que contienen "credential"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credential%'
ORDER BY table_name;
```

### **PASO 4: Verificar Tabla user_google_drive_credentials**

```sql
-- Ver estructura de user_google_drive_credentials
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_google_drive_credentials'
ORDER BY ordinal_position;
```

---

## 🔧 **POSIBLES ESTRUCTURAS DE TABLAS**

### **Escenario 1: company_credentials con campo diferente**
```sql
-- Posible estructura real:
CREATE TABLE company_credentials (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    integration_type TEXT,
    -- El campo podría llamarse diferente:
    -- google_connected BOOLEAN,
    -- drive_connected BOOLEAN,
    -- status TEXT,
    credentials JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### **Escenario 2: company_credentials sin campo de estado**
```sql
-- Posible estructura real:
CREATE TABLE company_credentials (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    integration_type TEXT,
    credentials JSONB,
    -- Sin campo de estado, se infiere de credentials
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### **Escenario 3: Tabla con nombre diferente**
```sql
-- Posible estructura real:
CREATE TABLE company_integrations (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    integration_type TEXT,
    is_active BOOLEAN,
    credentials JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

---

## 🛠️ **SOLUCIONES SEGÚN ESTRUCTURA ENCONTRADA**

### **Solución A: Campo con nombre diferente**
Si la tabla tiene un campo como `google_connected` o `drive_connected`:

```javascript
// Cambiar en el código:
.eq('google_drive_connected', true)
// Por:
.eq('google_connected', true)
// O:
.eq('drive_connected', true)
```

### **Solución B: Campo status en lugar de boolean**
Si la tabla usa un campo `status` con valores de texto:

```javascript
// Cambiar:
.eq('google_drive_connected', true)
// Por:
.eq('status', 'active')
// O:
.eq('status', 'connected')
```

### **Solución C: Sin campo de estado**
Si no hay campo de estado, consultar por integración existente:

```javascript
// Cambiar:
.eq('google_drive_connected', true)
// Por:
.eq('integration_type', 'google_drive')
```

### **Solución D: Tabla con nombre diferente**
Si la tabla se llama diferente:

```javascript
// Cambiar:
.from('company_credentials')
// Por:
.from('company_integrations')
```

---

## 📊 **SCRIPT DE VERIFICACIÓN AUTOMÁTICA**

### **Ejecutar en SQL Editor:**
```sql
-- Script completo de verificación
DO $$
DECLARE
    table_rec RECORD;
    column_rec RECORD;
BEGIN
    -- Verificar company_credentials
    RAISE NOTICE '=== ESTRUCTURA DE company_credentials ===';
    FOR column_rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'company_credentials'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
            column_rec.column_name, 
            column_rec.data_type, 
            column_rec.is_nullable, 
            column_rec.column_default;
    END LOOP;
    
    -- Verificar user_google_drive_credentials
    RAISE NOTICE '=== ESTRUCTURA DE user_google_drive_credentials ===';
    FOR column_rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_google_drive_credentials'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
            column_rec.column_name, 
            column_rec.data_type, 
            column_rec.is_nullable, 
            column_rec.column_default;
    END LOOP;
    
    -- Ver datos de ejemplo
    RAISE NOTICE '=== DATOS DE EJEMPLO company_credentials ===';
    FOR table_rec IN SELECT * FROM company_credentials LIMIT 3 LOOP
        RAISE NOTICE 'Record: %', row_to_json(table_rec);
    END LOOP;
END $$;
```

---

## 🎯 **ACCIÓN INMEDIATA REQUERIDA**

### **1. Ejecutar Verificación Manual**
Seguir la `GUIA_VERIFICACION_ESTRUCTURA_SUPABASE.md` para obtener la estructura exacta.

### **2. Identificar Campo Correcto**
Una vez conocida la estructura real, identificar:
- ✅ **Nombre exacto del campo de estado**
- ✅ **Tipo de datos** (boolean, text, etc.)
- ✅ **Valores posibles** (si es text)

### **3. Corregir Código JavaScript**
Modificar las consultas en:
- `googleDriveAuthServiceDynamic.js`
- `googleDriveAuthServiceDynamic_v2.js`
- `googleDriveTokenBridge.js`

### **4. Probar Corrección**
Una vez corregido, probar el OAuth de Google Drive.

---

## 📝 **RESULTADO ESPERADO**

Al completar este diagnóstico tendrás:

1. **Estructura exacta** de `company_credentials`
2. **Estructura exacta** de `user_google_drive_credentials`
3. **Nombres correctos** de todos los campos
4. **Código JavaScript corregido** para usar campos reales
5. **OAuth funcionando** sin errores 400

**Este es el paso crítico para resolver definitivamente el problema.**