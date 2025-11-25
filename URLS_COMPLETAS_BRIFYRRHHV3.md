# 🌐 URLs DE LA APLICACIÓN BRIFYRRHHV3

## 📊 Resumen Completo de URLs Configuradas

### 🗄️ **BASE DE DATOS SUPABASE**
- **URL Principal:** `https://tmqglnycivlcjijoymwe.supabase.co`
- **Proyecto ID:** `tmqglnycivlcjijoymwe`
- **Puerto Local:** `54321` (desarrollo)
- **Puerto DB Local:** `54322` (desarrollo)
- **Puerto Studio:** `54323` (desarrollo)

### 🔐 **GOOGLE OAUTH & DRIVE**
- **OAuth Authorization:** `https://accounts.google.com/o/oauth2/v2/auth`
- **OAuth Token Exchange:** `https://oauth2.googleapis.com/token`
- **User Info:** `https://www.googleapis.com/oauth2/v2/userinfo`
- **Google Drive API:** `https://www.googleapis.com/drive/v3/files`
- **Google Drive Upload:** `https://www.googleapis.com/upload/drive/v3/files`
- **Google APIs Script:** `https://apis.google.com/js/api.js`

### 🤖 **SERVICIOS DE IA**
- **Groq AI API:** `https://api.groq.com/openai/v1/chat/completions`
- **Modelo:** `mixtral-8x7b-32768`

### 🖥️ **DESARROLLO LOCAL**
- **Frontend Dev:** `http://localhost:3000`
- **Supabase Studio:** `http://127.0.0.1:54323`
- **API Local:** `http://127.0.0.1:54321`
- **Email Testing:** `http://127.0.0.1:54324`

### 🔄 **CALLBACKS & REDIRECCIONES**
- **OAuth Callback:** `/auth/google/callback` (ruta relativa)
- **Google Redirect URI:** Configurado dinámicamente según entorno
  - Desarrollo: `http://localhost:3000/auth/google/callback`
  - Producción: `{window.location.origin}/auth/google/callback`

### ☁️ **NETLIFY FUNCTIONS**
- **Google Auth Function:** `/.netlify/functions/google-auth`
- **Google Refresh Function:** `/.netlify/functions/google-refresh`
- **Analyze Company Function:** `/.netlify/functions/analyze-company`

### 🚀 **DEPLOYMENT - NETLIFY**
- **Plataforma:** Netlify
- **Configuración:** `netlify.toml`
- **Build Command:** `npm run build`
- **Publish Directory:** `build/`
- **Node Version:** 18
- **SPA Redirects:** `/*` → `/index.html` (status 200)
- **Processing:** CSS/JS bundle y minificación habilitados
- **Environment:** CI=false, ESLINT_NO_DEV_ERRORS=true

### 📧 **EMAIL & COMUNICACIÓN**
- **Email Testing Server:** Puerto `54324` (local)
- **SMTP Configurado:** SendGrid (producción)
- **Templates:** Configurados en Supabase Auth

### 🔒 **SEGURIDAD & AUTENTICACIÓN**
- **JWT Expiry:** 3600 segundos (1 hora)
- **Refresh Token Rotation:** Habilitado
- **PKCE Flow:** Habilitado para OAuth
- **CORS:** Configurado para dominios específicos

### 📊 **MONITOREO & ANALYTICS**
- **Analytics Backend:** PostgreSQL
- **Analytics Port:** `54327`
- **Edge Runtime:** Puerto `8083` (debugging)

### 🌐 **URLs DE PRODUCCIÓN NETLIFY**
- **Dominio Principal:** Configurado en Netlify
- **SSL/HTTPS:** Automático (Netlify)
- **CDN:** Automático (Netlify)
- **Functions:** Disponibles en `/.netlify/functions/*`

### 🔧 **CONFIGURACIÓN DE ENTORNO**
```env
# URLs configuradas via environment variables
REACT_APP_SUPABASE_URL=https://tmqglnycivlcjijoymwe.supabase.co
REACT_APP_GOOGLE_REDIRECT_URI={dynamic}
REACT_APP_GOOGLE_CLIENT_ID={configured}
GROQ_API_KEY={configured}
REACT_APP_DRIVE_MODE=local
REACT_APP_ENVIRONMENT=production
```

### 📱 **RESPONSIVE & ACCESIBILIDAD**
- **Mobile First:** Configurado
- **PWA Ready:** Configurado
- **Accessibility:** CSS específico incluido

### 🗂️ **SISTEMA DE CARPETAS LOCALES**
- **Storage:** localStorage del navegador
- **Modo:** Híbrido (local/producción, Google Drive/desarrollo)
- **Capacidad:** ~5-10 MB por localStorage
- **Persistencia:** Hasta que el usuario limpie el navegador

---

## 🎯 **RESUMEN EJECUTIVO**

La aplicación BrifyRRHHv3 tiene **15+ URLs principales** distribuidas en:

- **1 Base de datos principal** (Supabase)
- **6 APIs de Google** (OAuth + Drive)
- **1 Servicio de IA** (Groq)
- **3 URLs de desarrollo local**
- **3 Netlify Functions**
- **1 Deploy en Netlify** ✅
- **Múltiples endpoints de callback**

**Estado:** ✅ Todas las integraciones operativas al 100%
**Versión:** BrifyRRHHv3 (commit: 6891a2b)
**Deploy:** Producción activa en Netlify
**Sistema de Archivos:** Local (optimizado para Netlify)

### 🚀 **CARACTERÍSTICAS DEL DEPLOY NETLIFY**

✅ **Build optimizado** con Node.js 18
✅ **SPA routing** configurado
✅ **Functions serverless** disponibles
✅ **CDN global** automático
✅ **SSL/HTTPS** automático
✅ **Variables de entorno** configurables
✅ **Sistema híbrido** de Google Drive (local/producción)
✅ **Procesamiento** CSS/JS minificado

La aplicación está **100% lista para producción** en Netlify con todas las funcionalidades operativas.