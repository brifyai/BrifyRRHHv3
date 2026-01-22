import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://supabase.staffhub.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function listCompanies() {
  try {
    console.log('🏢 Listando empresas existentes...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, description, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error consultando empresas:', error.message);
      return;
    }
    
    if (!companies || companies.length === 0) {
      console.log('ℹ️ No hay empresas en la base de datos');
      return;
    }
    
    console.log(`✅ Se encontraron ${companies.length} empresas:`);
    console.log('');
    
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Estado: ${company.status}`);
      console.log(`   Descripción: ${company.description || 'Sin descripción'}`);
      console.log(`   Creada: ${new Date(company.created_at).toLocaleDateString('es-ES')}`);
      console.log('');
    });
    
    console.log('🎯 URLs para acceder a configuración por empresa:');
    console.log('');
    
    companies.forEach((company, index) => {
      console.log(`${index + 1}. Configuración de ${company.name}:`);
      console.log(`   http://localhost:3000/configuracion/empresas/${company.id}/integraciones`);
      console.log('');
    });
    
    console.log('🌐 Configuración Global:');
    console.log('   http://localhost:3000/configuracion/integraciones');
    console.log('');
    
    console.log('📋 Para ver la configuración por empresa:');
    console.log('1. Ve a la sección "Empresas" en configuración');
    console.log('2. Haz clic en una empresa específica');
    console.log('3. O navega directamente a la URL de la empresa');
    
  } catch (err) {
    console.log('❌ Error general:', err.message);
  }
}

listCompanies();