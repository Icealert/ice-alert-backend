const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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