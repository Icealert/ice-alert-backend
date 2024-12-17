const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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
      console.log('\nExecuting statement:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error('Error executing statement:', error);
        // Continue with other statements
        continue;
      }

      console.log('Statement executed successfully');
    }

    console.log('\nSchema application completed!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the schema application
applySchema(); 