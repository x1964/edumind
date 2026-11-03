"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getSiteUrl } from "@/lib/site-url";
import { LANG_COOKIE } from "@/lib/i18n";
import { profileSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

const avatarSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https:\/\/[^\s]+$/.test(value), "invalid_avatar_url");

export async function updateProfileAction(input: {
  fullName: string;
  avatarUrl: string;
  educationLevel: string | null;
  interests: string[];
  goals: string[];
  learningLanguage: string;
  theme: string;
  emailNotifications: boolean;
  studyReminders: boolean;
}): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = profileSchema.safeParse({
    fullName: input.fullName,
    educationLevel: input.educationLevel,
    interests: input.interests,
    goals: input.goals,
    learningLanguage: input.learningLanguage,
    theme: input.theme,
    notifications: {
      email: input.emailNotifications,
      study_reminders: input.studyReminders,
    },
  });
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const avatar = avatarSchema.safeParse(input.avatarUrl ?? "");
  if (!avatar.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      avatar_url: avatar.data || null,
      education_level: parsed.data.educationLevel,
      learning_interests: parsed.data.interests,
      learning_goals: parsed.data.goals,
      learning_language: parsed.data.learningLanguage,
      theme: parsed.data.theme,
      notifications: parsed.data.notifications,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: dict.settings.failed };

  const store = await cookies();
  store.set(LANG_COOKIE, parsed.data.learningLanguage, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: dict.settings.saved };
}

export async function requestPasswordChangeAction(): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user || !user.email) return { ok: false, error: dict.errors.unauthorized };

  const siteUrl = await getSiteUrl();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error?.status === 429) return { ok: false, error: dict.errors.rateLimited };
  if (error) return { ok: false, error: dict.errors.generic };

  return { ok: true, message: dict.settings.passwordUpdated };
}
