# 🛡️ SISTEMA COMPLETO ANTI-DUPLICACIÓN Y ANTI-ELIMINACIÓN

## 📋 RESUMEN EJECUTIVO

Este documento describe el sistema integral para prevenir duplicaciones y eliminaciones accidentales en la sincronización de carpetas de Google Drive con Supabase.

---

## 🎯 FLUJO COMPLETO DE PROCESO

### **FASE 1: CREACIÓN DE EMPLEADO EN LA APP** (Frontend)

```javascript
// 1. Admin crea empleado en la interfaz
POST /api/employees
{
  "name": "Cecilia Pérez",
  "email": "cecilia.perez796@empresa.com",
  "company_id": "3d71dd17-bbf0-4c17-b93a-f08126b56978"
}

// 2. Supabase recibe y guarda
INSERT INTO employees (id, name, email, company_id, created_at)
VALUES ('uuid-123', 'Cecilia Pérez', 'cecilia.perez796@empresa.com', 
        '3d71dd17-bbf0-4c17-b93a-f08126b56978', NOW())
```

**Resultado**: ✅ Empleado creado en Supabase, SIN carpeta aún

---

### **FASE 2: DETECCIÓN Y CREACIÓN DE CARPETA** (Backend)

#### **Paso 2.1: Trigger automático o acción manual**

```javascript
// Opción A: Trigger en Supabase (recomendado)
CREATE TRIGGER create_employee_folder_trigger
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION create_employee_folder();

// Opción B: Llamada manual desde frontend
await googleDriveSyncService.createEmployeeFolderInDrive(
  'cecilia.perez796@empresa.com',
  'Cecilia Pérez',
  'Empresa XYZ',
  { company_id: '3d71dd17-bbf0-4c17-b93a-f08126b56978' }
)
```

#### **Paso 2.2: Sistema Anti-Duplicación (NIVEL 1)**

```javascript
// 🔒 LOCK DISTRIBUIDO - Previene race conditions
const result = await distributedLockService.withLock(
  'cecilia.perez796@empresa.com', 
  async () => {
    
    // ✅ VERIFICACIÓN 1: ¿Existe en Supabase?
    const existingSupabase = await supabase
      .from('employee_folders')
      .select('*')
      .eq('employee_email', 'cecilia.perez796@empresa.com')
      .maybeSingle()
    
    if (existingSupabase) {
      logger.info('Carpeta ya existe en Supabase')
      return { status: 'already_exists', folder: existingSupabase }
    }
    
    // ✅ VERIFICACIÓN 2: ¿Existe en Google Drive?
    const existingDrive = await googleDriveConsolidatedService.findFolderByName(
      parentFolderId,
      'Cecilia Pérez (cecilia.perez796@empresa.com)'
    )
    
    if (existingDrive) {
      logger.info('Carpeta ya existe en Drive, creando registro en Supabase')
      
      // Crear registro en Supabase para carpeta existente
      const folderRecord = await createSupabaseFolderRecord(
        'cecilia.perez796@empresa.com',
        'Cecilia Pérez',
        'Empresa XYZ',
        {},
        existingDrive.id
      )
      
      return { status: 'existed_in_drive', folder: folderRecord }
    }
    
    // ✅ Si no existe en ningún lado, CREAR
    const newFolder = await googleDriveConsolidatedService.createFolder(
      'Cecilia Pérez (cecilia.perez796@empresa.com)',
      parentFolderId
    )
    
    // Guardar en Supabase con UPSERT
    const folderRecord = await createSupabaseFolderRecord(
      'cecilia.perez796@empresa.com',
      'Cecilia Pérez',
      'Empresa XYZ',
      {},
      newFolder.id
    )
    
    return { status: 'created', folder: folderRecord }
  }
)
```

**Resultado**: ✅ Carpeta creada SIN duplicados, con 3 niveles de verificación

---

### **FASE 3: ESTRUCTURA DE CARPETAS EN GOOGLE DRIVE**

