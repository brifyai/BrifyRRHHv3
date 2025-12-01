# 🔍 ANÁLISIS: Confusión con Tablas en Base de Datos

## 📋 **PROBLEMA IDENTIFICADO**

**Síntoma**: El sistema tiene referencias múltiples a diferentes tablas para Google Drive, causando confusión y errores.

---

## 🎯 **TABLAS MENCIONADAS EN EL CÓDIGO**

### **1. user_google_drive_credentials**
**Referencias encontradas:**
- `googleDriveCallbackHandler.js` línea 40: `googleDrivePersistenceService.saveCredentials()`
- `googleDriveCallbackHandler.js` línea 51: "Credenciales guardadas exitosamente en user_google_drive_credentials"

**Estado**: ❌ **PROBLEMA** - Esta tabla puede no existir en Supabase

### **2. company_credentials**
**Referencias encontradas:**
- `googleDriveCallbackHandler.js` línea 76: `supabaseDatabase.companyCredentials.upsert()`
- `googleDriveAuthServiceDynamic_v2.js` línea 141: Consulta con `.eq('status', 'active')`
- `googleDriveTokenBridge.js` línea 50: Consulta con `.eq('status', 'active')`

**Estado**: ✅ **ACTIVA** - Esta tabla existe y funciona

---

## 🔍 **ANÁLISIS DETALLADO DEL FLUJO**

### **googleDriveCallbackHandler.js (líneas 40-86):**
```javascript
// Paso 3: Guardar credenciales en Supabase (user_google_drive_credentials)
const { success, error } = await googleDrivePersistenceService.saveCredentials(
  userId,
  tokens,
  userInfo
);

if (!success) {
  throw new Error(`Error guardando credenciales: ${error?.message}`);
}

console.log('Credenciales guardadas exitosamente en user_google_drive_credentials');

// Paso 4: También guardar en company_credentials si hay companyId en sessionStorage
const companyId = sessionStorage.getItem('google_oauth_company_id');
if (companyId) {
  const companyCredentialsData = {
    company_id: companyId,
    integration_type: 'google_drive',
    credentials: { /* tokens */ },
    status: 'active',  // ✅ CORRECTO
    // ...
  };
  
  const { error: companyError } = await supabaseDatabase.companyCredentials.upsert(companyCredentialsData);
}
```

### **googleDriveAuthServiceDynamic_v2.js (líneas 139-145):**
```javascript
// ✅ CORREGIDO: Usar status='active' según estructura real de BD
const result = await this.supabase
  .from('company_credentials')
  .select('*')
  .eq('company_id', companyId)
  .eq('integration_type', 'google_drive')
  .eq('status', 'active')  // ✅ CORRECTO
```

### **googleDriveTokenBridge.js (líneas 48-55):**
```javascript
// CORREGIDO: Usar company_credentials en lugar de user_google_drive_credentials
const { data: credentials, error } = await supabase
  .from('company_credentials')
  .select('credentials, status, account_email, account_name, created_at')
  .eq('company_id', companyId)
  .eq('integration_type', 'google_drive')
  .eq('status', 'active')  // ✅ CORRECTO
  .maybeSingle()
```

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **1. DEPENDENCIA DE TABLA FALTANTE**
- **Problema**: `googleDrivePersistenceService.saveCredentials()` intenta usar `user_google_drive_credentials`
- **Impacto**: Si la tabla no existe, el guardado falla
- **Evidencia**: No se encontraron referencias a esta tabla en el código actual

### **2. FLUJO INCONSISTENTE**
- **Paso 1**: Guarda en `user_google_drive_credentials` (puede fallar)
- **Paso 2**: Guarda en `company_credentials` (funciona)
- **Resultado**: Credenciales parciales o inconsistentes

### **3. CONSULTAS MÚLTIPLES**
- Algunos servicios consultan `user_google_drive_credentials`
- Otros consultan `company_credentials`
- **Resultado**: Datos inconsistentes entre servicios

---

## 🔧 **SOLUCIONES PROPUESTAS**

### **SOLUCIÓN 1: ELIMINAR DEPENDENCIA DE user_google_drive_credentials (RECOMENDADA)**

**Modificar googleDriveCallbackHandler.js:**

