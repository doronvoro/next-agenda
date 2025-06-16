import { createClient } from '../src/lib/supabase/client';

async function checkDatabase() {
  const supabase = createClient();

  try {
    // Check connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth Status:', authError ? 'Error' : 'Connected');
    if (authError) {
      console.error('Auth Error:', authError.message);
      return;
    }

    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError.message);
      return;
    }

    console.log('\nAvailable Tables:');
    console.log(tables);

    // Check protocols table structure
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .limit(1);

    if (protocolsError) {
      console.error('\nError fetching protocols:', protocolsError.message);
    } else {
      console.log('\nProtocols Table Structure:');
      console.log(protocols);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkDatabase(); 