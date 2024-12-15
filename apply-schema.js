import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = 'https://xxdjtvevszefsvgjwye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZGp0dmV2c3plZnN2Z2p3eWUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMDY5NzE5OCwiZXhwIjoyMDI2MjczMTk4fQ.Wd-GYHQPXMxWvBWXPqPgPBJvKEeqwdXMWKB_LB8qBkE';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applySchema() {
  try {
    console.log('Reading schema file...');
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Applying schema changes...');
    for (const statement of statements) {
      console.log('\nExecuting statement:', statement.substring(0, 100) + '...');
      const { data, error } = await supabase.rpc('exec_sql', {
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