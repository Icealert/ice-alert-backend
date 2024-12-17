import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxdjtvevvszefsvgjwye.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

console.log('Initializing Supabase client with:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test the connection
supabase.from('devices').select('count', { count: 'exact' })
  .then(({ count, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection successful. Device count:', count);
    }
  })
  .catch(error => {
    console.error('Supabase connection test error:', error);
  });

export default supabase; 