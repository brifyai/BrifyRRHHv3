#!/usr/bin/env node

/**
 * Test de Conectividad Simple - Sistema de Bases de Conocimiento
 */

import { createClient } from '@supabase/supabase-js';

console.log('🧪 Iniciando Test de Conectividad Simple...\n');

// Configuración de Supabase
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZscGppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MDYzNjcsImV4cCI6MjA1MDE4MjM2N30.f5n0xG3L8l9Z7l8rN5xJ4H2qT6sQ9bM8cR2wE1tY5k';

console.log('📡 Configurando cliente Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Probando conexión a Supabase...');
    
    // Test 1: Verificar conexión básica
    const { data, error } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error en consulta básica:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    console.log(`📊 Empresas encontradas: ${data?.length || 0}`);
    
    // Test 2: Verificar tablas del sistema de conocimiento
    console.log('\n📋 Verificando tablas del sistema de conocimiento...');
    
    const knowledgeTables = [
      'employee_knowledge_bases',
      'employee_knowledge_documents',
      'whatsapp_conversations_with_knowledge',
      'employee_whatsapp_config',
      'employee_knowledge_metrics'
    ];
    
    let existingTables = 0;
    
    for (const table of knowledgeTables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (tableError && tableError.code === 'PGRST116') {
          console.log(`❌ Tabla '${table}' no existe`);
        } else if (tableError) {
          console.log(`⚠️  Tabla '${table}' error: ${tableError.message}`);
        } else {
          console.log(`✅ Tabla '${table}' existe (${tableData?.length || 0} registros)`);
          existingTables++;
        }
      } catch (tableException) {
        console.log(`❌ Excepción en tabla '${table}': ${tableException.message}`);
      }
    }
    
    console.log(`\n📈 Resumen: ${existingTables}/${knowledgeTables.length} tablas existen`);
    
    // Test 3: Crear configuración de prueba si las tablas existen
    if (existingTables > 0) {
      console.log('\n📱 Probando creación de configuración WhatsApp...');
      
      try {
        const { data: configData, error: configError } = await supabase
          .from('employee_whatsapp_config')
          .upsert({
            employee_email: 'test@example.com',
            company_id: 'test-company-123',
            whatsapp_number: '+56912345678',
            is_active: true,
            auto_response_enabled: true,
            knowledge_base_enabled: true,
            response_language: 'es'
          })
          .select()
          .single();
        
        if (configError) {
          console.log(`❌ Error creando configuración: ${configError.message}`);
        } else {
          console.log('✅ Configuración WhatsApp creada exitosamente');
          console.log(`   ID: ${configData.id}`);
          console.log(`   Email: ${configData.employee_email}`);
          
          // Limpiar datos de prueba
          await supabase
            .from('employee_whatsapp_config')
            .delete()
            .eq('employee_email', 'test@example.com');
          
          console.log('🧹 Datos de prueba limpiados');
        }
      } catch (configException) {
        console.log(`❌ Excepción creando configuración: ${configException.message}`);
      }
    }
    
    console.log('\n🎉 Test de conectividad completado');
    return true;
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
    return false;
  }
}

// Ejecutar test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Sistema listo para implementar bases de conocimiento por empleado');
    } else {
      console.log('\n❌ Hay problemas que resolver antes de continuar');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });