# 📁 Scripts - StaffHub

Esta carpeta contiene todos los scripts de utilidad, testing y mantenimiento del proyecto.

## 📂 Estructura

### 🔍 **diagnostics/** (62 archivos)
Scripts para diagnosticar problemas y analizar el estado del sistema:
- `diagnose_*.mjs` - Diagnósticos de diferentes componentes
- `debug_*.mjs` - Scripts de debugging detallado
- `check_*.mjs` - Verificaciones de estado
- `inspect_*.mjs` - Inspección de esquemas y configuraciones

**Uso común:**
```bash
node scripts/diagnostics/diagnose_database_connection.mjs
node scripts/diagnostics/check_credentials_script.mjs
```

---

### 🧪 **testing/** (84 archivos)
Scripts de prueba y verificación:
- `test_*.mjs` - Tests de funcionalidades
- `verify_*.mjs` - Verificaciones de implementaciones
- `verificar_*.mjs` - Verificaciones en español

**Uso común:**
```bash
node scripts/testing/test_supabase_connection.mjs
node scripts/testing/verify_integration_success.mjs
```

---

### ⚙️ **setup/** (22 archivos)
Scripts para configurar y crear recursos:
- `setup_*.mjs` - Configuración de sistemas
- `create_*.mjs` - Creación de tablas y recursos
- `seed_*.mjs` - Población de datos
- `migrate_*.mjs` - Migraciones de datos
- `generate_*.mjs` - Generación de keys y configuraciones

**Uso común:**
```bash
node scripts/setup/create_user_camilo.mjs
node scripts/setup/seed_companies.mjs
node scripts/setup/generate_supabase_keys.mjs
```

---

### 🔧 **fixes/** (37 archivos)
Scripts para corregir problemas:
- `fix_*.mjs` - Correcciones de datos y esquemas
- `clean_*.mjs` - Limpieza de datos
- `update_*.mjs` - Actualizaciones masivas
- `emergency_*.mjs` - Fixes de emergencia
- `execute_*.mjs` - Ejecución de correcciones

**Uso común:**
```bash
node scripts/fixes/fix_duplicate_employee_names.mjs
node scripts/fixes/clean_test_data.mjs
```

---

### 🗑️ **obsolete/** (22 archivos)
Scripts obsoletos que ya no se usan pero se mantienen por referencia:
- Versiones antiguas de componentes
- Scripts de debugging resueltos
- Utilidades deprecadas

**Nota:** Estos archivos pueden eliminarse si no se necesitan.

---

## 🚀 Archivos en Raíz (Importantes)

Estos archivos permanecen en la raíz porque son esenciales:

### **Servidor:**
- `server-simple.mjs` - Servidor Node.js para producción (puerto 3004)
- `server-simple.js` - Versión CommonJS del servidor
- `server.js` - Servidor alternativo

### **Configuración:**
- `postcss.config.js` - Configuración de PostCSS
- `tailwind.config.js` - Configuración de Tailwind CSS
- `load-env.mjs` - Carga de variables de entorno

---

## 📋 Uso General

### Ejecutar un script:
```bash
node scripts/[categoria]/[nombre-script].mjs
```

### Ejemplos prácticos:

**Diagnosticar conexión a Supabase:**
```bash
node scripts/diagnostics/diagnose_database_connection.mjs
```

**Crear usuario Camilo:**
```bash
node scripts/setup/create_user_camilo.mjs
```

**Probar conexión:**
```bash
node scripts/testing/test_supabase_connection.mjs
```

**Limpiar datos de prueba:**
```bash
node scripts/fixes/clean_test_data.mjs
```

---

## 🧹 Mantenimiento

### Eliminar scripts obsoletos:
```powershell
Remove-Item -Path scripts/obsolete -Recurse -Force
```

### Ver scripts por categoría:
```powershell
Get-ChildItem -Path scripts/diagnostics -Name
Get-ChildItem -Path scripts/testing -Name
Get-ChildItem -Path scripts/setup -Name
Get-ChildItem -Path scripts/fixes -Name
```

---

## 📊 Estadísticas

- **Total de scripts:** 205 archivos
- **Diagnósticos:** 62 archivos
- **Testing:** 84 archivos
- **Setup:** 22 archivos
- **Fixes:** 37 archivos
- **Obsoletos:** 22 archivos (pueden eliminarse)

---

## ⚠️ Notas Importantes

1. **No ejecutar scripts sin revisar:** Algunos scripts modifican la base de datos
2. **Variables de entorno:** Asegúrate de tener `.env` configurado
3. **Obsoletos:** Los scripts en `obsolete/` pueden eliminarse sin problemas
4. **Backup:** Siempre haz backup antes de ejecutar scripts de fixes

---

## 🔗 Documentación Relacionada

- `DATABASE_SETUP_INSTRUCTIONS.md` - Instrucciones de base de datos
- `EJECUTAR_AHORA_STAFFHUB.md` - Guía de deployment
- `ESTADO_ACTUAL_PROYECTO.md` - Estado del proyecto

---

**Última actualización:** 22 de enero de 2026
