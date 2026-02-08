# ⚡ ACCIÓN INMEDIATA - Arreglar Supabase

## 🎯 Problema

Tu aplicación funciona en `https://www.staffhub.cl` pero **NO puedes hacer login** porque Supabase devuelve **502 Bad Gateway**.

## 🚨 Causa

El `docker-compose.yml` de tu servicio Supabase en EasyPanel está **vacío o mal configurado**.

---

## ✅ SOLUCIÓN RÁPIDA (5 pasos)

### PASO 1: Abre EasyPanel

1. Ve a EasyPanel
2. Busca tu servicio de **Supabase** (puede llamarse "supastaff")
3. Haz click en el servicio

### PASO 2: Revisa el Docker Compose

1. Busca la sección **"Docker Compose"**
2. Verás un warning: **"Some issues were found..."**
3. Haz click en **"View"** o **"Edit"**
4. Verás que el archivo está vacío o tiene errores

### PASO 3: Usa la Configuración Correcta

**Opción A: Configuración Oficial** (Recomendada)

Descarga y usa la configuración oficial de Supabase:

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/supabase/supabase/master/docker/docker-compose.yml
```

Copia el contenido de ese archivo en EasyPanel.

**Opción B: Configuración Mínima**

Usa el archivo `supabase-docker-compose-minimal.yml` que está en tu proyecto.

### PASO 4: Actualiza las Variables de Entorno

En EasyPanel, en la sección **Environment Variables** del servicio Supabase, asegúrate de tener estas variables con las **NUEVAS CLAVES SEGURAS**:

```bash
# CLAVES SEGURAS (IMPORTANTE)
JWT_SECRET=NOfWAIo3Pe6J2IY9TkNBFIFRwa0y/W3cICO9qgE9NNE=
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcwNTE2MzA4LCJleHAiOjIwODU4NzYzMDh9.c6jwleaMwAGK7O9GbW9HCARoZxS-JwKu79X7afIgjU8
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzA1MTYzMDgsImV4cCI6MjA4NTg3NjMwOH0.qeac2mwebjJ0fybNYrsD97BhQMjxusKRGUt8fTNc1Cs

# DATABASE
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# URLs
SITE_URL=https://www.staffhub.cl
API_EXTERNAL_URL=https://supabase.staffhub.cl
SUPABASE_PUBLIC_URL=https://supabase.staffhub.cl

# GOOGLE OAUTH (usa tus credenciales de Google Cloud Console)
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>
GOTRUE_EXTERNAL_GOOGLE_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://supabase.staffhub.cl/auth/v1/callback
```

**Copia TODAS las variables del archivo `FIX_SUPABASE_502_ERROR.md`** (sección "PASO 3").

### PASO 5: Configura el Dominio

En la configuración del servicio Supabase:

- **Domain**: `supabase.staffhub.cl`
- **Internal Port**: `8000` (puerto de Kong)
- **Protocol**: `HTTP`

### PASO 6: Deploy y Espera

1. Haz click en **"Save"**
2. Haz click en **"Deploy"** o **"Rebuild"**
3. **ESPERA 10 MINUTOS** (Supabase tarda en iniciar)

---

## 🔍 Verificación

Después de 10 minutos, prueba estos URLs:

```bash
# 1. REST API (debe responder, no 502)
https://supabase.staffhub.cl/rest/v1/

# 2. Auth Health (debe responder con JSON)
https://supabase.staffhub.cl/auth/v1/health
```

**Si ves 502**: Espera 5 minutos más y vuelve a intentar.

**Si ves 200 o 401**: ¡Funciona! Continúa al siguiente paso.

---

## 🧪 Script de Diagnóstico

Ejecuta este script para verificar la conectividad:

```bash
node scripts/diagnostics/test_supabase_connectivity.mjs
```

El script te dirá exactamente qué está funcionando y qué no.

---

## 📚 Documentación Completa

Para más detalles, lee:

- **FIX_SUPABASE_502_ERROR.md** - Guía completa paso a paso
- **APLICAR_CLAVES_SEGURAS.md** - Cómo aplicar las claves seguras
- **SUPABASE_SECURE_KEYS.txt** - Tus claves seguras generadas

---

## ⏭️ Siguiente Paso

Una vez que Supabase responda (sin 502):

1. Verifica que las claves coincidan entre Supabase y la app
2. Sigue la guía `APLICAR_CLAVES_SEGURAS.md`
3. Prueba el login

---

## 💡 Resumen

```
PROBLEMA:  502 Bad Gateway en Supabase
CAUSA:     docker-compose.yml vacío o mal configurado
SOLUCIÓN:  Configurar docker-compose.yml correctamente
TIEMPO:    10-15 minutos
RESULTADO: Supabase accesible, login funcionando
```

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues teniendo problemas:

1. Copia los logs del servicio Supabase en EasyPanel
2. Ejecuta el script de diagnóstico
3. Comparte los resultados

**¡Vamos a arreglarlo!** 🚀
