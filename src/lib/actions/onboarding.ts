"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { LANG_COOKIE } from "@/lib/i18n";
import { onboardingSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

export async function saveOnboardingAction(input: {
  fullName: string;
  username: string;
  phone: string;
  educationLevel: string;
  interests: string[];
  goals: string[];
  learningLanguage: string;
  completed: boolean;
}): Promise<ActionResult> {
  const { dict } = await getAppMessages();

  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = onboardingSchema.safeParse({
    fullName: input.fullName,
    username: input.username,
    phone: input.phone,
    educationLevel: input.educationLevel,
    interests: input.interests,
    goals: input.goals,
    learningLanguage: input.learningLanguage,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === "invalid_username") {
      return { ok: false, error: dict.onboarding.invalidUsername };
    }
    if (issue === "invalid_phone") {
      return { ok: false, error: dict.onboarding.invalidPhone };
    }
    return { ok: false, error: dict.errors.invalidInput };
  }

  const supabase = await createSupabaseServerClient();

  // Profile details (name, username, phone) are written first so a taken
  // username surfaces as a clear error before onboarding is completed.
  const { error: detailsError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: parsed.data.fullName,
      username: parsed.data.username,
      phone: parsed.data.phone,
    },
    { onConflict: "id" }
  );

  if (detailsError) {
    if (detailsError.code === "23505") {
      return { ok: false, error: dict.onboarding.usernameTaken };
    }
    if (detailsError.code === "23514") {
      return { ok: false, error: dict.onboarding.invalidUsername };
    }
    return { ok: false, error: dict.onboarding.saveFailed };
  }

  const { error } = await supabase.rpc("complete_onboarding", {
    p_education_level: parsed.data.educationLevel,
    p_learning_interests: parsed.data.interests,
    p_learning_goals: parsed.data.goals,
    p_learning_language: parsed.data.learningLanguage,
    p_completed: input.completed,
  });

  if (error) {
    // Fallback for projects where the complete_onboarding RPC has not been
    // applied yet. RLS still scopes the write to the signed-in user.
    const { error: writeError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: parsed.data.fullName,
        username: parsed.data.username,
        phone: parsed.data.phone,
        education_level: parsed.data.educationLevel,
        learning_interests: parsed.data.interests,
        learning_goals: parsed.data.goals,
        learning_language: parsed.data.learningLanguage,
        onboarding_completed: input.completed,
      },
      { onConflict: "id" }
    );

    if (writeError) {
      if (writeError.code === "23505") {
        return { ok: false, error: dict.onboarding.usernameTaken };
      }
      return { ok: false, error: dict.onboarding.saveFailed };
    }
  }

  const store = await cookies();
  store.set(LANG_COOKIE, parsed.data.learningLanguage, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Invalidate every cached view of the profile so the dashboard does not
  // send the student back to onboarding after completion.
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/", "layout");

  return {
    ok: true,
    message: dict.common.saved,
    redirectTo: input.completed ? "/dashboard" : undefined,
  };
}
