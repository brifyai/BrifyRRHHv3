# 🔧 FIX: Content Security Policy y Configuración de Supabase

## 🔴 PROBLEMAS DETECTADOS:

### 1. **URL de Supabase Incorrecta en Producción**
- ❌ Actual: `https://uwbxyaszdqwypbebogvw.supabase.co`
- ✅ Correcta: `https://tmqglnycivlcjijoymwe.supabase.co`

### 2. **CSP Bloqueando Conexión a Supabase**
El CSP solo permite:
- `https://api.supabase.co`
- Pero tu Supabase está en: `https://uwbxyaszdqwypbebogvw.supabase.co`

### 3. **Redirect URI Incorrecto**
- ❌ Actual: `https://www.imetrics.cl/callback`
- ✅ Esperado: `https://imetrics.cl/auth/callback`

---

## 🚀 SOLUCIONES:

### **Solución 1: Verificar Variables de Entorno en Producción**

En **Easypanel**, verifica que las variables de entorno sean:

```bash
# Supabase (CORRECTO)
REACT_APP_SUPABASE_URL=https://tmqglnycivlcjijoymwe.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_anon_key_real

# Google OAuth
REACT_APP_GOOGLE_REDIRECT_URI=https://imetrics.cl/auth/google/callback

# Entorno
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
```

### **Solución 2: Agregar Meta Tag CSP Correcto**

Edita `public/index.html` y agrega ANTES de `</head>`:

```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' 
    https://tmqglnycivlcjijoymwe.supabase.co 
    https://api.supabase.co 
    https://www.googleapis.com 
    https://analyticsdata.googleapis.com 
    https://analyticsadmin.googleapis.com
    https://oauth2.googleapis.com
    https://accounts.google.com;
  frame-src 'self' https://accounts.google.com;
  worker-src 'self' blob:;
">
```

### **Solución 3: Configurar en Netlify/Easypanel**

Si usas Netlify, crea/edita `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      connect-src 'self' 
        https://tmqglnycivlcjijoymwe.supabase.co 
        https://api.supabase.co 
        https://www.googleapis.com 
        https://oauth2.googleapis.com;
      frame-src 'self' https://accounts.google.com;
    '''
```

### **Solución 4: Verificar Configuración de Supabase**

Ejecuta este script para verificar:

```javascript
// En la consola del navegador
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL)
console.log('Environment:', process.env.REACT_APP_ENVIRONMENT)
console.log('Node ENV:', process.env.NODE_ENV)
```

---

## 🎯 PASOS INMEDIATOS:

### **1. Verificar en Easypanel:**

1. Ve a tu servicio en Easypanel
2. Click en **Environment Variables**
3. Verifica que `REACT_APP_SUPABASE_URL` sea: `https://tmqglnycivlcjijoymwe.supabase.co`
4. Si está mal, corrígela
5. Redeploy la aplicación

### **2. Agregar CSP Correcto:**

Edita `public/index.html` y agrega el meta tag CSP mostrado arriba.

### **3. Rebuild y Deploy:**

```bash
git add public/index.html
git commit -m "fix: Add correct CSP and Supabase URL"
git push
```

---

## ✅ VERIFICACIÓN:

Después de aplicar los cambios:

1. Abre la consola del navegador en producción
2. Deberías ver:
   ```
   ✅ URL: https://tmqglnycivlcjijoymwe.supabase.co
   ✅ Cliente de Supabase creado exitosamente
   ```

3. NO deberías ver:
   ```
   ❌ violates Content Security Policy
   ❌ uwbxyaszdqwypbebogvw
   ```

---

## 🔍 DEBUG:

Si sigues viendo la URL incorrecta:

1. **Limpia caché del navegador**
2. **Verifica build:** `npm run build` localmente
3. **Verifica variables:** En Easypanel, asegúrate que las variables estén en "Build Args" Y "Environment Variables"
4. **Redeploy completo:** Elimina y vuelve a crear el servicio si es necesario

---

## 📝 NOTA IMPORTANTE:

La URL `uwbxyaszdqwypbebogvw` NO aparece en tu código local, lo que significa que:
- ✅ Está configurada en las variables de entorno de producción
- ✅ Necesitas cambiarla en Easypanel/Netlify
- ✅ NO es un problema de código, es de configuración de deployment

¡Cambia esa variable de entorno y redeploy! 🚀
