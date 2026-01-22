/**
 * TEST DEL SERVICIO UNIFICADO ANTI-DUPLICACIÓN
 * Verifica que el nuevo sistema elimina completamente las duplicaciones
 */

import unifiedEmployeeFolderService from './src/services/unifiedEmployeeFolderService.js'
import superLockService from './src/lib/superLockService.js'

async function testUnifiedService() {
  console.log('🧪 INICIANDO TEST DEL SERVICIO UNIFICADO')
  console.log('=' * 50)

  try {
    // 1. TEST DE INICIALIZACIÓN
    console.log('\n1️⃣ TEST DE INICIALIZACIÓN')
    const initResult = await unifiedEmployeeFolderService.initialize()
    console.log(`✅ Inicialización: ${initResult ? 'EXITOSA' : 'FALLIDA'}`)

    // 2. TEST DE STATS INICIALES
    console.log('\n2️⃣ TEST DE ESTADÍSTICAS INICIALES')
    const initialStats = await unifiedEmployeeFolderService.getStats()
    console.log('📊 Estadísticas iniciales:', {
      totalFolders: initialStats.totalFolders,
      activeLocks: initialStats.lockStats.active,
      localCache: initialStats.lockStats.localCache,
      service: initialStats.service
    })

    // 3. TEST DE CREACIÓN DE CARPETA INDIVIDUAL
    console.log('\n3️⃣ TEST DE CREACIÓN INDIVIDUAL')
    const testEmployee = {
      id: 'test-123',
      email: 'test@empresa.com',
      name: 'Test Employee',
      position: 'Developer',
      department: 'IT',
      phone: '+1234567890',
      region: 'Santiago',
      level: 'Senior',
      work_mode: 'Remote',
      contract_type: 'Full-time',
      company_id: 'company-123'
    }

    console.log('🔄 Creando carpeta para empleado de prueba...')
    const result1 = await unifiedEmployeeFolderService.createEmployeeFolder(
      testEmployee.email, 
      testEmployee
    )
    
    console.log('📋 Resultado primera creación:', {
      created: result1.created,
      updated: result1.updated,
      alreadyExists: result1.alreadyExists,
      newlyCreated: result1.newlyCreated,
      alreadyExistedInDrive: result1.alreadyExistedInDrive
    })

    // 4. TEST DE DUPLICACIÓN (DEBE SER PREVENIDA)
    console.log('\n4️⃣ TEST DE PREVENCIÓN DE DUPLICACIÓN')
    console.log('🔄 Intentando crear la misma carpeta nuevamente...')
    
    const result2 = await unifiedEmployeeFolderService.createEmployeeFolder(
      testEmployee.email, 
      testEmployee
    )
    
    console.log('📋 Resultado segunda creación (debe ser prevented):', {
      created: result2.created,
      updated: result2.updated,
      alreadyExists: result2.alreadyExists,
      newlyCreated: result2.newlyCreated,
      alreadyExistedInDrive: result2.alreadyExistedInDrive
    })

    // 5. TEST DE LIMPIEZA DE DUPLICADOS
    console.log('\n5️⃣ TEST DE LIMPIEZA DE DUPLICADOS')
    const cleanupResult = await unifiedEmployeeFolderService.cleanupDuplicates()
    console.log('🧹 Resultado de limpieza:', cleanupResult)

    // 6. TEST DE STATS FINALES
    console.log('\n6️⃣ TEST DE ESTADÍSTICAS FINALES')
    const finalStats = await unifiedEmployeeFolderService.getStats()
    console.log('📊 Estadísticas finales:', {
      totalFolders: finalStats.totalFolders,
      activeLocks: finalStats.lockStats.active,
      localCache: finalStats.lockStats.localCache,
      service: finalStats.service
    })

    // 7. VERIFICACIÓN DE RESULTADOS
    console.log('\n7️⃣ VERIFICACIÓN DE RESULTADOS')
    const success = 
      initResult === true &&
      result1.created === true &&
      result2.alreadyExists === true &&
      finalStats.totalFolders >= 1 &&
      finalStats.lockStats.active === 0

    console.log('\n' + '=' * 50)
    if (success) {
      console.log('🎉 TEST EXITOSO: El servicio unificado previene duplicaciones')
      console.log('✅ Primera creación: EXITOSA')
      console.log('✅ Segunda creación: PREVENIDA (ya existe)')
      console.log('✅ Sistema de locks: FUNCIONANDO')
      console.log('✅ Estadísticas: CORRECTAS')
    } else {
      console.log('❌ TEST FALLIDO: Revisar logs arriba')
    }

    return success

  } catch (error) {
    console.error('❌ ERROR EN TEST:', error)
    return false
  }
}

// Ejecutar test si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testUnifiedService()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 ERROR FATAL:', error)
      process.exit(1)
    })
}

export { testUnifiedService }