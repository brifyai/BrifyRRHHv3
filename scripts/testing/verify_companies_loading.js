// Script para verificar si las empresas están cargando correctamente
// Ejecutar desde Developer Tools (F12) en https://brifyrrhhv2.netlify.app/base-de-datos

// Verificar variables de entorno
console.log('🌍 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'OK' : 'MISSING');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');

// Verificar si el componente de empresas se renderizó
setTimeout(() => {
  console.log('🔍 DOM Check:');
  const selectElements = document.querySelectorAll('select');
  console.log('Select elements found:', selectElements.length);
  
  selectElements.forEach((select, index) => {
    console.log(`Select ${index + 1}:`, {
      options: select.options.length,
      value: select.value,
      firstOption: select.options[0]?.text
    });
  });
  
  // Buscar específicamente el selector de empresas
  const companySelect = Array.from(document.querySelectorAll('select')).find(
    select => select.options[0]?.text === 'Todas las empresas'
  );
  
  if (companySelect) {
    console.log('✅ Company selector found:', {
      options: companySelect.options.length,
      hasCompanies: companySelect.options.length > 1,
      companies: Array.from(companySelect.options).slice(1).map(opt => opt.text)
    });
  } else {
    console.log('❌ Company selector NOT found');
  }
}, 3000);

// Test directo de Supabase
setTimeout(async () => {
  console.log('🧪 Direct Supabase Test:');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('status', 'active')
      .order('name', { ascending: true });
    
    if (error) {
      console.log('❌ Supabase query error:', error);
    } else {
      console.log('✅ Supabase query success:', {
        count: data?.length || 0,
        companies: data?.map(c => c.name) || []
      });
    }
  } catch (e) {
    console.log('❌ Supabase test failed:', e.message);
  }
}, 5000);

console.log('🕐 Check completed. Results will appear in 3-5 seconds.');