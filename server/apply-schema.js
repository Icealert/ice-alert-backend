const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Initializing schema application...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

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
    console.log('Starting schema application...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying base schema...');
    await executeSQL(schemaSql);

    // Read and execute migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Execute migrations in alphabetical order

      console.log('Found migration files:', migrationFiles);

      for (const migrationFile of migrationFiles) {
        console.log(`Applying migration: ${migrationFile}`);
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        await executeSQL(migrationSql);
      }
    } else {
      console.log('No migrations directory found');
    }

    // Verify schema
    console.log('\nVerifying schema...');
    const verificationStatements = [
      'SELECT COUNT(*) FROM device_settings',
      'SELECT COUNT(*) FROM device_data',
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'device_settings'"
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

    console.log('Schema application completed successfully');
  } catch (error) {
    console.error('Fatal error during schema application:', error);
    process.exit(1);
  }
}

// Run the schema application
applySchema().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 