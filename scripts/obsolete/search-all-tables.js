import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tmqglnycivlcjijoymwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchAllTables() {
  console.log('🔍 Buscando en TODAS las tablas de Supabase...');
  
  // Lista de posibles tablas donde podrían estar las empresas reales
  const allPossibleTables = [
    'companies',
    'empresas', 
    'company',
    'empresa',
    'organizations',
    'organization',
    'business',
    'businesses',
    'clients',
    'customers',
    'partners',
    'vendors',
    'suppliers'
  ];
  
  // Empresas que estamos buscando
  const targetCompanies = ['Copec', 'Hogar Alemán', 'Falabella', 'Cencosud', 'Entel', 'Movistar', 'Banco de Chile', 'Santander', 'BCI', 'Scotiabank', 'Itaú', 'Latam Airlines', 'Codelco', 'Ariztia', 'Inchcape', 'Achs'];
  
  console.log(`\n🎯 Buscando empresas: ${targetCompanies.join(', ')}`);
  
  for (const tableName of allPossibleTables) {
    try {
      console.log(`\n📋 Verificando tabla: ${tableName}`);
      
      // Intentar obtener la estructura y datos
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (error) {
        console.log(`   ❌ Tabla no accesible o no existe: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`   ✅ Tabla encontrada con ${data.length} registros`);
        console.log(`   📊 Columnas: ${Object.keys(data[0]).join(', ')}`);
        
        // Buscar empresas reales en esta tabla
        let foundCompanies = [];
        
        for (const company of targetCompanies) {
          try {
            // Intentar diferentes nombres de columnas
            const searchQueries = [
              `name.ilike.%${company}%`,
              `nombre.ilike.%${company}%`,
              `company_name.ilike.%${company}%`,
              `razon_social.ilike.%${company}%`,
              `business_name.ilike.%${company}%`
            ];
            
            for (const query of searchQueries) {
              const { data: found, error: searchError } = await supabase
                .from(tableName)
                .select('*')
                .or(query)
                .limit(3);
              
              if (!searchError && found && found.length > 0) {
                found.forEach(item => {
                  if (!foundCompanies.find(fc => fc.id === item.id)) {
                    foundCompanies.push(item);
                  }
                });
              }
            }
          } catch (err) {
            // Ignorar errores de búsqueda
          }
        }
        
        if (foundCompanies.length > 0) {
          console.log(`   🎯 ¡EMPRESAS REALES ENCONTRADAS en ${tableName}!`);
          foundCompanies.forEach((company, index) => {
            console.log(`     ${index + 1}. ${company.name || company.nombre || company.company_name || company.razon_social || 'Sin nombre'}`);
          });
        } else {
          console.log(`   ❌ No se encontraron empresas reales en esta tabla`);
          console.log(`   📝 Ejemplo de registro:`, data[0]);
        }
      } else {
        console.log(`   📂 Tabla vacía o sin datos`);
      }
      
    } catch (err) {
      console.log(`   ❌ Error verificando tabla ${tableName}:`, err.message);
    }
  }
  
  // También verificar si hay alguna tabla con información de "folders" o "carpetas"
  console.log(`\n📁 Buscando tablas relacionadas con carpetas (para el contador de 800):`);
  const folderTables = [
    'folders',
    'carpetas',
    'directories',
    'user_folders',
    'employee_folders',
    'company_folders'
  ];
  
  for (const tableName of folderTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        console.log(`   ✅ Tabla encontrada: ${tableName}`);
        console.log(`   📊 Columnas: ${Object.keys(data[0]).join(', ')}`);
        
        // Contar registros
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`   📈 Total de registros: ${count}`);
          if (count === 800) {
            console.log(`   🎯 ¡ESTA ES LA TABLA CON 800 REGISTROS!`);
          }
        }
      }
    } catch (err) {
      // Ignorar
    }
  }
}

// Ejecutar la búsqueda
searchAllTables();