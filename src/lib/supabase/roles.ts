import "server-only";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Role checks live in the database; the client can never grant itself a role. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_role", { p_role: "admin" });
  return !error && data === true;
}

export async function isCurrentUserTeacher(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_role", { p_role: "teacher" });
  return !error && data === true;
}
