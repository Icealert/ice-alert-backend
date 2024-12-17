const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Initializing schema application...');
console.log('Environment check:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
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
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('Schema file path:', schemaPath);
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file read successfully');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    console.log('\nApplying schema changes...');
    for (const statement of statements) {
      try {
        console.log('\nExecuting statement:', statement.substring(0, 100) + '...');
        
        // Execute the SQL statement directly using service role
        const { data, error } = await supabase.auth.admin.executeRawQuery(statement);

        if (error) {
          console.error('Error executing statement:', error);
          if (!error.message.includes('already exists')) {
            errorCount++;
            console.error('Statement failed:', statement);
            console.error('Error details:', error);
          } else {
            console.log('Table/Index already exists, continuing...');
            successCount++;
          }
        } else {
          console.log('Statement executed successfully');
          successCount++;
        }
      } catch (error) {
        console.error('Error executing statement:', error);
        if (!error.message.includes('already exists')) {
          errorCount++;
          console.error('Statement failed:', statement);
          console.error('Error details:', error);
        } else {
          console.log('Table/Index already exists, continuing...');
          successCount++;
        }
      }
    }

    console.log('\nSchema application completed!');
    console.log(`Results: ${successCount} successful, ${errorCount} failed`);

    if (errorCount > 0) {
      throw new Error(`Schema application completed with ${errorCount} errors`);
    }

  } catch (error) {
    console.error('Fatal error during schema application:', error);
    process.exit(1);
  }
}

// Run the schema application
console.log('Starting schema application...');
applySchema()
  .then(() => {
    console.log('Schema application completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema application failed:', error);
    process.exit(1);
  }); 