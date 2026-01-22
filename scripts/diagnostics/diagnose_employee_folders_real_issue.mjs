#!/usr/bin/env node

/**
 * Script de diagnóstico para investigar por qué las carpetas de empleados no se cargan
 * cuando ya existen en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Presente' : 'Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseEmployeeFolders() {
  console.log('🔍 DIAGNÓSTICO DE CARPETAS DE EMPLEADOS');
  console.log('==========================================\n');

  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('employee_folders')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Error de conexión:', testError.message);
      return;
    }
    console.log('✅ Conexión a Supabase exitosa\n');

    // 2. Contar carpetas totales
    console.log('2️⃣ Contando carpetas totales...');
    const { count: totalFolders, error: countError } = await supabase
      .from('employee_folders')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error contando carpetas:', countError.message);
    } else {
      console.log(`📊 Total de carpetas en employee_folders: ${totalFolders}\n`);
    }

    // 3. Obtener muestra de carpetas
    console.log('3️⃣ Obteniendo muestra de carpetas...');
    const { data: sampleFolders, error: sampleError } = await supabase
      .from('employee_folders')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error obteniendo muestra:', sampleError.message);
    } else {
      console.log(`📋 Muestra de ${sampleFolders.length} carpetas:`);
      sampleFolders.forEach((folder, index) => {
        console.log(`  ${index + 1}. ID: ${folder.id}`);
        console.log(`     Email: ${folder.employee_email}`);
        console.log(`     Nombre: ${folder.employee_name}`);
        console.log(`     Empresa: ${folder.company_name}`);
        console.log(`     Creado: ${folder.created_at}`);
        console.log('');
      });
    }

    // 4. Verificar relaciones con employee_documents
    console.log('4️⃣ Verificando relaciones con employee_documents...');
    const { data: foldersWithDocs, error: docsError } = await supabase
      .from('employee_folders')
      .select(`
        id,
        employee_email,
        employee_name,
        employee_documents(id, document_name, document_type, status)
      `)
      .limit(3);

    if (docsError) {
      console.error('❌ Error consultando relaciones con documentos:', docsError.message);
    } else {
      console.log(`📄 Carpetas con documentos:`);
      foldersWithDocs.forEach((folder, index) => {
        const docsCount = folder.employee_documents?.length || 0;
        console.log(`  ${index + 1}. ${folder.employee_email}: ${docsCount} documentos`);
      });
      console.log('');
    }

    // 5. Verificar relaciones con employee_faqs
    console.log('5️⃣ Verificando relaciones con employee_faqs...');
    const { data: foldersWithFaqs, error: faqsError } = await supabase
      .from('employee_folders')
      .select(`
        id,
        employee_email,
        employee_name,
        employee_faqs(id, question, category, status)
      `)
      .limit(3);

    if (faqsError) {
      console.error('❌ Error consultando relaciones con FAQs:', faqsError.message);
    } else {
      console.log(`❓ Carpetas con FAQs:`);
      foldersWithFaqs.forEach((folder, index) => {
        const faqsCount = folder.employee_faqs?.length || 0;
        console.log(`  ${index + 1}. ${folder.employee_email}: ${faqsCount} FAQs`);
      });
      console.log('');
    }

    // 6. Verificar permisos RLS
    console.log('6️⃣ Verificando permisos RLS...');
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('check_rls_permissions', { table_name: 'employee_folders' });

    if (rlsError) {
      console.log('⚠️ No se pudo verificar RLS (función no existe):', rlsError.message);
    } else {
      console.log('✅ RLS check:', rlsCheck);
    }

    // 7. Consulta exacta como en el componente
    console.log('7️⃣ Ejecutando consulta exacta del componente...');
    const { data: componentQuery, error: componentError } = await supabase
      .from('employee_folders')
      .select(`
        *,
        employee_documents(id, document_name, document_type, description, status),
        employee_faqs(id, question, answer, category, status)
      `)
      .order('created_at', { ascending: false });

    if (componentError) {
      console.error('❌ Error en consulta del componente:', componentError.message);
      console.error('Detalles:', componentError);
    } else {
      console.log(`✅ Consulta del componente exitosa: ${componentQuery.length} carpetas`);
      if (componentQuery.length > 0) {
        console.log('📊 Primera carpeta de la consulta:');
        const firstFolder = componentQuery[0];
        console.log(`  ID: ${firstFolder.id}`);
        console.log(`  Email: ${firstFolder.employee_email}`);
        console.log(`  Documentos: ${firstFolder.employee_documents?.length || 0}`);
        console.log(`  FAQs: ${firstFolder.employee_faqs?.length || 0}`);
      }
    }

    console.log('\n🏁 Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar diagnóstico
diagnoseEmployeeFolders();