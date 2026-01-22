#!/usr/bin/env node
/**
 * Generador de Keys Seguras para Supabase Self-Hosted
 * Ejecutar: node generate_supabase_keys.mjs
 */

import crypto from 'crypto';

console.log('🔐 Generando keys seguras para Supabase...\n');

// Función para generar string aleatorio
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Función para generar JWT
function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 1. Generar JWT_SECRET (32+ caracteres)
const JWT_SECRET = generateRandomString(64);
console.log('✅ JWT_SECRET generado');

// 2. Generar ANON_KEY
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 años
};
const ANON_KEY = generateJWT(anonPayload, JWT_SECRET);
console.log('✅ ANON_KEY generado');

// 3. Generar SERVICE_ROLE_KEY
const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 años
};
const SERVICE_ROLE_KEY = generateJWT(servicePayload, JWT_SECRET);
console.log('✅ SERVICE_ROLE_KEY generado');

// 4. Generar otras keys
const POSTGRES_PASSWORD = generateRandomString(32);
const DASHBOARD_PASSWORD = generateRandomString(24);
const SECRET_KEY_BASE = generateRandomString(64);
const VAULT_ENC_KEY = generateRandomString(32);
const PG_META_CRYPTO_KEY = generateRandomString(32);
const LOGFLARE_PUBLIC = generateRandomString(32);
const LOGFLARE_PRIVATE = generateRandomString(32);

console.log('\n📋 COPIAR ESTAS VARIABLES A TU .env DE SUPABASE:\n');
console.log('# ========================================');
console.log('# SECRETS - GENERADOS AUTOMÁTICAMENTE');
console.log('# ========================================\n');

console.log(`POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`);
console.log(`JWT_SECRET=${JWT_SECRET}`);
console.log(`ANON_KEY=${ANON_KEY}`);
console.log(`SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}`);
console.log(`DASHBOARD_USERNAME=admin`);
console.log(`DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}`);
console.log(`SECRET_KEY_BASE=${SECRET_KEY_BASE}`);
console.log(`VAULT_ENC_KEY=${VAULT_ENC_KEY}`);
console.log(`PG_META_CRYPTO_KEY=${PG_META_CRYPTO_KEY}`);
console.log(`LOGFLARE_PUBLIC_ACCESS_TOKEN=${LOGFLARE_PUBLIC}`);
console.log(`LOGFLARE_PRIVATE_ACCESS_TOKEN=${LOGFLARE_PRIVATE}`);

console.log('\n# ========================================');
console.log('# URLs - CORREGIDAS');
console.log('# ========================================\n');

console.log('SUPABASE_PUBLIC_URL=https://supabase.imetrics.cl');
console.log('SITE_URL=https://www.imetrics.cl');
console.log('API_EXTERNAL_URL=https://supabase.imetrics.cl');
console.log('ADDITIONAL_REDIRECT_URLS=https://www.imetrics.cl/auth/callback,https://imetrics.cl/auth/callback');
console.log('GOTRUE_SITE_URL=https://www.imetrics.cl');
console.log('GOTRUE_URI_ALLOW_LIST=https://www.imetrics.cl/**,https://imetrics.cl/**');

console.log('\n# ========================================');
console.log('# PARA TU APLICACIÓN REACT');
console.log('# ========================================\n');

console.log(`REACT_APP_SUPABASE_URL=https://supabase.imetrics.cl`);
console.log(`REACT_APP_SUPABASE_ANON_KEY=${ANON_KEY}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}`);

console.log('\n✅ Keys generadas exitosamente!');
console.log('\n⚠️  IMPORTANTE:');
console.log('1. Guarda estas keys en un lugar seguro');
console.log('2. Actualiza tu archivo .env de Supabase');
console.log('3. Reinicia todos los servicios de Supabase');
console.log('4. Actualiza las variables en Easypanel para tu app React');
console.log('5. NO compartas estas keys públicamente\n');
