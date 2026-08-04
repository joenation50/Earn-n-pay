import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const AUTH_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

if (!AUTH_CONFIGURED) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Check Netlify env vars. Auth will not work until these are configured.');
}

// create supabase client with standard settings
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Lightweight debug log: prints the Supabase URL that was embedded at build time and whether auth is configured.
// WARNING: we do NOT print the anon key to avoid leaking secrets in logs.
console.info(`[supabase] configured=${AUTH_CONFIGURED} url=${supabaseUrl ? supabaseUrl : '<not set>'}`);

export default supabase;
