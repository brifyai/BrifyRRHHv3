#!/usr/bin/env node

/**
 * Script de inicialización de datos de empleados
 * 
 * Este script configura los datos de empleados iniciales para todas las empresas
 * y los sincroniza con las cantidades mostradas en el dashboard.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Nombres y apellidos comunes en Chile
const firstNames = [
  'Camila', 'Patricio', 'Víctor', 'Graciela', 'Jorge', 'Ricardo', 'Felipe', 'Arturo', 
  'Valentina', 'Isabel', 'César', 'Oscar', 'Carolina', 'Rodrigo', 'Francisco', 
  'Miguel', 'Alejandro', 'Daniela', 'Romina', 'Silvana', 'Guillermo', 'Fernanda', 
  'Claudia', 'Teresa', 'Víctor', 'Cristian', 'Diego', 'Natalia', 'Luis', 'Karina',
  'Andrés', 'Marcela', 'Verónica', 'Roberto', 'Tamara', 'Danielle', 'Macarena',
  'Sebastián', 'Pablo', 'Eduardo', 'Fernando', 'Constanza', 'Paulina', 'Catalina',
  'Ignacio', 'Renata', 'Matías', 'Camilo', 'Andrea', 'Nicole', 'José', 'Manuel'
];

const lastNames = [
  'Gutiérrez', 'Castro', 'Vargas', 'Reyes', 'Sepúlveda', 'Henríquez', 'Miranda',
  'López', 'Pizarro', 'Villarroel', 'Ramos', 'Morales', 'Álvarez', 'Cortés',
  'Rivera', 'Parra', 'Leiva', 'Silva', 'Fuentes', 'Zúñiga', 'Díaz', 'Muñoz',
  'Romero', 'Guzmán', 'Moraga', 'Contreras', 'Herrera', 'Roas', 'Aguilera',
  'Pérez', 'Sánchez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez',
  'García', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno'
];

const regions = [
  'Región de Tarapacá', 'Región de Antofagasta', 'Región de Atacama', 
  'Región de Coquimbo', 'Región de Valparaíso', 
  'Región del Libertador General Bernardo O\'Higgins', 'Región del Maule', 
  'Región de Ñuble', 'Región del Biobío', 'Región de La Araucanía', 
  'Región de Los Ríos', 'Región de Los Lagos', 
  'Región Aysén del General Carlos Ibáñez del Campo', 
  'Región de Magallanes y de la Antártica Chilena', 'Región Metropolitana'
];

const departments = [
  'Operaciones', 'TI', 'Seguridad', 'Producción', 'RRHH', 'Administración',
  'Planificación', 'Mantenimiento', 'Servicio al Cliente', 'Logística',
  'Investigación y Desarrollo', 'Contabilidad', 'Finanzas', 'Tesorería',
  'Marketing', 'Ventas', 'Auditoría', 'Legal', 'Calidad', 'Compras'
];

const levels = [
  'Asistente', 'Especialista', 'Supervisor', 'Coordinador', 
  'Jefatura', 'Gerente', 'Director', 'Operario'
];

const positions = [
  'Jefe de Operaciones', 'Desarrollador', 'Supervisor de Seguridad',
  'Jefe de Producción', 'Reclutador', 'Especialista en Seguridad',
  'Técnico de Soporte', 'Operario de Producción', 'Coordinador Administrativo',
  'Planificador', 'Administrativo', 'Gerente de Mantenimiento',
  'Ejecutivo de Servicio', 'Supervisor de Logística', 'Desarrollador de Producto',
  'Asistente Contable', 'Asistente de Calidad', 'Jefe Administrativo',
  'Jefe de Mantenimiento', 'Coordinador Administrativo', 'Gerente Contable',
  'Gerente Financiero', 'Asistente de Mantenimiento', 'Asistente Financiero',
  'Jefe de Calidad', 'Jefe de RRHH', 'Supervisor de Operaciones',
  'Analista de Tesorería', 'Supervisor de Producción', 'Especialista en Marketing',
  'Ejecutivo de Ventas', 'Jefe de Tesorería', 'Contador', 'Asistente de Auditoría',
  'Especialista en Cumplimiento', 'Asistente de Mantenimiento', 'Jefe de Logística',
  'Coordinador de Marketing', 'Gerente de Auditoría', 'Gerente Legal',
  'Gerente de Ventas', 'Asistente de Tesorería', 'Auditor Interno'
];

const workModes = ['Presencial', 'Híbrido', 'Remoto'];
const contractTypes = ['Indefinido', 'Plazo Fijo', 'Honorarios'];

// Generar un nombre aleatorio
function generateRandomName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Generar un email basado en el nombre y empresa
function generateEmail(name, companyName) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const cleanCompany = companyName.toLowerCase().replace(/\s+/g, '');
  return `${cleanName}@${cleanCompany}.cl`;
}

// Generar un teléfono aleatorio
function generatePhone() {
  const number = Math.floor(Math.random() * 10000000);
  return `+56 9 ${number.toString().padStart(8, '0')}`;
}

// Generar datos de empleado aleatorios
function generateEmployeeData(companyId, companyName) {
  const name = generateRandomName();
  return {
    company_id: companyId,
    name: name,
    email: generateEmail(name, companyName),
    phone: generatePhone(),
    region: regions[Math.floor(Math.random() * regions.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    work_mode: workModes[Math.floor(Math.random() * workModes.length)],
    contract_type: contractTypes[Math.floor(Math.random() * contractTypes.length)],
    is_active: true,
    has_subordinates: Math.random() > 0.7
  };
}

// Obtener todas las empresas
async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    throw error;
  }
}

// Obtener conteo de empleados por empresa
async function getEmployeeCountByCompany(companyId) {
  try {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error obteniendo conteo de empleados:', error);
    throw error;
  }
}

// Generar empleados para una empresa
async function generateEmployeesForCompany(companyId, companyName, count) {
  try {
    console.log(`Generando ${count} empleados para ${companyName}...`);
    
    const employeesData = [];
    for (let i = 0; i < count; i++) {
      employeesData.push(generateEmployeeData(companyId, companyName));
    }
    
    // Insertar en lotes de 100
    for (let i = 0; i < employeesData.length; i += 100) {
      const batch = employeesData.slice(i, i + 100);
      const { error } = await supabase
        .from('employees')
        .insert(batch);
      
      if (error) throw error;
    }
    
    console.log(`✓ ${count} empleados generados para ${companyName}`);
  } catch (error) {
    console.error(`Error generando empleados para ${companyName}:`, error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando configuración de datos de empleados...\n');
    
    // Obtener todas las empresas
    const companies = await getCompanies();
    console.log(`📊 Encontradas ${companies.length} empresas\n`);
    
    // Para cada empresa, generar entre 50 y 300 empleados
    for (const company of companies) {
      // Verificar si ya existen empleados para esta empresa
      const currentCount = await getEmployeeCountByCompany(company.id);
      
      if (currentCount === 0) {
        // Generar empleados si no hay ninguno
        const employeeCount = Math.floor(Math.random() * 250) + 50;
        await generateEmployeesForCompany(company.id, company.name, employeeCount);
      } else {
        console.log(`⚠️  ${company.name} ya tiene ${currentCount} empleados, omitiendo...`);
      }
    }
    
    console.log('\n✅ Configuración completada exitosamente!');
    console.log('📊 Resumen:');
    
    // Mostrar resumen final
    for (const company of companies) {
      const count = await getEmployeeCountByCompany(company.id);
      console.log(`  • ${company.name}: ${count} empleados`);
    }
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateEmployeeData,
  getCompanies,
  getEmployeeCountByCompany,
  generateEmployeesForCompany
};