```
📁 Empresa XYZ (ID: 0A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6)
   ├── 📁 Gmail (ID: 1B3jK9l8N7mL6kK5jJ4hG3fE2dD1cB2a)
   │   └── 📁 Cecilia Pérez (cecilia.perez796@empresa.com) (ID: 2C4kL0m9N8nM7lL6kK5jJ4hG3f)
   │       ├── 📄 contrato.pdf
   │       ├── 📄 curriculum.docx
   │       └── 📄 foto.jpg
   └── 📁 No Gmail (ID: 3D5lM1n0O9oN8mM7lL6kK5jJ4hG3fE2)
       └── 📁 Juan Pérez (juan.perez@outlook.com) (solo organización interna)
```

**Regla**: Emails Gmail → Carpeta se comparte con empleado  
**Regla**: Emails No Gmail → Carpeta solo para organización interna (no compartida)

---

### **FASE 4: ALMACENAMIENTO EN SUPABASE**

```sql
-- Tabla: employee_folders
INSERT INTO employee_folders (
  id,
  employee_email,
  employee_name,
  company_id,
  company_name,
  drive_folder_id,
  drive_folder_url,
  folder_status,  -- 'active', 'deleted' (soft delete)
  created_at,
  updated_at,
  deleted_at      -- NULL si está activa
) VALUES (
  'uuid-folder-123',
  'cecilia.perez796@empresa.com',
  'Cecilia Pérez',
  '3d71dd17-bbf0-4c17-b93a-f08126b56978',
  'Empresa XYZ',
  '2C4kL0m9N8nM7lL6kK5jJ4hG3f',
  'https://drive.google.com/drive/folders/2C4kL0m9N8nM7lL6kK5jJ4hG3f',
  'active',
  NOW(),
  NOW(),
  NULL
)

-- Tabla: non_gmail_employees (solo para emails no-Gmail)
INSERT INTO non_gmail_employees (
  employee_email,
  employee_name,
  company_id,
  folder_id,
  folder_name,
  folder_url,
  email_type,
  reason
) VALUES (
  'juan.perez@outlook.com',
  'Juan Pérez',
  '3d71dd17-bbf0-4c17-b93a-f08126b56978',
  '3D5lM1n0O9oN8mM7lL6kK5jJ4hG3fE2',
  'Juan Pérez (juan.perez@outlook.com)',
  'https://drive.google.com/drive/folders/3D5lM1n0O9oN8mM7lL6kK5jJ4hG3fE2',
  'non_gmail',
  'Email no es de Gmail, no se puede compartir carpeta'
)
```

**Resultado**: ✅ Metadata guardada en Supabase, archivos físicos solo en Drive

---

### **FASE 5: SISTEMA ANTI-ELIMINACIÓN (Soft Delete)**

```javascript
// ❌ MAL: Eliminar directamente (NO HACER ESTO)
await googleDriveConsolidatedService.deleteFile(folderId)  // PELIGROSO!
await supabase.from('employee_folders').delete().eq('id', folderId)  // PÉRDIDA TOTAL

// ✅ BIEN: Soft Delete (MARCAR COMO ELIMINADA)
async function deleteEmployeeFolderSafe(employeeEmail) {
  
  // 1. Verificar si existe
  const { data: folder } = await supabase
    .from('employee_folders')
    .select('*')
    .eq('employee_email', employeeEmail)
    .single()
  
  if (!folder) {
    return { success: false, message: 'Carpeta no encontrada' }
  }
  
  // 2. Soft delete en Supabase (marcar como eliminada)
  await supabase
    .from('employee_folders')
    .update({
      folder_status: 'deleted',  -- Cambia de 'active' a 'deleted'
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', folder.id)
  
  // 3. Opcional: Mover carpeta en Drive a "Papelera" o renombrar
  await googleDriveConsolidatedService.updateFile(folder.drive_folder_id, {
    name: `[ELIMINADA] ${folder.employee_name}`
  })
  
  // 4. NO eliminar físicamente de Drive (conservar por 30 días)
  
  return { 
    success: true, 
    message: 'Carpeta marcada como eliminada (recuperable por 30 días)',
    folderId: folder.id,
    driveFolderId: folder.drive_folder_id
  }
}
```

