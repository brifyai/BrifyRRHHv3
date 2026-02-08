# 🔧 Comandos de Debug para EasyPanel

## 📋 Comandos para ejecutar en EasyPanel (si tienes acceso SSH)

### **1. Verificar que los archivos del build existen**

```bash
# Ver contenido del directorio de la app
ls -la /app/

# Ver archivos del build
ls -la /app/build/

# Ver archivos JavaScript compilados
ls -la /app/build/static/js/

# Ver tamaño de los archivos
du -sh /app/build/*
```

**Resultado esperado:**
```
✅ /app/build/index.html existe
✅ /app/build/static/js/main.XXXXX.js existe
✅ /app/build/static/css/main.XXXXX.css existe
```

---

### **2. Verificar que el servidor está corriendo**

```bash
# Ver procesos de Node
ps aux | grep node

# Ver qué está escuchando en el puerto 3004
netstat -tulpn | grep 3004

# O con lsof
lsof -i :3004
```

**Resultado esperado:**
```
✅ node server-simple.mjs está corriendo
✅ Puerto 3004 está en LISTEN
```

---

### **3. Probar el servidor localmente (dentro del contenedor)**

```bash
# Probar health check
curl http://localhost:3004/api/health

# Probar que sirve index.html
curl http://localhost:3004/ | head -20

# Probar que sirve archivos JS
curl -I http://localhost:3004/static/js/main.*.js
```

**Resultado esperado:**
```
✅ /api/health devuelve {"status":"ok"}
✅ / devuelve HTML con <!DOCTYPE html>
✅ /static/js/main.*.js devuelve 200 OK
```

---

### **4. Ver logs del servidor**

```bash
# Ver logs en tiempo real
tail -f /var/log/app.log

# O si los logs van a stdout
docker logs -f <container-id>

# Ver últimas 100 líneas
docker logs --tail 100 <container-id>
```

**Busca estos mensajes:**
```
✅ 🚀 Servidor simple ejecutándose en puerto 3004
✅ 📦 Sirviendo archivos estáticos desde: /app/build
✅ 🌍 Entorno: production
```

---

### **5. Verificar variables de entorno**

```bash
# Ver todas las variables de entorno
env | grep REACT_APP

# Ver variables específicas
echo $NODE_ENV
echo $PORT
echo $REACT_APP_SUPABASE_URL
```

**Resultado esperado:**
```
✅ NODE_ENV=production
✅ PORT=3004
✅ REACT_APP_SUPABASE_URL=https://supabase.staffhub.cl
```

---

### **6. Verificar contenido del index.html**

```bash
# Ver las primeras líneas del index.html
head -30 /app/build/index.html

# Buscar referencias a archivos JS
grep -o 'src="[^"]*"' /app/build/index.html
```

**Resultado esperado:**
```
✅ Debe tener referencias a /static/js/main.XXXXX.js
✅ Debe tener referencias a /static/css/main.XXXXX.css
```

---

### **7. Verificar permisos de archivos**

```bash
# Ver permisos del directorio build
ls -la /app/build/

# Verificar que el usuario puede leer los archivos
cat /app/build/index.html > /dev/null && echo "✅ Puede leer index.html"
```

---

### **8. Probar conectividad a Supabase**

```bash
# Probar que puede resolver el DNS
nslookup supabase.staffhub.cl

# Probar conectividad HTTP
curl -I https://supabase.staffhub.cl

# Probar el endpoint de health de Supabase
curl https://supabase.staffhub.cl/rest/v1/
```

**Resultado esperado:**
```
✅ DNS resuelve a una IP
✅ HTTPS responde con 200 o 401 (401 es normal sin auth)
```

---

## 🌐 Comandos para ejecutar desde tu máquina local

### **1. Probar el sitio en producción**

```bash
# Probar que el sitio responde
curl -I https://www.staffhub.cl

# Ver el HTML completo
curl https://www.staffhub.cl

# Probar el health check
curl https://www.staffhub.cl/api/health

# Probar con verbose para ver headers
curl -v https://www.staffhub.cl
```

---

### **2. Verificar DNS**

```bash
# Resolver DNS
nslookup www.staffhub.cl
nslookup supabase.staffhub.cl

# O con dig
dig www.staffhub.cl
dig supabase.staffhub.cl
```

