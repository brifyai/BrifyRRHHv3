#!/usr/bin/env node

/**
 * Generador de claves JWT seguras para Supabase Self-Hosted
 * 
 * Este script genera:
 * - JWT_SECRET: Secreto base para firmar tokens
 * - ANON_KEY: Clave pública para el cliente
 * - SERVICE_ROLE_KEY: Clave privada para operaciones del servidor
 */

import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔐 Generador de Claves JWT Seguras para Supabase\n');
console.log('='.repeat(60));

// Función para crear JWT manualmente (sin dependencias)
function createJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const base64UrlEncode = (str) => {
    return Buffer.from(JSON.stringify(str))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 1. Generar JWT_SECRET
console.log('\n📝 1. Generando JWT_SECRET...\n');
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log(`JWT_SECRET=${jwtSecret}`);

// 2. Generar ANON_KEY
console.log('\n📝 2. Generando ANON_KEY...\n');
const now = Math.floor(Date.now() / 1000);
const tenYears = 10 * 365 * 24 * 60 * 60;

const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: now,
  exp: now + tenYears
};

const anonKey = createJWT(anonPayload, jwtSecret);
console.log(`ANON_KEY=${anonKey}`);

// 3. Generar SERVICE_ROLE_KEY
console.log('\n📝 3. Generando SERVICE_ROLE_KEY...\n');
const serviceRolePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: now,
  exp: now + tenYears
};

const serviceRoleKey = createJWT(serviceRolePayload, jwtSecret);
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`);

// 4. Generar otras claves necesarias
console.log('\n📝 4. Generando claves adicionales...\n');

const dashboardPassword = crypto.randomBytes(16).toString('hex');
const secretKeyBase = crypto.randomBytes(32).toString('base64');
const vaultEncKey = crypto.randomBytes(16).toString('hex');
const pgMetaCryptoKey = crypto.randomBytes(16).toString('hex');
const logflarePublic = crypto.randomBytes(32).toString('hex');
const logflarePrivate = crypto.randomBytes(32).toString('hex');

console.log(`DASHBOARD_PASSWORD=${dashboardPassword}`);
console.log(`SECRET_KEY_BASE=${secretKeyBase}`);
console.log(`VAULT_ENC_KEY=${vaultEncKey}`);
console.log(`PG_META_CRYPTO_KEY=${pgMetaCryptoKey}`);
console.log(`LOGFLARE_PUBLIC_ACCESS_TOKEN=${logflarePublic}`);
console.log(`LOGFLARE_PRIVATE_ACCESS_TOKEN=${logflarePrivate}`);

// 5. Crear archivo de configuración
console.log('\n📝 5. Creando archivo de configuración...\n');

const configContent = `# ========================================
# CLAVES SEGURAS GENERADAS - ${new Date().toISOString()}
# ========================================
# ⚠️  IMPORTANTE: Guarda estas claves en un lugar seguro
# ⚠️  NO las compartas públicamente
# ⚠️  Actualiza tu Supabase self-hosted con estas claves

# JWT Configuration
JWT_SECRET=${jwtSecret}
ANON_KEY=${anonKey}
SERVICE_ROLE_KEY=${serviceRoleKey}

# Dashboard
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=${dashboardPassword}

# Encryption Keys
SECRET_KEY_BASE=${secretKeyBase}
VAULT_ENC_KEY=${vaultEncKey}
PG_META_CRYPTO_KEY=${pgMetaCryptoKey}

# Logflare (Analytics)
LOGFLARE_PUBLIC_ACCESS_TOKEN=${logflarePublic}
LOGFLARE_PRIVATE_ACCESS_TOKEN=${logflarePrivate}

# ========================================
# INSTRUCCIONES DE USO
# ========================================

# 1. En tu Supabase self-hosted (docker-compose.yml o .env):
#    - Actualiza JWT_SECRET
#    - Actualiza ANON_KEY
#    - Actualiza SERVICE_ROLE_KEY
#    - Actualiza las demás claves

# 2. En tu aplicación (.env.production):
#    - Actualiza REACT_APP_SUPABASE_ANON_KEY con el ANON_KEY de arriba
#    - Actualiza SUPABASE_SERVICE_ROLE_KEY con el SERVICE_ROLE_KEY de arriba

# 3. En EasyPanel:
#    - Actualiza las Build Arguments con el nuevo ANON_KEY
#    - Actualiza las Runtime Variables con el nuevo SERVICE_ROLE_KEY
#    - Haz REBUILD

# 4. Reinicia tu Supabase self-hosted:
#    docker-compose down
#    docker-compose up -d

# ========================================
# PARA EASYPANEL - Build Arguments
# ========================================

REACT_APP_SUPABASE_ANON_KEY=${anonKey}

# ========================================
# PARA EASYPANEL - Runtime Variables
# ========================================

SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}
`;

const outputPath = join(__dirname, '../../SUPABASE_SECURE_KEYS.txt');
writeFileSync(outputPath, configContent);

console.log(`✅ Archivo creado: SUPABASE_SECURE_KEYS.txt`);

// 6. Resumen
console.log('\n' + '='.repeat(60));
console.log('✅ CLAVES GENERADAS EXITOSAMENTE\n');
console.log('📄 Las claves se guardaron en: SUPABASE_SECURE_KEYS.txt');
console.log('\n⚠️  IMPORTANTE:');
console.log('   1. Guarda este archivo en un lugar seguro');
console.log('   2. NO lo subas a Git (ya está en .gitignore)');
console.log('   3. Actualiza tu Supabase self-hosted con estas claves');
console.log('   4. Actualiza EasyPanel con las nuevas claves');
console.log('   5. Haz rebuild de tu aplicación');
console.log('='.repeat(60));
