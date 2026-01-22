#!/usr/bin/env node

/**
 * Script de diagnóstico específico para el problema de tarjetas flipp no visibles
 * Verifica por qué no se cargan los datos de empresas en el dashboard
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseDashboardCompanies() {
  console.log('🔍 DIAGNÓSTICO DE DATOS DE EMPRESAS PARA DASHBOARD');
  console.log('=================================================\n');

  try {
    // 1. Verificar conexión básica
    console.log('1. Verificando conexión con Supabase...');
    const { data: test, error: connError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (connError) {
      console.log('❌ Error de conexión:', connError.message);
      console.log('   Detalles:', JSON.stringify(connError, null, 2));
    } else {
      console.log('✅ Conexión exitosa');
    }

    // 2. Verificar tabla companies
    console.log('\n2. Verificando tabla companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (companiesError) {
      console.log('❌ Error al obtener empresas:', companiesError.message);
      console.log('   Código:', companiesError.code);
      console.log('   Detalles:', companiesError.details);
    } else {
      console.log(`✅ Empresas encontradas: ${companies.length}`);
      if (companies.length > 0) {
        console.log('\n   Primeras 5 empresas:');
        companies.slice(0, 5).forEach((company, i) => {
          console.log(`   ${i + 1}. ${company.name} (ID: ${company.id})`);
        });
      }
    }

    // 3. Verificar tabla employees
    console.log('\n3. Verificando tabla employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);

    if (employeesError) {
      console.log('❌ Error al obtener empleados:', employeesError.message);
    } else {
      console.log(`✅ Empleados encontrados: ${employees.length}`);
      
      // Verificar si tienen full_name
      if (employees.length > 0) {
        const firstEmployee = employees[0];
        console.log('\n   Estructura del primer empleado:');
        console.log('   Campos disponibles:', Object.keys(firstEmployee).join(', '));
        
        if (firstEmployee.full_name) {
          console.log(`   ✅ full_name: ${firstEmployee.full_name}`);
        } else {
          console.log('   ❌ full_name: NO EXISTE');
          console.log('   first_name:', firstEmployee.first_name);
          console.log('   last_name:', firstEmployee.last_name);
        }
      }
    }

    // 4. Simular la consulta exacta del dashboard
    console.log('\n4. Probando consulta del dashboard...');
    
    // Esta es la consulta típica que usa el dashboard para mostrar las tarjetas
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('employees')
      .select(`
        *,
        company:companies(name)
      `)
      .limit(10);

    if (dashboardError) {
      console.log('❌ Error en consulta del dashboard:', dashboardError.message);
      console.log('   Código:', dashboardError.code);
      console.log('   Detalles:', dashboardError.details);
      console.log('   Hint:', dashboardError.hint);
    } else {
      console.log(`✅ Datos del dashboard obtenidos: ${dashboardData.length} registros`);
      
      if (dashboardData.length > 0) {
        console.log('\n   Muestra de datos con relación a companies:');
        dashboardData.forEach((emp, i) => {
          const companyName = emp.company?.name || '❌ Sin empresa';
          const employeeName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '❌ Sin nombre';
          console.log(`   ${i + 1}. ${employeeName} → ${companyName}`);
        });
      }
    }

    // 5. Verificar políticas RLS
    console.log('\n5. Verificando políticas RLS...');
    
    // Intentar una consulta sin autenticación (como el usuario anónimo)
    const { data: publicData, error: publicError } = await supabase
      .from('employees')
      .select('*')
      .limit(3);

    if (publicError) {
      console.log('❌ Error con usuario anónimo:', publicError.message);
      console.log('   💡 Posible problema: Las políticas RLS están bloqueando el acceso');
    } else {
      console.log(`✅ Acceso público permitido: ${publicData.length} registros`);
    }

    // 6. Verificar si hay errores de esquema
    console.log('\n6. Verificando esquema de la tabla employees...');
    
    // Intentar acceder a un campo específico
    const { data: specificData, error: specificError } = await supabase
      .from('employees')
      .select('id, full_name, first_name, last_name, company_id')
      .limit(3);

    if (specificError) {
      console.log('❌ Error al acceder a campos específicos:', specificError.message);
    } else {
      console.log('✅ Campos específicos accesibles');
      specificData.forEach((emp, i) => {
        console.log(`   ${i + 1}. full_name: ${emp.full_name || 'NULL'} | first_name: ${emp.first_name || 'NULL'}`);
      });
    }

    // 7. Resumen del problema
    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO');
    console.log('==========================');
    
    if (companiesError || employeesError || dashboardError) {
      console.log('❌ PROBLEMA IDENTIFICADO: Error en la consulta de datos');
      
      if (dashboardError?.code === 'PGRST201') {
        console.log('\n💡 CAUSA: Relación companies no existe o no es accesible');
        console.log('   La relación en la consulta .select("*, company:companies(name)") está fallando');
      }
      
      if (dashboardError?.code === '42501') {
        console.log('\n💡 CAUSA: Políticas RLS (Row Level Security) están bloqueando el acceso');
        console.log('   Necesitas configurar políticas RLS en Supabase para permitir lectura');
      }
      
      if (employeesError?.message?.includes('full_name')) {
        console.log('\n💡 CAUSA: El campo full_name no existe en la tabla employees');
        console.log('   Necesitas crear la columna full_name en Supabase Dashboard');
      }
    } else {
      console.log('✅ Las consultas básicas funcionan');
      
      if (dashboardData.length > 0 && !dashboardData[0].full_name) {
        console.log('\n⚠️ ADVERTENCIA: Los empleados no tienen campo full_name');
        console.log('   Esto puede causar que el dashboard no muestre los nombres correctamente');
        console.log('   Solución: Crear columna full_name o modificar el componente para usar first_name + last_name');
      }
      
      if (dashboardData.length > 0 && !dashboardData[0].company) {
        console.log('\n⚠️ ADVERTENCIA: La relación con companies no está funcionando');
        console.log('   El dashboard no puede obtener los nombres de las empresas');
      }
    }

    console.log('\n🔧 SOLUCIONES SUGERIDAS:');
    console.log('1. Verificar que la columna full_name exista en employees');
    console.log('2. Revisar políticas RLS en Supabase Dashboard > Authentication > Policies');
    console.log('3. Verificar que la relación company_id → companies.id esté configurada');
    console.log('4. Revisar la consulta exacta en el componente ModernDashboard');
    console.log('5. Verificar errores en la consola del navegador (F12 > Console)');

  } catch (error) {
    console.error('💥 ERROR CRÍTICO:', error.message);
    console.error('Stack:', error.stack);
  }
}

diagnoseDashboardCompanies().catch(console.error);