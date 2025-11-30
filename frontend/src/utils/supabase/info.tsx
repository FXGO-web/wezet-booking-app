export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const projectId = supabaseUrl.split('.')[0].split('//')[1] || "";