// frontend/src/utils/supabase/client.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../types/database.types";
import { supabaseUrl, publicAnonKey } from "./info";

// Aseguramos que exista fetch para Vercel Edge + Browser
const customFetch = (...args: any[]) => fetch(...args);

let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !publicAnonKey) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        fetch: customFetch,
        headers: {
          "x-client-info": "wezet-frontend",
        },
      },
    });
  }

  return supabaseInstance;
}

export const supabase = createClient();