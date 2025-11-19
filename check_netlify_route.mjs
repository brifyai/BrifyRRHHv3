// Verificar rutas de la aplicación
import fs from 'fs';
import path from 'path';

const appPath = 'src/App.js';

try {
  const content = fs.readFileSync(appPath, 'utf8');
  
  console.log('🔍 Analizando rutas en App.js...\n');
  
  // Buscar rutas que contengan /base-de-datos
  const routeMatches = content.match(/path="[^"]*base-de-datos[^"]*"/g);
  
  if (routeMatches) {
    console.log('✅ Rutas encontradas para /base-de-datos:');
    routeMatches.forEach(route => console.log(`  - ${route}`));
  } else {
    console.log('❌ No se encontraron rutas para /base-de-datos');
  }
  
  // Buscar el componente DatabaseSettings
  const hasDatabaseSettings = content.includes('DatabaseSettings');
  console.log(`\n📦 DatabaseSettings importado: ${hasDatabaseSettings ? '✅ SÍ' : '❌ NO'}`);
  
  // Verificar si hay lazy loading
  const hasLazy = content.includes('lazy(() => import');
  console.log(`📦 Lazy loading activo: ${hasLazy ? '✅ SÍ' : '❌ NO'}`);
  
  console.log('\n💡 Posibles causas del error:');
  console.log('1. Variables de entorno no configuradas en Netlify');
  console.log('2. Build no se completó correctamente');
  console.log('3. Error en el componente DatabaseSettings al renderizar');
  console.log('4. Problema con React Router en producción');
  
} catch (error) {
  console.error('❌ Error leyendo App.js:', error.message);
}