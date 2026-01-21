# Docker Deployment Guide

## Dockerfile Created

El Dockerfile está configurado para:
- Build multi-stage para optimizar el tamaño de la imagen
- Instalar dependencias de producción
- Compilar la aplicación React
- Servir archivos estáticos con Express
- Health check endpoint en `/api/health`
- Puerto configurable (default: 3004)

## Variables de Entorno Requeridas

Las siguientes variables deben configurarse en Easypanel:

```
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
PORT=3004
REACT_APP_GOOGLE_CLIENT_ID=777409222994-977fdhkb9lfrq7v363hlndulq8k98lgk.apps.googleusercontent.com
REACT_APP_SUPABASE_URL=https://supabase.imetricsstaffhub.cl
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
REACT_APP_GEMINI_API_KEY=AIzaSyDJWd0mB88GwFaScuk-EH7qVfeo450qSwE
CORS_ALLOW_ALL=true
```

## Características

- **Health Check**: Endpoint `/api/health` para monitoreo
- **CORS Flexible**: Configurado con `CORS_ALLOW_ALL=true` para producción
- **Archivos Estáticos**: Servidos desde `/build` en producción
- **API Routes**: Todas las rutas `/api/*` son manejadas por Express
- **SPA Routing**: Catch-all route para React Router

## Build Local (Opcional)

```bash
docker build -t staffhub-app .
docker run -p 3004:3004 --env-file .env staffhub-app
```

## Verificación

Una vez desplegado, verifica:
- Health check: `http://your-domain/api/health`
- App: `http://your-domain/`
- API: `http://your-domain/api/google-drive/status`
