import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
});

// Export additional configuration
export const API_CONFIG = {
  schemas: {
    public: 'public',
    graphql_public: 'graphql_public'
  },
  extraSearchPath: 'public, extensions'
};

// Log the API configuration
console.log('API Configuration:', {
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

// Log the complete configuration
console.log('Complete API Configuration:', {
  supabaseUrl,
  config: API_CONFIG,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
}); 