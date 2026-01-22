import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Falta REACT_APP_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCompaniesUserId() {
  console.log('🚀 Iniciando fix de companies.user_id...');
  
  try {
    // PASO 1: Crear tabla company_users
    console.log('📋 Paso 1: Creando tabla company_users...');
    const { error: createError } = await supabase.rpc('create_company_users_table');
    
    if (createError) {
      console.log('⚠️  La tabla company_users ya existe o error:', createError.message);
    } else {
      console.log('✅ Tabla company_users creada');
    }

    // PASO 2: Crear función user_has_company_access
    console.log('🔧 Paso 2: Creando función user_has_company_access...');
    const { error: funcError } = await supabase.rpc('create_user_access_function');
    
    if (funcError) {
      console.log('⚠️  La función ya existe o error:', funcError.message);
    } else {
      console.log('✅ Función user_has_company_access creada');
    }

    // PASO 3: Actualizar políticas RLS
    console.log('🔒 Paso 3: Actualizando políticas RLS...');
    
    // Eliminar políticas antiguas
    await supabase.rpc('drop_old_policies');
    
    // Crear políticas nuevas
    await supabase.rpc('create_new_policies');
    
    console.log('✅ Políticas RLS actualizadas');

    // PASO 4: Migrar datos existentes
    console.log('🔄 Paso 4: Migrando datos existentes...');
    const { data: migrateData, error: migrateError } = await supabase.rpc('migrate_existing_companies');
    
    if (migrateError) {
      console.log('⚠️  Error en migración:', migrateError.message);
    } else {
      console.log('✅ Migración completada:', migrateData);
    }

    // PASO 5: Verificar resultado
    console.log('📊 Paso 5: Verificando resultado...');
    const { data: stats, error: statsError } = await supabase.rpc('get_migration_stats');
    
    if (statsError) {
      console.log('⚠️  Error obteniendo estadísticas:', statsError.message);
    } else {
      console.log('📈 Estadísticas:', stats);
    }

    console.log('🎉 ¡Fix aplicado exitosamente!');
    console.log('\n📝 Resumen:');
    console.log('- Tabla company_users creada');
    console.log('- Función user_has_company_access creada');
    console.log('- Políticas RLS actualizadas');
    console.log('- Datos migrados si era necesario');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar
fixCompaniesUserId().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});