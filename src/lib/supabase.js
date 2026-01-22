/**
 * Punto de entrada consolidado para Supabase
 *
 * Este archivo sirve como una interfaz unificada que exporta todas las funcionalidades
 * de Supabase separadas en módulos distintos para mejor mantenibilidad.
 *
 * Arquitectura:
 * - supabaseClient.js: Configuración del cliente Supabase
 * - customAuthService.js: Autenticación personalizada (NO usa Supabase Auth)
 * - supabaseDatabase.js: Funciones de base de datos
 */

// Importaciones para exportaciones por defecto
import { supabase } from './supabaseClient.js'
import { customAuth } from '../services/customAuthService.js'
import { db } from './supabaseDatabase.js'

// Exportar el cliente y configuración
export { supabase, config } from './supabaseClient.js'

// Exportar autenticación personalizada como 'auth' para compatibilidad
export { customAuth as auth } from '../services/customAuthService.js'

// Exportar funciones de base de datos
export { db } from './supabaseDatabase.js'

// Crear objeto con nombre para exportación por defecto
const supabaseModule = {
  supabase,
  auth: customAuth,
  db
}

// Re-exportar como objeto por defecto para mantener compatibilidad
export default supabaseModule

/**
 * Guía de uso:
 *
 * Importación individual:
 * import { supabase } from './lib/supabase.js'
 * import { auth } from './lib/supabase.js'
 * import { db } from './lib/supabase.js'
 *
 * Importación completa:
 * import supabaseModule from './lib/supabase.js'
 * const { supabase, auth, db } = supabaseModule
 *
 * Importación directa de módulos:
 * import { supabase } from './lib/supabaseClient.js'
 * import { auth } from './lib/supabaseAuth.js'
 * import { db } from './lib/supabaseDatabase.js'
 */