import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseCompanyCards() {
  console.log('🔍 Diagnosticando carga de tarjetas de empresas...\n');
  
  try {
    // 1. Verificar empresas en base de datos
    console.log('1. Verificando empresas en Supabase...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });
    
    if (companiesError) {
      console.error('❌ Error obteniendo empresas:', companiesError.message);
      return;
    }
    
    console.log(`✅ Empresas encontradas: ${companies.length}`);
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (ID: ${company.id})`);
    });
    
    if (companies.length === 0) {
      console.log('⚠️  NO HAY EMPRESAS EN LA BASE DE DATOS');
      console.log('   Las tarjetas no se mostrarán porque no hay datos');
      return;
    }
    
    // 2. Verificar empleados
    console.log('\n2. Verificando empleados...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, company_id')
      .limit(10);
    
    if (employeesError) {
      console.error('❌ Error obteniendo empleados:', employeesError.message);
    } else {
      console.log(`✅ Empleados encontrados: ${employees.length} (mostrando primeros 10)`);
      
      // Contar por empresa
      const byCompany = {};
      employees.forEach(emp => {
        byCompany[emp.company_id] = (byCompany[emp.company_id] || 0) + 1;
      });
      console.log('   Distribución por empresa:', byCompany);
    }
    
    // 3. Simular la lógica de organizedDatabaseService.getCompaniesWithStats()
    console.log('\n3. Simulando generación de estadísticas...');
    
    const companiesWithStats = companies.map(company => {
      // Calcular estadísticas como lo hace el servicio
      const companyEmployees = employees?.filter(emp => emp.company_id === company.id) || [];
      const employeeCount = companyEmployees.length;
      
      // Estos son placeholders como en el servicio original
      const sentMessages = Math.floor(Math.random() * 1000) + 100;
      const readMessages = Math.floor(sentMessages * 0.8);
      const sentimentScore = (Math.random() - 0.5) * 2;
      const engagementRate = Math.floor(Math.random() * 30) + 70;
      
      return {
        ...company,
        employeeCount,
        sentMessages,
        readMessages,
        sentimentScore,
        engagementRate,
        scheduledMessages: Math.floor(Math.random() * 50),
        draftMessages: Math.floor(Math.random() * 20),
        nextScheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    });
    
    console.log(`✅ Empresas con estadísticas generadas: ${companiesWithStats.length}`);
    
    // 4. Verificar datos críticos para CompanyCard
    console.log('\n4. Verificando datos críticos para CompanyCard...');
    
    const requiredFields = ['id', 'name', 'employeeCount', 'sentMessages', 'readMessages', 'sentimentScore', 'engagementRate'];
    let hasInvalidData = false;
    
    companiesWithStats.forEach((company, index) => {
      const missingFields = requiredFields.filter(field => company[field] === undefined || company[field] === null);
      
      if (missingFields.length > 0) {
        console.error(`❌ Empresa ${index + 1} (${company.name}) - Campos faltantes: ${missingFields.join(', ')}`);
        hasInvalidData = true;
      }
      
      // Verificar datos inválidos
      if (company.sentimentScore > 1 || company.sentimentScore < -1) {
        console.warn(`⚠️  Empresa ${company.name} - Sentimiento inválido: ${company.sentimentScore}`);
      }
      
      if (company.employeeCount < 0 || company.employeeCount > 1000) {
        console.warn(`⚠️  Empresa ${company.name} - Número de empleados inválido: ${company.employeeCount}`);
      }
    });
    
    if (!hasInvalidData) {
      console.log('✅ Todos los datos críticos están presentes');
    }
    
    // 5. Resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`   - Empresas totales: ${companies.length}`);
    console.log(`   - Empleados totales: ${companiesWithStats.reduce((sum, c) => sum + c.employeeCount, 0)}`);
    console.log(`   - Mensajes totales: ${companiesWithStats.reduce((sum, c) => sum + c.sentMessages, 0)}`);
    
    if (companies.length > 0 && companiesWithStats.every(c => c.employeeCount >= 0)) {
      console.log('\n✅ CONCLUSIÓN: Los datos están disponibles y son válidos');
      console.log('   Las tarjetas deberían renderizarse correctamente');
      console.log('\n💡 Si no se ven en producción, el problema es en el frontend:');
      console.log('   - Error en el componente CompanyCard');
      console.log('   - Problema con CSS/transformaciones 3D');
      console.log('   - Error en DatabaseCompanySummary al pasar props');
    } else {
      console.log('\n❌ CONCLUSIÓN: Hay problemas con los datos');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

diagnoseCompanyCards();