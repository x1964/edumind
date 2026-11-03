import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/lib/validation";

/**
 * Handles OAuth, email confirmation and password-recovery callbacks.
 * Only same-origin paths are accepted as redirect destinations.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  const next = safeRedirectPath(nextParam, type === "recovery" ? "/reset-password" : "/dashboard");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=config", origin));
  }

  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  if (tokenHash && type) {
    const allowed = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
    if (allowed.includes(type as (typeof allowed)[number])) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as (typeof allowed)[number],
      });
      if (!error) return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
