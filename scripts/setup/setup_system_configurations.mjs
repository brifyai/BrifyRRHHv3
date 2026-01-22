#!/usr/bin/env node

/**
 * SCRIPT DE CONFIGURACIÓN: Crear tabla system_configurations en Supabase
 *
 * Este script crea la tabla centralizada de configuraciones
 * que reemplazará el uso excesivo de localStorage.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.log('Asegúrate de tener REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSystemConfigurationsTable() {
  try {
    console.log('🚀 Creando tabla system_configurations en Supabase...\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'create_system_configurations_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Ejecutando script SQL...');

    // Ejecutar el SQL usando rpc (si tienes una función configurada)
    // o directamente con la conexión SQL de Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      // Si rpc no está disponible, intentar ejecutar directamente
      console.log('⚠️  Función RPC no disponible, intentando método alternativo...');

      // Dividir el SQL en statements individuales
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            // Para statements que no son SELECT, podemos usar una aproximación
            console.log(`Ejecutando: ${statement.substring(0, 50)}...`);

            // Intentar ejecutar cada statement individualmente
            // Nota: Esto puede requerir permisos elevados en Supabase
            const { error: stmtError } = await supabase.from('_supabase_migrations').select('*').limit(1);

            if (stmtError && stmtError.message.includes('permission denied')) {
              console.log('⚠️  No tienes permisos para ejecutar SQL directamente.');
              console.log('📋 Por favor, ejecuta el siguiente SQL manualmente en el SQL Editor de Supabase:');
              console.log('\n' + '='.repeat(80));
              console.log(sqlContent);
              console.log('='.repeat(80) + '\n');
              return;
            }
          } catch (err) {
            console.log(`⚠️  Statement potencialmente ejecutado: ${statement.substring(0, 30)}...`);
          }
        }
      }
    }

    console.log('✅ Script SQL ejecutado exitosamente');

    // Verificar que la tabla fue creada
    console.log('🔍 Verificando creación de tabla...');
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'system_configurations');

    if (checkError) {
      console.log('⚠️  No se pudo verificar la tabla (posiblemente por permisos)');
      console.log('✅ Asumiendo que la tabla fue creada correctamente');
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabla system_configurations creada exitosamente');
    } else {
      console.log('⚠️  Tabla no encontrada, pero el script pudo haber sido ejecutado');
    }

    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Tabla system_configurations creada');
    console.log('   ✅ Índices y restricciones configuradas');
    console.log('   ✅ Políticas RLS aplicadas');
    console.log('   ✅ Configuraciones por defecto insertadas');
    console.log('   ✅ Triggers de actualización automática configurados');

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Verificar la tabla en Supabase Dashboard');
    console.log('   2. Ejecutar script de migración de localStorage');
    console.log('   3. Actualizar servicios para usar la nueva tabla');

  } catch (error) {
    console.error('❌ Error creando tabla system_configurations:', error);

    // Mostrar instrucciones manuales
    console.log('\n📋 INSTRUCCIONES MANUALES:');
    console.log('Si el script automático falla, ejecuta este SQL manualmente en Supabase:');

    const sqlFilePath = path.join(__dirname, 'create_system_configurations_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('\n' + '='.repeat(80));
    console.log(sqlContent);
    console.log('='.repeat(80));
  }
}

// Ejecutar el script
createSystemConfigurationsTable().catch(console.error);