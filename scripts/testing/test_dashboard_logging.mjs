/**
 * Script para probar el logging del dashboard y verificar la duplicación de empresas
 */

import databaseEmployeeService from './src/services/databaseEmployeeService.js';
import organizedDatabaseService from './src/services/organizedDatabaseService.js';

console.log('🧪 INICIANDO PRUEBA DE LOGGING DEL DASHBOARD');
console.log('=' .repeat(60));

async function testServices() {
  try {
    console.log('\n1️⃣ Probando organizedDatabaseService.getCompanies()...');
    const companiesFromOrganized = await organizedDatabaseService.getCompanies();
    console.log('Resultado:', {
      cantidad: companiesFromOrganized?.length || 0,
      datos: companiesFromOrganized
    });

    console.log('\n2️⃣ Probando databaseEmployeeService.getCompanies()...');
    const companiesFromDatabase = await databaseEmployeeService.getCompanies();
    console.log('Resultado:', {
      cantidad: companiesFromDatabase?.length || 0,
      datos: companiesFromDatabase
    });

    console.log('\n3️⃣ Comparando resultados...');
    console.log('organizedDatabaseService:', companiesFromOrganized?.length || 0, 'empresas');
    console.log('databaseEmployeeService:', companiesFromDatabase?.length || 0, 'empresas');
    
    if (companiesFromOrganized && companiesFromDatabase) {
      const organizedIds = companiesFromOrganized.map(c => c.id);
      const databaseIds = companiesFromDatabase.map(c => c.id);
      
      console.log('IDs organizedDatabase:', organizedIds);
      console.log('IDs databaseEmployee:', databaseIds);
      
      const hasDuplicates = organizedIds.length !== new Set(organizedIds).size;
      console.log('¿Hay duplicados en organizedDatabase?', hasDuplicates);
      
      if (hasDuplicates) {
        console.warn('⚠️ DETECTADA DUPLICACIÓN EN organizedDatabaseService');
        const duplicates = organizedIds.filter((id, index) => organizedIds.indexOf(id) !== index);
        console.warn('IDs duplicados:', [...new Set(duplicates)]);
      }
    }

    console.log('\n4️⃣ Probando getDashboardStats()...');
    const dashboardStats = await databaseEmployeeService.getDashboardStats();
    console.log('Dashboard Stats:', dashboardStats);

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testServices().then(() => {
  console.log('\n✅ PRUEBA COMPLETADA');
  console.log('Revisa la consola del navegador en http://localhost:3000/base-de-datos');
  console.log('para ver los logs detallados del dashboard.');
});