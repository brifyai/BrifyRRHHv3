# Sincronización Bidireccional entre Google Drive y Supabase

## Resumen

Se ha implementado una nueva funcionalidad que permite sincronizar las carpetas de empleados primero con Supabase y luego desde Supabase con Google Drive. Esta sincronización bidireccional garantiza que los archivos estén actualizados en ambas plataformas.

## Funcionalidad Implementada

### 1. Sincronización Bidireccional

Se ha añadido un nuevo método `syncDriveFromSupabase` en el servicio `googleDriveSyncService` que realiza una sincronización completa en dos pasos:

1. **Paso 1: Google Drive → Supabase**
   - Obtiene los archivos de Google Drive
   - Los registra en Supabase si no existen

2. **Paso 2: Supabase → Google Drive**
   - Obtiene los documentos de Supabase que no están en Google Drive
   - Los crea en Google Drive
   - Actualiza el registro en Supabase con el ID del archivo de Google Drive

### 2. Interfaz de Usuario

Se ha añadido un botón "Sincronizar con Google Drive" en la interfaz de usuario que permite a los usuarios activar esta sincronización con un solo clic.

## Implementación Técnica

### Servicio de Sincronización

```javascript
async syncDriveFromSupabase(employeeEmail, folderId) {
  try {
    logger.info('GoogleDriveSyncService', `🔄 Iniciando sincronización completa para ${employeeEmail}...`);
    
    // Paso 1: Sincronizar desde Google Drive a Supabase
    logger.info('GoogleDriveSyncService', `📥 Paso 1: Sincronizando desde Google Drive a Supabase...`);
    const driveToSupabaseResult = await this.syncFilesFromDrive(folderId, employeeEmail);
    
    // Paso 2: Sincronizar desde Supabase a Google Drive
    logger.info('GoogleDriveSyncService', `📤 Paso 2: Sincronizando desde Supabase a Google Drive...`);
    const supabaseToDriveResult = await this.syncFilesToDrive(employeeEmail, folderId);
    
    // Resultado combinado
    const totalSynced = driveToSupabaseResult.synced + supabaseToDriveResult.synced;
    const totalErrors = driveToSupabaseResult.errors + supabaseToDriveResult.errors;
    
    logger.info('GoogleDriveSyncService', `✅ Sincronización completa finalizada: ${totalSynced} sincronizados, ${totalErrors} errores`);
    
    return {
      driveToSupabase: driveToSupabaseResult,
      supabaseToDrive: supabaseToDriveResult,
      totalSynced,
      totalErrors
    };
  } catch (error) {
    logger.error('GoogleDriveSyncService', `❌ Error en sincronización completa para ${employeeEmail}: ${error.message}`);
    this.recordError(error.message);
    throw error;
  }
}
```

### Interfaz de Usuario

```jsx
<button
  onClick={syncDriveFromSupabase}
  disabled={syncingDrive}
  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {syncingDrive ? (
    <>
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
      Sincronizando con Drive...
    </>
  ) : (
    <>
      <CloudArrowUpIcon className="h-5 w-5 mr-3" />
      Sincronizar con Google Drive
    </>
  )}
</button>
```

## Beneficios

1. **Consistencia de Datos**: Garantiza que los archivos estén sincronizados entre Google Drive y Supabase.
2. **Facilidad de Uso**: Un solo botón para realizar toda la sincronización.
3. **Transparencia**: El usuario puede ver el progreso y los resultados de la sincronización.
4. **Flexibilidad**: Permite sincronizar tanto desde Google Drive a Supabase como en sentido contrario.

## Flujo de Trabajo

1. El usuario hace clic en el botón "Sincronizar con Google Drive".
2. El sistema verifica si el usuario está autenticado con Google Drive.
3. Si no está autenticado, se le solicita que se autentique.
4. El sistema obtiene todas las carpetas de empleados de Supabase.
5. Para cada carpeta:
   - Sincroniza los archivos de Google Drive a Supabase.
   - Sincroniza los documentos de Supabase a Google Drive.
6. El sistema muestra un resumen de la sincronización.

## Consideraciones

1. **Autenticación**: Es necesario que el usuario esté autenticado con Google Drive para utilizar esta funcionalidad.
2. **Rendimiento**: La sincronización puede tardar más tiempo si hay muchos archivos que sincronizar.
3. **Errores**: El sistema registra cualquier error que ocurra durante la sincronización para su posterior revisión.

## Conclusión

Esta nueva funcionalidad mejora significativamente la experiencia del usuario al garantizar que los archivos estén siempre sincronizados entre Google Drive y Supabase, proporcionando una solución completa y fácil de usar para la gestión de documentos de empleados.