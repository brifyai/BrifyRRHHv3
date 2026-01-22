#!/usr/bin/env node

/**
 * Script para crear la columna full_name en la tabla employees
 * y luego poblarla con datos combinados de first_name y last_name
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Usar service role key para operaciones administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFullNameColumn() {
  console.log('🔧 CREANDO COLUMNA full_name EN employees');
  console.log('==========================================\n');

  try {
    // 1. Crear la columna full_name usando SQL
    console.log('1. Creando columna full_name...');
    
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS full_name TEXT;
        
        -- Crear índice para mejorar performance
        CREATE INDEX IF NOT EXISTS idx_employees_full_name 
        ON employees(full_name);
      `
    });

    if (columnError) {
      console.log('⚠️ No se pudo crear con RPC, intentando método alternativo...');
      // Método alternativo: Usar la API de Supabase directamente
      console.log('   (La columna debe crearse manualmente en el dashboard de Supabase)');
      console.log('   SQL: ALTER TABLE employees ADD COLUMN full_name TEXT;');
    } else {
      console.log('✅ Columna full_name creada exitosamente');
    }

    // 2. Actualizar los datos
    console.log('\n2. Actualizando datos de empleados...');
    
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('*');

    if (fetchError) {
      console.log('❌ Error al obtener empleados:', fetchError.message);
      return;
    }

    let updatedCount = 0;
    let errors = [];

    for (const employee of employees) {
      const firstName = employee.first_name || '';
      const lastName = employee.last_name || '';
      
      if (firstName && lastName) {
        const fullName = `${firstName} ${lastName}`.trim();
        
        const { error: updateError } = await supabase
          .from('employees')
          .update({ full_name: fullName })
          .eq('id', employee.id);

        if (updateError) {
          errors.push(`Empleado ${employee.id}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`✅ ${fullName}`);
        }
      } else {
        console.log(`⚠️ Empleado ${employee.id} sin nombre completo`);
      }
    }

    console.log('\n📊 RESUMEN');
    console.log('==========');
    console.log(`✅ Empleados actualizados: ${updatedCount}`);
    console.log(`❌ Errores: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrores detallados:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    // 3. Verificar el resultado
    console.log('\n3. Verificando resultado...');
    const { data: verified, error: verifyError } = await supabase
      .from('employees')
      .select('id, full_name, first_name, last_name')
      .not('full_name', 'is', null)
      .limit(5);

    if (!verifyError && verified.length > 0) {
      console.log('\n✅ Muestra de empleados actualizados:');
      verified.forEach(emp => {
        console.log(`  - ${emp.full_name} (${emp.first_name} ${emp.last_name})`);
      });
    }

    console.log('\n🎉 Proceso completado!');
    console.log('\nNOTA: Si la columna no se creó automáticamente, créala manualmente en:');
    console.log('Supabase Dashboard > Database > Tables > employees > Add column');
    console.log('Nombre: full_name, Tipo: text');

  } catch (error) {
    console.error('💥 ERROR CRÍTICO:', error.message);
    console.log('\n💡 SOLUCIÓN MANUAL:');
    console.log('1. Ve a Supabase Dashboard > Database > SQL Editor');
    console.log('2. Ejecuta: ALTER TABLE employees ADD COLUMN full_name TEXT;');
    console.log('3. Vuelve a ejecutar este script');
  }
}

createFullNameColumn().catch(console.error);