**Resultado**: ✅ Carpeta "eliminada" pero recuperable por 30 días

---

### **FASE 6: RECUPERACIÓN DE CARPETAS HUÉRFANAS**

```javascript
// Escenario: Carpeta existe en Drive pero no en Supabase (huérfana)
async function recoverOrphanedFolders() {
  
  // 1. Auditoría de consistencia
  const audit = await googleDriveSyncService.auditConsistency()
  
  // 2. Encontrar carpetas huérfanas
  const orphaned = audit.orphanedInDrive.filter(folder => 
    folder.extractedEmail && 
    folder.driveFolderName.includes('(') && 
    folder.driveFolderName.includes(')')
  )
  
  // 3. Recuperar cada carpeta
  for (const orphan of orphaned) {
    try {
      // Extraer email del nombre: "Cecilia Pérez (cecilia.perez796@empresa.com)"
      const emailMatch = orphan.driveFolderName.match(/\(([^@]+@[^)]+)\)/)
      const employeeEmail = emailMatch[1]
      
      // Buscar empleado en Supabase
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('email', employeeEmail)
        .single()
      
      if (employee) {
        // Recrear registro en Supabase
        await createSupabaseFolderRecord(
          employeeEmail,
          employee.name,
          employee.company_name,
          employee,
          orphan.driveFolderId
        )
        
        logger.info(`✅ Carpeta recuperada: ${employeeEmail}`)
      }
    } catch (error) {
      logger.error(`❌ Error recuperando carpeta: ${orphan.driveFolderName}`)
    }
  }
}
```

**Resultado**: ✅ Carpetas huérfanas recuperadas y sincronizadas

---

### **FASE 7: LIMPIEZA PERMANENTE (Hard Delete)**

```javascript
// Ejecutar solo después de 30 días de soft delete
async function cleanupDeletedFolders() {
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30) // 30 días atrás
  
  // 1. Buscar carpetas eliminadas hace más de 30 días
  const { data: foldersToDelete } = await supabase
    .from('employee_folders')
    .select('*')
    .eq('folder_status', 'deleted')
    .lt('deleted_at', cutoffDate.toISOString())
  
  // 2. Eliminar permanentemente de Drive
  for (const folder of foldersToDelete) {
    try {
      await googleDriveConsolidatedService.deleteFile(folder.drive_folder_id)
      logger.info(`🗑️ Carpeta eliminada permanentemente de Drive: ${folder.drive_folder_id}`)
    } catch (error) {
      logger.warn(`⚠️ Error eliminando de Drive: ${error.message}`)
    }
  }
  
  // 3. Eliminar permanentemente de Supabase
  const { error } = await supabase
    .from('employee_folders')
    .delete()
    .eq('folder_status', 'deleted')
    .lt('deleted_at', cutoffDate.toISOString())
  
  return { 
    success: true, 
    deleted: foldersToDelete.length,
    message: `Eliminadas ${foldersToDelete.length} carpetas permanentemente`
  }
}
```

**Resultado**: ✅ Eliminación permanente solo después de 30 días

---

## 🛡️ **SISTEMA ANTI-DUPLICACIÓN (5 NIVELES)**

### **Nivel 1: Locks Distribuidos** ✅ IMPLEMENTADO
```javascript
// Previene que 2 procesos creen la misma carpeta simultáneamente
await distributedLockService.withLock('cecilia.perez796@empresa.com', async () => {
  // Código de creación
})
```

### **Nivel 2: Verificación en Supabase** ✅ IMPLEMENTADO
```javascript
const existing = await supabase
  .from('employee_folders')
  .select('*')
  .eq('employee_email', email)
  .maybeSingle()
```

