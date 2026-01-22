# 🗑️ LIMPIAR BASE DE DATOS COMPLETAMENTE

## ⚠️ **ADVERTENCIA CRÍTICA**

Este proceso **ELIMINARÁ TODOS LOS DATOS** de tu base de datos Supabase:
- ❌ Todas las tablas
- ❌ Todos los datos
- ❌ Todas las políticas RLS
- ❌ Todas las funciones
- ❌ **NO SE PUEDE DESHACER**

---

## 🎯 **CUÁNDO USAR ESTO:**

✅ Cuando quieres empezar desde cero
✅ Cuando tienes tablas con errores y quieres recrearlas
✅ En desarrollo/testing
❌ **NUNCA en producción con datos reales**

---

## 📋 **PASOS PARA LIMPIAR:**

### **1. Hacer Backup (IMPORTANTE)**

Antes de eliminar, haz backup si tienes datos importantes:

```sql
-- En Supabase SQL Editor, exporta cada tabla:
COPY companies TO '/tmp/companies_backup.csv' CSV HEADER;
COPY users TO '/tmp/users_backup.csv' CSV HEADER;
-- etc...
```

O usa Supabase Dashboard → Database → Backups

### **2. Ejecutar Script de Limpieza**

1. Ve a Supabase Dashboard
2. Tu proyecto → **SQL Editor**
3. **New query**
4. Copia y pega TODO el contenido de `DROP_ALL_TABLES.sql`
5. **Run** (F5)
6. Espera confirmación: "✅ Base de datos limpiada completamente"

### **3. Verificar que Todo se Eliminó**

Ejecuta:
```sql
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
```

Debería retornar: `0` o muy pocas tablas del sistema.

### **4. Crear Tablas Nuevas**

Ahora ejecuta los scripts en orden:

1. `database/01_core_tables.sql`
2. `COMPLETE_INTEGRATIONS_TABLES.sql`
3. `supabase_knowledge_simple.sql`
4. `database/complete_database_setup.sql`

---

## 🚀 **PROCESO COMPLETO (30 minutos):**

```bash
# Paso 1: Limpiar (2 min)
Ejecutar: DROP_ALL_TABLES.sql

# Paso 2: Verificar (30 seg)
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

# Paso 3: Crear tablas core (2 min)
Ejecutar: database/01_core_tables.sql

# Paso 4: Crear integraciones (3 min)
Ejecutar: COMPLETE_INTEGRATIONS_TABLES.sql

# Paso 5: Crear knowledge base (2 min)
Ejecutar: supabase_knowledge_simple.sql

# Paso 6: Crear resto (3 min)
Ejecutar: database/complete_database_setup.sql

# Paso 7: Crear usuario (1 min)
Ejecutar: create_user_camilo_fixed.sql

# Paso 8: Verificar (1 min)
Ejecutar: verificar_estado_actual.sql
```

---

## ✅ **VERIFICACIÓN FINAL:**

Después de crear todas las tablas:

```sql
-- Deberías ver 30+ tablas
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

-- Ver lista completa
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 🔄 **ALTERNATIVA: Limpiar Solo Algunas Tablas**

Si solo quieres eliminar tablas específicas:

```sql
-- Ejemplo: Solo eliminar tablas de Brevo
DROP TABLE IF EXISTS brevo_campaigns CASCADE;
DROP TABLE IF EXISTS brevo_templates CASCADE;
-- etc...
```

---

## 🆘 **SI ALGO SALE MAL:**

### Error: "cannot drop table because other objects depend on it"
**Solución:** Usa `CASCADE` (ya incluido en el script)

### Error: "permission denied"
**Solución:** Asegúrate de estar usando el usuario correcto con permisos

### Tablas no se eliminan
**Solución:** Ejecuta el script dos veces (por dependencias circulares)

---

## 📝 **NOTAS:**

- El script usa `CASCADE` para eliminar dependencias automáticamente
- Las extensiones (uuid-ossp, pgcrypto) NO se eliminan por defecto
- Los usuarios de `auth.users` NO se eliminan (están en otro schema)
- El script es idempotente (puedes ejecutarlo múltiples veces)

---

## ⚡ **SCRIPT RÁPIDO (Una Línea):**

Si quieres eliminar TODO de una vez:

```sql
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```

---

## 🎯 **DESPUÉS DE LIMPIAR:**

1. ✅ Base de datos vacía
2. ✅ Lista para crear tablas nuevas
3. ✅ Sin conflictos ni errores
4. ✅ Empezar desde cero

**¡Listo para comenzar de nuevo!** 🚀
