#!/usr/bin/env node

/**
 * Auditoría Completa del Sistema StaffHub/BrifyRRHH
 * Analiza errores, warnings, fallas de lógica y problemas en la aplicación
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 INICIANDO AUDITORÍA COMPLETA DEL SISTEMA\n');
console.log('=' .repeat(60));

const results = {
  errors: [],
  warnings: [],
  critical: [],
  performance: [],
  security: [],
  uiIssues: [],
  logicFlaws: []
};

// Función para buscar archivos recursivamente
function findFiles(dir, pattern, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules') && !file.includes('build')) {
      findFiles(filePath, pattern, fileList);
    } else if (pattern.test(file)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// 1. ANALIZAR ERRORES DE COMPILACIÓN
console.log('\n📋 1. ANALIZANDO ERRORES DE COMPILACIÓN...');
try {
  const output = execSync('npm run build 2>&1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const lines = output.split('\n');
  
  lines.forEach((line, index) => {
    if (line.includes('ERROR')) {
      results.errors.push({
        type: 'COMPILATION_ERROR',
        message: line.trim(),
        line: index + 1
      });
    }
    if (line.includes('WARNING')) {
      results.warnings.push({
        type: 'COMPILATION_WARNING',
        message: line.trim(),
        line: index + 1
      });
    }
  });
  
  console.log(`✅ Análisis de compilación completado. ${results.errors.length} errores, ${results.warnings.length} warnings.`);
} catch (error) {
  console.log('⚠️  Error durante la compilación:', error.message.substring(0, 200));
  results.critical.push({
    type: 'BUILD_FAILED',
    message: 'La compilación falló. Revisa los errores críticos.'
  });
}

// 2. ANALIZAR ARCHIVOS JAVASCRIPT/REACT
console.log('\n📋 2. ANALIZANDO ARCHIVOS DE CÓDIGO...');

const jsFiles = findFiles('src', /\.(js|jsx|ts|tsx)$/);
console.log(`   Encontrados ${jsFiles.length} archivos JavaScript/TypeScript`);

jsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Buscar errores comunes
    lines.forEach((line, index) => {
      // Variables no usadas (pero declaradas)
      if (line.includes('const ') && line.includes('= useState') && !line.includes('set')) {
        const varName = line.match(/const \[(\w+)/)?.[1];
        if (varName && !content.includes(`set${varName.charAt(0).toUpperCase() + varName.slice(1)}`)) {
          results.warnings.push({
            type: 'UNUSED_STATE',
            file: filePath,
            line: index + 1,
            message: `Variable de estado '${varName}' declarada pero no usada`
          });
        }
      }
      
      // Funciones async sin try/catch
      if (line.includes('async ') && line.includes('=>') && !content.includes('try {')) {
        const nextLines = lines.slice(index + 1, index + 10).join(' ');
        if (nextLines.includes('await ') && !nextLines.includes('catch')) {
          results.warnings.push({
            type: 'UNHANDLED_ASYNC',
            file: filePath,
            line: index + 1,
            message: `Función async sin manejo de errores try/catch`
          });
        }
      }
      
      // console.log en producción
      if (line.includes('console.log') && !line.includes('//')) {
        results.warnings.push({
          type: 'CONSOLE_LOG',
          file: filePath,
          line: index + 1,
          message: `console.log encontrado (debería removerse en producción)`
        });
      }
      
      // TODO o FIXME
      if (line.includes('TODO') || line.includes('FIXME')) {
        results.warnings.push({
          type: 'TODO',
          file: filePath,
          line: index + 1,
          message: `Comentario TODO/FIXME encontrado`
        });
      }
      
      // Uso de any en TypeScript
      if (line.includes(': any') || line.includes('<any>')) {
        results.warnings.push({
          type: 'TYPE_ANY',
          file: filePath,
          line: index + 1,
          message: `Uso de 'any' en lugar de tipos específicos`
        });
      }
      
      // Event listeners sin cleanup
      if (line.includes('addEventListener') && !content.includes('removeEventListener')) {
        results.warnings.push({
          type: 'EVENT_LISTENER_LEAK',
          file: filePath,
          line: index + 1,
          message: `Event listener agregado sin cleanup en useEffect return`
        });
      }
      
      // setTimeout/setInterval sin clear
      if ((line.includes('setTimeout') || line.includes('setInterval')) && 
          !content.includes('clearTimeout') && !content.includes('clearInterval')) {
        results.warnings.push({
          type: 'TIMER_LEAK',
          file: filePath,
          line: index + 1,
          message: `Timer creado sin cleanup`
        });
      }
    });
    
  } catch (error) {
    results.errors.push({
      type: 'FILE_READ_ERROR',
      file: filePath,
      message: `No se pudo leer el archivo: ${error.message}`
    });
  }
});

// 3. ANALIZAR PROBLEMAS DE DEPENDENCIAS
console.log('\n📋 3. ANALIZANDO DEPENDENCIAS...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

// Buscar dependencias desactualizadas
console.log('   Analizando dependencias potencialmente desactualizadas...');
const criticalDeps = ['react', 'react-dom', 'react-router-dom', 'supabase', '@supabase/supabase-js'];

criticalDeps.forEach(dep => {
  if (dependencies[dep]) {
    const version = dependencies[dep];
    // Versiones muy antiguas
    if (version.includes('^16.') || version.includes('^17.') && dep.startsWith('react')) {
      results.warnings.push({
        type: 'OUTDATED_DEPENDENCY',
        dependency: dep,
        version: version,
        message: `${dep} está en versión antigua (${version}). Considera actualizar.`
      });
    }
  }
});

// 4. ANALIZAR PROBLEMAS DE PERFORMANCE
console.log('\n📋 4. ANALIZANDO PROBLEMAS DE PERFORMANCE...');

jsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Archivos muy grandes (>500 líneas)
    const lines = content.split('\n');
    if (lines.length > 500) {
      results.performance.push({
        type: 'LARGE_FILE',
        file: filePath,
        lines: lines.length,
        message: `Archivo muy grande (${lines.length} líneas). Considera dividirlo.`
      });
    }
    
    // Múltiples useEffect sin dependencias
    const useEffectMatches = content.match(/useEffect\(\(\) => {[^}]*}, \[\]\)/g);
    if (useEffectMatches && useEffectMatches.length > 3) {
      results.performance.push({
        type: 'MANY_EMPTY_USEEFFECT',
        file: filePath,
        count: useEffectMatches.length,
        message: `${useEffectMatches.length} useEffect con array de dependencias vacío`
      });
    }
    
    // Renderizado condicional complejo
    if (content.split('?').length > 20) {
      results.performance.push({
        type: 'COMPLEX_CONDITIONAL',
        file: filePath,
        message: `Múltiples operadores ternarios (posible complejidad de renderizado)`
      });
    }
    
  } catch (error) {
    // Ignorar errores de lectura ya reportados
  }
});

// 5. ANALIZAR PROBLEMAS DE SEGURIDAD
console.log('\n📋 5. ANALIZANDO PROBLEMAS DE SEGURIDAD...');

jsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Credenciales hardcodeadas
    if (content.includes('password') && content.includes('=') && !content.includes('process.env')) {
      results.security.push({
        type: 'HARDCODED_CREDENTIAL',
        file: filePath,
        message: `Posible credencial hardcodeada encontrada`
      });
    }
    
    // API keys expuestas
    if (content.includes('api_key') || content.includes('apiKey') || content.includes('secret')) {
      const lineMatch = content.split('\n').find(line => 
        line.includes('api_key') || line.includes('apiKey') || line.includes('secret')
      );
      if (lineMatch && !lineMatch.includes('process.env') && !lineMatch.includes('REACT_APP')) {
        results.security.push({
          type: 'EXPOSED_KEY',
          file: filePath,
          message: `Posible API key o secreto expuesto en código`
        });
      }
    }
    
    // XSS potencial (innerHTML sin sanitización)
    if (content.includes('innerHTML') && !content.includes('sanitize') && !content.includes('DOMPurify')) {
      results.security.push({
        type: 'XSS_RISK',
        file: filePath,
        message: `Uso de innerHTML sin sanitización (riesgo de XSS)`
      });
    }
    
  } catch (error) {
    // Ignorar errores de lectura ya reportados
  }
});

// 6. ANALIZAR PROBLEMAS DE UI/UX
console.log('\n📋 6. ANALIZANDO PROBLEMAS DE UI/UX...');

// Buscar problemas comunes de UI
jsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Botones sin texto accesible
    if (content.includes('<button') && !content.includes('aria-label') && !content.includes('>')) {
      results.uiIssues.push({
        type: 'INACCESSIBLE_BUTTON',
        file: filePath,
        message: `Botón sin texto accesible (aria-label)`
      });
    }
    
    // Imágenes sin alt text
    if (content.includes('<img') && !content.includes('alt=')) {
      results.uiIssues.push({
        type: 'MISSING_ALT',
        file: filePath,
        message: `Imagen sin atributo alt (accesibilidad)`
      });
    }
    
    // Forms sin labels
    if (content.includes('<input') && !content.includes('<label')) {
      results.uiIssues.push({
        type: 'FORM_WITHOUT_LABELS',
        file: filePath,
        message: `Inputs sin labels asociados`
      });
    }
    
  } catch (error) {
    // Ignorar errores de lectura ya reportados
  }
});

// 7. ANALIZAR PROBLEMAS DE LÓGICA DE NEGOCIO
console.log('\n📋 7. ANALIZANDO PROBLEMAS DE LÓGICA...');

// Buscar problemas comunes de lógica
jsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Múltiples setState seguidos (puede causar renders innecesarios)
    const setStateMatches = content.match(/set\w+\(/g);
    if (setStateMatches && setStateMatches.length > 5) {
      const consecutive = content.match(/set\w+\([^)]*\);\s*set\w+\([^)]*\)/);
      if (consecutive) {
        results.logicFlaws.push({
          type: 'CONSECUTIVE_SETSTATE',
          file: filePath,
          message: `Múltiples setState consecutivos (considera usar batch)`
        });
      }
    }
    
    // Condiciones complejas anidadas
    const nestedIfMatches = content.match(/if.*{[\s\S]*?if.*{/g);
    if (nestedIfMatches && nestedIfMatches.length > 3) {
      results.logicFlaws.push({
        type: 'NESTED_CONDITIONALS',
        file: filePath,
        message: `Múltiples condiciones anidadas (posible alta complejidad ciclomática)`
      });
    }
    
    // Manejo de estados de carga inconsistente
    if (content.includes('setLoading') && !content.includes('finally')) {
      results.logicFlaws.push({
        type: 'INCONSISTENT_LOADING',
        file: filePath,
        message: `Estado de carga puede no resetearse en caso de error (falta finally)`
      });
    }
    
  } catch (error) {
    // Ignorar errores de lectura ya reportados
  }
});

// 8. GENERAR REPORTE FINAL
console.log('\n' + '='.repeat(60));
console.log('📊 REPORTE DE AUDITORÍA COMPLETA');
console.log('='.repeat(60));

function printResults(category, items, icon) {
  if (items.length > 0) {
    console.log(`\n${icon} ${category.toUpperCase()} (${items.length} encontrados):`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.type}] ${item.message}`);
      if (item.file) {
        console.log(`      📁 ${item.file}${item.line ? `:${item.line}` : ''}`);
      }
    });
  } else {
    console.log(`\n${icon} ${category.toUpperCase()}: ✅ No se encontraron problemas`);
  }
}

printResults('Errores Críticos', results.critical, '🔴');
printResults('Errores', results.errors, '❌');
printResults('Warnings', results.warnings, '⚠️');
printResults('Problemas de Performance', results.performance, '🐌');
printResults('Problemas de Seguridad', results.security, '🔒');
printResults('Problemas de UI/UX', results.uiIssues, '🎨');
printResults('Fallas de Lógica', results.logicFlaws, '🧠');

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📈 RESUMEN FINAL');
console.log('='.repeat(60));

const totalIssues = results.critical.length + results.errors.length + results.warnings.length + 
                   results.performance.length + results.security.length + 
                   results.uiIssues.length + results.logicFlaws.length;

console.log(`Total de problemas encontrados: ${totalIssues}`);
console.log(`- Críticos: ${results.critical.length}`);
console.log(`- Errores: ${results.errors.length}`);
console.log(`- Warnings: ${results.warnings.length}`);
console.log(`- Performance: ${results.performance.length}`);
console.log(`- Seguridad: ${results.security.length}`);
console.log(`- UI/UX: ${results.uiIssues.length}`);
console.log(`- Lógica: ${results.logicFlaws.length}`);

if (totalIssues === 0) {
  console.log('\n🎉 ¡Felicidades! El sistema está en excelente estado.');
} else if (results.critical.length === 0 && results.errors.length === 0) {
  console.log('\n✅ El sistema es funcional pero tiene mejoras recomendadas.');
} else {
  console.log('\n❌ Se encontraron problemas que requieren atención inmediata.');
}

console.log('\n' + '='.repeat(60));
console.log('🔍 AUDITORÍA COMPLETADA');
console.log('='.repeat(60));