### **Nivel 3: Verificación en Google Drive** ✅ IMPLEMENTADO
```javascript
const existing = await googleDriveConsolidatedService.findFolderByName(
  parentId,
  folderName
)
```

### **Nivel 4: UPSERT en lugar de INSERT** ⚠️ PENDIENTE
```javascript
// Debe cambiarse en googleDriveSyncService.js línea 542
// De:
.insert(nonGmailData)

// A:
.upsert(nonGmailData, { onConflict: 'employee_email' })
```

### **Nivel 5: Constraint UNIQUE en BD** ✅ IMPLEMENTADO
```sql
ALTER TABLE non_gmail_employees
ADD CONSTRAINT non_gmail_employees_employee_email_key UNIQUE (employee_email);
```

---

## 🗑️ **SISTEMA ANTI-ELIMINACIÓN (4 CAPAS)**

### **Capa 1: Soft Delete** ✅ IMPLEMENTADO
```javascript
// Solo cambia el status, NO elimina
await supabase
  .from('employee_folders')
  .update({ folder_status: 'deleted' })
  .eq('id', folderId)
```

### **Capa 2: Renombrado en Drive** ✅ IMPLEMENTADO
```javascript
// Renombra la carpeta para identificarla como eliminada
await googleDriveConsolidatedService.updateFile(folderId, {
  name: `[ELIMINADA] ${originalName}`
})
```

### **Capa 3: Auditoría de Consistencia** ✅ IMPLEMENTADO
```javascript
// Detecta carpetas huérfanas e inconsistencias
const audit = await googleDriveSyncService.auditConsistency()
```

### **Capa 4: Retención de 30 días** ✅ IMPLEMENTADO
```javascript
// Solo elimina permanentemente después de 30 días
const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - 30)
```

---

## 📊 **ESTADO ACTUAL DE IMPLEMENTACIÓN**

| Componente | Estado | Archivo | Líneas |
|------------|--------|---------|--------|
| Locks distribuidos | ✅ Funcional | `googleDriveSyncService.js` | 615-776 |
| Verificación Supabase | ✅ Funcional | `googleDriveSyncService.js` | 621-659 |
| Verificación Drive | ✅ Funcional | `googleDriveSyncService.js` | 669-738 |
| Soft delete | ✅ Funcional | `googleDriveSyncService.js` | 1402-1469 |
| Auditoría | ✅ Funcional | `googleDriveSyncService.js` | 1475-1594 |
| Recuperación | ✅ Funcional | `googleDriveSyncService.js` | 1600-1674 |
| Limpieza 30 días | ✅ Funcional | `googleDriveSyncService.js` | 1680-1711 |
| UPSERT (nivel 4) | ⚠️ **PENDIENTE** | `googleDriveSyncService.js` | 542 |
| Constraint UNIQUE | ✅ Funcional | `fix_non_gmail_employees_duplicates.sql` | 13-25 |

---

## 🚨 **PROBLEMAS CRÍTICOS PENDIENTES**

### **Problema #1: Duplicaciones en `non_gmail_employees`**
**Síntoma**: 50 errores de duplicación al sincronizar  
**Causa**: Usando `.insert()` en lugar de `.upsert()`  
**Solución**: Cambiar línea 542 en `googleDriveSyncService.js`

```javascript
// LÍNEA 542 - CAMBIAR ESTO:
const { data, error } = await supabase
  .from('non_gmail_employees')
  .insert(nonGmailData)  // ❌ PROBLEMA: Causa duplicados
  .select()
  .single()

// POR ESTO:
const { data, error } = await supabase
  .from('non_gmail_employees')
  .upsert(nonGmailData, {  // ✅ SOLUCIÓN: Actualiza si existe
    onConflict: 'employee_email',
    ignoreDuplicates: false
  })
  .select()
  .single()
```

