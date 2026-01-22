import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testInsightsFix() {
  console.log('🧪 Probando corrección de insights...\n');

  try {
    // 1. Verificar que las empresas existen
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
    companies.slice(0, 5).forEach(company => {
      console.log(`  - "${company.name}"`);
    });
    console.log('');

    // 2. Verificar tabla company_insights
    console.log('📊 Verificando tabla company_insights...');
    const { data: insights, error: insightsError } = await supabase
      .from('company_insights')
      .select('*')
      .limit(1);

    if (insightsError) {
      console.error('❌ Error accediendo a tabla company_insights:', insightsError.message);
      console.log('🔧 Intentando crear tabla...');

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
      console.log('✅ Tabla company_insights existe y es accesible');
    }
    console.log('');

    // 3. Probar búsqueda de empresa específica
    const testCompany = companies[0]; // Primera empresa
    console.log(`🔍 Probando búsqueda para "${testCompany.name}"...`);

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', `%${testCompany.name}%`)
      .maybeSingle();

    if (companyError) {
      console.error('❌ Error buscando empresa:', companyError);
    } else if (companyData) {
      console.log('✅ Empresa encontrada correctamente');
      console.log(`  ID: ${companyData.id}`);
      console.log(`  Nombre: ${companyData.name}`);
    } else {
      console.log('❌ Empresa no encontrada');
    }
    console.log('');

    // 4. Probar inserción de insights de ejemplo
    console.log('📝 Probando inserción de insights de ejemplo...');

    const sampleInsights = [
      {
        company_name: testCompany.name,
        insight_type: 'front',
        insight_category: 'positive',
        title: 'Sistema funcionando correctamente',
        description: 'Los insights se están generando sin errores de API',
        confidence_score: 0.95,
        data_source: 'system_test'
      },
      {
        company_name: testCompany.name,
        insight_type: 'back',
        insight_category: 'info',
        title: 'Configuración pendiente',
        description: 'Configure la API key de Groq para insights con IA',
        confidence_score: 0.80,
        data_source: 'system_test'
      }
    ];

    const { data: insertedData, error: insertError } = await supabase
      .from('company_insights')
      .insert(sampleInsights)
      .select();

    if (insertError) {
      console.error('❌ Error insertando insights:', insertError.message);
    } else {
      console.log('✅ Insights de ejemplo insertados correctamente');
      console.log(`  Insertados: ${insertedData?.length || 0} registros`);
    }
    console.log('');

    // 5. Probar consulta de insights existentes
    console.log('📊 Probando consulta de insights existentes...');

    const { data: existingInsights, error: queryError } = await supabase
      .from('company_insights')
      .select('*')
      .eq('company_name', testCompany.name)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('❌ Error consultando insights:', queryError.message);
    } else {
      console.log(`✅ Consulta exitosa. Encontrados: ${existingInsights?.length || 0} insights`);
      if (existingInsights && existingInsights.length > 0) {
        console.log('📋 Insights encontrados:');
        existingInsights.forEach((insight, index) => {
          console.log(`  ${index + 1}. ${insight.title} (${insight.insight_type})`);
        });
      }
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar función
testInsightsFix().then(() => {
  console.log('\n🏁 Prueba finalizada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});