import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://supabase.staffhub.cl';
const supabaseKey = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   REACT_APP_SUPABASE_URL:', supabaseUrl);
  console.error('   SUPABASE_KEY:', supabaseKey ? '***' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking if employee_folders table exists...');
    
    const { data, error } = await supabase
      .from('employee_folders')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Table does not exist:', error.message);
      return false;
    }

    console.log('✅ employee_folders table exists');
    return true;

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Employee Folders Database Setup\n');

  // First check if tables exist
  const tablesExist = await checkTables();

  if (!tablesExist) {
    console.log('\n⚠️  Tables do not exist in Supabase.');
    console.log('\n📋 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Create new query');
    console.log('   5. Copy content from database/employee_folders_setup.sql');
    console.log('   6. Execute');
    console.log('\n📌 This is required to create:');
    console.log('   - employee_folders');
    console.log('   - employee_documents');
    console.log('   - employee_faqs');
    console.log('   - employee_conversations');
    console.log('   - employee_notification_settings');
  } else {
    console.log('\n✅ All tables are ready!');
  }
}

main().catch(console.error);
