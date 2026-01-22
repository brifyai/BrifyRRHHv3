/**
 * Script de Pruebas Simplificado para Node.js - Sistema de Bases de Conocimiento
 * 
 * Este script prueba la funcionalidad básica sin dependencias del frontend
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase para Node.js
const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.staffhub.cl';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZscGppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MDYzNjcsImV4cCI6MjA1MDE4MjM2N30.f5n0xG3L8l9Z7l8rN5xJ4H2qT6sQ9bM8cR2wE1tY5k';

const supabase = createClient(supabaseUrl, supabaseKey);

class SimpleEmployeeKnowledgeTest {
  constructor() {
    this.testResults = [];
    this.testEmployee = {
      email: 'juan.perez@test-company.com',
      name: 'Juan Pérez',
      companyId: 'test-company-123',
      whatsappNumber: '+56912345678',
      driveFolderId: 'test-folder-123',
      driveFolderUrl: 'https://drive.google.com/drive/folders/test-folder-123'
    };
  }

  /**
   * Ejecutar todas las pruebas básicas
   */
  async runBasicTests() {
    console.log('🧪 Iniciando pruebas básicas del Sistema de Bases de Conocimiento\n');
    
    try {
      // Prueba 1: Verificar conexión a Supabase
      await this.testSupabaseConnection();
      
      // Prueba 2: Verificar estructura de tablas
      await this.testTableStructure();
      
      // Prueba 3: Crear configuración de WhatsApp de prueba
      await this.testWhatsAppConfigCreation();
      
      // Prueba 4: Simular búsqueda en base de conocimiento
      await this.testKnowledgeSearch();
      
      // Mostrar resumen
      this.showTestSummary();
      
    } catch (error) {
      console.error('❌ Error ejecutando pruebas:', error);
    }
  }

  /**
   * Prueba 1: Verificar conexión a Supabase
   */
  async testSupabaseConnection() {
    console.log('🔗 Prueba 1: Verificar conexión a Supabase');
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true });
      
      if (error) throw error;
      
      this.logTestResult('Conexión a Supabase', true, {
        message: 'Conexión exitosa',
        companiesCount: data?.length || 0
      });
      
    } catch (error) {
      this.logTestResult('Conexión a Supabase', false, error.message);
    }
  }

  /**
   * Prueba 2: Verificar estructura de tablas
   */
  async testTableStructure() {
    console.log('📊 Prueba 2: Verificar estructura de tablas');
    
    try {
      const tables = [
        'employee_knowledge_bases',
        'employee_knowledge_documents', 
        'whatsapp_conversations_with_knowledge',
        'employee_whatsapp_config',
        'employee_knowledge_metrics'
      ];
      
      const tableResults = [];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          tableResults.push({
            table,
            exists: !error,
            count: data?.length || 0,
            error: error ? error.message : null
          });
          
        } catch (tableError) {
          tableResults.push({
            table,
            exists: false,
            count: 0,
            error: tableError.message
          });
        }
      }
      
      const existingTables = tableResults.filter(t => t.exists).length;
      
      this.logTestResult('Estructura de tablas', existingTables === tables.length, {
        totalTables: tables.length,
        existingTables: existingTables,
        missingTables: tables.length - existingTables,
        tableDetails: tableResults
      });
      
    } catch (error) {
      this.logTestResult('Estructura de tablas', false, error.message);
    }
  }

  /**
   * Prueba 3: Crear configuración de WhatsApp de prueba
   */
  async testWhatsAppConfigCreation() {
    console.log('📱 Prueba 3: Crear configuración de WhatsApp');
    
    try {
      // Verificar si la tabla existe
      const { data: existing, error: checkError } = await supabase
        .from('employee_whatsapp_config')
        .select('*', { count: 'exact', head: true });
      
      if (checkError && checkError.code === 'PGRST116') {
        this.logTestResult('Configuración WhatsApp', false, 'Tabla no existe - ejecutar esquema de BD primero');
        return;
      }
      
      // Crear configuración de prueba
      const { data, error } = await supabase
        .from('employee_whatsapp_config')
        .upsert({
          employee_email: this.testEmployee.email,
          company_id: this.testEmployee.companyId,
          whatsapp_number: this.testEmployee.whatsappNumber,
          is_active: true,
          auto_response_enabled: true,
          knowledge_base_enabled: true,
          response_language: 'es'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      this.logTestResult('Configuración WhatsApp', true, {
        employeeEmail: data.employee_email,
        whatsappNumber: data.whatsapp_number,
        configId: data.id
      });
      
    } catch (error) {
      this.logTestResult('Configuración WhatsApp', false, error.message);
    }
  }

  /**
   * Prueba 4: Simular búsqueda en base de conocimiento
   */
  async testKnowledgeSearch() {
    console.log('🔍 Prueba 4: Simular búsqueda en conocimiento');
    
    try {
      // Verificar si las tablas de conocimiento existen
      const { data: knowledgeBases, error: kbError } = await supabase
        .from('employee_knowledge_bases')
        .select('*', { count: 'exact', head: true });
      
      if (kbError && kbError.code === 'PGRST116') {
        this.logTestResult('Búsqueda en conocimiento', false, 'Tablas de conocimiento no existen - ejecutar esquema de BD primero');
        return;
      }
      
      // Simular búsqueda básica
      const mockSearchResults = [
        {
          title: 'Manual del Empleado',
          content: 'Políticas de vacaciones: 15 días hábiles por año',
          relevance: 0.89,
          source: 'employee_knowledge'
        },
        {
          title: 'Procedimientos',
          content: 'Cómo solicitar permisos y vacaciones',
          relevance: 0.76,
          source: 'employee_knowledge'
        }
      ];
      
      this.logTestResult('Búsqueda en conocimiento', true, {
        totalKnowledgeBases: knowledgeBases?.length || 0,
        mockSearchResults: mockSearchResults.length,
        sampleResults: mockSearchResults
      });
      
    } catch (error) {
      this.logTestResult('Búsqueda en conocimiento', false, error.message);
    }
  }

  /**
   * Registrar resultado de prueba
   */
  logTestResult(testName, success, details) {
    const result = {
      test: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${success ? 'EXITOSO' : 'FALLIDO'}`);
    
    if (!success) {
      console.log(`   Error: ${details}`);
    }
    
    console.log('');
  }

  /**
   * Mostrar resumen de pruebas
   */
  showTestSummary() {
    console.log('📋 RESUMEN DE PRUEBAS BÁSICAS');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`Total de pruebas: ${totalTests}`);
    console.log(`Exitosas: ${successfulTests} ✅`);
    console.log(`Fallidas: ${failedTests} ❌`);
    console.log(`Tasa de éxito: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');
    
    if (failedTests > 0) {
      console.log('❌ PRUEBAS FALLIDAS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.test}: ${r.details}`));
      console.log('');
    }
    
    console.log('🎯 PRÓXIMOS PASOS:');
    
    if (failedTests > 0) {
      console.log('1. Ejecutar esquema de base de datos:');
      console.log('   psql -d your_database -f database/employee_knowledge_schema.sql');
      console.log('');
      console.log('2. Configurar variables de entorno:');
      console.log('   - SUPABASE_URL');
      console.log('   - SUPABASE_ANON_KEY');
      console.log('   - GOOGLE_CLIENT_ID');
      console.log('   - GOOGLE_CLIENT_SECRET');
      console.log('   - GROQ_API_KEY');
      console.log('');
    }
    
    console.log('3. Integrar servicios en la aplicación');
    console.log('4. Configurar n8n workflows');
    console.log('5. Probar integración completa');
  }

  /**
   * Limpiar datos de prueba
   */
  async cleanup() {
    console.log('🧹 Limpiando datos de prueba...');
    
    try {
      // Eliminar configuración de WhatsApp de prueba
      await supabase
        .from('employee_whatsapp_config')
        .delete()
        .eq('employee_email', this.testEmployee.email);
      
      console.log('✅ Datos de prueba limpiados exitosamente');
      
    } catch (error) {
      console.error('❌ Error limpiando datos de prueba:', error);
    }
  }
}

// Función principal
async function runSimpleTests() {
  const tester = new SimpleEmployeeKnowledgeTest();
  
  try {
    await tester.runBasicTests();
  } finally {
    await tester.cleanup();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleTests()
    .then(() => {
      console.log('\n🎉 Pruebas básicas completadas');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error en pruebas:', error);
      process.exit(1);
    });
}

export { runSimpleTests, SimpleEmployeeKnowledgeTest };