```javascript
// ❌ ELIMINAR ESTE BLOQUE
/*
const { success, error } = await googleDrivePersistenceService.saveCredentials(
  userId,
  tokens,
  userInfo
);

if (!success) {
  throw new Error(`Error guardando credenciales: ${error?.message}`);
}

console.log('Credenciales guardadas exitosamente en user_google_drive_credentials');
*/

// ✅ MANTENER SOLO ESTE BLOQUE
const companyId = sessionStorage.getItem('google_oauth_company_id');
if (companyId) {
  const companyCredentialsData = {
    company_id: companyId,
    integration_type: 'google_drive',
    credentials: {
      access_token: tokens.access_token || 'oauth_token',
      refresh_token: tokens.refresh_token || null,
      account_email: userInfo.email,
      account_name: userInfo.name || userInfo.email,
      user_id: userId
    },
    status: 'active',  // ✅ Usar 'active' no 'google_drive_connected: true'
    account_email: userInfo.email,
    account_name: userInfo.name || userInfo.email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: companyError } = await supabaseDatabase.companyCredentials.upsert(companyCredentialsData);

  if (companyError) {
    console.error('❌ Error guardando en company_credentials:', companyError.message);
    throw new Error(`Error guardando credenciales: ${companyError.message}`);
  } else {
    console.log('✅ Credenciales guardadas exitosamente en company_credentials');
  }
}
```

### **SOLUCIÓN 2: CREAR TABLA user_google_drive_credentials (ALTERNATIVA)**

**Si prefieres mantener ambas tablas, crear la tabla faltante:**

```sql
-- Crear tabla user_google_drive_credentials
CREATE TABLE IF NOT EXISTS user_google_drive_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tokens OAuth
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expires_at TIMESTAMPTZ,
    
    -- Información de Google
    google_user_id TEXT,
    google_email TEXT,
    google_name TEXT,
    google_avatar_url TEXT,
    
    -- Configuración
    google_scope TEXT DEFAULT 'https://www.googleapis.com/auth/drive',
    default_folder_id TEXT,
    
    -- Estado y sincronización
    is_connected BOOLEAN DEFAULT false,
    sync_status TEXT DEFAULT 'disconnected',
    last_sync_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    CHECK (sync_status IN ('disconnected', 'connecting', 'connected', 'error'))
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_google_drive_user_id ON user_google_drive_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_drive_sync_status ON user_google_drive_credentials(sync_status);

-- Habilitar RLS
ALTER TABLE user_google_drive_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Drive credentials"
    ON user_google_drive_credentials
    FOR DELETE
    USING (auth.uid() = user_id);

-- Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON user_google_drive_credentials TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

---

## 📊 **RECOMENDACIÓN FINAL**

### **OPCIÓN RECOMENDADA: SOLUCIÓN 1 (Eliminar user_google_drive_credentials)**

**Razones:**
1. ✅ **Simplifica el sistema** - Una sola fuente de verdad
2. ✅ **Elimina dependencias** - No requiere tabla adicional
3. ✅ **Consistente** - Todos los servicios usan `company_credentials`
4. ✅ **Funciona ahora** - `company_credentials` ya existe y funciona

### **CAMBIOS NECESARIOS:**

1. **Modificar googleDriveCallbackHandler.js:**
   - Eliminar llamada a `googleDrivePersistenceService.saveCredentials()`
   - Mantener solo guardado en `company_credentials`

2. **Verificar que todos los servicios consulten `company_credentials`:**
   - ✅ `googleDriveAuthServiceDynamic_v2.js` - Ya correcto
   - ✅ `googleDriveTokenBridge.js` - Ya correcto
   - ❓ Otros servicios - Revisar

3. **Actualizar documentación:**
   - Aclarar que Google Drive usa `company_credentials`
   - Eliminar referencias a `user_google_drive_credentials`

---

## ⚡ **ACCIÓN INMEDIATA**

### **Verificar tabla company_credentials en Supabase:**
```sql
-- Verificar estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_credentials' 
ORDER BY ordinal_position;

-- Verificar datos existentes
SELECT company_id, integration_type, status, account_email, created_at
FROM company_credentials 
WHERE integration_type = 'google_drive'
LIMIT 5;
```

### **Si hay datos, aplicar SOLUCIÓN 1:**
1. Modificar `googleDriveCallbackHandler.js`
2. Probar OAuth de Google Drive
3. Verificar que funciona sin errores

---

## 🎯 **CONCLUSIÓN**

**La confusión existe porque el sistema intenta usar dos tablas diferentes para el mismo propósito.**

**Solución más simple**: Usar solo `company_credentials` y eliminar la dependencia de `user_google_drive_credentials`.

**Tiempo estimado**: 15-30 minutos para implementar y probar.