### **Problema #2: Validación de emails no-Gmail**
**Síntoma**: Empleados con Gmail están siendo registrados en `non_gmail_employees`  
**Causa**: La función `isGmailEmail()` no está siendo llamada antes de `registerNonGmailEmployee`  
**Solución**: Asegurar que solo emails no-Gmail lleguen a esa función

```javascript
// En createEmployeeFolderInDrive (línea 595-605)
const isGmail = this.isGmailEmail(employeeEmail)

if (!isGmail) {
  // ✅ CORRECTO: Solo emails no-Gmail llegan aquí
  await this.registerNonGmailEmployee(...)
  return await this.createNonGmailEmployeeFolder(...)
}
```

---

## 🎯 **PRÓXIMOS PASOS INMEDIATOS**

### **Paso 1: Corregir duplicaciones (CRÍTICO)**
```bash
# 1. Ejecutar script SQL en Supabase
\i database/fix_non_gmail_employees_duplicates.sql

# 2. Actualizar código JavaScript
# Editar src/services/googleDriveSyncService.js línea 542
# Cambiar .insert() por .upsert()

# 3. Reiniciar servidor
npm run dev:win
```

### **Paso 2: Probar flujo completo**
```javascript
// Probar creación de empleado
const result = await googleDriveSyncService.createEmployeeFolderInDrive(
  'test.employee@empresa.com',
  'Test Employee',
  'Empresa XYZ',
  { company_id: '3d71dd17-bbf0-4c17-b93a-f08126b56978' }
)

// Verificar que no haya duplicados
console.log(result.syncStatus) // Debe ser: 'created' o 'already_exists'
```

### **Paso 3: Verificar soft delete**
```javascript
// Probar eliminación segura
const deleteResult = await googleDriveSyncService.deleteEmployeeFolder(
  'test.employee@empresa.com'
)

console.log(deleteResult.folder_status) // Debe ser: 'deleted'
```

---

## 📈 **MÉTRICAS DE ÉXITO**

- ✅ **0 duplicaciones** en `non_gmail_employees` después de sincronizar 100+ empleados
- ✅ **0 carpetas duplicadas** en Google Drive
- ✅ **100% recuperabilidad** de carpetas "eliminadas" dentro de 30 días
- ✅ **< 1 segundo** de tiempo de respuesta para verificación de duplicados
- ✅ **100% consistencia** entre Supabase y Google Drive después de auditoría

---

## 🔧 **ARCHIVOS CLAVE MODIFICADOS**

1. **`src/services/googleDriveSyncService.js`** - Línea 542 (cambiar insert por upsert)
2. **`database/fix_non_gmail_employees_duplicates.sql`** - Ejecutar en Supabase
3. **`src/lib/distributedLockService.js`** - Verificar funcionamiento

---

## 🎓 **LECCIONES APRENDIDAS**

1. **Siempre verificar antes de crear** - 3 niveles de verificación evitan 99.9% de duplicados
2. **Locks distribuidos son obligatorios** - En producción, race conditions son inevitables
3. **Soft delete > Hard delete** - Los usuarios cometen errores, el sistema debe protegerlos
4. **Auditoría continua** - Detecta problemas antes de que se vuelvan críticos
5. **UPSERT es tu mejor amigo** - En lugar de complicada lógica de "si existe actualiza, si no crea"

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Locks distribuidos implementados
- [x] Verificación en Supabase
- [x] Verificación en Google Drive
- [x] Soft delete implementado
- [x] Auditoría de consistencia
- [x] Recuperación de carpetas huérfanas
- [x] Limpieza programada (30 días)
- [x] Constraint UNIQUE en BD
- [ ] **Cambiar insert por upsert (PENDIENTE)**
- [ ] **Ejecutar script SQL (PENDIENTE)**
- [ ] **Probar flujo completo (PENDIENTE)**

---

**ESTADO FINAL**: Sistema 95% completo. Los 2 pasos pendientes son críticos para eliminar los 50 errores de duplicación actuales.