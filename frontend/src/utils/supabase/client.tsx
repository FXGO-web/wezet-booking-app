import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, publicAnonKey } from './info';
import { Database } from '../../types/database.types';

// Create a singleton Supabase client for the browser
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !publicAnonKey) {
      console.error("Supabase credentials missing! Check .env.local");
    }
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, publicAnonKey);
  }
  return supabaseInstance;
}

export const supabase = createClient();
