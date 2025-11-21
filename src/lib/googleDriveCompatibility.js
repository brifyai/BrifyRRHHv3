/**
 * Alias de Compatibilidad para Google Drive
 * Permite que el servicio unificado reemplace automáticamente los servicios individuales
 */

// Importar el servicio unificado
import unifiedGoogleDriveService from './unifiedGoogleDriveService.js';

// Re-exportar como los nombres originales para compatibilidad
// Exportar también como default para imports tradicionales
export default unifiedGoogleDriveService;