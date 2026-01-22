/**
 * Auditoría y Reparación de Duplicaciones de Carpetas
 * Script para diagnosticar y limpiar duplicaciones en employee_folders
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

// Cargar variables de entorno
config();

// Configuración de Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

class DuplicateFolderAuditor {
  constructor() {
    this.duplicates = [];
    this.orphaned = [];
    this.fixed = 0;
    this.errors = [];
  }

  async audit() {
    console.log('🔍 Iniciando auditoría completa de duplicaciones...\n');
    
    try {
      // 1. Obtener todos los registros
      const { data: allFolders, error } = await supabase
        .from('employee_folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo carpetas: ${error.message}`);
      }

      console.log(`📊 Total de registros encontrados: ${allFolders.length}\n`);

      // 2. Identificar duplicados por email
      const emailGroups = {};
      allFolders.forEach(folder => {
        const email = folder.employee_email;
        if (!emailGroups[email]) {
          emailGroups[email] = [];
        }
        emailGroups[email].push(folder);
      });

      // 3. Analizar cada grupo
      for (const [email, folders] of Object.entries(emailGroups)) {
        if (folders.length > 1) {
          console.log(`⚠️ DUPLICACIÓN ENCONTRADA: ${email} (${folders.length} registros)`);
          
          // Mostrar detalles de cada duplicado
          folders.forEach((folder, index) => {
            console.log(`  ${index + 1}. ID: ${folder.id}`);
            console.log(`     Drive ID: ${folder.drive_folder_id || 'NULL'}`);
            console.log(`     Creado: ${folder.created_at}`);
            console.log(`     Actualizado: ${folder.updated_at}`);
            console.log(`     Estado: ${folder.folder_status}`);
          });

          // Seleccionar el registro principal (el más reciente o con drive_folder_id)
          const principal = this.selectPrincipalRecord(folders);
          const duplicates = folders.filter(f => f.id !== principal.id);
          
          console.log(`🎯 Registro principal seleccionado: ID ${principal.id}`);
          console.log(`🗑️ Registros a eliminar: ${duplicates.map(d => d.id).join(', ')}\n`);
          
          this.duplicates.push({
            email,
            principal,
            duplicates,
            total: folders.length
          });
        }
      }

      // 4. Buscar carpetas huérfanas en Drive (sin drive_folder_id)
      const withoutDriveId = allFolders.filter(f => !f.drive_folder_id);
      if (withoutDriveId.length > 0) {
        console.log(`📂 Carpetas sin drive_folder_id: ${withoutDriveId.length}`);
        this.orphaned = withoutDriveId;
      }

      // 5. Resumen
      console.log('\n📋 RESUMEN DE AUDITORÍA:');
      console.log(`- Total de registros: ${allFolders.length}`);
      console.log(`- Emails con duplicaciones: ${this.duplicates.length}`);
      console.log(`- Total de duplicados: ${this.duplicates.reduce((sum, d) => sum + d.duplicates.length, 0)}`);
      console.log(`- Carpetas sin drive_folder_id: ${this.orphaned.length}`);
      
      return {
        total: allFolders.length,
        duplicates: this.duplicates,
        orphaned: this.orphaned,
        summary: {
          duplicateEmails: this.duplicates.length,
          totalDuplicates: this.duplicates.reduce((sum, d) => sum + d.duplicates.length, 0),
          orphanedFolders: this.orphaned.length
        }
      };

    } catch (error) {
      console.error('❌ Error en auditoría:', error.message);
      throw error;
    }
  }

  selectPrincipalRecord(folders) {
    // Criterios para seleccionar el registro principal:
    // 1. Tiene drive_folder_id
    // 2. Es el más reciente
    // 3. Está activo
    
    const withDriveId = folders.filter(f => f.drive_folder_id);
    if (withDriveId.length > 0) {
      // Entre los que tienen drive_folder_id, seleccionar el más reciente
      return withDriveId.reduce((newest, current) => 
        new Date(current.updated_at) > new Date(newest.updated_at) ? current : newest
      );
    }
    
    // Si nadie tiene drive_folder_id, seleccionar el más reciente
    return folders.reduce((newest, current) => 
      new Date(current.updated_at) > new Date(newest.updated_at) ? current : newest
    );
  }

  async fixDuplicates(dryRun = true) {
    console.log(`\n🔧 ${dryRun ? 'MODO SIMULACIÓN' : 'REPARANDO'} duplicaciones...\n`);
    
    for (const duplicate of this.duplicates) {
      try {
        console.log(`📧 Procesando: ${duplicate.email}`);
        
        for (const dup of duplicate.duplicates) {
          if (dryRun) {
            console.log(`  🔄 [SIMULACIÓN] Se eliminaría: ID ${dup.id}`);
          } else {
            console.log(`  🗑️ Eliminando: ID ${dup.id}`);
            
            const { error } = await supabase
              .from('employee_folders')
              .delete()
              .eq('id', dup.id);
            
            if (error) {
              throw new Error(`Error eliminando ${dup.id}: ${error.message}`);
            }
            
            this.fixed++;
          }
        }
        
        console.log(`  ✅ Mantenido: ID ${duplicate.principal.id}\n`);
        
      } catch (error) {
        console.error(`❌ Error procesando ${duplicate.email}:`, error.message);
        this.errors.push({ email: duplicate.email, error: error.message });
      }
    }
    
    console.log(`\n📊 Resultados ${dryRun ? 'de simulación' : 'de reparación'}:`);
    console.log(`- Registros ${dryRun ? 'que se eliminarían' : 'eliminados'}: ${dryRun ? this.duplicates.reduce((sum, d) => sum + d.duplicates.length, 0) : this.fixed}`);
    console.log(`- Errores: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      this.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      audit: await this.audit(),
      recommendations: this.generateRecommendations()
    };
    
    // Guardar reporte en archivo
    const reportPath = `duplicate_folders_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Reporte guardado en: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.duplicates.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Duplicaciones detectadas',
        solution: 'Ejecutar reparación para eliminar registros duplicados',
        action: 'node audit_and_fix_duplicates.js --fix'
      });
    }
    
    if (this.orphaned.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Carpetas sin drive_folder_id',
        solution: 'Sincronizar con Google Drive para asignar drive_folder_id',
        action: 'Usar "Sincronizar con Drive" en la interfaz'
      });
    }
    
    if (this.duplicates.length === 0 && this.orphaned.length === 0) {
      recommendations.push({
        priority: 'INFO',
        issue: 'Sin problemas detectados',
        solution: 'Sistema funciona correctamente',
        action: 'Continuar monitoreando regularmente'
      });
    }
    
    return recommendations;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');
  const dryRun = !fixMode;
  
  console.log('🚀 Herramienta de Auditoría y Reparación de Carpetas Duplicadas');
  console.log(`📋 Modo: ${fixMode ? 'REPARACIÓN' : 'SIMULACIÓN'}\n`);
  
  const auditor = new DuplicateFolderAuditor();
  
  try {
    // Generar reporte completo
    await auditor.generateReport();
    
    // Mostrar duplicaciones encontradas
    if (auditor.duplicates.length > 0) {
      console.log('\n⚠️ SE ENCONTRARON DUPLICACIONES');
      await auditor.fixDuplicates(dryRun);
    } else {
      console.log('\n✅ NO SE ENCONTRARON DUPLICACIONES');
    }
    
    // Mostrar recomendaciones
    const recommendations = auditor.generateRecommendations();
    console.log('\n💡 RECOMENDACIONES:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Solución: ${rec.solution}`);
      if (rec.action) {
        console.log(`   Acción: ${rec.action}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = DuplicateFolderAuditor;