// Verificación Específica de Conectividad Real
// Usando los servicios existentes de la aplicación

import organizedDatabaseService from './src/services/organizedDatabaseService.js';
import companySyncService from './src/services/companySyncService.js';
import configurationService from './src/services/configurationService.js';

class RealConnectivityChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {}
    };
  }

  async testDatabaseService() {
    console.log('🔍 Probando organizedDatabaseService...');
    try {
      const companies = await organizedDatabaseService.getCompanies();
      this.results.tests.push({
        service: 'organizedDatabaseService.getCompanies',
        status: 'success',
        data: companies,
        recordCount: companies?.length || 0
      });
      console.log(`✅ organizedDatabaseService: ${companies?.length || 0} empresas`);
    } catch (error) {
      this.results.tests.push({
        service: 'organizedDatabaseService.getCompanies',
        status: 'error',
        error: error.message
      });
      console.error(`❌ organizedDatabaseService error:`, error.message);
    }
  }

  async testCompanySyncService() {
    console.log('🔍 Probando companySyncService...');
    try {
      const companies = await companySyncService.getCompanies();
      this.results.tests.push({
        service: 'companySyncService.getCompanies',
        status: 'success',
        data: companies,
        recordCount: companies?.length || 0
      });
      console.log(`✅ companySyncService: ${companies?.length || 0} empresas`);
    } catch (error) {
      this.results.tests.push({
        service: 'companySyncService.getCompanies',
        status: 'error',
        error: error.message
      });
      console.error(`❌ companySyncService error:`, error.message);
    }
  }

  async testConfigurationService() {
    console.log('🔍 Probando configurationService...');
    try {
      const config = await configurationService.getConfig('general', 'language', 'global', null, 'es');
      this.results.tests.push({
        service: 'configurationService.getConfig',
        status: 'success',
        data: config,
        value: config
      });
      console.log(`✅ configurationService: ${config}`);
    } catch (error) {
      this.results.tests.push({
        service: 'configurationService.getConfig',
        status: 'error',
        error: error.message
      });
      console.error(`❌ configurationService error:`, error.message);
    }
  }

  async testEmployees() {
    console.log('🔍 Probando employees...');
    try {
      const employees = await organizedDatabaseService.getEmployees();
      this.results.tests.push({
        service: 'organizedDatabaseService.getEmployees',
        status: 'success',
        data: employees,
        recordCount: employees?.length || 0
      });
      console.log(`✅ Employees: ${employees?.length || 0} empleados`);
    } catch (error) {
      this.results.tests.push({
        service: 'organizedDatabaseService.getEmployees',
        status: 'error',
        error: error.message
      });
      console.error(`❌ Employees error:`, error.message);
    }
  }

  async testCommunicationLogs() {
    console.log('🔍 Probando communication_logs...');
    try {
      const logs = await organizedDatabaseService.getCommunicationLogs();
      this.results.tests.push({
        service: 'organizedDatabaseService.getCommunicationLogs',
        status: 'success',
        data: logs,
        recordCount: logs?.length || 0
      });
      console.log(`✅ Communication logs: ${logs?.length || 0} registros`);
    } catch (error) {
      this.results.tests.push({
        service: 'organizedDatabaseService.getCommunicationLogs',
        status: 'error',
        error: error.message
      });
      console.error(`❌ Communication logs error:`, error.message);
    }
  }

  async testFolders() {
    console.log('🔍 Probando folders...');
    try {
      const folders = await organizedDatabaseService.getFolders();
      this.results.tests.push({
        service: 'organizedDatabaseService.getFolders',
        status: 'success',
        data: folders,
        recordCount: folders?.length || 0
      });
      console.log(`✅ Folders: ${folders?.length || 0} carpetas`);
    } catch (error) {
      this.results.tests.push({
        service: 'organizedDatabaseService.getFolders',
        status: 'error',
        error: error.message
      });
      console.error(`❌ Folders error:`, error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando verificación real de conectividad...');
    console.log('='.repeat(60));

    await this.testDatabaseService();
    await this.testCompanySyncService();
    await this.testConfigurationService();
    await this.testEmployees();
    await this.testCommunicationLogs();
    await this.testFolders();

    this.generateSummary();
    return this.results;
  }

  generateSummary() {
    const successfulTests = this.results.tests.filter(t => t.status === 'success');
    const errorTests = this.results.tests.filter(t => t.status === 'error');

    this.results.summary = {
      totalTests: this.results.tests.length,
      successfulTests: successfulTests.length,
      errorTests: errorTests.length,
      successRate: `${Math.round((successfulTests.length / this.results.tests.length) * 100)}%`,
      connectivityStatus: errorTests.length === 0 ? 'EXCELLENT' : 
                         errorTests.length <= 2 ? 'GOOD' : 'POOR'
    };

    console.log('\n📊 RESUMEN DE CONECTIVIDAD:');
    console.log('='.repeat(60));
    console.log(`Tests exitosos: ${successfulTests.length}/${this.results.tests.length}`);
    console.log(`Tests con error: ${errorTests.length}/${this.results.tests.length}`);
    console.log(`Tasa de éxito: ${this.results.summary.successRate}`);
    console.log(`Estado de conectividad: ${this.results.summary.connectivityStatus}`);
    console.log('='.repeat(60));

    if (errorTests.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      errorTests.forEach(test => {
        console.log(`- ${test.service}: ${test.error}`);
      });
    }

    if (successfulTests.length > 0) {
      console.log('\n✅ SERVICIOS FUNCIONANDO:');
      successfulTests.forEach(test => {
        const recordInfo = test.recordCount !== undefined ? ` (${test.recordCount} registros)` : '';
        console.log(`- ${test.service}${recordInfo}`);
      });
    }
  }
}

// Ejecutar verificación
async function main() {
  const checker = new RealConnectivityChecker();
  const results = await checker.runAllTests();
  
  // Guardar resultados en archivo
  const fs = require('fs');
  fs.writeFileSync('connectivity_test_results.json', JSON.stringify(results, null, 2));
  
  console.log('\n💾 Resultados guardados en: connectivity_test_results.json');
  return results;
}

// Solo ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default RealConnectivityChecker;