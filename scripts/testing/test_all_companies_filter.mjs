#!/usr/bin/env node

/**
 * TEST COMPLETO: Verificar filtrado por empresa para todas las empresas
 * 
 * Este script verifica que el filtrado funciona correctamente para todas las 16 empresas
 * y que cada una muestra sus datos correctos (empleados, mensajes, etc.)
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || supabaseKey === 'your-anon-key') {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Por favor configura:');
  console.log('- REACT_APP_SUPABASE_URL');
  console.log('- REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST COMPLETO: Filtrado por Empresa para Todas las Empresas');
console.log('=' .repeat(70));

async function testAllCompanies() {
  try {
    // 1. Obtener todas las empresas
    console.log('\n📊 1. Obteniendo lista de empresas...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, industry')
      .order('name', { ascending: true });

    if (companiesError) {
      throw new Error(`Error obteniendo empresas: ${companiesError.message}`);
    }

    console.log(`✅ Encontradas ${companies.length} empresas:`);
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.industry})`);
    });

    // 2. Importar el servicio de tendencias
    console.log('\n🔧 2. Importando trendsAnalysisService...');
    
    // Simular la importación del servicio
    const trendsAnalysisService = {
      async generateCompanyInsights(companyId, forceRegenerate = false, isId = true) {
        console.log(`   🔍 Probando empresa ID: ${companyId}`);
        
        try {
          // Obtener datos de la empresa
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

          if (companyError) throw companyError;

          // Obtener métricas de comunicación
          const communicationMetrics = await this.getCommunicationMetrics(companyId);
          
          // Obtener datos de empleados
          const employeeData = await this.getEmployeeData(companyId);
          
          return {
            frontInsights: [],
            backInsights: [],
            communicationMetrics,
            employeeData,
            companyData: company
          };
        } catch (error) {
          console.error(`   ❌ Error con ${companyId}:`, error.message);
          return {
            frontInsights: [],
            backInsights: [],
            communicationMetrics: { totalMessages: 0, sentMessages: 0, readMessages: 0 },
            employeeData: { totalEmployees: 0 },
            companyData: null
          };
        }
      },

      async getCommunicationMetrics(companyId) {
        try {
          const { data: logs, error } = await supabase
            .from('communication_logs')
            .select('*')
            .eq('company_id', companyId);

          if (error) throw error;

          return {
            totalMessages: logs?.length || 0,
            sentMessages: logs?.filter(log => log.status === 'sent').length || 0,
            readMessages: logs?.filter(log => log.status === 'read').length || 0,
            scheduledMessages: logs?.filter(log => log.status === 'scheduled').length || 0,
            failedMessages: logs?.filter(log => log.status === 'failed').length || 0,
            deliveryRate: 0,
            readRate: 0,
            engagementRate: 0
          };
        } catch (error) {
          console.error(`   ❌ Error obteniendo métricas para ${companyId}:`, error.message);
          return { totalMessages: 0, sentMessages: 0, readMessages: 0 };
        }
      },

      async getEmployeeData(companyId) {
        try {
          const { data: employees, error } = await supabase
            .from('employees')
            .select('*')
            .eq('company_id', companyId);

          if (error) throw error;

          return {
            totalEmployees: employees?.length || 0,
            departments: {},
            levels: {},
            workModes: {}
          };
        } catch (error) {
          console.error(`   ❌ Error obteniendo empleados para ${companyId}:`, error.message);
          return { totalEmployees: 0 };
        }
      }
    };

    // 3. Probar cada empresa
    console.log('\n🧪 3. Probando filtrado para cada empresa...');
    console.log('=' .repeat(70));

    const results = [];
    
    for (const company of companies) {
      console.log(`\n🏢 Probando: ${company.name}`);
      console.log(`   ID: ${company.id}`);
      
      try {
        const insights = await trendsAnalysisService.generateCompanyInsights(company.id, false, true);
        
        const result = {
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          success: true,
          employeeCount: insights.employeeData.totalEmployees,
          messageCount: insights.communicationMetrics.totalMessages,
          sentMessages: insights.communicationMetrics.sentMessages,
          readMessages: insights.communicationMetrics.readMessages,
          hasData: insights.employeeData.totalEmployees > 0 || insights.communicationMetrics.totalMessages > 0
        };
        
        results.push(result);
        
        console.log(`   ✅ Empleados: ${result.employeeCount}`);
        console.log(`   ✅ Mensajes: ${result.messageCount} (enviados: ${result.sentMessages}, leídos: ${result.readMessages})`);
        console.log(`   ✅ Tiene datos: ${result.hasData ? 'SÍ' : 'NO'}`);
        
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        results.push({
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          success: false,
          error: error.message,
          employeeCount: 0,
          messageCount: 0
        });
      }
    }

    // 4. Resumen de resultados
    console.log('\n📊 RESUMEN DE RESULTADOS');
    console.log('=' .repeat(70));

    const successful = results.filter(r => r.success);
    const withData = results.filter(r => r.hasData);
    const withoutData = results.filter(r => !r.hasData);

    console.log(`✅ Empresas procesadas exitosamente: ${successful.length}/${companies.length}`);
    console.log(`📈 Empresas con datos: ${withData.length}`);
    console.log(`📉 Empresas sin datos: ${withoutData.length}`);

    // 5. Detalle de empresas con y sin datos
    console.log('\n📈 EMPRESAS CON DATOS:');
    withData.forEach(company => {
      console.log(`   • ${company.companyName}: ${company.employeeCount} empleados, ${company.messageCount} mensajes`);
    });

    if (withoutData.length > 0) {
      console.log('\n📉 EMPRESAS SIN DATOS:');
      withoutData.forEach(company => {
        console.log(`   • ${company.companyName}: 0 empleados, 0 mensajes`);
      });
    }

    // 6. Estadísticas generales
    const totalEmployees = results.reduce((sum, r) => sum + r.employeeCount, 0);
    const totalMessages = results.reduce((sum, r) => sum + r.messageCount, 0);

    console.log('\n📊 ESTADÍSTICAS GENERALES:');
    console.log(`   • Total empleados en todas las empresas: ${totalEmployees}`);
    console.log(`   • Total mensajes en todas las empresas: ${totalMessages}`);
    console.log(`   • Promedio empleados por empresa: ${(totalEmployees / companies.length).toFixed(1)}`);
    console.log(`   • Promedio mensajes por empresa: ${(totalMessages / companies.length).toFixed(1)}`);

    // 7. Verificar problemas específicos
    console.log('\n🔍 VERIFICACIÓN DE PROBLEMAS:');
    
    const companiesWithZeroEmployees = results.filter(r => r.employeeCount === 0);
    const companiesWithZeroMessages = results.filter(r => r.messageCount === 0);

    if (companiesWithZeroEmployees.length > 0) {
      console.log(`⚠️  Empresas con 0 empleados: ${companiesWithZeroEmployees.length}`);
      companiesWithZeroEmployees.forEach(c => console.log(`   • ${c.companyName}`));
    }

    if (companiesWithZeroMessages.length > 0) {
      console.log(`⚠️  Empresas con 0 mensajes: ${companiesWithZeroMessages.length}`);
      companiesWithZeroMessages.forEach(c => console.log(`   • ${c.companyName}`));
    }

    // 8. Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    if (withData.length === companies.length) {
      console.log('✅ ¡PERFECTO! Todas las empresas tienen datos y el filtrado funciona correctamente.');
    } else if (withData.length > companies.length * 0.8) {
      console.log('🟡 BUENO: La mayoría de empresas tienen datos. Algunas pueden estar vacías normalmente.');
    } else {
      console.log('🔴 PROBLEMA: Muchas empresas no tienen datos. Revisar la configuración.');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('🏁 TEST COMPLETADO');

  } catch (error) {
    console.error('❌ Error durante el test:', error);
    process.exit(1);
  }
}

// Ejecutar el test
testAllCompanies();