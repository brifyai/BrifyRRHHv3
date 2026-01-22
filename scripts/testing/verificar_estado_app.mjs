#!/usr/bin/env node

/**
 * Script de Verificación del Estado de la Aplicación
 * Verifica que Google Drive esté funcionando en modo production
 */

import { readFileSync } from 'fs';
import { createServer } from 'http';

console.log('🔍 VERIFICANDO ESTADO DE LA APLICACIÓN...\n');

// Verificar configuración de Google Drive
function checkGoogleDriveConfig() {
  console.log('📁 VERIFICANDO CONFIGURACIÓN DE GOOGLE DRIVE:');
  
  try {
    // Leer archivo .env
    const envContent = readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    const driveMode = envVars.REACT_APP_DRIVE_MODE;
    const clientId = envVars.REACT_APP_GOOGLE_CLIENT_ID;
    const apiKey = envVars.REACT_APP_GOOGLE_API_KEY;
    
    console.log(`   Modo Drive: ${driveMode}`);
    console.log(`   Client ID: ${clientId ? '✅ Configurado' : '❌ Faltante'}`);
    console.log(`   API Key: ${apiKey ? '✅ Configurado' : '❌ Faltante'}`);
    
    if (driveMode === 'production') {
      console.log('   🎯 Google Drive configurado para PRODUCCIÓN');
      console.log('   📋 Próximos pasos:');
      console.log('      1. Reiniciar la aplicación para aplicar cambios');
      console.log('      2. Probar autenticación OAuth');
      console.log('      3. Verificar creación de carpetas');
    } else {
      console.log('   ⚠️  Google Drive en modo LOCAL');
    }
    
  } catch (error) {
    console.log(`❌ Error verificando configuración: ${error.message}`);
  }
}

// Verificar Supabase
function checkSupabaseConfig() {
  console.log('\n🗄️  VERIFICANDO CONFIGURACIÓN DE SUPABASE:');
  
  try {
    const envContent = readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    const supabaseUrl = envVars.REACT_APP_SUPABASE_URL;
    const supabaseKey = envVars.SUPABASE_KEY;
    
    console.log(`   URL: ${supabaseUrl ? '✅ Configurado' : '❌ Faltante'}`);
    console.log(`   Key: ${supabaseKey ? '✅ Configurado' : '❌ Faltante'}`);
    
  } catch (error) {
    console.log(`❌ Error verificando Supabase: ${error.message}`);
  }
}

// Verificar API Keys
function checkAPIKeys() {
  console.log('\n🔑 VERIFICANDO API KEYS:');
  
  try {
    const envContent = readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    const keys = {
      'Brevo': envVars.REACT_APP_BREVO_API_KEY,
      'Groq': envVars.REACT_APP_GROQ_API_KEY,
      'Google Drive': envVars.REACT_APP_GOOGLE_CLIENT_ID
    };
    
    Object.entries(keys).forEach(([service, key]) => {
      if (key && !key.includes('your-')) {
        console.log(`   ${service}: ✅ Configurado`);
      } else {
        console.log(`   ${service}: ⚠️  Placeholder o faltante`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Error verificando API keys: ${error.message}`);
  }
}

// Verificar puertos
function checkPorts() {
  console.log('\n🌐 VERIFICANDO PUERTOS:');
  
  const ports = [3000, 3001];
  
  ports.forEach(port => {
    const server = createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });
    
    server.listen(port, 'localhost', () => {
      console.log(`   Puerto ${port}: ✅ LIBRE`);
      server.close();
    });
    
    server.on('error', () => {
      console.log(`   Puerto ${port}: ⚠️  EN USO`);
    });
  });
}

// Función principal
function main() {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA\n');
  
  // Verificar configuraciones
  checkGoogleDriveConfig();
  checkSupabaseConfig();
  checkAPIKeys();
  checkPorts();
  
  console.log('\n📋 RECOMENDACIONES:');
  console.log('1. Si Google Drive está en modo production, reinicia la aplicación');
  console.log('2. Configura API keys reales para Brevo y Groq');
  console.log('3. Verifica que no haya procesos duplicados');
  console.log('4. Prueba la autenticación de Google Drive');
  
  console.log('\n✅ VERIFICACIÓN COMPLETADA');
}

// Ejecutar verificación
main();