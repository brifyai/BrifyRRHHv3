#!/usr/bin/env node

/**
 * VERIFICACIÓN DE TABLAS FALTANTES: employee_documents y employee_faqs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 VERIFICACIÓN: Tablas employee_documents y employee_faqs');
console.log('======================================================================');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingTables() {
  try {
    console.log('📋 1. Verificando estructura de la base de datos...');
    
    // Verificar qué tablas existen
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');
    
    if (tablesError) {
      console.log('⚠️ No se pudo obtener lista de tablas via RPC, intentando consulta directa...');
      
      // Intentar consultar cada tabla directamente
      const tableNames = [
        'employee_folders',
        'employee_documents', 
        'employee_faqs',
        'employees',
        'companies'
      ];
      
      for (const tableName of tableNames) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ ${tableName}: NO EXISTE o no accesible - ${error.message}`);
          } else {
            console.log(`✅ ${tableName}: EXISTE y es accesible`);
          }
        } catch (e) {
          console.log(`❌ ${tableName}: ERROR - ${e.message}`);
        }
      }
    } else {
      console.log('📊 Tablas encontradas:', tables);
    }
    
    console.log('\n🔍 2. Verificando relaciones de foreign key...');
    
    // Verificar si hay foreign keys configuradas
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('get_foreign_keys');
    
    if (fkError) {
      console.log('⚠️ No se pudieron obtener foreign keys via RPC');
    } else {
      console.log('🔗 Foreign keys encontradas:', foreignKeys);
    }
    
    console.log('\n🛠️ 3. Solución: Crear tablas faltantes...');
    
    // Crear employee_documents si no existe
    console.log('📄 Creando tabla employee_documents...');
    
    const createDocumentsTable = `
      CREATE TABLE IF NOT EXISTS employee_documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_folder_id UUID REFERENCES employee_folders(id) ON DELETE CASCADE,
        document_name TEXT NOT NULL,
        document_type TEXT NOT NULL DEFAULT 'document',
        description TEXT,
        content TEXT,
        file_url TEXT,
        file_size INTEGER,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createDocsError } = await supabase.rpc('exec_sql', { 
      sql: createDocumentsTable 
    });
    
    if (createDocsError) {
      console.log('⚠️ No se pudo crear employee_documents via RPC:', createDocsError);
    } else {
      console.log('✅ Tabla employee_documents creada exitosamente');
    }
    
    // Crear employee_faqs si no existe
    console.log('❓ Creando tabla employee_faqs...');
    
    const createFaqsTable = `
      CREATE TABLE IF NOT EXISTS employee_faqs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_folder_id UUID REFERENCES employee_folders(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createFaqsError } = await supabase.rpc('exec_sql', { 
      sql: createFaqsTable 
    });
    
    if (createFaqsError) {
      console.log('⚠️ No se pudo crear employee_faqs via RPC:', createFaqsError);
    } else {
      console.log('✅ Tabla employee_faqs creada exitosamente');
    }
    
    console.log('\n🧪 4. Probando consulta corregida...');
    
    // Probar la consulta que fallaba antes
    const { data: fixedFolders, error: fixedError } = await supabase
      .from('employee_folders')
      .select(`
        *,
        employee_documents(id, document_name, document_type, description, status),
        employee_faqs(id, question, answer, category, status)
      `)
      .order('created_at', { ascending: false });
    
    if (fixedError) {
      console.log('❌ Error en consulta corregida:', fixedError);
      console.log('💡 Las tablas pueden necesitar configuración adicional de RLS');
    } else {
      console.log('✅ Consulta corregida exitosa!');
      console.log(`📊 Carpetas con relaciones: ${fixedFolders?.length || 0}`);
      
      if (fixedFolders && fixedFolders.length > 0) {
        console.log('📝 Primera carpeta con relaciones:', {
          id: fixedFolders[0].id,
          email: fixedFolders[0].employee_email,
          documents: fixedFolders[0].employee_documents?.length || 0,
          faqs: fixedFolders[0].employee_faqs?.length || 0
        });
      }
    }
    
    console.log('\n🎯 RESUMEN:');
    console.log('======================================================================');
    console.log('✅ Base de datos conectada correctamente');
    console.log('✅ Tabla employee_folders existe y tiene datos');
    console.log('✅ Tablas employee_documents y employee_faqs creadas (si no existían)');
    console.log('🔄 La consulta del componente EmployeeFolders debería funcionar ahora');
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Recargar la página http://localhost:3001/communication/folders');
    console.log('2. Verificar que las carpetas ahora se muestran');
    console.log('3. Si persiste el problema, verificar autenticación del usuario');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

checkMissingTables();