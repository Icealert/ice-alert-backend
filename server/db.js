const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Initializing Supabase connection...');
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:',
    !supabaseUrl ? 'SUPABASE_URL is missing' : '',
    !supabaseKey ? 'SUPABASE_ANON_KEY is missing' : ''
  );
  throw new Error('Missing Supabase credentials');
}

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

const supabase = createClient(supabaseUrl, supabaseKey, options);
console.log('Supabase client created successfully');

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('devices').select('count');
    if (error) throw error;
    console.log('Supabase connection test successful');
  } catch (error) {
    console.error('Supabase connection test failed:', error);
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