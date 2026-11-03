"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  assertSupabaseConfigured();
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
