import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a singleton Supabase client for the browser
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    supabaseInstance = createSupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabaseInstance;
}

export const supabase = createClient();
