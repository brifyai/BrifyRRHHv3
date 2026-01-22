#!/usr/bin/env node

/**
 * Script para poblar la base de datos con empresas de ejemplo
 * Ejecutar: node seed_companies.mjs
 */

import { supabase } from './src/lib/supabaseClient.js'

// Datos de empresas de ejemplo
const companies = [
  {
    name: 'Tech Solutions Chile',
    description: 'Empresa de tecnología especializada en soluciones empresariales y desarrollo de software a medida',
    industry: 'Tecnología',
    status: 'active',
    telegram_bot: 'https://t.me/techsolutions_bot',
    whatsapp_number: '+56912345678',
    email_enabled: true,
    email_sender_name: 'Tech Solutions',
    email_sender_email: 'contacto@techsolutions.cl',
    email_reply_to: 'soporte@techsolutions.cl',
    sms_enabled: true,
    sms_sender_name: 'TechSol',
    sms_sender_phone: '+56987654321',
    telegram_enabled: true,
    telegram_bot_token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    telegram_bot_username: '@techsolutions_bot',
    whatsapp_enabled: true,
    whatsapp_access_token: 'EAAGBGHshdfuashdfuashdfuashdfuashdfu',
    whatsapp_phone_number_id: '123456789012345',
    whatsapp_webhook_verify_token: 'webhook_token_techsolutions',
    groq_enabled: true,
    groq_api_key: 'gsk_1234567890abcdef',
    groq_model: 'gemma2-9b-it',
    groq_temperature: 0.7,
    groq_max_tokens: 800
  },
  {
    name: 'Marketing Digital Pro',
    description: 'Agencia de marketing digital especializada en campañas publicitarias y gestión de redes sociales',
    industry: 'Marketing',
    status: 'active',
    telegram_bot: 'https://t.me/marketingpro_bot',
    whatsapp_number: '+56923456789',
    email_enabled: true,
    email_sender_name: 'Marketing Pro',
    email_sender_email: 'info@marketingpro.cl',
    email_reply_to: 'contacto@marketingpro.cl',
    sms_enabled: false,
    telegram_enabled: true,
    telegram_bot_token: '234567:BCD-EFG2345hiJkl-abc68X3y2z234fx22',
    telegram_bot_username: '@marketingpro_bot',
    whatsapp_enabled: true,
    whatsapp_access_token: 'EAAGBGHshdfuashdfuashdfuashdfuashdfv',
    whatsapp_phone_number_id: '234567890123456',
    whatsapp_webhook_verify_token: 'webhook_token_marketingpro',
    groq_enabled: true,
    groq_api_key: 'gsk_2345678901abcdef',
    groq_model: 'llama3-8b-8192',
    groq_temperature: 0.8,
    groq_max_tokens: 1000
  },
  {
    name: 'Consultoría Estratégica',
    description: 'Consultoría empresarial especializada en transformación digital y optimización de procesos',
    industry: 'Consultoría',
    status: 'active',
    telegram_bot: 'https://t.me/consultoria_bot',
    whatsapp_number: '+56934567890',
    email_enabled: true,
    email_sender_name: 'Consultoría Estratégica',
    email_sender_email: 'hola@consultoriaestrategica.cl',
    email_reply_to: 'consultas@consultoriaestrategica.cl',
    sms_enabled: true,
    sms_sender_name: 'ConsEst',
    sms_sender_phone: '+56976543210',
    telegram_enabled: false,
    whatsapp_enabled: true,
    whatsapp_access_token: 'EAAGBGHshdfuashdfuashdfuashdfuashdfw',
    whatsapp_phone_number_id: '345678901234567',
    whatsapp_webhook_verify_token: 'webhook_token_consultoria',
    groq_enabled: false
  },
  {
    name: 'E-commerce Store',
    description: 'Tienda online de productos electrónicos y tecnología con envío a todo Chile',
    industry: 'E-commerce',
    status: 'active',
    telegram_bot: 'https://t.me/ecommercestore_bot',
    whatsapp_number: '+56945678901',
    email_enabled: true,
    email_sender_name: 'E-commerce Store',
    email_sender_email: 'ventas@ecommercestore.cl',
    email_reply_to: 'soporte@ecommercestore.cl',
    sms_enabled: true,
    sms_sender_name: 'EcomStore',
    sms_sender_phone: '+56965432109',
    telegram_enabled: true,
    telegram_bot_token: '456789:EFG-HIJ3456jkLmn-def79Y4z3a345gy33',
    telegram_bot_username: '@ecommercestore_bot',
    whatsapp_enabled: true,
    whatsapp_access_token: 'EAAGBGHshdfuashdfuashdfuashdfuashdfx',
    whatsapp_phone_number_id: '456789012345678',
    whatsapp_webhook_verify_token: 'webhook_token_ecommerce',
    groq_enabled: true,
    groq_api_key: 'gsk_4567890123abcdef',
    groq_model: 'mixtral-8x7b-32768',
    groq_temperature: 0.6,
    groq_max_tokens: 1200
  },
  {
    name: 'Servicios Financieros',
    description: 'Asesoría financiera y gestión de inversiones para empresas y particulares',
    industry: 'Finanzas',
    status: 'inactive',
    telegram_bot: 'https://t.me/finanzas_bot',
    whatsapp_number: '+56956789012',
    email_enabled: true,
    email_sender_name: 'Servicios Financieros',
    email_sender_email: 'contacto@serviciosfinancieros.cl',
    email_reply_to: 'asesoria@serviciosfinancieros.cl',
    sms_enabled: false,
    telegram_enabled: false,
    whatsapp_enabled: true,
    whatsapp_access_token: 'EAAGBGHshdfuashdfuashdfuashdfuashdfy',
    whatsapp_phone_number_id: '567890123456789',
    whatsapp_webhook_verify_token: 'webhook_token_finanzas',
    groq_enabled: true,
    groq_api_key: 'gsk_5678901234abcdef',
    groq_model: 'llama3-70b-8192',
    groq_temperature: 0.5,
    groq_max_tokens: 1500
  }
]

