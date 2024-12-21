import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Log the API configuration
console.log('API Configuration:', {
  supabaseUrl,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

// Export additional configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Log the complete configuration
console.log('Complete API Configuration:', {
  supabaseUrl,
  config: API_CONFIG,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
}); 