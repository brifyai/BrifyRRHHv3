/**
 * Script para agregar la columna phone a la tabla employees y actualizar los datos
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addPhoneColumnAndUpdate() {
  try {
    console.log('🔍 Iniciando proceso de agregar columna phone y actualizar teléfonos...');
    
    // 1. Agregar la columna phone usando SQL raw
    console.log('\n📝 Agregando columna phone a la tabla employees...');
    const { error: alterError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;' 
      });
    
    // Si RPC no funciona, intentaremos con el método directo
    if (alterError) {
      console.log('⚠️ No se pudo usar RPC para agregar la columna. Esto es normal si no tienes el RPC configurado.');
      console.log('📝 Por favor, ejecuta manualmente el SQL en tu panel de Supabase:');
      console.log('ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;');
      
      // Esperar un momento para que el usuario pueda ejecutar el SQL manualmente
      console.log('\n⏳ Esperando 10 segundos para que puedas ejecutar el SQL manualmente...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('✅ Columna phone agregada exitosamente');
    }
    
    // 2. Verificar que la columna existe
    console.log('\n🔍 Verificando que la columna phone existe...');
    const { data: testEmployee, error: testError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, phone')
      .limit(1);
    
    if (testError && testError.message.includes('column "phone" does not exist')) {
      console.error('❌ La columna phone aún no existe. Por favor ejecuta el SQL manualmente en Supabase:');
      console.log('ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;');
      return;
    }
    
    if (testError) {
      console.error('❌ Error verificando la columna:', testError);
      return;
    }
    
    console.log('✅ Columna phone verificada exitosamente');
    
    // 3. Obtener todos los empleados
    console.log('\n📊 Obteniendo todos los empleados...');
    const { data: allEmployees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, phone');
    
    if (fetchError) {
      console.error('❌ Error obteniendo empleados:', fetchError);
      return;
    }
    
    console.log(`📋 Total de empleados: ${allEmployees.length}`);
    
    // 4. Filtrar empleados sin teléfono
    const employeesToUpdate = allEmployees.filter(emp => 
      !emp.phone || emp.phone === '' || emp.phone === 'No especificado'
    );
    
    console.log(`📝 Empleados sin teléfono: ${employeesToUpdate.length}`);
    
    if (employeesToUpdate.length === 0) {
      console.log('✅ Todos los empleados ya tienen teléfono. No se necesita actualizar.');
      return;
    }
    
    // 5. Generar teléfonos móviles chilenos y actualizar
    let updatedCount = 0;
    const batchSize = 50; // Procesar en lotes para evitar timeouts
    
    console.log(`📱 Actualizando ${employeesToUpdate.length} empleados...`);
    
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
        if (result.status === 'fulfilled' && !result.value.error) {
          updatedCount++;
          if (updatedCount <= 10) { // Mostrar solo los primeros 10 como ejemplo
            const fullName = `${batch[index].first_name || ''} ${batch[index].last_name || ''}`.trim() || 'Sin nombre';
            console.log(`📱 ${fullName}: ${batch[index].email} -> +56 9 XXXXXXXX`);
          }
        } else {
          const fullName = `${batch[index].first_name || ''} ${batch[index].last_name || ''}`.trim() || 'Sin nombre';
          console.error(`❌ Error actualizando empleado ${fullName}:`, result.reason || result.value?.error);
        }
      });
      
      // Mostrar progreso
      if ((i + batchSize) % 100 === 0 || i + batchSize >= employeesToUpdate.length) {
        console.log(`📊 Progreso: ${Math.min(i + batchSize, employeesToUpdate.length)}/${employeesToUpdate.length} empleados procesados`);
      }
      
      // Pequeña pausa entre lotes para no sobrecargar la BD
      if (i + batchSize < employeesToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 6. Verificar resultado final
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
    
    // 7. Mostrar ejemplos de teléfonos agregados
    console.log('\n📋 Ejemplos de teléfonos agregados:');
    const { data: examples, error: examplesError } = await supabase
      .from('employees')
      .select('first_name, last_name, email, phone')
      .like('phone', '+56 9%')
      .limit(5);
    
    if (!examplesError && examples) {
      examples.forEach(emp => {
        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Sin nombre';
        console.log(`  📱 ${fullName}: ${emp.phone}`);
      });
    }
    
    console.log('\n✅ ¡Proceso completado! Ahora los empleados deberían mostrar sus teléfonos en la interfaz.');
    
  } catch (error) {
    console.error('❌ Error general en el proceso:', error);
  }
}

// Ejecutar el script
addPhoneColumnAndUpdate().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});