async function seedCompanies() {
  console.log('🌱 Iniciando seed de empresas...')
  
  try {
    // Verificar conexión a Supabase
    const { data: existingCompanies, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('❌ Error verificando conexión:', checkError)
      return
    }

    if (existingCompanies && existingCompanies.length > 0) {
      console.log('⚠️  La tabla companies ya contiene datos. ¿Deseas continuar y agregar más empresas?')
      console.log('   Ejecuta: node seed_companies.mjs --force')
      return
    }

    console.log(`✅ Conexión exitosa. Creando ${companies.length} empresas...`)

    // Insertar empresas
    const { data: insertedCompanies, error: insertError } = await supabase
      .from('companies')
      .insert(companies)
      .select()

    if (insertError) {
      console.error('❌ Error insertando empresas:', insertError)
      console.error('Detalles:', insertError.details)
      console.error('Mensaje:', insertError.message)
      return
    }

    console.log(`✅ Éxito! ${insertedCompanies.length} empresas creadas:`)
    insertedCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.industry}) - ID: ${company.id}`)
    })

    console.log('\n🎉 Seed completado exitosamente!')
    console.log('\n📋 Próximos pasos:')
    console.log('   1. Inicia tu aplicación: npm start')
    console.log('   2. Ve a Configuración → Empresas')
    console.log('   3. Verás las empresas listadas y podrás gestionarlas')
    console.log('\n🔍 Para verificar los datos insertados:')
    console.log('   node -e "import(\"./src/lib/supabaseClient.js\").then(m => m.supabase.from(\"companies\").select().then(r => console.log(r.data)))"')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedCompanies()
}

export { seedCompanies, companies }