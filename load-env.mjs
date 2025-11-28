/**
 * Cargador de variables de entorno
 * Importar este archivo al inicio de cualquier script para cargar .env
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Cargar .env
config();

// Verificar si se cargaron las variables
const requiredVars = [
  'REACT_APP_GOOGLE_CLIENT_ID',
  'REACT_APP_GOOGLE_CLIENT_SECRET',
  'REACT_APP_GOOGLE_REDIRECT_URI',
  'REACT_APP_SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(varName => {
  const value = process.env[varName];
  return !value || value === 'undefined';
});

if (missingVars.length > 0) {
  console.warn('⚠️  Variables de entorno faltantes:', missingVars.join(', '));
  console.log('   Intentando leer .env manualmente...');
  
  try {
    const envContent = readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^([^=#\s]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remover comillas si existen
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        process.env[key] = value;
      }
    });
    
    console.log('✅ Variables cargadas manualmente desde .env');
  } catch (error) {
    console.error('❌ Error leyendo .env:', error.message);
  }
}

// Verificar nuevamente
const stillMissing = requiredVars.filter(varName => {
  const value = process.env[varName];
  return !value || value === 'undefined';
});

if (stillMissing.length === 0) {
  console.log('✅ Todas las variables de entorno cargadas correctamente');
} else {
  console.log('❌ Variables aún faltantes:', stillMissing.join(', '));
}

export { config };