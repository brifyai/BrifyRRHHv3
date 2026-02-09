#!/usr/bin/env node

/**
 * Script de Diagnóstico: EasyPanel Override File
 * 
 * Este script ayuda a identificar el problema del docker-compose.override.yml
 * que está causando conflictos de puertos con analytics.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

console.log('🔍 DIAGNÓSTICO: EasyPanel Override File\n');
console.log('=' .repeat(60));

// Posibles ubicaciones del override file
const possiblePaths = [
  '/etc/easypanel/projects/staffhub/supastaff/code/docker-compose.override.yml',
  './docker-compose.override.yml',
  '../docker-compose.override.yml',
  '../../docker-compose.override.yml',
];

let overrideFound = false;
let overridePath = null;

// 1. Buscar el archivo override
console.log('\n📁 1. Buscando docker-compose.override.yml...\n');

for (const path of possiblePaths) {
  if (existsSync(path)) {
    console.log(`✅ ENCONTRADO: ${path}`);
    overrideFound = true;
    overridePath = path;
    
    try {
      const content = readFileSync(path, 'utf8');
      console.log('\n📄 Contenido del archivo:\n');
      console.log('-'.repeat(60));
      console.log(content);
      console.log('-'.repeat(60));
      
      // Verificar si contiene analytics
      if (content.includes('analytics')) {
        console.log('\n⚠️  PROBLEMA ENCONTRADO: El archivo contiene "analytics"');
        console.log('   Esto está causando el conflicto de puertos.');
      }
      
      // Verificar puertos
      const portMatches = content.match(/(\d{4,5}):(\d{4,5})/g);
      if (portMatches) {
        console.log('\n🔌 Puertos encontrados en el override:');
        portMatches.forEach(port => console.log(`   - ${port}`));
      }
      
    } catch (error) {
      console.log(`❌ Error leyendo el archivo: ${error.message}`);
    }
    break;
  }
}

if (!overrideFound) {
  console.log('❌ No se encontró docker-compose.override.yml en las ubicaciones comunes');
  console.log('\n💡 Esto significa que EasyPanel lo está generando dinámicamente');
  console.log('   basado en la configuración de la UI.');
}

// 2. Verificar puertos en uso
console.log('\n\n🔌 2. Verificando puertos en uso...\n');

try {
  const portsToCheck = [3005, 4000, 8000, 8443, 5432];
  
  for (const port of portsToCheck) {
    try {
      const result = execSync(`lsof -i :${port} 2>/dev/null || netstat -tuln 2>/dev/null | grep :${port} || echo "Puerto libre"`, { encoding: 'utf8' });
      
      if (result.includes('Puerto libre')) {
        console.log(`✅ Puerto ${port}: LIBRE`);
      } else {
        console.log(`⚠️  Puerto ${port}: EN USO`);
        console.log(`   ${result.split('\n')[0]}`);
      }
    } catch (error) {
      console.log(`✅ Puerto ${port}: LIBRE (o sin permisos para verificar)`);
    }
  }
} catch (error) {
  console.log('⚠️  No se pudo verificar puertos (requiere permisos)');
}

// 3. Verificar contenedores de Docker
console.log('\n\n🐳 3. Verificando contenedores de Docker...\n');

try {
  const containers = execSync('docker ps -a --format "{{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null', { encoding: 'utf8' });
  
  if (containers) {
    const lines = containers.split('\n').filter(line => line.includes('supastaff') || line.includes('analytics'));
    
    if (lines.length > 0) {
      console.log('Contenedores relacionados con Supabase:\n');
      lines.forEach(line => {
        const [name, status, ports] = line.split('\t');
        console.log(`📦 ${name}`);
        console.log(`   Estado: ${status}`);
        if (ports) console.log(`   Puertos: ${ports}`);
        console.log('');
      });
      
      // Verificar si analytics está corriendo
      const analyticsRunning = lines.some(line => line.includes('analytics'));
      if (analyticsRunning) {
        console.log('⚠️  PROBLEMA: El contenedor analytics está corriendo');
        console.log('   Esto confirma que el override está activo.');
      }
    } else {
      console.log('No se encontraron contenedores de Supabase corriendo');
    }
  }
} catch (error) {
  console.log('⚠️  No se pudo verificar contenedores (Docker no disponible o sin permisos)');
}

// 4. Verificar configuración de Docker Compose
console.log('\n\n⚙️  4. Verificando configuración de Docker Compose...\n');

try {
  const composeConfig = execSync('docker compose -f /etc/easypanel/projects/staffhub/supastaff/code/docker-compose.yml -f /etc/easypanel/projects/staffhub/supastaff/code/docker-compose.override.yml config 2>/dev/null', { encoding: 'utf8' });
  
  if (composeConfig.includes('analytics')) {
    console.log('⚠️  CONFIRMADO: La configuración final incluye analytics');
    
    // Extraer configuración de analytics
    const analyticsMatch = composeConfig.match(/analytics:[\s\S]*?(?=\n\w+:|$)/);
    if (analyticsMatch) {
      console.log('\n📄 Configuración de analytics en la configuración final:\n');
      console.log('-'.repeat(60));
      console.log(analyticsMatch[0]);
      console.log('-'.repeat(60));
    }
  } else {
    console.log('✅ La configuración final NO incluye analytics');
  }
} catch (error) {
  console.log('⚠️  No se pudo obtener la configuración de Docker Compose');
}

// 5. Generar reporte y soluciones
console.log('\n\n📊 RESUMEN DEL DIAGNÓSTICO\n');
console.log('=' .repeat(60));

if (overrideFound) {
  console.log('\n✅ Se encontró docker-compose.override.yml');
  console.log(`   Ubicación: ${overridePath}`);
  console.log('\n🔧 SOLUCIÓN:');
  console.log('   1. Elimina o edita el archivo override');
  console.log('   2. Elimina la sección "analytics" del archivo');
  console.log('   3. Guarda y redeploy en EasyPanel');
} else {
  console.log('\n⚠️  No se encontró docker-compose.override.yml');
  console.log('\n🔧 SOLUCIÓN:');
  console.log('   El override se está generando dinámicamente.');
  console.log('   Opciones:');
  console.log('   1. En EasyPanel, busca la sección "Ports" o "Port Mappings"');
  console.log('   2. Elimina cualquier mapeo de puerto para analytics (3005, 4000)');
  console.log('   3. Elimina la variable ANALYTICS_PORT de las variables de entorno');
  console.log('   4. Guarda y redeploy');
}

console.log('\n\n📝 ARCHIVO DE REPORTE GENERADO\n');

// Generar archivo de reporte
const report = {
  timestamp: new Date().toISOString(),
  overrideFound,
  overridePath,
  diagnosis: overrideFound 
    ? 'Override file encontrado - Eliminar sección analytics'
    : 'Override generado dinámicamente - Revisar configuración de puertos en EasyPanel',
  recommendations: [
    'Eliminar docker-compose.override.yml o su contenido',
    'Eliminar variable ANALYTICS_PORT de las variables de entorno',
    'Verificar configuración de puertos en la UI de EasyPanel',
    'Considerar usar Supabase Cloud si los problemas persisten'
  ]
};

try {
  writeFileSync('easypanel_diagnosis_report.json', JSON.stringify(report, null, 2));
  console.log('✅ Reporte guardado en: easypanel_diagnosis_report.json');
} catch (error) {
  console.log('⚠️  No se pudo guardar el reporte');
}

console.log('\n' + '=' .repeat(60));
console.log('\n🚀 SIGUIENTE PASO:\n');
console.log('   Sigue las soluciones indicadas arriba');
console.log('   O comparte este diagnóstico para obtener ayuda específica\n');
