import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔍 DEBUG: Verificando retorno de trendsAnalysisService');
console.log('=====================================================\n');

async function debugServiceReturn() {
  try {
    // Importar el servicio real
    const trendsAnalysisService = await import('./src/services/trendsAnalysisService.js');
    const service = trendsAnalysisService.default;
    
    // PASO 1: Llamar al método exacto que usa el componente
    const companyId = 'e2bb6325-b623-44f8-87a6-dc65f5347bd8';
    console.log('1. 📞 LLAMANDO A trendsAnalysisService.generateCompanyInsights:');
    console.log(`   Parámetros: companyId='${companyId}', forceRegenerate=false, isId=true`);
    
    const result = await service.generateCompanyInsights(companyId, false, true);
    
    console.log('\n2. 📤 RESULTADO RETORNADO:');
    console.log(JSON.stringify(result, null, 2));
    
    // PASO 2: Verificar la estructura del resultado
    console.log('\n3. 🔍 VERIFICANDO ESTRUCTURA:');
    console.log(`   - ¿Tiene employeeData? ${result.employeeData ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Tiene communicationMetrics? ${result.communicationMetrics ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Tiene frontInsights? ${result.frontInsights ? 'SÍ' : 'NO'}`);
    console.log(`   - ¿Tiene backInsights? ${result.backInsights ? 'SÍ' : 'NO'}`);
    
    if (result.employeeData) {
      console.log(`   - employeeData.totalEmployees: ${result.employeeData.totalEmployees}`);
    } else {
      console.log(`   ❌ employeeData está undefined o null`);
    }
    
    if (result.communicationMetrics) {
      console.log(`   - communicationMetrics.totalMessages: ${result.communicationMetrics.totalMessages}`);
    } else {
      console.log(`   ❌ communicationMetrics está undefined o null`);
    }
    
    // PASO 3: Verificar si el servicio está usando el fallback
    console.log('\n4. 🤔 ¿ESTÁ USANDO FALLBACK?');
    if (result.frontInsights && result.frontInsights.length > 0) {
      const firstInsight = result.frontInsights[0];
      if (firstInsight.title.includes('Sin Datos') || firstInsight.title.includes('Sistema Listo')) {
        console.log(`   ⚠️ SÍ, está usando fallback insights (no datos reales)`);
        console.log(`   Título: "${firstInsight.title}"`);
      } else {
        console.log(`   ✅ NO, está usando insights generados con datos reales`);
      }
    }
    
    // PASO 4: Verificar si hay error en el servicio
    console.log('\n5. 🔍 REVISANDO MÉTODO generateCompanyInsights:');
    console.log(`   El método debería:`);
    console.log(`   1. Buscar empresa por ID ✓`);
    console.log(`   2. Llamar getCommunicationMetrics() ✓`);
    console.log(`   3. Llamar getEmployeeData() ✓`);
    console.log(`   4. Llamar generateInsightsWithAI() ✓`);
    console.log(`   5. Retornar objeto con employeeData y communicationMetrics`);
    
    // PASO 5: Probar los métodos individuales
    console.log('\n6. 🔬 PROBANDO MÉTODOS INDIVIDUALES:');
    
    // Probar getCommunicationMetrics directamente
    console.log('   Probando getCommunicationMetrics...');
    const commMetrics = await service.getCommunicationMetrics(companyId);
    console.log(`   ✅ Resultado: ${JSON.stringify(commMetrics, null, 2)}`);
    
    // Probar getEmployeeData directamente
    console.log('\n   Probando getEmployeeData...');
    const empData = await service.getEmployeeData(companyId);
    console.log(`   ✅ Resultado: ${JSON.stringify(empData, null, 2)}`);
    
    // PASO 6: Conclusión
    console.log('\n7. 📊 CONCLUSIÓN:');
    if (!result.employeeData || !result.communicationMetrics) {
      console.log(`   ❌ EL SERVICIO NO ESTÁ RETORNANDO LA ESTRUCTURA CORRECTA`);
      console.log(`   El componente espera: { employeeData: {...}, communicationMetrics: {...} }`);
      console.log(`   El servicio retorna:`, Object.keys(result));
      console.log(`   \n   POSIBLES CAUSAS:`);
      console.log(`   1. Error en generateInsightsWithAI() que hace que salte al catch`);
      console.log(`   2. El método retorna solo insights, sin employeeData y communicationMetrics`);
      console.log(`   3. Falta incluir estos datos en el objeto retornado`);
    } else {
      console.log(`   ✅ El servicio retorna la estructura correcta`);
      console.log(`   El problema está en cómo el componente maneja el estado`);
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugServiceReturn();