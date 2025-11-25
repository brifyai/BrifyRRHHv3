/**
 * Punto de entrada consolidado para Supabase
 *
 * Este archivo sirve como una interfaz unificada que exporta todas las funcionalidades
 * de Supabase separadas en módulos distintos para mejor mantenibilidad.
 *
 * Arquitectura:
 * - supabaseClient.js: Configuración del cliente Supabase
 * - supabaseAuth.js: Funciones de autenticación
 * - supabaseDatabase.js: Funciones de base de datos
 */

// Importaciones para exportaciones por defecto
import { supabase } from './supabaseClient.js'
import { auth } from './supabaseAuth.js'
import { db } from './supabaseDatabase.js'

// Exportar el cliente y configuración
export { supabase, config } from './supabaseClient.js'

// Exportar funciones de autenticación
export { auth } from './supabaseAuth.js'

// Exportar funciones de base de datos
export { db } from './supabaseDatabase.js'

// Re-exportar como objeto por defecto para mantener compatibilidad
export default supabase

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