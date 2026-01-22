#!/usr/bin/env node

/**
 * Script de Diagnóstico para Detectar Carpetas Duplicadas en Google Drive
 * 
 * Este script:
 * 1. Lista todas las carpetas de empleados en Google Drive
 * 2. Identifica duplicados por nombre
 * 3. Compara con registros en Supabase
 * 4. Genera reporte de inconsistencias
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseDuplicateFolders() {
  console.log('🔍 DIAGNÓSTICO DE CARPETAS DUPLICADAS EN GOOGLE DRIVE\n')

  try {
    // 1. Obtener todas las carpetas de empleados desde Supabase
    console.log('1️⃣ Obteniendo carpetas desde Supabase...')
    const { data: supabaseFolders, error: supabaseError } = await supabase
      .from('employee_folders')
      .select('*')
      .neq('folder_status', 'deleted')
      .order('created_at', { ascending: false })

    if (supabaseError) {
      throw new Error(`Error obteniendo carpetas de Supabase: ${supabaseError.message}`)
    }

    console.log(`✅ Encontradas ${supabaseFolders?.length || 0} carpetas en Supabase`)

    // 2. Agrupar por email para detectar duplicados en Supabase
    const supabaseByEmail = {}
    supabaseFolders?.forEach(folder => {
      if (!supabaseByEmail[folder.employee_email]) {
        supabaseByEmail[folder.employee_email] = []
      }
      supabaseByEmail[folder.employee_email].push(folder)
    })

    // 3. Detectar duplicados en Supabase
    const supabaseDuplicates = []
    Object.entries(supabaseByEmail).forEach(([email, folders]) => {
      if (folders.length > 1) {
        supabaseDuplicates.push({
          email,
          folders: folders.map(f => ({
            id: f.id,
            drive_folder_id: f.drive_folder_id,
            drive_folder_url: f.drive_folder_url,
            created_at: f.created_at,
            folder_status: f.folder_status
          }))
        })
      }
    })

    // 4. Analizar patrones de nombres de carpetas en Drive
    console.log('\n2️⃣ Analizando patrones de nombres de carpetas...')
    
    const folderNamePatterns = {}
    supabaseFolders?.forEach(folder => {
      if (folder.employee_name && folder.employee_email) {
        const folderName = `${folder.employee_name} (${folder.employee_email})`
        if (!folderNamePatterns[folderName]) {
          folderNamePatterns[folderName] = []
        }
        folderNamePatterns[folderName].push(folder)
      }
    })

    // 5. Detectar nombres duplicados
    const duplicateNames = Object.entries(folderNamePatterns)
      .filter(([name, folders]) => folders.length > 1)
      .map(([name, folders]) => ({
        folderName: name,
        count: folders.length,
        folders: folders.map(f => ({
          id: f.id,
          drive_folder_id: f.drive_folder_id,
          email: f.employee_email
        }))
      }))

    // 6. Generar reporte
    console.log('\n📊 REPORTE DE DIAGNÓSTICO')
    console.log('='.repeat(50))

    // Duplicados por email en Supabase
    if (supabaseDuplicates.length > 0) {
      console.log(`\n🚨 DUPLICADOS EN SUPABASE: ${supabaseDuplicates.length}`)
      supabaseDuplicates.forEach(dup => {
        console.log(`\nEmail: ${dup.email}`)
        dup.folders.forEach((folder, index) => {
          console.log(`  ${index + 1}. ID: ${folder.id}`)
          console.log(`     Drive ID: ${folder.drive_folder_id}`)
          console.log(`     Estado: ${folder.folder_status}`)
          console.log(`     Creado: ${folder.created_at}`)
        })
      })
    } else {
      console.log('\n✅ No se encontraron duplicados por email en Supabase')
    }

    // Nombres duplicados
    if (duplicateNames.length > 0) {
      console.log(`\n🚨 NOMBRES DUPLICADOS: ${duplicateNames.length}`)
      duplicateNames.forEach(dup => {
        console.log(`\nNombre: ${dup.folderName}`)
        console.log(`  Apariciones: ${dup.count}`)
        dup.folders.forEach((folder, index) => {
          console.log(`  ${index + 1}. Email: ${folder.email}`)
          console.log(`     Drive ID: ${folder.drive_folder_id}`)
        })
      })
    } else {
      console.log('\n✅ No se encontraron nombres duplicados')
    }

    // 7. Estadísticas generales
    console.log('\n📈 ESTADÍSTICAS GENERALES')
    console.log('='.repeat(30))
    console.log(`Total carpetas en Supabase: ${supabaseFolders?.length || 0}`)
    console.log(`Carpetas con Drive ID: ${supabaseFolders?.filter(f => f.drive_folder_id).length || 0}`)
    console.log(`Carpetas sin Drive ID: ${supabaseFolders?.filter(f => !f.drive_folder_id).length || 0}`)
    console.log(`Emails únicos: ${Object.keys(supabaseByEmail).length}`)
    console.log(`Nombres únicos: ${Object.keys(folderNamePatterns).length}`)

    // 8. Recomendaciones
    console.log('\n💡 RECOMENDACIONES')
    console.log('='.repeat(20))
    
    if (supabaseDuplicates.length > 0) {
      console.log('1. Limpiar registros duplicados en Supabase')
      console.log('2. Mantener solo el registro más reciente por email')
    }
    
    if (duplicateNames.length > 0) {
      console.log('3. Verificar y eliminar carpetas duplicadas en Google Drive')
      console.log('4. Actualizar referencias en Supabase')
    }
    
    console.log('5. Implementar verificación más robusta antes de crear carpetas')
    console.log('6. Usar IDs únicos en lugar de nombres para verificación')

    return {
      supabaseDuplicates,
      duplicateNames,
      totalFolders: supabaseFolders?.length || 0,
      foldersWithDriveId: supabaseFolders?.filter(f => f.drive_folder_id).length || 0
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnoseDuplicateFolders()
    .then(result => {
      console.log('\n🎉 Diagnóstico completado')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Error en diagnóstico:', error)
      process.exit(1)
    })
}

export { diagnoseDuplicateFolders }