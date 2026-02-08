# 🔧 Solución Errores 404 en EasyPanel

## 🎯 Diagnóstico del Problema

Los errores 404 en tu deployment pueden deberse a:

1. **Build Arguments incorrectos** - Las URLs están "quemadas" en el código compilado
2. **Archivos estáticos no se están sirviendo correctamente**
3. **Rutas de React Router no configuradas**
4. **Variables de entorno no se están pasando al build**

---

## ✅ SOLUCIÓN COMPLETA

### **Paso 1: Verificar Build Arguments en EasyPanel**

En EasyPanel, ve a tu servicio y configura estos **Build Arguments** (NO Runtime Environment):

```bash
# CRÍTICO - Build Arguments (se usan durante npm run build)
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
REACT_APP_GOOGLE_CLIENT_ID=777409222994-977fdhkb9lfrq7v363hlndulq8k98lgk.apps.googleusercontent.com
REACT_APP_GOOGLE_REDIRECT_URI=https://www.staffhub.cl/auth/google/callback
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
PORT=3004
GENERATE_SOURCEMAP=false
CI=false
ESLINT_NO_DEV_ERRORS=true
CORS_ALLOW_ALL=true
```

### **Paso 2: Verificar Runtime Environment Variables**

También configura estas variables de **Runtime** (se usan cuando el contenedor está corriendo):

```bash
NODE_ENV=production
PORT=3004
CORS_ALLOW_ALL=true
REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5MTE2MzU4LCJleHAiOjIwODQ0NzYzNTh9.cwqdhcN50CUWMvJty9sTm-ptAngUPto3wnfggG0ImWo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkxMTYzNTgsImV4cCI6MjA4NDQ3NjM1OH0.ck89urip20NQN4WgOLVCLTXc97JQYIX_-QqyJ4lDwco
```

### **Paso 3: Hacer REBUILD (NO Redeploy)**

⚠️ **IMPORTANTE**: Debes hacer **REBUILD**, no solo restart o redeploy.

En EasyPanel:
1. Ve a tu servicio "staffhub"
2. Busca el botón **"Rebuild"** o **"Build & Deploy"**
3. Click y espera 5-7 minutos

---

## 🔍 Verificar qué está fallando

### **Opción A: Ver logs del contenedor**

En EasyPanel, ve a **Logs** y busca:

```bash
# Deberías ver:
✅ Build completed successfully
📦 Build files: [lista de archivos]
🚀 Servidor simple ejecutándose en puerto 3004
```

### **Opción B: Verificar en el navegador**

1. Abre `https://www.staffhub.cl`
2. Presiona **F12** (DevTools)
3. Ve a la pestaña **Network**
4. Recarga la página (**Ctrl + Shift + R**)
5. Busca qué archivos dan 404

**Posibles escenarios:**

#### Escenario 1: `index.html` da 404
**Problema**: Los archivos estáticos no se están sirviendo
**Solución**: Ver "Paso 4" abajo

#### Escenario 2: `main.XXXXX.js` da 404
**Problema**: El build no se completó correctamente
**Solución**: Verificar logs del build en EasyPanel

#### Escenario 3: Rutas como `/dashboard` dan 404
**Problema**: Falta configuración de SPA routing
**Solución**: Ya está en el código, pero verifica el Dockerfile

---

## 🛠️ Paso 4: Actualizar Dockerfile (si es necesario)

Si los archivos estáticos no se sirven, actualiza el Dockerfile:

```dockerfile
# Production stage
FROM node:20-alpine

WORKDIR /app

# Build arguments (needed in runtime too)
ARG NODE_ENV=production
ARG PORT=3004
ARG CORS_ALLOW_ALL=true

# Set runtime environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV CORS_ALLOW_ALL=${CORS_ALLOW_ALL}

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/server-simple.mjs ./
COPY --from=builder /app/public ./public

# Verificar que los archivos existen
RUN ls -la build/ && \
    echo "✅ Build directory exists" && \
    ls -la build/static/js/ && \
    echo "✅ JS files exist"

# Expose port
EXPOSE ${PORT:-3004}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3004}/api/health || exit 1

# Start the server
CMD ["node", "server-simple.mjs"]
```

---

