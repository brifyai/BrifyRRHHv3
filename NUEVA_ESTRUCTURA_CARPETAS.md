# Nueva Estructura de Carpetas en Google Drive

## Resumen

Se ha implementado una nueva estructura de carpetas para organizar mejor los empleados en Google Drive. Esta nueva estructura separa los empleados según el tipo de correo electrónico (Gmail vs No Gmail) y mejora la organización general.

## Estructura Anterior

La estructura anterior organizaba las carpetas de la siguiente manera:

```
📁 [Nombre Empresa]/Empleados
    📁 [Nombre Empleado] (empleado@email.com)
```

## Nueva Estructura

La nueva estructura organiza las carpetas de la siguiente manera:

```
📁 [Nombre Empresa]
    📁 Gmail
        📁 [Nombre Empleado Gmail] (empleado@gmail.com)
    📁 No Gmail
        📁 [Nombre Empleado No Gmail] (empleado@empresa.com)
```

## Implementación

### Métodos Principales

1. **`createCompanyFolderStructure(companyName)`**: Crea la estructura de carpetas para una empresa, incluyendo la carpeta principal y las subcarpetas de "Gmail" y "No Gmail".

2. **`findOrCreateSubFolder(parentFolderId, subFolderName)`**: Busca o crea una subcarpeta dentro de una carpeta padre.

3. **`createEmployeeFolderInDrive(employeeEmail, employeeName, companyName, employeeData)`**: Modificado para utilizar la nueva estructura de carpetas al crear carpetas de empleados.

4. **`createNonGmailEmployeeFolder(employeeEmail, employeeName, companyName, employeeData)`**: Modificado para utilizar la nueva estructura de carpetas al crear carpetas de empleados no-Gmail.

### Flujo de Trabajo

1. Al crear una carpeta para un empleado, el sistema verifica si el correo electrónico es de Gmail.
2. Si es de Gmail, se crea la carpeta dentro de la subcarpeta "Gmail".
3. Si no es de Gmail, se crea la carpeta dentro de la subcarpeta "No Gmail".
4. El sistema mantiene un registro en Supabase para rastrear la ubicación de cada carpeta.

## Beneficios

1. **Mejor Organización**: La separación entre empleados con correos de Gmail y no-Gmail facilita la gestión y visualización.
2. **Escalabilidad**: La estructura jerárquica permite un mejor crecimiento a medida que se añaden más empleados y empresas.
3. **Claridad**: Es más fácil identificar el tipo de correo electrónico de un empleado basándose en su ubicación en la estructura de carpetas.

## Migración

Para migrar las carpetas existentes a la nueva estructura, se puede utilizar el siguiente script:

```javascript
// Pseudocódigo para la migración
async function migrateExistingFolders() {
  // 1. Obtener todas las empresas existentes
  const companies = await getAllCompanies();
  
  // 2. Para cada empresa, crear la nueva estructura
  for (const company of companies) {
    await googleDriveSyncService.createCompanyFolderStructure(company.name);
    
    // 3. Obtener todas las carpetas de empleados para esta empresa
    const employeeFolders = await getEmployeeFoldersForCompany(company.id);
    
    // 4. Mover cada carpeta a la ubicación correcta
    for (const folder of employeeFolders) {
      const isGmail = googleDriveSyncService.isGmailEmail(folder.employee_email);
      const targetParent = isGmail ? 'Gmail' : 'No Gmail';
      
      // Mover la carpeta
      await googleDriveConsolidatedService.moveFile(
        folder.drive_folder_id,
        company.folder_id,
        targetParent
      );
      
      // Actualizar el registro en Supabase
      await updateFolderLocationInSupabase(folder.id, targetParent);
    }
  }
}
```

## Consideraciones

1. **Permisos**: Es importante verificar que los permisos de acceso se mantengan correctamente después de la migración.
2. **Sincronización**: Asegurarse de que la sincronización entre Google Drive y Supabase funcione correctamente con la nueva estructura.
3. **Compatibilidad**: Verificar que todas las funcionalidades existentes sigan funcionando con la nueva estructura.

## Conclusión

La nueva estructura de carpetas mejora significativamente la organización y escalabilidad del sistema, proporcionando una mejor experiencia tanto para los desarrolladores como para los usuarios finales.