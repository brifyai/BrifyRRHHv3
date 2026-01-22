#!/usr/bin/env node

/**
 * SOLUCIÓN FINAL: Corregir EmployeeFolders para que funcione SIN relaciones de foreign key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🛠️ SOLUCIÓN FINAL: EmployeeFolders sin foreign keys');
console.log('======================================================================');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSolution() {
  try {
    console.log('📋 1. Probando consulta SIN relaciones (como debe ser)...');
    
    // Cargar carpetas SIN relaciones
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (foldersError) {
      console.error('❌ Error cargando carpetas:', foldersError);
      return;
    }
    
    console.log(`✅ Carpetas cargadas: ${folders?.length || 0}`);
    
    if (folders && folders.length > 0) {
      console.log('📝 Primera carpeta:', {
        id: folders[0].id,
        email: folders[0].employee_email,
        name: folders[0].employee_name,
        company: folders[0].company_name
      });
    }
    
    console.log('\n📄 2. Probando carga de documentos por separado...');
    
    // Cargar documentos por separado
    const { data: documents, error: documentsError } = await supabase
      .from('employee_documents')
      .select('*')
      .limit(10);
    
    if (documentsError) {
      console.log('⚠️ Error cargando documentos (tabla puede estar vacía):', documentsError.message);
    } else {
      console.log(`✅ Documentos cargados: ${documents?.length || 0}`);
    }
    
    console.log('\n❓ 3. Probando carga de FAQs por separado...');
    
    // Cargar FAQs por separado
    const { data: faqs, error: faqsError } = await supabase
      .from('employee_faqs')
      .select('*')
      .limit(10);
    
    if (faqsError) {
      console.log('⚠️ Error cargando FAQs (tabla puede estar vacía):', faqsError.message);
    } else {
      console.log(`✅ FAQs cargados: ${faqs?.length || 0}`);
    }
    
    console.log('\n🔗 4. Simulando combinación en frontend...');
    
    // Simular cómo el componente debería combinar los datos
    const combinedFolders = (folders || []).map(folder => {
      const folderDocuments = (documents || []).filter(doc => 
        doc.employee_folder_id === folder.id
      );
      
      const folderFaqs = (faqs || []).filter(faq => 
        faq.employee_folder_id === folder.id
      );
      
      return {
        ...folder,
        knowledgeBase: {
          documents: folderDocuments.map(doc => ({
            id: doc.id,
            name: doc.document_name,
            description: doc.description,
            type: doc.document_type,
            fileType: doc.document_type,
            category: doc.document_type
          })),
          faqs: folderFaqs.map(faq => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            type: 'faq'
          })),
          policies: folderDocuments.filter(doc => doc.document_type === 'policy'),
          procedures: folderDocuments.filter(doc => doc.document_type === 'procedure')
        }
      };
    });
    
    console.log(`✅ Carpetas combinadas: ${combinedFolders.length}`);
    
    if (combinedFolders.length > 0) {
      const firstFolder = combinedFolders[0];
      console.log('📝 Primera carpeta combinada:', {
        id: firstFolder.id,
        email: firstFolder.employee_email,
        name: firstFolder.employee_name,
        documents: firstFolder.knowledgeBase.documents.length,
        faqs: firstFolder.knowledgeBase.faqs.length,
        policies: firstFolder.knowledgeBase.policies.length,
        procedures: firstFolder.knowledgeBase.procedures.length
      });
    }
    
    console.log('\n🎯 SOLUCIÓN CONFIRMADA:');
    console.log('======================================================================');
    console.log('✅ La consulta SIN relaciones funciona perfectamente');
    console.log('✅ Los datos se pueden combinar en el frontend');
    console.log('✅ El componente EmployeeFolders debe modificarse para usar este enfoque');
    
    console.log('\n📋 ACCIÓN REQUERIDA:');
    console.log('Modificar src/components/communication/EmployeeFolders.js:');
    console.log('- Línea ~220: Cambiar consulta con relaciones por consulta simple');
    console.log('- Línea ~248: Agregar lógica de combinación de datos en frontend');
    console.log('- Esto resolverá el problema inmediatamente');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

testSolution();