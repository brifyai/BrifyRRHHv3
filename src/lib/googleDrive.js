/**
 * Google Drive Service - WRAPPER DE COMPATIBILIDAD
 *
 * ⚠️ ARCHIVO DEPRECADO - Usa googleDriveConsolidated.js en su lugar
 *
 * Este archivo ahora actúa como wrapper para mantener compatibilidad
 * con código existente mientras se migra al servicio consolidado.
 *
 * TODO: Migrar todos los componentes a googleDriveConsolidatedService
 * y eliminar este archivo.
 */

import logger from './logger.js'

// Importar el servicio consolidado
import googleDriveConsolidatedService, { GoogleDriveConsolidatedService } from './googleDriveConsolidated.js'

// Exportar el servicio consolidado con el nombre antiguo
export default googleDriveConsolidatedService
export { GoogleDriveConsolidatedService as GoogleDriveService }

// Log de advertencia en desarrollo
if (process.env.NODE_ENV === 'development') {
  logger.warn('GoogleDrive', '⚠️ googleDrive.js está deprecado. Usa googleDriveConsolidated.js directamente.')
}
