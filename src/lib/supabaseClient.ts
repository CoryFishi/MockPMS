import { createClient } from "@supabase/supabase-js";

// Admin pages use this same client; admin access is enforced by RLS
// (see supabase/migrations/*_admin_rls.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

