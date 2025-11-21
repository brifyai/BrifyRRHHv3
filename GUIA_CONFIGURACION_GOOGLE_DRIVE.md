# 🚀 GUÍA COMPLETA: CONFIGURACIÓN GOOGLE DRIVE

## 📊 **ESTADO ACTUAL**

**Problema:** Las carpetas no aparecen en Google Drive porque las credenciales no están configuradas.  
**Solución:** Configurar Google Drive OAuth con credenciales válidas.  
**Sistema:** Google Drive Real Only (sin fallback local)  

---

## 🔧 **PASO 1: OBTENER CREDENCIALES DE GOOGLE**

### **1.1 Crear Proyecto en Google Cloud Console**

1. **Ir a Google Cloud Console:**
   - [https://console.cloud.google.com/](https://console.cloud.google.com/)

2. **Crear Nuevo Proyecto:**
   - Click en "Select a project" → "New Project"
   - Nombre: `BrifyRRHH Google Drive`
   - Click "Create"

3. **Habilitar Google Drive API:**
   - Ir a "APIs & Services" → "Library"
   - Buscar "Google Drive API"
   - Click "Enable"

### **1.2 Crear Credenciales OAuth**

1. **Ir a Credenciales:**
   - "APIs & Services" → "Credentials"

2. **Crear OAuth 2.0 Client ID:**
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: `BrifyRRHH Web App`

3. **Configurar URIs Autorizados:**
   ```
   Authorized JavaScript origins:
   - http://localhost:3000
   - https://tu-dominio-netlify.netlify.app
   
   Authorized redirect URIs:
   - http://localhost:3000/auth/google/callback
   - https://tu-dominio-netlify.netlify.app/auth/google/callback
   ```

4. **Obtener Credenciales:**
   - **Client ID:** `xxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-xxxxxxxxxxxxxxxxxxxx`

---

## 🔧 **PASO 2: CONFIGURAR VARIABLES DE ENTORNO**

### **2.1 Para Desarrollo Local (.env)**

```bash
# Google Drive OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://tmqglnycivlcjijoymwe.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Drive Mode (forzar Google Drive real)
REACT_APP_DRIVE_MODE=google
REACT_APP_ENVIRONMENT=development
```

### **2.2 Para Netlify (Dashboard)**

1. **Ir a Netlify Dashboard:**
   - [https://app.netlify.com/](https://app.netlify.com/)
   - Seleccionar tu sitio
   - "Site settings" → "Environment variables"

2. **Agregar Variables:**
   ```bash
   REACT_APP_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
   REACT_APP_GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
   REACT_APP_GOOGLE_REDIRECT_URI=https://tu-dominio.netlify.app/auth/google/callback
   REACT_APP_SUPABASE_URL=https://tmqglnycivlcjijoymwe.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key
   REACT_APP_DRIVE_MODE=google
   REACT_APP_ENVIRONMENT=production
   ```

---

## 🔧 **PASO 3: VERIFICAR CONFIGURACIÓN**

### **3.1 Script de Diagnóstico**

Ejecutar en la consola del navegador (F12):

```javascript
// Verificar configuración de Google Drive
console.log('=== DIAGNÓSTICO GOOGLE DRIVE ===');

// 1. Verificar variables de entorno
console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
console.log('Client Secret:', process.env.REACT_APP_GOOGLE_CLIENT_SECRET ? 'Configurado' : 'No configurado');
console.log('Redirect URI:', process.env.REACT_APP_GOOGLE_REDIRECT_URI);

// 2. Verificar servicio híbrido
import hybridGoogleDrive from './src/lib/googleDriveRealOnly.js';
await hybridGoogleDrive.initialize();
console.log('Servicio inicializado:', hybridGoogleDrive.isInitialized);
console.log('Credenciales válidas:', hybridGoogleDrive.hasValidGoogleCredentials());
console.log('Autenticado:', hybridGoogleDrive.isAuthenticated());

// 3. Verificar información del servicio
console.log('Info del servicio:', hybridGoogleDrive.getServiceInfo());
```

### **3.2 Verificar en la Aplicación**

1. **Abrir Consola del Navegador (F12)**
2. **Ir a la sección de carpetas de empleados**
3. **Buscar en los logs:**
   ```
   ✅ Google Drive inicializado correctamente
   ✅ Credenciales válidas encontradas
   ```

---

## 🔧 **PASO 4: CONECTAR GOOGLE DRIVE**

### **4.1 Proceso de Autenticación**

1. **En la aplicación:**
   - Ir a "Comunicación" → "Carpetas de Empleados"
   - Click "Conectar Google Drive" o "Sincronizar"

2. **Autorizar en Google:**
   - Se abrirá ventana de Google para autorizar
   - Seleccionar cuenta de Google
   - Permitir acceso a Google Drive
   - Serás redirigido a la aplicación

3. **Verificar Conexión:**
   - Los logs deben mostrar: `✅ Google Drive autenticado`
   - Las carpetas aparecerán en tu Google Drive

### **4.2 Estructura de Carpetas**

Google Drive creará automáticamente:
```
📁 BrifyRRHH/
  📁 Empleados/
    📁 Juan Pérez (juan@empresa.com)/
    📁 María García (maria@empresa.com)/
    📁 Carlos López (carlos@empresa.com)/
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error: "Google Drive no está configurado"**

**Causa:** Variables de entorno no configuradas  
**Solución:**
1. Verificar que `REACT_APP_GOOGLE_CLIENT_ID` esté configurado
2. Verificar que `REACT_APP_GOOGLE_CLIENT_SECRET` esté configurado
3. Reiniciar la aplicación

### **Error: "Google Drive no está autenticado"**

**Causa:** No se ha completado el proceso OAuth  
**Solución:**
1. Click en "Conectar Google Drive"
2. Completar autorización en Google
3. Verificar que la URL de redirect esté correcta

### **Error: "No se pudo crear carpeta"**

**Causa:** Permisos insuficientes o token expirado  
**Solución:**
1. Verificar que el token no haya expirado
2. Re-autorizar Google Drive
3. Verificar permisos de la aplicación en Google

### **Error: "Redirect URI mismatch"**

**Causa:** URL de redirect no coincide con Google Console  
**Solución:**
1. Verificar `REACT_APP_GOOGLE_REDIRECT_URI`
2. Actualizar en Google Console
3. Usar URLs exactas (con/sin trailing slash)

---

## 📋 **CHECKLIST FINAL**

- ✅ **Proyecto creado** en Google Cloud Console
- ✅ **Google Drive API** habilitada
- ✅ **OAuth 2.0** configurado
- ✅ **Client ID y Secret** obtenidos
- ✅ **URIs autorizados** configurados
- ✅ **Variables de entorno** configuradas
- ✅ **Aplicación** reiniciada
- ✅ **Google Drive** conectado
- ✅ **Carpetas** aparecen en Google Drive

---

## 🎯 **RESULTADO ESPERADO**

Después de completar la configuración:

1. **Al hacer clic en "Sincronizar":**
   - Las carpetas se crearán automáticamente en Google Drive
   - Aparecerán en tu Google Drive bajo `BrifyRRHH/Empleados/`
   - Cada empleado tendrá su propia carpeta
   - Las carpetas se compartirán automáticamente con cada empleado

2. **Estructura en Google Drive:**
   ```
   📁 BrifyRRHH/
     📁 Empleados/
       📁 Juan Pérez (juan@empresa.com)/
       📁 María García (maria@empresa.com)/
       📁 Carlos López (carlos@empresa.com)/
   ```

---

## 📞 **SOPORTE**

Si sigues teniendo problemas:

1. **Ejecutar diagnóstico** en consola del navegador
2. **Verificar logs** en la pestaña "Console"
3. **Revisar configuración** de variables de entorno
4. **Confirmar URIs** en Google Cloud Console

**¡Una vez configurado correctamente, las carpetas aparecerán automáticamente en Google Drive!** 🚀