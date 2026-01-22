/**
 * Script para configurar el usuario camiloalegriabarra@gmail.com en Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://supabase.staffhub.cl';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MjI0MzUsImV4cCI6MjA0ODQ5ODQzNX0.FQ1lW9VTRxDyQfBPZon81G7bE7tSvH_yjO3R_zAW1i0';

const supabase = createClient(supabaseUrl, supabaseKey);

const userEmail = 'camiloalegriabarra@gmail.com';
const userName = 'Camilo Alegría';
const userPassword = 'Camilo2024!'; // Contraseña temporal

async function setupUser() {
  console.log('🚀 Configurando usuario en Supabase...\n');
  console.log(`📧 Email: ${userEmail}`);
  console.log(`👤 Nombre: ${userName}`);
  console.log(`🔑 Contraseña temporal: ${userPassword}\n`);
  
  try {
    // 1. Intentar iniciar sesión para verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario existe...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    });
    
    if (loginData?.user && !loginError) {
      console.log('✅ El usuario ya existe y la contraseña es correcta');
      console.log(`   User ID: ${loginData.user.id}`);
      console.log(`   Email: ${loginData.user.email}`);
      console.log(`   Created: ${new Date(loginData.user.created_at).toLocaleString()}\n`);
      
      // Cerrar sesión
      await supabase.auth.signOut();
      
      console.log('✅ USUARIO LISTO PARA USAR');
      console.log('\n📋 CREDENCIALES:');
      console.log(`   Email: ${userEmail}`);
      console.log(`   Contraseña: ${userPassword}\n`);
      return;
    }
    
    // 2. Si no existe o la contraseña es incorrecta, intentar crear el usuario
    console.log('⚠️  Usuario no existe o contraseña incorrecta. Creando usuario...\n');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: userEmail,
      password: userPassword,
      options: {
        data: {
          full_name: userName,
          display_name: userName
        },
        emailRedirectTo: `${supabaseUrl}/auth/callback`
      }
    });
    
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  El usuario ya está registrado pero la contraseña es diferente.');
        console.log('\n📋 OPCIONES:');
        console.log('   1. Usa la contraseña correcta para este email');
        console.log('   2. O ve a Supabase Dashboard → Authentication → Users');
        console.log('      y resetea la contraseña manualmente\n');
        console.log('   URL: https://supabase.com/dashboard/project/tmqglnycivlcjijoymwe/auth/users\n');
        return;
      }
      throw signUpError;
    }
    
    if (signUpData?.user) {
      console.log('✅ Usuario creado exitosamente');
      console.log(`   User ID: ${signUpData.user.id}`);
      console.log(`   Email: ${signUpData.user.email}`);
      console.log(`   Confirmación requerida: ${signUpData.user.confirmed_at ? 'No' : 'Sí'}\n`);
      
      // Verificar si necesita confirmación de email
      if (!signUpData.user.confirmed_at) {
        console.log('📧 IMPORTANTE: Supabase puede requerir confirmación de email');
        console.log('   Opciones:');
        console.log('   1. Revisa el email de camiloalegriabarra@gmail.com');
        console.log('   2. O ve a Supabase Dashboard y confirma el usuario manualmente');
        console.log('   3. O desactiva la confirmación de email en Supabase:\n');
        console.log('      Dashboard → Authentication → Settings');
        console.log('      → Email Auth → Disable "Confirm email"\n');
      }
      
      // Cerrar sesión
      await supabase.auth.signOut();
      
      console.log('✅ USUARIO CONFIGURADO');
      console.log('\n📋 CREDENCIALES:');
      console.log(`   Email: ${userEmail}`);
      console.log(`   Contraseña: ${userPassword}\n`);
      
      console.log('🎯 SIGUIENTE PASO:');
      console.log('   1. Ve a http://localhost:3000');
      console.log('   2. Haz clic en "Iniciar Sesión"');
      console.log(`   3. Ingresa: ${userEmail}`);
      console.log(`   4. Contraseña: ${userPassword}`);
      console.log('   5. Ve a /configuracion/integraciones');
      console.log('   6. Configura Google Drive\n');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n⚠️  SOLUCIÓN ALTERNATIVA:');
    console.log('   Crea el usuario manualmente en Supabase Dashboard:');
    console.log('   1. Ve a: https://supabase.com/dashboard/project/tmqglnycivlcjijoymwe/auth/users');
    console.log('   2. Haz clic en "Add user" o "Create new user"');
    console.log(`   3. Email: ${userEmail}`);
    console.log('   4. Genera una contraseña');
    console.log('   5. Marca "Auto Confirm User"\n');
  }
}

setupUser();