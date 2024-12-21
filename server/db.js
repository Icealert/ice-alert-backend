const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabaseUrl = 'https://xxdjtvevvszefsvgjwye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZGp0dmV2dnN6ZWZzdmdqd3llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE3NDg1OSwiZXhwIjoyMDQ5NzUwODU5fQ.Qbwr5OqyCUiw-fCZG3dx6pSKXDrqi1PObiIiJlpJqgc';

console.log('Initializing Supabase connection...');
// Log the full URL but mask the middle part for security
const maskedUrl = supabaseUrl ? `${supabaseUrl.slice(0, 15)}...${supabaseUrl.slice(-10)}` : 'Not set';
console.log('Supabase URL:', maskedUrl);
console.log('Supabase Key:', supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'Not set');

// Validate URL format
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    console.log('URL validation passed:');
    console.log('- Protocol:', url.protocol);
    console.log('- Host:', url.host);
    console.log('- Pathname:', url.pathname);
  } catch (error) {
    console.error('Invalid Supabase URL format:', error.message);
    throw new Error('Invalid Supabase URL format');
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:',
    !supabaseUrl ? 'SUPABASE_URL is missing' : '',
    !supabaseKey ? 'SUPABASE_KEY is missing' : ''
  );
  throw new Error('Missing Supabase credentials');
}

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: fetch
  }
};

console.log('Creating Supabase client with options:', JSON.stringify(options, null, 2));
const supabase = createClient(supabaseUrl, supabaseKey, options);
console.log('Supabase client created successfully');

// Test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('device_settings').select('count');
    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    console.log('Supabase connection test successful:', data);
  } catch (error) {
    console.error('Supabase connection test failed:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
  }
}

testConnection();

module.exports = {
  supabase,
  // Helper functions for common database operations
  async query(table, query = {}) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(query.select || '*')
        .match(query.match || {});

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async insert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  },

  async update(table, match, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .match(match)
        .select();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  },

  async delete(table, match) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .delete()
        .match(match)
        .select();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Database delete error:', error);
      throw error;
    }
  }
}; 