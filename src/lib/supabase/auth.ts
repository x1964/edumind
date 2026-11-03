import { cache } from "react";
import { connection } from "next/server";
import { createSupabaseServerClient } from "./server";
import { isSupabaseConfigured } from "./config";

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  learningLanguage: "ar" | "en";
}

/**
 * Verified current user (getUser validates the JWT with Supabase Auth).
 * Never use getSession alone for authorization.
 */
export const getCurrentUser = cache(async () => {
  // Reading the session is request-time work: Supabase auth clocks the JWT
  // (`Date.now()`), which must never happen while a route is being
  // prerendered. `connection()` stops prerendering here and resumes on the
  // real request. It resolves immediately in route handlers and server
  // actions, so it is safe to call from any server context.
  await connection();

  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

export interface OnboardingAnswers {
  education_level?: string | null;
  learning_interests?: string[] | null;
  learning_goals?: string[] | null;
  [key: string]: unknown;
}

/**
 * True when the answers needed for a personalized experience are present.
 * Used to derive completion for accounts whose stored flag is stale.
 */
export function hasCompleteAnswers(profile: OnboardingAnswers) {
  return Boolean(
    profile.education_level &&
    Array.isArray(profile.learning_interests) &&
    profile.learning_interests.length > 0 &&
    Array.isArray(profile.learning_goals) &&
    profile.learning_goals.length > 0
  );
}

export const getCurrentProfile = cache(async (): Promise<SessionProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const rich = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, onboarding_completed, learning_language, education_level, learning_interests, learning_goals"
    )
    .eq("id", user.id)
    .maybeSingle();

  // Projects created before the onboarding repair migration may miss some
  // answer columns. Never let that break the dashboard: fall back to the
  // columns guaranteed by the base schema.
  const row:
    | (OnboardingAnswers & {
        full_name?: string | null;
        avatar_url?: string | null;
        onboarding_completed?: boolean | null;
        learning_language?: string | null;
      })
    | null = rich.error
    ? (
        await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, onboarding_completed, learning_language")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : rich.data;

  const storedFlag = Boolean(row?.onboarding_completed);
  const derivedFlag = row ? hasCompleteAnswers(row) : false;

  // Self-heal a stale flag so the dashboard never sends a completed student
  // back to onboarding. Best effort: a failed write must not break rendering.
  if (derivedFlag && !storedFlag) {
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: row?.full_name || user.email?.split("@")[0] || "",
    avatarUrl: row?.avatar_url ?? null,
    onboardingCompleted: storedFlag || derivedFlag,
    learningLanguage: row?.learning_language === "en" ? "en" : "ar",
  };
});
