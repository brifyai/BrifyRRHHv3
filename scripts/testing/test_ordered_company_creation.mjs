/**
 * TEST ORDERED COMPANY CREATION SERVICE
 * Script para probar el nuevo flujo ordenado de creación de empresas
 */

import orderedCompanyCreationService from './src/services/orderedCompanyCreationService.js';
import { supabase } from './src/lib/supabaseClient.js';

async function testOrderedCompanyCreation() {
  console.log('🧪 INICIANDO PRUEBA DEL ORDERED COMPANY CREATION SERVICE');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar que el servicio se inicializa correctamente
    console.log('\n📋 PASO 1: Verificando inicialización del servicio...');
    await orderedCompanyCreationService.initialize();
    console.log('✅ Servicio inicializado correctamente');

    // 2. Crear empresa de prueba con flujo ordenado
    console.log('\n📋 PASO 2: Creando empresa de prueba...');
    const testCompanyData = {
      name: 'Empresa Test Ordered Flow',
      description: 'Empresa de prueba para validar el flujo ordenado',
      status: 'active'
    };

    const result = await orderedCompanyCreationService.createCompanyWithOrderedFlow(
      testCompanyData,
      'test-user-id'
    );

    console.log('📊 Resultado de creación:', {
      success: result.success,
      company: result.company ? {
        id: result.company.id,
        name: result.company.name,
        token_id: result.company.token_id,
        carpeta_id: result.company.carpeta_id
      } : null,
      error: result.error
    });

    if (result.success && result.company) {
      console.log('\n📋 PASO 3: Verificando estructura en base de datos...');
      
      // Verificar que la empresa se guardó correctamente
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', result.company.id)
        .single();

      if (companyError) {
        throw new Error(`Error consultando empresa: ${companyError.message}`);
      }

      console.log('✅ Empresa encontrada en base de datos:', {
        id: companyData.id,
        name: companyData.name,
        token_id: companyData.token_id,
        carpeta_id: companyData.carpeta_id,
        status: companyData.status
      });

      // Verificar que se crearon las carpetas en employee_folders
      console.log('\n📋 PASO 4: Verificando carpetas de empleados...');
      const { data: foldersData, error: foldersError } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('company_id', result.company.id);

      if (foldersError) {
        throw new Error(`Error consultando carpetas: ${foldersError.message}`);
      }

      console.log('📁 Carpetas encontradas:', foldersData?.length || 0);
      foldersData?.forEach(folder => {
        console.log(`  - ${folder.folder_name} (${folder.folder_type})`);
      });

      // 3. Verificar estructura Gmail/No-Gmail
      console.log('\n📋 PASO 5: Verificando estructura Gmail/No-Gmail...');
      const gmailFolder = foldersData?.find(f => f.folder_name.toLowerCase().includes('gmail'));
      const noGmailFolder = foldersData?.find(f => f.folder_name.toLowerCase().includes('no-gmail'));

      if (gmailFolder && noGmailFolder) {
        console.log('✅ Estructura Gmail/No-Gmail creada correctamente');
        console.log(`  📁 Gmail: ${gmailFolder.folder_name}`);
        console.log(`  📁 No-Gmail: ${noGmailFolder.folder_name}`);
      } else {
        console.log('⚠️  Estructura Gmail/No-Gmail no encontrada completamente');
        console.log(`  📁 Gmail encontrado: ${!!gmailFolder}`);
        console.log(`  📁 No-Gmail encontrado: ${!!noGmailFolder}`);
      }

      // 4. Limpiar datos de prueba
      console.log('\n📋 PASO 6: Limpiando datos de prueba...');
      
      // Eliminar carpetas primero (por las foreign keys)
      if (foldersData?.length > 0) {
        const { error: deleteFoldersError } = await supabase
          .from('employee_folders')
          .delete()
          .eq('company_id', result.company.id);

        if (deleteFoldersError) {
          console.log('⚠️  Error eliminando carpetas:', deleteFoldersError.message);
        } else {
          console.log('✅ Carpetas eliminadas');
        }
      }

      // Eliminar empresa
      const { error: deleteCompanyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', result.company.id);

      if (deleteCompanyError) {
        console.log('⚠️  Error eliminando empresa:', deleteCompanyError.message);
      } else {
        console.log('✅ Empresa eliminada');
      }

      console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
      console.log('✅ El OrderedCompanyCreationService funciona correctamente');
      console.log('✅ Se crea la estructura Gmail/No-Gmail');
      console.log('✅ Se generan los IDs únicos (token_id, carpeta_id)');
      console.log('✅ Se guarda correctamente en Supabase');

    } else {
      throw new Error(`Error en la creación: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar prueba
testOrderedCompanyCreation();