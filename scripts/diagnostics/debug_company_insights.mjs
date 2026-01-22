import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function debugCompanyInsights() {
  console.log('🔍 Depurando problemas de company insights...\n');

  try {
    // 1. Verificar empresas existentes
    console.log('🏢 Verificando empresas existentes...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError);
      return;
    }

    console.log(`✅ Encontradas ${companies.length} empresas:`);
    companies.forEach(company => {
      console.log(`  - ID: ${company.id}, Nombre: "${company.name}"`);
    });
    console.log('');

    // 2. Verificar tabla company_insights
    console.log('📊 Verificando tabla company_insights...');
    const { data: insights, error: insightsError } = await supabase
      .from('company_insights')
      .select('*')
      .limit(5);

    if (insightsError) {
      console.error('❌ Error obteniendo insights:', insightsError.message);
      console.log('🔧 Intentando crear tabla company_insights...');

      // Crear tabla usando SQL directo
      const createSQL = `
        CREATE TABLE IF NOT EXISTS company_insights (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_name TEXT NOT NULL,
          insight_type TEXT NOT NULL,
          insight_category TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          confidence_score DECIMAL(3,2),
          data_source TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      try {
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createSQL });
        if (createError) {
          console.log('❌ Error creando tabla. Ejecuta manualmente en Supabase SQL Editor:');
          console.log(createSQL);
        } else {
          console.log('✅ Tabla company_insights creada');
        }
      } catch (rpcError) {
        console.log('❌ RPC no disponible. Ejecuta manualmente en Supabase SQL Editor:');
        console.log(createSQL);
      }
    } else {
      console.log(`✅ Tabla company_insights existe. Columnas:`, Object.keys(insights[0] || {}));
      console.log(`📈 Registros encontrados: ${insights.length}`);
    }
    console.log('');

    // 3. Probar búsqueda de empresas por nombre
    console.log('🔍 Probando búsqueda de empresas...');
    const testCompanyNames = ['CMPC', 'Copec', 'Colbun', 'Empresas SB', 'SQM'];

    for (const companyName of testCompanyNames) {
      console.log(`\n  Buscando: "${companyName}"`);

      // Búsqueda exacta
      const { data: exactMatch, error: exactError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('name', companyName);

      if (exactMatch && exactMatch.length > 0) {
        console.log(`    ✅ Encontrada por búsqueda exacta: ${exactMatch[0].name}`);
      } else {
        // Búsqueda con ilike
        const { data: ilikeMatch, error: ilikeError } = await supabase
          .from('companies')
          .select('id, name')
          .ilike('name', `%${companyName}%`);

        if (ilikeMatch && ilikeMatch.length > 0) {
          console.log(`    ✅ Encontrada por búsqueda parcial: ${ilikeMatch[0].name}`);
        } else {
          console.log(`    ❌ No encontrada: "${companyName}"`);
        }
      }
    }
    console.log('');

    // 4. Verificar configuración de Groq
    console.log('🤖 Verificando configuración de Groq...');
    const groqApiKey = process.env.REACT_APP_GROQ_API_KEY;

    if (!groqApiKey || groqApiKey === 'tu_groq_api_key_produccion') {
      console.log('❌ API Key de Groq no configurada o es placeholder');
      console.log('   Configura REACT_APP_GROQ_API_KEY en tu archivo .env');
    } else {
      console.log('✅ API Key de Groq configurada');

      // Probar conexión con Groq
      try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('✅ Conexión con Groq API exitosa');
        } else {
          console.log(`❌ Error en Groq API: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log('❌ Error conectando con Groq API:', error.message);
      }
    }

    console.log('\n🎯 RECOMENDACIONES:');
    console.log('1. Si la tabla company_insights no existe, créala usando el SQL proporcionado');
    console.log('2. Verifica que los nombres de empresas coincidan exactamente');
    console.log('3. Configura la API key de Groq correctamente');
    console.log('4. Reinicia el servidor después de los cambios');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar función
debugCompanyInsights().then(() => {
  console.log('\n🏁 Depuración completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});