---

### **3. Probar desde diferentes ubicaciones**

Usa herramientas online:
- https://www.whatsmydns.net/ (verificar DNS global)
- https://tools.keycdn.com/curl (probar desde diferentes países)
- https://httpstatus.io/ (verificar status codes)

---

## 🐛 Comandos de Diagnóstico Avanzado

### **1. Ver qué archivos está sirviendo Express**

Agrega esto temporalmente a `server-simple.mjs`:

```javascript
// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

Luego verás en los logs cada petición que llega.

---

### **2. Verificar el build localmente antes de deployar**

```bash
# En tu máquina local
npm run build

# Verificar que se generaron los archivos
ls -la build/
ls -la build/static/js/

# Probar el servidor localmente
NODE_ENV=production node server-simple.mjs

# En otro terminal, probar
curl http://localhost:3004/
```

---

### **3. Comparar archivos entre local y producción**

```bash
# Ver hash del archivo JS local
ls build/static/js/main.*.js

# Comparar con el hash en producción
curl https://www.staffhub.cl | grep -o 'main\.[a-z0-9]*\.js'
```

Si los hashes son diferentes, significa que se hizo rebuild.
Si son iguales, significa que NO se hizo rebuild.

---

## 📊 Interpretación de Resultados

### **Escenario 1: Archivos no existen en /app/build/**

**Problema**: El build no se completó o falló
**Solución**: 
1. Ver logs del build en EasyPanel
2. Verificar que el Dockerfile tiene `npm run build`
3. Hacer rebuild

---

### **Escenario 2: Servidor no está corriendo**

**Problema**: El contenedor no inició correctamente
**Solución**:
1. Ver logs del contenedor
2. Verificar que `CMD ["node", "server-simple.mjs"]` está en el Dockerfile
3. Verificar que no hay errores de sintaxis en server-simple.mjs

---

### **Escenario 3: Servidor corre pero da 404**

**Problema**: Express no está sirviendo archivos estáticos
**Solución**:
1. Verificar que `NODE_ENV=production` está configurado
2. Verificar que `app.use(express.static(buildPath))` está en el código
3. Verificar que `buildPath` apunta a `/app/build`

---

### **Escenario 4: index.html carga pero archivos JS dan 404**

**Problema**: Las rutas de los archivos JS son incorrectas
**Solución**:
1. Verificar que `package.json` tiene `"homepage": "."` o no tiene homepage
2. Verificar que los archivos JS existen en `/app/build/static/js/`
3. Verificar permisos de lectura

---

### **Escenario 5: Todo funciona en local pero no en producción**

**Problema**: Diferencia en configuración o variables de entorno
**Solución**:
1. Comparar variables de entorno local vs producción
2. Verificar que las Build Arguments están configuradas
3. Hacer rebuild completo

---

## 🎯 Checklist de Verificación Completa

```bash
# 1. Archivos existen
[ ] ls -la /app/build/index.html
[ ] ls -la /app/build/static/js/

# 2. Servidor corre
[ ] ps aux | grep node
[ ] netstat -tulpn | grep 3004

# 3. Servidor responde
[ ] curl http://localhost:3004/api/health
[ ] curl http://localhost:3004/

# 4. Variables correctas
[ ] echo $NODE_ENV (debe ser "production")
[ ] echo $REACT_APP_SUPABASE_URL (debe ser "https://supabase.staffhub.cl")

# 5. Desde internet
[ ] curl https://www.staffhub.cl
[ ] curl https://www.staffhub.cl/api/health

# 6. DNS correcto
[ ] nslookup www.staffhub.cl
[ ] nslookup supabase.staffhub.cl
```

---

## 📞 Qué Información Enviarme

Si necesitas ayuda, envíame el output de estos comandos:

```bash
# 1. Estructura de archivos
ls -laR /app/build/ | head -50

# 2. Proceso del servidor
ps aux | grep node

# 3. Puerto
netstat -tulpn | grep 3004

# 4. Variables de entorno
env | grep -E "(NODE_ENV|PORT|REACT_APP)"

# 5. Logs del servidor
docker logs --tail 100 <container-id>

# 6. Prueba local
curl -v http://localhost:3004/
```

Con esa información puedo diagnosticar exactamente qué está fallando.
