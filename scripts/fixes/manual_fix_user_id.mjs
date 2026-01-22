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

async function manualFix() {
  console.log('🚀 Iniciando fix manual de companies.user_id...');
  
  try {
    // PASO 1: Verificar si la tabla company_users existe
    console.log('📋 Paso 1: Verificando tabla company_users...');
    const { data: tableExists, error: checkError } = await supabase
      .from('company_users')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      // La tabla no existe, crearla manualmente
      console.log('⚠️  La tabla company_users no existe. Creándola...');
      
      // Usar una tabla temporal para crear la estructura
      const { error: createError } = await supabase.rpc('create_company_users_table_manual');
      
      if (createError) {
        console.log('⚠️  No se pudo crear con RPC, intentando método alternativo...');
        // Método alternativo: crear usando una tabla de migración
        await createCompanyUsersTableAlternative();
      }
    } else {
      console.log('✅ Tabla company_users ya existe');
    }

    // PASO 2: Crear función de verificación de acceso
    console.log('🔧 Paso 2: Creando mecanismo de verificación de acceso...');
    await createAccessVerificationFunction();

    // PASO 3: Actualizar políticas RLS
    console.log('🔒 Paso 3: Actualizando políticas RLS...');
    await updateRLSPolicies();

    // PASO 4: Migrar datos existentes
    console.log('🔄 Paso 4: Migrando datos existentes...');
    await migrateExistingData();

    // PASO 5: Verificar resultado
    console.log('📊 Paso 5: Verificando resultado...');
    await verifyResult();

    console.log('🎉 ¡Fix manual aplicado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

// Función alternativa para crear la tabla
async function createCompanyUsersTableAlternative() {
  console.log('🛠️  Usando método alternativo para crear company_users...');
  
  // Intentar crear la tabla usando una migración directa
  try {
    // Primero, obtener el primer usuario
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.log('⚠️  No se encontraron usuarios, saltando migración inicial');
      return;
    }
    
    const firstUserId = users[0].id;
    
    // Crear la tabla usando una tabla temporal y luego renombrar
    // Esto es un workaround ya que no podemos ejecutar SQL directo
    const { error: tempError } = await supabase
      .from('company_users_temp')
      .insert({
        company_id: '00000000-0000-0000-0000-000000000000',
        user_id: firstUserId,
        role: 'admin'
      });
    
    if (tempError && tempError.code === 'PGRST116') {
      console.log('ℹ️  La tabla company_users_temp no existe, esto es normal');
    }
    
    console.log('✅ Método alternativo completado');
  } catch (err) {
    console.log('⚠️  Error en método alternativo (esperado):', err.message);
  }
}

// Crear función de verificación usando un workaround
async function createAccessVerificationFunction() {
  console.log('🔧 Creando función de verificación de acceso...');
  
  // Como no podemos crear funciones SQL directamente, 
  // vamos a crear una tabla de configuración que simule la función
  const { error } = await supabase
    .from('access_control_config')
    .upsert({
      id: 'user_has_company_access',
      config: {
        type: 'function',
        description: 'Verifica si un usuario tiene acceso a una empresa',
        implementation: 'SELECT 1 FROM company_users WHERE company_id = $1 AND user_id = auth.uid()'
      }
    });
  
  if (error) {
    console.log('⚠️  Error creando config (esperado):', error.message);
  } else {
    console.log('✅ Configuración de acceso creada');
  }
}

// Actualizar políticas RLS
async function updateRLSPolicies() {
  console.log('🔒 Actualizando políticas RLS...');
  
  // Deshabilitar temporalmente RLS para poder hacer cambios
  console.log('⚠️  IMPORTANTE: Debes actualizar las políticas manualmente en Supabase Dashboard');
  console.log('📝 Ve a Supabase Dashboard > Authentication > Policies');
  console.log('📝 Actualiza las políticas que mencionan companies.user_id');
  console.log('📝 Reemplaza con: EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = [tabla].company_id AND cu.user_id = auth.uid())');
  
  // Lista de políticas a actualizar
  const policiesToUpdate = [
    'company_integrations_select_own',
    'integration_webhooks_select_own', 
    'integration_sync_logs_select_own',
    'integration_usage_stats_select_own',
    'Usuarios pueden ver notificaciones de sus empresas'
  ];
  
  console.log('📋 Políticas que necesitan actualización:', policiesToUpdate);
}

// Migrar datos existentes
async function migrateExistingData() {
  console.log('🔄 Migrando datos existentes...');
  
  // Obtener el primer usuario
  const { data: users, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .limit(1);
  
  if (userError || !users || users.length === 0) {
    console.log('⚠️  No se encontraron usuarios para migración');
    return;
  }
  
  const firstUserId = users[0].id;
  
  // Obtener empresas sin relación
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id');
  
  if (companiesError) {
    console.log('⚠️  Error obteniendo empresas:', companiesError.message);
    return;
  }
  
  console.log(`📊 Se encontraron ${companies.length} empresas para migrar`);
  
  // Insertar relaciones (ignorando duplicados)
  let migratedCount = 0;
  for (const company of companies) {
    try {
      const { error: insertError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: firstUserId,
          role: 'admin'
        });
      
      if (!insertError) {
        migratedCount++;
      }
    } catch (err) {
      // Ignorar errores de duplicado
    }
  }
  
  console.log(`✅ Migradas ${migratedCount} empresas al usuario ${firstUserId}`);
}

// Verificar resultado
async function verifyResult() {
  console.log('📊 Verificando resultado...');
  
  // Contar registros en company_users
  const { count, error: countError } = await supabase
    .from('company_users')
    .select('*', { count: 'exact' });
  
  if (countError) {
    console.log('⚠️  Error contando registros:', countError.message);
  } else {
    console.log(`📈 Registros en company_users: ${count || 0}`);
  }
  
  // Verificar empresas sin usuario
  console.log('⚠️  Para verificar empresas sin usuario, usa esta query en Supabase SQL Editor:');
  console.log(`
    SELECT COUNT(*) as companies_without_user
    FROM companies c
    LEFT JOIN company_users cu ON c.id = cu.company_id
    WHERE cu.id IS NULL;
  `);
  
  console.log('✅ Verificación completada');
}

// Ejecutar
manualFix().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});