import { createClient } from "@supabase/supabase-js";

// Public Client
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin Client
const supabaseServiceKey =
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
