// frontend/src/utils/supabase/client.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../types/database.types";

// Leer credenciales desde Vite (browser)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Instancia singleton
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    }

    supabaseInstance = createSupabaseClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return supabaseInstance;
}

export const supabase = createClient();

// EXPONER SUPABASE EN EL WINDOW SOLO EN BROWSER
if (typeof window !== "undefined") {
  // @ts-ignore
  window.supabase = supabase;
}

export default supabase;