#!/usr/bin/env node

/**
 * Script para verificar la estructura de las tablas en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de tablas...\n');
  
  try {
    // Verificar tabla employees
    console.log('📊 Tabla EMPLOYEES:');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (employeesError) {
      console.error('❌ Error al acceder a employees:', employeesError.message);
    } else if (employees && employees.length > 0) {
      console.log('   Columnas disponibles:', Object.keys(employees[0]));
      console.log('   Ejemplo de registro:', employees[0]);
    } else {
      console.log('   ⚠️  Tabla existe pero está vacía');
    }
    
    // Verificar tabla employee_folders
    console.log('\n📁 Tabla EMPLOYEE_FOLDERS:');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(1);
    
    if (foldersError) {
      console.error('❌ Error al acceder a employee_folders:', foldersError.message);
    } else if (folders && folders.length > 0) {
      console.log('   Columnas disponibles:', Object.keys(folders[0]));
      console.log('   Ejemplo de registro:', folders[0]);
    } else {
      console.log('   ⚠️  Tabla existe pero está vacía');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTableStructure();