/**
 * Script to debug database connection issues
 * Run this to test Supabase connection and check if companies table has data
 */

import { createClient } from '@supabase/supabase-js';

// Test connection with the same config as production
const SUPABASE_URL = 'https://tmqglnycivlcjijoymwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWdsbnljaXZsY2ppam95bXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTQ1NDYsImV4cCI6MjA3NjEzMDU0Nn0.ILwxm7pKdFZtG-Xz8niMSHaTwMvE4S7VlU8yDSgxOpE';

console.log('🔍 Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugConnection() {
  try {
    console.log('\n📡 Testing basic connection...');
    
    // Test connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth check:', { data: !!authData, error: !!authError });
    
    console.log('\n📊 Testing companies table...');
    const { data: companies, error: companiesError, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: false })
      .order('name', { ascending: true });
    
    console.log('Companies query result:', {
      error: !!companiesError,
      errorMessage: companiesError?.message,
      count: companies?.length,
      data: companies
    });
    
    if (companiesError) {
      console.error('❌ Companies query error:', companiesError);
      return;
    }
    
    if (companies && companies.length > 0) {
      console.log(`✅ Found ${companies.length} companies:`);
      companies.forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`);
      });
    } else {
      console.log('⚠️ No companies found in database');
      
      console.log('\n📋 Checking table structure...');
      // Check if table exists and has columns
      const { data: structure, error: structureError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
      
      console.log('Table structure check:', {
        error: !!structureError,
        errorMessage: structureError?.message,
        hasStructure: !!structure
      });
    }
    
    console.log('\n📧 Testing employees table...');
    const { data: employees, error: employeesError, count: employeesCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    console.log('Employees query result:', {
      error: !!employeesError,
      errorMessage: employeesError?.message,
      count: employeesCount
    });
    
    // Test RLS policies
    console.log('\n🔐 Testing RLS policies...');
    try {
      // Try a simple query to see if RLS is blocking
      const { error: rlsError } = await supabase
        .from('companies')
        .select('count')
        .single();
      
      console.log('RLS test:', {
        error: !!rlsError,
        errorMessage: rlsError?.message,
        code: rlsError?.code
      });
    } catch (e) {
      console.log('RLS test failed:', e.message);
    }
    
    console.log('\n✅ Connection test completed');
    
  } catch (error) {
    console.error('❌ Critical error:', error);
  }
}

// Run the debug
debugConnection();