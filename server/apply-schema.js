const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

console.log('Initializing schema application...');
console.log('Environment check:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing');

async function executeSQL(statement) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  try {
    console.log(`Executing SQL at ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql_query: statement
      })
    });

    const responseText = await response.text();
    console.log('Response:', responseText);

    if (!response.ok) {
      if (responseText.includes('already exists')) {
        console.log('Object already exists, continuing...');
        return null;
      }
      throw new Error(`SQL execution failed: ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : null;
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
        console.log('\nExecuting statement:', statement);
        
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