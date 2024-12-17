const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Initializing schema application...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Environment check:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('- SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

function normalizeSQL(sql) {
  // Replace Windows line endings with Unix line endings and normalize whitespace
  return sql
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

async function executeSQLDirect(statement) {
  try {
    const normalizedStatement = normalizeSQL(statement);
    console.log('Executing SQL:', normalizedStatement.substring(0, 100) + '...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: normalizedStatement
      })
    });

    const text = await response.text();
    console.log('Response:', text);

    if (!response.ok) {
      try {
        const error = JSON.parse(text);
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('is already member of publication') ||
          error.message.includes('does not exist')
        )) {
          console.log('Object already exists or does not exist yet, continuing...');
          return null;
        }
        throw new Error(JSON.stringify(error));
      } catch (e) {
        throw new Error(text);
      }
    }

    console.log('SQL execution successful');
    return text;
  } catch (error) {
    if (error.message && (
      error.message.includes('already exists') ||
      error.message.includes('is already member of publication') ||
      error.message.includes('does not exist')
    )) {
      console.log('Object already exists or does not exist yet, continuing...');
      return null;
    }
    console.error('SQL execution error:', error);
    throw error;
  }
}

function splitSQLStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let inDollarQuote = false;
  let dollarQuoteTag = '';
  let escaped = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';

    if (escaped) {
      currentStatement += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      currentStatement += char;
      escaped = true;
      continue;
    }

    if (char === "'" && !inDollarQuote) {
      inString = !inString;
    } else if (char === '$' && nextChar === '$' && !inString && !inDollarQuote) {
      inDollarQuote = true;
      dollarQuoteTag = '$$';
      currentStatement += char;
    } else if (char === '$' && !inString && !inDollarQuote) {
      // Check for custom dollar quote tag
      let tag = '$';
      let j = i + 1;
      while (j < sql.length && sql[j] !== '$') {
        tag += sql[j];
        j++;
      }
      if (j < sql.length && sql[j] === '$') {
        tag += '$';
        inDollarQuote = true;
        dollarQuoteTag = tag;
        currentStatement += tag;
        i = j;
        continue;
      }
    } else if (inDollarQuote && sql.substring(i, i + dollarQuoteTag.length) === dollarQuoteTag) {
      inDollarQuote = false;
      currentStatement += dollarQuoteTag;
      i += dollarQuoteTag.length - 1;
      continue;
    }

    if (char === ';' && !inString && !inDollarQuote) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

async function applySchema() {
  try {
    console.log('Starting schema application...');

    // First, create the exec_sql function
    console.log('Creating exec_sql function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(query text)
      RETURNS text AS $func$
      BEGIN
          EXECUTE query;
          RETURN 'OK';
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Execute the function creation directly
    await executeSQLDirect(createFunctionSQL);

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = splitSQLStatements(schemaSql);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (const statement of statements) {
      try {
        await executeSQLDirect(statement);
        console.log('Statement executed successfully');
      } catch (error) {
        if (!error.message?.includes('already exists') && 
            !error.message?.includes('is already member of publication') &&
            !error.message?.includes('does not exist')) {
          throw error;
        }
      }
    }

    // Read and execute migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log('Found migration files:', migrationFiles);

      for (const migrationFile of migrationFiles) {
        console.log(`Applying migration: ${migrationFile}`);
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        const migrationStatements = splitSQLStatements(migrationSql);

        for (const statement of migrationStatements) {
          try {
            await executeSQLDirect(statement);
            console.log('Migration statement executed successfully');
          } catch (error) {
            if (!error.message?.includes('already exists') && 
                !error.message?.includes('is already member of publication') &&
                !error.message?.includes('does not exist')) {
              throw error;
            }
          }
        }
      }
    }

    // Apply constraints
    console.log('Applying constraints...');
    
    // Add unique constraint to device_settings table
    await executeSQLDirect(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_constraint
              WHERE conname = 'device_settings_icealert_id_key'
          ) THEN
              ALTER TABLE device_settings ADD CONSTRAINT device_settings_icealert_id_key UNIQUE (icealert_id);
          END IF;
      END $$;
    `);

    // Add primary key if it doesn't exist
    await executeSQLDirect(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_constraint
              WHERE conname = 'device_settings_pkey'
          ) THEN
              ALTER TABLE device_settings ADD PRIMARY KEY (id);
          END IF;
      END $$;
    `);

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