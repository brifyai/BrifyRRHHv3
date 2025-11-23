# Plan de Migración: Eliminación de Configuraciones Globales

## 📋 **Resumen de Configuraciones Globales Detectadas**

### **Variables de Entorno Globales (35 referencias)**
- `REACT_APP_GOOGLE_CLIENT_ID` (35 usos)
- `REACT_APP_GOOGLE_CLIENT_SECRET` (35 usos)  
- `REACT_APP_GOOGLE_REDIRECT_URI` (10 usos)
- `REACT_APP_GOOGLE_API_KEY` (5 usos)

### **Archivos que usan configuración global:**
1. `googleDriveAuthService.js` - ❌ ELIMINAR (reemplazado por googleDriveAuthServiceDynamic.js)
2. `googleDriveCallbackHandler.js` - ❌ ELIMINAR
3. `googleDriveConfig.js` - ❌ ELIMINAR
4. `googleDriveUnifiedService.js` - ❌ ELIMINAR
5. `netlifyGoogleDrive.js` - ❌ ELIMINAR
6. `unifiedGoogleDriveService.js` - ❌ ELIMINAR
7. `userGoogleDriveService.js` - ❌ ELIMINAR
8. `googleDrivePersistenceService.js` - ❌ ELIMINAR
9. `intelligentHybridDrive.js` - ❌ ELIMINAR
10. `googleDriveRealOnly.js` - ❌ ELIMINAR
11. `googleDriveDiagnosticService.js` - ❌ ELIMINAR
12. `emailService.js` - 🔄 REFACTORIZAR (eliminar referencias a Google)
13. `constants.js` - 🔄 REFACTORIZAR (eliminar GOOGLE_CONFIG)

### **Componentes que usan configuración global:**
- `Settings.js` - ✅ YA REFACTORIZADO (SettingsDynamic.js)
- `EmployeeFolders.js` - 🔄 PENDIENTE REFACTORIZAR
- `GoogleDriveProductionDiagnosis.js` - ❌ ELIMINAR
- `GoogleDriveURIChecker.js` - ❌ ELIMINAR
- `GoogleDriveURIDebugger.js` - ❌ ELIMINAR
- `GoogleDriveConnectionVerifier.js` - ❌ ELIMINAR

## 🎯 **Plan de Eliminación**

### **Fase 1: Archivos de Servicio (Eliminar)**
```bash
# Eliminar servicios obsoletos
rm src/lib/googleDriveAuthService.js
rm src/lib/googleDriveCallbackHandler.js
rm src/lib/googleDriveConfig.js
rm src/lib/googleDriveUnifiedService.js
rm src/lib/netlifyGoogleDrive.js
rm src/lib/unifiedGoogleDriveService.js
rm src/lib/userGoogleDriveService.js
rm src/lib/googleDrivePersistenceService.js
rm src/lib/intelligentHybridDrive.js
rm src/lib/googleDriveRealOnly.js
rm src/lib/googleDriveDiagnosticService.js
```

### **Fase 2: Componentes de Diagnóstico (Eliminar)**
```bash
# Eliminar componentes de diagnóstico obsoletos
rm src/components/test/GoogleDriveProductionDiagnosis.js
rm src/components/test/GoogleDriveURIChecker.js
rm src/components/test/GoogleDriveURIDebugger.js
rm src/components/test/GoogleDriveConnectionVerifier.js
```

### **Fase 3: Refactorizar Servicios Activos**
- `emailService.js` - Eliminar referencias a Google Drive
- `constants.js` - Eliminar GOOGLE_CONFIG

### **Fase 4: Actualizar Imports**
- Buscar y reemplazar imports de servicios eliminados
- Actualizar referencias en componentes activos

## 🔄 **Migración de Configuraciones**

### **Antes (Configuración Global):**
```javascript
// googleDrive.js (ELIMINADO)
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET
```

### **Después (Configuración por Empresa):**
```javascript
// googleDriveAuthServiceDynamic.js (NUEVO)
const credential = await googleDriveAuthServiceDynamic.selectCredential(credentialId)
const clientConfig = credential.settings.clientConfig
```

## 📝 **Script de Migración Automática**

```bash
#!/bin/bash
# migrate_global_configs.sh

echo "🚀 Iniciando migración de configuraciones globales..."

# Fase 1: Eliminar archivos obsoletos
echo "📁 Eliminando servicios obsoletos..."
rm -f src/lib/googleDriveAuthService.js
rm -f src/lib/googleDriveCallbackHandler.js
rm -f src/lib/googleDriveConfig.js
rm -f src/lib/googleDriveUnifiedService.js
rm -f src/lib/netlifyGoogleDrive.js
rm -f src/lib/unifiedGoogleDriveService.js
rm -f src/lib/userGoogleDriveService.js
rm -f src/lib/googleDrivePersistenceService.js
rm -f src/lib/intelligentHybridDrive.js
rm -f src/lib/googleDriveRealOnly.js
rm -f src/lib/googleDriveDiagnosticService.js

# Fase 2: Eliminar componentes de diagnóstico
echo "🔍 Eliminando componentes de diagnóstico..."
rm -f src/components/test/GoogleDriveProductionDiagnosis.js
rm -f src/components/test/GoogleDriveURIChecker.js
rm -f src/components/test/GoogleDriveURIDebugger.js
rm -f src/components/test/GoogleDriveConnectionVerifier.js

# Fase 3: Actualizar imports en archivos activos
echo "🔄 Actualizando imports..."
find src -name "*.js" -exec sed -i 's/import.*googleDriveAuthService.*from/import googleDriveAuthServiceDynamic from/g' {} \;
find src -name "*.js" -exec sed -i 's/import.*googleDriveCallbackHandler.*from/import googleDriveAuthServiceDynamic from/g' {} \;
find src -name "*.js" -exec sed -i 's/import.*googleDriveConfig.*from/import googleDriveAuthServiceDynamic from/g' {} \;

echo "✅ Migración completada"
```

## ⚠️ **Consideraciones Importantes**

### **1. Backup Antes de Eliminar**
- Hacer backup de archivos antes de eliminarlos
- Mantener versiones de respaldo por 30 días

### **2. Testing Incremental**
- Probar cada fase antes de continuar
- Verificar que la aplicación sigue funcionando

### **3. Variables de Entorno**
- Las variables globales pueden mantenerse para otros usos
- Solo eliminar referencias específicas a Google Drive

### **4. Rollback Plan**
- Mantener lista de archivos eliminados
- Script de restauración rápida si es necesario

## 📊 **Estado Actual del Plan**

| Fase | Estado | Archivos Afectados | Riesgo |
|------|--------|-------------------|---------|
| Fase 1 | ✅ Preparado | 11 servicios | Bajo |
| Fase 2 | ✅ Preparado | 4 componentes | Bajo |
| Fase 3 | 🔄 Pendiente | 2 servicios | Medio |
| Fase 4 | 🔄 Pendiente | Múltiples | Medio |

## 🎯 **Próximos Pasos**

1. **Ejecutar script de migración** (Fase 1 y 2)
2. **Refactorizar servicios activos** (Fase 3)
3. **Actualizar imports** (Fase 4)
4. **Probar sistema completo**
5. **Documentar nueva arquitectura**