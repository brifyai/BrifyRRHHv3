#!/usr/bin/env node

// Script de diagnóstico para verificar el esquema de la tabla employees
import { supabase } from './src/lib/supabaseClient.js'

async function diagnoseEmployeesSchema() {
  console.log('🔍 DIAGNÓSTICO DE ESQUEMA: Tabla employees\n')
  
  try {
    // Intentar obtener un registro para ver columnas existentes
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ ERROR AL ACCEDER A LA TABLA:')
      console.error('Código:', error.code)
      console.error('Mensaje:', error.message)
      console.error('\n💡 POSIBLES SOLUCIONES:')
      console.error('1. La tabla "employees" no existe')
      console.error('2. No tienes permisos RLS (Row Level Security)')
      console.error('3. El esquema está incorrecto')
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ LA TABLA ESTÁ VACÍA')
      console.log('\n📋 COLUMNAS ESPERADAS POR EL FRONTEND:')
      const expectedColumns = [
        'id', 'email', 'first_name', 'last_name', 'phone', 'position',
        'department', 'level', 'work_mode', 'contract_type', 'region',
        'company_id', 'created_at', 'updated_at'
      ]
      expectedColumns.forEach(col => console.log(`  - ${col}`))
      
      console.log('\n📝 SQL PARA CREAR COLUMNAS FALTANTES:')
      console.log(`
-- Agregar columnas faltantes a employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS work_mode TEXT,
  ADD COLUMN IF NOT EXISTS contract_type TEXT;
  
-- Actualizar políticas RLS si es necesario
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política básica (ajustar según necesidad)
CREATE POLICY "Empleados visibles para usuarios autenticados" ON employees
  FOR SELECT USING (auth.uid() IS NOT NULL);
`)
      return
    }
    
    // Mostrar columnas existentes
    const columns = Object.keys(data[0])
    console.log('✅ COLUMNAS EXISTENTES EN LA TABLA:')
    columns.forEach(col => console.log(`  - ${col}`))
    
    // Verificar columnas faltantes
    const expectedColumns = [
      'region', 'department', 'level', 'work_mode', 'contract_type'
    ]
    
    const missingColumns = expectedColumns.filter(col => !columns.includes(col))
    
    if (missingColumns.length > 0) {
      console.log('\n❌ COLUMNAS FALTANTES:')
      missingColumns.forEach(col => console.log(`  - ${col}`))
      
      console.log('\n📝 SQL PARA AGREGAR COLUMNAS FALTANTES:')
      console.log('ALTER TABLE employees')
      missingColumns.forEach((col, index) => {
        const comma = index < missingColumns.length - 1 ? ',' : ';'
        console.log(`  ADD COLUMN IF NOT EXISTS ${col} TEXT${comma}`)
      })
    } else {
      console.log('\n✅ TODAS LAS COLUMNAS NECESARIAS EXISTEN')
    }
    
    // Verificar cantidad de empleados
    const { count, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`\n📊 TOTAL DE EMPLEADOS: ${count}`)
    }
    
  } catch (error) {
    console.error('❌ ERROR INESPERADO:', error.message)
  }
}

diagnoseEmployeesSchema()
  .then(() => {
    console.log('\n✅ Diagnóstico completado')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })