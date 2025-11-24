export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const projectId = supabaseUrl.split('.')[0].split('//')[1] || "";
export const edgeFunctionName = "make-server-e0d9c111";