## 🚨 Problemas Comunes y Soluciones

### **Problema 1: "Cannot GET /"**

**Causa**: El servidor no está sirviendo `index.html`

**Solución**: Verifica que `server-simple.mjs` tenga:

```javascript
// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const buildPath = join(__dirname, 'build');
  app.use(express.static(buildPath));
  console.log('📦 Sirviendo archivos estáticos desde:', buildPath);
}

// Catch-all route (DEBE estar al final)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(join(__dirname, 'build', 'index.html'));
  });
}
```

### **Problema 2: "ERR_NAME_NOT_RESOLVED" o URLs incorrectas**

**Causa**: Las URLs están compiladas con valores incorrectos

**Solución**: 
1. Verifica que los **Build Arguments** estén configurados
2. Haz **REBUILD** (no redeploy)
3. Limpia caché del navegador (**Ctrl + Shift + R**)

### **Problema 3: El build falla con errores de ESLint**

**Causa**: ESLint encuentra warnings/errors

**Solución**: Ya está configurado en el Dockerfile:
```dockerfile
ENV CI=false
ENV ESLINT_NO_DEV_ERRORS=true
```

Si sigue fallando, verifica los logs del build.

### **Problema 4: "Module not found" en runtime**

**Causa**: Faltan archivos en la imagen de producción

**Solución**: Verifica que el Dockerfile copie todo lo necesario:
```dockerfile
COPY --from=builder /app/build ./build
COPY --from=builder /app/server-simple.mjs ./
COPY --from=builder /app/src ./src  # Si el servidor necesita src/
```

---

## 📋 Checklist de Verificación

```
[ ] Build Arguments configurados en EasyPanel
[ ] Runtime Environment Variables configuradas
[ ] Hice REBUILD (no solo redeploy)
[ ] El build completó exitosamente (ver logs)
[ ] Los archivos build/ existen en el contenedor
[ ] El servidor inicia en puerto 3004
[ ] Health check responde: /api/health
[ ] index.html se sirve en /
[ ] Archivos JS se sirven desde /static/js/
[ ] Las rutas de React Router funcionan (/dashboard, etc)
[ ] No hay errores en la consola del navegador
[ ] Las peticiones van a supabase.staffhub.cl (no imetricsstaffhub)
```

---

## 🎯 Comandos de Diagnóstico

Si tienes acceso SSH al contenedor en EasyPanel:

```bash
# Verificar que los archivos existen
ls -la /app/build/
ls -la /app/build/static/js/

# Verificar que el servidor está corriendo
ps aux | grep node

# Verificar el puerto
netstat -tulpn | grep 3004

# Ver logs del servidor
tail -f /var/log/app.log  # o donde estén los logs

# Probar el health check
wget http://localhost:3004/api/health -O -

# Probar que sirve index.html
wget http://localhost:3004/ -O -
```

---

## 🔄 Proceso Completo de Deployment

1. **Commit cambios** (si actualizaste Dockerfile):
   ```bash
   git add Dockerfile server-simple.mjs
   git commit -m "fix: Update Dockerfile for proper static file serving"
   git push
   ```

2. **En EasyPanel**:
   - Configurar Build Arguments
   - Configurar Runtime Variables
   - Click en **Rebuild**
   - Esperar 5-7 minutos

3. **Verificar**:
   - Abrir `https://www.staffhub.cl`
   - Limpiar caché (**Ctrl + Shift + R**)
   - Verificar que no hay errores 404
   - Probar login

---

## 📞 Si Sigue Sin Funcionar

Necesito ver:

1. **Logs del build** en EasyPanel (los últimos 50 líneas)
2. **Logs del runtime** (cuando el contenedor está corriendo)
3. **Errores específicos** en la consola del navegador (F12)
4. **Qué URLs exactamente dan 404**

Con esa información puedo darte una solución más específica.

---

## ✅ Resultado Esperado

Después de seguir estos pasos:

```
✅ Build exitoso en 5-7 minutos
✅ Contenedor corriendo en puerto 3004
✅ https://www.staffhub.cl carga correctamente
✅ No hay errores 404 en la consola
✅ Login funciona
✅ Rutas de React Router funcionan
✅ Peticiones van a supabase.staffhub.cl
```
