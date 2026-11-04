import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseAdminConfigured(): boolean {
  return SUPABASE_URL.startsWith("https://") && serviceRoleKey.length > 20;
}

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase service-role key is not configured.");
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
