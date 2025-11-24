import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, publicAnonKey } from './info';

// Create a singleton Supabase client for the browser
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !publicAnonKey) {
      console.error("Supabase credentials missing! Check .env.local");
    }
    supabaseInstance = createSupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabaseInstance;
}

export const supabase = createClient();
