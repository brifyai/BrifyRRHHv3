import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmqglnycivlcjijoymwe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE'
);

async function checkCategories() {
  try {
    console.log('🔍 Consultando categorías existentes en system_configurations...');
    
    // Consultar categorías existentes
    const { data: configs, error } = await supabase
      .from('system_configurations')
      .select('category')
      .limit(100);
    
    if (error) {
      console.log('❌ Error consultando categorías:', error.message);
      return;
    }
    
    if (!configs || configs.length === 0) {
      console.log('ℹ️ No hay configuraciones existentes en la tabla');
      return;
    }
    
    console.log('✅ Categorías existentes en la tabla:');
    const categories = [...new Set(configs.map(c => c.category))];
    console.log(categories);
    
    // Intentar insertar una configuración de prueba con categoría "system"
    console.log('\n🧪 Probando inserción con categoría "system"...');
    const { error: insertError } = await supabase
      .from('system_configurations')
      .insert({
        user_id: null,
        scope: 'global',
        company_id: null,
        category: 'system',
        config_key: 'test_category',
        config_value: 'test_value',
        description: 'Test category',
        is_active: true
      });
    
    if (insertError) {
      console.log('❌ Error insertando categoría "system":', insertError.message);
      console.log('Código de error:', insertError.code);
      
      // Intentar con una categoría que probablemente esté permitida
      console.log('\n🧪 Probando inserción con categoría "general"...');
      const { error: insertError2 } = await supabase
        .from('system_configurations')
        .insert({
          user_id: null,
          scope: 'global',
          company_id: null,
          category: 'general',
          config_key: 'test_category_2',
          config_value: 'test_value_2',
          description: 'Test category 2',
          is_active: true
        });
      
      if (insertError2) {
        console.log('❌ Error insertando categoría "general":', insertError2.message);
      } else {
        console.log('✅ Categoría "general" funciona correctamente');
        
        // Limpiar el registro de prueba
        await supabase
          .from('system_configurations')
          .delete()
          .eq('config_key', 'test_category_2');
      }
    } else {
      console.log('✅ Categoría "system" funciona correctamente');
      
      // Limpiar el registro de prueba
      await supabase
        .from('system_configurations')
        .delete()
        .eq('config_key', 'test_category');
    }
    
  } catch (err) {
    console.log('❌ Error general:', err.message);
  }
}

checkCategories();