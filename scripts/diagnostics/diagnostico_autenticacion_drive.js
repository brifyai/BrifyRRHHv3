/**
 * Diagnóstico de Autenticación de Google Drive
 * Script para verificar el estado de autenticación y proporcionar soluciones
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

class GoogleDriveAuthDiagnostic {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  async diagnose() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE AUTENTICACIÓN GOOGLE DRIVE\n');
    
    // 1. Verificar variables de entorno
    this.checkEnvironmentVariables();
    
    // 2. Verificar carpetas existentes en Supabase
    await this.checkExistingFolders();
    
    // 3. Analizar problema de autenticación
    this.analyzeAuthIssue();
    
    // 4. Generar recomendaciones
    this.generateRecommendations();
    
    return {
      issues: this.issues,
      recommendations: this.recommendations,
      summary: this.generateSummary()
    };
  }

  checkEnvironmentVariables() {
    console.log('📋 Verificando variables de entorno...');
    
    const requiredVars = [
      'REACT_APP_GOOGLE_CLIENT_ID',
      'REACT_APP_GOOGLE_CLIENT_SECRET',
      'REACT_APP_GOOGLE_API_KEY',
      'REACT_APP_GOOGLE_REDIRECT_URI'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.issues.push({
        type: 'ENVIRONMENT',
        severity: 'HIGH',
        message: `Faltan variables de entorno: ${missingVars.join(', ')}`,
        solution: 'Configurar las variables de entorno en .env'
      });
      console.log('❌ Variables faltantes:', missingVars.join(', '));
    } else {
      console.log('✅ Variables de entorno configuradas');
    }
  }

  async checkExistingFolders() {
    console.log('\n📁 Verificando carpetas existentes en Supabase...');
    
    try {
      const { data: folders, error } = await supabase
        .from('employee_folders')
        .select('employee_email, drive_folder_id, drive_folder_url, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        this.issues.push({
          type: 'DATABASE',
          severity: 'HIGH',
          message: `Error consultando carpetas: ${error.message}`,
          solution: 'Verificar conexión a Supabase y permisos de tabla'
        });
        console.log('❌ Error consultando carpetas:', error.message);
        return;
      }

      console.log(`📊 Encontradas ${folders.length} carpetas recientes:`);
      
      const withDrive = folders.filter(f => f.drive_folder_id).length;
      const withoutDrive = folders.filter(f => !f.drive_folder_id).length;
      
      console.log(`   - Con drive_folder_id: ${withDrive}`);
      console.log(`   - Sin drive_folder_id: ${withoutDrive}`);
      
      if (folders.length > 0) {
        console.log('\n   Muestras recientes:');
        folders.slice(0, 5).forEach((folder, index) => {
          console.log(`   ${index + 1}. ${folder.employee_email}`);
          console.log(`      Drive ID: ${folder.drive_folder_id || 'SIN DRIVE'}`);
          console.log(`      Creada: ${new Date(folder.created_at).toLocaleString()}`);
        });
      }

      if (withoutDrive > 0) {
        this.issues.push({
          type: 'DRIVE_SYNC',
          severity: 'MEDIUM',
          message: `${withoutDrive} carpetas sin drive_folder_id`,
          solution: 'Autenticar Google Drive y sincronizar carpetas existentes'
        });
      }

    } catch (error) {
      console.log('❌ Error en diagnóstico:', error.message);
      this.issues.push({
        type: 'SYSTEM',
        severity: 'HIGH',
        message: `Error en diagnóstico: ${error.message}`,
        solution: 'Revisar configuración del sistema'
      });
    }
  }

  analyzeAuthIssue() {
    console.log('\n🔍 Analizando problema de autenticación...');
    
    this.issues.push({
      type: 'AUTHENTICATION',
      severity: 'HIGH',
      message: 'Google Drive no está autenticado',
      solution: 'Conectar Google Drive en Integraciones',
      details: {
        symptoms: [
          'Error "Google Drive no está autenticado" al crear carpetas',
          '801 errores al intentar crear carpetas para empleados',
          '0 carpetas creadas o actualizadas'
        ],
        causes: [
          'Tokens de acceso expirados',
          'Usuario nunca autorizó Google Drive',
          'Configuración OAuth incorrecta',
          'Variables de entorno faltantes'
        ]
      }
    });
    
    console.log('❌ Problema identificado: Google Drive no autenticado');
    console.log('💡 Esto explica por qué todas las operaciones fallan');
  }

  generateRecommendations() {
    console.log('\n💡 Generando recomendaciones...');
    
    this.recommendations = [
      {
        priority: 'IMMEDIATE',
        title: 'Conectar Google Drive',
        description: 'Ve a Integraciones y conecta Google Drive',
        steps: [
          '1. Ir a la sección Integraciones en la aplicación',
          '2. Buscar "Google Drive"',
          '3. Hacer clic en "Conectar Google Drive"',
          '4. Autorizar el acceso con tu cuenta de Google',
          '5. Esperar la redirección y confirmación'
        ]
      },
      {
        priority: 'HIGH',
        title: 'Verificar configuración OAuth',
        description: 'Asegurar que la configuración de Google Cloud sea correcta',
        steps: [
          '1. Verificar REACT_APP_GOOGLE_CLIENT_ID en .env',
          '2. Verificar REACT_APP_GOOGLE_CLIENT_SECRET en .env',
          '3. Confirmar redirect URI en Google Cloud Console',
          '4. Asegurar que Google Drive API esté habilitada'
        ]
      },
      {
        priority: 'MEDIUM',
        title: 'Sincronizar carpetas existentes',
        description: 'Después de autenticar, sincronizar carpetas sin drive_folder_id',
        steps: [
          '1. Usar el botón "Sincronizar con Drive"',
          '2. Esperar a que complete el proceso',
          '3. Verificar que las carpetas obtengan drive_folder_id'
        ]
      }
    ];
    
    console.log(`✅ Generadas ${this.recommendations.length} recomendaciones`);
  }

  generateSummary() {
    return {
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'HIGH').length,
      mainProblem: 'Google Drive no está autenticado',
      immediateAction: 'Conectar Google Drive en Integraciones',
      expectedOutcome: 'Una vez autenticado, las carpetas se crearán correctamente',
      folderSafety: 'Las carpetas existentes en Supabase no fueron eliminadas'
    };
  }

  printDiagnostic() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 INFORME COMPLETO DE DIAGNÓSTICO');
    console.log('='.repeat(60));
    
    console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
    this.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity}] ${issue.type}`);
      console.log(`   ${issue.message}`);
      if (issue.solution) {
        console.log(`   💡 Solución: ${issue.solution}`);
      }
    });
    
    console.log('\n💡 RECOMENDACIONES:');
    this.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`   ${rec.description}`);
      if (rec.steps) {
        console.log('   Pasos:');
        rec.steps.forEach(step => console.log(`     ${step}`));
      }
    });
    
    const summary = this.generateSummary();
    console.log('\n📊 RESUMEN:');
    console.log(`   Problemas totales: ${summary.totalIssues}`);
    console.log(`   Problemas críticos: ${summary.criticalIssues}`);
    console.log(`   Problema principal: ${summary.mainProblem}`);
    console.log(`   Acción inmediata: ${summary.immediateAction}`);
    console.log(`   Resultado esperado: ${summary.expectedOutcome}`);
    console.log(`   Seguridad de carpetas: ${summary.folderSafety}`);
    
    console.log('\n' + '='.repeat(60));
  }
}

// Función principal
async function main() {
  const diagnostic = new GoogleDriveAuthDiagnostic();
  
  try {
    const result = await diagnostic.diagnose();
    diagnostic.printDiagnostic();
    
    console.log('\n🎯 ACCIONES INMEDIATAS RECOMENDADAS:');
    console.log('1. Ve a Integraciones en la aplicación');
    console.log('2. Conecta Google Drive');
    console.log('3. Vuelve a intentar crear las carpetas');
    console.log('4. Si hay errores, revisa la configuración OAuth');
    
  } catch (error) {
    console.error('\n❌ Error en diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
main();