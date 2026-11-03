"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasCompleteAnswers } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getSiteUrl } from "@/lib/site-url";
import { LANG_COOKIE } from "@/lib/i18n";
import { isAnalyticsEventName, type AnalyticsEventName } from "@/lib/analytics";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  safeRedirectPath,
  signupSchema,
} from "@/lib/validation";

async function trackServerEvent(name: AnalyticsEventName): Promise<void> {
  if (!isAnalyticsEventName(name)) return;
  try {
    const { track } = await import("@vercel/analytics/server");
    await track(name);
  } catch {
    // Analytics must never break authentication flows.
  }
}

export type AuthFormState = {
  error?: string;
  success?: string;
  email?: string;
} | null;

function firstIssue(error: { issues?: Array<{ message: string }> }): string | null {
  return error.issues?.[0]?.message ?? null;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { error: dict.auth.configBody };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) return { error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: dict.auth.emailNotConfirmed };
    }
    if (error.status === 429) return { error: dict.errors.rateLimited };
    return { error: dict.auth.invalidCredentials };
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await trackServerEvent("login_completed");
    const rich = await supabase
      .from("profiles")
      .select(
        "onboarding_completed, learning_language, education_level, learning_interests, learning_goals"
      )
      .eq("id", data.user.id)
      .maybeSingle();

    const profile = rich.error
      ? (
          await supabase
            .from("profiles")
            .select("onboarding_completed, learning_language")
            .eq("id", data.user.id)
            .maybeSingle()
        ).data
      : rich.data;

    if (profile?.learning_language) {
      const store = await cookies();
      store.set(LANG_COOKIE, profile.learning_language, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    const completed =
      Boolean(profile?.onboarding_completed) || (profile ? hasCompleteAnswers(profile) : false);

    const next = safeRedirectPath(parsed.data.next, "");
    if (next) redirect(next);
    redirect(completed ? "/dashboard" : "/onboarding");
  }

  redirect(safeRedirectPath(parsed.data.next, "/dashboard"));
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { error: dict.auth.configBody };

  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    const issue = firstIssue(parsed.error);
    if (issue === "passwords_do_not_match") return { error: dict.errors.invalidInput };
    if (issue === "terms_required") return { error: dict.auth.termsRequired };
    return { error: dict.errors.invalidInput };
  }

  const siteUrl = await getSiteUrl();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    if (error.status === 429) return { error: dict.errors.rateLimited };
    return { error: dict.auth.genericError };
  }

  // The account was created successfully — emit a privacy-safe completion event.
  await trackServerEvent("signup_completed");

  if (data.session) redirect("/onboarding");

  return { success: dict.auth.checkEmail, email: parsed.data.email };
}

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { error: dict.auth.configBody };

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: dict.errors.invalidInput };

  const siteUrl = await getSiteUrl();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error?.status === 429) return { error: dict.errors.rateLimited };

  // Always return the same response to avoid account enumeration.
  return { success: dict.auth.resetSent };
}

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { error: dict.auth.configBody };

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: dict.auth.resetSessionMissing };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: dict.errors.invalidInput };

  return { success: dict.auth.passwordUpdated };
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
