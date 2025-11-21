/**
 * CORRECCIÓN INMEDIATA: Método registerNonGmailEmployee con verificación anti-duplicación
 * Este archivo contiene la corrección para el problema de duplicados en non_gmail_employees
 */

import { supabase } from '../lib/supabaseClient.js';
import logger from '../lib/logger.js';

class GoogleDriveSyncServiceFixed {
  /**
   * MÉTODO CORREGIDO: Registra empleado con email no-Gmail en Supabase
   * CON VERIFICACIÓN ANTI-DUPLICACIÓN
   */
  async registerNonGmailEmployee(employeeEmail, employeeName, companyName, employeeData = {}) {
    try {
      logger.info('GoogleDriveSyncService', `📝 Registrando empleado no-Gmail: ${employeeEmail}`);
      
      // 🔒 PASO 1: VERIFICAR SI YA EXISTE
      const { data: existingEmployee } = await supabase
        .from('non_gmail_employees')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle();

      if (existingEmployee) {
        logger.info('GoogleDriveSyncService', `✅ Empleado no-Gmail ya existe: ${employeeEmail}`);
        return existingEmployee;
      }

      // 📝 PASO 2: CREAR NUEVO REGISTRO
      const nonGmailData = {
        employee_email: employeeEmail,
        employee_name: employeeName,
        company_name: companyName,
        email_type: 'non_gmail',
        reason: 'Email no es de Gmail, no se puede compartir carpeta de Google Drive',
        employee_data: employeeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('non_gmail_employees')
        .insert(nonGmailData)
        .select()
        .single();

      if (error) {
        logger.error('GoogleDriveSyncService', `❌ Error registrando empleado no-Gmail: ${error.message}`);
        
        // 🔄 PASO 3: MANEJO DE ERRORES DE DUPLICADO
        if (error.code === '23505') { // PostgreSQL duplicate key error
          logger.warn('GoogleDriveSyncService', `⚠️ Empleado ya existe (código 23505), obteniendo registro existente: ${employeeEmail}`);
          
          const { data: retryData } = await supabase
            .from('non_gmail_employees')
            .select('*')
            .eq('employee_email', employeeEmail)
            .maybeSingle();
          
          if (retryData) {
            return retryData;
          }
        }
        
        throw error;
      }

      logger.info('GoogleDriveSyncService', `✅ Empleado no-Gmail registrado: ${employeeEmail}`);
      return data;
      
    } catch (error) {
      logger.error('GoogleDriveSyncService', `❌ Error en registerNonGmailEmployee: ${error.message}`);
      throw error;
    }
  }

  /**
   * MÉTODO AUXILIAR: Limpiar duplicados existentes en non_gmail_employees
   */
  async cleanupNonGmailDuplicates() {
    try {
      logger.info('GoogleDriveSyncService', '🧹 Limpiando duplicados en non_gmail_employees...');
      
      // Obtener todos los registros
      const { data: allEmployees, error } = await supabase
        .from('non_gmail_employees')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Agrupar por email
      const emailGroups = {};
      allEmployees.forEach(emp => {
        if (!emailGroups[emp.employee_email]) {
          emailGroups[emp.employee_email] = [];
        }
        emailGroups[emp.employee_email].push(emp);
      });
      
      let cleanedCount = 0;
      
      // Procesar duplicados
      for (const [email, employees] of Object.entries(emailGroups)) {
        if (employees.length > 1) {
          logger.info('GoogleDriveSyncService', `🔍 Duplicados encontrados para ${email}: ${employees.length}`);
          
          // Mantener el más reciente, eliminar los demás
          const sortedEmployees = employees.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          const keepEmployee = sortedEmployees[0];
          const deleteEmployees = sortedEmployees.slice(1);
          
          // Eliminar duplicados
          for (const empToDelete of deleteEmployees) {
            try {
              await supabase
                .from('non_gmail_employees')
                .delete()
                .eq('id', empToDelete.id);
              
              cleanedCount++;
              logger.info('GoogleDriveSyncService', `🗑️ Eliminado duplicado: ${empToDelete.id}`);
            } catch (deleteError) {
              logger.error('GoogleDriveSyncService', `❌ Error eliminando duplicado ${empToDelete.id}:`, deleteError);
            }
          }
        }
      }
      
      logger.info('GoogleDriveSyncService', `✅ Limpieza completada: ${cleanedCount} duplicados eliminados`);
      return cleanedCount;
      
    } catch (error) {
      logger.error('GoogleDriveSyncService', '❌ Error durante limpieza de duplicados:', error);
      throw error;
    }
  }
}

// Exportar la clase corregida
export default GoogleDriveSyncServiceFixed;