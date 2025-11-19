#!/usr/bin/env node

/**
 * DIAGNÓSTICO DE ERROR EN RUNTIME
 * Simula el entorno de Netlify para identificar el error exacto
 */

console.log('🔍 DIAGNÓSTICO DE ERROR EN RUNTIME\n');

// 1. Simular variables de Netlify
console.log('1️⃣ SIMULANDO ENTORNO DE NETLIFY:');
console.log('   REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅' : '❌');
console.log('   REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅' : '❌');

// 2. Verificar si el error es de CORS/RLS
console.log('\n2️⃣ POSIBLES CAUSAS DEL ERROR "Oops, algo salió mal":');

const causes = [
  {
    name: 'Row Level Security (RLS) bloqueando queries',
    check: 'SELECT * FROM pg_policies WHERE tablename = \'companies\'',
    solution: 'Desactivar RLS temporalmente o crear políticas permisivas'
  },
  {
    name: 'Error en Error Boundary de React',
    check: 'Ver src/components/error/ErrorBoundary.js',
    solution: 'Revisar componentDidCatch y logs'
  },
  {
    name: 'Problema en src/lib/supabaseClient.js',
    check: 'Línea 29: window.localStorage en SSR',
    solution: 'Agregar typeof window !== \'undefined\' check'
  },
  {
    name: 'Error en useEffect inicial',
    check: 'Componentes que cargan al inicio',
    solution: 'Agregar try/catch en useEffect principales'
  },
  {
    name: 'CORS bloqueado en Supabase',
    check: 'Supabase Dashboard → API Settings',
    solution: 'Agregar https://brifyrrhhv3.netlify.app a CORS'
  }
];

causes.forEach((cause, i) => {
  console.log(`   ${i + 1}. ${cause.name}`);
  console.log(`      Check: ${cause.check}`);
  console.log(`      Solución: ${cause.solution}\n`);
});

// 3. Verificar el Error Boundary
console.log('3️⃣ VERIFICANDO ERROR BOUNDARY:');
console.log('   Ubicación: src/components/error/ErrorBoundary.js');
console.log('   Si este componente captura un error, muestra "Oops, algo salió mal"');
console.log('   Necesitamos ver el error original en console.error');

// 4. Crear script para capturar error real
console.log('\n4️⃣ SCRIPT PARA CAPTURAR ERROR REAL:');
console.log(`
// Agregar esto en src/index.js o App.js
window.addEventListener('error', (event) => {
  console.error('❌ ERROR GLOBAL CAPTURADO:', event.error);
  console.error('   Mensaje:', event.error.message);
  console.error('   Stack:', event.error.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ PROMESA RECHAZADA NO MANEJADA:', event.reason);
});
`);

// 5. Instrucciones para el usuario
console.log('\n📋 INSTRUCCIONES PARA DIAGNOSTICAR:');
console.log('1. Abre la app en el navegador');
console.log('2. Abre DevTools (F12) → Consola');
console.log('3. Refresca la página');
console.log('4. Captura TODO lo rojo que aparezca en la consola');
console.log('5. Copia y pega el error exacto aquí');

console.log('\n🔍 PRÓXIMOS PASOS:');
console.log('1. Revisaré el Error Boundary para ver qué error captura');
console.log('2. Verificaré si hay errores en el código de inicialización');
console.log('3. Crearé un fix basado en el error exacto');