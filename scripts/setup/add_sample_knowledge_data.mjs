import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleKnowledgeData() {
  try {
    console.log('🚀 Agregando datos de conocimiento de prueba...');

    // Obtener algunas carpetas de empleados existentes
    const { data: folders, error: foldersError } = await supabase
      .from('employee_folders')
      .select('id, employee_email, employee_name')
      .limit(5);

    if (foldersError) {
      console.error('❌ Error obteniendo carpetas:', foldersError);
      return;
    }

    if (!folders || folders.length === 0) {
      console.log('⚠️ No hay carpetas de empleados. Creando algunas primero...');
      
      // Crear carpetas de prueba si no existen
      const { data: employees } = await supabase
        .from('employees')
        .select('email, first_name, last_name, company_id')
        .limit(5);

      if (employees && employees.length > 0) {
        for (const employee of employees) {
          const { data: newFolder, error: createError } = await supabase
            .from('employee_folders')
            .insert({
              employee_email: employee.email,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              company_id: employee.company_id
            })
            .select()
            .single();

          if (!createError && newFolder) {
            folders.push(newFolder);
          }
        }
      }
    }

    console.log(`📁 Procesando ${folders.length} carpetas...`);

    // Para cada carpeta, agregar datos de ejemplo
    for (const folder of folders) {
      console.log(`📝 Procesando carpeta: ${folder.employee_email}`);

      // Agregar FAQs de ejemplo
      const sampleFAQs = [
        {
          folder_id: folder.id,
          question: `¿Cuáles son mis responsabilidades principales en ${folder.employee_name || 'mi puesto'}?`,
          answer: 'Tus responsabilidades principales incluyen completar las tareas asignadas, colaborar con el equipo y cumplir con los objetivos establecidos.',
          category: 'General',
          priority: 1
        },
        {
          folder_id: folder.id,
          question: '¿Cómo solicito días de vacaciones?',
          answer: 'Debes solicitar tus vacaciones con al menos 2 semanas de anticipación a través del sistema de RRHH.',
          category: 'Beneficios',
          priority: 2
        },
        {
          folder_id: folder.id,
          question: '¿Cuál es el horario de trabajo?',
          answer: 'El horario de trabajo es de lunes a viernes de 9:00 AM a 6:00 PM, con 1 hora de almuerzo.',
          category: 'Horario',
          priority: 1
        }
      ];

      for (const faq of sampleFAQs) {
        const { error: faqError } = await supabase
          .from('employee_faqs')
          .insert(faq);

        if (faqError) {
          console.warn(`⚠️ Error creando FAQ para ${folder.employee_email}:`, faqError.message);
        }
      }

      // Agregar documentos de ejemplo
      const sampleDocuments = [
        {
          folder_id: folder.id,
          document_name: 'Contrato de Trabajo',
          document_type: 'contract',
          description: 'Documento oficial del contrato de trabajo con términos y condiciones.',
          file_size: 1024000
        },
        {
          folder_id: folder.id,
          document_name: 'Manual del Empleado',
          document_type: 'manual',
          description: 'Guía completa de políticas y procedimientos de la empresa.',
          file_size: 2048000
        },
        {
          folder_id: folder.id,
          document_name: 'Política de Vacaciones',
          document_type: 'policy',
          description: 'Política oficial sobre solicitud y aprobación de vacaciones.',
          file_size: 512000
        },
        {
          folder_id: folder.id,
          document_name: 'Procedimiento de Emergencia',
          document_type: 'procedure',
          description: 'Pasos a seguir en caso de emergencia en el lugar de trabajo.',
          file_size: 256000
        }
      ];

      for (const doc of sampleDocuments) {
        const { error: docError } = await supabase
          .from('employee_documents')
          .insert(doc);

        if (docError) {
          console.warn(`⚠️ Error creando documento para ${folder.employee_email}:`, docError.message);
        }
      }
    }

    // Verificar los datos agregados
    const { data: verification, error: verificationError } = await supabase
      .from('employee_folders')
      .select(`
        employee_email,
        employee_faqs(id, question, status),
        employee_documents(id, document_name, document_type, status)
      `)
      .limit(3);

    if (!verificationError && verification) {
      console.log('\n✅ Datos agregados exitosamente. Verificación:');
      verification.forEach(folder => {
        console.log(`📊 ${folder.employee_email}:`);
        console.log(`   - FAQs: ${folder.employee_faqs?.length || 0}`);
        console.log(`   - Documentos: ${folder.employee_documents?.length || 0}`);
        
        const faqsActive = folder.employee_faqs?.filter(f => f.status === 'active').length || 0;
        const docsActive = folder.employee_documents?.filter(d => d.status === 'active').length || 0;
        const policies = folder.employee_documents?.filter(d => d.document_type === 'policy').length || 0;
        const procedures = folder.employee_documents?.filter(d => d.document_type === 'procedure').length || 0;
        
        console.log(`   - FAQs activos: ${faqsActive}`);
        console.log(`   - Documentos activos: ${docsActive}`);
        console.log(`   - Políticas: ${policies}`);
        console.log(`   - Procedimientos: ${procedures}`);
      });
    }

    console.log('\n🎉 ¡Datos de prueba agregados exitosamente!');
    console.log('📌 Ahora puedes recargar la página de carpetas para ver las estadísticas actualizadas.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
addSampleKnowledgeData();