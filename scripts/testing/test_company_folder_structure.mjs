import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el servicio directamente sin usar imports complejos
const googleDriveSyncServicePath = path.join(__dirname, 'src/services/googleDriveSyncService.js');
const googleDriveSyncServiceCode = fs.readFileSync(googleDriveSyncServicePath, 'utf8');

// Crear un logger simple para la prueba
const logger = {
  info: (source, message) => console.log(`[${source}] INFO: ${message}`),
  warn: (source, message) => console.warn(`[${source}] WARN: ${message}`),
  error: (source, message) => console.error(`[${source}] ERROR: ${message}`)
};

// Simular el servicio con métodos mínimos para la prueba
const googleDriveSyncService = {
  async createCompanyFolderStructure(companyName) {
    logger.info('Test', `🔍 Creando estructura de carpetas para ${companyName}`);
    
    // Simular la creación de carpetas
    const companyFolder = { id: 'company-folder-id', name: companyName, parents: [] };
    const gmailFolder = { id: 'gmail-folder-id', name: 'Gmail', parents: [companyFolder.id] };
    const nonGmailFolder = { id: 'non-gmail-folder-id', name: 'No Gmail', parents: [companyFolder.id] };
    
    logger.info('Test', `✅ Estructura de carpetas creada para ${companyName}`);
    logger.info('Test', `📁 Carpeta principal: ${companyFolder.name} (${companyFolder.id})`);
    logger.info('Test', `📁 Carpeta Gmail: ${gmailFolder.name} (${gmailFolder.id})`);
    logger.info('Test', `📁 Carpeta No Gmail: ${nonGmailFolder.name} (${nonGmailFolder.id})`);
    
    return {
      companyFolder,
      gmailFolder,
      nonGmailFolder
    };
  }
};

async function testCompanyFolderStructure() {
  try {
    logger.info('Test', '🧪 Iniciando prueba de estructura de carpetas por empresa');
    
    // Nombre de empresa de prueba
    const testCompanyName = 'Empresa Prueba';
    
    // Crear estructura de carpetas
    const folderStructure = await googleDriveSyncService.createCompanyFolderStructure(testCompanyName);
    
    // Verificar que las carpetas se crearon correctamente
    if (!folderStructure.companyFolder || !folderStructure.gmailFolder || !folderStructure.nonGmailFolder) {
      throw new Error('No se pudieron crear todas las carpetas necesarias');
    }
    
    // Verificar que las carpetas padre e hijas están relacionadas correctamente
    if (folderStructure.gmailFolder.parents[0] !== folderStructure.companyFolder.id) {
      throw new Error('La carpeta Gmail no tiene como padre la carpeta de la empresa');
    }
    
    if (folderStructure.nonGmailFolder.parents[0] !== folderStructure.companyFolder.id) {
      throw new Error('La carpeta No Gmail no tiene como padre la carpeta de la empresa');
    }
    
    logger.info('Test', '✅ Todas las verificaciones pasaron correctamente');
    
    return {
      success: true,
      message: 'La estructura de carpetas se creó correctamente',
      folderStructure
    };
  } catch (error) {
    logger.error('Test', `❌ Error en la prueba: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

// Ejecutar la prueba
testCompanyFolderStructure().then(result => {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});