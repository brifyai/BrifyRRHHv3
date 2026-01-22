/**
 * Script para agregar números de teléfono móviles a los 800 empleados
 * Versión simplificada con require
 */

// Cargar variables de entorno
require('dotenv').config();

// Importar Supabase
const { createClient } = require('@supabase/supabase-js');

// Crear cliente Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEmployeePhones() {
  try {
    console.log('🔍 Iniciando actualización de teléfonos de empleados...');
    
    // 1. Obtener todos los empleados para verificar sus teléfonos
    console.log('\n📊 Obteniendo todos los empleados...');
    const { data: allEmployees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, phone');
    
    if (fetchError) {
      console.error('❌ Error obteniendo empleados:', fetchError);
      return;
    }
    
    console.log(`📋 Total de empleados: ${allEmployees.length}`);
    
    // 2. Filtrar empleados sin teléfono
    const employeesToUpdate = allEmployees.filter(emp =>
      !emp.phone || emp.phone === '' || emp.phone === 'No especificado'
    );
    
    console.log(`📝 Empleados sin teléfono: ${employeesToUpdate.length}`);
    
    if (employeesToUpdate.length === 0) {
      console.log('✅ Todos los empleados ya tienen teléfono. No se necesita actualizar.');
      return;
    }
    
    if (fetchError) {
      console.error('❌ Error obteniendo empleados sin teléfono:', fetchError);
      return;
    }
    
    console.log(`📝 Se actualizarán ${employeesToUpdate.length} empleados...`);
    
    // 3. Generar teléfonos móviles chilenos y actualizar
    let updatedCount = 0;
    const batchSize = 50; // Procesar en lotes para evitar timeouts
    
    for (let i = 0; i < employeesToUpdate.length; i += batchSize) {
      const batch = employeesToUpdate.slice(i, i + batchSize);
      
      const updatePromises = batch.map(async (employee) => {
        // Generar número móvil chileno: +56 9 XXXXXXXX
        const phoneNumber = '+56 9 ' + 
          Math.floor(Math.random() * 10).toString() + 
          Math.floor(Math.random() * 10000000).toString().padStart(8, '0');
        
        return supabase
          .from('employees')
          .update({ phone: phoneNumber })
          .eq('id', employee.id);
      });
      
      const results = await Promise.allSettled(updatePromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          updatedCount++;
          if (updatedCount <= 10) { // Mostrar solo los primeros 10 como ejemplo
              const fullName = `${batch[index].first_name || ''} ${batch[index].last_name || ''}`.trim() || 'Sin nombre';
              console.log(`📱 ${fullName}: ${batch[index].email} -> ${batch[index].phone || 'SIN TELÉFONO'}`);
          }
        } else {
          console.error(`❌ Error actualizando empleado ${batch[index].name}:`, result.reason);
        }
      });
      
      // Pequeña pausa entre lotes para no sobrecargar la BD
      if (i + batchSize < employeesToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n✅ Verificando resultado final...');
    const { count: employeesWithPhone, error: finalCountError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .not('phone', 'is', null)
      .neq('phone', '')
      .neq('phone', 'No especificado');
    
    if (finalCountError) {
      console.error('❌ Error contando empleados con teléfono:', finalCountError);
    } else {
      console.log(`🎉 ¡Actualización completada!`);
      console.log(`📊 Empleados actualizados: ${updatedCount}`);
      console.log(`📊 Total empleados con teléfono: ${employeesWithPhone}`);
    }
    
    // 5. Mostrar ejemplos de teléfonos agregados
    console.log('\n📋 Ejemplos de teléfonos agregados:');
    const { data: examples, error: examplesError } = await supabase
      .from('employees')
      .select('name, email, phone')
      .like('phone', '+56 9%')
      .limit(5);
    
    if (!examplesError && examples) {
      examples.forEach(emp => {
        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Sin nombre';
        console.log(`  📱 ${fullName}: ${emp.phone}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general en la actualización:', error);
  }
}

// Ejecutar el script
updateEmployeePhones().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});