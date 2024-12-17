const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Initializing schema application...');

const supabaseUrl = 'https://xxdjtvevvszefsvgjwye.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZGp0dmV2dnN6ZWZzdmdqd3llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE3NDg1OSwiZXhwIjoyMDQ5NzUwODU5fQ.Qbwr5OqyCUiw-fCZG3dx6pSKXDrqi1PObiIiJlpJqgc';

console.log('Environment check:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('- SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

async function executeSQL(statement) {
  try {
    console.log('Executing statement:', statement);
    const { data, error } = await supabase.rpc('exec_sql', {
      query: statement
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Object already exists, continuing...');
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Object already exists, continuing...');
      return null;
    }
    console.error('SQL execution error:', error);
    throw error;
  }
}

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
        await executeSQL(statement);
        console.log('Statement executed successfully');
        successCount++;
      } catch (error) {
        console.error('Error executing statement:', error);
        if (!error.message.includes('already exists')) {
          errorCount++;
          console.error('Statement failed:', statement);
          console.error('Error details:', error);
        } else {
          console.log('Object already exists, continuing...');
          successCount++;
        }
      }
    }

    console.log('\nSchema application completed!');
    console.log(`Results: ${successCount} successful, ${errorCount} failed`);

    if (errorCount > 0) {
      throw new Error(`Schema application completed with ${errorCount} errors`);
    }

    // Verify tables were created
    console.log('\nVerifying schema...');
    const verificationStatements = [
      'SELECT COUNT(*) FROM device_settings',
      'SELECT COUNT(*) FROM device_data'
    ];

    for (const statement of verificationStatements) {
      try {
        console.log(`Executing verification: ${statement}`);
        const result = await executeSQL(statement);
        console.log('Verification result:', result);
      } catch (error) {
        console.error('Verification failed:', error);
        throw error;
      }
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