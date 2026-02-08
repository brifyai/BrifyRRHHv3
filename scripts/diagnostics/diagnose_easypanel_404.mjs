#!/usr/bin/env node

/**
 * Diagnóstico de errores 404 en EasyPanel
 * Verifica configuración local y genera reporte
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

console.log('🔍 Diagnóstico de Errores 404 en EasyPanel\n');
console.log('='.repeat(60));

// 1. Verificar archivos críticos
console.log('\n📁 1. Verificando archivos críticos...\n');

const criticalFiles = [
  'Dockerfile',
  'server-simple.mjs',
  'package.json',
  '.env.production',
  'public/index.html'
];

const fileStatus = {};
for (const file of criticalFiles) {
  const path = join(rootDir, file);
  const exists = existsSync(path);
  fileStatus[file] = exists;
  console.log(`${exists ? '✅' : '❌'} ${file}`);
}

// 2. Verificar Dockerfile
console.log('\n🐳 2. Analizando Dockerfile...\n');

if (fileStatus['Dockerfile']) {
  const dockerfile = readFileSync(join(rootDir, 'Dockerfile'), 'utf8');
  
  const checks = {
    'Multi-stage build': dockerfile.includes('FROM node:') && dockerfile.includes('AS builder'),
    'Build stage': dockerfile.includes('npm run build'),
    'Copy build folder': dockerfile.includes('COPY --from=builder /app/build'),
    'Copy server': dockerfile.includes('server-simple.mjs'),
    'Expose port': dockerfile.includes('EXPOSE'),
    'Health check': dockerfile.includes('HEALTHCHECK'),
    'CMD node server': dockerfile.includes('CMD') && dockerfile.includes('node')
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  }
}

// 3. Verificar server-simple.mjs
console.log('\n🚀 3. Analizando server-simple.mjs...\n');

if (fileStatus['server-simple.mjs']) {
  const server = readFileSync(join(rootDir, 'server-simple.mjs'), 'utf8');
  
  const checks = {
    'Express static files': server.includes('express.static'),
    'Production check': server.includes("NODE_ENV === 'production'"),
    'Catch-all route': server.includes("app.get('*'") || server.includes('app.get("*"'),
    'sendFile index.html': server.includes('index.html'),
    'API routes': server.includes('/api/'),
    'Health check endpoint': server.includes('/api/health'),
    'CORS configurado': server.includes('cors')
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  }
}

// 4. Verificar variables de entorno
console.log('\n🔐 4. Verificando variables de entorno...\n');

if (fileStatus['.env.production']) {
  const envContent = readFileSync(join(rootDir, '.env.production'), 'utf8');
  
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_GOOGLE_CLIENT_ID',
    'NODE_ENV',
    'PORT'
  ];

  for (const varName of requiredVars) {
    const hasVar = envContent.includes(varName);
    const value = envContent.match(new RegExp(`${varName}=(.+)`))?.[1]?.trim();
    
    if (hasVar && value) {
      // Verificar que no sean valores placeholder
      const isPlaceholder = value.includes('your-') || 
                           value.includes('YOUR_') || 
                           value.includes('tu_') ||
                           value.includes('example');
      
      if (isPlaceholder) {
        console.log(`⚠️  ${varName}: PLACEHOLDER (necesita valor real)`);
      } else if (varName === 'REACT_APP_SUPABASE_URL') {
        // Verificar URL específicamente
        if (value.includes('imetricsstaffhub')) {
          console.log(`❌ ${varName}: ${value} (URL INCORRECTA - debe ser supabase.staffhub.cl)`);
        } else if (value.includes('supabase.staffhub.cl')) {
          console.log(`✅ ${varName}: ${value}`);
        } else {
          console.log(`⚠️  ${varName}: ${value} (verificar URL)`);
        }
      } else {
        // Mostrar solo primeros caracteres para seguridad
        const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
        console.log(`✅ ${varName}: ${preview}`);
      }
    } else {
      console.log(`❌ ${varName}: NO CONFIGURADO`);
    }
  }
}

// 5. Verificar package.json
console.log('\n📦 5. Verificando package.json...\n');

if (fileStatus['package.json']) {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  
  console.log(`✅ Nombre: ${pkg.name}`);
  console.log(`✅ Versión: ${pkg.version}`);
  console.log(`✅ Node version: ${pkg.engines?.node || 'No especificada'}`);
  
  const requiredScripts = ['start', 'build', 'server'];
  console.log('\nScripts:');
  for (const script of requiredScripts) {
    const hasScript = pkg.scripts?.[script];
    console.log(`${hasScript ? '✅' : '❌'} ${script}: ${hasScript || 'NO DEFINIDO'}`);
  }
  
  const requiredDeps = ['express', 'cors', 'react', 'react-dom'];
  console.log('\nDependencias críticas:');
  for (const dep of requiredDeps) {
    const version = pkg.dependencies?.[dep];
    console.log(`${version ? '✅' : '❌'} ${dep}: ${version || 'NO INSTALADO'}`);
  }
}

// 6. Generar reporte de Build Arguments
console.log('\n🏗️  6. Build Arguments recomendados para EasyPanel...\n');

if (fileStatus['.env.production']) {
  const envContent = readFileSync(join(rootDir, '.env.production'), 'utf8');
  const lines = envContent.split('\n');
  
  console.log('Copia estos Build Arguments en EasyPanel:\n');
  console.log('```');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      // Filtrar solo las variables que empiezan con REACT_APP_ o son críticas
      if (trimmed.startsWith('REACT_APP_') || 
          trimmed.startsWith('NODE_ENV') ||
          trimmed.startsWith('PORT') ||
          trimmed.startsWith('GENERATE_SOURCEMAP') ||
          trimmed.startsWith('CORS_ALLOW_ALL')) {
        console.log(trimmed);
      }
    }
  }
  
  // Agregar variables adicionales necesarias para el build
  console.log('CI=false');
  console.log('ESLINT_NO_DEV_ERRORS=true');
  console.log('```');
}

// 7. Checklist de deployment
console.log('\n✅ 7. Checklist de Deployment en EasyPanel\n');

const checklist = [
  'Configurar Build Arguments en EasyPanel (ver arriba)',
  'Configurar Runtime Environment Variables',
  'Hacer REBUILD (no solo redeploy)',
  'Esperar 5-7 minutos para que complete el build',
  'Verificar logs del build (debe decir "Build completed successfully")',
  'Abrir https://www.staffhub.cl',
  'Limpiar caché del navegador (Ctrl + Shift + R)',
  'Abrir DevTools (F12) y verificar Network tab',
  'Verificar que no hay errores 404',
  'Verificar que las peticiones van a supabase.staffhub.cl'
];

for (let i = 0; i < checklist.length; i++) {
  console.log(`[ ] ${i + 1}. ${checklist[i]}`);
}

// 8. Problemas comunes
console.log('\n🚨 8. Problemas Comunes y Soluciones\n');

const problems = [
  {
    problema: 'Error 404 en index.html',
    causa: 'Archivos estáticos no se sirven',
    solucion: 'Verificar que server-simple.mjs tenga express.static(buildPath)'
  },
  {
    problema: 'Error 404 en archivos .js',
    causa: 'Build no se completó correctamente',
    solucion: 'Verificar logs del build en EasyPanel, hacer rebuild'
  },
  {
    problema: 'ERR_NAME_NOT_RESOLVED',
    causa: 'URL incorrecta compilada en el código',
    solucion: 'Configurar Build Arguments y hacer REBUILD'
  },
  {
    problema: 'Rutas de React Router dan 404',
    causa: 'Falta catch-all route',
    solucion: 'Verificar que server-simple.mjs tenga app.get("*")'
  }
];

for (const { problema, causa, solucion } of problems) {
  console.log(`❌ ${problema}`);
  console.log(`   Causa: ${causa}`);
  console.log(`   Solución: ${solucion}\n`);
}

// 9. Resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN\n');

const allFilesExist = Object.values(fileStatus).every(v => v);
console.log(`Archivos críticos: ${allFilesExist ? '✅ Todos presentes' : '❌ Faltan archivos'}`);

if (fileStatus['.env.production']) {
  const envContent = readFileSync(join(rootDir, '.env.production'), 'utf8');
  const hasCorrectUrl = envContent.includes('supabase.staffhub.cl') && 
                        !envContent.includes('imetricsstaffhub');
  console.log(`URL de Supabase: ${hasCorrectUrl ? '✅ Correcta' : '❌ Incorrecta o faltante'}`);
}

console.log('\n📖 Para más detalles, lee: SOLUCION_ERRORES_404_EASYPANEL.md');
console.log('='.repeat(60));
