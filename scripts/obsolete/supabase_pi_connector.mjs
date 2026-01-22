import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = 'https://supabase.staffhub.cl'
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_KEY no está definida en las variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Cliente Supabase inicializado')
console.log(`📍 URL: ${supabaseUrl}`)

// Funciones de utilidad para operaciones comunes

/**
 * Obtener todos los empleados
 */
export async function getEmployees() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
    
    if (error) throw error
    console.log(`✅ Empleados obtenidos: ${data.length}`)
    return data
  } catch (error) {
    console.error('❌ Error obteniendo empleados:', error.message)
    return null
  }
}

/**
 * Obtener todas las empresas
 */
export async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
    
    if (error) throw error
    console.log(`✅ Empresas obtenidas: ${data.length}`)
    return data
  } catch (error) {
    console.error('❌ Error obteniendo empresas:', error.message)
    return null
  }
}

/**
 * Crear carpeta para empleado
 */
export async function createEmployeeFolder(employeeEmail, employeeData) {
  try {
    const { data, error } = await supabase
      .from('employee_folders')
      .insert([{
        email: employeeEmail,
        employee_id: employeeData.id,
        employee_name: employeeData.name,
        employee_position: employeeData.position,
        employee_department: employeeData.department,
        company_id: employeeData.company_id,
        knowledge_base: {
          faqs: [],
          documents: [],
          policies: [],
          procedures: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
    
    if (error) throw error
    console.log(`✅ Carpeta creada para empleado: ${employeeEmail}`)
    return data
  } catch (error) {
    console.error(`❌ Error creando carpeta para ${employeeEmail}:`, error.message)
    return null
  }
}

/**
 * Actualizar carpeta de empleado
 */
export async function updateEmployeeFolder(employeeEmail, updates) {
  try {
    const { data, error } = await supabase
      .from('employee_folders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('email', employeeEmail)
    
    if (error) throw error
    console.log(`✅ Carpeta actualizada para empleado: ${employeeEmail}`)
    return data
  } catch (error) {
    console.error(`❌ Error actualizando carpeta para ${employeeEmail}:`, error.message)
    return null
  }
}

/**
 * Sincronizar carpetas de empleados
 */
export async function syncEmployeeFolders() {
  try {
    console.log('🔄 Iniciando sincronización de carpetas de empleados...')
    
    const employees = await getEmployees()
    if (!employees) return false
    
    let created = 0
    let updated = 0
    
    for (const employee of employees) {
      if (!employee.email) continue
      
      // Verificar si la carpeta ya existe
      const { data: existing } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('email', employee.email)
        .single()
      
      if (existing) {
        // Actualizar carpeta existente
        await updateEmployeeFolder(employee.email, {
          employee_name: employee.name,
          employee_position: employee.position,
          employee_department: employee.department
        })
        updated++
      } else {
        // Crear nueva carpeta
        await createEmployeeFolder(employee.email, employee)
        created++
      }
    }
    
    console.log(`✅ Sincronización completada: ${created} creadas, ${updated} actualizadas`)
    return true
  } catch (error) {
    console.error('❌ Error en sincronización:', error.message)
    return false
  }
}

/**
 * Obtener estadísticas
 */
export async function getStats() {
  try {
    const employees = await getEmployees()
    const companies = await getCompanies()
    
    const { data: folders } = await supabase
      .from('employee_folders')
      .select('*')
    
    return {
      employees: employees?.length || 0,
      companies: companies?.length || 0,
      folders: folders?.length || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message)
    return null
  }
}

// Exportar cliente Supabase para uso directo
export { supabase }

// Si se ejecuta directamente, mostrar menú interactivo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n📱 Conector Supabase para Raspberry Pi')
  console.log('=====================================\n')
  
  const command = process.argv[2]
  
  switch (command) {
    case 'sync':
      await syncEmployeeFolders()
      break
    case 'stats':
      const stats = await getStats()
      console.log('\n📊 Estadísticas:')
      console.log(JSON.stringify(stats, null, 2))
      break
    case 'employees':
      const emps = await getEmployees()
      console.log('\n👥 Empleados:')
      console.log(JSON.stringify(emps, null, 2))
      break
    case 'companies':
      const comps = await getCompanies()
      console.log('\n🏢 Empresas:')
      console.log(JSON.stringify(comps, null, 2))
      break
    default:
      console.log('Comandos disponibles:')
      console.log('  node supabase_pi_connector.mjs sync       - Sincronizar carpetas de empleados')
      console.log('  node supabase_pi_connector.mjs stats      - Mostrar estadísticas')
      console.log('  node supabase_pi_connector.mjs employees  - Listar empleados')
      console.log('  node supabase_pi_connector.mjs companies  - Listar empresas')
  }
}