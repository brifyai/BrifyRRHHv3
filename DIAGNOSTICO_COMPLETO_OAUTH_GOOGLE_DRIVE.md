# 🔍 DIAGNÓSTICO COMPLETO: OAuth Google Drive - Credenciales No Se Guardan

## 📋 Problema Identificado
Las credenciales de Google Drive NO se guardan después del OAuth exitoso, causando que la UI muestre "No hay cuentas de Google Drive conectadas".

## 🔄 Flujo OAuth Actual

### 1. **Inicio del OAuth**
- **Archivo**: `GoogleDriveDirectConnect.js` o `Settings.js`
- **Método**: `googleDriveCallbackHandler.generateAuthorizationUrl()`
- **Estado**: ✅ Funciona correctamente

### 2. **Callback de Google**
- **Archivo**: `GoogleAuthCallback.js`
- **Método**: `googleDriveCallbackHandler.handleAuthorizationCode(code, userId)`
- **Estado**: ❓ **POSIBLE PUNTO DE FALLA**

### 3. **Guardado de Credenciales**
- **Archivo**: `googleDriveCallbackHandler.js` líneas 40-73
- **Método**: `supabaseDatabase.companyCredentials.upsert()`
- **Estado**: ❓ **POSIBLE PUNTO DE FALLA**

### 4. **Consulta de Credenciales**
- **Archivo**: `AuthContext.js` líneas 100-125
- **Método**: `protectedSupabaseRequest()` con `supabase.from('company_credentials')`
- **Estado**: ✅ **CORREGIDO** (error "object is not iterable" solucionado)

## 🚨 Posibles Causas del Fallo

### **Causa 1: Inconsistencia en el Acceso a Supabase**
```javascript
// ❌ googleDriveCallbackHandler.js usa:
supabaseDatabase.companyCredentials.upsert()

// ❌ AuthContext.js usa:
protectedSupabaseRequest(() => supabase.from('company_credentials'))

// ✅ SOLUCIÓN: Unificar método de acceso
```

### **Causa 2: company_id Faltante en Guardado**
```javascript
// ❌ En googleDriveCallbackHandler.js línea 47:
company_id: companyId, // ← Puede ser null/undefined

// ✅ SOLUCIÓN: Verificar companyId antes de guardar
```

### **Causa 3: Error Silencioso en Guardado**
```javascript
// ❌ En googleDriveCallbackHandler.js líneas 65-72:
if (companyError) {
  console.error('❌ Error guardando en company_credentials:', companyError.message);
} else {
  console.log('✅ Credenciales guardadas exitosamente en company_credentials');
}
// ← Si hay error, se continúa sin fallar
```

### **Causa 4: sessionStorage company_id No Establecido**
```javascript
// ❌ En googleDriveCallbackHandler.js línea 41:
const companyId = sessionStorage.getItem('google_oauth_company_id');
// ← Puede no estar establecido
```

## 🔧 Plan de Corrección Inmediata

### **Paso 1: Unificar Acceso a Supabase**
Modificar `googleDriveCallbackHandler.js` para usar el mismo método que `AuthContext.js`:

```javascript
// ✅ CAMBIO REQUERIDO en googleDriveCallbackHandler.js:
import { protectedSupabaseRequest } from '../lib/supabaseCircuitBreaker.js';

// Reemplazar:
const { error: companyError } = await supabaseDatabase.companyCredentials.upsert(companyCredentialsData);

// Por:
const result = await protectedSupabaseRequest(
  () => supabase
    .from('company_credentials')
    .upsert(companyCredentialsData),
  'googleDriveCallbackHandler.saveCompanyCredentials'
);
```

### **Paso 2: Validar company_id Antes de Guardar**
```javascript
// ✅ AGREGAR en googleDriveCallbackHandler.js:
const companyId = sessionStorage.getItem('google_oauth_company_id');
if (!companyId) {
  console.log('⚠️ No hay company_id en sessionStorage, guardando sin company_id');
  // Continuar sin company_id
}
```

### **Paso 3: Agregar Logging Detallado**
```javascript
// ✅ AGREGAR en googleDriveCallbackHandler.js:
console.log('🔍 Datos a guardar:', companyCredentialsData);
console.log('🔍 Supabase result:', result);
if (result.error) {
  console.error('❌ Error completo:', result.error);
}
```

### **Paso 4: Verificar Estructura de Tabla**
```sql
-- ✅ VERIFICAR en Supabase:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_credentials' 
AND table_schema = 'public';
```

## 🎯 Acción Inmediata Requerida

**El problema más probable es que `googleDriveCallbackHandler.js` usa un método diferente para acceder a Supabase que `AuthContext.js`, causando inconsistencias.**

### **Corrección Crítica:**
1. Modificar `googleDriveCallbackHandler.js` para usar `protectedSupabaseRequest`
2. Agregar logging detallado para identificar el error exacto
3. Verificar que `company_id` esté disponible
4. Unificar el método de acceso a Supabase en todo el sistema

## 📊 Estado Actual
- ✅ Error "object is not iterable" corregido en `AuthContext.js`
- ❌ Credenciales aún no se guardan (problema en `googleDriveCallbackHandler.js`)
- ❓ Flujo OAuth necesita diagnóstico completo