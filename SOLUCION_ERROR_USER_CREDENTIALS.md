# 🔧 SOLUCIÓN - Error "column service_name does not exist"

**Error:** `ERROR: 42703: column "service_name" does not exist`  
**Causa:** Conflicto entre dos definiciones de `user_credentials`  
**Estado:** ✅ RESUELTO

---

## 🎯 **PROBLEMA:**

La tabla `user_credentials` se define en **DOS lugares diferentes** con estructuras distintas:

### **1. En `complete_database_setup.sql`:**
```sql
CREATE TABLE user_credentials (
    id UUID,
    user_id UUID,
    google_access_token TEXT,
    google_refresh_token TEXT,
    microsoft_access_token TEXT,
    whatsapp_access_token TEXT,
    email_api_key TEXT,
    -- Columnas específicas por servicio
    ...
);
```

### **2. En `05_optional_tables.sql` (antiguo):**
```sql
CREATE TABLE user_credentials (
    id UUID,
    user_id UUID,
    service_name VARCHAR(100),  -- ❌ Esta columna no existe en la otra definición
    credentials JSONB,
    ...
);
```

Cuando ejecutas `complete_database_setup.sql` primero, crea la tabla sin `service_name`.  
Luego, cuando ejecutas `05_optional_tables.sql`, intenta crear índices y políticas para `service_name` que no existe.

---

## ✅ **SOLUCIÓN APLICADA:**

He actualizado `database/05_optional_tables.sql` para:

1. **Verificar si la tabla ya existe** antes de crearla
2. **Solo crear índices** si la columna `service_name` existe
3. **Solo aplicar políticas RLS** si la estructura es correcta

---

## 🚀 **QUÉ HACER AHORA:**

### **Opción 1: Si aún NO has ejecutado los scripts**

Simplemente ejecuta los scripts en orden normal. El problema ya está resuelto:

1. `database/01_core_tables.sql`
2. `COMPLETE_INTEGRATIONS_TABLES.sql`
3. `database/03_critical_tables.sql`
4. `database/04_important_tables.sql`
5. `supabase_knowledge_simple.sql`
6. `database/complete_database_setup.sql`
7. `database/05_optional_tables.sql` ✅ (ya corregido)

### **Opción 2: Si YA ejecutaste y obtuviste el error**

Ejecuta el script de corrección:

```sql
-- En Supabase SQL Editor:
-- Copiar y pegar todo el contenido de:
FIX_USER_CREDENTIALS_ERROR.sql
```

Este script:
- ✅ Verifica la estructura actual de `user_credentials`
- ✅ Limpia políticas que puedan haber fallado
- ✅ Crea política genérica que funciona con ambas estructuras
- ✅ Verifica que todo esté correcto

Luego, vuelve a ejecutar `database/05_optional_tables.sql` (ya corregido).

---

## 🔍 **VERIFICACIÓN:**

Después de aplicar la solución, verifica:

```sql
-- 1. Ver estructura de user_credentials
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_credentials'
ORDER BY ordinal_position;

-- 2. Ver políticas RLS
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_credentials';

-- 3. Verificar que la tabla existe
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_credentials'
) as tabla_existe;
```

---

## 📝 **ESTRUCTURA FINAL:**

La tabla `user_credentials` quedará con la estructura de `complete_database_setup.sql`:

```sql
user_credentials:
- id
- user_id
- google_access_token
- google_refresh_token
- google_token_expires_at
- google_scope
- microsoft_access_token
- microsoft_refresh_token
- microsoft_token_expires_at
- microsoft_scope
- whatsapp_access_token
- whatsapp_phone_number_id
- whatsapp_webhook_secret
- whatsapp_verify_token
- email_api_key
- email_sender_email
- email_sender_name
- created_at
- updated_at
```

Esta estructura es **más específica** y funciona bien para StaffHub.

---

## ✅ **RESULTADO:**

- ✅ Error resuelto
- ✅ Script `05_optional_tables.sql` actualizado
- ✅ Script de corrección `FIX_USER_CREDENTIALS_ERROR.sql` creado
- ✅ Todo enviado a Git (commit: 4158a44)

---

## 🎯 **RESUMEN:**

| Antes | Ahora |
|-------|-------|
| ❌ Error al ejecutar 05_optional_tables.sql | ✅ Script corregido |
| ❌ Conflicto entre dos definiciones | ✅ Detección automática de estructura |
| ❌ Índices fallan si no existe service_name | ✅ Solo crea índices si columna existe |
| ❌ Políticas RLS fallan | ✅ Políticas condicionales |

---

## 📞 **SI NECESITAS AYUDA:**

1. Ejecuta `FIX_USER_CREDENTIALS_ERROR.sql` para diagnóstico
2. Revisa la salida para ver qué estructura tiene tu tabla
3. Vuelve a ejecutar `database/05_optional_tables.sql` (versión corregida)

**¡Problema resuelto!** 🎉
