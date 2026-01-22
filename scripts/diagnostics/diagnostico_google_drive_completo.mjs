#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DE GOOGLE DRIVE
 * 
 * Este script analiza:
 * 1. Estado actual de las implementaciones de Google Drive
 * 2. Configuración de credenciales
 * 3. Estado de las carpetas en Supabase
 * 4. Problemas de sincronización identificados
 * 5. Recomendaciones basadas en documentación oficial
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticarGoogleDrive() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE GOOGLE DRIVE');
  console.log('=' .repeat(60));
  
  try {
    // 1. VERIFICAR CARPETAS CON GOOGLE DRIVE
    console.log('\n📁 1. VERIFICANDO CARPETAS CON GOOGLE DRIVE...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('id, employee_email, employee_name, company_name, drive_folder_id, drive_folder_url, created_at')
      .order('created_at', { ascending: false });

    if (foldersError) {
      console.error('❌ Error consultando carpetas:', foldersError);
      return;
    }

    console.log(`✅ Total de carpetas encontradas: ${folders?.length || 0}`);
    
    if (folders && folders.length > 0) {
      // Analizar URLs de Drive
      const carpetasConDrive = folders.filter(f => f.drive_folder_id && f.drive_folder_url);
      console.log(`🔗 Carpetas con Drive configurado: ${carpetasConDrive.length}/${folders.length}`);
      
      // Analizar tipos de URLs
      const tiposUrl = {};
      carpetasConDrive.forEach(folder => {
        const url = folder.drive_folder_url || '';
        if (url.includes('local_')) {
          tiposUrl.local = (tiposUrl.local || 0) + 1;
        } else if (url.includes('drive.google.com')) {
          tiposUrl.google = (tiposUrl.google || 0) + 1;
        } else {
          tiposUrl.otros = (tiposUrl.otros || 0) + 1;
        }
      });
      
      console.log('\n📊 ANÁLISIS DE URLs:');
      Object.entries(tiposUrl).forEach(([tipo, cantidad]) => {
        console.log(`   ${tipo}: ${cantidad} carpetas`);
      });
      
      // Mostrar ejemplos
      console.log('\n📋 EJEMPLOS DE URLs (primeras 10):');
      carpetasConDrive.slice(0, 10).forEach((folder, index) => {
        console.log(`   ${index + 1}. ${folder.employee_email}`);
        console.log(`      URL: ${folder.drive_folder_url}`);
        console.log(`      ID: ${folder.drive_folder_id}`);
      });
    }

    // 2. VERIFICAR CREDENCIALES DE USUARIOS
    console.log('\n🔐 2. VERIFICANDO CREDENCIALES DE GOOGLE DRIVE...');
    const { data: credentials, error: credError } = await supabase
      .from('user_google_drive_credentials')
      .select('user_id, is_connected, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (credError) {
      console.warn('⚠️ Error consultando credenciales:', credError);
    } else {
      console.log(`✅ Credenciales encontradas: ${credentials?.length || 0}`);
      
      if (credentials && credentials.length > 0) {
        const activas = credentials.filter(c => c.is_active && c.is_connected).length;
        console.log(`🔗 Credenciales activas: ${activas}/${credentials.length}`);
        
        console.log('\n📋 CREDENCIALES POR USUARIO:');
        credentials.slice(0, 10).forEach((cred, index) => {
          console.log(`   ${index + 1}. Usuario: ${cred.user_id}`);
          console.log(`      Conectado: ${cred.is_connected ? '✅' : '❌'}`);
          console.log(`      Activo: ${cred.is_active ? '✅' : '❌'}`);
        });
      } else {
        console.log('❌ NO HAY CREDENCIALES GUARDADAS EN SUPABASE');
      }
    }

    // 3. VERIFICAR TABLA DE CONFIGURACIÓN
    console.log('\n⚙️ 3. VERIFICANDO CONFIGURACIÓN...');
    const { data: config, error: configError } = await supabase
      .from('google_drive_config')
      .select('*')
      .limit(5);

    if (configError) {
      console.warn('⚠️ Tabla google_drive_config no existe o error:', configError.message);
    } else {
      console.log(`✅ Configuración encontrada: ${config?.length || 0} registros`);
    }

    // 4. ANÁLISIS DE PROBLEMAS
    console.log('\n🚨 4. ANÁLISIS DE PROBLEMAS IDENTIFICADOS...');
    
    const problemas = [];
    
    // Problema 1: URLs locales
    const urlsLocales = folders?.filter(f => f.drive_folder_url?.includes('local_')).length || 0;
    if (urlsLocales > 0) {
      problemas.push({
        tipo: 'URLS_LOCALES',
        descripcion: `${urlsLocales} carpetas tienen URLs locales (no son reales de Google Drive)`,
        severidad: 'ALTA',
        solucion: 'Necesitan sincronización real con Google Drive API'
      });
    }
    
    // Problema 2: Sin credenciales
    if (!credentials || credentials.length === 0) {
      problemas.push({
        tipo: 'SIN_CREDENCIALES',
        descripcion: 'No hay credenciales de Google Drive guardadas en Supabase',
        severidad: 'CRÍTICA',
        solucion: 'Los usuarios deben conectar Google Drive en Integraciones'
      });
    }
    
    // Problema 3: Credenciales inactivas
    const credencialesInactivas = credentials?.filter(c => !c.is_active || !c.is_connected).length || 0;
    if (credencialesInactivas > 0) {
      problemas.push({
        tipo: 'CREDENCIALES_INACTIVAS',
        descripcion: `${credencialesInactivas} credenciales están inactivas`,
        severidad: 'MEDIA',
        solucion: 'Reautenticación requerida'
      });
    }
    
    if (problemas.length === 0) {
      console.log('✅ No se identificaron problemas críticos');
    } else {
      console.log(`❌ Se identificaron ${problemas.length} problemas:`);
      problemas.forEach((problema, index) => {
        console.log(`\n   ${index + 1}. ${problema.tipo} (${problema.severidad})`);
        console.log(`      ${problema.descripcion}`);
        console.log(`      💡 Solución: ${problema.solucion}`);
      });
    }

    // 5. RECOMENDACIONES BASADAS EN DOCUMENTACIÓN OFICIAL
    console.log('\n📚 5. RECOMENDACIONES BASADAS EN GOOGLE DRIVE API...');
    console.log('\n🔗 DOCUMENTACIÓN OFICIAL:');
    console.log('   • https://developers.google.com/drive/api/guides/about-sdk');
    console.log('   • https://developers.google.com/drive/api/guides/auth');
    console.log('   • https://developers.google.com/drive/api/guides/manage-folders');
    
    console.log('\n💡 MEJORES PRÁCTICAS RECOMENDADAS:');
    console.log('   1. 🔐 AUTENTICACIÓN:');
    console.log('      • Usar OAuth 2.0 con refresh tokens');
    console.log('      • Validar tokens antes de cada operación');
    console.log('      • Manejar errores 401 (token expirado) automáticamente');
    
    console.log('\n   2. 📁 GESTIÓN DE CARPETAS:');
    console.log('      • Usar Drive API v3 (más reciente)');
    console.log('      • Implementar batch operations para múltiples carpetas');
    console.log('      • Usar fields=* para optimizar requests');
    
    console.log('\n   3. 🔄 SINCRONIZACIÓN:');
    console.log('      • Implementar incremental sync con change tokens');
    console.log('      • Usar watch() para cambios en tiempo real');
    console.log('      • Manejar rate limits con exponential backoff');
    
    console.log('\n   4. 🛡️ SEGURIDAD:');
    console.log('      • Almacenar tokens cifrados en Supabase');
    console.log('      • Usar service accounts para operaciones de servidor');
    console.log('      • Implementar scopes mínimos necesarios');

    // 6. RESUMEN EJECUTIVO
    console.log('\n📊 RESUMEN EJECUTIVO:');
    console.log(`   📁 Total carpetas: ${folders?.length || 0}`);
    console.log(`   🔗 Con Drive configurado: ${carpetasConDrive?.length || 0}`);
    console.log(`   🌐 URLs reales de Google: ${tiposUrl.google || 0}`);
    console.log(`   💾 URLs locales: ${tiposUrl.local || 0}`);
    console.log(`   🔐 Credenciales en Supabase: ${credentials?.length || 0}`);
    console.log(`   ⚠️ Problemas identificados: ${problemas.length}`);
    
    if (problemas.length === 0) {
      console.log('\n🎉 ESTADO: ÓPTIMO - Google Drive funcionando correctamente');
    } else if (problemas.length <= 2) {
      console.log('\n⚠️ ESTADO: ADVERTENCIA - Algunos problemas menores identificados');
    } else {
      console.log('\n❌ ESTADO: CRÍTICO - Múltiples problemas requieren atención');
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnosticarGoogleDrive().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});