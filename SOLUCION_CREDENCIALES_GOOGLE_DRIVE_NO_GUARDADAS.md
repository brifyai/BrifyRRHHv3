# 🔧 SOLUCIÓN: Credenciales de Google Drive no se guardan

## 📋 Problema Identificado

**Síntoma**: Después de completar el OAuth de Google Drive, las credenciales no se guardan y el sistema muestra "No hay cuentas de Google Drive conectadas".

**Causa Raíz**: El `GoogleDriveCallbackHandler.js` solo guardaba credenciales en la tabla `user_google_drive_credentials`, pero el sistema MultiAccountServiceUI consulta la tabla `company_credentials`.

## 🔍 Análisis Técnico

### Flujo Actual (Problemático):
1. Usuario inicia OAuth desde `/configuracion/empresas/:companyId/sincronizacion`
2. Google OAuth se completa exitosamente
3. `GoogleDriveCallbackHandler.handleAuthorizationCode()` guarda solo en `user_google_drive_credentials`
4. `SettingsDynamic.js` consulta `company_credentials` → encuentra 0 registros
5. UI muestra "No hay cuentas conectadas"

### Flujo Corregido:
1. Usuario inicia OAuth desde `/configuracion/empresas/:companyId/sincronizacion`
2. Google OAuth se completa exitosamente
3. `GoogleDriveCallbackHandler.handleAuthorizationCode()` guarda en AMBAS tablas:
   - `user_google_drive_credentials` (para compatibilidad)
   - `company_credentials` (para MultiAccountServiceUI)
4. `SettingsDynamic.js` consulta `company_credentials` → encuentra las credenciales
5. UI muestra "Google Drive conectado"

## 🛠️ Solución Implementada

### Archivo Modificado: `src/lib/googleDriveCallbackHandler.js`

**Cambios realizados**:
1. **Import agregado**:
   ```javascript
   import supabaseDatabase from '../lib/supabaseDatabase.js';
   ```

2. **Lógica de guardado dual**:
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
     try {
       console.log(`💾 Guardando también en company_credentials para company: ${companyId}`);
       
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
         status: 'active',
         account_email: userInfo.email,
         account_name: userInfo.name || userInfo.email,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };

       const { error: companyError } = await supabaseDatabase.companyCredentials.upsert(companyCredentialsData);

       if (companyError) {
         console.error('❌ Error guardando en company_credentials:', companyError.message);
       } else {
         console.log('✅ Credenciales guardadas exitosamente en company_credentials');
       }
     } catch (companyError) {
       console.error('❌ Error en guardado secundario:', companyError.message);
     }
   }
   ```

## 🎯 Beneficios de la Solución

1. **Compatibilidad hacia atrás**: Mantiene el guardado en `user_google_drive_credentials`
2. **Soporte MultiAccountServiceUI**: Agrega guardado en `company_credentials`
3. **Detección automática**: Usa `sessionStorage` para saber si es un flujo por empresa
4. **Logs mejorados**: Agrega logs específicos para debugging
5. **Manejo de errores**: Si falla el guardado secundario, no interrumpe el flujo principal

## 🔍 Verificación

### Para verificar que la solución funciona:

1. **Abrir Developer Tools** en el navegador
2. **Ir a** `/configuracion/empresas/:companyId/sincronizacion`
3. **Hacer clic en "Conectar con Google"**
4. **Completar OAuth**
5. **Verificar en Console**:
   ```
   ✅ Credenciales guardadas exitosamente en user_google_drive_credentials
   💾 Guardando también en company_credentials para company: [ID]
   ✅ Credenciales guardadas exitosamente en company_credentials
   ```
6. **Verificar en la UI**: Debe mostrar "Google Drive conectado" en lugar de "No hay cuentas"

### Verificación en Base de Datos:

```sql
-- Verificar en user_google_drive_credentials (compatibilidad)
SELECT * FROM user_google_drive_credentials WHERE user_id = '[USER_ID]';

-- Verificar en company_credentials (MultiAccountServiceUI)
SELECT * FROM company_credentials 
WHERE company_id = '[COMPANY_ID]' 
AND integration_type = 'google_drive';
```

## 🚀 Próximos Pasos

1. **Deploy de la solución** a producción
2. **Probar el flujo completo** de OAuth
3. **Verificar que la UI se actualiza correctamente**
4. **Monitorear logs** para asegurar que no hay errores

## 📝 Notas Técnicas

- **SessionStorage**: Se usa `google_oauth_company_id` para detectar si es un flujo por empresa
- **Upsert**: Se usa `upsert` para crear o actualizar credenciales existentes
- **Dual write**: Si falla el guardado secundario, no afecta el flujo principal
- **Logging**: Se agregaron logs específicos para facilitar debugging futuro