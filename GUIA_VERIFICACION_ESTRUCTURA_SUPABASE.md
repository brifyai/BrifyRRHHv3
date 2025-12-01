# 🔍 GUÍA PASO A PASO: Verificación de Estructura de Base de Datos en Supabase

## 🎯 **OBJETIVO**
Identificar la estructura EXACTA de las tablas en Supabase para corregir definitivamente los errores de consultas.

---

## 📋 **PASO 1: Acceder al Dashboard de Supabase**

### **1.1 Abrir Dashboard**
- **URL**: `https://supabase.com/dashboard`
- **Seleccionar proyecto**: BrifyRRHH (tu proyecto)
- **Credenciales**: Usar las mismas que usas para acceder

### **1.2 Navegar a SQL Editor**
- En el menú lateral izquierdo, hacer clic en **"SQL Editor"**
- **URL directa**: `https://supabase.com/dashboard/project/[tu-proyecto-id]/sql-editor`

---

## 📋 **PASO 2: Verificar Estructura de Tablas**

### **2.1 Consultar Tabla company_credentials**

**Ejecutar en SQL Editor:**
```sql
-- Verificar si la tabla existe y obtener su estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_credentials'
ORDER BY ordinal_position;
```

**Resultado esperado:**
- Si la tabla existe: Verás una lista de columnas
- Si no existe: Error "relation does not exist"

### **2.2 Consultar Tabla user_google_drive_credentials**

**Ejecutar en SQL Editor:**
```sql
-- Verificar si la tabla existe y obtener su estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_google_drive_credentials'
ORDER BY ordinal_position;
```

### **2.3 Verificar Datos Existentes**

**Para company_credentials:**
```sql
-- Ver datos existentes en company_credentials
SELECT * FROM company_credentials LIMIT 5;
```

**Para user_google_drive_credentials:**
```sql
-- Ver datos existentes en user_google_drive_credentials
SELECT * FROM user_google_drive_credentials LIMIT 5;
```

---

## 📋 **PASO 3: Verificar Políticas RLS**

### **3.1 Políticas para company_credentials**
```sql
-- Ver políticas RLS de company_credentials
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'company_credentials'
ORDER BY policyname;
```

### **3.2 Políticas para user_google_drive_credentials**
```sql
-- Ver políticas RLS de user_google_drive_credentials
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_google_drive_credentials'
ORDER BY policyname;
```

---

## 📋 **PASO 4: Verificar Índices**

### **4.1 Índices para company_credentials**
```sql
-- Ver índices de company_credentials
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'company_credentials'
ORDER BY indexname;
```

### **4.2 Índices para user_google_drive_credentials**
```sql
-- Ver índices de user_google_drive_credentials
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_google_drive_credentials'
ORDER BY indexname;
```

---

## 📋 **PASO 5: Verificar Tabla de Empresas**

### **5.1 Consultar tabla companies**
```sql
-- Ver estructura de companies
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies'
ORDER BY ordinal_position;
```

### **5.2 Ver datos de la empresa específica**
```sql
-- Ver datos de la empresa con ID específico
SELECT * FROM companies 
WHERE id = '3d71dd17-bbf0-4c17-b93a-f08126b56978';
```

---

## 📋 **PASO 6: Verificar Todas las Tablas del Sistema**

### **6.1 Listar todas las tablas**
```sql
-- Ver todas las tablas en el esquema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### **6.2 Ver tablas relacionadas con credenciales**
```sql
-- Buscar tablas que contengan "credential" en el nombre
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credential%'
ORDER BY table_name;
```

---

## 📋 **PASO 7: Verificar Restricciones y Constraints**

### **7.1 Constraints para company_credentials**
```sql
-- Ver constraints de company_credentials
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'company_credentials'::regclass;
```

### **7.2 Constraints para user_google_drive_credentials**
```sql
-- Ver constraints de user_google_drive_credentials
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'user_google_drive_credentials'::regclass;
```

---

## 📋 **PASO 8: Verificar Funciones y Triggers**

### **8.1 Funciones relacionadas**
```sql
-- Ver funciones que contengan "google_drive" en el nombre
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%google_drive%'
ORDER BY routine_name;
```

### **8.2 Triggers relacionados**
```sql
-- Ver triggers relacionados con nuestras tablas
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('company_credentials', 'user_google_drive_credentials')
ORDER BY event_object_table, trigger_name;
```

---

## 📋 **PASO 9: Verificar Permisos**

### **9.1 Permisos para company_credentials**
```sql
-- Ver permisos de la tabla company_credentials
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'company_credentials'
ORDER BY grantee, privilege_type;
```

### **9.2 Permisos para user_google_drive_credentials**
```sql
-- Ver permisos de la tabla user_google_drive_credentials
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'user_google_drive_credentials'
ORDER BY grantee, privilege_type;
```

---

## 📋 **PASO 10: Documentar Resultados**

### **10.1 Crear Documento de Estructura**
Para cada tabla, documentar:
- ✅ **Nombre de la tabla**
- ✅ **Campos existentes** (nombre, tipo, nullable)
- ✅ **Índices existentes**
- ✅ **Políticas RLS**
- ✅ **Constraints**
- ✅ **Permisos**

### **10.2 Identificar Discrepancias**
Comparar con el código JavaScript para identificar:
- ❌ **Campos que el código busca pero no existen**
- ❌ **Campos que existen pero el código no usa**
- ❌ **Tipos de datos incorrectos**
- ❌ **Políticas RLS que bloquean acceso**

---

## 🚨 **RESULTADO ESPERADO**

Al final de este proceso tendrás:

1. **Estructura exacta** de cada tabla
2. **Nombres correctos** de todos los campos
3. **Políticas RLS** configuradas
4. **Permisos** de acceso
5. **Identificación precisa** de qué está causando los errores

---

## 📝 **PRÓXIMOS PASOS**

Una vez que tengas esta información:

1. **Comparar** con el código JavaScript
2. **Corregir** nombres de campos incorrectos
3. **Ajustar** consultas que usan campos inexistentes
4. **Crear** campos faltantes si es necesario
5. **Configurar** políticas RLS correctas

**Esta información será la base para la solución definitiva.**