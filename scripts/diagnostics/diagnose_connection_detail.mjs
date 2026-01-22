#!/usr/bin/env node

/**
 * DIAGNÓSTICO DETALLADO: Error de Conexión a Supabase
 * Verifica cada componente de la conexión paso a paso
 */

console.log('🔍 DIAGNÓSTICO DETALLADO DE CONEXIÓN SUPABASE\n');

// 1. Verificar formato de variables
console.log('1️⃣ VERIFICANDO FORMATO DE VARIABLES:');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL || '❌ NO CONFIGURADA');
console.log('Formato URL:', SUPABASE_URL?.startsWith('https://') ? '✅ Correcto' : '❌ Debe comenzar con https://');
console.log('Contiene project ref:', SUPABASE_URL?.includes('.supabase.co') ? '✅ Correcto' : '❌ Formato inválido');

console.log('\nSUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ CONFIGURADA' : '❌ NO CONFIGURADA');
console.log('Longitud key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.length} caracteres` : 'N/A');
console.log('Formato key:', SUPABASE_ANON_KEY?.startsWith('eyJ') ? '✅ Formato JWT correcto' : '❌ Formato JWT inválido');

// 2. Probar conexión directa con timeout
async function testDirectConnection() {
  console.log('\n2️⃣ PROBANDO CONEXIÓN DIRECTA:');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Faltan variables de entorno');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seg timeout

    const response = await fetch(`${SUPABASE_URL}/rest/v1/companies?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión exitosa:', data);
    } else {
      const error = await response.json();
      console.log('❌ Error en respuesta:', error);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('❌ TIMEOUT: La conexión tardó más de 5 segundos');
    } else {
      console.log('❌ Error de conexión:', err.message);
      console.log('   Tipo:', err.name);
      console.log('   Código:', err.code);
    }
  }
}

// 3. Verificar CORS
async function testCORS() {
  console.log('\n3️⃣ VERIFICANDO CORS:');
  
  try {
    const response = await fetch(SUPABASE_URL, { method: 'OPTIONS' });
    console.log('CORS Headers:', response.headers.get('access-control-allow-origin') || '❌ No CORS headers');
  } catch (err) {
    console.log('❌ Error CORS:', err.message);
  }
}

// 4. Verificar DNS
async function testDNS() {
  console.log('\n4️⃣ VERIFICANDO DNS:');
  
  const dns = require('dns').promises;
  const url = new URL(SUPABASE_URL);
  const hostname = url.hostname;
  
  console.log('Hostname:', hostname);
  
  try {
    const addresses = await dns.resolve4(hostname);
    console.log('✅ DNS resuelto:', addresses);
  } catch (err) {
    console.log('❌ Error DNS:', err.message);
  }
}

// 5. Verificar variables en Netlify
function checkNetlifyEnv() {
  console.log('\n5️⃣ VERIFICANDO VARIABLES DE NETLIFY:');
  console.log('IMPORTANTE: Verifica en Netlify Dashboard → Site settings → Build & deploy → Environment');
  console.log('Variables necesarias:');
  console.log('  - SUPABASE_URL');
  console.log('  - SUPABASE_ANON_KEY');
  console.log('  - REACT_APP_SUPABASE_URL (si usas prefijo REACT_APP_)');
  console.log('  - REACT_APP_SUPABASE_ANON_KEY (si usas prefijo REACT_APP_)');
}

// Ejecutar
async function run() {
  await testDirectConnection();
  await testCORS();
  await testDNS();
  checkNetlifyEnv();
  
  console.log('\n📋 CONCLUSIÓN:');
  console.log('==============');
  console.log('Si la conexión directa falla, el problema es:');
  console.log('1. Variables de entorno incorrectas');
  console.log('2. Problemas de red/firewall');
  console.log('3. CORS no configurado en Supabase');
  console.log('4. DNS no resuelve el hostname');
  console.log('');
  console.log('SOLUCIÓN INMEDIATA:');
  console.log('1. Copia y pega las variables exactas de Supabase');
  console.log('2. Asegúrate de usar la ANON KEY, no la SERVICE ROLE KEY');
  console.log('3. Verifica que el URL sea exacto: https://[project-ref].supabase.co');
}

run().catch(console.error);