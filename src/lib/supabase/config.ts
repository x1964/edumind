export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("your-anon-key")
  );
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured.");
    this.name = "SupabaseNotConfiguredError";
  }
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
}
