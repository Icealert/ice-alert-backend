const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

async function applySchema() {
  try {
    console.log('Reading schema file...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Applying schema changes...');
    for (const statement of statements) {
      try {
        console.log('\nExecuting statement:', statement.substring(0, 100) + '...');
        
        // Execute the SQL statement directly
        const { data, error } = await supabase
          .from('schema_migrations')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code === '42P01') {
          // Table doesn't exist, create it
          await supabase.from('schema_migrations').insert([
            { version: '1', applied_at: new Date().toISOString() }
          ]);
        }

        // Execute the actual schema statement
        const { error: queryError } = await supabase.auth.admin.executeSql(statement);

        if (queryError) {
          console.error('Error executing statement:', queryError);
          if (!queryError.message.includes('already exists')) {
            throw queryError;
          }
        } else {
          console.log('Statement executed successfully');
        }
      } catch (error) {
        console.error('Error executing statement:', error);
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('\nSchema application completed!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the schema application
applySchema(); 