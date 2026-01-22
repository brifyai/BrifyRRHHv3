#!/usr/bin/env node
/**
 * Script para crear usuario Camilo Alegria en Supabase
 * Ejecutar: node create_user_camilo.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://supabase.staffhub.cl';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY; // Service Role Key

// Datos del usuario
const USER_DATA = {
  email: 'camiloalegriabarra@gmail.com',
  password: 'Antonito26$',
  full_name: 'Camilo Alegria',
  role: 'admin'
};

async function createUser() {
  console.log('🚀 Iniciando creación de usuario...\n');

  // Validar que tenemos la service key
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_KEY no está configurada en .env');
    console.log('💡 Agrega tu Service Role Key en el archivo .env:');
    console.log('   SUPABASE_KEY=tu_service_role_key_aqui\n');
    process.exit(1);
  }

  // Crear cliente de Supabase con service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📧 Email:', USER_DATA.email);
    console.log('👤 Nombre:', USER_DATA.full_name);
    console.log('🔑 Rol:', USER_DATA.role);
    console.log('');

    // Crear usuario usando Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: USER_DATA.email,
      password: USER_DATA.password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: USER_DATA.full_name
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  El usuario ya existe en auth.users');
        
        // Obtener el usuario existente
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === USER_DATA.email);
        
        if (existingUser) {
          console.log('✅ Usuario encontrado con ID:', existingUser.id);
          
          // Actualizar metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                full_name: USER_DATA.full_name
              }
            }
          );
          
          if (!updateError) {
            console.log('✅ Metadata actualizada');
          }
          
          // Intentar crear/actualizar en tabla users
          await createOrUpdateUserProfile(supabase, existingUser.id);
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuario creado en auth.users');
      console.log('   ID:', authData.user.id);
      console.log('   Email:', authData.user.email);
      console.log('   Email confirmado:', authData.user.email_confirmed_at ? 'Sí' : 'No');
      console.log('');

      // Crear perfil en tabla users
      await createOrUpdateUserProfile(supabase, authData.user.id);
    }

    console.log('\n🎉 ¡Usuario listo!');
    console.log('\n📝 Credenciales de acceso:');
    console.log('   Email:', USER_DATA.email);
    console.log('   Contraseña:', USER_DATA.password);
    console.log('\n🌐 Puede iniciar sesión en:');
    console.log('   Local: http://localhost:3004');
    console.log('   Producción: Tu dominio de producción');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  }
}

async function createOrUpdateUserProfile(supabase, userId) {
  try {
    // Verificar si la tabla users existe
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .single();

    if (!tables) {
      console.log('⚠️  Tabla public.users no existe, saltando creación de perfil');
      return;
    }

    // Intentar insertar en tabla users
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: USER_DATA.email,
        full_name: USER_DATA.full_name,
        role: USER_DATA.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.log('⚠️  No se pudo crear perfil en public.users:', error.message);
    } else {
      console.log('✅ Perfil creado en public.users');
    }
  } catch (error) {
    console.log('⚠️  Error al crear perfil:', error.message);
  }
}

// Ejecutar
createUser();
