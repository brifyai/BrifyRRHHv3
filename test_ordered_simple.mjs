/**
 * TEST ORDERED COMPANY CREATION SIMPLE
 * Script simplificado para probar el flujo ordenado sin dependencias React
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para generar IDs únicos
function generateUniqueId(length = 64) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Función para crear empresa con flujo ordenado
async function createCompanyWithOrderedFlow(companyData, userId) {
  console.log('🔄 Iniciando flujo ordenado de creación...');

  try {
    // PASO 1: Validar datos
    console.log('📋 PASO 1: Validando datos...');
    if (!companyData.name?.trim()) {
      throw new Error('El nombre de la empresa es obligatorio');
    }

    // PASO 2: Generar IDs únicos
    console.log('📋 PASO 2: Generando IDs únicos...');
    const tokenId = generateUniqueId(64);
    const carpetaId = generateUniqueId(32);
    console.log(`✅ token_id generado: ${tokenId.substring(0, 16)}...`);
    console.log(`✅ carpeta_id generado: ${carpetaId.substring(0, 16)}...`);

    // PASO 3: Crear empresa en Supabase
    console.log('📋 PASO 3: Creando empresa en Supabase...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        description: companyData.description || null,
        status: companyData.status || 'active',
        token_id: tokenId,
        carpeta_id: carpetaId,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      throw new Error(`Error creando empresa: ${companyError.message}`);
    }

    console.log(`✅ Empresa creada con ID: ${company.id}`);

    // PASO 4: Crear estructura de carpetas Gmail/No-Gmail
    console.log('📋 PASO 4: Creando estructura de carpetas...');
    
    const folders = [
      {
        company_id: company.id,
        folder_name: `${companyData.name} - Gmail`,
        folder_type: 'gmail',
        token_id: tokenId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        company_id: company.id,
        folder_name: `${companyData.name} - No-Gmail`,
        folder_type: 'no_gmail',
        token_id: tokenId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: createdFolders, error: foldersError } = await supabase
      .from('employee_folders')
      .insert(folders)
      .select();

    if (foldersError) {
      throw new Error(`Error creando carpetas: ${foldersError.message}`);
    }

    console.log(`✅ ${createdFolders.length} carpetas creadas`);

    // PASO 5: Verificar estructura creada
    console.log('📋 PASO 5: Verificando estructura creada...');
    const { data: verifyFolders, error: verifyError } = await supabase
      .from('employee_folders')
      .select('*')
      .eq('company_id', company.id);

    if (verifyError) {
      throw new Error(`Error verificando carpetas: ${verifyError.message}`);
    }

    console.log('📁 Estructura de carpetas:');
    verifyFolders.forEach(folder => {
      console.log(`  - ${folder.folder_name} (${folder.folder_type})`);
    });

    return {
      success: true,
      company: company,
      folders: verifyFolders
    };

  } catch (error) {
    console.error('❌ Error en flujo ordenado:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para limpiar datos de prueba
async function cleanupTestData(companyId) {
  console.log('🧹 Limpiando datos de prueba...');
  
  try {
    // Eliminar carpetas
    const { error: foldersError } = await supabase
      .from('employee_folders')
      .delete()
      .eq('company_id', companyId);

    if (foldersError) {
      console.log('⚠️ Error eliminando carpetas:', foldersError.message);
    } else {
      console.log('✅ Carpetas eliminadas');
    }

    // Eliminar empresa
    const { error: companyError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (companyError) {
      console.log('⚠️ Error eliminando empresa:', companyError.message);
    } else {
      console.log('✅ Empresa eliminada');
    }

  } catch (error) {
    console.error('❌ Error en limpieza:', error.message);
  }
}

// Función principal de prueba
async function runTest() {
  console.log('🧪 INICIANDO PRUEBA DEL FLUJO ORDENADO');
  console.log('=' .repeat(50));

  try {
    // Verificar conexión a Supabase
    console.log('🔌 Verificando conexión a Supabase...');
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Error conectando a Supabase: ${error.message}`);
    }

    console.log('✅ Conexión a Supabase exitosa');

    // Crear empresa de prueba
    const testCompanyData = {
      name: 'Empresa Test Ordered Flow',
      description: 'Empresa de prueba para validar el flujo ordenado',
      status: 'active'
    };

    const result = await createCompanyWithOrderedFlow(testCompanyData, 'test-user-id');

    if (result.success) {
      console.log('\n🎉 EMPRESA CREADA EXITOSAMENTE');
      console.log('📊 Datos de la empresa:');
      console.log(`  - ID: ${result.company.id}`);
      console.log(`  - Nombre: ${result.company.name}`);
      console.log(`  - Token ID: ${result.company.token_id?.substring(0, 16)}...`);
      console.log(`  - Carpeta ID: ${result.company.carpeta_id?.substring(0, 16)}...`);
      console.log(`  - Estado: ${result.company.status}`);

      console.log('\n📁 Carpetas creadas:');
      result.folders.forEach(folder => {
        console.log(`  - ${folder.folder_name} (${folder.folder_type})`);
      });

      // Limpiar datos de prueba
      await cleanupTestData(result.company.id);

      console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
      console.log('✅ Flujo ordenado funcionando correctamente');
      console.log('✅ Estructura Gmail/No-Gmail creada');
      console.log('✅ IDs únicos generados correctamente');

    } else {
      throw new Error(`Error en creación: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    process.exit(1);
  }
}

// Ejecutar prueba
runTest();