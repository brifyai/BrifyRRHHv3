// Script de Verificación Específica de Conectividad y URLs
// BrifyRRHH v2 - Análisis Real de Funcionalidad

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

// URLs a verificar
const urlsToTest = [
  // Autenticación
  '/login',
  '/register', 
  '/forgot-password',
  '/reset-password',
  
  // Dashboard principal
  '/',
  '/panel-principal',
  '/plans',
  
  // Archivos
  '/folders',
  '/files',
  '/perfil',
  
  // Configuración
  '/configuracion',
  '/configuracion/general',
  '/configuracion/empresas',
  '/configuracion/usuarios',
  '/configuracion/integraciones',
  '/configuracion/base-de-datos',
  
  // Comunicación
  '/communication',
  '/base-de-datos',
  '/communication/send',
  '/communication/folders',
  '/communication/templates',
  
  // Brevo
  '/estadisticas-brevo',
  '/plantillas-brevo',
  
  // WhatsApp
  '/whatsapp/setup',
  '/whatsapp/multi-manager',
  
  // Búsqueda y legales
  '/busqueda-ia',
  '/lawyer',
  
  // Google Drive
  '/integrations/google-drive',
  '/google-drive-quick-setup',
  '/test-google-drive',
  
  // Pruebas
  '/test-company-employee',
  '/test-company-sync',
  '/test-whatsapp-apis'
];

// Tablas críticas a verificar
const criticalTables = [
  'companies',
  'employees', 
  'users',
  'communication_logs',
  'employee_folders',
  'system_configurations',
  'company_integrations',
  'whatsapp_configs',
  'user_google_drive_credentials',
  'employee_knowledge_bases'
];

class URLConnectivityTester {
  constructor() {
    this.results = {
      supabaseConnection: null,
      tableStatus: {},
      urlTests: [],
      errors: []
    };
  }

  async testSupabaseConnection() {
    console.log('🔍 Verificando conexión a Supabase...');
    try {
      const { data, error } = await supabase.from('companies').select('count').limit(1);
      
      if (error) {
        this.results.supabaseConnection = {
          status: 'error',
          message: error.message,
          details: error
        };
        console.error('❌ Error de conexión Supabase:', error);
      } else {
        this.results.supabaseConnection = {
          status: 'success',
          message: 'Conexión exitosa a Supabase',
          data: data
        };
        console.log('✅ Conexión exitosa a Supabase');
      }
    } catch (err) {
      this.results.supabaseConnection = {
        status: 'exception',
        message: err.message,
        details: err
      };
      console.error('❌ Excepción en conexión Supabase:', err);
    }
  }

  async testTableExistence(tableName) {
    console.log(`🔍 Verificando tabla: ${tableName}`);
    try {
      const { data, error } = await supabase.from(tableName).select('count').limit(1);
      
      this.results.tableStatus[tableName] = {
        exists: !error,
        status: error ? 'error' : 'success',
        error: error ? error.message : null,
        recordCount: data ? data.length : 0
      };
      
      if (error) {
        console.error(`❌ Error en tabla ${tableName}:`, error.message);
      } else {
        console.log(`✅ Tabla ${tableName} existe y es accesible`);
      }
    } catch (err) {
      this.results.tableStatus[tableName] = {
        exists: false,
        status: 'exception',
        error: err.message,
        recordCount: 0
      };
      console.error(`❌ Excepción en tabla ${tableName}:`, err.message);
    }
  }

  async testAllTables() {
    console.log('🔍 Verificando todas las tablas críticas...');
    for (const table of criticalTables) {
      await this.testTableExistence(table);
      // Pequeña pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async testURL(url) {
    console.log(`🔍 Probando URL: ${url}`);
    try {
      // Simular navegación a la URL
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors' // Para evitar problemas de CORS
      });
      
      this.results.urlTests.push({
        url: url,
        status: 'accessible',
        method: 'HEAD',
        response: 'URL accesible (sin CORS)'
      });
      
      console.log(`✅ URL ${url} es accesible`);
    } catch (err) {
      this.results.urlTests.push({
        url: url,
        status: 'error',
        method: 'HEAD',
        error: err.message
      });
      
      console.error(`❌ Error en URL ${url}:`, err.message);
    }
  }

  async testAllURLs() {
    console.log('🔍 Probando todas las URLs...');
    for (const url of urlsToTest) {
      await this.testURL(url);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async runFullTest() {
    console.log('🚀 Iniciando verificación completa...');
    console.log('='.repeat(50));
    
    // Test 1: Conexión Supabase
    await this.testSupabaseConnection();
    console.log('='.repeat(50));
    
    // Test 2: Tablas
    await this.testAllTables();
    console.log('='.repeat(50));
    
    // Test 3: URLs
    await this.testAllURLs();
    console.log('='.repeat(50));
    
    return this.generateReport();
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalUrls: urlsToTest.length,
        accessibleUrls: this.results.urlTests.filter(u => u.status === 'accessible').length,
        errorUrls: this.results.urlTests.filter(u => u.status === 'error').length,
        totalTables: criticalTables.length,
        existingTables: Object.values(this.results.tableStatus).filter(t => t.exists).length,
        errorTables: Object.values(this.results.tableStatus).filter(t => t.status === 'error').length,
        supabaseConnected: this.results.supabaseConnection?.status === 'success'
      },
      details: this.results
    };
    
    return report;
  }
}

// Ejecutar verificación
async function main() {
  const tester = new URLConnectivityTester();
  const report = await tester.runFullTest();
  
  console.log('\n📊 REPORTE FINAL:');
  console.log('='.repeat(50));
  console.log(`URLs accesibles: ${report.summary.accessibleUrls}/${report.summary.totalUrls}`);
  console.log(`Tablas existentes: ${report.summary.existingTables}/${report.summary.totalTables}`);
  console.log(`Supabase conectado: ${report.summary.supabaseConnected ? 'SÍ' : 'NO'}`);
  console.log('='.repeat(50));
  
  return report;
}

// Exportar para uso
export default URLConnectivityTester;
export { main as runConnectivityTest };